'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Tag, Check, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../context/BookingContext';
import { useSettings } from '../context/SettingsContext';
import SectionTitle from './ui/SectionTitle';
import getApi from '../api/axios';

// Skeleton loader for pricing card
const PricingCardSkeleton = () => (
    <div className="bg-[#1a0b2e] border border-brand-primary/30 rounded-2xl p-8 flex flex-col h-full animate-pulse">
        <div className="flex flex-col items-center mb-6">
            <div className="bg-white/10 w-16 h-16 rounded-full mb-4" />
            <div className="bg-white/10 h-8 w-32 rounded-lg" />
        </div>
        <div className="text-center mb-2">
            <div className="bg-white/5 h-6 w-20 mx-auto rounded" />
        </div>
        <div className="flex justify-center mb-4">
            <div className="bg-white/5 h-8 w-28 rounded-full" />
        </div>
        <div className="text-center mb-6">
            <div className="bg-white/10 h-12 w-24 mx-auto rounded-lg" />
        </div>
        <div className="space-y-3 mb-8 flex-grow">
            <div className="bg-white/5 h-5 w-full rounded" />
            <div className="bg-white/5 h-5 w-4/5 rounded" />
            <div className="bg-white/5 h-5 w-3/4 rounded" />
        </div>
        <div className="bg-white/10 h-14 w-full rounded-full" />
    </div>
);

const PricingCard = ({ players, oldPrice, newPrice, totalPrice, discount, features, onBook, t }) => {
    return (
        <div className="bg-[#1a0b2e] border border-brand-primary/30 rounded-2xl p-8 flex flex-col h-full shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:border-brand-primary/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:-translate-y-2 transition-all duration-300 group">

            {/* Icon & Title */}
            <div className="flex flex-col items-center mb-6">
                <div className="bg-brand-primary/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Users className="text-brand-neon" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white">
                    {players} {t('pricing.players')}
                </h3>
            </div>

            {/* Old Price */}
            <div className="text-center mb-2">
                <span className="text-gray-500 line-through text-lg">₪{oldPrice}</span>
                <span className="text-gray-500 text-sm block">{t('pricing.per_person')}</span>
            </div>

            {/* Discount Badge */}
            {discount > 0 && (
                <div className="flex justify-center mb-4">
                    <div className="bg-black/50 border border-emerald-500/50 rounded-full px-4 py-1.5 flex items-center gap-2">
                        <Tag size={14} className="text-emerald-400" />
                        <span className="text-emerald-400 text-sm font-bold">{discount}% {t('pricing.discount')}</span>
                    </div>
                </div>
            )}

            {/* New Price */}
            <div className="text-center mb-2">
                <span className="text-5xl font-bold text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">₪{newPrice}</span>
                <span className="text-cyan-400 text-sm block mt-1">{t('pricing.per_person')}</span>
            </div>

            {/* Total Price */}
            <p className="text-gray-400 text-sm text-center mb-6">
                ({t('pricing.total')} ₪{totalPrice} {t('pricing.for')} {players} {t('pricing.players')})
            </p>

            {/* Features List */}
            <ul className="space-y-3 mb-8 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-start">
                        <Check size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                ))}
            </ul>

            {/* CTA Button */}
            <button
                onClick={onBook}
                className="w-full py-4 rounded-full font-bold text-white text-lg bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105"
            >
                {t('pricing.book_now')}
            </button>
        </div>
    );
};

const PricingSection = () => {
    const { t } = useTranslation();
    const { openBooking } = useBooking();
    const { language } = useSettings();
    const [pricingPlans, setPricingPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    // פיצ'רים מה-JSON (ברירת מחדל)
    const defaultFeatures = [
        t('pricing.feature_1'),
        t('pricing.feature_2'),
        t('pricing.feature_3')
    ];

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await getApi().get('/v1/pricing');
                if (res.data.status === 'success' && res.data.data.length > 0) {
                    setPricingPlans(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching pricing:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPricing();
    }, []);

    // חישוב הפריסה בהתאם למספר הכרטיסים
    const getGridLayout = () => {
        const count = pricingPlans.length;
        if (count <= 3) {
            return { firstRow: pricingPlans, secondRow: [] };
        }
        // אם יש יותר מ-3, שים 3 בשורה הראשונה והשאר בשורה השנייה
        return { firstRow: pricingPlans.slice(0, 3), secondRow: pricingPlans.slice(3) };
    };

    const { firstRow, secondRow } = getGridLayout();

    return (
        <section className="pt-8 pb-20 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <SectionTitle
                    title={t('pricing.title')}
                    subtitle={t('pricing.subtitle')}
                />

                {/* הודעה כשאין כרטיסי מחיר */}
                {!loading && pricingPlans.length === 0 && (
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="bg-[#1a0b2e] border border-brand-primary/30 rounded-2xl p-10 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                            <div className="bg-brand-primary/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageCircle className="text-brand-neon" size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                                {t('pricing.no_pricing_title')}
                            </h3>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                {t('pricing.no_pricing_desc')}
                            </p>
                            <Link
                                href={`/${language}/contact`}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105"
                            >
                                <MessageCircle size={20} />
                                {t('pricing.contact_btn')}
                            </Link>
                        </div>
                    </div>
                )}

                {loading ? (
                    // Skeleton loading state
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <PricingCardSkeleton />
                        <PricingCardSkeleton />
                        <PricingCardSkeleton />
                    </div>
                ) : (
                    <>
                        {/* First Row - up to 3 cards */}
                        <div className={`grid grid-cols-1 ${firstRow.length === 1 ? 'max-w-md mx-auto' : firstRow.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6 mb-8`}>
                            {firstRow.map((plan) => (
                                <PricingCard
                                    key={plan._id}
                                    players={plan.players}
                                    oldPrice={plan.oldPrice}
                                    newPrice={plan.newPrice}
                                    totalPrice={plan.totalPrice || plan.newPrice * plan.players}
                                    discount={plan.discount || plan.calculatedDiscount || 0}
                                    features={defaultFeatures}
                                    onBook={() => openBooking()}
                                    t={t}
                                />
                            ))}
                        </div>

                        {/* Second Row - remaining cards */}
                        {secondRow.length > 0 && (
                            <div className={`grid grid-cols-1 ${secondRow.length === 1 ? 'max-w-md mx-auto' : 'md:grid-cols-2'} gap-6 max-w-3xl mx-auto`}>
                                {secondRow.map((plan) => (
                                    <PricingCard
                                        key={plan._id}
                                        players={plan.players}
                                        oldPrice={plan.oldPrice}
                                        newPrice={plan.newPrice}
                                        totalPrice={plan.totalPrice || plan.newPrice * plan.players}
                                        discount={plan.discount || plan.calculatedDiscount || 0}
                                        features={defaultFeatures}
                                        onBook={() => openBooking()}
                                        t={t}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Additional Info */}
                {!loading && pricingPlans.length > 0 && (
                    <div className="mt-12 text-center">
                        <div className="bg-[#1a0b2e] border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto">
                            <h4 className="text-white font-bold text-lg mb-2">{t('pricing.note_title')}</h4>
                            <p className="text-gray-400 text-sm">{t('pricing.note_desc')}</p>
                        </div>
                    </div>
                )}

            </div>
        </section>
    );
};

export default PricingSection;
