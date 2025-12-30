'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Users, ArrowRight, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next'; // 👈 עבור ה-JSON
import { useSettings } from '../context/SettingsContext'; // 👈 עבור ה-DB
import NeonButton from './ui/NeonButton';
import SectionTitle from './ui/SectionTitle';
import RoomSkeleton from './ui/RoomSkeleton';
import roomService from '../services/room.service';

const RoomsGrid = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    
    // t = תרגום סטטי מה-JSON
    const { t } = useTranslation();
    
    // tDB = תרגום דינמי מהמסד נתונים (שיניתי את השם כדי לא להתנגש)
    const { t: tDB, getImg, language, settings, loading: settingsLoading } = useSettings();

    useEffect(() => {
        const fetchRooms = async () => {
            try {
            
                const data = await roomService.getAll();
                setRooms(data);
            } catch (err) {
                console.error("Error loading rooms:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    // Combined loading state: rooms or settings
    const isLoading = loading || settingsLoading;

    // Get title/subtitle from DB with JSON fallback
    const sectionTitle = tDB(settings?.content?.rooms?.title) || t('rooms_grid.title');
    const sectionSubtitle = tDB(settings?.content?.rooms?.subtitle) || t('rooms_grid.subtitle');

    if (isLoading) {
        return (
            <section id="rooms" className="py-20 bg-brand-dark relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/hex-pattern.svg')] opacity-5 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Skeleton for section title */}
                    <div className="text-center mb-12">
                        <div className="h-10 w-64 mx-auto bg-white/10 animate-pulse rounded-lg mb-4" />
                        <div className="h-5 w-96 max-w-full mx-auto bg-white/5 animate-pulse rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <RoomSkeleton />
                        <RoomSkeleton />
                        <RoomSkeleton />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="rooms" className="py-20 bg-brand-dark relative overflow-hidden">
            {/* רקע דקורטיבי עדין */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/hex-pattern.svg')] opacity-5 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <SectionTitle
                    title={sectionTitle}
                    subtitle={sectionSubtitle}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {rooms.map((room) => (
                        <div key={room._id} className="glass-panel rounded-2xl overflow-hidden glass-card-hover group flex flex-col h-full">

                            {/* Image Container */}
                            <div className="h-64 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-transparent z-10 opacity-80"></div>
                                <img
                                    src={getImg(room.images?.main)}
                                    alt={tDB(room.title)}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />

                                {/* Badges */}
                                <div className="absolute bottom-4 right-4 z-20 flex flex-wrap gap-2 rtl:right-auto rtl:left-4">
                                    <span className="bg-black/60 backdrop-blur-md text-brand-text text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
                                        <Clock size={12} className="text-brand-secondary" /> {room.features.durationMinutes} {t('rooms_grid.duration_unit')}
                                    </span>
                                    <span className="bg-black/60 backdrop-blur-md text-brand-text text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
                                        <Users size={12} className="text-brand-primary" /> {room.features.minPlayers}-{room.features.maxPlayers}
                                    </span>
                                    {room.features.difficultyLevel >= 4 && (
                                        <span className="bg-red-500/80 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-red-500/20">
                                            <Zap size={12} fill="currentColor" /> {t('rooms_grid.difficulty_hard')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex flex-col flex-grow text-start">
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-brand-primary transition-colors">
                                    {tDB(room.title)}
                                </h3>
                                <p className="text-brand-muted text-sm mb-6 line-clamp-3 flex-grow leading-relaxed">
                                    {tDB(room.description)}
                                </p>

                                <NeonButton
                                    onClick={() => router.push(`/${language}/book/${room._id}`)}
                                    variant="outline"
                                    fullWidth
                                    icon={ArrowRight}
                                >
                                    {t('rooms_grid.book_btn')}
                                </NeonButton>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RoomsGrid;