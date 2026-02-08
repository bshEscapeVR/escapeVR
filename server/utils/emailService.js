// utils/emailService.js
const nodemailer = require('nodemailer');
const SiteSettings = require('../models/SiteSettings');

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

// טעינת URL הלוגו מהגדרות האתר
const getLogoUrl = async () => {
    try {
        const settings = await SiteSettings.findOne();
        return settings?.general?.logoUrl || null;
    } catch {
        return null;
    }
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
                        <td style="padding: 10px;">${lead.notes || 'ללא הודעה'}</td>
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
    const logoUrl = await getLogoUrl();

    // לוגו: תמונה מ-Cloudinary או טקסט fallback
    const logoHtml = logoUrl
        ? `<img src="${logoUrl}" alt="EscapeVR" style="max-height: 70px; max-width: 220px; margin-bottom: 15px;" />`
        : `<h1 style="margin: 0 0 10px; font-size: 32px; color: #a855f7; letter-spacing: 2px;">ESCAPE<span style="color: #06b6d4;">VR</span></h1>`;

    await sendEmail({
        to: booking.customer.email,
        subject: `אישור הזמנה ${booking.bookingId} - EscapeVR`,
        html: `
        <div dir="rtl" style="font-family: 'Rubik', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1a0533 0%, #3e096b 50%, #1a0533 100%); padding: 40px 20px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                ${logoHtml}
                <div style="width: 80px; height: 2px; background: linear-gradient(90deg, #a855f7, #06b6d4); margin: 15px auto;"></div>
                <p style="margin: 0; color: #f3e8ff; font-size: 22px; font-weight: 600;">ההזמנה שלך אושרה!</p>
            </div>

            <!-- Body -->
            <div style="background: #1a0b2e; padding: 35px 30px; border-left: 1px solid rgba(168,85,247,0.2); border-right: 1px solid rgba(168,85,247,0.2);">
                <p style="color: #f3e8ff; font-size: 18px; margin: 0 0 5px;">שלום <strong style="color: #a855f7;">${booking.customer.fullName}</strong>,</p>
                <p style="color: #9ca3af; font-size: 16px; margin: 0 0 30px;">ההזמנה שלך התקבלה בהצלחה. מחכים לך!</p>

                <!-- Booking Details Card -->
                <div style="background: linear-gradient(135deg, #2d1052, #1a0533); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; padding: 30px; margin-bottom: 25px;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <span style="color: #06b6d4; font-size: 14px; text-transform: uppercase; letter-spacing: 3px;">מספר הזמנה</span>
                        <div style="color: #a855f7; font-size: 36px; font-weight: 700; letter-spacing: 2px; margin-top: 6px;">${booking.bookingId}</div>
                    </div>

                    <div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent); margin: 20px 0;"></div>

                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 14px 8px; color: #9ca3af; font-size: 16px;">חדר</td>
                            <td style="padding: 14px 8px; color: #f3e8ff; font-weight: 600; font-size: 16px; text-align: left;">${roomName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 14px 8px; color: #9ca3af; font-size: 16px;">תאריך</td>
                            <td style="padding: 14px 8px; color: #f3e8ff; font-weight: 600; font-size: 16px; text-align: left;">${date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 14px 8px; color: #9ca3af; font-size: 16px;">שעה</td>
                            <td style="padding: 14px 8px; color: #f3e8ff; font-weight: 600; font-size: 16px; text-align: left;">${booking.timeSlot}</td>
                        </tr>
                        <tr>
                            <td style="padding: 14px 8px; color: #9ca3af; font-size: 16px;">משתתפים</td>
                            <td style="padding: 14px 8px; color: #f3e8ff; font-weight: 600; font-size: 16px; text-align: left;">${booking.details.participantsCount}</td>
                        </tr>
                    </table>

                    <div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent); margin: 20px 0;"></div>

                    <div style="text-align: center;">
                        <span style="color: #9ca3af; font-size: 15px;">סה"כ לתשלום</span>
                        <div style="color: #06b6d4; font-size: 32px; font-weight: 700; margin-top: 6px;">₪${booking.details.totalPrice}</div>
                    </div>
                </div>

                <!-- Contact -->
                <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.15); border-radius: 10px; padding: 18px; text-align: center;">
                    <p style="margin: 0 0 5px; color: #9ca3af; font-size: 15px;">לשאלות או שינויים בהזמנה</p>
                    <a href="tel:${contactPhone}" style="color: #a855f7; font-size: 20px; font-weight: 600; text-decoration: none; letter-spacing: 1px;">${contactPhone}</a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #0f0518; padding: 20px; text-align: center; border-radius: 0 0 16px 16px; border-left: 1px solid rgba(168,85,247,0.1); border-right: 1px solid rgba(168,85,247,0.1); border-bottom: 1px solid rgba(168,85,247,0.1);">
                <p style="margin: 0; color: #4c1d95; font-size: 13px;">EscapeVR - חוויית מציאות מדומה בלתי נשכחת</p>
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
