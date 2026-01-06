'use client';

import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Phone, Mail, MapPin } from 'lucide-react'; // הוספתי אייקונים של טיקטוק/וואטסאפ אם צריך
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBooking } from '../context/BookingContext';

const Footer = () => {
    const { t } = useTranslation();
    const { settings, getImg, t: tDB, loading, language } = useSettings();
    const { openBooking } = useBooking();
    const currentYear = new Date().getFullYear();

    // שליפת נתונים דינמיים עם פולבק ל-JSON
    const contactPhone = settings?.general?.contactPhone || "054-8530162";
    const contactEmail = settings?.general?.contactEmail || "escapevr.bsh@gmail.com";
    const address = tDB(settings?.general?.contactAddress) || t('footer.address');
    const siteName = tDB(settings?.general?.siteName) || t('footer.site_name');

    const social = settings?.general?.socialLinks || {};

    return (
        <footer className="bg-[#0a0310] border-t border-white/5 text-gray-400 pt-16 pb-8 text-start">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    
                    {/* עמודה 1 */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            {loading ? (
                                <div className="h-8 w-32 bg-white/10 animate-pulse rounded" />
                            ) : (
                                <>
                                    {settings?.general?.logoUrl ? (
                                        <img src={getImg(settings.general.logoUrl)} alt="Logo" className="h-8 w-auto object-contain" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-brand-neon flex items-center justify-center">
                                            <span className="font-bold text-white text-xs">VR</span>
                                        </div>
                                    )}
                                    <span className="text-white font-bold text-lg tracking-wider">
                                        {siteName}
                                    </span>
                                </>
                            )}
                        </div>
                        
                        <p className="text-sm leading-relaxed mb-6">
                            {t('footer.about')}
                        </p>
                        
                        {/* אייקונים חברתיים דינמיים */}
                        <div className="flex gap-4">
                            {social.facebook && (
                                <a href={social.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Facebook size={18} /></a>
                            )}
                            {social.instagram && (
                                <a href={social.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all"><Instagram size={18} /></a>
                            )}
                            {/* אפשר להוסיף טיקטוק וכדומה */}
                        </div>
                    </div>

                    {/* עמודה 2 - קישורים מהירים */}
                    <div>
                        <h3 className="text-white font-bold mb-6">{t('footer.quick_links')}</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href={`/${language}`} className="hover:text-brand-primary transition-colors">{t('footer.link_home')}</Link></li>
                            <li><a href="#rooms" className="hover:text-brand-primary transition-colors">{t('footer.link_rooms')}</a></li>
                            <li><button onClick={() => openBooking()} className="hover:text-brand-primary transition-colors">{t('footer.link_book')}</button></li>
                            <li><Link href={`/${language}/contact`} className="hover:text-brand-primary transition-colors">{t('footer.link_contact')}</Link></li>
                        </ul>
                    </div>

                    {/* עמודה 3 - חדרים */}
                    <div>
                        <h3 className="text-white font-bold mb-6">{t('footer.rooms_title')}</h3>
                        <ul className="space-y-3 text-sm">
                             <li><span className="hover:text-white transition-colors cursor-pointer">{t('footer.room_1')}</span></li>
                             <li><span className="hover:text-white transition-colors cursor-pointer">{t('footer.room_2')}</span></li>
                             <li><span className="hover:text-white transition-colors cursor-pointer">{t('footer.room_3')}</span></li>
                        </ul>
                    </div>

                    {/* עמודה 4 - יצירת קשר דינמית */}
                    <div>
                        <h3 className="text-white font-bold mb-6">{t('footer.contact_title')}</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-brand-secondary mt-0.5" />
                                <span>{address}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-brand-secondary" />
                                <span dir="ltr" className="hover:text-white transition-colors">
                                    {contactPhone}
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-brand-secondary" />
                                <span>{contactEmail}</span>
                            </li>
                        </ul>
                    </div>

                </div>

                <div className="border-t border-white/5 pt-8 text-center text-xs">
                    <p>© {currentYear} {siteName}. {t('footer.rights')}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;