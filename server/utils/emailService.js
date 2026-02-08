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

// --- בניית לוגו HTML ---
const buildLogoHtml = (logoUrl, size = 'small') => {
    if (logoUrl) {
        const h = size === 'large' ? 60 : 50;
        const w = size === 'large' ? 200 : 160;
        return `<img src="${logoUrl}" alt="EscapeVR" style="max-height: ${h}px; max-width: ${w}px; margin-bottom: 12px;" />`;
    }
    const fs = size === 'large' ? 28 : 24;
    return `<h1 style="margin: 0 0 8px; font-size: ${fs}px; color: #a855f7; letter-spacing: 2px;">ESCAPE<span style="color: #c084fc;">VR</span></h1>`;
};

// --- תבניות מיילים ---

// מייל למנהל על הודעת צור קשר חדשה
const sendNewLeadNotification = async (lead) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const logoUrl = await getLogoUrl();

    await sendEmail({
        to: adminEmail,
        subject: `📩 הודעה חדשה מטופס צור קשר - ${lead.fullName}`,
        html: `
        <div dir="rtl" style="font-family: 'Rubik', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2a0f4e 0%, #5b21b6 50%, #2a0f4e 100%); padding: 28px 20px; text-align: center; border-radius: 16px 16px 0 0;">
                ${buildLogoHtml(logoUrl)}
                <div style="width: 60px; height: 2px; background: linear-gradient(90deg, #a855f7, #c084fc); margin: 10px auto;"></div>
                <p style="margin: 0; color: #f3e8ff; font-size: 18px; font-weight: 600;">📩 הודעה חדשה מטופס צור קשר</p>
            </div>

            <!-- Body -->
            <div style="background: #2d1650; padding: 25px; border-left: 1px solid rgba(168,85,247,0.2); border-right: 1px solid rgba(168,85,247,0.2);">
                <div style="background: linear-gradient(135deg, #3b1a6e, #2a0f4e); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; padding: 22px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 8px; color: #9ca3af; font-size: 14px; width: 90px;">שם מלא</td>
                            <td style="padding: 12px 8px; color: #f3e8ff; font-weight: 600; font-size: 15px;">${lead.fullName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 8px; color: #9ca3af; font-size: 14px;">אימייל</td>
                            <td style="padding: 12px 8px; font-size: 15px;"><a href="mailto:${lead.email}" style="color: #a855f7; text-decoration: none;">${lead.email || 'לא צוין'}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 8px; color: #9ca3af; font-size: 14px;">טלפון</td>
                            <td style="padding: 12px 8px; font-size: 15px;"><a href="tel:${lead.phone}" style="color: #c084fc; text-decoration: none; font-weight: 600;">${lead.phone || 'לא צוין'}</a></td>
                        </tr>
                    </table>

                    <div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent); margin: 12px 0;"></div>

                    <div style="padding: 8px;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 6px;">הודעה:</p>
                        <p style="color: #f3e8ff; font-size: 15px; margin: 0; line-height: 1.6; background: rgba(168,85,247,0.06); border-radius: 8px; padding: 12px;">${lead.notes || 'ללא הודעה'}</p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #1e0a38; padding: 14px; text-align: center; border-radius: 0 0 16px 16px; border-left: 1px solid rgba(168,85,247,0.1); border-right: 1px solid rgba(168,85,247,0.1); border-bottom: 1px solid rgba(168,85,247,0.1);">
                <p style="margin: 0; color: #4c1d95; font-size: 11px;">
                    התקבל בתאריך ${new Date().toLocaleDateString('he-IL')} בשעה ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
        `
    });
};

// מייל למנהל על הזמנה חדשה
const sendNewBookingAdminNotification = async (booking, roomName, roomImage) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const date = new Date(booking.date).toLocaleDateString('he-IL');
    const logoUrl = await getLogoUrl();

    const sourceLabels = { website: 'אתר', phone: 'טלפון', 'walk-in': 'הגעה', whatsapp: 'וואטסאפ' };

    const roomImageHtml = roomImage
        ? `<img src="${roomImage}" alt="${roomName}" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 10px; margin-bottom: 18px; border: 1px solid rgba(168,85,247,0.3);" />`
        : '';

    await sendEmail({
        to: adminEmail,
        subject: `🎮 הזמנה חדשה ${booking.bookingId} - ${roomName}`,
        html: `
        <div dir="rtl" style="font-family: 'Rubik', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2a0f4e 0%, #5b21b6 50%, #2a0f4e 100%); padding: 28px 20px; text-align: center; border-radius: 16px 16px 0 0;">
                ${buildLogoHtml(logoUrl)}
                <div style="width: 60px; height: 2px; background: linear-gradient(90deg, #a855f7, #c084fc); margin: 10px auto;"></div>
                <p style="margin: 0; color: #f3e8ff; font-size: 18px; font-weight: 600;">🎮 הזמנה חדשה התקבלה!</p>
                <p style="margin: 6px 0 0; color: #a855f7; font-size: 20px; font-weight: 700; letter-spacing: 1px;">${booking.bookingId}</p>
            </div>

            <!-- Body -->
            <div style="background: #2d1650; padding: 25px; border-left: 1px solid rgba(168,85,247,0.2); border-right: 1px solid rgba(168,85,247,0.2);">

                <!-- תמונת חדר -->
                ${roomImageHtml}

                <!-- פרטי הזמנה -->
                <p style="color: #a855f7; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 10px;">פרטי ההזמנה</p>
                <div style="background: linear-gradient(135deg, #3b1a6e, #2a0f4e); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; padding: 22px; margin-bottom: 18px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 8px; color: #9ca3af; font-size: 14px;">חדר</td>
                            <td style="padding: 10px 8px; color: #f3e8ff; font-weight: 600; font-size: 15px; text-align: left;">${roomName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 8px; color: #9ca3af; font-size: 14px;">תאריך</td>
                            <td style="padding: 10px 8px; color: #f3e8ff; font-weight: 600; font-size: 15px; text-align: left;">${date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 8px; color: #9ca3af; font-size: 14px;">שעה</td>
                            <td style="padding: 10px 8px; color: #f3e8ff; font-weight: 600; font-size: 15px; text-align: left;">${booking.timeSlot}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 8px; color: #9ca3af; font-size: 14px;">משתתפים</td>
                            <td style="padding: 10px 8px; color: #f3e8ff; font-weight: 600; font-size: 15px; text-align: left;">${booking.details.participantsCount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 8px; color: #9ca3af; font-size: 14px;">מחיר</td>
                            <td style="padding: 10px 8px; color: #a855f7; font-weight: 700; font-size: 18px; text-align: left;">₪${booking.details.totalPrice}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 8px; color: #9ca3af; font-size: 14px;">מקור</td>
                            <td style="padding: 10px 8px; color: #f3e8ff; font-size: 14px; text-align: left;">${sourceLabels[booking.source] || booking.source}</td>
                        </tr>
                    </table>
                </div>

                <!-- פרטי לקוח -->
                <p style="color: #a855f7; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 10px;">פרטי הלקוח</p>
                <div style="background: linear-gradient(135deg, #3b1a6e, #2a0f4e); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; padding: 22px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 8px; color: #9ca3af; font-size: 14px; width: 90px;">שם</td>
                            <td style="padding: 10px 8px; color: #f3e8ff; font-weight: 600; font-size: 15px;">${booking.customer.fullName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 8px; color: #9ca3af; font-size: 14px;">טלפון</td>
                            <td style="padding: 10px 8px; font-size: 15px;"><a href="tel:${booking.customer.phone}" style="color: #c084fc; text-decoration: none; font-weight: 600;">${booking.customer.phone}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 8px; color: #9ca3af; font-size: 14px;">אימייל</td>
                            <td style="padding: 10px 8px; font-size: 15px;">${booking.customer.email ? `<a href="mailto:${booking.customer.email}" style="color: #a855f7; text-decoration: none;">${booking.customer.email}</a>` : '<span style="color:#6b7280;">לא צוין</span>'}</td>
                        </tr>
                        ${booking.customer.notes ? `
                        <tr>
                            <td style="padding: 10px 8px; color: #9ca3af; font-size: 14px;">הערות</td>
                            <td style="padding: 10px 8px; color: #f3e8ff; font-size: 14px;">${booking.customer.notes}</td>
                        </tr>` : ''}
                    </table>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #1e0a38; padding: 14px; text-align: center; border-radius: 0 0 16px 16px; border-left: 1px solid rgba(168,85,247,0.1); border-right: 1px solid rgba(168,85,247,0.1); border-bottom: 1px solid rgba(168,85,247,0.1);">
                <p style="margin: 0; color: #4c1d95; font-size: 11px;">
                    התקבל בתאריך ${new Date().toLocaleDateString('he-IL')} בשעה ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
        `
    });
};

// מייל ללקוח - אישור הזמנה
const sendBookingConfirmationToCustomer = async (booking, roomName, roomImage) => {
    if (!booking.customer.email) return; // אין מייל ללקוח - לא שולחים

    const date = new Date(booking.date).toLocaleDateString('he-IL');
    const contactPhone = process.env.BUSINESS_PHONE || '054-8530162';
    const logoUrl = await getLogoUrl();

    const roomImageHtml = roomImage
        ? `<img src="${roomImage}" alt="${roomName}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(168,85,247,0.3);" />`
        : '';

    await sendEmail({
        to: booking.customer.email,
        subject: `אישור הזמנה ${booking.bookingId} - EscapeVR`,
        html: `
        <div dir="rtl" style="font-family: 'Rubik', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2a0f4e 0%, #5b21b6 50%, #2a0f4e 100%); padding: 35px 20px 25px; text-align: center; border-radius: 16px 16px 0 0;">
                ${buildLogoHtml(logoUrl, 'large')}
                <div style="width: 70px; height: 2px; background: linear-gradient(90deg, #a855f7, #c084fc); margin: 12px auto;"></div>
                <p style="margin: 0; color: #f3e8ff; font-size: 20px; font-weight: 600;">ההזמנה שלך אושרה!</p>
            </div>

            <!-- Body -->
            <div style="background: #2d1650; padding: 30px 25px; border-left: 1px solid rgba(168,85,247,0.2); border-right: 1px solid rgba(168,85,247,0.2);">
                <p style="color: #f3e8ff; font-size: 16px; margin: 0 0 4px;">שלום <strong style="color: #a855f7;">${booking.customer.fullName}</strong>,</p>
                <p style="color: #9ca3af; font-size: 14px; margin: 0 0 25px;">ההזמנה שלך התקבלה בהצלחה. מחכים לך!</p>

                <!-- תמונת חדר -->
                ${roomImageHtml}

                <!-- Booking Details Card -->
                <div style="background: linear-gradient(135deg, #3b1a6e, #2a0f4e); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; padding: 25px; margin-bottom: 20px;">
                    <div style="text-align: center; margin-bottom: 18px;">
                        <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 3px;">מספר הזמנה</span>
                        <div style="color: #a855f7; font-size: 24px; font-weight: 700; letter-spacing: 1px; margin-top: 4px; text-shadow: 0 0 20px rgba(168,85,247,0.4);">${booking.bookingId}</div>
                    </div>

                    <div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent); margin: 15px 0;"></div>

                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 8px; color: #9ca3af; font-size: 14px;">חדר</td>
                            <td style="padding: 12px 8px; color: #f3e8ff; font-weight: 600; font-size: 15px; text-align: left;">${roomName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 8px; color: #9ca3af; font-size: 14px;">תאריך</td>
                            <td style="padding: 12px 8px; color: #f3e8ff; font-weight: 600; font-size: 15px; text-align: left;">${date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 8px; color: #9ca3af; font-size: 14px;">שעה</td>
                            <td style="padding: 12px 8px; color: #f3e8ff; font-weight: 600; font-size: 15px; text-align: left;">${booking.timeSlot}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 8px; color: #9ca3af; font-size: 14px;">משתתפים</td>
                            <td style="padding: 12px 8px; color: #f3e8ff; font-weight: 600; font-size: 15px; text-align: left;">${booking.details.participantsCount}</td>
                        </tr>
                    </table>

                    <div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent); margin: 15px 0;"></div>

                    <div style="text-align: center;">
                        <span style="color: #9ca3af; font-size: 13px;">סה"כ לתשלום</span>
                        <div style="color: #a855f7; font-size: 26px; font-weight: 700; margin-top: 4px; text-shadow: 0 0 20px rgba(168,85,247,0.4);">₪${booking.details.totalPrice}</div>
                    </div>
                </div>

                <!-- Contact -->
                <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.15); border-radius: 10px; padding: 15px; text-align: center;">
                    <p style="margin: 0 0 4px; color: #9ca3af; font-size: 13px;">לשאלות או שינויים בהזמנה</p>
                    <a href="tel:${contactPhone}" style="color: #a855f7; font-size: 18px; font-weight: 600; text-decoration: none; letter-spacing: 1px;">${contactPhone}</a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #1e0a38; padding: 18px; text-align: center; border-radius: 0 0 16px 16px; border-left: 1px solid rgba(168,85,247,0.1); border-right: 1px solid rgba(168,85,247,0.1); border-bottom: 1px solid rgba(168,85,247,0.1);">
                <p style="margin: 0; color: #4c1d95; font-size: 12px;">EscapeVR - חוויית מציאות מדומה בלתי נשכחת</p>
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
