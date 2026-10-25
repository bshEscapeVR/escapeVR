'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import SectionTitle from './ui/SectionTitle';

// שאלות שמוצגות בפועל: רק כשהסקשן פעיל ויש גם שאלה וגם תשובה בשפה הנוכחית (או בגיבוי)
// משמש גם את ה-Navbar כדי להציג את הקישור רק כשיש מה להציג
export const getVisibleFaqItems = (faq, tDB) => {
    if (!faq || faq.enabled === false) return [];
    return (faq.items || [])
        .map((item) => ({ question: tDB(item.question).trim(), answer: tDB(item.answer).trim() }))
        .filter((item) => item.question && item.answer);
};

const FaqSection = () => {
    // t = תרגום סטטי מה-JSON, tDB = טקסט דו-לשוני מהדשבורד
    const { t } = useTranslation();
    const { settings, t: tDB } = useSettings();

    const [openIndex, setOpenIndex] = useState(null);

    const faq = settings?.faq;
    const items = getVisibleFaqItems(faq, tDB);

    // אין שאלות - לא מציגים את הסקשן
    if (items.length === 0) return null;

    // סימון מובנה לגוגל (FAQPage) - עוזר לגוגל להבין את התוכן, לא משפיע על התצוגה
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer }
        }))
    };

    return (
        <section id="faq" className="py-20 relative scroll-mt-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <SectionTitle
                    title={tDB(faq.title) || t('faq.title')}
                    subtitle={tDB(faq.subtitle) || t('faq.subtitle')}
                />

                {/* אקורדיון - שאלה אחת פתוחה בכל פעם */}
                <div className="space-y-3">
                    {items.map((item, i) => {
                        const isOpen = openIndex === i;
                        return (
                            <div
                                key={i}
                                className={`glass-panel rounded-2xl border transition-colors ${isOpen ? 'border-brand-primary/50' : 'border-white/10'}`}
                            >
                                <h3>
                                    <button
                                        type="button"
                                        id={`faq-q-${i}`}
                                        aria-expanded={isOpen}
                                        aria-controls={`faq-a-${i}`}
                                        onClick={() => setOpenIndex(isOpen ? null : i)}
                                        className="w-full flex items-center justify-between gap-4 p-5 text-start text-white font-bold text-lg"
                                    >
                                        <span>{item.question}</span>
                                        <ChevronDown
                                            size={22}
                                            className={`shrink-0 text-brand-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                </h3>

                                <div
                                    id={`faq-a-${i}`}
                                    role="region"
                                    aria-labelledby={`faq-q-${i}`}
                                    hidden={!isOpen}
                                    className="px-5 pb-5 text-gray-300 leading-relaxed whitespace-pre-line"
                                >
                                    {item.answer}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FaqSection;
