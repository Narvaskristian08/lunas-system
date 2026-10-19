require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Incident = require('../src/models/Incident');
const WorkOrder = require('../src/models/WorkOrder');
const { requireLocalSeedEnvironment } = require('./dagupan-seed-config');

async function migrate() {
  const uri = requireLocalSeedEnvironment({ ...process.env, ALLOW_DEMO_SEED: 'true', DEMO_SEED_DOCKER: process.env.DEMO_SEED_DOCKER || 'true' });
  await mongoose.connect(uri);
  try {
    const personnel = await User.find({ role: 'repair_personnel', repairOrganization: { $exists: true, $ne: '' } });
    let convertedPersonnel = 0;
    for (const user of personnel) {
      user.barangay = user.barangay || user.address?.barangay || 'Poblacion Oeste';
      user.organization = user.organization || `Barangay ${user.barangay}`;
      user.repairOrganization = undefined;
      user.repairTeam = undefined;
      user.repairAccountType = undefined;
      user.availability = 'available';
      await user.save({ validateBeforeSave: false });
      convertedPersonnel += 1;
    }
    const activeOrders = await WorkOrder.find({ status: { $in: ['pending', 'accepted', 'in_progress'] } }).select('incident').lean();
    const activeIncidentIds = activeOrders.map((order) => order.incident).filter(Boolean);
    const movedActive = activeIncidentIds.length
      ? (await Incident.updateMany({ _id: { $in: activeIncidentIds }, status: { $in: ['repair_assigned', 'in_progress'] } }, { $set: { status: 'provider_assigned', agencyStatus: 'ready_for_work' } })).modifiedCount
      : 0;
    const completed = await Incident.updateMany({ status: { $in: ['provider_review', 'provider_accepted', 'verified', 'resolved'] } }, { $set: { agencyStatus: 'work_completed' } });
    console.log(JSON.stringify({ convertedPersonnel, activeAssignmentsReturned: movedActive, completedAgencyStatuses: completed.modifiedCount }));
  } finally { await mongoose.disconnect(); }
}
if (require.main === module) migrate().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { migrate };
