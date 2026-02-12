import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const STATUS_MAP = {
    pending: 'ממתין',
    confirmed: 'מאושר',
    cancelled: 'בוטל',
    completed: 'הושלם',
    'no-show': 'לא הגיע'
};

const SOURCE_MAP = {
    website: 'אתר',
    phone: 'טלפון',
    'walk-in': 'הגעה ישירה',
    whatsapp: 'וואטסאפ'
};

/**
 * Export bookings array to an Excel file (.xlsx)
 * @param {Array} bookings - Array of booking objects from the API
 * @param {Array} rooms - Array of room objects for room name lookup
 * @param {string} [filename] - Optional filename (defaults to date-based name)
 */
export const exportBookingsToExcel = (bookings, rooms, filename) => {
    if (!bookings || bookings.length === 0) {
        alert('אין הזמנות לייצוא');
        return;
    }

    const roomMap = {};
    rooms.forEach(r => {
        roomMap[r._id] = r.title?.he || r.title?.en || 'חדר';
    });

    const rows = bookings.map(b => {
        const roomId = b.roomId?._id || b.roomId;
        return {
            'מזהה הזמנה': b.bookingId || '-',
            'שם לקוח': b.customer?.fullName || '-',
            'טלפון': b.customer?.phone || '-',
            'אימייל': b.customer?.email || '-',
            'חדר': roomMap[roomId] || '-',
            'תאריך': b.date ? format(new Date(b.date), 'dd/MM/yyyy') : '-',
            'שעה': b.timeSlot || '-',
            'משתתפים': b.details?.participantsCount || '-',
            'מחיר': b.details?.totalPrice ? `₪${b.details.totalPrice}` : '-',
            'סטטוס': STATUS_MAP[b.status] || b.status || '-',
            'מקור': SOURCE_MAP[b.source] || b.source || '-',
            'תאריך יצירה': b.createdAt ? format(new Date(b.createdAt), 'dd/MM/yyyy HH:mm') : '-'
        };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Set RTL and column widths
    ws['!cols'] = [
        { wch: 12 }, // מזהה
        { wch: 20 }, // שם
        { wch: 14 }, // טלפון
        { wch: 25 }, // אימייל
        { wch: 18 }, // חדר
        { wch: 12 }, // תאריך
        { wch: 8 },  // שעה
        { wch: 10 }, // משתתפים
        { wch: 10 }, // מחיר
        { wch: 10 }, // סטטוס
        { wch: 12 }, // מקור
        { wch: 18 }, // תאריך יצירה
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'הזמנות');

    const defaultName = `הזמנות_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(wb, filename || defaultName);
};
