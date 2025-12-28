const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Check for CLOUDINARY_URL (SDK reads it automatically)
if (process.env.CLOUDINARY_URL) {
    console.log('CLOUDINARY_URL: found');
} else {
    console.error('CLOUDINARY_URL: missing');
}

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Debug: Log file type being uploaded
        console.log('Uploading file of type:', file.mimetype);

        // Clean filename: remove extension and special characters
        const cleanName = file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
        const uniqueId = cleanName + '-' + Date.now();

        // Video files: explicit resource_type and format
        if (file.mimetype.startsWith('video/')) {
            console.log('Processing as VIDEO upload');
            return {
                folder: 'vr_escape',
                resource_type: 'video',
                format: 'mp4',
                allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
                public_id: uniqueId
            };
        }

        // Image files: explicit resource_type
        console.log('Processing as IMAGE upload');
        return {
            folder: 'vr_escape',
            resource_type: 'image',
            allowed_formats: ['jpg', 'png', 'jpeg'],
            public_id: uniqueId
        };
    }
});

const fileFilter = (req, file, cb) => {
    console.log('File filter check:', file.originalname, file.mimetype);
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Format not supported! Only Images and Videos are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB for large videos
});

module.exports = upload;
