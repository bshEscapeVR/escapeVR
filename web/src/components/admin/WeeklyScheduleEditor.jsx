'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Clock, Save, ChevronDown, ChevronUp } from 'lucide-react';
import NeonButton from '../ui/NeonButton';
import { settingsService } from '../../services';

// שמות הימים בעברית (ראשון עד חמישי + מוצ"ש)
const DAYS = [
    { index: 0, name: 'ראשון', isMotzash: false },
    { index: 1, name: 'שני', isMotzash: false },
    { index: 2, name: 'שלישי', isMotzash: false },
    { index: 3, name: 'רביעי', isMotzash: false },
    { index: 4, name: 'חמישי', isMotzash: false },
    { index: 6, name: 'מוצ"ש', isMotzash: true } // שבת בערב בלבד
];

// שעת תחילת מוצ"ש המינימלית
const MOTZASH_MIN_HOUR = 19;

// שעות ברירת מחדל
const DEFAULT_HOURS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30", "22:00"];

const WeeklyScheduleEditor = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [weeklyHours, setWeeklyHours] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newSlot, setNewSlot] = useState({});

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const settings = await settingsService.get();
            if (settings?.booking?.weeklyHours) {
                // המרת האובייקט מהשרת למבנה נוח לעבודה
                const hours = {};
                for (const day of DAYS) {
                    const dayKey = String(day.index);
                    hours[dayKey] = settings.booking.weeklyHours[dayKey] || [...DEFAULT_HOURS];
                }
                setWeeklyHours(hours);
            } else {
                // ברירת מחדל - כל הימים עם אותן שעות
                const defaultHours = {};
                for (const day of DAYS) {
                    defaultHours[String(day.index)] = [...DEFAULT_HOURS];
                }
                setWeeklyHours(defaultHours);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            // במקרה של שגיאה, נציג ברירת מחדל
            const defaultHours = {};
            for (const day of DAYS) {
                defaultHours[String(day.index)] = [...DEFAULT_HOURS];
            }
            setWeeklyHours(defaultHours);
        } finally {
            setLoading(false);
        }
    };

    const addSlot = (dayIndex) => {
        const dayKey = String(dayIndex);
        const time = newSlot[dayKey];
        const day = DAYS.find(d => d.index === dayIndex);

        if (!time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
            alert('נא להזין שעה תקינה בפורמט HH:MM');
            return;
        }

        // בדיקת שעת מוצ"ש - רק 19:00 ומעלה
        if (day?.isMotzash) {
            const [hour] = time.split(':').map(Number);
            if (hour < MOTZASH_MIN_HOUR) {
                alert(`במוצ"ש ניתן להגדיר שעות רק מ-${MOTZASH_MIN_HOUR}:00 ומעלה`);
                return;
            }
        }

        if (weeklyHours[dayKey]?.includes(time)) {
            alert('שעה זו כבר קיימת ביום זה');
            return;
        }

        setWeeklyHours(prev => ({
            ...prev,
            [dayKey]: [...(prev[dayKey] || []), time].sort()
        }));

        setNewSlot(prev => ({ ...prev, [dayKey]: '' }));
    };

    const removeSlot = (dayIndex, slot) => {
        const dayKey = String(dayIndex);
        setWeeklyHours(prev => ({
            ...prev,
            [dayKey]: prev[dayKey].filter(s => s !== slot)
        }));
    };

    const copyToAllDays = (sourceDayIndex) => {
        const sourceKey = String(sourceDayIndex);
        const sourceHours = weeklyHours[sourceKey] || [];

        const newHours = {};
        for (const day of DAYS) {
            if (day.isMotzash) {
                // עבור מוצ"ש - רק שעות מ-19:00 ומעלה
                newHours[String(day.index)] = sourceHours.filter(slot => {
                    const [hour] = slot.split(':').map(Number);
                    return hour >= MOTZASH_MIN_HOUR;
                });
            } else {
                newHours[String(day.index)] = [...sourceHours];
            }
        }
        setWeeklyHours(newHours);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await settingsService.update({
                booking: {
                    weeklyHours: weeklyHours
                }
            });
            alert('שעות הפעילות נשמרו בהצלחה!');
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('שגיאה בשמירת ההגדרות');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-[#1a0b2e] border border-white/10 rounded-xl overflow-hidden mb-6">
            {/* Header - כפתור פתיחה/סגירה */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Clock size={20} className="text-brand-primary" />
                    <span className="font-bold">ניהול שעות פעילות קבועות</span>
                </div>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {/* תוכן מתקפל */}
            {isOpen && (
                <div className="p-6 border-t border-white/10 animate-fade-in">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400 animate-pulse">
                            טוען הגדרות...
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-400 text-sm mb-6">
                                הגדר את שעות הפעילות לכל יום בשבוע. יום שישי סגור אוטומטית. במוצ"ש ניתן להגדיר שעות מ-19:00 ומעלה.
                            </p>

                            <div className="space-y-4">
                                {DAYS.map(day => (
                                    <div
                                        key={day.index}
                                        className="bg-[#0a0310] border border-white/10 rounded-lg p-4"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-white font-bold">
                                                    {day.isMotzash ? day.name : `יום ${day.name}`}
                                                </h4>
                                                {day.isMotzash && (
                                                    <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                                                        שעות ערב בלבד
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => copyToAllDays(day.index)}
                                                className="text-xs text-brand-primary hover:underline"
                                            >
                                                העתק לכל הימים
                                            </button>
                                        </div>

                                        {/* רשימת שעות */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {(weeklyHours[String(day.index)] || []).map(slot => (
                                                <span
                                                    key={slot}
                                                    className="bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                                >
                                                    {slot}
                                                    <button
                                                        onClick={() => removeSlot(day.index, slot)}
                                                        className="hover:text-red-400 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ))}
                                            {(weeklyHours[String(day.index)] || []).length === 0 && (
                                                <span className="text-gray-500 text-sm">
                                                    אין שעות מוגדרות - היום יהיה סגור
                                                </span>
                                            )}
                                        </div>

                                        {/* הוספת שעה חדשה */}
                                        <div className="flex gap-2">
                                            <input
                                                type="time"
                                                value={newSlot[String(day.index)] || ''}
                                                onChange={(e) => setNewSlot(prev => ({
                                                    ...prev,
                                                    [String(day.index)]: e.target.value
                                                }))}
                                                className="bg-[#1a0b2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-primary"
                                            />
                                            <button
                                                onClick={() => addSlot(day.index)}
                                                className="bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary px-3 py-2 rounded-lg transition-colors flex items-center gap-1 text-sm"
                                            >
                                                <Plus size={16} />
                                                הוסף
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* כפתור שמירה */}
                            <div className="mt-6">
                                <NeonButton
                                    onClick={handleSave}
                                    disabled={saving}
                                    icon={Save}
                                    fullWidth
                                >
                                    {saving ? 'שומר...' : 'שמור שעות פעילות'}
                                </NeonButton>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default WeeklyScheduleEditor;
