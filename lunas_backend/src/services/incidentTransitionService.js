/**
 * The only 50% official decisions that may leave the submitted state. Keeping
 * this in one module prevents individual controllers from inventing status
 * changes or bypassing the workflow when later milestones are added.
 */
const SUBMITTED_DECISIONS = Object.freeze(['validated', 'rejected', 'duplicate']);

const isSubmittedDecision = (status) => SUBMITTED_DECISIONS.includes(status);

const transitionConflict = () => ({
  status: 409,
  message: 'This report has already been decided or changed by another official. Refresh it before taking another action.'
});

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
  SUBMITTED_DECISIONS,
  buildSubmittedTransition,
  isSubmittedDecision,
  transitionConflict
};
