'use client';

import React from 'react';
import { X, Phone, Clock, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useContact } from '../context/ContactContext';
import { useSettings } from '../context/SettingsContext';

const ContactPopup = () => {
    const { isOpen, closeContact } = useContact();
    const { t } = useTranslation();
    const { settings } = useSettings();

    const contactPhone = settings?.general?.contactPhone || "054-8530162";
    // מספר וואטסאפ - אם הוגדר ב-socialLinks נשתמש בו, אחרת נמיר את מספר הטלפון
    const whatsappFromSettings = settings?.general?.socialLinks?.whatsapp;
    const whatsappNumber = whatsappFromSettings || contactPhone.replace(/-/g, '').replace(/^0/, '972');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay with deeper blur */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={closeContact}
            ></div>

            {/* Modal Container - Cyberpunk VR Style */}
            <div className="relative w-full max-w-sm animate-fade-in">

                {/* Main Modal - Glass Panel with Neon Glow */}
                <div className="relative rounded-2xl overflow-hidden
                    bg-gradient-to-b from-[#1a0a2e]/95 via-[#16082a]/95 to-[#0d0515]/95
                    backdrop-blur-xl
                    border border-purple-500/20
                    shadow-[0_0_40px_rgba(168,85,247,0.15),0_0_80px_rgba(168,85,247,0.1)]">

                    {/* Close Button - Inside modal */}
                    <button
                        onClick={closeContact}
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

                    {/* Header Section */}
                    <div className="relative pt-8 pb-6 px-6 text-center">
                        {/* Glowing VR Icon */}
                        <div className="relative w-20 h-20 mx-auto mb-5">
                            {/* Outer glow ring */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 animate-pulse"></div>
                            {/* Inner ring */}
                            <div className="absolute inset-2 rounded-full border border-purple-400/30 bg-gradient-to-br from-purple-900/50 to-transparent"></div>
                            {/* Icon container */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <Headphones size={36} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                    {/* Small pulse dot */}
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
                            {t('contact_popup.title')}
                        </h2>

                        {/* Subtitle */}
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {t('contact_popup.subtitle')}
                        </p>
                    </div>

                    {/* Content Section */}
                    <div className="px-6 pb-6 space-y-4">

                        {/* Primary CTA - Call Now Button (NeonButton style) */}
                        <a
                            href={`tel:${contactPhone}`}
                            className="group relative block w-full py-4 px-6 rounded-xl overflow-hidden
                                bg-gradient-to-r from-brand-primary to-purple-600
                                text-white font-bold
                                shadow-[0_0_20px_rgba(168,85,247,0.3)]
                                hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]
                                hover:brightness-110
                                transition-all duration-300 transform active:scale-95"
                        >
                            {/* Shine effect on hover */}
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>

                            <div className="relative z-10 flex items-center justify-center gap-3">
                                <Phone size={22} className="text-white" />
                                <div className="text-center">
                                    <div className="text-white font-bold text-lg">
                                        {t('contact_popup.call_now')}
                                    </div>
                                    <div className="text-white/80 font-medium text-base" dir="ltr">
                                        {contactPhone}
                                    </div>
                                </div>
                            </div>
                        </a>

                        {/* Secondary - WhatsApp Ghost Button */}
                        <a
                            href={`https://wa.me/${whatsappNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center justify-center gap-3 p-4
                                bg-white/5 hover:bg-white/10
                                border border-purple-500/30 hover:border-green-500/50
                                rounded-xl transition-all duration-300
                                hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                        >
                            <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center
                                group-hover:bg-green-500/25 transition-colors border border-green-500/30">
                                <svg className="text-green-400 w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                            </div>
                            <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
                                {t('contact_popup.whatsapp')}
                            </span>
                        </a>

                    </div>

                    {/* Footer - Minimal */}
                    <div className="px-6 pb-5">
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                            <Clock size={12} className="text-cyan-500/70" />
                            <span>{t('contact_popup.response_time')}</span>
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

export default ContactPopup;
