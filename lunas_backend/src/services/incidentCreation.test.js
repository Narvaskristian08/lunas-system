const Incident = require('../models/Incident');
const { Types: { ObjectId } } = require('mongoose');
const { createIncidentRecord } = require('./incidentCreation');
const fields = () => ({ reporter: new ObjectId(), category: 'road', description: 'A damaged road surface', location: { coordinates: [120.3, 16.1], address: { barangay: 'Pantal' } } });
test('parallel validation allocates distinct readable references without a count query', async () => {
  const count = jest.spyOn(Incident, 'countDocuments').mockRejectedValue(new Error('must not count'));
  try {
    const docs = Array.from({ length: 500 }, () => new Incident(fields()));
    await Promise.all(docs.map(doc => doc.validate()));
    expect(new Set(docs.map(doc => doc.reportNumber)).size).toBe(500);
    expect(docs[0].reportNumber).toMatch(/^LUNAS-\d{6}-[A-F0-9]{24}$/);
    expect(count).not.toHaveBeenCalled();
    expect(Incident.schema.path('reportNumber').options.unique).toBe(true);
  } finally { count.mockRestore(); }
});
test('existing reference and incident identity survive repeat validation', async () => {
  const doc = new Incident({ ...fields(), reportNumber: 'LUNAS-202608-000123' });
  const id = doc._id;
  await doc.validate(); await doc.validate();
  expect(doc.reportNumber).toBe('LUNAS-202608-000123'); expect(doc._id).toEqual(id);
});
test('only definitive reference collisions retry, retaining evidence and ownership', async () => {
  const data = { ...fields(), images: [{ key: 'private-owned-object' }] };
  const model = { create: jest.fn().mockRejectedValueOnce({ code: 11000, keyPattern: { reportNumber: 1 } }).mockResolvedValueOnce(data) };
  await expect(createIncidentRecord(model, data)).resolves.toBe(data);
  expect(model.create).toHaveBeenNthCalledWith(1, data); expect(model.create).toHaveBeenNthCalledWith(2, data);
});
test.each([new Error('ambiguous write'), { code: 11000, keyPattern: { _id: 1 } }])('uncertain or unrelated write failures never replay', async error => {
  const model = { create: jest.fn().mockRejectedValue(error) };
  await expect(createIncidentRecord(model, fields())).rejects.toEqual(error);
  expect(model.create).toHaveBeenCalledTimes(1);
});
test('repeated reference collision exhausts a bounded retry budget', async () => {
  const error = { code: 11000, keyPattern: { reportNumber: 1 } };
  const model = { create: jest.fn().mockRejectedValue(error) };
  await expect(createIncidentRecord(model, fields())).rejects.toEqual(error);
  expect(model.create).toHaveBeenCalledTimes(3);
});
