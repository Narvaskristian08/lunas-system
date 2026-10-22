import { loadPeriodReports } from "@/lib/report-export.server";
import { reportAnchor, reportRange } from "@/lib/report-export";
import { normalizeAgencySchedule, type AgencySchedule } from "@/lib/agency-schedule";
import "server-only";

import { backendRequest, responseData } from "@/lib/api/backend.server";
import { requireAccessToken } from "@/lib/auth/dal.server";

export type ValidationPriority = "critical" | "high" | "medium" | "low";

export interface ValidationQueueFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  jurisdiction?: string;
  duplicate?: "yes" | "no";
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "createdAt_desc" | "createdAt_asc" | "priority_desc";
}

export interface ValidationPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ValidationEvidence {
  url?: string | null;
  uploadedAt?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  aiFindings: ValidationAiFinding[];
  quality?: { status?: string; issues?: string[] };
  privacyProcessing?: {
    status?: string;
    applied?: boolean;
    acknowledgedByReporter?: boolean;
    detectedRegions?: number;
  };
}

export interface ValidationLocation {
  coordinates: [number, number] | [];
  address: {
    street?: string;
    barangay?: string;
    city?: string;
    landmark?: string;
  };
}

export interface ValidationHistoryEntry {
  status: string;
  changedAt?: string;
  notes?: string;
}

export type ValidationAiAnalysisStatus = "completed" | "unavailable" | "failed";

export interface ValidationAiFinding {
  label: string;
  confidence: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
  confidenceStatus?: "production" | "manual_review";
  productionThreshold?: number;
}

export interface DuplicateCandidate {
  id: string;
  reportNumber: string;
  category?: string;
  status?: string;
  submittedAt?: string;
  location?: ValidationLocation;
  distanceMeters?: number;
  score?: number;
  evidenceUrl?: string | null;
}

export interface ValidationIncident {
  id: string;
  reportNumber: string;
  category: string;
  subcategory?: string;
  description: string;
  status: string;
  agencyStatus?: string;
  agencyStatusNote?: string;
  agencySchedule?: AgencySchedule;
  priority?: ValidationPriority;
  createdAt?: string;
  updatedAt?: string;
  reporter?: { id: string; firstName?: string; lastName?: string };
  location: ValidationLocation;
  images: ValidationEvidence[];
  evidenceThumbnail?: string | null;
  aiAnalysis?: {
    analysisStatus?: ValidationAiAnalysisStatus;
    classificationStatus?: "production" | "manual_review" | "no_detection";
    category?: string;
    model?: string;
    modelAvailable?: boolean;
    manualReviewOnly?: boolean;
    detected?: boolean;
    hazardType?: string;
    confidence?: number;
    findingsCount?: number;
    findings?: ValidationAiFinding[];
    detections?: {
      roadDamage: number;
      cracks: number;
    };
    requiresManualReview: true;
    advisoryOnly: true;
    processedAt?: string;
  };
  locationIntegrity?: {
    pinSource?: string;
    comparison?: string;
    unavailableReason?: string;
    distanceMeters?: number;
    accuracyMeters?: number;
    explanation?: { reason?: string; text?: string };
    confirmedAt?: string;
  };
  duplicateCandidateCount: number;
  initialInspection?: { id?: string; status?: string; findings?: string; result?: string; submittedAt?: string; evidence?: ValidationEvidence[] };
  completionInspection?: { id?: string; status?: string; findings?: string; result?: string; submittedAt?: string; evidence?: ValidationEvidence[] };
  duplicateCandidates: DuplicateCandidate[];
  history: ValidationHistoryEntry[];
  jurisdiction?: string;
  responsibleOrganization?: string;
  routing?: {
    responsibleOrganization?: string;
    responsibleRole?: "utility_provider";
    routedAt?: string;
    routedBy?: string;
  };
  sla?: {
    priority?: ValidationPriority;
    targetResolutionTime?: number;
    startedAt?: string;
    deadline?: string;
    state?: string;
  };
  workOrder?: {
    id: string;
    reference?: string;
    status?: string;
    progressPercent?: number;
    stage?: string;
  };
  rejectionReason?: string;
  clarificationReason?: string;
  duplicateOf?: { id?: string; reportNumber?: string } | string;
}

export interface ValidationSummary {
  pending: number;
  validated: number;
  rejected: number;
  duplicate: number;
}

export interface ValidationQueueData {
  incidents: ValidationIncident[];
  pagination: ValidationPagination;
  categories: string[];
  categoryOptions?: Array<{ value: string; label: string }>;
}

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ApiRecord : {};
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeFinding(value: unknown): ValidationAiFinding | null {
  const source = asRecord(value);
  const bbox = asRecord(source.bbox);
  const values = ["x1", "y1", "x2", "y2"].map((key) => asNumber(bbox[key]));
  const label = asString(source.label);
  if (!label || values.some((number) => number === undefined)) return null;
  const [x1, y1, x2, y2] = values as number[];
  const clamp = (number: number) => Math.max(0, Math.min(1, number));
  const normalized = { x1: clamp(x1), y1: clamp(y1), x2: clamp(x2), y2: clamp(y2) };
  if (normalized.x2 < normalized.x1 || normalized.y2 < normalized.y1) return null;
  return {
    label: label.slice(0, 100),
    confidence: clamp(asNumber(source.confidence) ?? 0),
    bbox: normalized,
    ...(source.confidenceStatus === "production" || source.confidence_status === "production"
      ? { confidenceStatus: "production" as const }
      : source.confidenceStatus === "manual_review" || source.confidence_status === "manual_review"
        ? { confidenceStatus: "manual_review" as const }
        : {}),
    ...(asNumber(source.productionThreshold) !== undefined
      ? { productionThreshold: clamp(asNumber(source.productionThreshold) ?? 0) }
      : asNumber(source.production_threshold) !== undefined
        ? { productionThreshold: clamp(asNumber(source.production_threshold) ?? 0) }
        : {}),
  };
}

function normalizedId(value: unknown): string {
  const record = asRecord(value);
  return asString(value) ?? asString(record.id) ?? asString(record._id) ?? "";
}

function normalizeLocation(value: unknown): ValidationLocation {
  const location = asRecord(value);
  const rawCoordinates = asArray(location.coordinates)
    .map(asNumber)
    .filter((coordinate): coordinate is number => coordinate !== undefined);
  const address = asRecord(location.address);
  return {
    coordinates: rawCoordinates.length >= 2 ? [rawCoordinates[0], rawCoordinates[1]] : [],
    address: {
      street: asString(address.street),
      barangay: asString(address.barangay),
      city: asString(address.city),
      landmark: asString(address.landmark),
    },
  };
}

function normalizeEvidence(value: unknown): ValidationEvidence {
  const source = asRecord(value);
  const quality = asRecord(source.quality);
  const privacy = asRecord(source.privacyProcessing);
  return {
    url: asString(source.url) ?? null,
    uploadedAt: asString(source.uploadedAt),
    mimeType: asString(source.mimeType),
    width: asNumber(source.width),
    height: asNumber(source.height),
    aiFindings: asArray(source.aiFindings)
      .map(normalizeFinding)
      .filter((finding): finding is ValidationAiFinding => finding !== null)
      .slice(0, 50),
    quality: Object.keys(quality).length ? {
      status: asString(quality.status),
      issues: asArray(quality.issues).map(asString).filter((item): item is string => Boolean(item)),
    } : undefined,
    privacyProcessing: Object.keys(privacy).length ? {
      status: asString(privacy.status),
      applied: privacy.applied === true,
      acknowledgedByReporter: privacy.acknowledgedByReporter === true,
      detectedRegions: asNumber(privacy.detectedRegions),
    } : undefined,
  };
}

function normalizeHistory(value: unknown): ValidationHistoryEntry {
  const source = asRecord(value);
  return {
    status: asString(source.status) ?? "updated",
    changedAt: asString(source.changedAt) ?? asString(source.createdAt),
    notes: asString(source.notes),
  };
}

function normalizeCandidate(value: unknown): DuplicateCandidate | null {
  const source = asRecord(value);
  const incident = asRecord(source.incident);
  const candidate = Object.keys(incident).length ? incident : source;
  const id = normalizedId(candidate) || normalizedId(source.incident);
  if (!id) return null;
  const images = asArray(candidate.images).map(normalizeEvidence);
  return {
    id,
    reportNumber: asString(source.reportNumber) ?? asString(candidate.reportNumber) ?? `Report ${id.slice(-6)}`,
    category: asString(candidate.category) ?? asString(source.category),
    status: asString(candidate.status) ?? asString(source.status),
    submittedAt: asString(candidate.createdAt) ?? asString(source.createdAt),
    location: normalizeLocation(candidate.location ?? source.location),
    distanceMeters: asNumber(source.distanceMeters) ?? asNumber(source.distance),
    score: asNumber(source.score) ?? asNumber(source.confidence),
    evidenceUrl: images[0]?.url ?? asString(source.evidenceUrl) ?? null,
  };
}

function normalizeSla(value: unknown): ValidationIncident["sla"] {
  const source = asRecord(value);
  const nested = asRecord(source.sla);
  const sla = Object.keys(nested).length ? nested : source;
  if (!Object.keys(sla).length) return undefined;
  const priority = asString(sla.priority)?.toLowerCase();
  return {
    priority: priority === "critical" || priority === "high" || priority === "medium" || priority === "low"
      ? priority
      : undefined,
    targetResolutionTime: asNumber(sla.targetResolutionTime) ?? asNumber(sla.targetHours),
    startedAt: asString(sla.startedAt) ?? asString(sla.startTimestamp),
    deadline: asString(sla.deadline) ?? asString(sla.targetDeadline),
    state: asString(sla.state) ?? asString(sla.status),
  };
}

function normalizeIncident(value: unknown): ValidationIncident | null {
  const source = asRecord(value);
  const id = normalizedId(source);
  if (!id) return null;
  const routing = asRecord(source.routing);
  const jurisdiction = asRecord(source.jurisdiction);
  const priority = asString(source.priority)?.toLowerCase();
  const directCandidates = asArray(source.duplicateCandidates)
    .map(normalizeCandidate)
    .filter((candidate): candidate is DuplicateCandidate => candidate !== null);
  const aiAnalysis = asRecord(source.aiAnalysis);
  const aiStatus = asString(aiAnalysis.analysisStatus);
  return {
    id,
    reportNumber: asString(source.reportNumber) ?? `Report ${id.slice(-6)}`,
    category: asString(source.category) ?? "Uncategorized",
    subcategory: asString(source.subcategory),
    description: asString(source.description) ?? "No description provided.",
    status: asString(source.status) ?? "submitted",
    priority: priority === "critical" || priority === "high" || priority === "medium" || priority === "low"
      ? priority
      : undefined,
    createdAt: asString(source.createdAt),
    updatedAt: asString(source.updatedAt),
    reporter: (() => {
      const reporter = asRecord(source.reporter);
      const reporterId = normalizedId(reporter);
      return reporterId ? {
        id: reporterId,
        firstName: asString(reporter.firstName),
        lastName: asString(reporter.lastName),
      } : undefined;
    })(),
    locationIntegrity: source.locationIntegrity ? {
      pinSource: asString(asRecord(source.locationIntegrity).pinSource),
      comparison: asString(asRecord(source.locationIntegrity).comparison),
      unavailableReason: asString(asRecord(source.locationIntegrity).unavailableReason),
      distanceMeters: asNumber(asRecord(source.locationIntegrity).distanceMeters),
      accuracyMeters: asNumber(asRecord(source.locationIntegrity).accuracyMeters),
      explanation: {
        reason: asString(asRecord(asRecord(source.locationIntegrity).explanation).reason),
        text: asString(asRecord(asRecord(source.locationIntegrity).explanation).text),
      },
      confirmedAt: asString(asRecord(source.locationIntegrity).confirmedAt),
    } : undefined,
    location: normalizeLocation(source.location),
    images: asArray(source.images).map(normalizeEvidence),
    evidenceThumbnail: asString(source.evidenceThumbnail) ?? asString(source.thumbnailUrl) ?? null,
    aiAnalysis: Object.keys(aiAnalysis).length ? {
      analysisStatus: aiStatus === "completed" || aiStatus === "unavailable" || aiStatus === "failed"
        ? aiStatus
        : undefined,
      classificationStatus: aiAnalysis.classificationStatus === "production"
        || aiAnalysis.classificationStatus === "manual_review"
        || aiAnalysis.classificationStatus === "no_detection"
        ? aiAnalysis.classificationStatus
        : undefined,
      category: asString(aiAnalysis.category),
      model: asString(aiAnalysis.model),
      modelAvailable: aiStatus === "completed"
        ? aiAnalysis.modelAvailable !== false
        : aiAnalysis.modelAvailable === true,
      manualReviewOnly: aiAnalysis.manualReviewOnly === true,
      detected: aiAnalysis.detected === true,
      hazardType: asString(aiAnalysis.hazardType),
      confidence: asNumber(aiAnalysis.confidence),
      findingsCount: asNumber(aiAnalysis.findingsCount),
      findings: asArray(aiAnalysis.findings)
        .map(normalizeFinding)
        .filter((finding): finding is ValidationAiFinding => finding !== null)
        .slice(0, 50),
      detections: {
        roadDamage: asNumber(asRecord(aiAnalysis.detections).roadDamage)
          ?? asNumber(asRecord(aiAnalysis.detections).road_damage)
          ?? 0,
        cracks: asNumber(asRecord(aiAnalysis.detections).cracks) ?? 0,
      },
      // The official interface never treats AI output as a decision.
      requiresManualReview: true,
      advisoryOnly: true,
      processedAt: asString(aiAnalysis.processedAt),
    } : undefined,
    duplicateCandidateCount: asNumber(source.possibleDuplicateCandidateCount)
      ?? asNumber(asRecord(source.duplicateDetection).candidateCount)
      ?? directCandidates.length,
    duplicateCandidates: directCandidates,
    history: asArray(source.statusHistory).map(normalizeHistory),
    jurisdiction: asString(source.jurisdiction)
      ?? asString(jurisdiction.barangay)
      ?? asString(asRecord(asRecord(source.location).address).barangay),
    responsibleOrganization: asString(source.responsibleOrganization),
    agencyStatus: asString(source.agencyStatus),
    agencySchedule: normalizeAgencySchedule(source.agencySchedule),
    agencyStatusNote: asString(source.agencyStatusNote),
    routing: Object.keys(routing).length ? {
      responsibleOrganization: asString(routing.responsibleOrganization),
      responsibleRole: asString(routing.responsibleRole) === "utility_provider" ? "utility_provider" : undefined,
      routedAt: asString(routing.routedAt),
      routedBy: asString(routing.routedBy),
    } : undefined,
    initialInspection: (() => { const value = asRecord(source.initialInspection); return Object.keys(value).length ? { id: normalizedId(value), status: asString(value.status), findings: asString(value.findings), result: asString(value.result), submittedAt: asString(value.submittedAt), evidence: asArray(value.evidence).map(normalizeEvidence) } : undefined; })(),
    completionInspection: (() => { const value = asRecord(source.completionInspection); return Object.keys(value).length ? { id: normalizedId(value), status: asString(value.status), findings: asString(value.findings), result: asString(value.result), submittedAt: asString(value.submittedAt), evidence: asArray(value.evidence).map(normalizeEvidence) } : undefined; })(),
    sla: normalizeSla(source.sla),
    workOrder: (() => {
      const workOrder = asRecord(source.workOrder);
      const workOrderId = normalizedId(workOrder);
      if (!workOrderId) return undefined;
      return {
        id: workOrderId,
        reference: asString(workOrder.reference) ?? asString(workOrder.orderNumber),
        status: asString(workOrder.status),
        progressPercent: asNumber(workOrder.progressPercent),
        stage: asString(workOrder.stage) ?? asString(workOrder.progressStage),
      };
    })(),
    rejectionReason: asString(source.rejectionReason),
    clarificationReason: asString(source.clarificationReason),
    duplicateOf: (() => {
      const duplicateOf = source.duplicateOf;
      const duplicateRecord = asRecord(duplicateOf);
      if (typeof duplicateOf === "string") return duplicateOf;
      if (Object.keys(duplicateRecord).length) {
        return { id: normalizedId(duplicateRecord), reportNumber: asString(duplicateRecord.reportNumber) };
      }
      return undefined;
    })(),
  };
}

function normalizedPagination(value: unknown, fallback: ValidationQueueFilters): ValidationPagination {
  const source = asRecord(value);
  const page = Math.max(1, asNumber(source.page) ?? fallback.page);
  const limit = Math.max(1, asNumber(source.limit) ?? fallback.limit);
  const total = Math.max(0, asNumber(source.total) ?? 0);
  return {
    page,
    limit,
    total,
    pages: Math.max(1, asNumber(source.pages) ?? (Math.ceil(total / limit) || 1)),
  };
}

function queuePayload(value: unknown) {
  const payload = asRecord(value);
  const nested = asRecord(payload.data);
  return Object.keys(nested).length && !Array.isArray(payload.data) ? { ...payload, ...nested } : payload;
}

function buildQueueQuery(filters: ValidationQueueFilters) {
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.category) query.set("category", filters.category);
  if (filters.jurisdiction) query.set("barangay", filters.jurisdiction);
  if (filters.duplicate) query.set("hasDuplicateCandidate", filters.duplicate === "yes" ? "true" : "false");
  if (filters.dateFrom) query.set("from", filters.dateFrom);
  if (filters.dateTo) query.set("to", filters.dateTo);
  if (filters.sortBy) {
    const sortBy = {
      createdAt_desc: "-createdAt",
      createdAt_asc: "createdAt",
      priority_desc: "-priority",
    }[filters.sortBy];
    query.set("sortBy", sortBy);
  }
  return query.toString();
}

export const defaultValidationFilters: ValidationQueueFilters = {
  page: 1,
  limit: 20,
  sortBy: "createdAt_desc",
};

export function readValidationFilters(searchParams: Record<string, string | string[] | undefined>): ValidationQueueFilters {
  const one = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const numeric = Number(one("page"));
  const limit = Number(one("limit"));
  const duplicate = one("duplicate");
  const sortBy = one("sortBy");
  return {
    page: Number.isInteger(numeric) && numeric > 0 ? numeric : defaultValidationFilters.page,
    limit: Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : defaultValidationFilters.limit,
    search: one("search")?.slice(0, 120) || undefined,
    category: one("category")?.slice(0, 80) || undefined,
    jurisdiction: one("jurisdiction")?.slice(0, 100) || undefined,
    duplicate: duplicate === "yes" || duplicate === "no" ? duplicate : undefined,
    dateFrom: one("dateFrom") || undefined,
    dateTo: one("dateTo") || undefined,
    sortBy: sortBy === "createdAt_asc" || sortBy === "priority_desc" || sortBy === "createdAt_desc"
      ? sortBy
      : defaultValidationFilters.sortBy,
  };
}

const fallbackReportCategories = [
  { value: "road", label: "Road Damage" },
  { value: "drainage", label: "Drainage" },
  { value: "electrical", label: "Electrical" },
  { value: "water", label: "Water" },
  { value: "streetlight", label: "Streetlight" },
];

async function getReportCategoryOptions(accessToken: string) {
  try {
    const data = responseData(await backendRequest<unknown>("/categories", { accessToken }));
    const items = Array.isArray(data) ? data : asArray(asRecord(data).categories);
    const options = items.map((item) => {
      const category = asRecord(item);
      const value = typeof item === "string" ? item : String(category.code ?? category.value ?? "");
      const fallback = fallbackReportCategories.find((option) => option.value === value);
      const label = value === "road" ? "Road Damage" : String(category.label ?? category.name ?? fallback?.label ?? value)
        .replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      return { value, label };
    }).filter((option) => fallbackReportCategories.some((supported) => supported.value === option.value));
    return options.length ? options : fallbackReportCategories;
  } catch {
    return fallbackReportCategories;
  }
}

export async function getValidationQueue(filters: ValidationQueueFilters, stage?: "confirmed"): Promise<ValidationQueueData> {
  const accessToken = await requireAccessToken();
  const [response, categoryOptions] = await Promise.all([
    backendRequest<unknown>(`/incidents/pending-validation?${buildQueueQuery(filters)}${stage === "confirmed" ? "&stage=confirmed" : ""}`, { accessToken }),
    getReportCategoryOptions(accessToken),
  ]);
  const rawData = responseData(response);
  const payload = queuePayload(rawData);
  const topLevel = asRecord(response);
  const rawIncidents = Array.isArray(rawData)
    ? rawData
    : asArray(payload.incidents ?? payload.items ?? payload.data);
  const incidents = rawIncidents.map(normalizeIncident).filter((incident): incident is ValidationIncident => incident !== null);
  const pagination = normalizedPagination(payload.pagination ?? topLevel.pagination, filters);
  return {
    incidents,
    pagination: {
      ...pagination,
      total: pagination.total || (incidents.length < pagination.limit ? incidents.length : pagination.total),
    },
    categories: categoryOptions.map((option) => option.value),
    categoryOptions,
  };
}

export async function getValidationSummary(): Promise<ValidationSummary> {
  const accessToken = await requireAccessToken();
  const payload = queuePayload(responseData(await backendRequest<unknown>("/stats/validation-summary", { accessToken })));
  const counts = asRecord(payload.counts);
  return {
    pending: Math.max(0, asNumber(payload.pending) ?? asNumber(counts.pending) ?? asNumber(payload.submitted) ?? 0),
    validated: Math.max(0, asNumber(payload.validated) ?? asNumber(counts.validated) ?? 0),
    rejected: Math.max(0, asNumber(payload.rejected) ?? asNumber(counts.rejected) ?? 0),
    duplicate: Math.max(0, asNumber(payload.duplicate) ?? asNumber(counts.duplicate) ?? 0),
  };
}

async function getSupplement<T>(path: string, accessToken: string): Promise<T> {
  return responseData(await backendRequest<T>(path, { accessToken }));
}

export async function getValidationIncident(id: string): Promise<ValidationIncident> {
  const accessToken = await requireAccessToken();
  const [incidentPayload, historyPayload, candidatesPayload, slaPayload] = await Promise.all([
    getSupplement<unknown>(`/incidents/${encodeURIComponent(id)}`, accessToken),
    getSupplement<unknown>(`/incidents/${encodeURIComponent(id)}/history`, accessToken),
    getSupplement<unknown>(`/incidents/${encodeURIComponent(id)}/duplicate-candidates`, accessToken),
    getSupplement<unknown>(`/incidents/${encodeURIComponent(id)}/sla`, accessToken),
  ]);
  const incident = normalizeIncident(queuePayload(incidentPayload));
  if (!incident) throw new Error("The LUNAS service returned an incomplete incident record.");

  const historySource = queuePayload(historyPayload);
  const candidateSource = queuePayload(candidatesPayload);
  const candidateEntries = Array.isArray(candidatesPayload)
    ? candidatesPayload
    : asArray(candidateSource.candidates ?? candidateSource.duplicateCandidates ?? candidateSource.data);
  const candidates = candidateEntries
    .map(normalizeCandidate)
    .filter((candidate): candidate is DuplicateCandidate => candidate !== null);
  return {
    ...incident,
    history: (Array.isArray(historyPayload)
      ? historyPayload
      : asArray(historySource.history ?? historySource.statusHistory ?? historySource.data))
      .map(normalizeHistory),
    duplicateCandidates: candidates.length ? candidates : incident.duplicateCandidates,
    duplicateCandidateCount: candidates.length || incident.duplicateCandidateCount,
    sla: normalizeSla(queuePayload(slaPayload)) ?? incident.sla,
  };
}

export async function getUtilityProviderOrganizations(): Promise<string[]> {
  const accessToken = await requireAccessToken();
  const value = responseData(await backendRequest<unknown>("/users/utility-providers", { accessToken }));
  if (Array.isArray(value)) return value.map(asString).filter((entry): entry is string => Boolean(entry));
  const payload = queuePayload(value);
  return asArray(payload.organizations ?? payload.providers ?? payload.data)
    .map(asString)
    .filter((entry): entry is string => Boolean(entry));
}

export async function getTanodPersonnel(): Promise<Array<{ id: string; firstName?: string; lastName?: string; barangay?: string }>> {
  const accessToken = await requireAccessToken();
  const response = await backendRequest<unknown>("/incidents/tanod-personnel", { accessToken });
  const payload = responseData(response) as { data?: unknown[] } | unknown[];
  const values = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return values.filter((value): value is Record<string, unknown> => Boolean(value && typeof value === "object"))
    .map((value) => ({ id: String(value.id || ""), firstName: typeof value.firstName === "string" ? value.firstName : undefined, lastName: typeof value.lastName === "string" ? value.lastName : undefined, barangay: typeof value.barangay === "string" ? value.barangay : undefined }))
    .filter((value) => value.id);
}

export async function getTanodAccounts(): Promise<Array<{ id: string; firstName?: string; middleName?: string; lastName?: string; email?: string; phone?: string; accountStatus?: string; isActive?: boolean; createdAt?: string }>> {
  const accessToken = await requireAccessToken();
  const payload = responseData(await backendRequest<unknown>("/users/repair-personnel", { accessToken })) as unknown;
  const values = Array.isArray(payload) ? payload : (payload as { data?: unknown[] })?.data || [];
  return values.filter((value): value is Record<string, unknown> => Boolean(value && typeof value === "object")).map((value) => ({
    id: String(value.id || ""), firstName: typeof value.firstName === "string" ? value.firstName : undefined, middleName: typeof value.middleName === "string" ? value.middleName : undefined, lastName: typeof value.lastName === "string" ? value.lastName : undefined, email: typeof value.email === "string" ? value.email : undefined, phone: typeof value.phone === "string" ? value.phone : undefined, accountStatus: typeof value.accountStatus === "string" ? value.accountStatus : undefined, isActive: Boolean(value.isActive), createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined
  })).filter((value) => value.id);
}

export async function getAgencyExceptions(): Promise<{ incidents: unknown[]; agencies: string[] }> {
  const accessToken = await requireAccessToken();
  const payload = responseData(await backendRequest<unknown>("/incidents/agency-exceptions", { accessToken })) as { incidents?: unknown[]; agencies?: string[] };
  return { incidents: Array.isArray(payload?.incidents) ? payload.incidents : [], agencies: Array.isArray(payload?.agencies) ? payload.agencies.filter((value): value is string => typeof value === "string") : [] };
}

// Both lists and downloads use the same backend-enforced scope and complete period data.
export async function getBarangayReports(period: "daily" | "weekly" | "monthly" = "monthly", date?: string) {
  return loadPeriodReports(period, reportRange(period, reportAnchor(date)));
}

export async function getAgencyReports(period: "daily" | "weekly" | "monthly" = "monthly", date?: string) {
  return loadPeriodReports(period, reportRange(period, reportAnchor(date)));
}
