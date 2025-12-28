'use client';

import React from 'react';
import ImageUploader from '../../../components/admin/ui/ImageUploader';
import BilingualInput from '../../../components/admin/ui/BilingualInput';

const TabImages = ({ settings, update }) => {
    
    const handleImageUpdate = (section, key, newUrl) => {
        const updatedSection = { ...settings[section], [key]: newUrl };
        update(section, updatedSection);
    };

    const handleBannerText = (val) => {
        update('general', { ...settings.general, bannerText: val });
    };

    return (
        <div className="grid grid-cols-1 gap-8 animate-fade-in">
            
            {/* --- באנר עליון --- */}
            <div className="bg-[#1a0b2e] p-6 rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-white text-lg">באנר עליון</h3>
                        <p className="text-gray-400 text-sm">פס הודעה שמופיע בראש האתר</p>
                    </div>
                    <button 
                        onClick={() => update('general', { ...settings.general, showBanner: !settings.general.showBanner })}
                        className={`w-14 h-7 rounded-full relative transition-colors duration-300 ${settings.general?.showBanner ? 'bg-brand-primary' : 'bg-gray-700'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 ${settings.general?.showBanner ? 'left-1' : 'right-1'}`}></div>
                    </button>
                </div>
                
                {settings.general?.showBanner && (
                    <BilingualInput 
                        label="טקסט הבאנר"
                        value={settings.general?.bannerText}
                        onChange={handleBannerText}
                    />
                )}
            </div>

            {/* --- תמונות האתר --- */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">ניהול תמונות כלליות</h3>
                
                {/* תמונת Hero */}
                <ImageUploader 
                    title="תמונת רקע ראשית (Hero)" 
                    description="התמונה הגדולה בעמוד הבית (מומלץ 1920x1080)" 
                    imageUrl={settings.media?.heroImage} 
                    onUpload={(url) => handleImageUpdate('media', 'heroImage', url)}
                    isWide 
                />

                {/* תמונת אודות - חדש! */}
                <ImageUploader 
                    title="תמונת אודות (איש VR)" 
                    description="התמונה המופיעה לצד טקסט 'עתיד חדרי הבריחה' (מומלץ 800x600)" 
                    imageUrl={settings.media?.aboutImage} 
                    onUpload={(url) => handleImageUpdate('media', 'aboutImage', url)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* לוגו */}
                    <ImageUploader 
                        title="לוגו האתר" 
                        description="מופיע בתפריט העליון ובפוטר (PNG שקוף)" 
                        imageUrl={settings.general?.logoUrl}
                        onUpload={(url) => handleImageUpdate('general', 'logoUrl', url)}
                    />
                    {/* Favicon */}
                    <ImageUploader 
                        title="Favicon" 
                        description="האייקון הקטן בלשונית הדפדפן (32x32)" 
                        imageUrl={settings.general?.faviconUrl}
                        onUpload={(url) => handleImageUpdate('general', 'faviconUrl', url)}
                    />
                </div>
            </div>
        </div>
    );
};

export default TabImages;