'use strict';
// utils/voiceNotify.js
// שיחה טלפונית עם הודעה מוקלטת (הקראה בעברית) לבעל העסק על כל הזמנה חדשה - דרך Twilio.
// פעיל רק כשכל משתני הסביבה מוגדרים; אחרת לא עושה כלום (בלי שגיאה).
//
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN - מחשבון Twilio
//   TWILIO_FROM_NUMBER                    - המספר ב-Twilio שממנו מתקשרים (למשל +1...)
//   ADMIN_CALL_PHONE                      - לאן להתקשר, בפורמט בינלאומי (למשל +972534167771)
//   TWILIO_VOICE (אופציונלי)               - קול ההקראה (ברירת מחדל: Google.he-IL-Standard-A)

const ISRAEL_TZ = 'Asia/Jerusalem';

const isConfigured = () => Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER && process.env.ADMIN_CALL_PHONE
);

const escapeXml = (text) => String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// טקסט ההודעה: שם, משתתפים, יום ותאריך, שעה, עולם וטלפון הלקוח (ספרה-ספרה)
const buildMessage = (booking, roomName) => {
    const date = new Date(booking.date).toLocaleDateString('he-IL', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: ISRAEL_TZ,
    });
    const time = String(booking.timeSlot || '').replace(/^24:/, '00:'); // "24:00" = חצות
    const phoneDigits = String(booking.customer?.phone || '').replace(/\D/g, '').split('').join(' ');
    const price = booking.details?.totalPrice;

    return [
        'הזמנה חדשה באתר.',
        `${booking.customer?.fullName || 'לקוח'}, ${booking.details?.participantsCount} משתתפים.`,
        `${date}, בשעה ${time}.`,
        roomName ? `עולם: ${roomName}.` : '',
        price ? `סכום: ${price} שקלים.` : '',
        booking.coupon?.code ? 'עם קוד קופון.' : '',
        phoneDigits ? `טלפון הלקוח: ${phoneDigits}.` : '',
    ].filter(Boolean).join(' ');
};

/**
 * מתקשר לבעל העסק ומקריא את פרטי ההזמנה (פעמיים).
 * לא זורק שגיאה כשהשירות לא מוגדר - פשוט מדלג.
 */
const callAdminAboutBooking = async (booking, roomName) => {
    if (!isConfigured()) return;

    const voice = process.env.TWILIO_VOICE || 'Google.he-IL-Standard-A';
    const say = `<Say language="he-IL" voice="${escapeXml(voice)}">${escapeXml(buildMessage(booking, roomName))}</Say>`;
    const twiml = `<Response>${say}<Pause length="1"/>${say}</Response>`;

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
        method: 'POST',
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            To: process.env.ADMIN_CALL_PHONE,
            From: process.env.TWILIO_FROM_NUMBER,
            Twiml: twiml,
        }),
    });

    if (!res.ok) {
        throw new Error(`Twilio ${res.status}: ${await res.text()}`);
    }
    console.log('[voiceNotify] Call placed for booking', booking.bookingId);
};

module.exports = { callAdminAboutBooking, buildMessage };
