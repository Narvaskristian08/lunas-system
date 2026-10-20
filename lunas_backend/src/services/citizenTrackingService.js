const { getSlaProjection } = require('./workOrderService');
const agencyLabels = { acknowledged: 'Under agency assessment', routine_pending_authorization: 'Awaiting work authorization', pending_external_processing: 'Awaiting external processing', pending_funding: 'Awaiting external funding', for_bidding: 'External bidding tracked', bidding_completed: 'Bidding completed; work authorization pending', awaiting_work_authorization: 'Awaiting work authorization', responsibility_review: 'Agency assignment under review', assessment_clarification: 'Agency assessment needs clarification', work_completed: 'Repair submitted for review' };
const validDate = value => value && Number.isFinite(new Date(value).getTime()) ? new Date(value) : null;
function citizenTracking(incident) {
  const labels = { submitted: 'Awaiting barangay verification', tanod_assigned: 'Awaiting field verification', tanod_in_progress: 'Under field verification', tanod_verified: 'Awaiting barangay review', clarification_required: 'Additional information requested', tanod_rejected: 'Verification not approved', provider_assigned: 'Assigned to responsible agency', repair_assigned: 'Repair assignment pending', in_progress: 'Repair in progress', repair_completed: 'Repair submitted for review', provider_review: 'Repair submitted for review', rework_required: 'Corrective work required', closed: 'Closed', resolved: 'Resolved' };

  const routing = incident.routing;
  const verified = incident.routingReview?.outcome === 'matched' && routing?.agencyId && routing.ruleId
    && Number.isInteger(routing.policyVersion) && routing.policyVersion > 0 && validDate(routing.routedAt)
    && incident.categoryConfirmedBy && validDate(incident.categoryConfirmedAt);
  const underReview = incident.routingReview?.outcome === 'review_required';
  const agencyAssignment = verified && routing.responsibleOrganization
    ? { status: 'assigned', organization: routing.responsibleOrganization }
    : { status: underReview ? 'under_review' : 'awaiting_agency_assignment' };
  let label = labels[incident.status] || 'Report status recorded';
  if (incident.status === 'tanod_verified' && incident.categoryConfirmedAt) label = 'Verified; awaiting agency assignment';
  if (incident.status === 'provider_assigned') label = agencyLabels[incident.agencyStatus] || (verified ? 'Assigned to agency; maintenance authorization pending' : 'Awaiting verified agency assignment');
  if (underReview && incident.status === 'provider_assigned') label = 'Agency assignment under review';
  const clock = incident.sla || {};
  const start = validDate(clock.startedAt); const deadline = validDate(clock.deadline); const closed = validDate(clock.closedAt);
  const terminal = ['met', 'breached', 'cancelled'].includes(clock.state);
  const established = start && start <= new Date() && deadline && deadline >= start && ['active', 'approaching', 'overdue', 'met', 'breached', 'cancelled'].includes(clock.state) && (!terminal || (closed && closed >= start));
  const projection = established ? getSlaProjection(clock) : { state: 'not_started' };
  const sla = { ...projection, recordedAt: new Date(),
    ...(established ? { startedAt: start, deadline, recordedState: clock.state, ...(terminal && closed ? { closedAt: closed } : {}) } : {}),
    // Preserve a recorded breach as history, even when old timing needs reconciliation.
    ...(clock.state === 'breached' ? { recordedOutcome: 'breached' } : {}) };
  return { statusLabel: label, agencyAssignment, sla, maintenanceAuthorization: incident.agencyPreparation ? 'policy_pending' : 'not_established' };
}
module.exports = { citizenTracking, agencyLabels };
