const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configure multer for memory storage (for cloud upload)
const storage = multer.memoryStorage();

const allowedTypes = () => (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,image/webp')
  .split(',')
  .map((type) => type.trim())
  .filter(Boolean);

const allowedExtensionsByMimeType = {
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/jpg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
};

// File filter
const fileFilter = (req, file, cb) => {
  const permittedTypes = allowedTypes();
  const extension = path.extname(file.originalname || '').toLowerCase();
  const permittedExtensions = allowedExtensionsByMimeType[file.mimetype] || [];
  
  if (!permittedTypes.includes(file.mimetype)) {
    cb(new Error(`Invalid file type. Allowed types: ${permittedTypes.join(', ')}`), false);
  } else if (!permittedExtensions.includes(extension)) {
    cb(new Error('Image file extension does not match the supplied media type'), false);
  } else {
    cb(null, true);
  }
};

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;

// Generic upload instance retained for existing later-milestone endpoints.
const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxFileSize // 10MB default
  },
  fileFilter: fileFilter
});

const incidentUpload = multer({
  storage: storage,
  limits: { fileSize: maxFileSize, files: 5 },
  fileFilter: fileFilter
});

// Middleware for single file upload
exports.uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);
    
    uploadSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
          success: false,
          message: `File upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Middleware for multiple file uploads
exports.uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMultiple = upload.array(fieldName, maxCount);
    
    uploadMultiple(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum allowed: ${maxCount}`
          });
        }
        return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
          success: false,
          message: `File upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Middleware for multiple fields
exports.uploadFields = (fields) => {
  return (req, res, next) => {
    const uploadFields = upload.fields(fields);
    
    uploadFields(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
          success: false,
          message: `File upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Incident reporting accepts the preferred `evidence` field while retaining
// `images` for clients that used the earlier multipart naming convention.
// The total upload count remains capped at five by multer's global limit.
exports.uploadIncidentEvidence = (req, res, next) => {
  const uploadEvidence = incidentUpload.fields([
    { name: 'evidence', maxCount: 5 },
    { name: 'images', maxCount: 5 }
  ]);

  uploadEvidence(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
        success: false,
        message: err.code === 'LIMIT_FILE_COUNT'
          ? 'Too many files. A maximum of five evidence images is allowed.'
          : `File upload error: ${err.message}`
      });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    return next();
  });
};

// Generate unique filename
exports.generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  return `${timestamp}-${randomString}${ext}`;
};
