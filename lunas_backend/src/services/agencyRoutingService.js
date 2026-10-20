const Rule = require('../models/AgencyRoutingRule');
const User = require('../models/User');
const { INCIDENT_CATEGORY_CODES } = require('../utils/incidentCategories');
const { canonicalizeBarangay } = require('../data/dagupanBarangays');
const { getIncidentBarangay } = require('./jurisdictionService');

// Exact, structured facts only. Reporter text and demonstration accounts never
// establish asset ownership. Ambiguity fails closed, even within one agency.
function resolveRouting(incident, rules, now = new Date()) {
  const pending = (reason, candidates = []) => ({ reason, candidates, outcome: 'review_required' });
  if (!INCIDENT_CATEGORY_CODES.includes(incident.category)) return pending('invalid_category');
  const asset = incident.routingAsset;
  if (!asset?.assetType || !asset.ownerId || !asset.verifiedBy || !asset.verificationReference || !asset.verifiedAt
    || !Number.isFinite(new Date(asset.verifiedAt).getTime()) || new Date(asset.verifiedAt) > now) return pending('unknown_ownership');
  const barangay = canonicalizeBarangay(getIncidentBarangay(incident));
  const city = incident.jurisdiction?.city || incident.location?.address?.city;
  if (!barangay || !city) return pending('missing_jurisdiction');
  const matches = rules.filter(rule => rule.category === incident.category && rule.assetType === asset.assetType
    && rule.ownerId === asset.ownerId && rule.city === city && rule.barangays?.includes(barangay));
  if (!matches.length) return pending('no_matching_configuration');
  const candidates = matches.map(rule => ({ ruleId: rule.ruleId, version: rule.version, agencyId: rule.agencyId, organization: rule.organization }));
  const valid = rule => rule.ruleId && Number.isInteger(rule.version) && rule.version > 0 && rule.agencyId
    && rule.organization?.trim() && rule.approvedBy && rule.approvalReference && rule.active === true && rule.participating === true
    && Number.isFinite(new Date(rule.effectiveFrom).getTime()) && new Date(rule.effectiveFrom) <= now
    && (!rule.effectiveUntil || (Number.isFinite(new Date(rule.effectiveUntil).getTime()) && new Date(rule.effectiveUntil) > now));
  if (matches.some(rule => !valid(rule))) return pending('inactive_or_invalid_configuration', candidates);
  if (matches.length !== 1) return pending('conflicting_configuration', candidates);
  return { outcome: 'matched', reason: 'approved_ownership_and_jurisdiction', candidates, rule: matches[0] };
}

async function evaluateRouting(incident) {
  const preliminary = resolveRouting(incident, []);
  if (preliminary.reason !== 'no_matching_configuration') return { ...preliminary, providers: [] };
  try {
    const rules = await Rule.find({ category: incident.category }).lean();
    const decision = resolveRouting(incident, rules);
    if (decision.outcome !== 'matched') return { ...decision, providers: [] };
    const providers = await User.find({ role: 'utility_provider', utilityCompany: decision.rule.organization, isActive: true,
      isArchived: { $ne: true }, requiresActivation: { $ne: true }, accountStatus: { $nin: ['pending_activation', 'suspended', 'deactivated'] } }).select('_id');
    if (!providers.length) return { outcome: 'review_required', reason: 'no_active_participating_account', candidates: decision.candidates, providers: [] };
    return { ...decision, providers };
  } catch (_) {
    // Configuration availability must not erase a valid Secretary decision.
    return { outcome: 'review_required', reason: 'configuration_unavailable', candidates: [], providers: [] };
  }
}
module.exports = { resolveRouting, evaluateRouting };
