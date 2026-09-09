jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

jest.mock('form-data', () => jest.fn().mockImplementation(() => ({
  values: [],
  append(name, value, options) {
    this.values.push([name, options ?? value]);
  },
  getHeaders() {
    return { 'content-type': 'multipart/form-data; boundary=test' };
  }
})));

const axios = require('axios');
const aiService = require('./aiService');

describe('category-routed AI service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sends the canonical web category and returns normalized findings', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        analysis_status: 'completed',
        model_available: true,
        confidence_score: 0.91,
        ai_suggestion: 'pothole',
        detections: [{
          class: 'pothole',
          confidence: 0.91,
          bbox: { x1: 0.1, y1: 0.2, x2: 0.7, y2: 0.8 }
        }]
      }
    });

    const result = await aiService.analyzeIncidentImage(Buffer.from('webp'), 'road');
    const form = axios.post.mock.calls[0][1];

    expect(form.values.find(([name]) => name === 'category')).toEqual(['category', 'road']);
    expect(form.values.find(([name]) => name === 'image')[1]).toEqual(expect.objectContaining({
      filename: 'incident.webp',
      contentType: 'image/webp'
    }));
    expect(result).toEqual(expect.objectContaining({
      success: true,
      category: 'road',
      analysisStatus: 'completed',
      findings: [{
        label: 'pothole',
        confidence: 0.91,
        bbox: { x1: 0.1, y1: 0.2, x2: 0.7, y2: 0.8 }
      }],
      requiresManualReview: true
    }));
  });

  test('does not substitute a model for an unsupported canonical category', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        analysis_status: 'unavailable',
        model_available: false
      }
    });

    const result = await aiService.analyzeIncidentImage(Buffer.from('webp'), 'water');

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][1].values.find(([name]) => name === 'category'))
      .toEqual(['category', 'water']);
    expect(result).toEqual(expect.objectContaining({
      success: true,
      category: 'water',
      analysisStatus: 'unavailable',
      modelAvailable: false,
      findings: [],
      requiresManualReview: true
    }));
  });

  test('does not call the AI service for a missing category', async () => {
    const result = await aiService.analyzeIncidentImage(Buffer.from('webp'));

    expect(axios.post).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({
      success: true,
      analysisStatus: 'unavailable',
      modelAvailable: false,
      requiresManualReview: true
    }));
  });
});
