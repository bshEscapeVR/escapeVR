'use client';

import React from 'react';
import { Globe } from 'lucide-react';

const PreviewCard = ({ title, desc, url, lang }) => (
    <div className="bg-[#1f1f1f] p-4 rounded-xl border border-white/10 font-sans w-full">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">
            {lang === 'he' ? 'תצוגה מקדימה (Google Israel)' : 'Preview (Google US)'}
        </div>
        
        {/* השורה העליונה של גוגל (אייקון + דומיין) */}
        <div className="flex items-center gap-2 mb-1">
            <div className="bg-gray-700 w-6 h-6 rounded-full flex items-center justify-center">
                <Globe size={12} className="text-gray-400" />
            </div>
            <div className="flex flex-col">
                <span className="text-[#dadce0] text-sm">VR Escape Reality</span>
                <span className="text-[#bdc1c6] text-xs">{url}</span>
            </div>
        </div>

        {/* הכותרת הכחולה */}
        <h3 className="text-[#8ab4f8] text-xl hover:underline cursor-pointer truncate" dir={lang === 'he' ? 'rtl' : 'ltr'}>
            {title || (lang === 'he' ? "כותרת העמוד תופיע כאן..." : "Page Title goes here...")}
        </h3>

        {/* התיאור האפור */}
        <p className="text-[#bdc1c6] text-sm mt-1 leading-snug line-clamp-2" dir={lang === 'he' ? 'rtl' : 'ltr'}>
            {desc || (lang === 'he' ? "תיאור העמוד (Meta Description) יופיע כאן. זהו הטקסט שגורם לאנשים ללחוץ על הקישור שלך." : "Page description will appear here. This is the text that makes people click on your link.")}
        </p>
    </div>
);

const GooglePreview = ({ title, description, path = "" }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 p-6 bg-[#0a0510] rounded-xl border border-white/5">
            <PreviewCard 
                lang="he" 
                title={title?.he} 
                desc={description?.he} 
                url={`vrescape.co.il${path}`} 
            />
            <PreviewCard 
                lang="en" 
                title={title?.en} 
                desc={description?.en} 
                url={`vrescape.co.il/en${path}`} 
            />
        </div>
    );
};

export default GooglePreview;