'use client';

import React from 'react';
import { Clock, CalendarCheck, Eye, EyeOff } from 'lucide-react';
import { OPENING_HOURS_KEYS, DEFAULT_OPENING_HOURS } from '../../../utils/openingHours';
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
