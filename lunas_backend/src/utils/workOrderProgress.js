const MIN_PROGRESS_PERCENT = 0;
const MAX_PROGRESS_PERCENT = 100;

/**
 * Parse a supplied progress percentage without silently accepting empty or
 * non-numeric values. Route validation handles normal requests; these helpers
 * keep controller-level enforcement reliable for all callers.
 */
const normalizeProgressPercent = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;

  const progressPercent = Number(value);
  if (!Number.isFinite(progressPercent)) return null;
  if (progressPercent < MIN_PROGRESS_PERCENT || progressPercent > MAX_PROGRESS_PERCENT) {
    return null;
  }

  return progressPercent;
};

const getCurrentProgressPercent = (value) => {
  const progressPercent = normalizeProgressPercent(value);
  return progressPercent === null ? MIN_PROGRESS_PERCENT : progressPercent;
};

const validateProgressAdvance = (currentValue, requestedValue) => {
  const currentProgressPercent = getCurrentProgressPercent(currentValue);
  const progressPercent = normalizeProgressPercent(requestedValue);

  if (progressPercent === null) {
    return {
      valid: false,
      message: 'Progress percent must be a number between 0 and 100'
    };
  }

  if (progressPercent < currentProgressPercent) {
    return {
      valid: false,
      message: 'Progress percent cannot be lower than the current progress'
    };
  }

  return {
    valid: true,
    progressPercent
  };
};

module.exports = {
  MIN_PROGRESS_PERCENT,
  MAX_PROGRESS_PERCENT,
  normalizeProgressPercent,
  getCurrentProgressPercent,
  validateProgressAdvance
};
