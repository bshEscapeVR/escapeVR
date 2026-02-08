// utils/emailService.js
const nodemailer = require('nodemailer');

// יצירת transporter (מתחבר ל-SMTP של Gmail)
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // App Password של Gmail
        }
    });
};

// שליחת מייל כללית
const sendEmail = async ({ to, subject, html }) => {
    // אם לא הוגדרו משתני סביבה - לא לשלוח (מונע קריסה בפיתוח)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Email not configured (EMAIL_USER / EMAIL_PASS missing). Skipping email.');
        return null;
    }

    const transporter = createTransporter();

    const mailOptions = {
        from: `"EscapeVR" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ Email failed to ${to}:`, error.message);
        return null; // לא זורק שגיאה - שליחת מייל לא צריכה לעצור את התהליך
    }
};

// --- תבניות מיילים ---

// מייל למנהל על הודעת צור קשר חדשה
const sendNewLeadNotification = async (lead) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    await sendEmail({
        to: adminEmail,
        subject: `📩 הודעה חדשה מטופס צור קשר - ${lead.fullName}`,
        html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h2 style="margin: 0;">📩 הודעה חדשה מטופס צור קשר</h2>
            </div>
            <div style="background: white; padding: 25px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; font-weight: bold; color: #6366f1; width: 120px;">שם מלא:</td>
                        <td style="padding: 10px;">${lead.fullName}</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 10px; font-weight: bold; color: #6366f1;">אימייל:</td>
                        <td style="padding: 10px;"><a href="mailto:${lead.email}" style="color: #6366f1;">${lead.email || 'לא צוין'}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; color: #6366f1;">טלפון:</td>
                        <td style="padding: 10px;"><a href="tel:${lead.phone}" style="color: #6366f1;">${lead.phone || 'לא צוין'}</a></td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 10px; font-weight: bold; color: #6366f1;">הודעה:</td>
                        <td style="padding: 10px;">${lead.message || 'ללא הודעה'}</td>
                    </tr>
                </table>
                <p style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center;">
                    התקבל בתאריך ${new Date().toLocaleDateString('he-IL')} בשעה ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
        `
    });
};

// מייל למנהל על הזמנה חדשה
const sendNewBookingAdminNotification = async (booking, roomName) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const date = new Date(booking.date).toLocaleDateString('he-IL');

    await sendEmail({
        to: adminEmail,
        subject: `🎮 הזמנה חדשה #${booking.bookingId} - ${roomName}`,
        html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h2 style="margin: 0;">🎮 הזמנה חדשה התקבלה!</h2>
                <p style="margin: 5px 0 0; font-size: 18px;">${booking.bookingId}</p>
            </div>
            <div style="background: white; padding: 25px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                <h3 style="color: #10b981; margin-top: 0;">פרטי ההזמנה</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; font-weight: bold; color: #059669; width: 130px;">חדר:</td>
                        <td style="padding: 10px;">${roomName}</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 10px; font-weight: bold; color: #059669;">תאריך:</td>
                        <td style="padding: 10px;">${date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; color: #059669;">שעה:</td>
                        <td style="padding: 10px;">${booking.timeSlot}</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 10px; font-weight: bold; color: #059669;">משתתפים:</td>
                        <td style="padding: 10px;">${booking.details.participantsCount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; color: #059669;">מחיר:</td>
                        <td style="padding: 10px; font-weight: bold;">₪${booking.details.totalPrice}</td>
                    </tr>
                </table>

                <h3 style="color: #10b981; margin-top: 20px;">פרטי הלקוח</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; font-weight: bold; color: #059669; width: 130px;">שם:</td>
                        <td style="padding: 10px;">${booking.customer.fullName}</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 10px; font-weight: bold; color: #059669;">טלפון:</td>
                        <td style="padding: 10px;"><a href="tel:${booking.customer.phone}" style="color: #059669;">${booking.customer.phone}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; color: #059669;">אימייל:</td>
                        <td style="padding: 10px;">${booking.customer.email ? `<a href="mailto:${booking.customer.email}" style="color: #059669;">${booking.customer.email}</a>` : 'לא צוין'}</td>
                    </tr>
                    ${booking.customer.notes ? `
                    <tr style="background: #f9fafb;">
                        <td style="padding: 10px; font-weight: bold; color: #059669;">הערות:</td>
                        <td style="padding: 10px;">${booking.customer.notes}</td>
                    </tr>` : ''}
                </table>

                <p style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center;">
                    מקור: ${booking.source} | התקבל בתאריך ${new Date().toLocaleDateString('he-IL')} בשעה ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
        `
    });
};

// מייל ללקוח - אישור הזמנה
const sendBookingConfirmationToCustomer = async (booking, roomName) => {
    if (!booking.customer.email) return; // אין מייל ללקוח - לא שולחים

    const date = new Date(booking.date).toLocaleDateString('he-IL');
    const contactPhone = process.env.BUSINESS_PHONE || '054-8530162';

    await sendEmail({
        to: booking.customer.email,
        subject: `✅ אישור הזמנה ${booking.bookingId} - EscapeVR`,
        html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 25px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">✅ ההזמנה אושרה!</h1>
                <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">תודה שבחרת ב-EscapeVR</p>
            </div>
            <div style="background: white; padding: 25px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                <p style="font-size: 16px;">שלום <strong>${booking.customer.fullName}</strong>,</p>
                <p>ההזמנה שלך התקבלה בהצלחה! הנה הפרטים:</p>

                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px; font-weight: bold; color: #374151;">מספר הזמנה:</td>
                            <td style="padding: 8px; font-weight: bold; color: #6366f1; font-size: 18px;">${booking.bookingId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; color: #374151;">חדר:</td>
                            <td style="padding: 8px;">${roomName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; color: #374151;">תאריך:</td>
                            <td style="padding: 8px;">${date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; color: #374151;">שעה:</td>
                            <td style="padding: 8px;">${booking.timeSlot}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; color: #374151;">משתתפים:</td>
                            <td style="padding: 8px;">${booking.details.participantsCount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; color: #374151;">מחיר:</td>
                            <td style="padding: 8px; font-weight: bold; font-size: 18px; color: #10b981;">₪${booking.details.totalPrice}</td>
                        </tr>
                    </table>
                </div>

                <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; color: #92400e;">⏰ חשוב להגיע 10 דקות לפני השעה המתוכננת</p>
                </div>

                <p style="color: #6b7280;">לשאלות או שינויים בהזמנה, ניתן ליצור קשר:</p>
                <p style="color: #6b7280;">📞 <a href="tel:${contactPhone}" style="color: #6366f1;">${contactPhone}</a></p>

                <p style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center;">
                    EscapeVR - חוויית מציאות מדומה בלתי נשכחת
                </p>
            </div>
        </div>
        `
    });
};

module.exports = {
    sendEmail,
    sendNewLeadNotification,
    sendNewBookingAdminNotification,
    sendBookingConfirmationToCustomer
};
