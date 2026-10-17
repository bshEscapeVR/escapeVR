'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useOverlay from '../../hooks/useOverlay';
import ReviewCard from './ReviewCard';

// חלון קופץ עם כל הביקורות המאושרות (גלילה פנימית)
const AllReviewsModal = ({ isOpen, onClose, reviews, language }) => {
    const { t } = useTranslation();
    useOverlay(isOpen, onClose);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

            <div
                role="dialog"
                aria-modal="true"
                aria-label={t('testimonials.all_reviews_title')}
                className="relative w-full max-w-5xl max-h-[85vh] flex flex-col bg-[#120624] border border-brand-primary/30 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.3)] animate-zoom-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* כותרת */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                    <h3 className="text-xl md:text-2xl font-bold text-white">
                        {t('testimonials.all_reviews_title')} <span className="text-gray-500 text-base">({reviews.length})</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('testimonials.close')}
                        className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* רשימת הביקורות */}
                <div className="overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reviews.map((review) => (
                            <ReviewCard key={review._id} review={review} language={language} />
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AllReviewsModal;
