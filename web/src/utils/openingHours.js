// utils/openingHours.js
// שעות פעילות - ברירות מחדל ועיצוב לתצוגה.
// מפתחות: "0".."4" ראשון-חמישי, "5" שישי, "6" מוצאי שבת, holidayEve ערב חג, holidayEnd מוצאי חג.
// open = התחלה ראשונה, close = התחלה אחרונה ("00:00" = חצות).
// ברירות המחדל זהות ל-server/utils/openingHours.js (השרת הוא מקור האמת - כאן רק גיבוי לפאנל הניהול).

export const OPENING_HOURS_KEYS = ['0', '1', '2', '3', '4', '5', '6', 'holidayEve', 'holidayEnd'];

export const DEFAULT_OPENING_HOURS = {
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

// "10:15–23:15" או "סגור"
const formatRange = (cfg, t) =>
    !cfg || cfg.closed || !cfg.open || !cfg.close ? t('hours.closed') : `${cfg.open}–${cfg.close}`;

/**
 * שורות לתצוגה באתר: [{ label, value }]
 * ימים רצופים עם אותן שעות מתאחדים ("ימים א׳–ה׳"), וערב חג / מוצאי חג
 * מתאחדים עם שישי / מוצאי שבת כשהשעות זהות.
 */
export const getOpeningHoursRows = (openingHours, t) => {
    if (!openingHours) return [];
    const value = (key) => formatRange(openingHours[key], t);
    const rows = [];

    // ראשון-חמישי: איחוד ימים רצופים
    let start = 0;
    for (let day = 1; day <= 5; day++) {
        if (day === 5 || value(String(day)) !== value(String(start))) {
            const from = t(`hours.day_${start}`);
            const to = t(`hours.day_${day - 1}`);
            rows.push({
                label: start === day - 1 ? t('hours.weekday_single', { day: from }) : t('hours.weekday_range', { from, to }),
                value: value(String(start))
            });
            start = day;
        }
    }

    // שישי + ערב חג, מוצאי שבת + מוצאי חג
    const pairs = [
        { main: '5', holiday: 'holidayEve', mainLabel: 'hours.friday', holidayLabel: 'hours.holiday_eve', bothLabel: 'hours.friday_and_eve' },
        { main: '6', holiday: 'holidayEnd', mainLabel: 'hours.motzash', holidayLabel: 'hours.holiday_end', bothLabel: 'hours.motzash_and_end' },
    ];
    for (const p of pairs) {
        if (value(p.main) === value(p.holiday)) {
            rows.push({ label: t(p.bothLabel), value: value(p.main) });
        } else {
            rows.push({ label: t(p.mainLabel), value: value(p.main) });
            rows.push({ label: t(p.holidayLabel), value: value(p.holiday) });
        }
    }

    return rows;
};
