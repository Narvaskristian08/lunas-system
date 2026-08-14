const JSON_FIELDS = ['location', 'images', 'aiAnalysis'];

/**
 * Multer leaves multipart text fields as strings. Parse only the structured
 * fields accepted by the incident endpoint before express-validator runs.
 */
exports.parseIncidentPayload = (req, res, next) => {
  if (!req.is('multipart/form-data')) return next();

  try {
    JSON_FIELDS.forEach((field) => {
      if (typeof req.body[field] === 'string') {
        req.body[field] = JSON.parse(req.body[field]);
      }
    });
    return next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in multipart incident fields'
    });
  }
};
