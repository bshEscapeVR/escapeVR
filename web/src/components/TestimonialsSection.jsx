'use client';

import React, { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import getApi from '../api/axios';
import SectionTitle from './ui/SectionTitle';
import ReviewSkeleton from './ui/ReviewSkeleton';

const TestimonialsSection = () => {
    // t = תרגום סטטי מה-JSON
    const { t } = useTranslation();
    
    // language = כדי לדעת איך להציג את התאריך (he/en)
    const { language } = useSettings();
    
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // אם אין ביקורות מאושרות בכלל, לא נציג את הסקשן הזה
    if (!loading && reviews.length === 0) {
        return null; 
    }

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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {reviews.map((review) => (
                            <div key={review._id} className="bg-[#1a0b2e] border border-brand-primary/30 p-8 rounded-2xl relative shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:border-brand-primary/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-[1.02] transition-[transform,box-shadow,border-color] duration-300 ease-out group text-start h-full flex flex-col">
                                
                                {/* אייקון ציטוט - מיקום דינמי לפי שפה */}
                                <Quote className="absolute top-4 rtl:left-4 ltr:right-4 text-brand-primary/20 transform rotate-180" size={40} />
                                
                                {/* דירוג כוכבים */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} className={`${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                    ))}
                                </div>

                                {/* תוכן הביקורת */}
                                <p className="text-lg font-medium text-white mb-4 italic flex-grow">
                                    "{review.content}"
                                </p>
                                
                                {/* פרטי הכותב */}
                                <div className="mt-auto border-t border-white/5 pt-4">
                                    <h4 className="font-bold text-brand-secondary">{review.authorName}</h4>

                                    {/* שם החדר שנבחר בביקורת */}
                                    {review.roomId?.title && (
                                        <span className="text-xs text-gray-500 block mt-1">
                                            {review.roomId.title[language] || review.roomId.title.he}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TestimonialsSection;