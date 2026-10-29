'use strict';

// נוסח ברירת המחדל - אותו נוסח כמו booking_modal.policy_default בקובץ התרגום של האתר.
// האדמין יכול לשנות אותו ב"שעות והזמנה" (settings.cancellationPolicy).
const DEFAULT_CANCELLATION_POLICY = {
    he: 'ביטול או שינוי מועד עד 24 שעות לפני מועד ההזמנה – החזר כספי מלא.\nביטול בתוך 24 שעות ממועד ההזמנה או אי-הגעה – ללא החזר.\nלביטול או שינוי מועד יש ליצור קשר בטלפון.\nהשעה שבחרתם נשמרת לכם 15 דקות להשלמת התשלום. אם התשלום לא הושלם בזמן הזה – השעה משתחררת וההזמנה לא נקלטת.\nאם התשלום הושלם לאחר שהשעה כבר נתפסה – ניצור איתכם קשר לתיאום מועד אחר או להחזר כספי מלא.\nאנו רשאים לבטל הזמנה שנקבעה בהודעה של 24 שעות לפחות מראש, ובמקרה כזה יינתן החזר כספי מלא.',
    en: 'Cancellation or rescheduling up to 24 hours before the booking – full refund.\nCancellation within 24 hours of the booking or no-show – no refund.\nTo cancel or reschedule, please contact us by phone.\nYour chosen time is held for 15 minutes to complete the payment. If the payment isn\'t completed within that time, the time is released and the booking is not placed.\nIf the payment is completed after the time was already taken, we\'ll contact you to arrange another time or a full refund.\nWe may cancel a confirmed booking with at least 24 hours\' notice, in which case a full refund will be given.',
};

/** הנוסח שהאדמין הגדיר, או ברירת המחדל */
const getCancellationPolicy = (settings, lang = 'he') => {
    const custom = settings?.cancellationPolicy?.[lang]?.trim();
    return custom || DEFAULT_CANCELLATION_POLICY[lang] || DEFAULT_CANCELLATION_POLICY.he;
};

module.exports = { DEFAULT_CANCELLATION_POLICY, getCancellationPolicy };
