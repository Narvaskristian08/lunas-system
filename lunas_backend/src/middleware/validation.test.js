const { validationResult } = require('express-validator');
const {
  createIncidentValidation,
  updateJurisdictionValidation,
  registerValidation,
  changePasswordValidation,
  validateIncidentDecisionValidation,
  routeIncidentValidation,
  rejectIncidentDecisionValidation,
  markDuplicateValidation
} = require('./validation');

const runRules = async (rules, body, files = {}, user = { role: 'citizen' }) => {
  const req = { body, files, user };
  await Promise.all(rules.map((rule) => rule.run(req)));
  return validationResult(req).array();
};

const runRulesWithRequest = async (rules, body, files = {}, user = { role: 'citizen' }) => {
  const req = { body, files, user };
  for (const rule of rules) await rule.run(req);
  return { req, errors: validationResult(req).array() };
};

describe('request validation', () => {
  test('password changes reject reuse of the current password', async () => {
    const errors = await runRules(changePasswordValidation, {
      currentPassword: 'UniqueCurrentPass42!', newPassword: 'UniqueCurrentPass42!'
    });
    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'newPassword', msg: 'Choose a new password that is different from your current password.' })
    ]));
  });

  test('password changes accept a distinct strong password', async () => {
    expect(await runRules(changePasswordValidation, {
      currentPassword: 'UniqueCurrentPass42!', newPassword: 'DistinctNextPass73!'
    })).toEqual([]);
  });
  test('public registration rejects a privileged requested role', async () => {
    const errors = await runRules(registerValidation, {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'juan@example.com',
      phone: '09123456789',
      password: 'SecurePass123',
      role: 'admin'
    });

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'role' })
    ]));
  });

  test('incident reports require valid coordinates and at least one evidence image', async () => {
    const errors = await runRules(createIncidentValidation, {
      locationIntegrity: { confirmed: true, pinSource: 'manual' },
      category: 'road',
      description: 'A large pothole is causing a hazard for motorists.',
      location: {
        type: 'Point',
        coordinates: [190, 16.04],
        address: { barangay: 'Poblacion Oeste' }
      }
    });

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ msg: 'Longitude must be between -180 and 180' }),
      expect.objectContaining({ msg: 'At least one evidence image is required' })
    ]));
  });

  test('a well-formed JSON report with evidence metadata validates', async () => {
    const { req, errors } = await runRulesWithRequest(createIncidentValidation, {
      locationIntegrity: { confirmed: true, pinSource: 'manual' },
      category: 'road',
      subcategory: 'pothole',
      description: 'A large pothole is causing a hazard for motorists.',
      location: {
        type: 'Point',
        coordinates: [120.3387, 16.0433],
        address: { barangay: '  poblacion   oeste ', city: 'dagupan city' }
      },
      images: [{ url: 'https://storage.example/evidence.jpg' }],
      privacyAcknowledged: true
    });

    expect(errors).toEqual([]);
    expect(req.body.location.address).toEqual(expect.objectContaining({
      barangay: 'Poblacion Oeste',
      city: 'Dagupan City'
    }));
  });

  test('rejects invalid and misspelled incident barangays', async () => {
    const errors = await runRules(createIncidentValidation, {
      locationIntegrity: { confirmed: true, pinSource: 'manual' },
      category: 'road',
      description: 'A large pothole is causing a hazard for motorists.',
      location: {
        type: 'Point',
        coordinates: [120.3387, 16.0433],
        address: { barangay: 'Poblacion West', city: 'Dagupan City' }
      },
      images: [{ url: 'https://storage.example/evidence.jpg' }],
      privacyAcknowledged: true
    });

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'location.address.barangay',
        msg: 'Choose a recognized Dagupan barangay'
      })
    ]));
  });

  test('normalizes and validates authorized jurisdiction updates', async () => {
    const valid = await runRulesWithRequest(updateJurisdictionValidation, {
      barangay: 'pantal',
      city: 'DAGUPAN CITY'
    }, {}, { role: 'city_engineer' });
    const invalid = await runRules(updateJurisdictionValidation, {
      barangay: 'Pantall',
      city: 'Dagupan City'
    }, {}, { role: 'city_engineer' });

    expect(valid.errors).toEqual([]);
    expect(valid.req.body).toEqual({ barangay: 'Pantal', city: 'Dagupan City' });
    expect(invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'barangay' })
    ]));
  });

  test('requires citizen acknowledgement when evidence cannot be server-redacted', async () => {
    const errors = await runRules(createIncidentValidation, {
      locationIntegrity: { confirmed: true, pinSource: 'manual' },
      category: 'road',
      description: 'A large pothole is causing a hazard for motorists.',
      location: {
        type: 'Point',
        coordinates: [120.3387, 16.0433],
        address: { barangay: 'Poblacion Oeste' }
      },
      images: [{ url: 'https://storage.example/evidence.jpg' }]
    });

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ msg: 'Privacy acknowledgement is required before submitting evidence' })
    ]));
  });

  test('priority has a separate City Engineering endpoint; Barangay validation requires no priority field', async () => {
    const validationErrors = await runRules(validateIncidentDecisionValidation, {
      priority: 'urgent'
    });
    const rejectionErrors = await runRules(rejectIncidentDecisionValidation, {
      reason: '   '
    });

    expect(validationErrors).toEqual([]);
    expect(rejectionErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'reason' })
    ]));
  });

  test('requires a complete Utility Provider route', async () => {
    const errors = await runRules(routeIncidentValidation, {
      responsibleRole: 'utility_provider'
    }, {}, { role: 'city_engineer' });

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'responsibleOrganization' })
    ]));
  });

  test('requires a valid canonical report and reason for duplicate decisions', async () => {
    const errors = await runRules(markDuplicateValidation, {
      duplicateOf: 'not-an-object-id',
      reason: ''
    });

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'duplicateOf' }),
      expect.objectContaining({ path: 'reason' })
    ]));
  });
});


test.each(['awaiting_review', 'needs_correction', 'rework_required', 'city_correction_required'])('work order query permits correction queue %s', async (status) => {
  const req = { query: { status }, user: { role: 'utility_provider' } };
  for (const rule of require('./validation').workOrderQueryValidation) await rule.run(req);
  expect(validationResult(req).array()).toEqual([]);
});
