jest.mock('mongoose', () => ({ connect: jest.fn() }));
jest.mock('../utils/logger', () => ({ error: jest.fn() }));
const mongoose = require('mongoose');
const logger = require('../utils/logger');
test('connection failure logs metadata without URI credentials or stack', async () => {
  const marker = 'synthetic_sensitive_value';
  mongoose.connect.mockRejectedValue(new Error(`mongodb://operator:${marker}@host/db`));
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  try {
    await require('./database')();
    expect(exit).toHaveBeenCalledWith(1);
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(marker);
  } finally { exit.mockRestore(); }
});
