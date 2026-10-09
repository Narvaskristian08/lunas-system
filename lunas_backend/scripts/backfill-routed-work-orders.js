const mongoose = require('mongoose');
const Incident = require('../src/models/Incident');
const WorkOrder = require('../src/models/WorkOrder');
const { initializeIncidentSLA } = require('../src/services/slaService');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  let created = 0;
  for (const incident of await Incident.find({ status: 'provider_assigned', workOrder: null })) {
    const existing = await WorkOrder.findOne({ incident: incident._id });
    const actor = incident.providerAssignedBy || incident.routing?.routedBy;
    if (!actor || !incident.routing?.responsibleOrganization || !incident.priority) continue;
    const sla = incident.sla?.deadline ? incident.sla.toObject ? incident.sla.toObject() : incident.sla : initializeIncidentSLA(incident.priority, incident.providerAssignedAt || incident.routing.routedAt || new Date());
    const order = existing || await WorkOrder.create({ incident: incident._id, responsibleOrganization: incident.routing.responsibleOrganization,
      responsibleRole: 'utility_provider', jurisdiction: incident.jurisdiction, priority: incident.priority, createdBy: actor,
      status: 'pending', assignmentState: 'unassigned', progressPercent: 0, progressStage: 'assigned', sla,
      history: [{ type: 'created', actor, actorRole: 'city_engineer', status: 'pending', notes: 'Work order created for previously routed incident' }] });
    try {
      const linked = await Incident.updateOne({ _id: incident._id, status: 'provider_assigned', workOrder: null }, { $set: { workOrder: order._id, sla } });
      if (!linked.modifiedCount && !existing) await WorkOrder.deleteOne({ _id: order._id });
      else if (!existing) created++;
    } catch (error) { if (!existing) await WorkOrder.deleteOne({ _id: order._id }); throw error; }
  }
  console.log(`Created ${created} missing work orders.`);
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
