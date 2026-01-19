const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

// Check for CLOUDINARY_URL (SDK reads it automatically)
if (process.env.CLOUDINARY_URL) {
    console.log('✅ CLOUDINARY_URL: found');
} else {
    console.error('❌ CLOUDINARY_URL: missing');
}

// File size limits (in bytes)
const FILE_LIMITS = {
    IMAGE: 25 * 1024 * 1024,   // 25MB for images
    VIDEO: 100 * 1024 * 1024   // 100MB for videos
};

// ============================================
// ALLOWED FILE TYPES
// ============================================

// Supported image MIME types
const ALLOWED_IMAGE_MIMES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/heic',
    'image/heif'
];

// Supported video MIME types
const ALLOWED_VIDEO_MIMES = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/mpeg',
    'video/x-matroska'
];

// Extension to MIME type mapping (fallback for incorrect browser detection)
const EXTENSION_TO_MIME = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.ico': 'image/x-icon',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.mpeg': 'video/mpeg',
    '.mkv': 'video/x-matroska'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the effective MIME type - uses extension as fallback
 */
const getEffectiveMimeType = (file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeFromExt = EXTENSION_TO_MIME[ext];

    // If browser-detected MIME is generic or missing, use extension-based
    if (!file.mimetype || file.mimetype === 'application/octet-stream') {
        return mimeFromExt || file.mimetype;
    }

    // For HEIC/HEIF - browsers often don't detect correctly
    if ((ext === '.heic' || ext === '.heif') && !file.mimetype.includes('heic') && !file.mimetype.includes('heif')) {
        return mimeFromExt;
    }

    return file.mimetype;
};

/**
 * Check if file is an image
 */
const isImage = (mimetype) => ALLOWED_IMAGE_MIMES.includes(mimetype);

/**
 * Check if file is a video
 */
const isVideo = (mimetype) => ALLOWED_VIDEO_MIMES.includes(mimetype) || mimetype?.startsWith('video/');

/**
 * Check if file is SVG
 */
const isSvg = (mimetype) => mimetype === 'image/svg+xml';

/**
 * Check if file is GIF (don't transform - preserves animation)
 */
const isGif = (mimetype) => mimetype === 'image/gif';

/**
 * Check if file is ICO (favicon)
 */
const isIco = (mimetype) => mimetype === 'image/x-icon' || mimetype === 'image/vnd.microsoft.icon';

/**
 * Check if file is HEIC/HEIF
 */
const isHeic = (mimetype) => mimetype === 'image/heic' || mimetype === 'image/heif';

/**
 * Generate a unique, clean public_id for Cloudinary
 */
const generatePublicId = (originalname) => {
    const cleanName = originalname
        .replace(/\.[^/.]+$/, '')  // Remove extension
        .replace(/[^a-zA-Z0-9]/g, '_')  // Replace special chars with underscore
        .substring(0, 50);  // Limit length
    return `${cleanName}_${Date.now()}`;
};

// ============================================
// CLOUDINARY STORAGE CONFIGURATION
// ============================================

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const effectiveMime = getEffectiveMimeType(file);
        const publicId = generatePublicId(file.originalname);

        console.log(`📤 Upload: "${file.originalname}" | MIME: ${file.mimetype} | Effective: ${effectiveMime}`);

        // ─────────────────────────────────────
        // VIDEO FILES
        // ─────────────────────────────────────
        if (isVideo(effectiveMime)) {
            console.log('🎬 Processing as VIDEO');
            return {
                folder: 'vr_escape',
                resource_type: 'video',
                format: 'mp4',
                allowed_formats: ['mp4', 'mov', 'avi', 'webm', 'mpeg', 'mkv'],
                public_id: publicId
            };
        }

        // ─────────────────────────────────────
        // SVG FILES (keep original, no transformation)
        // ─────────────────────────────────────
        if (isSvg(effectiveMime)) {
            console.log('🎨 Processing as SVG (no transformation)');
            return {
                folder: 'vr_escape',
                resource_type: 'image',
                format: 'svg',
                public_id: publicId
            };
        }

        // ─────────────────────────────────────
        // GIF FILES (preserve animation)
        // ─────────────────────────────────────
        if (isGif(effectiveMime)) {
            console.log('🎞️ Processing as GIF (preserving animation)');
            return {
                folder: 'vr_escape',
                resource_type: 'image',
                format: 'gif',
                public_id: publicId
            };
        }

        // ─────────────────────────────────────
        // ICO FILES (favicon - keep original)
        // ─────────────────────────────────────
        if (isIco(effectiveMime)) {
            console.log('🔷 Processing as ICO (favicon)');
            return {
                folder: 'vr_escape',
                resource_type: 'image',
                format: 'ico',
                public_id: publicId
            };
        }

        // ─────────────────────────────────────
        // HEIC/HEIF FILES (convert to WebP)
        // ─────────────────────────────────────
        if (isHeic(effectiveMime)) {
            console.log('📱 Processing as HEIC/HEIF (converting to WebP)');
            return {
                folder: 'vr_escape',
                resource_type: 'image',
                format: 'webp',
                transformation: [
                    {
                        width: 1920,
                        height: 1920,
                        crop: 'limit',
                        quality: 'auto:best'
                    }
                ],
                public_id: publicId
            };
        }

        // ─────────────────────────────────────
        // REGULAR IMAGES (optimize and convert to WebP)
        // ─────────────────────────────────────
        console.log('🖼️ Processing as IMAGE (optimizing to WebP)');
        return {
            folder: 'vr_escape',
            resource_type: 'image',
            format: 'webp',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'bmp', 'tiff', 'tif'],
            transformation: [
                {
                    width: 1920,
                    height: 1920,
                    crop: 'limit',  // Only resize if larger, no cropping
                    quality: 'auto:best',
                    fetch_format: 'auto'
                }
            ],
            public_id: publicId
        };
    }
});

// ============================================
// FILE FILTER (VALIDATION)
// ============================================

const fileFilter = (req, file, cb) => {
    const effectiveMime = getEffectiveMimeType(file);
    const ext = path.extname(file.originalname).toLowerCase();

    console.log(`🔍 Validating: "${file.originalname}" | Browser MIME: ${file.mimetype} | Extension: ${ext} | Effective MIME: ${effectiveMime}`);

    // Check if it's a valid image
    if (isImage(effectiveMime)) {
        console.log('✅ Accepted as image');
        cb(null, true);
        return;
    }

    // Check if it's a valid video
    if (isVideo(effectiveMime)) {
        console.log('✅ Accepted as video');
        cb(null, true);
        return;
    }

    // Rejected
    console.log('❌ Rejected: unsupported file type');
    const supportedFormats = 'Images: JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, HEIC/HEIF | Videos: MP4, MOV, AVI, WebM';
    cb(new Error(`סוג קובץ לא נתמך! פורמטים נתמכים: ${supportedFormats}`), false);
};

// ============================================
// MULTER INSTANCES
// ============================================

// General upload (auto-detect image or video, with appropriate limit)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: FILE_LIMITS.VIDEO  // Use video limit as max, validate further in route if needed
    }
});

// Image-only upload (stricter limit)
const uploadImage = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const effectiveMime = getEffectiveMimeType(file);
        if (isImage(effectiveMime)) {
            cb(null, true);
        } else {
            cb(new Error('רק תמונות מותרות! פורמטים: JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, HEIC/HEIF'), false);
        }
    },
    limits: { fileSize: FILE_LIMITS.IMAGE }
});

// Video-only upload
const uploadVideo = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const effectiveMime = getEffectiveMimeType(file);
        if (isVideo(effectiveMime)) {
            cb(null, true);
        } else {
            cb(new Error('רק וידאו מותר! פורמטים: MP4, MOV, AVI, WebM'), false);
        }
    },
    limits: { fileSize: FILE_LIMITS.VIDEO }
});

// ============================================
// EXPORTS
// ============================================

module.exports = upload;  // Default export for backward compatibility
module.exports.upload = upload;
module.exports.uploadImage = uploadImage;
module.exports.uploadVideo = uploadVideo;
module.exports.FILE_LIMITS = FILE_LIMITS;
module.exports.getEffectiveMimeType = getEffectiveMimeType;
