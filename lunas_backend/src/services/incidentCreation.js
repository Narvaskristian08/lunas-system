// Only a definitive reference-index collision is retryable. Never replay an
// ambiguous write/network failure which might already have committed.
exports.createIncidentRecord = async (Incident, fields) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { return await Incident.create(fields); }
    catch (error) {
      if (error.code !== 11000 || !error.keyPattern?.reportNumber || attempt === 2) throw error;
    }
  }
};
