'use client';

import React from 'react';
import { MapPin, Bus, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext'; 
import SectionTitle from './ui/SectionTitle';

const LocationSection = () => {
    const { t } = useTranslation();
    
    // מקבלים את language שכבר מטופל ובטוח לשימוש (לא יגרום לשגיאות)
    const { language, settings, t: tDB } = useSettings(); 

    // 1. הגדרת שפה למפה
    const mapLang = language === 'he' ? 'iw' : 'en';
    
    // 2. שם המקום שיופיע על הנעץ
    const placeName = language === 'he' 
        ? (tDB(settings?.general?.siteName) || "חדר בריחה VR") 
        : "VR Escape Reality";

    const lat = "31.745486";
    const long = "34.986872";

    const mapSrc = `https://maps.google.com/maps?q=${lat},${long}+(${placeName})&t=&z=17&ie=UTF8&iwloc=B&hl=${mapLang}&output=embed`;

    const wazeLink = "https://waze.com/ul?q=Nahal+Nitzanim+8+Beit+Shemesh&navigate=yes";
    const googleMapsLink = "https://www.google.com/maps/dir/?api=1&destination=Nahal+Nitzanim+8+Beit+Shemesh";

    return (
        <section className="py-20 bg-brand-dark relative">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionTitle title={t('location.title')} subtitle="" />

                <div className="glass-panel p-2 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                    <div className="bg-[#1a0b2e] rounded-2xl overflow-hidden">
                        
                        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-[#25103a] gap-4 text-center md:text-start">
                            <h3 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                                <MapPin className="text-green-400" />
                                {t('location.inner_title')}
                            </h3>
                            <div className="text-center md:text-end">
                                <p className="text-white font-bold text-sm">{t('location.label_address')}</p>
                                <p className="text-gray-300 text-sm">{t('location.value_address')}</p>
                            </div>
                        </div>

                        <div className="h-[400px] w-full bg-gray-800 relative group">
                             <iframe 
                                key={language} // יגרום לרענון כשהשפה הבטוחה משתנה
                                src={mapSrc} 
                                width="100%" 
                                height="100%" 
                                style={{border:0, filter: 'invert(90%) hue-rotate(180deg) contrast(90%)'}} 
                                allowFullScreen="" 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Google Maps Location"
                            ></iframe>
                        </div>

                        <div className="p-8 bg-[#150822]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-start">
                                <div>
                                    <h4 className="text-brand-secondary font-bold flex items-center gap-2 mb-2">
                                        <Bus size={18} /> {t('location.label_transport')}
                                    </h4>
                                    <p className="text-gray-400 text-sm">{t('location.value_transport')}</p>
                                </div>
                                <div>
                                    <h4 className="text-green-400 font-bold flex items-center gap-2 mb-2">
                                        <Car size={18} /> {t('location.label_parking')}
                                    </h4>
                                    <p className="text-gray-400 text-sm">{t('location.value_parking')}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href={wazeLink} target="_blank" rel="noreferrer" className="flex-1 bg-[#00a1df] hover:bg-[#0086ba] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                                    Waze
                                </a>
                                <a href={googleMapsLink} target="_blank" rel="noreferrer" className="flex-1 bg-[#0f766e] hover:bg-teal-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-500/20">
                                    <MapPin size={20} />
                                    Google Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LocationSection;