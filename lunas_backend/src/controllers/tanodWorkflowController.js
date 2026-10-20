const { buildReadableIncidentScope, ACTIVE_INSPECTIONS } = require('../services/fieldIncidentAccess');
const Incident = require('../models/Incident');
const Inspection = require('../models/Inspection');
const WorkOrder = require('../models/WorkOrder');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { inspectionMutation } = require('../services/inspectionMutation');
const { createAuditLog } = require('../utils/auditLogger');
const { createNotification } = require('../services/notificationService');
const { getUploadedEvidenceFiles, processAndUploadEvidence } = require('../services/evidenceService');
const { buildIncidentScope, getIncidentBarangay, normalizeText } = require('../services/jurisdictionService');
const { validSlaDate } = require('../services/workOrderService');
const { INCIDENT_CATEGORY_CODES } = require('../utils/incidentCategories');
const logger = require('../utils/logger');
const storageService = require('../services/storageService');

const { evaluateRouting } = require('../services/agencyRoutingService');
const actorId = (user) => user?._id || user?.id;
const initialStage = incident => !incident.workOrder && !incident.completionInspection
  && (!incident.agencyStatus || incident.agencyStatus === 'not_routed');

const protectedInspectionImage = async (image) => {
  if (!image) return null;
  const source = image.toObject ? image.toObject() : image;
  let url = source.url || null;
  if (source.key) {
    try { url = await storageService.getEvidenceUrl(source.key, source.url); } catch (_) { url = null; }
  }
  return { url, uploadedAt: source.uploadedAt, isPrivacyMasked: Boolean(source.isPrivacyMasked), mimeType: source.mimeType, width: source.width, height: source.height };
};

const appendHistory = (incident, status, user, notes, metadata = {}) => {
  incident.status = status;
  incident.statusHistory.push({ status, changedBy: actorId(user), actorRole: user.role, changedAt: new Date(), notes, metadata });
};

const sameBarangay = (incident, user) => normalizeText(getIncidentBarangay(incident)).toLowerCase()
  === normalizeText(user.barangay).toLowerCase();

const loadIncident = async (req, roles = []) => {
  if (!roles.includes(req.user.role)) return null;
  const scope = buildIncidentScope(req.user);
  return Incident.findOne({ _id: req.params.id, ...scope });
};

const notify = async (recipient, incident, title, message, type) => {
  if (!recipient) return;
  try {
    await createNotification({ recipient, type, title, message, idempotencyKey: `inspection:${incident._id}:${type}:${recipient}:${incident.statusHistory?.length || 0}`, data: { incidentId: incident._id, reportNumber: incident.reportNumber } });
  } catch (_) { logger.error('Inspection notification requires reconciliation', { incidentId: incident._id, type }); }
};

exports.listTanodPersonnel = asyncHandler(async (req, res) => {
  if (req.user.role !== 'barangay_official') return res.status(403).json({ success: false, message: 'Only Barangay Secretaries may select Barangay Tanod' });
  const users = await User.find({ role: 'barangay_tanod', barangay: req.user.barangay, isActive: true, isArchived: { $ne: true }, requiresActivation: { $ne: true }, accountStatus: { $nin: ['pending_activation', 'suspended', 'deactivated'] } })
    .select('firstName middleName suffix lastName email phone barangay role availability accountStatus');
  res.json({ success: true, data: users.map((user) => ({ id: user._id, firstName: user.firstName, middleName: user.middleName, suffix: user.suffix, lastName: user.lastName, email: user.email, phone: user.phone, barangay: user.barangay, role: 'barangay_tanod', availability: user.availability })) });
});

exports.listAgencyExceptions = asyncHandler(async (req, res) => {
  if (req.user.role !== 'barangay_official') return res.status(403).json({ success: false, message: 'Only Barangay Secretaries may view routing exceptions' });
  const incidents = await Incident.find({ $and: [buildIncidentScope(req.user), { $or: [{ status: 'tanod_verified', agencyStatus: 'not_routed', 'routing.responsibleOrganization': { $exists: false } }, { status: 'provider_assigned', 'routingReview.reason': 'agency_responsibility_dispute' }] }] })
    .populate('initialInspection', 'status result reviewedAt reviewedBy').sort({ updatedAt: -1 }).limit(100);
  // Explicit projection: no raw evidence keys, reporter/staff profiles or account directory.
  const data = incidents.filter(item => item.initialInspection?.status === 'approved').map(item => ({
    id: item._id, reportNumber: item.reportNumber, category: item.category, barangay: getIncidentBarangay(item),
    description: item.description, location: item.location, responsibleOrganization: item.routing?.responsibleOrganization, approvedAt: item.initialInspection.reviewedAt,
    reason: item.routingReview?.reason || 'legacy_configuration_review_required', candidates: item.routingReview?.candidates || [],
    history: (item.routing?.history || []).map(entry => ({ fromOrganization: entry.fromOrganization, toOrganization: entry.toOrganization, reason: entry.reason, routedAt: entry.routedAt })),
    decisionAuthority: 'policy_pending'
  }));
  res.json({ success: true, data: { incidents: data } });
});

exports.assignInitialInspection = inspectionMutation(async (req, res) => {
  const incident = await loadIncident(req, ['barangay_official']);
  if (!incident || !sameBarangay(incident, req.user)) return res.status(404).json({ success: false, message: 'Report not found in your barangay' });
  if (!initialStage(incident) || !['submitted', 'clarification_required', 'tanod_rejected'].includes(incident.status)) return res.status(409).json({ success: false, message: 'This report is not waiting for Tanod inspection' });
  if (incident.initialInspection && incident.status !== 'tanod_rejected') return res.status(409).json({ success: false, message: 'Use the current task or explicit reassignment' });
  const tanod = await User.findOne({ _id: req.body.tanodId, role: 'barangay_tanod', barangay: req.user.barangay, isActive: true, isArchived: { $ne: true }, requiresActivation: { $ne: true }, accountStatus: { $nin: ['pending_activation', 'suspended', 'deactivated'] } });
  if (!tanod) return res.status(400).json({ success: false, message: 'Select an active Barangay Tanod account from your barangay' });
  const inspection = await Inspection.create({ incident: incident._id, type: 'initial', barangay: req.user.barangay, secretary: req.user._id, tanod: tanod._id, instructions: req.body.instructions || '', status: 'assigned' });
  incident.initialInspection = inspection._id;
  appendHistory(incident, 'tanod_assigned', req.user, 'Initial Tanod inspection assigned', { inspectionId: inspection._id });
  await incident.save();
  await notify(tanod._id, incident, 'New report inspection', `Report ${incident.reportNumber} needs barangay verification.`, 'inspection_assigned');
  await createAuditLog({ action: 'tanod_inspection_assigned', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { inspectionId: inspection._id, tanodId: tanod._id, type: 'initial' } });
  res.status(201).json({ success: true, data: inspection });
});

// Historical own findings remain readable, but never grant live incident access.
const assignedInspection = async req => {
  if (req.user.role !== 'barangay_tanod') return null;
  const inspection = await Inspection.findOne({ _id: req.params.inspectionId,
    incident: req.params.id, tanod: req.user._id, barangay: req.user.barangay,
    status: { $in: ACTIVE_INSPECTIONS } });
  if (!inspection) return null;
  if (!['initial', 'completion'].includes(inspection.type)) return null;
  const pointer = inspection.type === 'initial' ? 'initialInspection' : 'completionInspection';
  const incident = await Incident.findOne({ _id: req.params.id, [pointer]: inspection._id,
    $and: [await buildReadableIncidentScope(req.user)] });
  const expectedStatus = { assigned: 'tanod_assigned', in_progress: 'tanod_in_progress', submitted: 'tanod_verified' }[inspection.status];
  if (incident && incident.status !== expectedStatus && !(inspection.type === 'initial' && inspection.status === 'assigned' && incident.status === 'clarification_required')) return null;
  if (incident && inspection.type === 'initial' && !initialStage(incident)) return null;
  if (incident && inspection.type === 'completion') {
    const order = incident.workOrder && await WorkOrder.findOne({ _id: incident.workOrder, incident: incident._id, responsibleOrganization: incident.routing?.responsibleOrganization, status: { $in: ['completed', 'provider_accepted'] } });
    if (!order) return null;
  }
  return incident && ['tanod_assigned', 'tanod_in_progress', 'tanod_verified', 'clarification_required'].includes(incident.status)
    && (inspection.type !== 'completion' || incident.agencyStatus === 'work_completed')
    ? { inspection, incident } : null;
};

exports.listMyInspections = asyncHandler(async (req, res) => {
  if (req.user.role !== 'barangay_tanod') return res.status(403).json({ success: false, message: 'Only Barangay Tanods may view inspections' });
  const inspections = await Inspection.find({ tanod: req.user._id, barangay: req.user.barangay }).sort({ createdAt: -1 });
  const scope = await buildReadableIncidentScope(req.user);
  const incidents = await Incident.find(scope).select('reportNumber category description location status images initialInspection completionInspection');
  const data = await Promise.all(inspections.map(async inspection => {
    const item = inspection.toObject();
    const incident = incidents.find(i => String(i._id) === String(item.incident)
      && String(item.type === 'initial' ? i.initialInspection : i.completionInspection) === String(item._id));
    item.incident = incident ? { _id: incident._id, reportNumber: incident.reportNumber,
      category: incident.category, description: incident.description, location: incident.location,
      status: incident.status, images: (await Promise.all((incident.images || []).map(protectedInspectionImage))).filter(i => i?.url) } : null;
    item.evidence = (await Promise.all((item.evidence || []).map(protectedInspectionImage))).filter(i => i?.url);
    if (!incident && ACTIVE_INSPECTIONS.includes(item.status)) item.status = 'historical';
    return item;
  }));
  res.json({ success: true, data });
});

exports.startInspection = inspectionMutation(async (req, res) => {
  const assignment = await assignedInspection(req);
  const inspection = assignment?.inspection;
  if (inspection && inspection.status !== 'assigned') return res.status(404).json({ success: false, message: 'Inspection not found' });
  if (!inspection) return res.status(404).json({ success: false, message: 'Inspection not found or already started' });
  if (!inspection.acknowledgedAt) { inspection.acknowledgedAt = new Date(); inspection.acknowledgedBy = req.user._id; }
  if (req.body.expectedVersion !== undefined && Number(req.body.expectedVersion) !== inspection.version) return res.status(409).json({ success: false, message: 'Inspection changed; refresh before starting' });
  inspection.status = 'in_progress';
  inspection.startedAt = new Date();
  await inspection.save();
  const incident = assignment.incident;
  if (incident && ['tanod_assigned', 'clarification_required'].includes(incident.status)) { appendHistory(incident, 'tanod_in_progress', req.user, 'Tanod started inspection', { inspectionId: inspection._id }); await incident.save(); }
  await notify(inspection.secretary, incident, 'Inspection started', `Report ${incident.reportNumber}: the assigned Tanod started verification.`, 'verification_update');
  res.json({ success: true, data: inspection });
});

exports.submitInspection = inspectionMutation(async (req, res) => {
  const assignment = await assignedInspection(req);
  const inspection = assignment?.inspection;
  if (inspection && !['assigned', 'in_progress'].includes(inspection.status)) return res.status(404).json({ success: false, message: 'Inspection not found' });
  if (!inspection) return res.status(404).json({ success: false, message: 'Inspection not found or already submitted' });
  if (!['verified', 'not_verified', 'unable_to_verify'].includes(req.body.result)) return res.status(400).json({ success: false, message: 'An explicit inspection result is required' });
  if (!String(req.body.findings || '').trim()) return res.status(400).json({ success: false, message: 'Findings are required' });
  if (req.body.expectedVersion !== undefined && Number(req.body.expectedVersion) !== inspection.version) return res.status(409).json({ success: false, message: 'Inspection changed; refresh before submitting' });
  const files = getUploadedEvidenceFiles(req);
  let evidence = [];
  if (files.length) {
    const processed = await processAndUploadEvidence(files, { reporterId: req.user._id.toString(), category: assignment.incident.category, privacyAcknowledged: true });
    // processAndUploadEvidence returns one result per file with its evidence
    // inside `images`. Keep the actual stored evidence objects instead of
    // reading a non-existent top-level `evidence` property (which persisted
    // null entries and left the Secretary without photos).
    evidence = processed.images || [];
  }
  inspection.acknowledgedAt ||= new Date(); inspection.acknowledgedBy ||= req.user._id;
  inspection.status = 'submitted';
  inspection.findings = String(req.body.findings).trim();
  inspection.result = req.body.result;
  inspection.evidence = [...(inspection.evidence || []), ...evidence];
  inspection.submittedAt = new Date();
  await inspection.save();
  const incident = assignment.incident;
  if (incident?.verificationClarification?.recipient === 'tanod' && inspection.parentInspection && String(inspection.parentInspection) === String(incident.verificationClarification.inspection)) incident.verificationClarification.respondedAt = new Date();
  if (incident) { appendHistory(incident, 'tanod_verified', req.user, 'Tanod submitted inspection findings', { inspectionId: inspection._id, result: inspection.result }); await incident.save(); await notify(inspection.secretary, incident, 'Tanod verification submitted', `Report ${incident.reportNumber} is ready for your review.`, 'inspection_submitted'); }
  res.json({ success: true, data: inspection });
});

exports.reviewInspection = inspectionMutation(async (req, res) => {
  const inspection = await Inspection.findOne({ _id: req.params.inspectionId, incident: req.params.id, type: 'initial', barangay: req.user.barangay, secretary: req.user._id });
  if (inspection && (inspection.type !== 'initial' || String(inspection.incident) !== String(req.params.id))) return res.status(409).json({ success: false, message: 'Initial inspection required for this report' });
  if (!inspection || inspection.secretary.toString() !== req.user._id.toString() || req.user.role !== 'barangay_official') return res.status(404).json({ success: false, message: 'Inspection not found' });
  if (inspection.status !== 'submitted') return res.status(409).json({ success: false, message: 'Inspection is not waiting for review' });
  if (!['approve', 'reject', 'clarification'].includes(req.body.decision)) return res.status(400).json({ success: false, message: 'Invalid review decision' });
  if (!Number.isInteger(req.body.expectedVersion) || req.body.expectedVersion !== inspection.version) return res.status(409).json({ success: false, message: 'Inspection changed; refresh before reviewing' });
  if (req.body.decision !== 'approve' && !String(req.body.notes || '').trim()) return res.status(400).json({ success: false, message: 'A decision reason is required' });
  if (req.body.decision === 'clarification' && !['tanod', 'citizen'].includes(req.body.recipient)) return res.status(400).json({ success: false, message: 'Select the clarification recipient' });
  const approve = req.body.decision === 'approve';
  if (approve && req.body.categoryConfirmed !== true) return res.status(400).json({ success: false, message: 'Confirm the current category before approval' });
  if (approve && inspection.result !== 'verified') return res.status(409).json({ success: false, message: 'Only verified initial findings can be approved' });
  const incident = await Incident.findOne({ _id: inspection.incident, ...buildIncidentScope(req.user) });
  if (!incident) return res.status(404).json({ success: false, message: 'Report not found in your barangay' });
  if (!initialStage(incident) || String(incident.initialInspection) !== String(inspection._id) || incident.status !== 'tanod_verified') return res.status(409).json({ success: false, message: 'Inspection is no longer the current review task' });
  if (approve && incident.routing?.responsibleOrganization) return res.status(409).json({ success: false, message: 'Existing agency assignment requires authorized reconciliation; approval cannot transfer ownership' });
  if (approve && incident.verificationClarification?.requestedAt && !incident.verificationClarification.respondedAt) return res.status(409).json({ success: false, message: 'Resolve the pending clarification before approval' });
  if (approve && !INCIDENT_CATEGORY_CODES.includes(incident.category)) return res.status(409).json({ success: false, message: 'Correct the unsupported category before approval' });
  if (req.body.decision === 'clarification' && req.body.recipient === 'tanod') {
    const eligible = await User.findOne({ _id: inspection.tanod, role: 'barangay_tanod', barangay: req.user.barangay, isActive: true, isArchived: { $ne: true }, requiresActivation: { $ne: true }, accountStatus: { $nin: ['pending_activation', 'suspended', 'deactivated'] } });
    if (!eligible) return res.status(409).json({ success: false, message: 'The assigned Tanod is unavailable; reassign before requesting a follow-up' });
  }
  const routingDecision = approve ? await evaluateRouting(incident) : null;
  const approvedAgency = routingDecision?.outcome === 'matched' ? routingDecision.rule.organization : null;
  const routingProviders = routingDecision?.providers || [];
  inspection.status = approve ? 'approved' : (req.body.decision === 'clarification' ? 'clarification_required' : 'rejected');
  inspection.reviewedAt = new Date(); inspection.reviewedBy = req.user._id; inspection.reviewNotes = req.body.notes || '';
  await inspection.save();
  if (approve) {
    incident.categoryConfirmedBy = req.user._id; incident.categoryConfirmedAt = new Date();
    const agency = approvedAgency;
    incident.routingReview = { outcome: routingDecision.outcome, reason: routingDecision.reason, candidates: routingDecision.candidates, evaluatedAt: new Date() };
    const provenance = agency ? { agencyId: routingDecision.rule.agencyId, ruleId: routingDecision.rule.ruleId, policyVersion: routingDecision.rule.version } : {};
    incident.agencyStatus = 'not_routed'; // Routing does not authorize maintenance or external processing.
    incident.routing = agency ? { ...provenance, responsibleOrganization: agency, responsibleRole: 'utility_provider', reason: 'Approved ownership and jurisdiction configuration after Secretary approval', routedBy: req.user._id, routedAt: new Date(), history: [...(incident.routing?.history || []), { ...provenance, toRole: 'utility_provider', toOrganization: agency, reason: 'Secretary approved initial findings', routedBy: req.user._id, routedAt: new Date() }] } : { history: [...(incident.routing?.history || []), { fromOrganization: incident.routing?.responsibleOrganization, reason: 'Approved findings await authorized routing review', routedBy: req.user._id, routedAt: new Date() }] };
    appendHistory(incident, agency ? 'provider_assigned' : 'tanod_verified', req.user, agency ? 'Secretary approved verification; report automatically routed to agency' : 'Secretary approved verification; agency mapping required', { agency, automaticRouting: Boolean(agency) });
  } else {
    appendHistory(incident, approve ? 'tanod_verified' : (req.body.decision === 'clarification' ? 'clarification_required' : 'tanod_rejected'), req.user, req.body.notes || 'Secretary did not approve Tanod verification', { inspectionId: inspection._id });
  }
  if (req.body.decision === 'clarification') {
    incident.verificationClarification = { inspection: inspection._id, recipient: req.body.recipient, reason: req.body.notes.trim(), requestedBy: req.user._id, requestedAt: new Date() };
    if (req.body.recipient === 'tanod') {
      const followup = await Inspection.create({ incident: incident._id, type: 'initial', barangay: inspection.barangay, secretary: inspection.secretary, tanod: inspection.tanod, parentInspection: inspection._id, instructions: req.body.notes.trim(), status: 'assigned' });
      incident.initialInspection = followup._id;

    }
  }
  await incident.save();
  if (approve && !approvedAgency) await notify(inspection.secretary, incident, 'Routing review required', `Report ${incident.reportNumber} was approved and awaits authorized agency assignment.`, 'verification_update');
  if (req.body.decision === 'clarification' && req.body.recipient === 'tanod') await notify(inspection.tanod, incident, 'Clarification requested', `Report ${incident.reportNumber} has a follow-up inspection task.`, 'inspection_assigned');
  if (approve && incident.routing?.responsibleOrganization) {
    await Promise.all(routingProviders.map((provider) => notify(provider._id, incident, 'New agency report', `Report ${incident.reportNumber} was routed to your agency.`, 'agency_report_routed')));
  }
  await notify(incident.reporter, incident, 'Verification update', approve ? (incident.routing?.responsibleOrganization ? `Report ${incident.reportNumber} was verified and routed.` : `Report ${incident.reportNumber} was approved and awaits routing review.`) : req.body.decision === 'reject' ? `Report ${incident.reportNumber} verification was rejected.` : `Report ${incident.reportNumber} needs clarification.`, 'verification_update');
  await createAuditLog({ action: approve ? 'tanod_verification_approved' : 'tanod_verification_rejected', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { inspectionId: inspection._id, decision: req.body.decision, agency: incident.routing?.responsibleOrganization } });
  res.json({ success: true, data: { inspection, incident } });
});

exports.acknowledgeInspection = inspectionMutation(async (req, res) => {
  const assignment = await assignedInspection(req);
  if (!assignment || assignment.inspection.status !== 'assigned') return res.status(404).json({ success: false, message: 'Current assigned inspection not found' });
  const { inspection, incident } = assignment;
  if (inspection.acknowledgedAt || inspection.version !== req.body.expectedVersion) return res.status(409).json({ success: false, message: 'Assignment already acknowledged or changed' });
  inspection.acknowledgedAt = new Date(); inspection.acknowledgedBy = req.user._id;
  await inspection.save();
  appendHistory(incident, incident.status, req.user, 'Tanod acknowledged assignment', { inspectionId: inspection._id });
  await incident.save();
  await notify(inspection.secretary, incident, 'Assignment acknowledged', `Report ${incident.reportNumber}: the assigned Tanod acknowledged receipt.`, 'verification_update');
  res.json({ success: true, data: inspection });
});

const currentInitial = async (req, statuses) => {
  const incident = await loadIncident(req, ['barangay_official']);
  if (!incident || !initialStage(incident) || String(incident.initialInspection) !== String(req.params.inspectionId)) return null;
  const inspection = await Inspection.findOne({ _id: req.params.inspectionId, incident: incident._id, type: 'initial', secretary: req.user._id, barangay: req.user.barangay, status: { $in: statuses } });
  return inspection ? { incident, inspection } : null;
};

exports.reassignInspection = inspectionMutation(async (req, res) => {
  const current = await currentInitial(req, ['assigned', 'in_progress', 'submitted']);
  if (!current || !['tanod_assigned', 'tanod_in_progress', 'tanod_verified', 'clarification_required'].includes(current.incident.status)) return res.status(409).json({ success: false, message: 'Current initial assignment cannot be replaced' });
  const { inspection, incident } = current;
  if (inspection.version !== req.body.expectedVersion) return res.status(409).json({ success: false, message: 'Assignment changed; refresh before reassigning' });
  const tanod = await User.findOne({ _id: req.body.tanodId, role: 'barangay_tanod', barangay: req.user.barangay, isActive: true, isArchived: { $ne: true }, requiresActivation: { $ne: true }, accountStatus: { $nin: ['pending_activation', 'suspended', 'deactivated'] } });
  if (!tanod || String(tanod._id) === String(inspection.tanod)) return res.status(400).json({ success: false, message: 'Select a different eligible Tanod' });
  const replacement = await Inspection.create({ incident: incident._id, type: 'initial', secretary: req.user._id, tanod: tanod._id, barangay: req.user.barangay, parentInspection: inspection._id, instructions: req.body.reason, status: 'assigned' });
  inspection.status = 'replaced'; inspection.replacedBy = replacement._id; inspection.replacedAt = new Date(); inspection.replacementReason = req.body.reason;
  await inspection.save();
  incident.initialInspection = replacement._id;
  appendHistory(incident, 'tanod_assigned', req.user, 'Tanod assignment replaced', { previousInspection: inspection._id, inspectionId: replacement._id, reason: req.body.reason });
  await incident.save();
  await notify(tanod._id, incident, 'Inspection reassigned', `Report ${incident.reportNumber} is assigned to you.`, 'inspection_assigned');
  await notify(inspection.tanod, incident, 'Assignment replaced', `Your assignment for report ${incident.reportNumber} was replaced.`, 'verification_update');
  res.status(201).json({ success: true, data: replacement });
});

exports.correctCategory = inspectionMutation(async (req, res) => {
  const current = await currentInitial(req, ['submitted']);
  if (!current || current.incident.status !== 'tanod_verified') return res.status(409).json({ success: false, message: 'Current submitted initial findings are required' });
  const { inspection, incident } = current;
  if (inspection.version !== req.body.expectedVersion) return res.status(409).json({ success: false, message: 'Inspection changed; refresh before correcting category' });
  if (!INCIDENT_CATEGORY_CODES.includes(req.body.category) || incident.category === req.body.category) return res.status(400).json({ success: false, message: 'Select a different supported category' });
  incident.originalCategory ||= incident.category;
  incident.originalCategorySource ||= 'legacy_snapshot';
  incident.categoryHistory ||= [];
  incident.categoryHistory.push({ previous: incident.category, category: req.body.category, reason: req.body.reason, changedBy: req.user._id, changedAt: new Date() });
  incident.category = req.body.category;
  // Increment the task version too: a stale approval must not approve a changed category.
  inspection.categoryRevision = (inspection.categoryRevision || 0) + 1; await inspection.save();
  appendHistory(incident, incident.status, req.user, 'Secretary corrected category', { category: incident.category, reason: req.body.reason });
  await incident.save();
  await notify(incident.reporter, incident, 'Category updated', `Report ${incident.reportNumber} category was reviewed by your barangay.`, 'verification_update');
  res.json({ success: true, data: { category: incident.category, inspectionVersion: inspection.version } });
});

exports.respondToClarification = inspectionMutation(async (req, res) => {
  const incident = await Incident.findOne({ _id: req.params.id, reporter: req.user._id });
  if (!incident || req.user.role !== 'citizen') return res.status(404).json({ success: false, message: 'Report not found' });
  const clarification = incident.verificationClarification;
  if (!initialStage(incident) || incident.status !== 'clarification_required' || clarification?.recipient !== 'citizen' || clarification.respondedAt || String(clarification.inspection) !== String(incident.initialInspection)) return res.status(409).json({ success: false, message: 'No current clarification is awaiting your response' });
  const previous = await Inspection.findOne({ _id: incident.initialInspection, incident: incident._id, type: 'initial', status: 'clarification_required' });
  if (!previous || previous.version !== req.body.expectedVersion) return res.status(409).json({ success: false, message: 'Clarification changed; refresh before replying' });
  // The citizen supplies context only. Copy the original Tanod findings, result,
  // evidence and actual submission time; never represent this as new field work.
  const followup = await Inspection.create({ incident: incident._id, type: 'initial', secretary: previous.secretary, tanod: previous.tanod, barangay: previous.barangay, parentInspection: previous._id, status: 'submitted', findings: previous.findings, result: previous.result, evidence: previous.evidence, assignedAt: previous.assignedAt || null, acknowledgedAt: previous.acknowledgedAt, acknowledgedBy: previous.acknowledgedBy, startedAt: previous.startedAt, submittedAt: previous.submittedAt, instructions: 'Review citizen clarification alongside the original Tanod findings' });
  incident.clarificationResponses ||= [];
  incident.clarificationResponses.push({ inspection: previous._id, response: req.body.response, actor: req.user._id, respondedAt: new Date() });
  clarification.respondedAt = new Date(); incident.initialInspection = followup._id;
  appendHistory(incident, 'tanod_verified', req.user, 'Citizen responded to clarification; Secretary review required', { inspectionId: followup._id });
  await incident.save();
  await notify(previous.secretary, incident, 'Clarification response received', `Report ${incident.reportNumber} is ready for your review.`, 'verification_update');
  res.json({ success: true, message: 'Response recorded for Secretary review' });
});

exports.getInspectionHistory = asyncHandler(async (req, res) => {
  const incident = await loadIncident(req, ['barangay_official']);
  if (!incident) return res.status(404).json({ success: false, message: 'Report not found' });
  const records = await Inspection.find({ incident: incident._id, barangay: req.user.barangay, secretary: req.user._id }).sort({ createdAt: 1 });
  const data = await Promise.all(records.map(async record => {
    const item = record.toObject();
    item.evidence = (await Promise.all((item.evidence || []).map(protectedInspectionImage))).filter(image => image?.url);
    return item;
  }));
  res.json({ success: true, data, clarificationResponses: incident.clarificationResponses || [] });
});

exports.updateAgencyPreparation = inspectionMutation(async (req, res) => {
  if (req.user.role !== 'utility_provider' || !req.user.utilityCompany) return res.status(403).json({ success: false, message: 'Only the responsible agency may prepare maintenance' });
  const incident = await Incident.findOne({ _id: req.params.id, 'routing.responsibleOrganization': req.user.utilityCompany });
  if (!incident) return res.status(404).json({ success: false, message: 'Report not found for your agency' });
  const routing = incident.routing;
  if (incident.status !== 'provider_assigned' || incident.workOrder || incident.completionInspection
    || incident.routingReview?.outcome !== 'matched' || !routing?.agencyId || !routing.ruleId
    || !Number.isInteger(routing.policyVersion) || routing.policyVersion < 1 || !routing.routedAt
    || !incident.categoryConfirmedBy || !incident.categoryConfirmedAt
    || (incident.verificationClarification?.requestedAt && !incident.verificationClarification.respondedAt)) return res.status(409).json({ success: false, message: 'Current approved routing without maintenance or unresolved clarification is required' });
  const inspection = incident.initialInspection && await Inspection.findOne({ _id: incident.initialInspection, incident: incident._id,
    type: 'initial', status: 'approved', result: 'verified', barangay: getIncidentBarangay(incident) });
  if (!inspection || !inspection.reviewedAt || !inspection.reviewedBy) return res.status(409).json({ success: false, message: 'Current independent Secretary approval is required' });
  const { prepareAgencyTransition } = require('../services/agencyPreparationService');
  const transition = prepareAgencyTransition(incident, req.body, req.user);
  if (transition.error) {
    if (['authorize', 'ready'].includes(req.body.operation)) {
      try { await createAuditLog({ action: 'agency_authorization_blocked', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { operation: req.body.operation, organization: req.user.utilityCompany, reason: 'policy_pending' } }); }
      catch (_) { logger.error('Blocked agency action audit requires reconciliation', { incidentId: incident._id }); }
    }
    return res.status(transition.status).json({ success: false, code: ['authorize', 'ready'].includes(req.body.operation) ? 'WORK_AUTHORIZATION_POLICY_REQUIRED' : 'AGENCY_TRANSITION_REJECTED', message: transition.error });
  }
  if (transition.preparation.outcome === 'responsibility_review') incident.routingReview = { outcome: 'review_required', reason: 'agency_responsibility_dispute', candidates: incident.routingReview?.candidates || [], evaluatedAt: transition.event.at };
  incident.agencyPreparation = transition.preparation;
  incident.agencyStatus = transition.status;
  incident.agencyStatusUpdatedAt = transition.event.at; incident.agencyStatusUpdatedBy = req.user._id;
  // Detailed assessment remarks stay in organization-only preparation records.
  incident.agencyStatusNote = undefined;
  appendHistory(incident, incident.status, req.user, 'Agency preparation updated', { agencyStatus: transition.status, organization: req.user.utilityCompany, revision: transition.preparation.revision });
  await incident.save();
  await notify(incident.reporter, incident, 'Agency update', `Report ${incident.reportNumber}: ${transition.status.replace(/_/g, ' ')}. Maintenance has not been authorized.`, 'verification_update');
  await notify(inspection.secretary, incident, 'Agency preparation update', `Report ${incident.reportNumber}: ${transition.status.replace(/_/g, ' ')}.`, 'verification_update');
  try { await createAuditLog({ action: 'agency_preparation_updated', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id,
    details: { operation: req.body.operation, organization: req.user.utilityCompany, revision: transition.preparation.revision, status: transition.status } }); }
  catch (_) { logger.error('Agency preparation audit requires reconciliation', { incidentId: incident._id }); }
  res.json({ success: true, data: { agencyStatus: incident.agencyStatus, agencyPreparation: incident.agencyPreparation, maintenanceReady: false } });
});

exports.updateAgencyStatus = inspectionMutation(async (req, res) => {
  const allowed = ['ready_for_work', 'pending_procurement', 'work_in_progress', 'work_completed'];
  if (req.user.role !== 'utility_provider' || !allowed.includes(req.body.status)) return res.status(403).json({ success: false, message: 'Only the responsible agency may update this status' });
  const incident = await Incident.findOne({ _id: req.params.id, 'routing.responsibleOrganization': req.user.utilityCompany });
  if (!incident) return res.status(404).json({ success: false, message: 'Report not found for your agency' });
  if (incident.agencyPreparation) return res.status(409).json({ success: false, message: 'Agency preparation cannot be bypassed through legacy progress labels' });
  const order = incident.workOrder && await WorkOrder.findOne({ _id: incident.workOrder, incident: incident._id, responsibleOrganization: req.user.utilityCompany });
  if (order?.maintenanceProtocol === 9) return res.status(409).json({ success: false, code: 'WORKFLOW_POLICY_REQUIRED', message: 'New maintenance requires approved work authorization; legacy status updates cannot activate it' });
  if (!order || (req.body.status === 'work_completed' && !['completed', 'provider_accepted'].includes(order.status))) return res.status(409).json({ success: false, message: 'A compatible current work order is required' });
  if (['closed', 'resolved', 'rejected', 'duplicate'].includes(incident.status) || incident.agencyStatus === 'not_routed') return res.status(409).json({ success: false, message: 'Maintenance authorization is not established for this report' });
  const statusOrder = { ready_for_work: 0, pending_procurement: 1, work_in_progress: 2, work_completed: 3 };
  const currentStatus = incident.agencyStatus || 'ready_for_work';
  if (currentStatus === req.body.status) return res.status(409).json({ success: false, message: 'Agency status is already current' });
  const isCorrection = currentStatus === 'correction_required';
  const canMoveForward = isCorrection
    ? ['work_in_progress', 'work_completed'].includes(req.body.status)
    : statusOrder[req.body.status] >= statusOrder[currentStatus];
  if (!canMoveForward) return res.status(409).json({ success: false, message: 'Agency status cannot move backward. Choose the current status or a later step.' });
  if (req.body.status === 'work_completed' && currentStatus !== 'work_in_progress') {
    return res.status(409).json({ success: false, message: 'Set Work in Progress before reporting Work Completed so the agency SLA can be measured.' });
  }
  // This endpoint records progress, not new SLA authority. Never replace SLA.
  if (['met', 'breached', 'cancelled'].includes(incident.sla?.state) || incident.sla?.closedAt) return res.status(409).json({ success: false, message: 'Terminal SLA records require reconciliation' });
  if (['sla', 'startedAt', 'deadline', 'pause', 'extend'].some(key => req.body[key] !== undefined)) return res.status(400).json({ success: false, message: 'SLA amendments are not supported by this action' });
  const requestedPriority = req.body.priority === undefined ? incident.priority : String(req.body.priority).toLowerCase();
  if (req.body.priority !== undefined && !['critical', 'high', 'medium', 'low'].includes(requestedPriority)) return res.status(400).json({ success: false, message: 'A valid priority is required' });
  if (!incident.priority || requestedPriority !== incident.priority) return res.status(409).json({ success: false, code: 'SLA_POLICY_REQUIRED', message: 'Priority assignment or amendment requires an approved policy; the current SLA was preserved' });
  if (req.body.slaDeadline !== undefined) {
    const requestedDeadline = validSlaDate(req.body.slaDeadline);
    if (!requestedDeadline) return res.status(400).json({ success: false, message: 'A valid SLA deadline is required' });
    const savedDeadline = validSlaDate(incident.sla?.deadline);
    if (!savedDeadline || requestedDeadline.getTime() !== savedDeadline.getTime()) return res.status(409).json({ success: false, code: 'SLA_POLICY_REQUIRED', message: 'SLA start and deadline amendments require an approved policy' });
  }
  if (req.body.status === 'work_in_progress' && !validSlaDate(incident.sla?.deadline)) return res.status(409).json({ success: false, message: 'An existing valid SLA deadline is required; SLA start authority remains pending' });
  // Separate records may have separate delivery markers. Timing and priority
  // must agree where both records already contain them; never silently repair.
  const inconsistent = order.priority && order.priority !== incident.priority
    || ['startedAt', 'deadline'].some(key => incident.sla?.[key] && order.sla?.[key]
      && (!validSlaDate(incident.sla[key]) || !validSlaDate(order.sla[key])
        || validSlaDate(incident.sla[key]).getTime() !== validSlaDate(order.sla[key]).getTime()));
  if (inconsistent) return res.status(409).json({ success: false, message: 'Incident and work-order SLA values require reconciliation' });
  incident.agencyStatus = req.body.status; incident.agencyStatusNote = String(req.body.note || '').slice(0, 2000); incident.agencyStatusUpdatedBy = req.user._id; incident.agencyStatusUpdatedAt = new Date();
  // A correction starts a new completion-verification cycle. Keep the old
  // inspection readable in audit history, but do not let it unlock Secretary
  // finalization for the corrected work.
  if (isCorrection && req.body.status === 'work_in_progress') incident.completionInspection = undefined;
  if (req.body.status === 'work_completed') { incident.agencyCompletionReportedAt = new Date(); incident.agencyCompletionReportedBy = req.user._id; }
  incident.statusHistory.push({ status: req.body.status, changedBy: req.user._id, actorRole: req.user.role, changedAt: new Date(), notes: incident.agencyStatusNote, metadata: { agencyStatus: req.body.status, priority: incident.priority || null } });
  await incident.save();
  if (req.body.status === 'work_completed') {
    const initialInspection = await Inspection.findOne({ incident: incident._id, type: 'initial' }).select('secretary');
    await notify(initialInspection?.secretary || incident.validatedBy, incident, 'Agency reported work completed', `Report ${incident.reportNumber} is ready for final Barangay verification.`, 'agency_work_completed');
  }
  await createAuditLog({ action: 'agency_status_updated', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { status: req.body.status, note: incident.agencyStatusNote, priority: incident.priority || null } });
  res.json({ success: true, data: incident });
});

exports.requestAgencyCorrection = inspectionMutation(async (req, res) => {
  if (req.user.role !== 'barangay_official' || !String(req.body.reason || '').trim()) return res.status(400).json({ success: false, message: 'A correction reason is required' });
  const incident = await loadIncident(req, ['barangay_official']);
  if (!incident || !sameBarangay(incident, req.user) || !incident.completionInspection) return res.status(404).json({ success: false, message: 'Completion verification not found in your barangay' });
  const completion = await Inspection.findOne({ _id: incident.completionInspection, incident: incident._id, type: 'completion', status: 'submitted', secretary: req.user._id, barangay: req.user.barangay });
  if (!completion || incident.agencyStatus !== 'work_completed' || incident.status !== 'tanod_verified') return res.status(409).json({ success: false, message: 'Current submitted completion findings are required' });
  completion.status = 'rejected'; completion.reviewedAt = new Date(); completion.reviewedBy = req.user._id; completion.reviewNotes = String(req.body.reason).trim(); await completion.save();
  incident.agencyStatus = 'correction_required'; incident.agencyStatusNote = String(req.body.reason).trim().slice(0, 2000); incident.agencyStatusUpdatedBy = req.user._id; incident.agencyStatusUpdatedAt = new Date();
  incident.statusHistory.push({ status: 'correction_required', changedBy: req.user._id, actorRole: req.user.role, changedAt: new Date(), notes: incident.agencyStatusNote });
  await incident.save();
  const providers = incident.routing?.responsibleOrganization ? await User.find({ role: 'utility_provider', utilityCompany: incident.routing.responsibleOrganization, isActive: true }).select('_id') : [];
  await Promise.all(providers.map((provider) => notify(provider._id, incident, 'Correction requested', `Report ${incident.reportNumber} needs correction: ${incident.agencyStatusNote}`, 'agency_correction_requested')));
  await createAuditLog({ action: 'agency_correction_requested', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { reason: incident.agencyStatusNote } });
  res.json({ success: true, data: incident });
});

exports.assignCompletionInspection = inspectionMutation(async (req, res) => {
  const incident = await loadIncident(req, ['barangay_official']);
  if (!incident || !sameBarangay(incident, req.user) || (incident.agencyStatus !== 'work_completed' || !['provider_assigned', 'repair_completed', 'provider_review', 'tanod_verified'].includes(incident.status))) return res.status(409).json({ success: false, message: 'Only agency-completed reports can receive final verification' });
  const tanod = await User.findOne({ _id: req.body.tanodId, role: 'barangay_tanod', barangay: req.user.barangay, isActive: true, isArchived: { $ne: true }, requiresActivation: { $ne: true }, accountStatus: { $nin: ['pending_activation', 'suspended', 'deactivated'] } });
  if (!tanod) return res.status(400).json({ success: false, message: 'Select an active Barangay Tanod account from your barangay' });
  const completedOrder = incident.workOrder && await WorkOrder.findOne({ _id: incident.workOrder, incident: incident._id, responsibleOrganization: incident.routing?.responsibleOrganization, status: { $in: ['completed', 'provider_accepted'] } });
  if (!completedOrder) return res.status(409).json({ success: false, message: 'A current completed work order is required for completion inspection' });
  if (incident.completionInspection) return res.status(409).json({ success: false, message: 'A completion task already exists for this cycle' });
  const inspection = await Inspection.create({ incident: incident._id, type: 'completion', barangay: req.user.barangay, secretary: req.user._id, tanod: tanod._id });
  incident.completionInspection = inspection._id; appendHistory(incident, 'tanod_assigned', req.user, 'Final Tanod inspection assigned', { inspectionId: inspection._id, type: 'completion' }); await incident.save();
  await notify(tanod._id, incident, 'Final verification assigned', `Verify the completed work for report ${incident.reportNumber}.`, 'completion_inspection_assigned');
  res.status(201).json({ success: true, data: inspection });
});

exports.completeIncident = asyncHandler(async (req, res) => {
  return res.status(409).json({ success: false, code: 'CLOSURE_POLICY_UNRESOLVED', message: 'Final closure authority and prerequisites require an approved policy. No records were changed.' });
});
