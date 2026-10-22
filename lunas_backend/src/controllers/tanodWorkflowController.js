const Incident = require('../models/Incident');
const Inspection = require('../models/Inspection');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { createAuditLog } = require('../utils/auditLogger');
const { createNotification } = require('../services/notificationService');
const { getUploadedEvidenceFiles, processAndUploadEvidence } = require('../services/evidenceService');
const { buildIncidentScope, getIncidentBarangay, normalizeText } = require('../services/jurisdictionService');
const { initializeIncidentSLA } = require('../services/slaService');
const { getClosedSlaFields } = require('../services/workOrderService');
const storageService = require('../services/storageService');

const CATEGORY_AGENCIES = Object.freeze({
  water: 'Dagupan City Water District / Pamana Water Dagupan',
  electrical: 'Dagupan Electric Corporation (DECORP)',
  road: 'Dagupan City Engineering Office',
  drainage: 'Dagupan City Engineering Office',
  streetlight: 'Dagupan City Engineering Office',
  gas: 'DPWH - Dagupan National Infrastructure',
  other: null
});

const categoryAgency = (category) => CATEGORY_AGENCIES[category] || null;
const actorId = (user) => user?._id || user?.id;

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
  await createNotification({ recipient, type, title, message, data: { incidentId: incident._id, reportNumber: incident.reportNumber } });
};

exports.listTanodPersonnel = asyncHandler(async (req, res) => {
  if (req.user.role !== 'barangay_official') return res.status(403).json({ success: false, message: 'Only Barangay Secretaries may select Utility Personnel' });
  const users = await User.find({ role: 'utility_personnel', barangay: req.user.barangay, isArchived: { $ne: true } })
    .select('firstName middleName suffix lastName email phone barangay role availability accountStatus isActive requiresActivation createdAt').sort({ createdAt: -1 });
  res.json({ success: true, data: users.map((user) => ({ id: user._id, firstName: user.firstName, middleName: user.middleName, suffix: user.suffix, lastName: user.lastName, email: user.email, phone: user.phone, barangay: user.barangay, role: 'utility_personnel', availability: user.availability, accountStatus: user.accountStatus || (user.isActive ? 'active' : 'pending_activation'), isActive: user.isActive, requiresActivation: user.requiresActivation, createdAt: user.createdAt })) });
});

exports.listAgencyExceptions = asyncHandler(async (req, res) => {
  if (req.user.role !== 'barangay_official') return res.status(403).json({ success: false, message: 'Only Barangay Secretaries may view routing exceptions' });
  const incidents = await Incident.find({ ...buildIncidentScope(req.user), status: 'tanod_verified', agencyStatus: 'not_routed', 'routing.responsibleOrganization': { $exists: false } })
    .populate('initialInspection completionInspection', 'findings result evidence submittedAt').sort({ updatedAt: -1 });
  const providers = await User.find({ role: 'utility_provider', isActive: true, isArchived: { $ne: true } }).select('utilityCompany organization').lean();
  res.json({ success: true, data: { incidents, agencies: [...new Set(providers.map((provider) => provider.utilityCompany || provider.organization).filter(Boolean))] } });
});

exports.assignInitialInspection = asyncHandler(async (req, res) => {
  const incident = await loadIncident(req, ['barangay_official']);
  if (!incident || !sameBarangay(incident, req.user)) return res.status(404).json({ success: false, message: 'Report not found in your barangay' });
  if (!['submitted', 'clarification_required', 'tanod_rejected'].includes(incident.status)) return res.status(409).json({ success: false, message: 'This report is not waiting for Tanod inspection' });
  const tanod = await User.findOne({ _id: req.body.tanodId, role: 'utility_personnel', barangay: req.user.barangay, isActive: true, isArchived: { $ne: true } });
  if (!tanod) return res.status(400).json({ success: false, message: 'Select an active Utility Personnel account from your barangay' });
  const inspection = await Inspection.create({ incident: incident._id, type: 'initial', barangay: req.user.barangay, secretary: req.user._id, tanod: tanod._id, status: 'assigned' });
  incident.initialInspection = inspection._id;
  incident.initialVerifier = tanod._id;
  appendHistory(incident, 'tanod_assigned', req.user, 'Initial Tanod inspection assigned', { inspectionId: inspection._id });
  await incident.save();
  await notify(tanod._id, incident, 'New report inspection', `Report ${incident.reportNumber} needs barangay verification.`, 'inspection_assigned');
  await notify(incident.reporter, incident, 'Initial inspection assigned', 'Your report has been assigned for barangay field inspection.', 'status_update');
  await createAuditLog({ action: 'tanod_inspection_assigned', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { inspectionId: inspection._id, tanodId: tanod._id, type: 'initial' } });
  res.status(201).json({ success: true, data: inspection });
});

exports.listMyInspections = asyncHandler(async (req, res) => {
  if (req.user.role !== 'utility_personnel') return res.status(403).json({ success: false, message: 'Only Utility Personnel may view inspections' });
  const inspections = await Inspection.find({ tanod: req.user._id, barangay: req.user.barangay }).populate('incident', 'reportNumber category description location status images').sort({ createdAt: -1 });
  const data = await Promise.all(inspections.map(async (inspection) => {
    const item = inspection.toObject();
    if (item.incident) item.incident.images = (await Promise.all((item.incident.images || []).filter(Boolean).map(protectedInspectionImage))).filter((image) => image?.url);
    return item;
  }));
  res.json({ success: true, data });
});

exports.startInspection = asyncHandler(async (req, res) => {
  if (req.user.role !== 'utility_personnel') return res.status(403).json({ success: false, message: 'Only Utility Personnel may start inspections' });
  const inspection = await Inspection.findOne({ _id: req.params.inspectionId, incident: req.params.id, tanod: req.user._id, barangay: req.user.barangay, status: 'assigned' });
  if (!inspection) return res.status(404).json({ success: false, message: 'Inspection not found or already started' });
  const incident = await Incident.findById(inspection.incident);
  const pointer = inspection.type === 'completion' ? incident?.completionInspection : incident?.initialInspection;
  if (!incident || String(pointer) !== String(inspection._id) || ['closed', 'rejected', 'duplicate'].includes(incident.status)) return res.status(409).json({ success: false, message: 'This inspection is no longer current' });
  inspection.status = 'in_progress';
  inspection.startedAt = new Date();
  inspection.version += 1;
  await inspection.save();
  if (incident && incident.status === 'tanod_assigned') { appendHistory(incident, 'tanod_in_progress', req.user, 'Tanod started inspection', { inspectionId: inspection._id }); await incident.save(); }
  await notify(incident.reporter, incident, 'Inspection in progress', inspection.type === 'completion' ? 'Final field verification has started.' : 'Initial field verification has started.', 'status_update');
  await createAuditLog({ action: 'tanod_inspection_started', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { inspectionId: inspection._id, type: inspection.type } });
  res.json({ success: true, data: inspection });
});

exports.submitInspection = asyncHandler(async (req, res) => {
  if (req.user.role !== 'utility_personnel') return res.status(403).json({ success: false, message: 'Only Utility Personnel may submit inspections' });
  const inspection = await Inspection.findOne({ _id: req.params.inspectionId, incident: req.params.id, tanod: req.user._id, barangay: req.user.barangay, status: { $in: ['assigned', 'in_progress'] } });
  if (!inspection) return res.status(404).json({ success: false, message: 'Inspection not found or already submitted' });
  const incident = await Incident.findById(inspection.incident);
  const pointer = inspection.type === 'completion' ? incident?.completionInspection : incident?.initialInspection;
  if (!incident || String(pointer) !== String(inspection._id) || ['closed', 'rejected', 'duplicate'].includes(incident.status)) return res.status(409).json({ success: false, message: 'This inspection is no longer current' });
  if (!String(req.body.findings || '').trim()) return res.status(400).json({ success: false, message: 'Findings are required' });
  const files = getUploadedEvidenceFiles(req);
  if (!files.length) return res.status(400).json({ success: false, message: 'At least one inspection photograph is required' });
  let evidence = [];
  if (files.length) {
    const processed = await Promise.all(files.map((file) => processAndUploadEvidence([file], { reporterId: req.user._id.toString(), category: req.body.category || 'other', privacyAcknowledged: true })));
    // processAndUploadEvidence returns one result per file with its evidence
    // inside `images`. Keep the actual stored evidence objects instead of
    // reading a non-existent top-level `evidence` property (which persisted
    // null entries and left the Secretary without photos).
    evidence = processed.flatMap((item) => item.images || []);
  }
  inspection.status = 'submitted';
  inspection.findings = String(req.body.findings).trim();
  inspection.result = ['verified', 'not_verified', 'unable_to_verify'].includes(req.body.result) ? req.body.result : 'verified';
  inspection.evidence = evidence;
  inspection.submittedAt = new Date();
  inspection.version += 1;
  await inspection.save();
  if (incident) { appendHistory(incident, 'tanod_verified', req.user, 'Tanod submitted inspection findings', { inspectionId: inspection._id, result: inspection.result }); await incident.save(); await notify(inspection.secretary, incident, 'Tanod verification submitted', `Report ${incident.reportNumber} is ready for your review.`, 'inspection_submitted'); }
  await notify(incident.reporter, incident, 'Inspection findings submitted', 'Field findings have been submitted for Secretary review.', 'status_update');
  await createAuditLog({ action: 'tanod_inspection_submitted', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { inspectionId: inspection._id, type: inspection.type, result: inspection.result } });
  res.json({ success: true, data: inspection });
});

exports.reviewInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findById(req.params.inspectionId);
  if (!inspection || inspection.secretary.toString() !== req.user._id.toString() || req.user.role !== 'barangay_official') return res.status(404).json({ success: false, message: 'Inspection not found' });
  if (inspection.status !== 'submitted') return res.status(409).json({ success: false, message: 'Inspection is not waiting for review' });
  const approve = req.body.decision === 'approve';
  const incident = await Incident.findOne({ _id: inspection.incident, ...buildIncidentScope(req.user) });
  if (!incident) return res.status(404).json({ success: false, message: 'Report not found in your barangay' });
  if (String(inspection.incident) !== String(req.params.id) || inspection.type !== 'initial'
    || String(incident.initialInspection) !== String(inspection._id) || incident.status !== 'tanod_verified') {
    return res.status(409).json({ success: false, message: 'Only the current initial inspection may be reviewed here' });
  }
  if (approve && (inspection.result !== 'verified' || !inspection.evidence?.length)) return res.status(409).json({ success: false, message: 'Verified findings and photographs are required before approval' });
  if (!approve && !String(req.body.notes || '').trim()) return res.status(400).json({ success: false, message: 'A rejection or clarification reason is required' });
  inspection.status = approve ? 'approved' : (req.body.decision === 'clarification' ? 'clarification_required' : 'rejected');
  inspection.reviewedAt = new Date(); inspection.reviewedBy = req.user._id; inspection.reviewNotes = req.body.notes || '';
  await inspection.save();
  if (approve) {
    const agency = categoryAgency(incident.category);
    incident.agencyStatus = agency ? 'ready_for_work' : 'not_routed';
    incident.routing = agency ? { responsibleOrganization: agency, responsibleRole: 'utility_provider', reason: 'Automatic category routing after Secretary approval', routedBy: req.user._id, routedAt: new Date(), history: [] } : undefined;
    appendHistory(incident, agency ? 'provider_assigned' : 'tanod_verified', req.user, agency ? 'Secretary approved verification; report automatically routed to agency' : 'Secretary approved verification; agency mapping required', { agency, automaticRouting: Boolean(agency) });
  } else {
    if (req.body.decision === 'reject') incident.rejectionReason = req.body.notes;
    if (req.body.decision === 'clarification') incident.clarificationReason = req.body.notes;
    appendHistory(incident, inspection.status, req.user, req.body.notes || 'Secretary did not approve Tanod verification', { inspectionId: inspection._id });
  }
  await incident.save();
  if (approve && incident.routing?.responsibleOrganization) {
    const providers = await User.find({ role: 'utility_provider', utilityCompany: incident.routing.responsibleOrganization, isActive: true, isArchived: { $ne: true } }).select('_id');
    await Promise.all(providers.map((provider) => notify(provider._id, incident, 'New agency report', `Report ${incident.reportNumber} was routed to your agency.`, 'agency_report_routed')));
  }
  await notify(incident.reporter, incident, 'Verification update', approve
    ? (incident.routing?.responsibleOrganization ? `Report ${incident.reportNumber} was approved and routed to ${incident.routing.responsibleOrganization}.` : 'Your report was approved and is awaiting agency routing review.')
    : `${req.body.decision === 'reject' ? 'Your report was rejected' : 'Clarification was requested'}: ${req.body.notes}`, 'verification_update');
  await createAuditLog({ action: approve ? 'tanod_verification_approved' : req.body.decision === 'clarification' ? 'tanod_verification_clarification' : 'tanod_verification_rejected', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { inspectionId: inspection._id, decision: req.body.decision, agency: incident.routing?.responsibleOrganization } });
  res.json({ success: true, data: { inspection, incident } });
});

exports.updateAgencyStatus = asyncHandler(async (req, res) => {
  const allowed = ['ready_for_work', 'pending_procurement', 'work_in_progress', 'work_completed'];
  if (req.user.role !== 'utility_provider' || !allowed.includes(req.body.status)) return res.status(403).json({ success: false, message: 'Only the responsible agency may update this status' });
  const incident = await Incident.findOne({ _id: req.params.id, 'routing.responsibleOrganization': req.user.utilityCompany });
  if (!incident) return res.status(404).json({ success: false, message: 'Report not found for your agency' });
  if (['closed', 'resolved', 'rejected', 'duplicate'].includes(incident.status)) return res.status(409).json({ success: false, message: 'This report is no longer open for agency updates' });
  const statusOrder = { ready_for_work: 0, pending_procurement: 1, work_in_progress: 2, work_completed: 3 };
  const currentStatus = incident.agencyStatus || 'ready_for_work';
  const isCorrection = currentStatus === 'correction_required';
  const canMoveForward = isCorrection
    ? ['work_in_progress', 'work_completed'].includes(req.body.status)
    : statusOrder[req.body.status] >= statusOrder[currentStatus];
  if (!canMoveForward) return res.status(409).json({ success: false, message: 'Agency status cannot move backward. Choose the current status or a later step.' });
  if (req.body.status === 'work_completed' && currentStatus !== 'work_in_progress') {
    return res.status(409).json({ success: false, message: 'Set Work in Progress before reporting Work Completed so the agency SLA can be measured.' });
  }
  if (req.body.status === 'work_in_progress' && !incident.sla?.deadline && !req.body.slaDeadline) {
    return res.status(400).json({ success: false, message: 'Enter the agency SLA deadline before starting work' });
  }
  const requestedPriority = req.body.priority ? String(req.body.priority).toLowerCase() : '';
  if (requestedPriority && !['critical', 'high', 'medium', 'low'].includes(requestedPriority)) {
    return res.status(400).json({ success: false, message: 'A valid priority is required' });
  }
  if (!incident.priority && !requestedPriority) {
    return res.status(400).json({ success: false, message: 'The agency must set a priority before saving its status' });
  }
  if (requestedPriority && requestedPriority !== incident.priority) {
    if (['work_in_progress', 'work_completed', 'correction_required'].includes(currentStatus)) return res.status(409).json({ success: false, message: 'Priority cannot change after work starts' });
    const sla = initializeIncidentSLA(requestedPriority);
    incident.priority = requestedPriority;
    incident.priorityAssignedBy = req.user._id;
    incident.priorityAssignedAt = new Date();
    incident.sla = { ...(incident.sla?.toObject?.() || incident.sla || {}), targetResolutionTime: sla.targetResolutionTime, state: 'not_started', isOverdue: false, escalationLevel: 0, remindersSent: 0 };
  }
  if (req.body.procurementRequired !== undefined) {
    if (!['ready_for_work', 'pending_procurement'].includes(currentStatus)) return res.status(409).json({ success: false, message: 'Procurement requirements must be recorded before work starts' });
    incident.procurementRequired = req.body.procurementRequired;
  }
  if (req.body.expectedTimeline !== undefined) incident.expectedTimeline = String(req.body.expectedTimeline).trim().slice(0, 2000);
  if (req.body.status === 'work_in_progress' && !incident.expectedTimeline?.trim()) return res.status(400).json({ success: false, message: 'Record the agency expected timeline before starting or updating physical work' });
  if (req.body.status === 'work_in_progress' && currentStatus === 'ready_for_work' && incident.procurementRequired === undefined) return res.status(400).json({ success: false, message: 'Record whether external procurement is required' });
  if (req.body.status === 'pending_procurement' && incident.procurementRequired === false) return res.status(400).json({ success: false, message: 'Procurement was marked not required' });
  if (req.body.progressPercent !== undefined) {
    const progress = Number(req.body.progressPercent);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100 || (progress === 100 && req.body.status !== 'work_completed')) return res.status(400).json({ success: false, message: 'Use 0–99 for ongoing work and Work Completed for 100%' });
    if (req.body.status !== 'work_in_progress' && req.body.status !== 'work_completed') return res.status(400).json({ success: false, message: 'Repair progress is recorded only during physical work' });
    if (!isCorrection && progress < (incident.agencyProgressPercent || 0)) return res.status(409).json({ success: false, message: 'Repair progress cannot decrease during a work cycle' });
    incident.agencyProgressPercent = progress;
  }
  if (isCorrection && req.body.status === 'work_in_progress') incident.agencyProgressPercent = req.body.progressPercent ?? 0;
  if (req.body.status === 'work_completed') incident.agencyProgressPercent = 100;
  if (req.body.slaDeadline !== undefined) {
    const parsedDeadline = new Date(req.body.slaDeadline);
    if (!req.body.slaDeadline || Number.isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({ success: false, message: 'A valid SLA deadline is required' });
    }
    if (incident.sla?.deadline && !['ready_for_work', 'pending_procurement'].includes(currentStatus) && parsedDeadline.getTime() !== new Date(incident.sla.deadline).getTime()) {
      return res.status(409).json({ success: false, message: 'The SLA deadline cannot be changed after Pending Procurement/Bidding' });
    }
    incident.sla = { ...(incident.sla?.toObject?.() || incident.sla || {}), deadline: parsedDeadline, state: 'not_started', isOverdue: false };
  }
  if (req.body.status === 'work_in_progress' && !incident.sla.startedAt) { incident.sla.startedAt = new Date(); incident.sla.state = 'active'; }
  incident.agencyStatus = req.body.status; incident.agencyStatusNote = String(req.body.note || '').slice(0, 2000); incident.agencyStatusUpdatedBy = req.user._id; incident.agencyStatusUpdatedAt = new Date();
  // A correction starts a new completion-verification cycle. Keep the old
  // inspection readable in audit history, but do not let it unlock Secretary
  // finalization for the corrected work.
  if (isCorrection && req.body.status === 'work_in_progress') { incident.completionInspection = undefined; incident.completionVerifier = undefined; }
  if (req.body.status === 'work_completed') { incident.agencyCompletionReportedAt = new Date(); incident.agencyCompletionReportedBy = req.user._id; }
  incident.statusHistory.push({ status: req.body.status, changedBy: req.user._id, actorRole: req.user.role, changedAt: new Date(), notes: incident.agencyStatusNote, metadata: { agencyStatus: req.body.status, priority: incident.priority || null, progressPercent: incident.agencyProgressPercent } });
  await incident.save();
  const statusLabels = { ready_for_work: 'Ready for work', pending_procurement: 'Pending external procurement / bidding', work_in_progress: 'Work in progress', work_completed: 'Work completed; awaiting final verification' };
  await notify(incident.reporter, incident, 'Agency update', `${statusLabels[req.body.status]}${req.body.status === 'work_in_progress' ? ` (${incident.agencyProgressPercent || 0}%)` : ''}.`, 'status_update');
  if (req.body.status === 'work_completed') {
    const initialInspection = await Inspection.findOne({ incident: incident._id, type: 'initial' }).select('secretary');
    await notify(initialInspection?.secretary || incident.validatedBy, incident, 'Agency reported work completed', `Report ${incident.reportNumber} is ready for final Barangay verification.`, 'agency_work_completed');
  }
  await createAuditLog({ action: 'agency_status_updated', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { status: req.body.status, note: incident.agencyStatusNote, priority: incident.priority || null } });
  res.json({ success: true, data: incident });
});

exports.requestAgencyCorrection = asyncHandler(async (req, res) => {
  if (req.user.role !== 'barangay_official' || !String(req.body.reason || '').trim()) return res.status(400).json({ success: false, message: 'A correction reason is required' });
  const incident = await loadIncident(req, ['barangay_official']);
  if (!incident || !sameBarangay(incident, req.user) || !incident.completionInspection) return res.status(404).json({ success: false, message: 'Completion verification not found in your barangay' });
  const inspection = await Inspection.findOne({ _id: incident.completionInspection, incident: incident._id, type: 'completion', status: 'submitted', secretary: req.user._id });
  if (!inspection || incident.agencyStatus !== 'work_completed' || ['closed', 'resolved'].includes(incident.status)) return res.status(409).json({ success: false, message: 'Review current final inspection findings before requesting correction' });
  if (incident.agencyStatus === 'correction_required') return res.status(409).json({ success: false, message: 'A correction request has already been sent. Wait for the agency to resubmit the work.' });
  incident.agencyStatus = 'correction_required'; incident.agencyStatusNote = String(req.body.reason).trim().slice(0, 2000); incident.agencyStatusUpdatedBy = req.user._id; incident.agencyStatusUpdatedAt = new Date();
  incident.statusHistory.push({ status: 'correction_required', changedBy: req.user._id, actorRole: req.user.role, changedAt: new Date(), notes: incident.agencyStatusNote });
  await incident.save();
  await notify(incident.reporter, incident, 'Correction requested', 'The Secretary requested corrective work from the responsible agency.', 'status_update');
  const providers = incident.routing?.responsibleOrganization ? await User.find({ role: 'utility_provider', utilityCompany: incident.routing.responsibleOrganization, isActive: true }).select('_id') : [];
  await Promise.all(providers.map((provider) => notify(provider._id, incident, 'Correction requested', `Report ${incident.reportNumber} needs correction: ${incident.agencyStatusNote}`, 'agency_correction_requested')));
  await createAuditLog({ action: 'agency_correction_requested', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { reason: incident.agencyStatusNote } });
  res.json({ success: true, data: incident });
});

exports.assignCompletionInspection = asyncHandler(async (req, res) => {
  const incident = await loadIncident(req, ['barangay_official']);
  if (!incident || !sameBarangay(incident, req.user) || incident.agencyStatus !== 'work_completed') return res.status(409).json({ success: false, message: 'Only agency-completed reports can receive final verification' });
  if (incident.completionInspection) return res.status(409).json({ success: false, message: 'A final inspection is already assigned for this work cycle' });
  const tanod = await User.findOne({ _id: req.body.tanodId, role: 'utility_personnel', barangay: req.user.barangay, isActive: true, isArchived: { $ne: true } });
  if (!tanod) return res.status(400).json({ success: false, message: 'Select an active Utility Personnel account from your barangay' });
  const inspection = await Inspection.create({ incident: incident._id, type: 'completion', barangay: req.user.barangay, secretary: req.user._id, tanod: tanod._id });
  incident.completionVerifier = tanod._id;
  incident.completionInspection = inspection._id; appendHistory(incident, 'tanod_assigned', req.user, 'Final Tanod inspection assigned', { inspectionId: inspection._id, type: 'completion' }); await incident.save();
  await notify(tanod._id, incident, 'Final verification assigned', `Verify the completed work for report ${incident.reportNumber}.`, 'completion_inspection_assigned');
  await notify(incident.reporter, incident, 'Final inspection assigned', 'Completed agency work has been assigned for final field verification.', 'status_update');
  await createAuditLog({ action: 'tanod_inspection_assigned', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { inspectionId: inspection._id, type: 'completion' } });
  res.status(201).json({ success: true, data: inspection });
});

exports.completeIncident = asyncHandler(async (req, res) => {
  // The route is /incidents/:id/complete and the web client sends the
  // completion inspection ID in the request body.
  const inspectionId = req.body.inspectionId || req.params.inspectionId;
  const inspection = await Inspection.findOne({ _id: inspectionId, incident: req.params.id, type: 'completion', status: 'submitted' });
  if (!inspection || inspection.secretary.toString() !== req.user._id.toString() || req.user.role !== 'barangay_official') return res.status(404).json({ success: false, message: 'Completion inspection not found' });
  const incident = await Incident.findOne({ _id: inspection.incident, ...buildIncidentScope(req.user) });
  if (!incident || inspection.result !== 'verified'
    || !inspection.evidence?.length || ['closed', 'resolved', 'rejected', 'duplicate'].includes(incident.status)
    || String(incident.completionInspection) !== String(inspection._id)
    || incident.agencyStatus !== 'work_completed') {
    return res.status(409).json({ success: false, message: 'Current completion inspection must be verified after agency completion before closing' });
  }
  inspection.status = 'approved'; inspection.reviewedAt = new Date(); inspection.reviewedBy = req.user._id; inspection.reviewNotes = req.body.notes || ''; await inspection.save();
  appendHistory(incident, 'closed', req.user, 'Secretary approved final Tanod verification; incident completed', { inspectionId: inspection._id }); incident.finalVerifiedBy = req.user._id; incident.finalVerifiedAt = new Date(); incident.closedAt = new Date();
  const closedSla = getClosedSlaFields(incident.sla, incident.closedAt);
  incident.sla.state = closedSla['sla.state']; incident.sla.isOverdue = false; incident.sla.closedAt = incident.closedAt;
  await incident.save();
  await notify(incident.reporter, incident, 'Report completed', `Report ${incident.reportNumber} has been verified and completed.`, 'incident_completed');
  await createAuditLog({ action: 'incident_completed_by_secretary', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { inspectionId: inspection._id } });
  res.json({ success: true, data: incident });
});

module.exports.CATEGORY_AGENCIES = CATEGORY_AGENCIES;

exports.resolveAgencyRouting = asyncHandler(async (req, res) => {
  const incident = await loadIncident(req, ['barangay_official']);
  if (!incident) return res.status(404).json({ success: false, message: 'Report not found in your barangay' });
  if (!['tanod_verified', 'provider_assigned'].includes(incident.status)
    || !['not_routed', 'ready_for_work'].includes(incident.agencyStatus) || incident.priority || incident.workOrder) {
    return res.status(409).json({ success: false, message: 'Agency routing may only be corrected before agency assessment and work' });
  }
  const inspection = await Inspection.findOne({ _id: incident.initialInspection, incident: incident._id, type: 'initial', status: 'approved', result: 'verified' });
  if (!inspection) return res.status(409).json({ success: false, message: 'Secretary-approved initial verification is required' });
  const organization = String(req.body.responsibleOrganization || '').trim();
  const reason = String(req.body.reason || '').trim();
  if (!reason) return res.status(400).json({ success: false, message: 'Explain the verified agency responsibility' });
  const providers = await User.find({ role: 'utility_provider', utilityCompany: organization, isActive: true, isArchived: { $ne: true } }).select('_id');
  if (!organization || !providers.length) return res.status(400).json({ success: false, message: 'Select a provisioned agency' });
  const previous = incident.routing?.responsibleOrganization;
  const history = [...(incident.routing?.history || []), { fromOrganization: previous, toOrganization: organization, fromRole: 'utility_provider', toRole: 'utility_provider', routedBy: req.user._id, routedAt: new Date(), reason }];
  incident.routing = { responsibleOrganization: organization, responsibleRole: 'utility_provider', reason, routedBy: req.user._id, routedAt: new Date(), history };
  incident.agencyStatus = 'ready_for_work';
  appendHistory(incident, 'provider_assigned', req.user, 'Secretary confirmed responsible agency', { responsibleOrganization: organization, reason });
  await incident.save();
  await Promise.all(providers.map(provider => notify(provider._id, incident, 'Report routed to agency', `Report ${incident.reportNumber} was assigned to your agency.`, 'agency_report_routed')));
  await notify(incident.reporter, incident, 'Responsible agency confirmed', `Your report was routed to ${organization}.`, 'verification_update');
  await createAuditLog({ action: 'incident_routed', performedBy: req.user._id, resourceType: 'Incident', resourceId: incident._id, details: { previous, organization, reason } });
  res.json({ success: true, message: 'Responsible agency confirmed', data: incident });
});
