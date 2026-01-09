'use client';

import React from 'react';
import { X, Phone, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useContact } from '../context/ContactContext';
import { useSettings } from '../context/SettingsContext';

const ContactPopup = () => {
    const { isOpen, closeContact } = useContact();
    const { t } = useTranslation();
    const { settings } = useSettings();

    // שליפת נתונים דינמיים עם פולבק
    const contactPhone = settings?.general?.contactPhone || "054-8530162";
    const whatsappNumber = contactPhone.replace(/-/g, '').replace(/^0/, '972');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={closeContact}
            ></div>

            {/* Modal */}
            <div className="glass-panel relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in">

                {/* כפתור סגירה */}
                <button
                    onClick={closeContact}
                    className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20 p-2 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-cyan-500 p-6 text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Phone className="text-white" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {t('contact_popup.title')}
                    </h2>
                    <p className="text-white/90 text-sm">
                        {t('contact_popup.subtitle')}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 bg-brand-card space-y-4">

                    {/* טלפון - הכי דומיננטי */}
                    <a
                        href={`tel:${contactPhone}`}
                        className="block p-5 bg-brand-primary hover:bg-purple-600 rounded-xl transition-all group shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 hover:scale-[1.02]"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Phone className="text-white" size={28} />
                            <div className="text-center">
                                <div className="text-white font-bold text-xl">{t('contact_popup.call_now')}</div>
                                <div className="text-white/90 font-medium text-lg" dir="ltr">{contactPhone}</div>
                            </div>
                        </div>
                    </a>

                    {/* וואטסאפ - פחות דומיננטי */}
                    <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-xl transition-all group"
                    >
                        <svg className="text-green-500 w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="text-gray-300 text-sm">{t('contact_popup.whatsapp')}</span>
                    </a>

                </div>

                {/* Footer */}
                <div className="bg-black/30 p-4 text-center border-t border-white/5">
                    <p className="text-gray-400 text-xs flex items-center justify-center gap-2">
                        <Clock size={14} />
                        {t('contact_popup.response_time')}
                    </p>
                </div>

            </div>
        </div>
    );
};

export default ContactPopup;
