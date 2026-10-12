// Clearly labelled synthetic images for local QA; no real incident photographs.
const sharp = require('sharp');
const crypto = require('crypto');
const storage = require('../src/services/storageService');

async function testEvidence(label, folder) {
  const buffer = await sharp(Buffer.from(`<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="600" fill="#e2e8f0"/><text x="40" y="260" font-size="34" fill="#0f172a">SYNTHETIC TEST EVIDENCE</text><text x="40" y="320" font-size="24" fill="#334155">${label}</text><text x="40" y="370" font-size="20">Not a photograph of a real incident</text></svg>`)).png().toBuffer();
  const uploaded = await storage.uploadToStorage(buffer, 'test-evidence.png', 'image/png', folder);
  return { key: uploaded.key || uploaded.path, mimeType: 'image/png', size: buffer.length,
    checksum: crypto.createHash('sha256').update(buffer).digest('hex'), width: 800, height: 600,
    privacyProcessing: { status: 'completed', applied: false, detectedRegions: 0, processedAt: new Date() } };
}

module.exports = { testEvidence };
