const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Initialize Supabase client
let supabase = null;

const initializeSupabase = () => {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      logger.info('Supabase Storage initialized successfully');
    } catch (error) {
      logger.error('Supabase Storage initialization error:', error);
    }
  }
  return supabase;
};

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - File name
 * @param {String} mimeType - MIME type
 * @param {String} folder - Storage folder path
 * @returns {Promise<Object>} Upload result with URL and path
 */
exports.uploadToStorage = async (fileBuffer, fileName, mimeType, folder = 'uploads') => {
  try {
    const client = initializeSupabase();
    
    if (!client) {
      throw new Error('Supabase Storage not initialized');
    }

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'lunas-storage';
    
    // Generate unique file name
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    // Upload file to Supabase Storage
    const { data, error } = await client.storage
      .from(bucketName)
      .upload(uniqueFileName, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      logger.error('Supabase upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = client.storage
      .from(bucketName)
      .getPublicUrl(uniqueFileName);

    return {
      url: publicUrlData.publicUrl,
      path: uniqueFileName,
      key: uniqueFileName // For compatibility with other naming conventions
    };
  } catch (error) {
    logger.error('Supabase Storage upload error:', error);
    throw new Error('Failed to upload file to Supabase Storage');
  }
};

/**
 * Delete file from Supabase Storage
 * @param {String} filePath - File path in storage
 * @returns {Promise<void>}
 */
exports.deleteFromStorage = async (filePath) => {
  try {
    const client = initializeSupabase();
    
    if (!client) {
      throw new Error('Supabase Storage not initialized');
    }

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'lunas-storage';

    const { error } = await client.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      logger.error('Supabase delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    
    logger.info(`Deleted file from Supabase Storage: ${filePath}`);
  } catch (error) {
    logger.error('Supabase Storage delete error:', error);
    throw new Error('Failed to delete file from Supabase Storage');
  }
};

/**
 * Optimize and resize image
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Number} maxWidth - Maximum width
 * @param {Number} quality - Image quality (1-100)
 * @returns {Promise<Buffer>} Optimized image buffer
 */
exports.optimizeImage = async (imageBuffer, maxWidth = 1920, quality = 80) => {
  try {
    return await sharp(imageBuffer)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toBuffer();
  } catch (error) {
    logger.error('Image optimization error:', error);
    throw new Error('Failed to optimize image');
  }
};

/**
 * Generate thumbnail
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Number} size - Thumbnail size
 * @returns {Promise<Buffer>} Thumbnail buffer
 */
exports.generateThumbnail = async (imageBuffer, size = 300) => {
  try {
    return await sharp(imageBuffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch (error) {
    logger.error('Thumbnail generation error:', error);
    throw new Error('Failed to generate thumbnail');
  }
};

/**
 * Upload multiple files to Supabase Storage
 * @param {Array} files - Array of file objects with buffer, name, and mimeType
 * @param {String} folder - Storage folder path
 * @returns {Promise<Array>} Array of upload results
 */
exports.uploadMultipleToStorage = async (files, folder = 'uploads') => {
  try {
    const uploadPromises = files.map(file => 
      exports.uploadToStorage(file.buffer, file.name, file.mimeType, folder)
    );
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    logger.error('Multiple Supabase Storage upload error:', error);
    throw new Error('Failed to upload files to Supabase Storage');
  }
};

/**
 * Get signed URL for temporary access (for private files)
 * @param {String} filePath - File path in storage
 * @param {Number} expiresIn - Expiration time in seconds (default 1 hour)
 * @returns {Promise<String>} Signed URL
 */
exports.getSignedUrl = async (filePath, expiresIn = 3600) => {
  try {
    const client = initializeSupabase();
    
    if (!client) {
      throw new Error('Supabase Storage not initialized');
    }

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'lunas-storage';

    const { data, error } = await client.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      logger.error('Signed URL generation error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    logger.error('Signed URL generation error:', error);
    throw new Error('Failed to generate signed URL');
  }
};

/**
 * List files in a folder
 * @param {String} folder - Folder path
 * @returns {Promise<Array>} List of files
 */
exports.listFiles = async (folder = '') => {
  try {
    const client = initializeSupabase();
    
    if (!client) {
      throw new Error('Supabase Storage not initialized');
    }

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'lunas-storage';

    const { data, error } = await client.storage
      .from(bucketName)
      .list(folder);

    if (error) {
      logger.error('List files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error('List files error:', error);
    throw new Error('Failed to list files');
  }
};

/**
 * Download file from storage
 * @param {String} filePath - File path in storage
 * @returns {Promise<Buffer>} File buffer
 */
exports.downloadFile = async (filePath) => {
  try {
    const client = initializeSupabase();
    
    if (!client) {
      throw new Error('Supabase Storage not initialized');
    }

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'lunas-storage';

    const { data, error } = await client.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      logger.error('Download file error:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    // Convert blob to buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.error('Download file error:', error);
    throw new Error('Failed to download file');
  }
};

// Initialize Supabase on module load
initializeSupabase();

module.exports = exports;
