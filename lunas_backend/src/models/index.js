// Export all models for easy importing
module.exports = {
  User: require('./User'),
  Incident: require('./Incident'),
  WorkOrder: require('./WorkOrder'),
  Category: require('./Category'),
  SLAConfig: require('./SLAConfig'),
  Notification: require('./Notification'),
  AuditLog: require('./AuditLog'),
  SystemConfig: require('./SystemConfig')
};
