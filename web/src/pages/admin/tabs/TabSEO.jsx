'use client';

import React, { useState } from 'react';
import BilingualInput from '../../../components/admin/ui/BilingualInput';
import GooglePreview from '../../../components/admin/ui/GooglePreview';

const TabSEO = ({ settings, update }) => {
    const [activePage, setActivePage] = useState('home');
    
    const pages = [
        { id: 'home', label: 'עמוד הבית', path: '/' },
        { id: 'rooms', label: 'עמוד חדרים', path: '/rooms' },
        { id: 'booking', label: 'עמוד הזמנה', path: '/book' },
        { id: 'contact', label: 'צור קשר', path: '/contact' }
    ];

    const handleSeoChange = (key, newValue) => {
        const updatedSeo = { ...settings.seo };
        if (!updatedSeo[activePage]) updatedSeo[activePage] = {};
        updatedSeo[activePage][key] = newValue;
        update('seo', updatedSeo);
    };

    const currentSeo = settings.seo?.[activePage] || {};
    const currentPath = pages.find(p => p.id === activePage)?.path;

    return (
        <div className="animate-fade-in space-y-6 pb-10">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
                <div>
                    <h2 className="text-2xl font-bold text-white">הגדרות מנועי חיפוש (SEO)</h2>
                    <p className="text-gray-400 text-sm">קבעו כיצד האתר יופיע בתוצאות החיפוש של גוגל וברשתות החברתיות.</p>
                </div>
            </div>

            {/* בחירת עמוד - רספונסיבי */}
            <div className="bg-[#130620] p-4 rounded-xl border border-white/5">
                <label className="text-gray-400 text-xs font-bold uppercase mb-3 block">בחר עמוד לעריכה:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {pages.map(page => (
                        <button
                            key={page.id}
                            onClick={() => setActivePage(page.id)}
                            className={`px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 border ${
                                activePage === page.id 
                                    ? 'bg-brand-secondary text-white border-brand-secondary shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                                    : 'bg-black/20 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {page.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                
                {/* שדות העריכה */}
                <div className="space-y-4">
                    <BilingualInput 
                        label="כותרת העמוד (Meta Title)" 
                        value={currentSeo.title} 
                        onChange={(val) => handleSeoChange('title', val)}
                        placeholder="למשל: VR Escape - חדר הבריחה הטוב במרכז"
                    />
                    
                    <BilingualInput 
                        label="תיאור העמוד (Meta Description)" 
                        value={currentSeo.description} 
                        onChange={(val) => handleSeoChange('description', val)}
                        isTextArea
                        placeholder="תיאור קצר ומושך שמופיע מתחת לכותרת בגוגל. מומלץ עד 160 תווים."
                    />

                    {/* 👇 השדה החדש למילות מפתח */}
                    <BilingualInput 
                        label="מילות מפתח / תגיות (Keywords)" 
                        value={currentSeo.keywords} 
                        onChange={(val) => handleSeoChange('keywords', val)}
                        placeholder="מופרד בפסיקים (למשל: חדר בריחה, מציאות מדומה, אטרקציה, בית שמש)"
                    />
                </div>

                {/* תצוגה מקדימה */}
                <div className="pt-4 border-t border-white/10">
                    <h3 className="text-white font-bold mb-4 text-lg flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        תצוגה מקדימה ב-Google
                    </h3>
                    <div className="bg-[#0a0510] p-4 sm:p-6 rounded-xl border border-white/5">
                        <GooglePreview 
                            title={currentSeo.title} 
                            description={currentSeo.description}
                            path={currentPath}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TabSEO;