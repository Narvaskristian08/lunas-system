const { validationResult } = require('express-validator');
const {
  createIncidentValidation,
  registerValidation,
  validateIncidentDecisionValidation,
  rejectIncidentDecisionValidation,
  markDuplicateValidation
} = require('./validation');

const runRules = async (rules, body, files = {}, user = { role: 'citizen' }) => {
  const req = { body, files, user };
  await Promise.all(rules.map((rule) => rule.run(req)));
  return validationResult(req).array();
};

describe('25% milestone request validation', () => {
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
    const errors = await runRules(createIncidentValidation, {
      category: 'road',
      subcategory: 'pothole',
      description: 'A large pothole is causing a hazard for motorists.',
      location: {
        type: 'Point',
        coordinates: [120.3387, 16.0433],
        address: { barangay: 'Poblacion Oeste', city: 'Dagupan City' }
      },
      images: [{ url: 'https://storage.example/evidence.jpg' }],
      privacyAcknowledged: true
    });

    expect(errors).toEqual([]);
  });

  test('requires citizen acknowledgement when evidence cannot be server-redacted', async () => {
    const errors = await runRules(createIncidentValidation, {
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

  test('requires priority for validation and a nonblank reason for rejection', async () => {
    const validationErrors = await runRules(validateIncidentDecisionValidation, {
      priority: 'urgent'
    });
    const rejectionErrors = await runRules(rejectIncidentDecisionValidation, {
      reason: '   '
    });

    expect(validationErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'priority' })
    ]));
    expect(rejectionErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'reason' })
    ]));
  });

  test('does not accept a partial routing object during validation', async () => {
    const errors = await runRules(validateIncidentDecisionValidation, {
      priority: 'high',
      routing: { responsibleRole: 'utility_provider' }
    }, {}, { role: 'city_engineer' });

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'routing' })
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
