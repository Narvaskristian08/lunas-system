const {
  buildIncidentScope,
  canAccessIncident,
  canConfirmJurisdiction,
  canRouteIncident,
  isValidationDecisionOfficial
} = require('./jurisdictionService');

describe('jurisdiction authorization', () => {
  const barangayOfficial = { _id: 'official-1', role: 'barangay_official', barangay: 'Poblacion Oeste' };

  test('builds a barangay query scope instead of trusting a client filter', () => {
    expect(buildIncidentScope(barangayOfficial)).toEqual({
      $or: [
        { 'jurisdiction.barangay': 'Poblacion Oeste' },
        {
          'jurisdiction.barangay': { $exists: false },
          'location.address.barangay': 'Poblacion Oeste'
        }
      ]
    });
  });

  test('canonicalizes official assignments and denies invalid legacy assignments', () => {
    expect(buildIncidentScope({
      ...barangayOfficial,
      barangay: '  poblacion   oeste '
    })).toEqual(buildIncidentScope(barangayOfficial));
    expect(buildIncidentScope({
      ...barangayOfficial,
      barangay: 'Barangay III'
    })).toEqual({ _id: null });
  });

  test('denies cross-barangay incident access and route changes', () => {
    const incident = {
      location: { address: { barangay: 'Bonuan Gueset' } },
      jurisdiction: { barangay: 'Bonuan Gueset' }
    };
    expect(canAccessIncident(barangayOfficial, incident)).toBe(false);
    expect(canConfirmJurisdiction(barangayOfficial, { barangay: 'Bonuan Gueset' })).toBe(false);
    expect(canRouteIncident(
      barangayOfficial,
      { responsibleRole: 'utility_provider' },
      { barangay: 'Bonuan Gueset' }
    )).toBe(false);
  });

  test('denies retired city-wide authority', () => {
    const cityEngineer = { _id: 'official-2', role: 'city_engineer' };
    expect(buildIncidentScope(cityEngineer)).toEqual({ _id: null });
    expect(canConfirmJurisdiction(cityEngineer, { barangay: 'Bonuan Gueset' })).toBe(false);
    expect(canRouteIncident(
      cityEngineer,
      { responsibleRole: 'utility_provider' },
      { barangay: 'Bonuan Gueset' }
    )).toBe(false);
  });

  test('keeps utility-provider access scoped to already routed reports, not submitted-state decisions', () => {
    const provider = { _id: 'provider-1', role: 'utility_provider', utilityCompany: 'Dagupan Water District' };
    expect(buildIncidentScope(provider)).toEqual({
      'routing.responsibleOrganization': 'Dagupan Water District'
    });
    expect(isValidationDecisionOfficial(provider)).toBe(false);
    expect(isValidationDecisionOfficial(barangayOfficial)).toBe(true);
  });
});


test('City Engineering provider accounts cannot access another organization', () => {
  const provider = { role: 'utility_provider', utilityCompany: 'Dagupan City Engineering Office' };
  expect(buildIncidentScope(provider)).toEqual({ 'routing.responsibleOrganization': provider.utilityCompany });
  expect(canAccessIncident(provider, { routing: { responsibleOrganization: 'DECORP' } })).toBe(false);
  expect(canAccessIncident(provider, { routing: { responsibleOrganization: provider.utilityCompany } })).toBe(true);
});
