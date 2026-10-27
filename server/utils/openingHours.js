'use strict';
// utils/openingHours.js
// שעות פעילות: ברירות מחדל + זיהוי סוג היום (רגיל / ערב שבת-חג / מוצאי שבת-חג / סגור)
// לפי לוח השנה העברי (ישראל).
const { HebrewCalendar, HDate, flags } = require('@hebcal/core');

// מפתחות: "0".."4" = ראשון-חמישי, "5" = שישי, "6" = מוצאי שבת,
// holidayEve = ערב חג, holidayEnd = מוצאי חג.
// open = שעת התחלה ראשונה, close = שעת ההתחלה האחרונה ("00:00" = חצות, אחרי open).
const DEFAULT_OPENING_HOURS = {
    '0': { open: '10:15', close: '23:15', closed: false },
    '1': { open: '10:15', close: '23:15', closed: false },
    '2': { open: '10:15', close: '23:15', closed: false },
    '3': { open: '10:15', close: '23:15', closed: false },
    '4': { open: '10:15', close: '23:15', closed: false },
    '5': { open: '10:00', close: '13:30', closed: false },
    '6': { open: '21:00', close: '00:00', closed: false },
    holidayEve: { open: '10:00', close: '13:30', closed: false },
    holidayEnd: { open: '21:00', close: '00:00', closed: false },
};

/** "HH:MM" → דקות מחצות */
const parseMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

/**
 * האם התאריך הוא יום טוב בישראל (לא חול המועד).
 * במקרה של שגיאה בספרייה מחזיר false - לא חוסמים יום בגלל תקלה.
 */
const isChag = (year, month, day) => {
    try {
        const hd = new HDate(new Date(year, month - 1, day));
        const events = HebrewCalendar.calendar({
            start: hd, end: hd,
            il: true, candlelighting: false, sedrot: false, omer: false,
        });
        return events.some(ev => (ev.getFlags() & flags.CHAG) && !(ev.getFlags() & flags.CHOL_HAMOED));
    } catch (e) {
        console.error('Hebcal error:', e);
        return false;
    }
};

/** יום מנוחה = שבת או יום טוב */
const isRestDay = (utcDate) =>
    utcDate.getUTCDay() === 6 ||
    isChag(utcDate.getUTCFullYear(), utcDate.getUTCMonth() + 1, utcDate.getUTCDate());

/**
 * איזה מפתח שעות פעילות חל על תאריך ישראלי "YYYY-MM-DD".
 * null = סגור כל היום (למשל שבת שאחריה חג, או יום טוב ראשון מתוך שניים).
 */
const getDayHoursKey = (israelDateStr) => {
    const [y, m, d] = israelDateStr.split('-').map(Number);
    const today    = new Date(Date.UTC(y, m - 1, d));
    const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
    const dow = today.getUTCDay();

    const restToday    = isRestDay(today);
    const restTomorrow = isRestDay(tomorrow);

    if (restToday && restTomorrow) return null;
    if (restToday)    return dow === 6 ? '6' : 'holidayEnd';  // מוצאי שבת / חג
    if (restTomorrow) return dow === 5 ? '5' : 'holidayEve';  // שישי / ערב חג
    return String(dow);
};

/**
 * טווח שעות ההתחלה של מפתח יום, בדקות מחצות.
 * close שקטן או שווה ל-open נחשב אחרי חצות (למשל 21:00-00:00 → 1260-1440).
 * null = היום מוגדר כסגור.
 */
const resolveDayRange = (openingHours, key) => {
    const cfg = openingHours?.[key] || DEFAULT_OPENING_HOURS[key];
    if (!cfg || cfg.closed || !cfg.open || !cfg.close) return null;

    const openMin = parseMinutes(cfg.open);
    let closeMin  = parseMinutes(cfg.close);
    if (closeMin <= openMin) closeMin += 24 * 60;
    return { openMin, closeMin };
};

module.exports = { DEFAULT_OPENING_HOURS, getDayHoursKey, resolveDayRange, isChag };
