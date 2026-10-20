const OUTCOMES = ['routine', 'external', 'responsibility_review', 'clarification'];
const MILESTONES = ['pending_external_processing', 'pending_funding', 'for_bidding', 'bidding_completed', 'awaiting_work_authorization'];
const NEXT = {
  pending_external_processing: ['pending_funding', 'for_bidding', 'awaiting_work_authorization'],
  pending_funding: ['for_bidding', 'awaiting_work_authorization'],
  for_bidding: ['bidding_completed'],
  bidding_completed: ['awaiting_work_authorization'],
  awaiting_work_authorization: []
};
const fail = (message, status = 409) => ({ error: message, status });
const text = (value, max, required = true) => typeof value === 'string'
  && value.trim().length >= (required ? 2 : 0) && value.trim().length <= max;

// No institutional work-authorizing capability is established. A supplied
// status, reference or even a persisted authorization-shaped object cannot
// manufacture that capability. Historical work continues under its old API.
const maintenanceReady = () => false;

function prepareAgencyTransition(incident, body, actor, now = new Date()) {
  const current = incident.agencyPreparation?.toObject ? incident.agencyPreparation.toObject() : incident.agencyPreparation;
  const revision = current?.revision || 0;
  if (!Number.isInteger(body.expectedVersion) || body.expectedVersion !== revision) return fail('Agency record changed; refresh before continuing');
  if (['authorize', 'ready'].includes(body.operation)) return fail('Work-authorization authority and readiness policy remain pending', 409);
  const organization = incident.routing.responsibleOrganization;
  if (current?.organization && current.organization !== organization) return fail('Agency responsibility changed; reconciliation is required');
  const next = { ...current, organization, revision: revision + 1, protocol: 9 };
  const event = { operation: body.operation, actor: actor._id, organization, at: now, previousStatus: incident.agencyStatus };
  let status;
  if (body.operation === 'acknowledge') {
    if (current?.acknowledgedAt || current?.assessments?.length) return fail('Agency receipt is already acknowledged');
    next.acknowledgedBy = actor._id; next.acknowledgedAt = now;
    status = 'acknowledged';
  } else if (body.operation === 'assess') {
    if (!current?.acknowledgedAt) return fail('Acknowledge receipt before assessment');
    if (!OUTCOMES.includes(body.outcome) || !text(body.notes, 4000) || !text(body.requirements, 2000)
      || !text(body.resources, 2000) || !text(body.approach, 2000)) return fail('Assessment outcome, notes, requirements, resources and approach are required', 400);
    if (body.reference !== undefined && !text(body.reference, 200, false)) return fail('Invalid assessment reference', 400);
    if (body.outcome === 'external' && !text(body.processType, 120)) return fail('Describe the applicable external process', 400);
    const assessment = { revision: next.revision, organization, actor: actor._id, at: now, category: incident.category,
      outcome: body.outcome, notes: body.notes.trim(), requirements: body.requirements.trim(), resources: body.resources.trim(),
      approach: body.approach.trim(), reference: body.reference?.trim(), processType: body.outcome === 'external' ? body.processType.trim() : undefined };
    next.assessments = [...(current.assessments || []), assessment];
    next.assessmentRevision = next.revision; next.outcome = body.outcome;
    // A revised assessment starts a new tracking cycle without removing old events.
    next.milestone = body.outcome === 'external' ? 'pending_external_processing' : undefined;
    status = { routine: 'routine_pending_authorization', external: 'pending_external_processing', responsibility_review: 'responsibility_review', clarification: 'assessment_clarification' }[body.outcome];
    event.remarks = assessment.notes; event.reference = assessment.reference;
  } else if (body.operation === 'external') {
    if (current?.outcome !== 'external' || !current.assessmentRevision) return fail('An external-processing assessment is required');
    if (!MILESTONES.includes(body.milestone) || !NEXT[current.milestone]?.includes(body.milestone)) return fail('Invalid external milestone transition');
    if (!text(body.remarks, 2000) || (body.reference !== undefined && !text(body.reference, 200, false))) return fail('Milestone remarks and a valid optional reference are required', 400);
    if (body.followUpAt !== undefined && (typeof body.followUpAt !== 'string' || !Number.isFinite(new Date(body.followUpAt).getTime()))) return fail('Invalid follow-up date', 400);
    const milestone = { assessmentRevision: current.assessmentRevision, previous: current.milestone, milestone: body.milestone,
      organization, actor: actor._id, at: now, remarks: body.remarks.trim(), reference: body.reference?.trim(), followUpAt: body.followUpAt };
    next.externalHistory = [...(current.externalHistory || []), milestone]; next.milestone = body.milestone;
    status = body.milestone; event.remarks = milestone.remarks; event.reference = milestone.reference;
  } else return fail('Unknown agency preparation operation', 400);
  event.status = status;
  next.history = [...(current?.history || []), event];
  return { preparation: next, status, event };
}
module.exports = { OUTCOMES, MILESTONES, prepareAgencyTransition, maintenanceReady };
