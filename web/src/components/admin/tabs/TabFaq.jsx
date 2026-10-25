'use client';

import React from 'react';
import { HelpCircle, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import BilingualInput from '../../../components/admin/ui/BilingualInput';

const emptyItem = () => ({ question: { he: '', en: '' }, answer: { he: '', en: '' } });

const TabFaq = ({ settings, update }) => {
    const faq = settings.faq || {};
    const items = faq.items || [];
    const enabled = faq.enabled !== false;

    // עדכון שדה ב-faq (נשמר בלחיצה על "שמור שינויים" הכללי)
    const handleFaqChange = (key, newValue) => {
        update('faq', { ...faq, [key]: newValue });
    };

    const updateItem = (index, key, newValue) => {
        handleFaqChange('items', items.map((item, i) => (i === index ? { ...item, [key]: newValue } : item)));
    };

    const addItem = () => handleFaqChange('items', [...items, emptyItem()]);

    const removeItem = (index) => {
        if (!confirm('למחוק את השאלה?')) return;
        handleFaqChange('items', items.filter((_, i) => i !== index));
    };

    const moveItem = (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= items.length) return;
        const reordered = [...items];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        handleFaqChange('items', reordered);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* --- 1. הגדרות כלליות --- */}
            <div className="bg-[#1a0b2e]/50 border border-white/10 p-4 md:p-6 rounded-2xl">
                <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <HelpCircle className="text-brand-secondary" size={24} />
                        שאלות נפוצות
                    </h3>

                    <button
                        type="button"
                        onClick={() => handleFaqChange('enabled', !enabled)}
                        className="flex items-center gap-3 text-sm text-gray-300"
                    >
                        {enabled ? <Eye size={18} className="text-green-400" /> : <EyeOff size={18} className="text-gray-500" />}
                        {enabled ? 'מוצג באתר' : 'מוסתר'}
                        <span className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${enabled ? 'right-1' : 'left-1'}`}></span>
                        </span>
                    </button>
                </div>

                <p className="text-gray-400 text-sm mb-6">
                    הסקשן מוצג בדף הבית בין הביקורות למיקום, ומופיע קישור אליו בתפריט העליון - רק אם יש לפחות שאלה אחת עם תשובה.
                </p>

                <BilingualInput
                    label="כותרת האזור באתר - לא שאלה (אופציונלי, אם ריק: 'שאלות נפוצות')"
                    value={faq.title}
                    onChange={(val) => handleFaqChange('title', val)}
                    placeholder="שאלות נפוצות"
                />
                <BilingualInput
                    label="תת-כותרת מתחת לכותרת - לא שאלה (אופציונלי)"
                    value={faq.subtitle}
                    onChange={(val) => handleFaqChange('subtitle', val)}
                />
            </div>

            {/* אין עדיין שאלות - הסבר ברור איך מוסיפים */}
            {items.length === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl text-yellow-300 text-sm text-center">
                    עדיין אין שאלות. לחצו על &quot;הוסף שאלה&quot; למטה, מלאו שאלה ותשובה, ואז &quot;שמור שינויים&quot;.
                    האזור יופיע באתר רק כשיש לפחות שאלה אחת עם תשובה.
                </div>
            )}

            {/* --- 2. רשימת השאלות --- */}
            {items.map((item, index) => (
                <div key={index} className="bg-[#1a0b2e]/50 border border-brand-primary/30 p-4 md:p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-white font-bold">שאלה {index + 1}</span>
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} title="הזז למעלה" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
                                <ArrowUp size={16} />
                            </button>
                            <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} title="הזז למטה" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
                                <ArrowDown size={16} />
                            </button>
                            <button type="button" onClick={() => removeItem(index)} title="מחק" className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <BilingualInput
                        label="שאלה"
                        value={item.question}
                        onChange={(val) => updateItem(index, 'question', val)}
                    />
                    <BilingualInput
                        label="תשובה"
                        value={item.answer}
                        onChange={(val) => updateItem(index, 'answer', val)}
                        isTextArea={true}
                    />
                </div>
            ))}

            <button
                type="button"
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-brand-primary/50 bg-brand-primary/10 text-white font-bold hover:bg-brand-primary/20 transition-colors"
            >
                <Plus size={18} /> הוסף שאלה
            </button>
        </div>
    );
};

export default TabFaq;
