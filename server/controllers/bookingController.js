const Booking = require('../models/Booking');
const Room = require('../models/Room');
const BlockedDate = require('../models/BlockedDate');
const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { HebrewCalendar, Location } = require('@hebcal/core');

// שעות פעילות ברירת מחדל (אם לא הוגדרו בהגדרות)
const DEFAULT_OPERATING_HOURS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30", "22:00"];
const ISRAEL_TZ = 'Asia/Jerusalem';

// --- פונקציות עזר לזמנים ---

// המרת תאריך לשעון ישראל
const toIsraelDate = (date) => {
    return new Date(date.toLocaleString('en-US', { timeZone: ISRAEL_TZ }));
};

// בדיקה האם זה חג (יום טוב שאסור במלאכה)
const isJewishHoliday = (jsDate) => {
    try {
        const options = {
            start: jsDate,
            end: jsDate,
            isHebrewYear: false,
            candlelighting: false,
            location: Location.lookup('Jerusalem'),
            il: true,
            sedrot: false,
            omer: false
        };
        const events = HebrewCalendar.calendar(options);
        
        // 32 = CHAG (חג מהתורה שבו אסורה מלאכה)
        return events.some(ev => (ev.getFlags() & 32) !== 0); 
    } catch (e) {
        console.error("Hebcal error", e);
        return false; // במקרה שגיאה, לא לחסום סתם
    }
};

// --- הלוגיקה הראשית ---

exports.getAvailableSlots = asyncHandler(async (req, res, next) => {
    const { roomId, date } = req.query; 

    if (!roomId || !date) {
        return next(new AppError('Please provide roomId and date', 400));
    }

    // 1. המרת התאריך המבוקש
    const requestedDate = new Date(date);
    const israelRequestedDate = toIsraelDate(requestedDate);
    
    // יום בשבוע (לפי ישראל)
    const dayOfWeek = israelRequestedDate.getDay();

    // --- חסימה 1: סופ"ש (שישי=5, שבת=6) ---
    if (dayOfWeek === 5 || dayOfWeek === 6) {
        return res.status(200).json({ status: 'success', data: [], reason: 'weekend' });
    }

    // --- חסימה 2: חגי ישראל ---
    if (isJewishHoliday(requestedDate)) {
        return res.status(200).json({ status: 'success', data: [], reason: 'holiday' });
    }

    // --- חסימה 3: חסימות מנהל (יום מלא) ---
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // נבדוק אם המודל קיים (למקרה שעוד לא נוצר ב-DB)
    let blockedDateRecord = null;
    try {
        blockedDateRecord = await BlockedDate.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });
    } catch (err) {
        // התעלמות אם הטבלה עדיין לא קיימת
    }

    if (blockedDateRecord && blockedDateRecord.isFullDay) {
        return res.status(200).json({ status: 'success', data: [], reason: 'admin_blocked' });
    }

    // --- טעינת שעות פעילות מההגדרות ---
    let operatingHours = [...DEFAULT_OPERATING_HOURS];
    try {
        const settings = await SiteSettings.findOne();
        if (settings?.booking?.weeklyHours) {
            const dayKey = String(dayOfWeek);
            const customHours = settings.booking.weeklyHours.get(dayKey);
            if (customHours && customHours.length > 0) {
                operatingHours = [...customHours];
            }
        }
    } catch (err) {
        // במקרה של שגיאה, נשתמש בשעות ברירת מחדל
        console.error("Error fetching site settings:", err);
    }

    // --- סינון שעות (Slots) ---
    let availableSlots = [...operatingHours];

    // א. סינון שעות עבר (אם זה היום)
    const now = new Date();
    const israelNow = toIsraelDate(now);
    
    // בדיקה האם התאריך המבוקש הוא "היום" (לפי YYYY-MM-DD)
    const isToday = israelNow.toISOString().split('T')[0] === israelRequestedDate.toISOString().split('T')[0];

    if (isToday) {
        const currentHour = israelNow.getHours();
        const currentMinute = israelNow.getMinutes();

        availableSlots = availableSlots.filter(slot => {
            const [h, m] = slot.split(':').map(Number);
            // משאירים רק שעות שעוד לא עברו
            return (h > currentHour) || (h === currentHour && m > currentMinute);
        });
    }

    // ב. סינון שעות שנחסמו ע"י המנהל (חסימה חלקית)
    if (blockedDateRecord && blockedDateRecord.blockedSlots?.length > 0) {
        availableSlots = availableSlots.filter(slot => !blockedDateRecord.blockedSlots.includes(slot));
    }

    // ג. סינון הזמנות קיימות (לא כולל מבוטלות או מחוקות)
    const existingBookings = await Booking.find({
        roomId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' },
        isDeleted: { $ne: true }
    });

    const bookedSlots = existingBookings.map(b => b.timeSlot);
    availableSlots = availableSlots.filter(slot => !bookedSlots.includes(slot));

    res.status(200).json({
        status: 'success',
        data: availableSlots
    });
});

// --- יצירת הזמנה ---
exports.createBooking = asyncHandler(async (req, res, next) => {
    const { roomId, date, timeSlot, customer, participantsCount, source, totalPrice } = req.body;

    // בדיקת כפילות (לא כולל מבוטלות או מחוקות)
    const existing = await Booking.findOne({
        roomId,
        date: new Date(date),
        timeSlot,
        status: { $ne: 'cancelled' },
        isDeleted: { $ne: true }
    });

    if (existing) {
        return next(new AppError('Slot already booked', 409));
    }

    // חישוב מחיר
    let finalPrice = totalPrice;
    if (!finalPrice) {
        const room = await Room.findById(roomId);
        if (!room) return next(new AppError('Room not found', 404));
        const pCount = participantsCount.toString();
        if (room.pricing.overrides && room.pricing.overrides.get(pCount)) {
            finalPrice = room.pricing.overrides.get(pCount);
        } else {
            finalPrice = room.pricing.basePrice + (participantsCount * room.pricing.personPenalty);
        }
    }

    const newBooking = await Booking.create({
        bookingId: '#' + Math.floor(1000 + Math.random() * 9000),
        roomId,
        date: new Date(date),
        timeSlot,
        customer,
        details: { participantsCount, totalPrice: finalPrice },
        source: source || 'website'
    });

    // הוסר: אין כאן שליחת מיילים כרגע

    res.status(201).json({ status: 'success', data: newBooking });
});

// קבלת כל ההזמנות (לא כולל מחוקות)
exports.getAllBookings = asyncHandler(async (req, res, next) => {
    const bookings = await Booking.find({ isDeleted: { $ne: true } })
        .populate('roomId', 'title')
        .sort({ date: -1, timeSlot: 1 });

    res.status(200).json({ status: 'success', results: bookings.length, data: bookings });
});

// עדכון הזמנה קיימת
exports.updateBooking = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { roomId, date, timeSlot, customer, participantsCount, totalPrice, status } = req.body;

    // בדיקה שההזמנה קיימת ולא בפח
    const existingBooking = await Booking.findById(id);
    if (!existingBooking) {
        return next(new AppError('Booking not found', 404));
    }
    if (existingBooking.isDeleted) {
        return next(new AppError('Cannot edit a deleted booking', 400));
    }

    // בדיקת כפילות אם משנים תאריך/שעה/חדר
    const newDate = date ? new Date(date) : existingBooking.date;
    const newTimeSlot = timeSlot || existingBooking.timeSlot;
    const newRoomId = roomId || existingBooking.roomId;

    // רק אם יש שינוי בתאריך/שעה/חדר - נבדוק כפילות
    const dateChanged = date && new Date(date).toDateString() !== existingBooking.date.toDateString();
    const slotChanged = timeSlot && timeSlot !== existingBooking.timeSlot;
    const roomChanged = roomId && roomId !== existingBooking.roomId.toString();

    if (dateChanged || slotChanged || roomChanged) {
        const conflicting = await Booking.findOne({
            _id: { $ne: id },
            roomId: newRoomId,
            date: newDate,
            timeSlot: newTimeSlot,
            status: { $ne: 'cancelled' },
            isDeleted: { $ne: true }
        });

        if (conflicting) {
            return next(new AppError('Slot already booked', 409));
        }
    }

    // בניית אובייקט העדכון
    const updateData = {};

    if (roomId) updateData.roomId = roomId;
    if (date) updateData.date = new Date(date);
    if (timeSlot) updateData.timeSlot = timeSlot;
    if (status) updateData.status = status;

    if (customer) {
        updateData.customer = {
            ...existingBooking.customer,
            ...customer
        };
    }

    if (participantsCount || totalPrice) {
        updateData.details = {
            ...existingBooking.details,
            ...(participantsCount && { participantsCount }),
            ...(totalPrice && { totalPrice })
        };
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).populate('roomId', 'title');

    res.status(200).json({ status: 'success', data: updatedBooking });
});

// מחיקה רכה (soft delete) - מעביר לפח
exports.deleteBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
    );

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }

    res.status(200).json({ status: 'success', data: null });
});

// --- ניהול פח (Trash) ---

// קבלת הזמנות מחוקות (פח)
exports.getDeletedBookings = asyncHandler(async (req, res, next) => {
    const bookings = await Booking.find({ isDeleted: true })
        .populate('roomId', 'title')
        .sort({ deletedAt: -1 });

    res.status(200).json({ status: 'success', results: bookings.length, data: bookings });
});

// שחזור הזמנה מהפח
exports.restoreBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { isDeleted: false, deletedAt: null },
        { new: true }
    ).populate('roomId', 'title');

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }

    res.status(200).json({ status: 'success', data: booking });
});

// מחיקה לצמיתות (hard delete)
exports.permanentDeleteBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }

    res.status(204).json({ status: 'success', data: null });
});

// ריקון הפח (מחיקת כל ההזמנות המחוקות לצמיתות)
exports.emptyTrash = asyncHandler(async (req, res, next) => {
    const result = await Booking.deleteMany({ isDeleted: true });

    res.status(200).json({
        status: 'success',
        message: `${result.deletedCount} bookings permanently deleted`
    });
});

// --- ניהול חסימות (Admin) ---

exports.blockDate = asyncHandler(async (req, res, next) => {
    const { date, reason, isFullDay, blockedSlots } = req.body;
    
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const block = await BlockedDate.findOneAndUpdate(
        { date: dateObj },
        { reason, isFullDay, blockedSlots },
        { new: true, upsert: true }
    );

    res.status(200).json({ status: 'success', data: block });
});

exports.getBlockedDates = asyncHandler(async (req, res, next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const blocks = await BlockedDate.find({ date: { $gte: today } }).sort({ date: 1 });
    res.status(200).json({ status: 'success', data: blocks });
});

exports.removeBlock = asyncHandler(async (req, res, next) => {
    await BlockedDate.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
});