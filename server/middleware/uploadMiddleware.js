const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Check for CLOUDINARY_URL (SDK reads it automatically)
if (process.env.CLOUDINARY_URL) {
    console.log('CLOUDINARY_URL: found');
} else {
    console.error('CLOUDINARY_URL: missing');
}

// סוגי קבצים מותרים
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/svg+xml',  // תמיכה ב-SVG
    'image/gif'       // תמיכה ב-GIF
];

// בדיקה אם הקובץ הוא SVG
const isSvg = (mimetype) => mimetype === 'image/svg+xml';

// בדיקה אם הקובץ הוא GIF (לא לדחוס)
const isGif = (mimetype) => mimetype === 'image/gif';

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

        // SVG files: keep as raw/original format (no transformation)
        if (isSvg(file.mimetype)) {
            console.log('Processing as SVG upload (no transformation)');
            return {
                folder: 'vr_escape',
                resource_type: 'raw',  // SVG נשמר כ-raw
                format: 'svg',
                public_id: uniqueId
            };
        }

        // GIF files: keep original (animated GIFs lose animation if transformed)
        if (isGif(file.mimetype)) {
            console.log('Processing as GIF upload (no transformation)');
            return {
                folder: 'vr_escape',
                resource_type: 'image',
                format: 'gif',
                public_id: uniqueId
            };
        }

        // Regular image files: optimize and resize (supports any size input)
        console.log('Processing as IMAGE upload with optimization');
        return {
            folder: 'vr_escape',
            resource_type: 'image',
            format: 'webp',  // WebP לאופטימיזציה מקסימלית
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'bmp', 'tiff'],
            transformation: [
                {
                    width: 1920,
                    height: 1920,
                    crop: 'limit',  // לא חותך, רק מקטין אם גדול יותר
                    quality: 'auto:best',  // איכות אוטומטית מיטבית
                    fetch_format: 'auto'   // פורמט אוטומטי לפי הדפדפן
                }
            ],
            public_id: uniqueId
        };
    }
});

const fileFilter = (req, file, cb) => {
    console.log('File filter check:', file.originalname, file.mimetype);

    // בדיקת סוגי תמונות מותרים
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
        return;
    }

    // בדיקת וידאו
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
        return;
    }

    // סוג לא נתמך
    cb(new Error('Format not supported! Allowed: Images (JPEG, PNG, WebP, SVG, GIF) and Videos.'), false);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB for large videos
});

module.exports = upload;
