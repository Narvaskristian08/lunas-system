const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const { buildReadableIncidentScope } = require('./fieldIncidentAccess');
const { buildWorkOrderScope } = require('./workOrderService');
const validId = value => /^[a-f\d]{24}$/i.test(String(value || ''));

async function notificationResource(user, data = {}) {
  if (!user || user.role === 'admin') return null;
  if (data.workOrderId && ['utility_provider', 'repair_personnel'].includes(user.role)) {
    if (!validId(data.workOrderId)) return null;
    const order = await WorkOrder.findOne({ _id: data.workOrderId, ...buildWorkOrderScope(user) }).select('_id incident');
    if (!order) return null;
    const incident = await Incident.findOne({ _id: order.incident, $and: [await buildReadableIncidentScope(user)] }).select('_id reportNumber initialInspection completionInspection');
    if (!incident) return null;
    return { incidentId: incident._id, reportNumber: incident.reportNumber, workOrderId: order._id,
      destination: user.role === 'utility_provider' ? `/work-orders/${order._id}` : `/repair/work-orders/${order._id}` };
  }
  if (!data.incidentId && !data.reportNumber) return null;
  if (data.incidentId && !validId(data.incidentId)) return null;
  const incident = await Incident.findOne({ ...(data.incidentId ? { _id: data.incidentId } : { reportNumber: String(data.reportNumber) }),
    $and: [await buildReadableIncidentScope(user)] }).select('_id reportNumber initialInspection completionInspection');
  if (!incident) return null;
  if (user.role === 'barangay_tanod') {
    const inspection = await require('../models/Inspection').findOne({ incident: incident._id, tanod: user._id, barangay: user.barangay,
      status: { $in: ['assigned', 'in_progress', 'submitted'] },
      $or: [{ _id: incident.initialInspection }, { _id: incident.completionInspection }] }).select('_id');
    return inspection ? { incidentId: incident._id, inspectionId: inspection._id, reportNumber: incident.reportNumber, destination: `/tanod/inspections?inspectionId=${inspection._id}` } : null;
  }
  const destination = { citizen: `/reports/${incident._id}`, barangay_tanod: '/tanod/inspections', barangay_official: `/validation-routing/${incident._id}`, utility_provider: `/work-orders/intake/${incident._id}` }[user.role];
  return destination ? { incidentId: incident._id, reportNumber: incident.reportNumber, destination } : null;
}
module.exports = { notificationResource };
