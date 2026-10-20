const Inspection = require('./Inspection');
const { Types: { ObjectId } } = require('mongoose');
afterEach(() => jest.restoreAllMocks());
test('Mongoose save uses persisted version and rejects a lost inspection race', async () => {
  const inspection = Inspection.hydrate({ _id: new ObjectId(), incident: new ObjectId(),
    secretary: new ObjectId(), tanod: new ObjectId(), barangay: 'Pantal',
    type: 'initial', status: 'submitted', result: 'verified', version: 7 });
  inspection.status = 'approved';
  const write = jest.spyOn(Inspection.collection, 'updateOne').mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
  await expect(inspection.save()).rejects.toMatchObject({ name: 'VersionError' });
  expect(write.mock.calls[0][0]).toMatchObject({ _id: inspection._id, version: 7 });
  expect(write.mock.calls[0][1].$inc).toMatchObject({ version: 1 });
});
