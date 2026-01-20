'use client';

import React from 'react';
import { MapPin, Bus, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import SectionTitle from './ui/SectionTitle';

// Waze Icon SVG
const WazeIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20.54 6.63C19.69 4.04 17.14 2 13.86 2c-3.29 0-6.18 2.03-7.21 4.96-.15.33-.15.71-.15 1.04 0 2.96 2.14 5.39 4.93 5.96.29.04.58.08.86.08 1.11 0 2.14-.33 3-.96.29.25.58.46.86.71.72.54 1.57.96 2.57 1.04.14 0 .29.04.43.04 1.86 0 3.43-1.17 4-2.88.14-.33.14-.67.14-1 .04-1.67-.71-3.21-2.14-4.32zm-12.54 3.87c-.71 0-1.29-.58-1.29-1.29s.58-1.29 1.29-1.29 1.29.58 1.29 1.29-.58 1.29-1.29 1.29zm5.71 0c-.71 0-1.29-.58-1.29-1.29s.58-1.29 1.29-1.29 1.29.58 1.29 1.29-.58 1.29-1.29 1.29z"/>
        <path d="M12 22c-1.43 0-2.79-.29-4.04-.79-.14-.04-.29-.08-.43-.17l-3.04 1.04 1.04-3.04c-.08-.14-.12-.29-.17-.43C4.29 17.36 4 16 4 14.57c0-1.29.25-2.5.71-3.64.14.17.29.33.43.5.43.5.93.92 1.5 1.29-.29.58-.43 1.21-.43 1.86 0 2.71 2.21 4.93 4.93 4.93.64 0 1.29-.12 1.86-.43.36.54.79 1.07 1.29 1.5.17.14.33.29.5.43-1.07.42-2.28.67-3.57.67l-.22.32z"/>
    </svg>
);

// Google Maps Icon SVG (colorful)
const GoogleMapsIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
        <path fill="#48b564" d="M35.76 26.36h.01c.73-1.31 1.3-2.63 1.68-3.89.38-1.27.55-2.44.55-3.45 0-1.23-.25-2.47-.75-3.68-.5-1.21-1.25-2.35-2.22-3.32a10.8 10.8 0 0 0-3.32-2.22 10.16 10.16 0 0 0-3.68-.75c-1.72 0-3.37.42-4.87 1.12v.01c-1.46.68-2.77 1.64-3.86 2.79l-.02.02c-1.09 1.15-1.96 2.52-2.55 4.01l-.03.07c-.59 1.52-.89 3.17-.89 4.92 0 1.76.31 3.42.91 4.96l.02.05c.6 1.52 1.47 2.9 2.57 4.06l9.43 10.68.02.02c.2.23.52.34.83.3.31-.04.58-.23.72-.51l6.44-15.17z"/>
        <path fill="#fcc60e" d="M28.15 19.86c0 2.27-1.84 4.11-4.12 4.11-2.27 0-4.11-1.84-4.11-4.11 0-2.27 1.84-4.11 4.11-4.11 2.28 0 4.12 1.84 4.12 4.11z"/>
        <path fill="#2c85eb" d="m13.59 35.59-.03-.05a14.59 14.59 0 0 1-2.12-7.63c0-1.13.13-2.25.38-3.33l-7.84 10.21c-.23.3-.23.71 0 1.01l8.62 11.44c.24.32.69.42 1.04.22.35-.2.5-.61.36-.98l-4.41-10.89z"/>
        <path fill="#ed5748" d="m24.03 3c-4.14 0-8.06 1.61-11 4.53l-.03.03c-1.27 1.26-2.32 2.69-3.14 4.26l-.02.04a15.43 15.43 0 0 0-1.88 7.3c0 2.74.68 5.32 1.88 7.51l.02.03 7.84-10.21c.01-.01.01-.02.02-.03.44-1.21 1.12-2.3 1.98-3.2l.02-.02c.9-.94 1.97-1.69 3.14-2.19l.01-.01c1.21-.53 2.53-.8 3.88-.8 1.12 0 2.2.18 3.2.53l5.42-7.06a14.85 14.85 0 0 0-11.34-4.71z"/>
        <path fill="#5695f6" d="M37.99 19.02c0 .87-.14 1.79-.44 2.81-.29 1.02-.75 2.09-1.36 3.18l-.01.02-6.44 15.17c-.08.19-.18.36-.31.51l5.53 7.2c.29.38.84.47 1.24.21.21-.13.35-.34.4-.57l6.07-25.4c.06-.23.02-.48-.11-.69-.13-.2-.33-.35-.57-.4a6.9 6.9 0 0 0-4-.04z"/>
    </svg>
);

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

    // חיפוש לפי כתובת מדויקת
    const address = "נחל ניצנים 8, בית שמש";
    const encodedAddress = encodeURIComponent(address);

    const mapSrc = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=17&ie=UTF8&iwloc=B&hl=${mapLang}&output=embed`;

    const wazeLink = "https://waze.com/ul?q=Nahal+Nitzanim+8+Beit+Shemesh&navigate=yes";
    const googleMapsLink = "https://www.google.com/maps/dir/?api=1&destination=Nahal+Nitzanim+8+Beit+Shemesh";

    return (
        <section className="py-20  relative">
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

                        <div className="h-[400px] w-full bg-gray-200 relative group">
                             <iframe
                                key={language} // יגרום לרענון כשהשפה הבטוחה משתנה
                                src={mapSrc}
                                width="100%"
                                height="100%"
                                style={{border:0}}
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
                                <a href={wazeLink} target="_blank" rel="noreferrer" className="flex-1 bg-[#33ccff] hover:bg-[#00a1df] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                                    <WazeIcon size={22} />
                                    Waze
                                </a>
                                <a href={googleMapsLink} target="_blank" rel="noreferrer" className="flex-1 bg-[#4285F4] hover:bg-[#3367D6] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                                    <GoogleMapsIcon size={22} />
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