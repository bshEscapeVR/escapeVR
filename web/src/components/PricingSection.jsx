'use client';

import React from 'react';
import { Users, Tag, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../context/BookingContext';
import SectionTitle from './ui/SectionTitle';

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
            <div className="flex justify-center mb-4">
                <div className="bg-black/50 border border-emerald-500/50 rounded-full px-4 py-1.5 flex items-center gap-2">
                    <Tag size={14} className="text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-bold">{discount}% {t('pricing.discount')}</span>
                </div>
            </div>

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

    const features = [
        t('pricing.feature_1'),
        t('pricing.feature_2'),
        t('pricing.feature_3')
    ];

    const pricingPlans = [
        { players: 2, oldPrice: 150, newPrice: 132, totalPrice: 264, discount: 12 },
        { players: 3, oldPrice: 135, newPrice: 119, totalPrice: 357, discount: 12 },
        { players: 4, oldPrice: 125, newPrice: 110, totalPrice: 440, discount: 12 },
        { players: 5, oldPrice: 115, newPrice: 101, totalPrice: 505, discount: 12 },
        { players: 6, oldPrice: 105, newPrice: 92, totalPrice: 552, discount: 12 }
    ];

    return (
        <section className="py-20 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <SectionTitle
                    title={t('pricing.title')}
                    subtitle={t('pricing.subtitle')}
                />

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {pricingPlans.slice(0, 3).map((plan) => (
                        <PricingCard
                            key={plan.players}
                            {...plan}
                            features={features}
                            onBook={() => openBooking()}
                            t={t}
                        />
                    ))}
                </div>

                {/* Additional Plans Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {pricingPlans.slice(3).map((plan) => (
                        <PricingCard
                            key={plan.players}
                            {...plan}
                            features={features}
                            onBook={() => openBooking()}
                            t={t}
                        />
                    ))}
                </div>

                {/* Additional Info */}
                <div className="mt-12 text-center">
                    <div className="bg-[#1a0b2e] border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto">
                        <h4 className="text-white font-bold text-lg mb-2">{t('pricing.note_title')}</h4>
                        <p className="text-gray-400 text-sm">{t('pricing.note_desc')}</p>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default PricingSection;
