jest.mock('../src/models/Incident', () => ({
  find: jest.fn(),
  updateOne: jest.fn()
}));
jest.mock('../src/utils/auditLogger', () => ({ createAuditLog: jest.fn() }));

const { buildIncidentBarangayPlan } = require('./audit-incident-barangays');

describe('legacy incident barangay migration planning', () => {
  test('normalizes only exact recognized values without changing coordinates', () => {
    const plan = buildIncidentBarangayPlan({
      location: {
        coordinates: [120.33, 16.04],
        address: { barangay: '  poblacion   oeste ', city: 'dagupan city' }
      }
    });

    expect(plan).toEqual(expect.objectContaining({
      status: 'normalizable',
      set: {
        'location.address.barangay': 'Poblacion Oeste',
        'location.address.city': 'Dagupan City'
      }
    }));
    expect(plan.set).not.toHaveProperty('location.coordinates');
  });

  test('requires manual correction for misspellings and conflicting jurisdictions', () => {
    expect(buildIncidentBarangayPlan({
      location: { address: { barangay: 'Pantalx' } }
    })).toEqual(expect.objectContaining({ status: 'manual' }));

    expect(buildIncidentBarangayPlan({
      location: { address: { barangay: 'Pantal' } },
      jurisdiction: { barangay: 'Lucao' }
    })).toEqual(expect.objectContaining({ status: 'manual' }));

    expect(buildIncidentBarangayPlan({
      location: { address: { barangay: 'Barangay III' } }
    })).toEqual(expect.objectContaining({ status: 'manual' }));
  });

  test('accepts an explicit canonical correction without guessing', () => {
    const plan = buildIncidentBarangayPlan({
      location: { address: { barangay: 'Unknown' } }
    }, 'pantal');

    expect(plan).toEqual(expect.objectContaining({
      status: 'correctable',
      source: 'explicit',
      set: expect.objectContaining({
        'location.address.barangay': 'Pantal',
        'jurisdiction.barangay': 'Pantal'
      })
    }));
  });
});
