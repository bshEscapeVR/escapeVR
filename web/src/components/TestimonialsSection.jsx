'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import getApi from '../api/axios';
import SectionTitle from './ui/SectionTitle';
import ReviewSkeleton from './ui/ReviewSkeleton';
import ReviewCard from './reviews/ReviewCard';
import AllReviewsModal from './reviews/AllReviewsModal';

// פריט בקרוסלה: 1 בטלפון, 2 בטאבלט, 3 במחשב
const SLIDE_CLASS = 'shrink-0 basis-full md:basis-1/2 lg:basis-1/3 px-3 snap-start';

const TestimonialsSection = () => {
    // t = תרגום סטטי מה-JSON
    const { t } = useTranslation();

    // language = לשם החדר בשפה הנכונה
    const { language } = useSettings();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // מצב הקרוסלה
    const trackRef = useRef(null);
    const [page, setPage] = useState(0);
    const [pageCount, setPageCount] = useState(1);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                // שליפה מהשרת: רק ביקורות מאושרות
                const res = await getApi().get('/v1/reviews?approved=true');
                if (res.data.status === 'success') {
                    setReviews(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching reviews:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    // חישוב עמוד נוכחי ומספר עמודים לפי מיקום הגלילה (עובד גם ב-RTL, שבו scrollLeft שלילי)
    const updatePages = useCallback(() => {
        const el = trackRef.current;
        if (!el || !el.clientWidth) return;
        const pages = Math.max(1, Math.round(el.scrollWidth / el.clientWidth));
        setPageCount(pages);
        setPage(Math.min(pages - 1, Math.round(Math.abs(el.scrollLeft) / el.clientWidth)));
    }, []);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        updatePages();
        el.addEventListener('scroll', updatePages, { passive: true });
        const observer = new ResizeObserver(updatePages);
        observer.observe(el);
        return () => {
            el.removeEventListener('scroll', updatePages);
            observer.disconnect();
        };
    }, [reviews, updatePages]);

    const goToPage = (target) => {
        const el = trackRef.current;
        if (!el) return;
        const next = Math.max(0, Math.min(pageCount - 1, target));
        const isRtl = getComputedStyle(el).direction === 'rtl';
        const offset = next * el.clientWidth;
        el.scrollTo({ left: isRtl ? -offset : offset, behavior: 'smooth' });
    };

    const closeModal = useCallback(() => setIsModalOpen(false), []);

    // אם אין ביקורות מאושרות בכלל, לא נציג את הסקשן הזה
    if (!loading && reviews.length === 0) {
        return null;
    }

    const hasMultiplePages = pageCount > 1;

    // החץ "הבא" מצביע לכיוון הקריאה: שמאלה בעברית, ימינה באנגלית
    const isRtlLang = language === 'he';
    const leftAction = isRtlLang ? () => goToPage(page + 1) : () => goToPage(page - 1);
    const rightAction = isRtlLang ? () => goToPage(page - 1) : () => goToPage(page + 1);
    const leftDisabled = isRtlLang ? page >= pageCount - 1 : page <= 0;
    const rightDisabled = isRtlLang ? page <= 0 : page >= pageCount - 1;

    const arrowClass = 'hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-[#1a0b2e] border border-brand-primary/40 text-white shadow-lg hover:bg-brand-primary/30 transition-colors disabled:opacity-30 disabled:cursor-default';

    return (
        <section className="py-20  relative">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <SectionTitle
                    title={t('testimonials.title')}
                    subtitle={t('testimonials.subtitle')}
                />

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ReviewSkeleton />
                        <ReviewSkeleton />
                        <ReviewSkeleton />
                    </div>
                ) : (
                    <>
                        {/* קרוסלה - זזה רק בלחיצה על החיצים / החלקה, בלי תנועה אוטומטית */}
                        <div className="relative md:px-14">
                            {hasMultiplePages && (
                                <>
                                    <button type="button" onClick={leftAction} disabled={leftDisabled} aria-label={isRtlLang ? t('testimonials.next') : t('testimonials.prev')} className={`${arrowClass} left-0`}>
                                        <ChevronLeft size={22} />
                                    </button>
                                    <button type="button" onClick={rightAction} disabled={rightDisabled} aria-label={isRtlLang ? t('testimonials.prev') : t('testimonials.next')} className={`${arrowClass} right-0`}>
                                        <ChevronRight size={22} />
                                    </button>
                                </>
                            )}

                            <div ref={trackRef} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none -mx-3 py-4">
                                {reviews.map((review) => (
                                    <div key={review._id} className={SLIDE_CLASS}>
                                        <ReviewCard review={review} language={language} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* נקודות עמודים */}
                        {hasMultiplePages && (
                            <div className="flex justify-center gap-2 mt-4">
                                {Array.from({ length: pageCount }, (_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => goToPage(i)}
                                        aria-label={`${i + 1}`}
                                        className={`h-2.5 rounded-full transition-all ${i === page ? 'w-6 bg-brand-primary' : 'w-2.5 bg-white/20 hover:bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* כפתור לכל הביקורות */}
                        {hasMultiplePages && (
                            <div className="flex justify-center mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    className="px-6 py-3 rounded-full font-bold text-white border border-brand-primary/50 hover:bg-brand-primary/20 transition-colors"
                                >
                                    {t('testimonials.all_reviews')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AllReviewsModal isOpen={isModalOpen} onClose={closeModal} reviews={reviews} language={language} />
        </section>
    );
};

export default TestimonialsSection;
