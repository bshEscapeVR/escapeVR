'use client';

import React from 'react';
import { Trophy, Users, Puzzle, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // לטקסטים הקבועים של האייקונים
import { useSettings } from '../context/SettingsContext'; // לטקסטים הדינמיים

const AboutSection = () => {
    const { t } = useTranslation();
    const { t: tDB, settings, getImg } = useSettings();

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
            <div className="absolute inset-0 bg-[#160a25] z-0"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                    {/* תמונה מהניהול */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-neon to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <img
                            src={getImg(settings?.media?.aboutImage)}
                            alt="VR Experience"
                            className="relative rounded-2xl shadow-2xl w-full object-cover h-[400px] border border-white/10"
                        />
                    </div>

                    {/* טקסט דינמי מהניהול */}
                    <div className="text-start">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            {/* 👇 כותרת מהדאטה-בייס */}
                            {tDB(settings?.content?.about?.title) || "עתיד חדרי הבריחה"}
                        </h2>
                        
                        {/* 👇 תיאור מהדאטה-בייס (מאפשר ירידת שורה) */}
                        <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                            {tDB(settings?.content?.about?.description) || "תיאור ברירת מחדל..."}
                        </div>
                    </div>
                </div>

                {/* גריד אייקונים (נשאר קבוע) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-[#1a0b2e] border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center hover:border-brand-primary/30 transition-all hover:-translate-y-1 shadow-lg group">
                            <div className={`${feature.color} p-4 rounded-full mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                <feature.icon size={32} className="text-white" />
                            </div>
                            {/* הערה: אם לא הוספת את המפתחות ל-JSON, את יכולה להחזיר פה טקסט קבוע זמנית */}
                            <h3 className="text-white font-bold text-lg mb-2">{feature.title || "כותרת"}</h3>
                            <p className="text-gray-400 text-sm">{feature.desc || "תיאור קצר..."}</p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default AboutSection;