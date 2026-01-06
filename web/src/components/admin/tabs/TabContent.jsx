'use client';

import React from 'react';
import BilingualInput from '../../../components/admin/ui/BilingualInput';
import { Layout, Info, Phone, MapPin, Grid3X3 } from 'lucide-react';

// רכיב Input פשוט לשדות שאינם דו-לשוניים (כמו טלפון/מייל)
const SimpleInput = ({ label, value, onChange, dir = "ltr" }) => (
    <div className="mb-4">
        <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">{label}</label>
        <input 
            type="text" 
            dir={dir}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-brand-primary outline-none transition-colors"
        />
    </div>
);

const TabContent = ({ settings, update }) => {
    
    // עדכון תוכן (content)
    const handleContentChange = (section, key, newValue) => {
        const updatedContent = { ...settings.content };
        if (!updatedContent[section]) updatedContent[section] = {};
        updatedContent[section][key] = newValue;
        update('content', updatedContent);
    };

    // עדכון הגדרות כלליות (general) - לטלפון ומייל
    const handleGeneralChange = (key, newValue) => {
        const updatedGeneral = { ...settings.general, [key]: newValue };
        update('general', updatedGeneral);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            
            {/* --- 1. HERO SECTION --- */}
            <div className="bg-[#1a0b2e]/50 border border-white/10 p-4 md:p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/5">
                    <Layout className="text-brand-secondary" size={24} />
                    מסך פתיחה (Hero)
                </h3>
                
                <div className="space-y-4">
                    <BilingualInput 
                        label="כותרת ראשית"
                        value={settings.content?.hero?.title}
                        onChange={(val) => handleContentChange('hero', 'title', val)}
                        placeholder="BEYOND REALITY"
                    />
                    
                    <BilingualInput
                        label="כותרת משנה"
                        value={settings.content?.hero?.subtitle}
                        onChange={(val) => handleContentChange('hero', 'subtitle', val)}
                    />

                    <BilingualInput
                        label="תיאור ארוך (אופציונלי - מוצג מתחת לכותרות)"
                        value={settings.content?.hero?.description}
                        onChange={(val) => handleContentChange('hero', 'description', val)}
                        isTextArea
                        placeholder="השאר ריק אם לא רוצה להציג תיאור ארוך..."
                    />

                    <BilingualInput
                        label="טקסט כפתור (הנעה לפעולה)"
                        value={settings.content?.hero?.ctaButton}
                        onChange={(val) => handleContentChange('hero', 'ctaButton', val)}
                    />
                </div>
            </div>

            {/* --- 2. ABOUT SECTION --- */}
            <div className="bg-[#1a0b2e]/50 border border-white/10 p-4 md:p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/5">
                    <Info className="text-green-400" size={24} />
                    אודות החוויה
                </h3>

                <div className="space-y-4">
                    <BilingualInput
                        label="כותרת אזור אודות"
                        value={settings.content?.about?.title}
                        onChange={(val) => handleContentChange('about', 'title', val)}
                        placeholder="עתיד חדרי הבריחה"
                    />

                    <BilingualInput
                        label="תוכן האודות (פסקה מלאה)"
                        value={settings.content?.about?.description}
                        onChange={(val) => handleContentChange('about', 'description', val)}
                        isTextArea
                        placeholder="הסבר על החוויה..."
                    />
                </div>
            </div>

            {/* --- 3. ROOMS SECTION --- */}
            <div className="bg-[#1a0b2e]/50 border border-white/10 p-4 md:p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/5">
                    <Grid3X3 className="text-brand-primary" size={24} />
                    אזור החדרים (Rooms)
                </h3>

                <div className="space-y-4">
                    <BilingualInput
                        label="כותרת אזור החדרים"
                        value={settings.content?.rooms?.title}
                        onChange={(val) => handleContentChange('rooms', 'title', val)}
                        placeholder="בחרו את ההרפתקה שלכם"
                    />

                    <BilingualInput
                        label="תת כותרת"
                        value={settings.content?.rooms?.subtitle}
                        onChange={(val) => handleContentChange('rooms', 'subtitle', val)}
                        placeholder="שלושה עולמות ייחודיים, שלושה אתגרים בלתי נשכחים"
                    />
                </div>
            </div>

            {/* --- 4. CONTACT INFO --- */}
            <div className="bg-[#1a0b2e]/50 border border-white/10 p-4 md:p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/5">
                    <Phone className="text-brand-primary" size={24} />
                    פרטי קשר וכותרות
                </h3>
                
                {/* כותרות העמוד */}
                <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">כותרות עמוד צור קשר</h4>
                    <BilingualInput 
                        label="כותרת ראשית לעמוד"
                        value={settings.content?.contact?.title}
                        onChange={(val) => handleContentChange('contact', 'title', val)}
                        placeholder="צור קשר וביקורות"
                    />
                    <BilingualInput 
                        label="תת כותרת"
                        value={settings.content?.contact?.subtitle}
                        onChange={(val) => handleContentChange('contact', 'subtitle', val)}
                    />
                </div>

                {/* פרטים טכניים (טלפון, מייל, כתובת) */}
                <div className="border-t border-white/5 pt-6">
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                        <MapPin size={14}/> נתונים טכניים (מופיעים באתר ובפוטר)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SimpleInput 
                            label="מספר טלפון"
                            value={settings.general?.contactPhone}
                            onChange={(val) => handleGeneralChange('contactPhone', val)}
                        />
                        <SimpleInput 
                            label="כתובת אימייל"
                            value={settings.general?.contactEmail}
                            onChange={(val) => handleGeneralChange('contactEmail', val)}
                        />
                        <SimpleInput 
                            label="מספר לוואטסאפ (פורמט בינלאומי: 97254...)"
                            value={settings.general?.contactWhatsapp}
                            onChange={(val) => handleGeneralChange('contactWhatsapp', val)}
                        />
                        {/* כאן אפשר להוסיף קישורי סושיאל אם רוצים */}
                    </div>

                    <div className="mt-4">
                        <BilingualInput 
                            label="כתובת העסק (טקסט)"
                            value={settings.general?.contactAddress}
                            onChange={(val) => handleGeneralChange('contactAddress', val)}
                            placeholder="נחל ניצנים 8, בית שמש"
                        />
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default TabContent;