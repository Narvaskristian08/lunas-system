const express = require('express');
const request = require('supertest');
const { uploadIncidentEvidence } = require('./upload');

const app = express();
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;
app.post('/evidence', uploadIncidentEvidence, (req, res) => {
  res.status(200).json({ success: true, count: Object.values(req.files || {}).flat().length });
});

describe('incident evidence upload guard', () => {
  test('accepts an image with an allowed MIME type and matching extension', async () => {
    await request(app)
      .post('/evidence')
      .attach('evidence', Buffer.from('valid-image-data'), {
        filename: 'evidence.jpg',
        contentType: 'image/jpeg'
      })
      .expect(200)
      .expect({ success: true, count: 1 });
  });

  test('rejects unsupported evidence types', async () => {
    await request(app)
      .post('/evidence')
      .attach('evidence', Buffer.from('not-an-image'), {
        filename: 'evidence.txt',
        contentType: 'text/plain'
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.success).toBe(false);
      });
  });

  test('rejects evidence that exceeds the configured maximum size', async () => {
    await request(app)
      .post('/evidence')
      .attach('evidence', Buffer.alloc(maxFileSize + 1), {
        filename: 'too-large.jpg',
        contentType: 'image/jpeg'
      })
      .expect(413);
  });
});
