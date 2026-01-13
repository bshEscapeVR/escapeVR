'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Users, Zap, ArrowRight, CalendarCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useContact } from '../../../../../context/ContactContext';
import { useSettings } from '../../../../../context/SettingsContext';
import NeonButton from '../../../../../components/ui/NeonButton';
import BookingPageSkeleton from '../../../../../components/ui/BookingPageSkeleton';

import Footer from '../../../../../components/Footer';
import { roomService } from '../../../../../services';

const InfoCard = ({ icon, title, subtitle }) => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all duration-300 group hover:border-brand-primary/30">
        <div className="mb-2 transform group-hover:scale-110 transition-transform bg-black/20 p-2 rounded-full">{icon}</div>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{title}</div>
        <div className="text-base font-bold text-white">{subtitle}</div>
    </div>
);

export default function BookingPage() {
    const params = useParams();
    const roomId = params.roomId;
    const lang = params.lang || 'he';
    const router = useRouter();
    const { openContact } = useContact();

    const { t } = useTranslation();
    const { t: tDB, getImg } = useSettings();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const data = await roomService.getById(roomId);
                setRoom(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (roomId) {
            fetchRoom();
        }
    }, [roomId]);

    if (loading) return (
        <div className="min-h-screen bg-brand-dark">
            <BookingPageSkeleton />
        </div>
    );

    if (!room) return (
        <div className="min-h-screen bg-brand-dark">
            <div className="text-white text-center pt-32 text-2xl">{t('booking_page.not_found')}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-dark text-brand-text font-sans selection:bg-brand-neon selection:text-white">
            <div className="min-h-screen bg-brand-dark text-white pt-24 px-4 pb-20 relative overflow-hidden">

                {/* Background image */}
                <div className="absolute inset-0 z-0">
                    <img src={getImg(room.images?.main)} className="w-full h-full object-cover opacity-20 blur-sm" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-brand-dark/95 to-brand-dark"></div>
                </div>

                <div className="max-w-6xl mx-auto relative z-10">

                    {/* Back button */}
                    <button
                        onClick={() => router.push(`/${lang}#rooms`)}
                        className="flex items-center gap-2 text-gray-400 hover:text-brand-primary mb-8 transition-colors group"
                    >
                        <ArrowRight
                            size={20}
                            className="transform rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform"
                        />
                        {t('booking_page.back_btn')}
                    </button>

                    <div className="glass-panel rounded-3xl p-8 md:p-12 mb-16 relative overflow-hidden">
                        {/* Glow Effect Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 blur-[100px] rounded-full pointer-events-none"></div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">

                            {/* Image + Info Cards */}
                            <div className="space-y-4">
                                {/* Room Image */}
                                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                    <img
                                        src={getImg(room.images?.main)}
                                        alt={tDB(room.title)}
                                        className="w-full h-72 md:h-96 object-cover"
                                    />
                                </div>

                                {/* Info cards - 3 cards in a row (smaller/rectangular) */}
                                <div className="grid grid-cols-3 gap-3">
                                    <InfoCard
                                        icon={<Zap size={20} className="text-yellow-400" />}
                                        title={t('booking_page.difficulty')}
                                        subtitle={`${room.features?.difficultyLevel}/5`}
                                    />
                                    <InfoCard
                                        icon={<Clock size={20} className="text-brand-secondary" />}
                                        title={t('booking_page.duration')}
                                        subtitle={`${room.features?.durationMinutes} ${t('booking_page.min_suffix')}`}
                                    />
                                    <InfoCard
                                        icon={<Users size={20} className="text-brand-primary" />}
                                        title={t('booking_page.players')}
                                        subtitle={`${room.features?.minPlayers}-${room.features?.maxPlayers}`}
                                    />
                                </div>
                            </div>

                            {/* Text + Button */}
                            <div className="space-y-6 text-start flex flex-col h-full">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                                        {tDB(room.title)}
                                    </h1>
                                    <h2 className="text-xl text-brand-primary font-medium tracking-wide">
                                        {tDB(room.subtitle)}
                                    </h2>
                                </div>

                                <p className="text-lg text-gray-300 leading-relaxed font-light flex-grow">
                                    {tDB(room.description)}
                                </p>

                                {/* CTA Button - at the bottom of text column */}
                                <NeonButton
                                    onClick={() => openContact()}
                                    variant="primary"
                                    icon={CalendarCheck}
                                    className="text-lg py-4 px-8 w-full mt-auto"
                                >
                                    {t('booking_page.book_now')}
                                </NeonButton>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <Footer />
        </div>
    );
}
