const { buildIncidentScope, combineIncidentFilters } = require('./jurisdictionService');
const { canonicalizeBarangay } = require('../data/dagupanBarangays');

const isFieldRole = user => ['barangay_tanod', 'repair_personnel'].includes(user?.role);
const ACTIVE_INSPECTIONS = ['assigned', 'in_progress', 'submitted'];
const barangayScope = barangay => ({ $or: [
  { 'jurisdiction.barangay': barangay },
  { 'jurisdiction.barangay': { $exists: false }, 'location.address.barangay': barangay }
] });

// Generic synchronous scopes deliberately deny field roles. Resolve current
// relationships here, then bind both sides of the relationship in the query.
const buildReadableIncidentScope = async user => {
  if (!isFieldRole(user)) return buildIncidentScope(user);
  if (!user?._id) return { _id: null };
  if (user.role === 'barangay_tanod') {
    const barangay = canonicalizeBarangay(user.barangay);
    if (!barangay) return { _id: null };
    const inspections = await require('../models/Inspection').find({
      tanod: user._id, barangay, status: { $in: ACTIVE_INSPECTIONS }
    }).select('_id incident type').lean();
    const links = inspections.filter(i => i.incident && ['initial', 'completion'].includes(i.type))
      .map(i => ({ _id: i.incident,
        [i.type === 'initial' ? 'initialInspection' : 'completionInspection']: i._id,
        status: { $in: ['tanod_assigned', 'tanod_in_progress', 'tanod_verified', ...(i.type === 'initial' ? ['clarification_required'] : [])] },
        ...(i.type === 'completion' ? { agencyStatus: 'work_completed' } : {})
      }));
    return links.length ? combineIncidentFilters(barangayScope(barangay), { $or: links }) : { _id: null };
  }
  const { buildWorkOrderScope } = require('./workOrderService');
  const scope = buildWorkOrderScope(user);
  if (scope._id === null) return scope;
  const orders = await require('../models/WorkOrder').find(scope).select('_id incident').lean();
  const links = orders.filter(o => o.incident).map(o => ({ _id: o.incident, workOrder: o._id }));
  return links.length ? combineIncidentFilters(
    { 'routing.responsibleOrganization': user.repairOrganization },
    user.barangay ? barangayScope(canonicalizeBarangay(user.barangay) || '__invalid__') : {},
    { $or: links }
  ) : { _id: null };
};

module.exports = { buildReadableIncidentScope, isFieldRole, ACTIVE_INSPECTIONS, barangayScope };
