// These codes are the existing Incident model's canonical category values.
// Category documents may add labels/descriptions, but reports keep stable
// codes so historical data and authorization rules remain compatible.
const categories = [
  { code: 'road', name: 'Road damage', description: 'Potholes, cracks, and road-surface damage.' },
  { code: 'drainage', name: 'Drainage', description: 'Visible garbage blocking roadside drains, gutters, or canals.' },
  { code: 'electrical', name: 'Electrical', description: 'Electrical infrastructure hazards and outages.' },
  { code: 'water', name: 'Water', description: 'Water leaks and water-supply infrastructure issues.' },
  { code: 'streetlight', name: 'Streetlight', description: 'Damaged, missing, or malfunctioning streetlights.' }
];

exports.INCIDENT_CATEGORY_CODES = categories.map((category) => category.code);
exports.DEFAULT_INCIDENT_CATEGORIES = categories;
exports.isIncidentCategory = (value) => exports.INCIDENT_CATEGORY_CODES.includes(value);
