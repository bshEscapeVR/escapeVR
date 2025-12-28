// controllers/roomController.js
const Room = require('../models/Room');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// קבלת כל החדרים הפעילים
exports.getAllRooms = asyncHandler(async (req, res, next) => {
    const rooms = await Room.find({ isActive: true }).sort({ order: 1 });
    
    res.status(200).json({
        status: 'success',
        results: rooms.length,
        data: rooms
    });
});

// קבלת חדר בודד לפי ID או Slug
exports.getRoom = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // בדיקה אם זה ID תקין של מונגו, אם לא - נחפש לפי slug
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };

    const room = await Room.findOne({ ...query, isActive: true });

    if (!room) {
        return next(new AppError('No room found with that ID/Slug', 404));
    }

    res.status(200).json({
        status: 'success',
        data: room
    });
});



// --- חדש: יצירת חדר ---
exports.createRoom = asyncHandler(async (req, res, next) => {
    const newRoom = await Room.create(req.body);
    res.status(201).json({
        status: 'success',
        data: newRoom
    });
});

// --- חדש: עדכון חדר ---
exports.updateRoom = asyncHandler(async (req, res, next) => {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!room) {
        return next(new AppError('No room found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: room
    });
});

// --- חדש: מחיקת חדר ---
exports.deleteRoom = asyncHandler(async (req, res, next) => {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
        return next(new AppError('No room found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});