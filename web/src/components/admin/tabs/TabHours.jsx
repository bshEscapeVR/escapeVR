'use client';

import React, { useEffect, useState } from 'react';
import { Clock, CalendarCheck, Eye, EyeOff, CreditCard, FileText, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OPENING_HOURS_KEYS, DEFAULT_OPENING_HOURS } from '../../../utils/openingHours';
import { paymentService } from '../../../services';
import BlockedDatesManager from '../BlockedDatesManager';

const DAY_LABELS = {
    '0': 'ראשון',
    '1': 'שני',
    '2': 'שלישי',
    '3': 'רביעי',
    '4': 'חמישי',
    '5': 'שישי',
    '6': 'מוצאי שבת',
    holidayEve: 'ערב חג',
    holidayEnd: 'מוצאי חג',
};

// מתג פשוט (כמו בלשונית השאלות הנפוצות)
const Toggle = ({ on, onClick, onText, offText }) => (
    <button type="button" onClick={onClick} className="flex items-center gap-3 text-sm text-gray-300">
        {on ? <Eye size={18} className="text-green-400" /> : <EyeOff size={18} className="text-gray-500" />}
        {on ? onText : offText}
        <span className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${on ? 'bg-green-500' : 'bg-gray-600'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${on ? 'right-1' : 'left-1'}`}></span>
        </span>
    </button>
);

const TabHours = ({ settings, update }) => {
    const hours = { ...DEFAULT_OPENING_HOURS, ...(settings.openingHours || {}) };
    const onlineEnabled = Boolean(settings.onlineBooking?.enabled);
    const paymentEnabled = Boolean(settings.onlinePayment?.enabled);
    const policy = settings.cancellationPolicy || {};
    const { t } = useTranslation();

    // האם מפתחות Sumit מוגדרים בשרת (null = עוד לא ידוע)
    const [sumitConfigured, setSumitConfigured] = useState(null);
    useEffect(() => {
        paymentService.getStatus()
            .then(data => setSumitConfigured(Boolean(data?.sumitConfigured)))
            .catch(() => setSumitConfigured(false));
    }, []);

    // עדכון שעות (נשמר בלחיצה על "שמור שינויים" הכללי)
    const handleDayChange = (key, field, value) => {
        update('openingHours', { ...hours, [key]: { ...hours[key], [field]: value } });
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* --- 1. הזמנה אונליין --- */}
            <div className="bg-[#1a0b2e]/50 border border-white/10 p-4 md:p-6 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <CalendarCheck className="text-brand-secondary" size={24} />
                        הזמנה אונליין באתר
                    </h3>
                    <Toggle
                        on={onlineEnabled}
                        onClick={() => update('onlineBooking', { ...settings.onlineBooking, enabled: !onlineEnabled })}
                        onText="פעיל"
                        offText="כבוי"
                    />
                </div>
                <p className="text-gray-400 text-sm">
                    {onlineEnabled
                        ? 'כפתורי "הזמן" באתר פותחים את מערכת ההזמנות: הלקוח בוחר עולם, תאריך, שעה פנויה ומספר משתתפים.'
                        : 'כפתורי "הזמן" באתר פותחים את טופס יצירת הקשר (הלקוח משאיר פרטים ואתם חוזרים אליו).'}
                </p>
            </div>

            {/* --- 1ב. תשלום מראש (Sumit) --- */}
            <div className="bg-[#1a0b2e]/50 border border-white/10 p-4 md:p-6 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <CreditCard className="text-brand-secondary" size={24} />
                        תשלום מראש בהזמנה
                    </h3>
                    <Toggle
                        on={paymentEnabled}
                        onClick={() => update('onlinePayment', { ...settings.onlinePayment, enabled: !paymentEnabled })}
                        onText="פעיל"
                        offText="כבוי"
                    />
                </div>
                <p className="text-gray-400 text-sm">
                    {paymentEnabled
                        ? 'הלקוח חייב לאשר את מדיניות הביטולים ולשלם את הסכום המלא בדף התשלום של Sumit. השעה נשמרת לו 15 דקות; ההזמנה מאושרת (ונשלחים המיילים והשיחה) רק אחרי שהתשלום עבר. הזמנות שאתם מכניסים בפאנל לא דורשות תשלום.'
                        : 'ההזמנה מאושרת מיד, בלי תשלום מראש (כמו היום).'}
                </p>
                {sumitConfigured === false && (
                    <p className="mt-3 text-sm text-yellow-300 flex items-start gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        מפתחות Sumit עדיין לא הוגדרו בשרת. כל עוד הם חסרים, כשהמתג דלוק לקוחות לא יוכלו להזמין - אל תדליקו לפני ההגדרה.
                    </p>
                )}
                {sumitConfigured && (
                    <p className="mt-3 text-sm text-green-400">✓ החיבור ל-Sumit מוגדר בשרת</p>
                )}
            </div>

            {/* --- 1ג. מדיניות ביטולים --- */}
            <div className="bg-[#1a0b2e]/50 border border-white/10 p-4 md:p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <FileText className="text-brand-secondary" size={24} />
                    מדיניות ביטולים
                </h3>
                <p className="text-gray-400 text-sm mb-4 pb-4 border-b border-white/5">
                    נפתחת מהצ&apos;קבוקס &quot;קראתי ואני מסכים/ה&quot; בחלון ההזמנה (כשתשלום מראש פעיל) ומצורפת למייל האישור ללקוח.
                    שדה ריק = הנוסח שמופיע באפור.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="text-sm text-gray-400 block mb-1">עברית</span>
                        <textarea
                            rows={5}
                            value={policy.he || ''}
                            placeholder={t('booking_modal.policy_default', { lng: 'he' })}
                            onChange={(e) => update('cancellationPolicy', { ...policy, he: e.target.value })}
                            className="w-full bg-[#130b1e] border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-gray-600"
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm text-gray-400 block mb-1">אנגלית</span>
                        <textarea
                            rows={5}
                            dir="ltr"
                            value={policy.en || ''}
                            placeholder={t('booking_modal.policy_default', { lng: 'en' })}
                            onChange={(e) => update('cancellationPolicy', { ...policy, en: e.target.value })}
                            className="w-full bg-[#130b1e] border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-gray-600"
                        />
                    </label>
                </div>
            </div>

            {/* --- 2. שעות פעילות --- */}
            <div className="bg-[#1a0b2e]/50 border border-white/10 p-4 md:p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Clock className="text-brand-secondary" size={24} />
                    שעות פעילות
                </h3>
                <p className="text-gray-400 text-sm mb-6 pb-4 border-b border-white/5">
                    השעות מוצגות באתר (אזור המיקום ותחתית האתר) וקובעות אילו שעות פנויות להזמנה.
                    &quot;עד&quot; = השעה האחרונה להתחלת משחק. 00:00 = חצות.
                    חגים נקבעים אוטומטית לפי הלוח העברי: ביום טוב סגור, בערב חג ובמוצאי חג חלות השעות שלהם.
                </p>

                <div className="space-y-3">
                    {OPENING_HOURS_KEYS.map((key) => {
                        const day = hours[key] || {};
                        return (
                            <div key={key} className="flex flex-wrap items-center gap-3 bg-black/20 border border-white/5 rounded-xl p-3">
                                <span className="w-28 font-bold text-white">{DAY_LABELS[key]}</span>

                                <label className="flex items-center gap-2 text-sm text-gray-400">
                                    מ-
                                    <input
                                        type="time"
                                        step="900"
                                        dir="ltr"
                                        value={day.open || ''}
                                        disabled={day.closed}
                                        onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                                        className="bg-[#130b1e] border border-white/10 rounded-lg p-2 text-white disabled:opacity-30"
                                    />
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-400">
                                    עד
                                    <input
                                        type="time"
                                        step="900"
                                        dir="ltr"
                                        value={day.close || ''}
                                        disabled={day.closed}
                                        onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                                        className="bg-[#130b1e] border border-white/10 rounded-lg p-2 text-white disabled:opacity-30"
                                    />
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-300 ms-auto cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(day.closed)}
                                        onChange={(e) => handleDayChange(key, 'closed', e.target.checked)}
                                        className="w-4 h-4 accent-red-500"
                                    />
                                    סגור
                                </label>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- 3. חסימות ימים ושעות --- */}
            <BlockedDatesManager />
        </div>
    );
};

export default TabHours;
