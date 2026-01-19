const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { FILE_LIMITS } = require('../middleware/uploadMiddleware');
const multer = require('multer');

/**
 * Format file size for user-friendly display
 */
const formatFileSize = (bytes) => {
    if (bytes >= 1024 * 1024) {
        return `${Math.round(bytes / (1024 * 1024))}MB`;
    }
    return `${Math.round(bytes / 1024)}KB`;
};

/**
 * POST /v1/upload
 * Upload a single image or video file
 */
router.post('/', (req, res) => {
    const uploadSingle = upload.single('image');

    uploadSingle(req, res, (err) => {
        // Handle Multer-specific errors
        if (err instanceof multer.MulterError) {
            console.error('❌ Multer Error:', err.code, err.message);

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    status: 'fail',
                    message: `הקובץ גדול מדי! מגבלה: ${formatFileSize(FILE_LIMITS.IMAGE)} לתמונות, ${formatFileSize(FILE_LIMITS.VIDEO)} לוידאו`
                });
            }

            return res.status(400).json({
                status: 'fail',
                message: `שגיאה בהעלאה: ${err.message}`
            });
        }

        // Handle validation/filter errors
        if (err) {
            console.error('❌ Upload Error:', err.message);
            return res.status(400).json({
                status: 'fail',
                message: err.message
            });
        }

        // No file uploaded
        if (!req.file) {
            return res.status(400).json({
                status: 'fail',
                message: 'לא נבחר קובץ להעלאה'
            });
        }

        // Success
        console.log('✅ Upload successful:', req.file.path);
        res.status(200).json({
            status: 'success',
            imageUrl: req.file.path
        });
    });
});

module.exports = router;
