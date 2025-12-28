const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const multer = require('multer');

router.post('/', (req, res) => {
    const uploadSingle = upload.single('image');

    uploadSingle(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(400).json({ status: 'fail', message: `Upload error: ${err.message}` });
        } else if (err) {
            console.error('Upload Error:', err);
            return res.status(400).json({ status: 'fail', message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
        }

        res.status(200).json({
            status: 'success',
            imageUrl: req.file.path
        });
    });
});

module.exports = router;
