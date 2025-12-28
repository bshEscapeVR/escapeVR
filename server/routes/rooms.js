// server/routes/rooms.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth'); // ייבוא המידלוויר

router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoom); // תומך גם ב-ID וגם ב-Slug

router.post('/', auth, roomController.createRoom);
router.patch('/:id', auth, roomController.updateRoom); 
router.delete('/:id', auth, roomController.deleteRoom);

module.exports = router;