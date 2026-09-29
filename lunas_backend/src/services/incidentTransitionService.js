/** The current LUNAS incident lifecycle. */
const INCIDENT_STATES = Object.freeze([
  'submitted',
  'barangay_validated',
  'city_confirmed',
  'prioritized',
  'provider_assigned',
  'repair_assigned',
  'in_progress',
  'repair_completed',
  'provider_review',
  'rework_required',
  'provider_accepted',
  'city_verification',
  'city_correction_required',
  'verified',
  'resolved',
  'closed',
  'clarification_required',
  'rejected',
  'duplicate'
]);

const INCIDENT_TRANSITIONS = Object.freeze({
  submitted: Object.freeze(['barangay_validated', 'rejected', 'duplicate']),
  barangay_validated: Object.freeze(['city_confirmed', 'clarification_required']),
  city_confirmed: Object.freeze(['prioritized']),
  prioritized: Object.freeze(['provider_assigned']),
  provider_assigned: Object.freeze(['repair_assigned']),
  repair_assigned: Object.freeze(['provider_assigned', 'in_progress']),
  in_progress: Object.freeze(['repair_completed']),
  repair_completed: Object.freeze(['provider_review']),
  provider_review: Object.freeze(['rework_required', 'provider_accepted']),
  rework_required: Object.freeze(['in_progress']),
  provider_accepted: Object.freeze(['city_verification']),
  city_verification: Object.freeze(['city_correction_required', 'verified']),
  city_correction_required: Object.freeze(['rework_required']),
  verified: Object.freeze(['resolved']),
  resolved: Object.freeze(['closed']),
  clarification_required: Object.freeze(['barangay_validated'])
});

const SUBMITTED_DECISIONS = INCIDENT_TRANSITIONS.submitted;

const isSubmittedDecision = (status) => SUBMITTED_DECISIONS.includes(status);

const canTransitionIncident = (currentStatus, nextStatus) =>
  Boolean(INCIDENT_TRANSITIONS[currentStatus]?.includes(nextStatus));

const transitionConflict = () => ({
  status: 409,
  message: 'This report has already been decided or changed by another official. Refresh it before taking another action.'
});

const buildIncidentTransition = ({
  currentStatus,
  nextStatus,
  actor,
  actorRole,
  notes,
  fields = {},
  metadata = {},
  now = new Date()
}) => {
  if (!canTransitionIncident(currentStatus, nextStatus)) {
    throw new Error(`Unsupported incident transition: ${currentStatus} -> ${nextStatus}`);
  }
  return {
    filter: { status: currentStatus },
    update: {
      $set: { status: nextStatus, ...fields },
      $push: {
        statusHistory: {
          status: nextStatus,
          changedBy: actor,
          actorRole,
          changedAt: now,
          notes,
          metadata
        }
      }
    },
    now
  };
};

/**
 * Build an atomic Mongoose update for a decision from `submitted` only. The
 * caller must combine `filter` with its jurisdiction scope. A conditional
 * findOneAndUpdate means only one stale official decision can win.
 */
const buildSubmittedTransition = ({
  nextStatus,
  actor,
  actorRole,
  notes,
  fields = {},
  metadata = {},
  now = new Date()
}) => {
  if (!isSubmittedDecision(nextStatus)) {
    throw new Error(`Unsupported submitted incident transition: ${nextStatus}`);
  }

  return {
    filter: { status: 'submitted' },
    update: {
      $set: {
        status: nextStatus,
        ...fields
      },
      $push: {
        statusHistory: {
          status: nextStatus,
          changedBy: actor,
          actorRole,
          changedAt: now,
          notes,
          metadata
        }
      }
    },
    now
  };
};

module.exports = {
  INCIDENT_STATES,
  INCIDENT_TRANSITIONS,
  SUBMITTED_DECISIONS,
  buildIncidentTransition,
  buildSubmittedTransition,
  canTransitionIncident,
  isSubmittedDecision,
  transitionConflict
};
