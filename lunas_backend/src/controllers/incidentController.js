const { getSlaProjection } = require('../services/workOrderService');
const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const User = require('../models/User');
const { buildLocationIntegrity, safeLocationIntegrity } = require('../services/locationIntegrityService');
const { createAuditLog } = require('../utils/auditLogger');
const asyncHandler = require('../middleware/asyncHandler');
const storageService = require('../services/storageService');
const { createNotification, notificationTemplates } = require('../services/notificationService');
const { findPossibleDuplicateCandidates } = require('../services/duplicateDetectionService');
const { initializeIncidentSLA } = require('../services/slaService');
const {
  buildIncidentScope,
  combineIncidentFilters,
  canConfirmJurisdiction,
  canRouteIncident,
  defaultJurisdictionFor,
  normalizeText,
  RESPONSIBLE_ROLES
} = require('../services/jurisdictionService');
const { buildIncidentTransition, canTransitionIncident, transitionConflict } = require('../services/incidentTransitionService');
const {
  cleanupEvidence,
  getUploadedEvidenceFiles,
  processAndUploadEvidence
} = require('../services/evidenceService');
const logger = require('../utils/logger');
const {
  DAGUPAN_BARANGAYS,
  DAGUPAN_CITY,
  canonicalizeBarangay,
  canonicalizeDagupanCity
} = require('../data/dagupanBarangays');
const { getReportingRestriction, reportingBlockedResponse } = require('../services/reportingRestrictionService');

const clampUnit = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, Math.min(1, numericValue)) : null;
};

const safeAiFinding = (finding) => {
  if (!finding || typeof finding !== 'object') return null;
  const label = typeof finding.label === 'string'
    ? finding.label.trim().slice(0, 100)
    : null;
  const bbox = finding.bbox && typeof finding.bbox === 'object' ? finding.bbox : null;
  if (!label || !bbox) return null;
  const normalizedBox = {};
  for (const key of ['x1', 'y1', 'x2', 'y2']) {
    const value = clampUnit(bbox[key]);
    if (value === null) return null;
    normalizedBox[key] = value;
  }
  if (normalizedBox.x2 < normalizedBox.x1 || normalizedBox.y2 < normalizedBox.y1) return null;
  return {
    label,
    confidence: clampUnit(finding.confidence) ?? 0,
    bbox: normalizedBox,
    ...(finding.confidenceStatus === 'production' || finding.confidence_status === 'production'
      ? { confidenceStatus: 'production' }
      : finding.confidenceStatus === 'manual_review' || finding.confidence_status === 'manual_review'
        ? { confidenceStatus: 'manual_review' }
        : {}),
    ...(clampUnit(finding.productionThreshold ?? finding.production_threshold) !== null
      ? { productionThreshold: clampUnit(finding.productionThreshold ?? finding.production_threshold) }
      : {})
  };
};

const safeAiFindings = (findings = []) => (Array.isArray(findings) ? findings : [])
  .map(safeAiFinding)
  .filter(Boolean)
  .slice(0, 50);

const safeAiAnalysis = (analysis, evidenceFindings = []) => {
  if (!analysis || typeof analysis !== 'object') return undefined;
  const status = ['completed', 'unavailable', 'failed'].includes(analysis.analysisStatus)
    ? analysis.analysisStatus
    : 'unavailable';
  const findings = safeAiFindings(analysis.findings);
  const storedFindingsCount = Number(analysis.findingsCount);
  const evidenceFindingsCount = evidenceFindings.reduce(
    (total, image) => total + safeAiFindings(image?.aiFindings).length,
    0
  );
  return {
    analysisStatus: status,
    category: typeof analysis.category === 'string' ? analysis.category.slice(0, 40) : undefined,
    ...(typeof analysis.model === 'string' && analysis.model.trim()
      ? { model: analysis.model.trim().slice(0, 80) }
      : {}),
    modelAvailable: status === 'completed' && analysis.modelAvailable !== false,
    classificationStatus: ['production', 'manual_review', 'no_detection'].includes(analysis.classificationStatus)
      ? analysis.classificationStatus
      : undefined,
    detected: status === 'completed' && analysis.detected === true,
    hazardType: status === 'completed' && typeof analysis.hazardType === 'string'
      ? analysis.hazardType.slice(0, 100)
      : null,
    confidence: status === 'completed' ? clampUnit(analysis.confidence) ?? 0 : 0,
    findingsCount: Number.isFinite(storedFindingsCount)
      ? Math.max(0, Math.round(storedFindingsCount))
      : Math.max(findings.length, evidenceFindingsCount),
    requiresManualReview: true,
    advisoryOnly: true,
    processedAt: analysis.processedAt || null
  };
};

const safeEvidenceForCitizen = async (image) => {
  const source = image.toObject ? image.toObject() : image;
  let url = source.url || null;

  if (source.key) {
    try {
      url = await storageService.getEvidenceUrl(source.key, source.url);
    } catch (error) {
      // A temporary signed URL failure must not expose private keys or prevent
      // a citizen from seeing the rest of their report.
      logger.warn(`Could not create an evidence URL: ${error.message}`);
      url = null;
    }
  }

  return {
    url,
    uploadedAt: source.uploadedAt,
    isPrivacyMasked: Boolean(source.isPrivacyMasked),
    mimeType: source.mimeType,
    width: source.width,
    height: source.height,
    aiFindings: safeAiFindings(source.aiFindings),
    quality: source.quality ? { status: source.quality.status } : undefined,
    privacyProcessing: source.privacyProcessing ? {
      status: source.privacyProcessing.status,
      applied: Boolean(source.privacyProcessing.applied),
      acknowledgedByReporter: Boolean(source.privacyProcessing.acknowledgedByReporter),
      detectedRegions: Number.isFinite(Number(source.privacyProcessing.detectedRegions))
        ? Math.max(0, Math.round(Number(source.privacyProcessing.detectedRegions)))
        : 0
    } : undefined
  };
};

// Citizen timelines must remain useful without becoming an accidental channel
// for internal validation, routing, or reviewer notes.  The public decision
// reasons are intentionally exposed through the dedicated rejection/duplicate
// fields below; official history has the richer note and actor metadata.
const serializeStatusHistoryForCitizen = (history = []) => history.map((entry) => ({
  status: entry.status,
  changedAt: entry.changedAt,
  // Repair percentage and readiness are safe high-level information. Internal
  // notes, actor identities, reassignment reasons, and escalation metadata
  // remain deliberately absent from citizen responses.
  ...(entry.metadata?.progressPercent !== undefined
    ? { progressPercent: entry.metadata.progressPercent, repairStage: entry.metadata.stage }
    : {}),
  ...(entry.metadata?.event === 'work_order_created' ? { event: 'work_order_created' } : {})
}));

const serializeIncidentForCitizen = async (incident) => {
  const source = incident.toObject ? incident.toObject() : incident;
  const images = await Promise.all((source.images || []).map(safeEvidenceForCitizen));

  return {
    _id: source._id,
    id: source._id,
    reportNumber: source.reportNumber,
    category: source.category,
    subcategory: source.subcategory,
    description: source.description,
    location: source.location,
    images,
    status: source.status,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    rejectionReason: source.status === 'rejected' ? source.rejectionReason : undefined,
    duplicateReason: source.status === 'duplicate' ? source.duplicateReason : undefined,
    clarificationReason: source.status === 'clarification_required' ? source.clarificationReason : undefined,
    statusHistory: serializeStatusHistoryForCitizen(source.statusHistory || []),
    // Citizens receive only the same category-relevant advisory summary that
    // an official sees; it cannot be used as an operational decision.
    aiAnalysis: safeAiAnalysis(source.aiAnalysis, source.images || []),
    repair: source.workOrder && typeof source.workOrder === 'object'
      ? {
        reference: source.workOrder.orderNumber,
        status: source.workOrder.status,
        assignmentState: source.workOrder.assignmentState,
        progressPercent: source.workOrder.progressPercent,
        stage: source.workOrder.progressStage,
        readyForCompletion: source.workOrder.status === 'completed'
          && source.workOrder.progressPercent === 100,
        updatedAt: source.workOrder.updatedAt
      }
      : undefined,
    possibleDuplicateCandidateCount: source.duplicateDetection?.candidateCount || 0
  };
};

const safeReporterForOfficial = (reporter) => {
  const source = reporter?.toObject ? reporter.toObject() : reporter;
  if (!source) return undefined;
  const id = source._id || source.id;
  return id ? {
    id: id.toString(),
    firstName: source.firstName,
    lastName: source.lastName
  } : undefined;
};

const safeDuplicateReference = (duplicateOf) => {
  const source = duplicateOf?.toObject ? duplicateOf.toObject() : duplicateOf;
  if (!source) return undefined;
  if (typeof source === 'string' || source._bsontype === 'ObjectID' || source._bsontype === 'ObjectId') {
    return { id: source.toString() };
  }
  const id = source._id || source.id;
  return id ? { id: id.toString(), reportNumber: source.reportNumber } : undefined;
};

const serializeIncidentForOfficial = async (incident, { includeHistory = true, includeCandidates = false, includeLocationIntegrity = true } = {}) => {
  const source = incident.toObject ? incident.toObject() : incident;
  const aiAnalysis = source.aiAnalysis;
  const hasConfidence = typeof aiAnalysis?.confidence === 'number' && Number.isFinite(aiAnalysis.confidence);
  const analysisStatus = aiAnalysis?.analysisStatus || (hasConfidence ? 'completed' : 'unavailable');
  const images = await Promise.all((source.images || []).map(safeEvidenceForCitizen));
  const duplicateCandidates = includeCandidates
    ? (source.duplicateCandidates || []).map((candidate) => ({
      id: (candidate.incident?._id || candidate.incident || candidate.id)?.toString(),
      reportNumber: candidate.reportNumber,
      distanceMeters: candidate.distanceMeters,
      score: candidate.score,
      detectedAt: candidate.detectedAt
    })).filter((candidate) => candidate.id)
    : undefined;

  return {
    _id: source._id,
    id: source._id?.toString?.() || source.id,
    reportNumber: source.reportNumber,
    category: source.category,
    subcategory: source.subcategory,
    description: source.description,
    location: source.location,
    images,
    locationIntegrity: includeLocationIntegrity ? safeLocationIntegrity(source.locationIntegrity) : undefined,
    evidenceThumbnail: images[0]?.url || null,
    status: source.status,
    priority: source.priority,
    priorityAssignedAt: source.priorityAssignedAt,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    reporter: safeReporterForOfficial(source.reporter),
    aiAnalysis: aiAnalysis ? {
      analysisStatus,
      detected: Boolean(aiAnalysis.detected),
      classificationStatus: ['production', 'manual_review', 'no_detection'].includes(aiAnalysis.classificationStatus)
        ? aiAnalysis.classificationStatus
        : undefined,
      hazardType: aiAnalysis.hazardType || null,
      confidence: hasConfidence ? aiAnalysis.confidence : 0,
      category: typeof aiAnalysis.category === 'string' ? aiAnalysis.category : undefined,
      ...(typeof aiAnalysis.model === 'string' && aiAnalysis.model.trim()
        ? { model: aiAnalysis.model.trim().slice(0, 80) }
        : {}),
      modelAvailable: analysisStatus === 'completed' && aiAnalysis.modelAvailable !== false,
      detections: {
        roadDamage: Number(aiAnalysis.detections?.roadDamage) || 0,
        cracks: Number(aiAnalysis.detections?.cracks) || 0
      },
      findingsCount: Number(aiAnalysis.findingsCount) || safeAiFindings(aiAnalysis.findings).length,
      findings: safeAiFindings(aiAnalysis.findings),
      // Force the manual-only contract at the official API boundary too.
      requiresManualReview: true,
      advisoryOnly: true,
      processedAt: aiAnalysis.processedAt || null
    } : undefined,
    possibleDuplicateCandidateCount: source.duplicateDetection?.candidateCount || (source.duplicateCandidates || []).length,
    duplicateCandidates,
    duplicateOf: safeDuplicateReference(source.duplicateOf),
    duplicateReason: source.duplicateReason,
    rejectionReason: source.rejectionReason,
    clarificationReason: source.status === 'clarification_required' ? source.clarificationReason : undefined,
    jurisdiction: source.jurisdiction,
    routing: source.routing ? {
      responsibleOrganization: source.routing.responsibleOrganization,
      responsibleRole: source.routing.responsibleRole,
      reason: source.routing.reason,
      routedAt: source.routing.routedAt
    } : undefined,
    sla: { ...source.sla, ...getSlaProjection(source.sla) },
    validatedAt: source.validatedAt,
    validatedBy: safeReporterForOfficial(source.validatedBy),
    workOrder: source.workOrder && typeof source.workOrder === 'object'
      ? {
        id: source.workOrder._id?.toString?.() || source.workOrder._id,
        reference: source.workOrder.orderNumber,
        status: source.workOrder.status,
        assignmentState: source.workOrder.assignmentState,
        progressPercent: source.workOrder.progressPercent,
        stage: source.workOrder.progressStage
      }
      : source.workOrder ? { id: source.workOrder.toString() } : undefined,
    ...(includeHistory ? {
      statusHistory: (source.statusHistory || []).map((entry) => ({
        status: entry.status,
        changedAt: entry.changedAt,
        notes: entry.notes,
        actorRole: entry.actorRole,
        metadata: entry.metadata
      }))
    } : {})
  };
};

const normalizeLegacyImages = (images = [], privacyAcknowledged = false) => images.map((image) => ({
  url: image.url,
  uploadedAt: new Date(),
  // A legacy JSON client must never be able to supply an internal storage key:
  // doing so could otherwise make a later signed-URL request disclose another
  // reporter's private evidence. Claims from legacy clients also cannot prove
  // that an image was redacted.
  isPrivacyMasked: false,
  privacyProcessing: {
    status: 'unverified_legacy_upload',
    applied: false,
    acknowledgedByReporter: Boolean(privacyAcknowledged)
  }
}));

// @desc    Create a new citizen incident report
// @route   POST /api/v1/incidents
// @access  Private (Citizen)
exports.createIncident = asyncHandler(async (req, res) => {
  const { category, subcategory, description, location } = req.body;
  const barangay = canonicalizeBarangay(location?.address?.barangay);
  const city = canonicalizeDagupanCity(location?.address?.city);
  if (!barangay || !city) {
    return res.status(400).json({
      success: false,
      message: 'Choose a recognized Dagupan barangay and confirm Dagupan City'
    });
  }
  const reportingRestriction = getReportingRestriction(req.user);
  if (reportingRestriction.status === 'blocked') {
    return reportingBlockedResponse(res, reportingRestriction);
  }
  const coordinates = location.coordinates.map(Number);
  const locationIntegrity = buildLocationIntegrity(req.body.locationIntegrity, coordinates);
  const files = getUploadedEvidenceFiles(req);
  const privacyAcknowledged = req.body.privacyAcknowledged === true || req.body.privacyAcknowledged === 'true';
  let uploadedImages = [];

  const possibleDuplicateCandidates = await findPossibleDuplicateCandidates({
    category,
    coordinates
  });

  try {
    let images = normalizeLegacyImages(req.body.images, privacyAcknowledged);
    let aiAnalysis;

    if (files.length) {
      const processedEvidence = await processAndUploadEvidence(files, {
        reporterId: req.user._id.toString(),
        category,
        privacyAcknowledged
      });
      uploadedImages = processedEvidence.images;
      images = [...images, ...uploadedImages];
      aiAnalysis = processedEvidence.aiAnalysis || undefined;
    }

    const incident = await Incident.create({
      reporter: req.user._id,
      category,
      subcategory,
      description,
      location: {
        ...location,
        type: 'Point',
        coordinates,
        address: {
          ...location.address,
          barangay,
          city: DAGUPAN_CITY
        }
      },
      locationIntegrity,
      images,
      aiAnalysis,
      sla: {
        state: 'not_started'
      },
      status: 'submitted',
      duplicateCandidates: possibleDuplicateCandidates,
      duplicateDetection: {
        checkedAt: new Date(),
        candidateCount: possibleDuplicateCandidates.length
      },
      statusHistory: [{
        status: 'submitted',
        changedBy: req.user._id,
        notes: 'Incident reported'
      }]
    });

    await createAuditLog({
      action: 'incident_created',
      performedBy: req.user._id,
      resourceType: 'Incident',
      resourceId: incident._id,
      details: {
        reportNumber: incident.reportNumber,
        category: incident.category,
        barangay,
        possibleDuplicateCandidateCount: possibleDuplicateCandidates.length,
        privacyAcknowledged
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    await notifySafely({
      recipient: incident.reporter,
      ...notificationTemplates.incidentSubmitted(incident.reportNumber),
      data: { incidentId: incident._id, link: `/incidents/${incident._id}` }
    });

    if (uploadedImages.length) {
      await createAuditLog({
        action: 'file_uploaded',
        performedBy: req.user._id,
        resourceType: 'Incident',
        resourceId: incident._id,
        details: { evidenceCount: uploadedImages.length },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    if (incident.aiAnalysis) {
      const requestedAnalysisStatus = incident.aiAnalysis.analysisStatus;
      const analysisStatus = ['completed', 'unavailable', 'failed'].includes(requestedAnalysisStatus)
        ? requestedAnalysisStatus
        : 'unavailable';
      await createAuditLog({
        action: `ai_analysis_${analysisStatus}`,
        performedBy: req.user._id,
        resourceType: 'Incident',
        resourceId: incident._id,
        status: analysisStatus === 'failed' ? 'warning' : 'success',
        details: {
          analysisStatus,
          requiresManualReview: true,
          advisoryOnly: true,
          hazardType: incident.aiAnalysis.hazardType || null,
          confidence: Number(incident.aiAnalysis.confidence) || 0,
          detections: {
            roadDamage: Number(incident.aiAnalysis.detections?.roadDamage) || 0,
            cracks: Number(incident.aiAnalysis.detections?.cracks) || 0
          }
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      data: await serializeIncidentForCitizen(incident)
    });
  } catch (error) {
    // If database persistence fails after storage succeeds, remove the
    // private objects rather than leaving orphaned citizen evidence behind.
    if (uploadedImages.length) {
      await cleanupEvidence(uploadedImages);
    }
    throw error;
  }
});

// @desc    Get canonical Dagupan barangays for authenticated client selection
// @route   GET /api/v1/incidents/barangays
// @access  Private
exports.getBarangays = (req, res) => res.status(200).json({
  success: true,
  data: DAGUPAN_BARANGAYS
});

// @desc    Get incidents visible to the current user
// @route   GET /api/v1/incidents
// @access  Private
exports.getIncidents = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    priority,
    category,
    barangay,
    search,
    sortBy = '-createdAt'
  } = req.query;
  const numericPage = Number(page);
  const numericLimit = Number(limit);
  const allowedSorts = new Set(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'status', '-status', 'priority', '-priority']);
  const safeSortBy = allowedSorts.has(sortBy) ? sortBy : '-createdAt';
  const filter = {};

  if (req.user.role === "utility_provider" && req.query.withoutWorkOrder === "true") filter.workOrder = null;
  if (status) filter.status = status;
  if (req.user.role === 'citizen') {
    if (req.query.reportView === 'active') filter.status = { $nin: ['resolved', 'closed', 'rejected', 'duplicate'] };
    if (req.query.reportView === 'resolved') filter.status = { $in: ['resolved', 'closed'] };
    if (req.query.reportView === 'in_progress') filter.status = 'in_progress';
  }
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (barangay && !['barangay_official', 'citizen'].includes(req.user.role)) {
    filter['location.address.barangay'] = barangay;
  }
  if (search) {
    // Treat search as literal text.  This avoids allowing an arbitrary
    // regular expression through the general incident list endpoint while
    // keeping the same reference/description lookup behavior as the
    // validation queue.
    const safeSearch = escapeRegex(search).slice(0, 100);
    const categoryMatches = require('../utils/incidentCategories').DEFAULT_INCIDENT_CATEGORIES
      .filter(item => item.name.toLowerCase().includes(String(search).trim().toLowerCase())).map(item => item.code);
    filter.$or = [
      ...(categoryMatches.length ? [{ category: { $in: categoryMatches } }] : []),
      { reportNumber: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
      ...['category', 'location.address.street', 'location.address.barangay', 'location.address.city'].map(field => ({ [field]: { $regex: safeSearch, $options: 'i' } }))
    ];
  }

  const criteria = combineIncidentFilters(buildIncidentScope(req.user), filter);
  const incidents = await Incident.find(criteria)
    .populate('reporter', 'firstName lastName')
    .populate('validatedBy', 'firstName lastName')
    .populate('workOrder', 'orderNumber status assignmentState progressPercent progressStage readyForCompletionAt updatedAt')
    .sort(safeSortBy)
    .limit(numericLimit)
    .skip((numericPage - 1) * numericLimit);
  const total = await Incident.countDocuments(criteria);
  const data = req.user.role === 'citizen'
    ? await Promise.all(incidents.map(serializeIncidentForCitizen))
    : await Promise.all(incidents.map((incident) => serializeIncidentForOfficial(incident, { includeHistory: false })));

  res.status(200).json({
    success: true,
    data,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      pages: Math.ceil(total / numericLimit)
    }
  });
});

// @desc    Get the current citizen's reports
// @route   GET /api/v1/incidents/my
// @access  Private (Citizen)
exports.getMyIncidents = asyncHandler(async (req, res) => {
  if (req.user.role !== 'citizen') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is available to citizen accounts only'
    });
  }

  return exports.getIncidents(req, res);
});

const findIncidentForRead = async (req, res) => {
  const criteria = combineIncidentFilters(
    { _id: req.params.id },
    buildIncidentScope(req.user)
  );
  const incident = await Incident.findOne(criteria)
    .populate('reporter', 'firstName lastName')
    .populate('validatedBy', 'firstName lastName')
    .populate('duplicateOf', 'reportNumber');
  if (incident && typeof incident.populate === 'function') {
    await incident.populate('workOrder', 'orderNumber status assignmentState progressPercent progressStage readyForCompletionAt updatedAt');
  }

  if (!incident) {
    // A scoped query intentionally does not reveal whether a private report
    // exists outside the caller's jurisdiction.
    res.status(404).json({ success: false, message: 'Incident not found' });
    return null;
  }

  return incident;
};

// @desc    Get a single incident
// @route   GET /api/v1/incidents/:id
// @access  Private
exports.getIncident = asyncHandler(async (req, res) => {
  const incident = await findIncidentForRead(req, res);
  if (!incident) return;

  res.status(200).json({
    success: true,
    data: req.user.role === 'citizen'
      ? await serializeIncidentForCitizen(incident)
      : await serializeIncidentForOfficial(incident, { includeCandidates: true })
  });
});

// @desc    Get a citizen-safe incident status timeline
// @route   GET /api/v1/incidents/:id/history
// @access  Private
exports.getIncidentHistory = asyncHandler(async (req, res) => {
  const incident = await findIncidentForRead(req, res);
  if (!incident) return;

  const data = req.user.role === 'citizen'
    ? serializeStatusHistoryForCitizen(incident.statusHistory || [])
    : (incident.statusHistory || []).map((entry) => ({
      status: entry.status,
      changedAt: entry.changedAt,
      notes: entry.notes,
      actorRole: entry.actorRole,
      metadata: entry.metadata
    }));

  res.status(200).json({ success: true, data });
});

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const asObjectId = (value) => (value?._id || value)?.toString();

const officialScope = (req) => combineIncidentFilters(buildIncidentScope(req.user));

const findScopedIncident = async (req, id = req.params.id, populate = true) => {
  const query = Incident.findOne(combineIncidentFilters({ _id: id }, officialScope(req)));
  if (!populate) return query;
  return query
    .populate('reporter', 'firstName lastName')
    .populate('validatedBy', 'firstName lastName')
    .populate('duplicateOf', 'reportNumber')
    .populate('workOrder', 'orderNumber status assignmentState progressPercent progressStage readyForCompletionAt updatedAt');
};

const respondNotFound = (res) => {
  res.status(404).json({ success: false, message: 'Incident not found' });
  return null;
};

const respondConflict = (res) => {
  res.status(transitionConflict().status).json({
    success: false,
    message: transitionConflict().message
  });
  return null;
};

const notifySafely = async (notification) => {
  try {
    await createNotification(notification);
  } catch (error) {
    // The durable decision is never rolled back because optional push delivery
    // is unavailable. The notification model remains the source of truth when
    // providers are configured.
    logger.warn(`Could not persist a decision notification: ${error.message}`);
  }
};

const notifyRoutingOfficials = async (incident) => {
  const routing = incident.routing || {};
  if (routing.responsibleRole !== 'utility_provider' || !routing.responsibleOrganization) return;
  const criteria = {
    role: 'utility_provider',
    utilityCompany: routing.responsibleOrganization,
    isActive: true,
    isArchived: { $ne: true }
  };

  const recipients = await User.find(criteria).select('_id');
  await Promise.all(recipients.map((recipient) => notifySafely({
    recipient: recipient._id,
    type: 'incident_routed',
    title: 'Incident routed to your organization',
    message: `Incident ${incident.reportNumber} requires review by ${routing.responsibleOrganization}.`,
    data: { incidentId: incident._id, link: `/incidents/${incident._id}` },
    priority: incident.priority === 'critical' ? 'urgent' : incident.priority
  })));
};

const recordOfficialAction = async ({ action, incident, req, details, changes }) => {
  await createAuditLog({
    action,
    performedBy: req.user._id,
    resourceType: 'Incident',
    resourceId: incident._id,
    details,
    changes,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
};

const normalizeJurisdiction = (incident, input = {}) => {
  const fallback = defaultJurisdictionFor(incident);
  return {
    ...fallback,
    barangay: canonicalizeBarangay(
      normalizeText(input.barangay) || fallback.barangay
    ),
    city: canonicalizeDagupanCity(normalizeText(input.city) || fallback.city)
  };
};

const normalizeRouting = (input = {}) => {
  return {
    responsibleOrganization: normalizeText(input.responsibleOrganization),
    responsibleRole: input.responsibleRole,
    reason: normalizeText(input.reason)
  };
};

// Routing must name the selected Utility Provider explicitly.
const hasCompleteRoutingInput = (input = {}) => {
  const organization = normalizeText(input.responsibleOrganization);
  const role = normalizeText(input.responsibleRole);
  return Boolean(organization) && RESPONSIBLE_ROLES.includes(role);
};

const pushRoutingHistory = (previous, next, actor, now) => ([
  ...(previous?.history || []),
  {
    fromOrganization: previous?.responsibleOrganization,
    fromRole: previous?.responsibleRole,
    toOrganization: next.responsibleOrganization,
    toRole: next.responsibleRole,
    reason: next.reason,
    routedBy: actor,
    routedAt: now
  }
]);

const transitionIncidentDecision = async (req, res, nextStatus, fields, notes, metadata) => {
  const before = await findScopedIncident(req);
  if (!before) return respondNotFound(res);
  if (!canTransitionIncident(before.status, nextStatus)) return respondConflict(res);
  const transition = buildIncidentTransition({
    currentStatus: before.status,
    nextStatus,
    actor: req.user._id,
    actorRole: req.user.role,
    fields,
    notes,
    metadata
  });
  const filter = combineIncidentFilters({ _id: before._id }, officialScope(req), transition.filter);
  const updated = await Incident.findOneAndUpdate(filter, transition.update, {
    new: true,
    runValidators: true
  }).populate('reporter', 'firstName lastName').populate('duplicateOf', 'reportNumber');

  if (!updated) return respondConflict(res);
  return updated;
};

// @desc    Get submitted incidents in the caller's server-enforced scope
// @route   GET /api/v1/incidents/pending-validation
exports.getPendingValidation = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    barangay,
    hasDuplicateCandidate,
    sortBy = '-createdAt',
    from,
    to
  } = req.query;
  const numericPage = Number(page);
  const numericLimit = Number(limit);
  const allowedSorts = new Set(['createdAt', '-createdAt', 'priority', '-priority']);
  const filter = req.user.role === 'city_engineer'
    ? { status: req.query.stage === 'confirmed' ? { $in: ['city_confirmed', 'prioritized'] } : 'barangay_validated' }
    : { status: { $in: ['submitted', 'clarification_required', 'barangay_validated', 'city_confirmed', 'prioritized'] } };

  if (category) filter.category = category;
  if (hasDuplicateCandidate === 'true') filter['duplicateDetection.candidateCount'] = { $gt: 0 };
  if (hasDuplicateCandidate === 'false') filter['duplicateDetection.candidateCount'] = { $lte: 0 };
  if (barangay && !['barangay_official', 'utility_provider'].includes(req.user.role)) {
    filter['location.address.barangay'] = barangay;
  }
  if (search) {
    const safeSearch = escapeRegex(search).slice(0, 100);
    filter.$or = [
      { reportNumber: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
      { 'location.address.street': { $regex: safeSearch, $options: 'i' } },
      { 'location.address.barangay': { $regex: safeSearch, $options: 'i' } }
    ];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
  }

  const criteria = combineIncidentFilters(officialScope(req), filter);
  const incidents = await Incident.find(criteria)
    .populate('reporter', 'firstName lastName')
    .sort(allowedSorts.has(sortBy) ? sortBy : '-createdAt')
    .limit(numericLimit)
    .skip((numericPage - 1) * numericLimit);
  const total = await Incident.countDocuments(criteria);
  const data = await Promise.all(incidents.map((incident) => serializeIncidentForOfficial(incident, { includeHistory: false })));

  res.status(200).json({
    success: true,
    data,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      pages: Math.ceil(total / numericLimit)
    }
  });
});

// @desc    Get advisory duplicate candidates that the official may review
// @route   GET /api/v1/incidents/:id/duplicate-candidates
exports.getDuplicateCandidates = asyncHandler(async (req, res) => {
  const incident = await findScopedIncident(req);
  if (!incident) return respondNotFound(res);
  const candidateById = new Map((incident.duplicateCandidates || []).map((candidate) => [
    asObjectId(candidate.incident), candidate
  ]));
  const ids = [...candidateById.keys()].filter(Boolean);
  const candidates = ids.length
    ? await Incident.find(combineIncidentFilters({ _id: { $in: ids } }, officialScope(req)))
    : [];
  const data = await Promise.all(candidates.map(async (candidate) => {
    const source = candidate.toObject ? candidate.toObject() : candidate;
    const metadata = candidateById.get(asObjectId(source._id));
    const images = await Promise.all((source.images || []).map(safeEvidenceForCitizen));
    return {
      id: asObjectId(source._id),
      reportNumber: source.reportNumber,
      category: source.category,
      status: source.status,
      submittedAt: source.createdAt,
      location: source.location,
      distanceMeters: metadata?.distanceMeters,
      score: metadata?.score,
      evidenceUrl: images[0]?.url || null
    };
  }));
  res.status(200).json({ success: true, data });
});

// @desc    Get the SLA foundation for an authorized incident
// @route   GET /api/v1/incidents/:id/sla
exports.getIncidentSLA = asyncHandler(async (req, res) => {
  const incident = await findScopedIncident(req, req.params.id, false);
  if (!incident) return respondNotFound(res);
  res.status(200).json({
    success: true,
    data: {
      incidentId: incident._id,
      priority: incident.priority,
      targetResolutionTime: incident.sla?.targetResolutionTime,
      startedAt: incident.sla?.startedAt,
      deadline: incident.sla?.deadline,
      ...getSlaProjection(incident.sla)
    }
  });
});

// @desc    Barangay review validates a citizen report and forwards it to City Engineering.
// @route   POST /api/v1/incidents/:id/validate
exports.validateIncident = asyncHandler(async (req, res) => {
  if (req.user.role !== 'barangay_official') {
    return res.status(403).json({ success: false, message: 'Only the assigned Barangay Official may perform initial validation' });
  }
  const before = await findScopedIncident(req);
  if (!before) return respondNotFound(res);
  if (!['submitted', 'clarification_required'].includes(before.status)) return respondConflict(res);
  const jurisdiction = normalizeJurisdiction(before, req.body.jurisdiction || {});
  if (!jurisdiction.barangay || !jurisdiction.city) {
    return res.status(400).json({ success: false, message: 'Choose a recognized Dagupan barangay' });
  }
  if (!canConfirmJurisdiction(req.user, jurisdiction)) {
    return res.status(403).json({ success: false, message: 'You are not authorized to confirm this jurisdiction' });
  }
  const now = new Date();
  const reviewedJurisdiction = {
    ...jurisdiction,
    confirmedBy: req.user._id,
    confirmedAt: now
  };
  const updated = await transitionIncidentDecision(
    req,
    res,
    'barangay_validated',
    {
      validatedBy: req.user._id,
      validatedAt: now,
      jurisdiction: reviewedJurisdiction,
      clarificationReason: undefined,
      clarificationRequestedBy: undefined,
      clarificationRequestedAt: undefined
    },
    normalizeText(req.body.notes) || 'Barangay validation completed; ready for provider routing',
    {
      jurisdiction: {
        barangay: reviewedJurisdiction.barangay,
        city: reviewedJurisdiction.city
      }
    }
  );
  if (!updated) return;

  await recordOfficialAction({
    action: 'incident_barangay_validated',
    incident: updated,
    req,
    details: { jurisdiction: reviewedJurisdiction },
    changes: { before: { status: before.status }, after: { status: 'barangay_validated' } }
  });
  await notifySafely({
    recipient: updated.reporter,
    ...notificationTemplates.incidentValidated(updated.reportNumber),
    data: { incidentId: updated._id, link: `/incidents/${updated._id}` },
    priority: 'medium'
  });

  res.status(200).json({
    success: true,
    message: 'Incident validated by the Barangay Official; select priority and provider',
    data: await serializeIncidentForOfficial(updated, { includeCandidates: true })
  });
});

// @desc    Confirm a barangay-validated incident at City Engineering level
// @route   POST /api/v1/incidents/:id/confirm
exports.confirmIncident = asyncHandler(async (req, res) => {
  if (req.user.role !== 'city_engineer') {
    return res.status(403).json({ success: false, message: 'Only City Engineering may confirm an incident' });
  }
  const before = await findScopedIncident(req);
  if (!before) return respondNotFound(res);
  if (before.status !== 'barangay_validated') return respondConflict(res);
  const jurisdiction = normalizeJurisdiction(before, req.body.jurisdiction || {});
  if (!jurisdiction.barangay || !jurisdiction.city) {
    return res.status(400).json({ success: false, message: 'Choose a recognized Dagupan barangay for City Engineering review' });
  }
  const now = new Date();
  const confirmedJurisdiction = { ...jurisdiction, confirmedBy: req.user._id, confirmedAt: now };
  const updated = await Incident.findOneAndUpdate(
    { _id: before._id, status: 'barangay_validated' },
    {
      $set: { status: 'city_confirmed', cityConfirmedBy: req.user._id, cityConfirmedAt: now, jurisdiction: confirmedJurisdiction },
      $push: { statusHistory: {
        status: 'city_confirmed', changedBy: req.user._id, actorRole: req.user.role,
        changedAt: now, notes: normalizeText(req.body.notes) || 'City Engineering confirmed the incident',
        metadata: { barangay: confirmedJurisdiction.barangay, city: confirmedJurisdiction.city }
      } }
    },
    { new: true, runValidators: true }
  ).populate('reporter', 'firstName lastName');
  if (!updated) return respondConflict(res);
  await recordOfficialAction({
    action: 'incident_city_confirmed', incident: updated, req,
    details: { jurisdiction: confirmedJurisdiction },
    changes: { before: { status: 'barangay_validated' }, after: { status: 'city_confirmed' } }
  });
  await notifySafely({
    recipient: updated.reporter,
    type: 'incident_validated',
    title: 'City Engineering confirmed your report',
    message: `Incident ${updated.reportNumber} has been confirmed for engineering response.`,
    data: { incidentId: updated._id, link: `/incidents/${updated._id}` }
  });
  res.status(200).json({ success: true, message: 'Incident confirmed by City Engineering', data: await serializeIncidentForOfficial(updated) });
});

// @desc    Return a barangay-validated incident for clarification with a reason
// @route   POST /api/v1/incidents/:id/clarification
exports.requestIncidentClarification = asyncHandler(async (req, res) => {
  if (req.user.role !== 'city_engineer') {
    return res.status(403).json({ success: false, message: 'Only City Engineering may request clarification' });
  }
  const reason = normalizeText(req.body.reason);
  if (!reason) return res.status(400).json({ success: false, message: 'A clarification reason is required' });
  const before = await findScopedIncident(req);
  if (!before) return respondNotFound(res);
  if (before.status !== 'barangay_validated') return respondConflict(res);
  const now = new Date();
  const updated = await Incident.findOneAndUpdate(
    { _id: before._id, status: 'barangay_validated' },
    {
      $set: { status: 'clarification_required', clarificationReason: reason, clarificationRequestedBy: req.user._id, clarificationRequestedAt: now },
      $push: { statusHistory: {
        status: 'clarification_required', changedBy: req.user._id, actorRole: req.user.role,
        changedAt: now, notes: reason, metadata: { returnTo: 'barangay_official' }
      } }
    },
    { new: true, runValidators: true }
  ).populate('reporter', 'firstName lastName');
  if (!updated) return respondConflict(res);
  await recordOfficialAction({
    action: 'incident_clarification_requested', incident: updated, req,
    details: { reason, returnTo: 'barangay_official' },
    changes: { before: { status: 'barangay_validated' }, after: { status: 'clarification_required' } }
  });
  await notifySafely({
    recipient: updated.reporter, type: 'status_update', title: 'More information is needed',
    message: `City Engineering returned incident ${updated.reportNumber} for clarification: ${reason}`,
    data: { incidentId: updated._id, link: `/incidents/${updated._id}` }
  });
  res.status(200).json({ success: true, message: 'Incident returned for clarification', data: await serializeIncidentForOfficial(updated) });
});

// @desc    Reject a submitted incident with a required citizen-visible reason
// @route   POST /api/v1/incidents/:id/reject
exports.rejectIncident = asyncHandler(async (req, res) => {
  const reason = normalizeText(req.body.reason);
  if (!reason) return res.status(400).json({ success: false, message: 'A rejection reason is required' });
  const notes = normalizeText(req.body.notes);
  const now = new Date();
  const updated = await transitionIncidentDecision(
    req,
    res,
    'rejected',
    {
      rejectionReason: reason,
      rejectionNotes: notes || undefined,
      rejectedBy: req.user._id,
      rejectedAt: now,
      'sla.state': 'cancelled', 'sla.isOverdue': false
    },
    reason,
    { reason }
  );
  if (!updated) return;

  await recordOfficialAction({
    action: 'incident_rejected',
    incident: updated,
    req,
    details: { reason, notes: notes || undefined },
    changes: { before: { status: 'submitted' }, after: { status: 'rejected' } }
  });
  await notifySafely({
    recipient: updated.reporter,
    ...(notificationTemplates.incidentRejected
      ? notificationTemplates.incidentRejected(updated.reportNumber, reason)
      : { type: 'status_update', title: 'Report Rejected', message: `Your incident report ${updated.reportNumber} was rejected: ${reason}` }),
    data: { incidentId: updated._id, link: `/incidents/${updated._id}` }
  });

  res.status(200).json({
    success: true,
    message: 'Incident rejected',
    data: await serializeIncidentForOfficial(updated, { includeCandidates: true })
  });
});

const wouldCreateDuplicateCycle = async (sourceId, target) => {
  const source = asObjectId(sourceId);
  let current = target;
  const visited = new Set();
  while (current) {
    const currentId = asObjectId(current._id || current);
    if (!currentId || visited.has(currentId)) return false;
    if (currentId === source) return true;
    visited.add(currentId);
    const nextId = asObjectId(current.duplicateOf);
    if (!nextId) return false;
    current = await Incident.findById(nextId).select('duplicateOf');
  }
  return false;
};

// @desc    Mark a submitted report as an auditable duplicate of a canonical report
// @route   POST /api/v1/incidents/:id/mark-duplicate
exports.markDuplicateIncident = asyncHandler(async (req, res) => {
  const duplicateOf = normalizeText(req.body.duplicateOf);
  const reason = normalizeText(req.body.reason);
  if (!duplicateOf || !reason) {
    return res.status(400).json({ success: false, message: 'A canonical incident and duplicate reason are required' });
  }
  const before = await findScopedIncident(req);
  if (!before) return respondNotFound(res);
  if (before.status !== 'submitted') return respondConflict(res);
  if (asObjectId(before._id) === duplicateOf) {
    return res.status(400).json({ success: false, message: 'A report cannot be marked as a duplicate of itself' });
  }
  const canonical = await Incident.findOne(combineIncidentFilters(
    { _id: duplicateOf },
    officialScope(req)
  )).select('reportNumber duplicateOf status');
  if (!canonical) return res.status(404).json({ success: false, message: 'The canonical incident was not found in your permitted scope' });
  if (await wouldCreateDuplicateCycle(before._id, canonical)) {
    return res.status(400).json({ success: false, message: 'This duplicate relationship would create a circular chain' });
  }
  const notes = normalizeText(req.body.notes);
  const now = new Date();
  const updated = await transitionIncidentDecision(
    req,
    res,
    'duplicate',
    {
      duplicateOf: canonical._id,
      duplicateReason: reason,
      duplicateNotes: notes || undefined,
      duplicateMarkedBy: req.user._id,
      duplicateMarkedAt: now,
      'sla.state': 'cancelled', 'sla.isOverdue': false
    },
    reason,
    { duplicateOf: canonical._id, canonicalReportNumber: canonical.reportNumber, reason }
  );
  if (!updated) return;

  await recordOfficialAction({
    action: 'incident_marked_duplicate',
    incident: updated,
    req,
    details: { duplicateOf: canonical._id, canonicalReportNumber: canonical.reportNumber, reason },
    changes: { before: { status: 'submitted' }, after: { status: 'duplicate' } }
  });
  await notifySafely({
    recipient: updated.reporter,
    ...(notificationTemplates.incidentDuplicate
      ? notificationTemplates.incidentDuplicate(updated.reportNumber, reason)
      : { type: 'duplicate_detected', title: 'Report marked as duplicate', message: `Your incident report ${updated.reportNumber} was marked as a duplicate: ${reason}` }),
    data: { incidentId: updated._id, link: `/incidents/${updated._id}` }
  });

  res.status(200).json({
    success: true,
    message: 'Incident marked as duplicate',
    data: await serializeIncidentForOfficial(updated, { includeCandidates: true })
  });
});

// @desc    Change priority after validation; raw status transitions stay unavailable
// @route   PATCH /api/v1/incidents/:id/priority
exports.updateIncidentPriority = asyncHandler(async (req, res) => {
  if (req.user.role !== 'barangay_official') {
    return res.status(403).json({ success: false, message: 'You are not authorized to change incident priority' });
  }
  const priority = String(req.body.priority || '').toLowerCase();
  if (!['critical', 'high', 'medium', 'low'].includes(priority)) {
    return res.status(400).json({ success: false, message: 'A valid priority is required' });
  }
  const before = await findScopedIncident(req);
  if (!before) return respondNotFound(res);
  if (!['barangay_validated', 'city_confirmed', 'prioritized'].includes(before.status)) {
    return res.status(409).json({ success: false, message: 'Barangay validation is required before assigning priority' });
  }
  const now = new Date();
  const updated = await Incident.findOneAndUpdate(
    combineIncidentFilters({ _id: before._id, status: before.status }, officialScope(req)),
    {
      $set: {
        status: 'prioritized',
        priority,
        priorityAssignedBy: req.user._id,
        priorityAssignedAt: now,
        sla: { targetResolutionTime: initializeIncidentSLA(priority, now).targetResolutionTime, state: 'not_started', isOverdue: false, escalationLevel: 0, remindersSent: 0 }
      },
      $push: {
        statusHistory: {
          status: 'prioritized',
          changedBy: req.user._id,
          actorRole: req.user.role,
          changedAt: now,
          notes: `Barangay Official assigned ${priority} priority and calculated the SLA deadline`,
          metadata: { priority, targetResolutionTime: initializeIncidentSLA(priority, now).targetResolutionTime }
        }
      }
    },
    { new: true, runValidators: true }
  ).populate('reporter', 'firstName lastName');
  if (!updated) return respondConflict(res);
  await recordOfficialAction({
    action: 'incident_priority_assigned',
    incident: updated,
    req,
    details: { priority },
    changes: { before: { status: before.status, priority: before.priority }, after: { status: 'prioritized', priority } }
  });
  res.status(200).json({ success: true, message: 'Incident priority updated', data: await serializeIncidentForOfficial(updated) });
});

// @desc    Confirm/correct a validated incident's jurisdiction
// @route   PATCH /api/v1/incidents/:id/jurisdiction
exports.updateIncidentJurisdiction = asyncHandler(async (req, res) => {
  if (req.user.role !== 'city_engineer') {
    return res.status(403).json({ success: false, message: 'Only City Engineering may confirm the city jurisdiction' });
  }
  const before = await findScopedIncident(req);
  if (!before) return respondNotFound(res);
  if (before.status !== 'city_confirmed') {
    return res.status(409).json({ success: false, message: 'Jurisdiction can only be confirmed during City Engineering review' });
  }
  const jurisdiction = normalizeJurisdiction(before, req.body);
  if (!jurisdiction.barangay || !jurisdiction.city) {
    return res.status(400).json({ success: false, message: 'Choose a recognized Dagupan barangay' });
  }
  if (!canConfirmJurisdiction(req.user, jurisdiction)) {
    return res.status(403).json({ success: false, message: 'You are not authorized to set this jurisdiction' });
  }
  const now = new Date();
  const value = { ...jurisdiction, confirmedBy: req.user._id, confirmedAt: now };
  const updated = await Incident.findOneAndUpdate(
    combineIncidentFilters({ _id: before._id, status: 'city_confirmed' }, officialScope(req)),
    {
      $set: { jurisdiction: value },
      $push: {
        statusHistory: {
          status: 'jurisdiction_updated',
          changedBy: req.user._id,
          actorRole: req.user.role,
          changedAt: now,
          notes: 'Jurisdiction confirmed',
          metadata: { barangay: value.barangay, city: value.city }
        }
      }
    },
    { new: true, runValidators: true }
  ).populate('reporter', 'firstName lastName');
  if (!updated) return respondConflict(res);
  await recordOfficialAction({
    action: 'incident_jurisdiction_updated',
    incident: updated,
    req,
    details: { jurisdiction: value },
    changes: { before: { jurisdiction: before.jurisdiction }, after: { jurisdiction: value } }
  });
  res.status(200).json({ success: true, message: 'Incident jurisdiction updated', data: await serializeIncidentForOfficial(updated) });
});

// @desc    Route a validated incident and create its primary work order
// @route   POST /api/v1/incidents/:id/route
exports.routeIncident = asyncHandler(async (req, res) => {
  if (req.user.role !== 'barangay_official') {
    return res.status(403).json({ success: false, message: 'Only the assigned Barangay Official may route a report' });
  }
  const before = await findScopedIncident(req);
  if (!before) return respondNotFound(res);
  if (before.status !== 'prioritized' || !before.priority) {
    return res.status(409).json({ success: false, message: 'Assign priority before routing to a Utility Provider' });
  }
  const jurisdiction = normalizeJurisdiction(before, before.jurisdiction || {});
  if (!hasCompleteRoutingInput(req.body)) {
    return res.status(400).json({ success: false, message: 'Routing must include both a responsible organization and a valid responsible role' });
  }
  const route = normalizeRouting(req.body);
  if (!route.responsibleOrganization || route.responsibleRole !== 'utility_provider'
    || !canRouteIncident(req.user, route, jurisdiction)) {
    return res.status(403).json({ success: false, message: 'You are not authorized to route this incident to that organization' });
  }
  const providerAccount = await User.findOne({
    role: 'utility_provider',
    utilityCompany: route.responsibleOrganization,
    isActive: true,
    isArchived: { $ne: true }
  }).select('_id');
  if (!providerAccount) {
    return res.status(400).json({ success: false, message: 'No active Utility Provider account is provisioned for that organization' });
  }
  const now = new Date();
  const routing = {
    ...route,
    routedBy: req.user._id,
    routedAt: now,
    history: pushRoutingHistory(before.routing, route, req.user._id, now)
  };
  const sla = initializeIncidentSLA(before.priority, now);
  let workOrder;
  try {
    workOrder = await WorkOrder.create({ incident: before._id, responsibleOrganization: route.responsibleOrganization,
      responsibleRole: 'utility_provider', jurisdiction, priority: before.priority, createdBy: req.user._id,
      status: 'pending', assignmentState: 'unassigned', progressPercent: 0, progressStage: 'assigned', sla,
      history: [{ type: 'created', actor: req.user._id, actorRole: req.user.role, status: 'pending',
        notes: 'Work order created when the Barangay Official assigned the Utility Provider', createdAt: now }] });
  } catch (error) {
    if (error.code === 11000) return respondConflict(res);
    throw error;
  }
  let updated;
  try {
    updated = await Incident.findOneAndUpdate(
    combineIncidentFilters({ _id: before._id, status: 'prioritized' }, officialScope(req)),
    {
      $set: {
        status: 'provider_assigned',
        routing,
        assignedUtility: providerAccount._id,
        providerAssignedBy: req.user._id,
        providerAssignedAt: now,
        sla,
        workOrder: workOrder._id
      },
      $push: {
        statusHistory: {
          status: 'provider_assigned',
          changedBy: req.user._id,
          actorRole: req.user.role,
          changedAt: now,
          notes: route.reason || `Routed to ${route.responsibleOrganization}`,
          metadata: { responsibleOrganization: route.responsibleOrganization, responsibleRole: route.responsibleRole }
        }
      }
    },
    { new: true, runValidators: true }
  ).populate('reporter', 'firstName lastName');
  } catch (error) {
    await WorkOrder.deleteOne({ _id: workOrder._id });
    throw error;
  }
  if (!updated) {
    await WorkOrder.deleteOne({ _id: workOrder._id });
    return respondConflict(res);
  }
  await recordOfficialAction({
    action: 'incident_routed',
    incident: updated,
    req,
    details: { routing: route },
    changes: { before: { status: before.status, routing: before.routing }, after: { status: 'provider_assigned', routing } }
  });
  await notifyRoutingOfficials(updated);
  res.status(200).json({ success: true, message: 'Incident routed successfully', data: await serializeIncidentForOfficial(updated) });
});

// @desc    Update non-workflow notes only. Status, priority, and decisions have
//          dedicated protected endpoints above.
// @route   PUT /api/v1/incidents/:id
exports.updateIncident = asyncHandler(async (req, res) => {
  if (['status', 'priority', 'rejectionReason', 'duplicateOf'].some((field) => field in req.body)) {
    return res.status(400).json({ success: false, message: 'Use the controlled validation, priority, jurisdiction, or routing endpoints for workflow changes' });
  }
  const notes = normalizeText(req.body.notes);
  if (!notes) return res.status(400).json({ success: false, message: 'Only a non-empty note can be updated on this endpoint' });
  const updated = await Incident.findOneAndUpdate(
    combineIncidentFilters({ _id: req.params.id }, officialScope(req)),
    { $set: { notes } },
    { new: true, runValidators: true }
  ).populate('reporter', 'firstName lastName');
  if (!updated) return respondNotFound(res);
  await recordOfficialAction({ action: 'incident_updated', incident: updated, req, details: { notes } });
  res.status(200).json({ success: true, message: 'Incident note updated', data: await serializeIncidentForOfficial(updated) });
});

// @desc    Get nearby incidents for authorized operational users
// @route   GET /api/v1/incidents/nearby
// @access  Private (Officials and repair personnel)
exports.getNearbyIncidents = asyncHandler(async (req, res) => {
  const { longitude, latitude, maxDistance = 5000 } = req.query;
  const parsedLongitude = Number(longitude);
  const parsedLatitude = Number(latitude);

  if (!Number.isFinite(parsedLongitude) || !Number.isFinite(parsedLatitude)) {
    return res.status(400).json({
      success: false,
      message: 'Longitude and latitude are required'
    });
  }

  const incidents = await Incident.find(combineIncidentFilters(
    buildIncidentScope(req.user),
    {
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parsedLongitude, parsedLatitude] },
          $maxDistance: Math.min(Number(maxDistance) || 5000, 10000)
        }
      },
      status: { $nin: ['rejected', 'closed'] }
    }
  )).limit(20);

  // Operational map results must not serialize the full document, which now
  // contains restricted false-report review records.
  const data = await Promise.all(incidents.map((incident) => serializeIncidentForOfficial(incident, {
    includeHistory: false, includeLocationIntegrity: false
  })));
  res.status(200).json({ success: true, data, count: data.length });
});

// @desc    Delete incident
// @route   DELETE /api/v1/incidents/:id
// @access  Private (Admin only)
exports.deleteIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  await incident.deleteOne();
  await createAuditLog({
    action: 'incident_deleted',
    performedBy: req.user._id,
    resourceType: 'Incident',
    resourceId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({ success: true, message: 'Incident deleted successfully' });
});

exports.serializeIncidentForCitizen = serializeIncidentForCitizen;
exports.serializeIncidentForOfficial = serializeIncidentForOfficial;
