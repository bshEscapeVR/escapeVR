'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, Sparkles, DollarSign, CalendarCheck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const WelcomePopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, t: tDB, language } = useSettings();
    const router = useRouter();
    const params = useParams();
    const lang = params?.lang || language || 'he';

    const welcomeSettings = settings?.welcomePopup;
    const isEnabled = welcomeSettings?.enabled;
    const delaySeconds = welcomeSettings?.delaySeconds || 3;
    const title = welcomeSettings?.title;
    const content = welcomeSettings?.content;

    useEffect(() => {
        if (!isEnabled || !title) return;

        // Check if user already saw this popup in this session
        const sessionKey = 'welcomePopupShown';
        if (sessionStorage.getItem(sessionKey)) return;

        const timer = setTimeout(() => {
            setIsOpen(true);
            sessionStorage.setItem(sessionKey, 'true');
        }, delaySeconds * 1000);

        return () => clearTimeout(timer);
    }, [isEnabled, delaySeconds, title]);

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen || !isEnabled) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={handleClose}
            ></div>

            {/* Modal Container - Cyberpunk VR Style */}
            <div className="relative w-full max-w-md animate-fade-in">

                {/* Main Modal */}
                <div className="relative rounded-2xl overflow-hidden
                    bg-gradient-to-b from-[#1a0a2e]/95 via-[#16082a]/95 to-[#0d0515]/95
                    backdrop-blur-xl
                    border border-purple-500/20
                    shadow-[0_0_40px_rgba(168,85,247,0.15),0_0_80px_rgba(168,85,247,0.1)]">

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-30 p-2
                            bg-white/5 hover:bg-white/10
                            rounded-full flex items-center justify-center
                            text-gray-400 hover:text-white transition-all duration-300"
                    >
                        <X size={18} />
                    </button>

                    {/* Decorative top border glow */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-2xl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-400/50 rounded-tr-2xl"></div>

                    {/* Content Section */}
                    <div className="relative pt-10 pb-8 px-8 text-center">
                        {/* Icon */}
                        <div className="relative w-16 h-16 mx-auto mb-5">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 animate-pulse"></div>
                            <div className="absolute inset-2 rounded-full border border-purple-400/30 bg-gradient-to-br from-purple-900/50 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles size={28} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-white mb-4 tracking-wide drop-shadow-[0_0_25px_rgba(168,85,247,0.8)]">
                            {tDB(title)}
                        </h2>

                        {/* Content */}
                        <div className="text-gray-200 text-lg leading-relaxed whitespace-pre-line">
                            {tDB(content)}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex gap-3 mt-6">
                            {/* מחירים */}
                            <button
                                onClick={() => {
                                    handleClose();
                                    router.push(`/${lang}/pricing`);
                                }}
                                className="group relative flex-1 py-3 px-4 rounded-xl overflow-hidden
                                    bg-white/10 border border-white/20
                                    text-white font-bold
                                    hover:bg-white/20
                                    transition-all duration-300 transform active:scale-95
                                    flex items-center justify-center gap-2"
                            >
                                <DollarSign size={18} />
                                <span>{language === 'en' ? 'Prices' : 'מחירים'}</span>
                            </button>

                            {/* הזמן עכשיו */}
                            <button
                                onClick={() => {
                                    handleClose();
                                    router.push(`/${lang}#rooms`);
                                }}
                                className="group relative flex-1 py-3 px-4 rounded-xl overflow-hidden
                                    bg-gradient-to-r from-brand-primary to-purple-600
                                    text-white font-bold
                                    shadow-[0_0_20px_rgba(168,85,247,0.3)]
                                    hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]
                                    hover:brightness-110
                                    transition-all duration-300 transform active:scale-95
                                    flex items-center justify-center gap-2"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                                <CalendarCheck size={18} className="relative z-10" />
                                <span className="relative z-10">{language === 'en' ? 'Book Now' : 'הזמן עכשיו'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Bottom decorative border */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

                    {/* Corner accents bottom */}
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-400/30 rounded-bl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-400/30 rounded-br-2xl"></div>
                </div>
            </div>
        </div>
    );
};

export default WelcomePopup;
