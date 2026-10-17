'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, Quote, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useOverlay from '../../hooks/useOverlay';

const VIEWPORT_MARGIN = 16;

// תוכן הביקורת - משותף לכרטיס הרגיל ולכרטיס המורחב
const ReviewContent = ({ review, textRef, clamped }) => (
    <>
        <Quote className="absolute top-4 rtl:left-4 ltr:right-4 text-brand-primary/20 transform rotate-180" size={40} />

        {/* דירוג כוכבים */}
        <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={`${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
            ))}
        </div>

        {/* תוכן הביקורת */}
        <p ref={textRef} className={`text-lg font-medium text-white italic whitespace-pre-line ${clamped ? 'line-clamp-4' : ''}`}>
            &quot;{review.content}&quot;
        </p>
    </>
);

// פרטי הכותב
const ReviewAuthor = ({ review, language, t }) => (
    <div className="mt-auto border-t border-white/5 pt-4">
        <h4 className="font-bold text-brand-secondary">{review.authorName}</h4>

        {/* ביקורת מגוגל - ייחוס לגוגל (נדרש לפי תנאי השימוש של Google) */}
        {review.source === 'google' && (
            <a href={review.externalUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-gray-300 block mt-1">
                {t('testimonials.google_review')}
            </a>
        )}

        {/* שם החדר שנבחר בביקורת */}
        {review.roomId?.title && (
            <span className="text-xs text-gray-500 block mt-1">
                {review.roomId.title[language] || review.roomId.title.he}
            </span>
        )}
    </div>
);

// מיקום הכרטיס המורחב: מתרחב מהמרכז של הכרטיס המקורי לכל הכיוונים, בתוך גבולות המסך
const getExpandedPosition = (rect) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(vw - VIEWPORT_MARGIN * 2, Math.max(rect.width * 1.4, 480));
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return {
        width,
        left: Math.min(Math.max(centerX, width / 2 + VIEWPORT_MARGIN), vw - width / 2 - VIEWPORT_MARGIN),
        top: Math.min(Math.max(centerY, vh * 0.3), vh * 0.7) // הכרטיס עד 60vh גובה - נשאר בתוך המסך
    };
};

/**
 * כרטיס ביקורת: טקסט מקוצר ל-4 שורות עם "קרא עוד".
 * בלחיצה הכרטיס "מתרחב" לכל הכיוונים ומציג את הביקורת המלאה, עם X לחזרה.
 */
const ReviewCard = ({ review, language }) => {
    const { t } = useTranslation();
    const cardRef = useRef(null);
    const textRef = useRef(null);
    const [isTruncated, setIsTruncated] = useState(false);
    const [expandedPos, setExpandedPos] = useState(null);

    const close = () => setExpandedPos(null);
    useOverlay(!!expandedPos, close);

    // בדיקה אם הטקסט נחתך (מציגים "קרא עוד" רק אם יש מה להרחיב)
    useEffect(() => {
        const el = textRef.current;
        if (!el) return;
        const check = () => setIsTruncated(el.scrollHeight > el.clientHeight + 1);
        check();
        const observer = new ResizeObserver(check);
        observer.observe(el);
        return () => observer.disconnect();
    }, [review.content]);

    const expand = () => setExpandedPos(getExpandedPosition(cardRef.current.getBoundingClientRect()));

    return (
        <>
            <div ref={cardRef} className="bg-[#1a0b2e] border border-brand-primary/30 p-8 rounded-2xl relative shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:border-brand-primary/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-[box-shadow,border-color] duration-300 ease-out text-start h-full flex flex-col">
                <ReviewContent review={review} textRef={textRef} clamped />

                <div className="mb-4 mt-2 min-h-[1.5rem]">
                    {isTruncated && (
                        <button type="button" onClick={expand} className="text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors">
                            {t('testimonials.read_more')}
                        </button>
                    )}
                </div>

                <ReviewAuthor review={review} language={language} t={t} />
            </div>

            {/* כרטיס מורחב */}
            {expandedPos && createPortal(
                <div className="fixed inset-0 z-[110]" onClick={close}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
                    <div
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ top: expandedPos.top, left: expandedPos.left, width: expandedPos.width }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="animate-zoom-in bg-[#1a0b2e] border border-brand-primary/50 p-8 pt-12 rounded-2xl relative shadow-[0_0_40px_rgba(168,85,247,0.45)] text-start max-h-[60vh] overflow-y-auto flex flex-col">
                            <button
                                type="button"
                                onClick={close}
                                aria-label={t('testimonials.close')}
                                className="absolute top-3 rtl:right-3 ltr:left-3 p-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors z-10"
                            >
                                <X size={20} />
                            </button>
                            <ReviewContent review={review} clamped={false} />
                            <div className="mt-4">
                                <ReviewAuthor review={review} language={language} t={t} />
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default ReviewCard;
