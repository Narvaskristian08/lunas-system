import "server-only";

import { BackendApiError, backendRequest, responseData } from "@/lib/api/backend.server";
import { requireAccessToken } from "@/lib/auth/dal.server";
import { repairProgressStages, type RepairProgressStage } from "@/lib/work-order-progress";

export { repairProgressStages } from "@/lib/work-order-progress";
export type { RepairProgressStage } from "@/lib/work-order-progress";

export type WorkOrderStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "rework_required"
  | "provider_accepted"
  | "city_correction_required"
  | "verified"
  | "declined"
  | "reassigned";
export type AssignmentState = "unassigned" | "pending" | "accepted" | "declined" | "reassigned";
export type SlaState = "not_started" | "active" | "approaching" | "overdue" | "met";

type ApiRecord = Record<string, unknown>;

export interface WorkOrderPerson {
  id: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  organization?: string;
  team?: string;
  repairAccountType?: "individual" | "team";
  availability?: string;
  activeAssignments?: number;
  expertise: string[];
}

export interface WorkOrderEvidence {
  id: string;
  url: string | null;
  mimeType?: string;
  size?: number;
  checksum?: string;
  width?: number;
  height?: number;
  uploadedAt?: string;
  caption?: string;
  progressUpdateId?: string;
  isPrivacyMasked?: boolean;
  privacyProcessing?: {
    status?: string;
    applied?: boolean;
    detectedRegions?: number;
  };
}

export interface WorkOrderLocation {
  address: {
    street?: string;
    barangay?: string;
    city?: string;
  };
  coordinates: [number | undefined, number | undefined];
}

export interface WorkOrderIncident {
  id: string;
  reportNumber?: string;
  category?: string;
  description?: string;
  priority?: string;
  status?: string;
  location: WorkOrderLocation;
  images: WorkOrderEvidence[];
}

export interface WorkOrderAssignment {
  id: string;
  assignee: WorkOrderPerson | null;
  assignedBy: WorkOrderPerson | null;
  assignedAt?: string;
  status?: AssignmentState | string;
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  declineNotes?: string;
  endedAt?: string;
  endedReason?: string;
  active?: boolean;
}

export interface WorkOrderProgressUpdate {
  id: string;
  previousPercent?: number;
  progressPercent?: number;
  stage?: RepairProgressStage | string;
  notes?: string;
  evidence: string[];
  location?: WorkOrderLocation;
  updatedAt?: string;
}

export interface WorkOrderHistoryEntry {
  id: string;
  type?: string;
  status?: string;
  progressPercent?: number;
  stage?: string;
  notes?: string;
  actorRole?: string;
  createdAt?: string;
}

export interface WorkOrderReview {
  id: string;
  stage?: "utility_provider" | "city_engineer" | string;
  decision?: "accepted" | "correction_required" | "verified" | string;
  reason?: string;
  instructions?: string;
  actor: WorkOrderPerson | null;
  createdAt?: string;
}

export interface WorkOrderSla {
  targetResolutionTime?: number;
  startedAt?: string;
  deadline?: string;
  state: SlaState | string;
  isOverdue: boolean;
  isApproaching: boolean;
  remainingMilliseconds?: number;
}

export interface WorkOrder {
  intakeIncidentId?: string;
  id: string;
  reference: string;
  priority?: string;
  status: WorkOrderStatus | string;
  assignmentState: AssignmentState | string;
  responsibleOrganization?: string;
  responsibleRole?: "utility_provider";
  jurisdiction?: { barangay?: string; city?: string };
  instructions?: string;
  progressPercent: number;
  progressStage: RepairProgressStage | string;
  createdAt?: string;
  updatedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  readyForCompletionAt?: string;
  closedAt?: string;
  assignee: WorkOrderPerson | null;
  assignedBy: WorkOrderPerson | null;
  currentAssignment: WorkOrderAssignment | null;
  incident: WorkOrderIncident | null;
  sla: WorkOrderSla;
  assignments: WorkOrderAssignment[];
  evidence: WorkOrderEvidence[];
  progressUpdates: WorkOrderProgressUpdate[];
  history: WorkOrderHistoryEntry[];
  reviews: WorkOrderReview[];
}

export interface EligibleRepairPersonnel extends WorkOrderPerson {
  organization?: string;
}

export interface WorkOrderPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface WorkOrderQueueData {
  workOrders: WorkOrder[];
  pagination: WorkOrderPagination;
}

export interface ProviderIncidentWorkOrder {
  id: string;
  reference?: string;
  status?: string;
  assignmentState?: string;
}

export interface ProviderRoutedIncident {
  id: string;
  reportNumber: string;
  category?: string;
  description?: string;
  priority?: "critical" | "high" | "medium" | "low";
  status: string;
  agencyStatus?: string;
  agencyStatusNote?: string;
  createdAt?: string;
  routedAt?: string;
  responsibleOrganization?: string;
  location: WorkOrderLocation;
  images: WorkOrderEvidence[];
  sla: WorkOrderSla;
  workOrder?: ProviderIncidentWorkOrder;
}

export interface ProviderIncidentQueueData {
  incidents: ProviderRoutedIncident[];
  pagination: WorkOrderPagination;
}

export interface ProviderIncidentFilters {
  page: number;
  limit: number;
  search?: string;
  priority?: "critical" | "high" | "medium" | "low";
  category?: string;
  sortBy?: "newest" | "oldest" | "priority";
}

export interface WorkOrderFilters {
  page: number;
  limit: number;
  search?: string;
  status?: WorkOrderStatus | "needs_correction" | "awaiting_review";
  priority?: "critical" | "high" | "medium" | "low";
  assignmentStatus?: AssignmentState;
  progress?: 0 | 25 | 50 | 75 | 100;
  slaState?: "approaching" | "overdue";
  personnel?: string;
  organization?: string;
  category?: string;
  sortBy?: "newest" | "oldest" | "deadline" | "-deadline" | "priority" | "-priority" | "progress" | "-progress";
}

export interface WorkOrderSummary {
  unassigned: number;
  pendingAcceptance: number;
  accepted: number;
  active: number;
  approaching: number;
  overdue: number;
  readyForCompletion: number;
  awaitingFinalVerification: number;
  cityCorrections: number;
  correctiveRepairs: number;
  closed: number;
}

const validStatuses = new Set<WorkOrderStatus>([
  "pending", "accepted", "in_progress", "completed", "rework_required",
  "provider_accepted", "city_correction_required", "verified", "declined", "reassigned",
]);
const validPriorities = new Set(["critical", "high", "medium", "low"]);
const validAssignmentStates = new Set<AssignmentState>(["unassigned", "pending", "accepted", "declined"]);
const validProgresses = new Set([0, 25, 50, 75, 100]);
const validSorts = new Set<NonNullable<WorkOrderFilters["sortBy"]>>([
  "newest", "oldest", "deadline", "-deadline", "priority", "-priority", "progress", "-progress",
]);

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ApiRecord : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function identifier(value: unknown) {
  const source = asRecord(value);
  return asString(value) ?? asString(source.id) ?? asString(source._id) ?? "";
}

function normalizeLocation(value: unknown): WorkOrderLocation {
  const source = asRecord(value);
  const address = asRecord(source.address);
  const coordinates = asArray(source.coordinates);
  return {
    address: {
      street: asString(address.street) ?? asString(source.street),
      barangay: asString(address.barangay) ?? asString(source.barangay),
      city: asString(address.city) ?? asString(source.city),
    },
    coordinates: [asNumber(coordinates[0]), asNumber(coordinates[1])],
  };
}

function normalizeEvidence(value: unknown): WorkOrderEvidence {
  const source = asRecord(value);
  return {
    id: identifier(source) || asString(source.key) || "evidence",
    url: asString(source.url) ?? asString(source.signedUrl) ?? null,
    mimeType: asString(source.mimeType) ?? asString(source.type),
    size: asNumber(source.size),
    checksum: asString(source.checksum) ?? asString(source.hash),
    width: asNumber(source.width),
    height: asNumber(source.height),
    uploadedAt: asString(source.uploadedAt) ?? asString(source.createdAt),
    caption: asString(source.caption),
    progressUpdateId: identifier(source.progressUpdateId ?? source.progressUpdate) || undefined,
    isPrivacyMasked: asBoolean(source.isPrivacyMasked),
    privacyProcessing: Object.keys(asRecord(source.privacyProcessing)).length ? {
      status: asString(asRecord(source.privacyProcessing).status),
      applied: asBoolean(asRecord(source.privacyProcessing).applied),
      detectedRegions: asNumber(asRecord(source.privacyProcessing).detectedRegions),
    } : undefined,
  };
}

function normalizePerson(value: unknown): WorkOrderPerson | null {
  const source = asRecord(value);
  const id = identifier(source);
  if (!id) return null;
  return {
    id,
    firstName: asString(source.firstName),
    lastName: asString(source.lastName),
    role: asString(source.role),
    organization: asString(source.organization) ?? asString(source.repairOrganization) ?? asString(source.utilityCompany),
    team: asString(source.team) ?? asString(source.repairTeam),
    repairAccountType: source.repairAccountType === "team" ? "team" : "individual",
    availability: asString(source.availability),
    activeAssignments: asNumber(source.activeAssignments) ?? asNumber(source.activeAssignmentCount),
    expertise: asArray(source.expertise).map(asString).filter((item): item is string => Boolean(item)),
  };
}

function normalizeAssignment(value: unknown): WorkOrderAssignment | null {
  const source = asRecord(value);
  if (!Object.keys(source).length) return null;
  const assignee = normalizePerson(source.assignee ?? source.assignedTo);
  const assignedAt = asString(source.assignedAt);
  const id = identifier(source) || (assignee || assignedAt
    ? `${assignee?.id ?? "assignment"}-${assignedAt ?? ""}`
    : "");
  if (!id) return null;
  return {
    id,
    assignee,
    assignedBy: normalizePerson(source.assignedBy),
    assignedAt: asString(source.assignedAt),
    status: asString(source.status),
    acceptedAt: asString(source.acceptedAt),
    declinedAt: asString(source.declinedAt),
    declineReason: asString(source.declineReason),
    declineNotes: asString(source.declineNotes),
    endedAt: asString(source.endedAt),
    endedReason: asString(source.endedReason) ?? asString(source.reassignmentReason),
    active: asBoolean(source.active),
  };
}

function normalizeProgressUpdate(value: unknown): WorkOrderProgressUpdate | null {
  const source = asRecord(value);
  const id = identifier(source);
  if (!id) return null;
  return {
    id,
    previousPercent: asNumber(source.previousPercent),
    progressPercent: asNumber(source.progressPercent) ?? asNumber(source.newPercentage),
    stage: asString(source.stage),
    notes: asString(source.notes),
    evidence: asArray(source.evidence).map(identifier).filter(Boolean),
    location: Object.keys(asRecord(source.location)).length ? normalizeLocation(source.location) : undefined,
    updatedAt: asString(source.updatedAt) ?? asString(source.createdAt),
  };
}

function normalizeHistoryEntry(value: unknown): WorkOrderHistoryEntry | null {
  const source = asRecord(value);
  const id = identifier(source) || `${asString(source.type) ?? "event"}-${asString(source.createdAt) ?? ""}`;
  if (!id) return null;
  return {
    id,
    type: asString(source.type) ?? asString(source.event),
    status: asString(source.status),
    progressPercent: asNumber(source.progressPercent),
    stage: asString(source.stage),
    notes: asString(source.notes),
    actorRole: asString(source.actorRole),
    createdAt: asString(source.createdAt) ?? asString(source.updatedAt),
  };
}

function normalizeReview(value: unknown): WorkOrderReview | null {
  const source = asRecord(value);
  const id = identifier(source);
  if (!id) return null;
  return {
    id,
    stage: asString(source.stage),
    decision: asString(source.decision),
    reason: asString(source.reason),
    instructions: asString(source.instructions),
    actor: normalizePerson(source.actor),
    createdAt: asString(source.createdAt),
  };
}

function normalizeIncident(value: unknown): WorkOrderIncident | null {
  const source = asRecord(value);
  const id = identifier(source);
  if (!id) return null;
  return {
    id,
    reportNumber: asString(source.reportNumber) ?? asString(source.reference),
    category: asString(source.category),
    description: asString(source.description),
    priority: asString(source.priority),
    status: asString(source.status),
    location: normalizeLocation(source.location),
    images: asArray(source.images ?? source.evidence).map(normalizeEvidence),
  };
}

function normalizeProviderIncident(value: unknown): ProviderRoutedIncident | null {
  const source = asRecord(value);
  const id = identifier(source);
  if (!id) return null;
  const routing = asRecord(source.routing);
  const rawPriority = asString(source.priority);
  const priority = rawPriority && validPriorities.has(rawPriority)
    ? rawPriority as ProviderRoutedIncident["priority"]
    : undefined;
  const rawWorkOrder = asRecord(source.workOrder);
  const workOrderId = identifier(rawWorkOrder);
  return {
    id,
    reportNumber: asString(source.reportNumber) ?? `Report ${id.slice(-6)}`,
    category: asString(source.category),
    description: asString(source.description),
    priority,
    status: asString(source.status) ?? "provider_assigned",
    agencyStatus: asString(source.agencyStatus),
    agencyStatusNote: asString(source.agencyStatusNote),
    createdAt: asString(source.createdAt),
    routedAt: asString(routing.routedAt),
    responsibleOrganization: asString(routing.responsibleOrganization),
    location: normalizeLocation(source.location),
    images: asArray(source.images).map(normalizeEvidence),
    sla: normalizeSla(source.sla),
    workOrder: workOrderId ? {
      id: workOrderId,
      reference: asString(rawWorkOrder.reference) ?? asString(rawWorkOrder.orderNumber),
      status: asString(rawWorkOrder.status),
      assignmentState: asString(rawWorkOrder.assignmentState),
    } : undefined,
  };
}

function normalizeSla(value: unknown): WorkOrderSla {
  const source = asRecord(value);
  const state = asString(source.state) ?? asString(source.status) ?? "not_started";
  return {
    targetResolutionTime: asNumber(source.targetResolutionTime) ?? asNumber(source.targetHours),
    startedAt: asString(source.startedAt) ?? asString(source.startTimestamp),
    deadline: asString(source.deadline) ?? asString(source.targetDeadline),
    state,
    isOverdue: asBoolean(source.isOverdue) ?? state === "overdue",
    isApproaching: asBoolean(source.isApproaching) ?? state === "approaching",
    remainingMilliseconds: asNumber(source.remainingMilliseconds),
  };
}

export function normalizeWorkOrder(value: unknown): WorkOrder | null {
  const source = asRecord(value);
  const id = identifier(source);
  if (!id) return null;
  const assignments = asArray(source.assignments).map(normalizeAssignment).filter((item): item is WorkOrderAssignment => item !== null);
  const currentAssignment = normalizeAssignment(source.currentAssignment)
    ?? assignments.find((item) => item.active !== false)
    ?? null;
  const progressPercent = asNumber(source.progressPercent) ?? asNumber(source.currentProgress) ?? 0;
  return {
    id,
    reference: asString(source.reference) ?? asString(source.orderNumber) ?? `Work order ${id.slice(-6)}`,
    priority: asString(source.priority),
    status: asString(source.status) ?? "pending",
    assignmentState: asString(source.assignmentState) ?? currentAssignment?.status ?? "unassigned",
    responsibleOrganization: asString(source.responsibleOrganization),
    responsibleRole: asString(source.responsibleRole) === "utility_provider" ? "utility_provider" : undefined,
    jurisdiction: (() => {
      const jurisdiction = asRecord(source.jurisdiction);
      return Object.keys(jurisdiction).length ? {
        barangay: asString(jurisdiction.barangay),
        city: asString(jurisdiction.city),
      } : undefined;
    })(),
    instructions: asString(source.instructions),
    progressPercent,
    progressStage: asString(source.progressStage) ?? repairProgressStages[progressPercent as keyof typeof repairProgressStages] ?? "assigned",
    createdAt: asString(source.createdAt),
    updatedAt: asString(source.updatedAt),
    acceptedAt: asString(source.acceptedAt),
    startedAt: asString(source.startedAt),
    readyForCompletionAt: asString(source.readyForCompletionAt) ?? asString(source.completedAt),
    closedAt: asString(source.closedAt) ?? asString(source.finalVerifiedAt) ?? asString(asRecord(source.sla).closedAt),
    assignee: normalizePerson(source.assignee ?? source.assignedTo),
    assignedBy: normalizePerson(source.assignedBy ?? source.createdBy),
    currentAssignment,
    incident: normalizeIncident(source.incident),
    sla: normalizeSla(source.sla),
    assignments,
    evidence: asArray(source.evidence ?? source.repairEvidence).map(normalizeEvidence),
    progressUpdates: asArray(source.progressUpdates ?? source.progress).map(normalizeProgressUpdate).filter((item): item is WorkOrderProgressUpdate => item !== null),
    history: asArray(source.history).map(normalizeHistoryEntry).filter((item): item is WorkOrderHistoryEntry => item !== null),
    reviews: asArray(source.reviews).map(normalizeReview).filter((item): item is WorkOrderReview => item !== null),
  };
}

function readPagination(value: unknown, fallback: WorkOrderFilters): WorkOrderPagination {
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

function responseEntries(value: unknown) {
  if (Array.isArray(value)) return value;
  const source = asRecord(value);
  return asArray(source.workOrders ?? source.items ?? source.data);
}

function one(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export const defaultWorkOrderFilters: WorkOrderFilters = {
  page: 1,
  limit: 20,
  sortBy: "newest",
};

export const defaultProviderIncidentFilters: ProviderIncidentFilters = {
  page: 1,
  limit: 20,
  sortBy: "newest",
};

export function readProviderIncidentFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ProviderIncidentFilters {
  const page = Number(one(searchParams, "page"));
  const limit = Number(one(searchParams, "limit"));
  const priority = one(searchParams, "priority");
  const sortBy = one(searchParams, "sortBy");
  return {
    page: Number.isInteger(page) && page > 0 ? page : defaultProviderIncidentFilters.page,
    limit: Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : defaultProviderIncidentFilters.limit,
    search: one(searchParams, "search")?.trim().slice(0, 100) || undefined,
    priority: priority && validPriorities.has(priority)
      ? priority as ProviderIncidentFilters["priority"]
      : undefined,
    category: one(searchParams, "category")?.trim().slice(0, 80) || undefined,
    sortBy: sortBy === "oldest" || sortBy === "priority" || sortBy === "newest"
      ? sortBy
      : defaultProviderIncidentFilters.sortBy,
  };
}

function providerIncidentQuery(filters: ProviderIncidentFilters) {
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
    withoutWorkOrder: "true",
    sortBy: filters.sortBy === "oldest"
      ? "createdAt"
      : filters.sortBy === "priority" ? "-priority" : "-createdAt",
  });
  if (filters.search) query.set("search", filters.search);
  if (filters.priority) query.set("priority", filters.priority);
  if (filters.category) query.set("category", filters.category);
  return query.toString();
}

export function readWorkOrderFilters(searchParams: Record<string, string | string[] | undefined>): WorkOrderFilters {
  const page = Number(one(searchParams, "page"));
  const limit = Number(one(searchParams, "limit"));
  const status = one(searchParams, "status");
  const priority = one(searchParams, "priority");
  const assignmentStatus = one(searchParams, "assignmentStatus");
  const progress = Number(one(searchParams, "progress"));
  const slaState = one(searchParams, "slaState");
  const sortBy = one(searchParams, "sortBy");
  return {
    page: Number.isInteger(page) && page > 0 ? page : defaultWorkOrderFilters.page,
    limit: Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : defaultWorkOrderFilters.limit,
    search: one(searchParams, "search")?.trim().slice(0, 100) || undefined,
    status: status === "needs_correction" || status === "awaiting_review" ? status : status && validStatuses.has(status as WorkOrderStatus) ? status as WorkOrderStatus : undefined,
    priority: priority && validPriorities.has(priority) ? priority as WorkOrderFilters["priority"] : undefined,
    assignmentStatus: assignmentStatus && validAssignmentStates.has(assignmentStatus as AssignmentState)
      ? assignmentStatus as AssignmentState
      : undefined,
    progress: validProgresses.has(progress) ? progress as WorkOrderFilters["progress"] : undefined,
    slaState: slaState === "approaching" || slaState === "overdue" ? slaState : undefined,
    personnel: one(searchParams, "personnel")?.trim().slice(0, 80) || undefined,
    organization: one(searchParams, "organization")?.trim().slice(0, 160) || undefined,
    category: one(searchParams, "category")?.trim().slice(0, 80) || undefined,
    sortBy: sortBy && validSorts.has(sortBy as NonNullable<WorkOrderFilters["sortBy"]>)
      ? sortBy as WorkOrderFilters["sortBy"]
      : defaultWorkOrderFilters.sortBy,
  };
}

export function workOrderQuery(filters: WorkOrderFilters) {
  const query = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  const fields: Array<[keyof Omit<WorkOrderFilters, "page" | "limit">, string]> = [
    ["search", "search"], ["status", "status"], ["priority", "priority"], ["assignmentStatus", "assignmentStatus"],
    ["progress", "progress"], ["slaState", "slaState"], ["personnel", "personnel"], ["organization", "organization"],
    ["category", "category"], ["sortBy", "sortBy"],
  ];
  for (const [field, key] of fields) {
    const value = filters[field];
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return query.toString();
}

export async function getWorkOrders(filters: WorkOrderFilters): Promise<WorkOrderQueueData> {
  const accessToken = await requireAccessToken();
  const response = await backendRequest<unknown>(`/work-orders?${workOrderQuery(filters)}`, { accessToken });
  const payload = responseData(response);
  const workOrders = responseEntries(payload).map(normalizeWorkOrder).filter((item): item is WorkOrder => item !== null);
  const topLevel = asRecord(response);
  const source = asRecord(payload);
  const pagination = readPagination(source.pagination ?? topLevel.pagination, filters);
  return {
    workOrders,
    pagination: {
      ...pagination,
      total: pagination.total || (workOrders.length < pagination.limit ? workOrders.length : pagination.total),
    },
  };
}

export async function getProviderIncidentQueue(
  filters: ProviderIncidentFilters,
): Promise<ProviderIncidentQueueData> {
  const accessToken = await requireAccessToken();
  const response = await backendRequest<unknown>(`/incidents?${providerIncidentQuery(filters)}`, { accessToken });
  const payload = responseData(response);
  const incidents = responseEntries(payload)
    .map(normalizeProviderIncident)
    .filter((item): item is ProviderRoutedIncident => item !== null);
  const pagination = readPagination(asRecord(response).pagination, filters);
  return {
    incidents,
    pagination: {
      ...pagination,
      total: pagination.total || (incidents.length < pagination.limit ? incidents.length : pagination.total),
    },
  };
}

export async function getProviderIncident(id: string): Promise<ProviderRoutedIncident> {
  const accessToken = await requireAccessToken();
  const payload = responseData(await backendRequest<unknown>(`/incidents/${encodeURIComponent(id)}`, { accessToken }));
  const incident = normalizeProviderIncident(payload);
  if (!incident) {
    throw new BackendApiError(502, "The LUNAS service returned an incomplete routed-incident record.");
  }
  return incident;
}

async function optionalResponse(path: string, accessToken: string): Promise<unknown | undefined> {
  try {
    return responseData(await backendRequest<unknown>(path, { accessToken }));
  } catch (error) {
    // The detailed endpoint already includes these fields. This narrowly keeps
    // rolling deployments readable while dedicated endpoints deploy and keeps
    // repair personnel from requesting official-only assignment history.
    if (error instanceof BackendApiError && [403, 404].includes(error.status)) return undefined;
    throw error;
  }
}

export async function getWorkOrder(id: string): Promise<WorkOrder> {
  const accessToken = await requireAccessToken();
  const encodedId = encodeURIComponent(id);
  const [workOrderPayload, assignmentsPayload, progressPayload, slaPayload] = await Promise.all([
    responseData(await backendRequest<unknown>(`/work-orders/${encodedId}`, { accessToken })),
    optionalResponse(`/work-orders/${encodedId}/assignments`, accessToken),
    optionalResponse(`/work-orders/${encodedId}/progress`, accessToken),
    optionalResponse(`/work-orders/${encodedId}/sla`, accessToken),
  ]);
  const workOrder = normalizeWorkOrder(workOrderPayload);
  if (!workOrder) throw new BackendApiError(502, "The LUNAS service returned an incomplete work-order record.");

  const assignments = asArray(assignmentsPayload).map(normalizeAssignment).filter((item): item is WorkOrderAssignment => item !== null);
  const progressSource = asRecord(progressPayload);
  const progressUpdates = (Array.isArray(progressPayload) ? progressPayload : asArray(progressSource.progressUpdates ?? progressSource.items ?? progressSource.data))
    .map(normalizeProgressUpdate)
    .filter((item): item is WorkOrderProgressUpdate => item !== null);
  const supplementalSla = Object.keys(asRecord(slaPayload)).length ? normalizeSla(slaPayload) : undefined;
  return {
    ...workOrder,
    assignments: assignments.length ? assignments : workOrder.assignments,
    progressUpdates: progressUpdates.length ? progressUpdates : workOrder.progressUpdates,
    sla: supplementalSla ? {
      targetResolutionTime: supplementalSla.targetResolutionTime ?? workOrder.sla.targetResolutionTime,
      startedAt: supplementalSla.startedAt ?? workOrder.sla.startedAt,
      deadline: supplementalSla.deadline ?? workOrder.sla.deadline,
      state: supplementalSla.state || workOrder.sla.state,
      isOverdue: supplementalSla.isOverdue,
      isApproaching: supplementalSla.isApproaching,
      remainingMilliseconds: supplementalSla.remainingMilliseconds ?? workOrder.sla.remainingMilliseconds,
    } : workOrder.sla,
  };
}

export async function getEligibleRepairPersonnel(workOrderId: string): Promise<EligibleRepairPersonnel[]> {
  const accessToken = await requireAccessToken();
  const payload = responseData(await backendRequest<unknown>(`/work-orders/${encodeURIComponent(workOrderId)}/eligible-personnel`, { accessToken }));
  return responseEntries(payload).map(normalizePerson).filter((item): item is EligibleRepairPersonnel => item !== null);
}

function count(source: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = asNumber(source[key]);
    if (value !== undefined) return Math.max(0, value);
  }
  return 0;
}

export async function getWorkOrderSummary(): Promise<WorkOrderSummary> {
  const accessToken = await requireAccessToken();
  const payload = responseData(await backendRequest<unknown>("/dashboard/work-orders-summary", { accessToken }));
  const source = asRecord(payload);
  const counts = asRecord(source.counts);
  const values = { ...counts, ...source };
  return {
    unassigned: count(values, "unassigned", "unassignedWorkOrders"),
    pendingAcceptance: count(values, "pendingAcceptance", "pendingAssignments", "pending"),
    accepted: count(values, "accepted"),
    active: count(values, "active", "activeRepairs", "inProgress"),
    approaching: count(values, "approaching", "approachingDeadlines"),
    overdue: count(values, "overdue", "overdueWorkOrders"),
    readyForCompletion: count(values, "readyForCompletion", "ready", "completed"),
    awaitingFinalVerification: count(values, "awaitingFinalVerification", "providerAccepted"),
    cityCorrections: count(values, "cityCorrections", "cityCorrectionRequired"),
    correctiveRepairs: count(values, "correctiveRepairs", "reworkRequired"),
    closed: count(values, "closed", "verified"),
  };
}


export async function getAwaitingAssignmentQueue(filters: WorkOrderFilters): Promise<WorkOrderQueueData> {
  const accessToken = await requireAccessToken();
  const response = await backendRequest<unknown>(`/work-orders/awaiting-assignment?${workOrderQuery(filters)}`, { accessToken });
  const payload = responseData(response);
  const workOrders = responseEntries(payload).map((value): WorkOrder | null => {
    const order = normalizeWorkOrder(value);
    return order ? { ...order, intakeIncidentId: asString(asRecord(value).intakeIncidentId) } : null;
  }).filter((item): item is WorkOrder => item !== null);
  return { workOrders, pagination: readPagination(asRecord(payload).pagination ?? asRecord(response).pagination, filters) };
}
