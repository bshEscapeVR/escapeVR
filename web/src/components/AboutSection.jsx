'use client';

import React from 'react';
import { Trophy, Users, Puzzle, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // לטקסטים הקבועים של האייקונים
import { useSettings } from '../context/SettingsContext'; // לטקסטים הדינמיים

const AboutSection = () => {
    const { t } = useTranslation();
    const { t: tDB, settings, getImg, loading } = useSettings();

    // המאפיינים (אייקונים) נשארים ב-JSON כי הם חלק מהעיצוב הקבוע
    const features = [
        {
            icon: Trophy,
            color: "bg-orange-500",
            title: t('about.feat_victory'), // תוסיפי ל-json אם חסר, או שתשאירי טקסט קבוע
            desc: t('about.desc_victory')
        },
        {
            icon: Users,
            color: "bg-green-500",
            title: t('about.feat_group'),
            desc: t('about.desc_group')
        },
        {
            icon: Puzzle,
            color: "bg-blue-500",
            title: t('about.feat_puzzles'),
            desc: t('about.desc_puzzles')
        },
        {
            icon: Headphones,
            color: "bg-pink-500",
            title: t('about.feat_tech'),
            desc: t('about.desc_tech')
        }
    ];

    return (
        <section className="py-20 relative overflow-hidden">
            {/* רקע שקוף - הגרדיאנט הגלובלי יראה */}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* כותרת ראשית וטקסט מעל הכל (אופציונלי - רק אם קיים בדאטהבייס) */}
                {(tDB(settings?.content?.about?.sectionTitle) || tDB(settings?.content?.about?.sectionDescription)) && (
                    <div className="text-center mb-16">
                        {tDB(settings?.content?.about?.sectionTitle) && (
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 [text-shadow:_0_0_20px_rgba(168,85,247,0.7),_0_0_40px_rgba(168,85,247,0.5)]">
                                {tDB(settings?.content?.about?.sectionTitle)}
                            </h2>
                        )}
                        {tDB(settings?.content?.about?.sectionDescription) && (
                            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed whitespace-pre-line">
                                {tDB(settings?.content?.about?.sectionDescription)}
                            </p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                    {/* תמונה מהניהול */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-neon to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        {loading ? (
                            <div className="relative rounded-2xl w-full h-[400px] bg-white/5 animate-pulse border border-white/10" />
                        ) : (
                            <img
                                src={getImg(settings?.media?.aboutImage)}
                                alt="VR Experience"
                                className="relative rounded-2xl shadow-2xl w-full object-cover h-[400px] border border-white/10"
                            />
                        )}
                    </div>

                    {/* טקסט דינמי מהניהול */}
                    <div className="text-start">
                        {loading ? (
                            <>
                                {/* Skeleton for title */}
                                <div className="h-12 w-3/4 bg-white/10 animate-pulse rounded-lg mb-6" />
                                {/* Skeleton for description */}
                                <div className="space-y-3">
                                    <div className="h-5 w-full bg-white/5 animate-pulse rounded" />
                                    <div className="h-5 w-full bg-white/5 animate-pulse rounded" />
                                    <div className="h-5 w-4/5 bg-white/5 animate-pulse rounded" />
                                    <div className="h-5 w-3/4 bg-white/5 animate-pulse rounded" />
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                                    {tDB(settings?.content?.about?.title) || t('about.title')}
                                </h3>

                                <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                                    {tDB(settings?.content?.about?.description) || t('about.description')}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* גריד אייקונים (נשאר קבוע) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-[#1a0b2e] border border-brand-primary/30 p-6 rounded-2xl flex flex-col items-center text-center hover:border-brand-primary/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all hover:-translate-y-1 shadow-lg group">
                            <div className={`${feature.color} p-4 rounded-full mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                <feature.icon size={32} className="text-white" />
                            </div>
<h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm">{feature.desc}</p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default AboutSection;