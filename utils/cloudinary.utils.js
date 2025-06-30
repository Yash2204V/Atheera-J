const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
const dbgr = require('debug')('development: cloudinary');

/**
 * Get file size in MB
 * @param {Buffer} buffer - Image buffer
 * @returns {Number} Size in MB
 */
const getFileSizeInMB = (buffer) => {
    return buffer.length / (1024 * 1024);
};

/**
 * Format bytes to human readable size
 * @param {Number} bytes - Size in bytes
 * @returns {String} Formatted size
 */
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Upload buffer to Cloudinary with optimization
 * @param {Buffer} buffer - Image buffer
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadBuffer = async (buffer, folder = 'clothing_artificialJewellery') => {
    const originalSize = getFileSizeInMB(buffer);
    
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                transformation: [
                    { quality: "auto:good" },
                    { fetch_format: "auto" },
                    { width: 800, crop: "limit" },
                    { dpr: "auto" }
                ]
            },
            async (error, result) => {
                if (error) return reject(error);
                
                // Previously, there was code here to download the optimized image
                // and calculate optimization details. We are removing that
                // to speed up the upload process.
                
                // The result object from Cloudinary already contains useful info
                // like secure_url, public_id, format, width, height, etc.
                
                resolve(result);
            }
        );

        const bufferStream = new Readable();
        bufferStream.push(buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
    });
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} files - Array of files with buffer and mimetype
 * @returns {Promise<Array>} Array of Cloudinary URLs and optimization info
 */
const uploadMultipleImages = async (files) => {
    try {
        dbgr(`Starting upload of ${files.length} images...`);
        
        const uploadPromises = files.map(file => uploadBuffer(file.buffer));
        const results = await Promise.all(uploadPromises);
        
        // Aggregate total optimization statistics
        let totalOriginalSize = 0;
        let totalOptimizedSize = 0;
        
        const processedResults = results.map((result, index) => {
            if (result.optimization) {
                const originalBytes = parseFloat(result.optimization.originalSize) * 1024 * 1024;
                const optimizedBytes = parseFloat(result.optimization.optimizedSize) * 1024 * 1024;
                totalOriginalSize += originalBytes;
                totalOptimizedSize += optimizedBytes;
            }
            
            return {
                url: result.secure_url,
                public_id: result.public_id,
                optimization: result.optimization || null
            };
        });
        
        if (totalOriginalSize > 0) {
            const totalReduction = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100;
            dbgr(`
                Total Optimization Summary:
                Total Original Size: ${formatBytes(totalOriginalSize)}
                Total Optimized Size: ${formatBytes(totalOptimizedSize)}
                Total Size Reduction: ${totalReduction.toFixed(2)}%
                Number of Images: ${files.length}
            `);
        }
        
        return processedResults;
    } catch (error) {
        throw new Error(`Error uploading images to Cloudinary: ${error.message}`);
    }
};

/**
 * Delete image from Cloudinary
 * @param {String} public_id - Cloudinary public_id of the image
 */
const deleteImage = async (public_id) => {
    try {
        const result = await cloudinary.uploader.destroy(public_id);
        dbgr(`Deleted image: ${public_id}, Result:`, result);
    } catch (error) {
        throw new Error(`Error deleting image from Cloudinary: ${error.message}`);
    }
};

module.exports = {
    uploadBuffer,
    uploadMultipleImages,
    deleteImage
}; 