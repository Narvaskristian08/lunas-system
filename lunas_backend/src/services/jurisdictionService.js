const OFFICIAL_VALIDATION_ROLES = Object.freeze([
  'barangay_official',
  'city_engineer',
  'utility_provider',
  'admin'
]);

// Utility providers are operationally official, but at this milestone their
// server scope is limited to already routed incidents. They cannot decide a
// newly submitted report; doing so would turn routing into a hidden repair or
// provider-assignment workflow. Keep this narrower set reusable at route
// boundaries instead of accepting a request and failing only inside a handler.
const VALIDATION_DECISION_ROLES = Object.freeze([
  'barangay_official',
  'city_engineer',
  'admin'
]);

const RESPONSIBLE_ROLES = Object.freeze([
  'barangay',
  'city_engineering',
  'utility_provider'
]);

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const asId = (value) => (value?._id || value)?.toString();

const getIncidentBarangay = (incident) => normalizeText(
  incident?.jurisdiction?.barangay || incident?.location?.address?.barangay
);

const getIncidentCity = (incident) => normalizeText(
  incident?.jurisdiction?.city || incident?.location?.address?.city || 'Dagupan City'
);

const isValidationOfficial = (user) => Boolean(user && OFFICIAL_VALIDATION_ROLES.includes(user.role));
const isValidationDecisionOfficial = (user) => Boolean(user && VALIDATION_DECISION_ROLES.includes(user.role));

/**
 * Build a database scope that is safe to combine with any incident query.
 * Scope must be applied in the query itself, not just checked after an ID
 * lookup, so URL/ID tampering cannot disclose another jurisdiction's data.
 */
const buildIncidentScope = (user) => {
  if (!user) return { _id: null };

  if (user.role === 'admin' || user.role === 'city_engineer') return {};

  if (user.role === 'citizen') return { reporter: user._id };

  if (user.role === 'barangay_official') {
    const barangay = normalizeText(user.barangay);
    if (!barangay) return { _id: null };

    // Existing 25% reports do not have `jurisdiction` yet. Keep them visible
    // only when their submitted barangay matches the official's assignment.
    return {
      $or: [
        { 'jurisdiction.barangay': barangay },
        {
          'jurisdiction.barangay': { $exists: false },
          'location.address.barangay': barangay
        }
      ]
    };
  }

  if (user.role === 'utility_provider') {
    const organization = normalizeText(user.utilityCompany);
    return organization
      ? { 'routing.responsibleOrganization': organization }
      : { _id: null };
  }

  // Repair personnel and unknown roles do not have incident-review access.
  return { _id: null };
};

const combineIncidentFilters = (...filters) => {
  const meaningful = filters.filter((filter) => filter && Object.keys(filter).length);
  if (!meaningful.length) return {};
  if (meaningful.length === 1) return meaningful[0];
  return { $and: meaningful };
};

const canAccessIncident = (user, incident) => {
  if (!user || !incident) return false;
  if (user.role === 'admin' || user.role === 'city_engineer') return true;

  if (user.role === 'citizen') {
    return asId(incident.reporter) === asId(user._id);
  }

  if (user.role === 'barangay_official') {
    return getIncidentBarangay(incident) === normalizeText(user.barangay);
  }

  if (user.role === 'utility_provider') {
    return normalizeText(incident?.routing?.responsibleOrganization)
      === normalizeText(user.utilityCompany);
  }

  return false;
};

const canConfirmJurisdiction = (user, jurisdiction) => {
  if (!isValidationOfficial(user)) return false;
  if (user.role === 'admin' || user.role === 'city_engineer') return true;
  if (user.role !== 'barangay_official') return false;

  return normalizeText(jurisdiction?.barangay) === normalizeText(user.barangay);
};

const canRouteIncident = (user, routing, jurisdiction) => {
  if (!isValidationOfficial(user)) return false;
  if (user.role === 'admin' || user.role === 'city_engineer') return true;

  // A barangay official may keep an incident with their own barangay but may
  // not route it to arbitrary providers or other barangays.
  if (user.role === 'barangay_official') {
    return routing?.responsibleRole === 'barangay'
      && normalizeText(jurisdiction?.barangay) === normalizeText(user.barangay);
  }

  return false;
};

const defaultJurisdictionFor = (incident) => ({
  barangay: getIncidentBarangay(incident),
  city: getIncidentCity(incident),
  responsibility: incident?.jurisdiction?.responsibility || 'barangay'
});

const defaultRoutingFor = (user, jurisdiction) => {
  if (user.role === 'barangay_official') {
    return {
      responsibleOrganization: `Barangay ${jurisdiction.barangay}`,
      responsibleRole: 'barangay'
    };
  }

  return {
    responsibleOrganization: 'City Engineering',
    responsibleRole: 'city_engineering'
  };
};

module.exports = {
  OFFICIAL_VALIDATION_ROLES,
  VALIDATION_DECISION_ROLES,
  RESPONSIBLE_ROLES,
  buildIncidentScope,
  combineIncidentFilters,
  canAccessIncident,
  canConfirmJurisdiction,
  canRouteIncident,
  defaultJurisdictionFor,
  defaultRoutingFor,
  getIncidentBarangay,
  getIncidentCity,
  isValidationOfficial,
  isValidationDecisionOfficial,
  normalizeText
};
