'use client';

import React from 'react';

const BilingualInput = ({ label, value, onChange, placeholder = "", isTextArea = false }) => {
    
    const handleChange = (lang, text) => {
        onChange({ ...value, [lang]: text });
    };

    const InputComponent = isTextArea ? 'textarea' : 'input';

    return (
        <div className="bg-[#0f0716] rounded-xl border border-white/5 overflow-hidden mb-5 group hover:border-purple-500/20 transition-colors">
            {/* Header / Label */}
            <div className="bg-[#1a1025] px-4 py-3 border-b border-white/5 flex justify-between items-center">
                <label className="text-gray-200 font-bold text-sm tracking-wide">{label}</label>
                <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hebrew Input */}
                <div dir="rtl" className="relative">
                    <label className="text-[10px] text-blue-400/80 font-bold uppercase tracking-wider mb-1.5 block">עברית (Hebrew)</label>
                    <InputComponent
                        value={value?.he || ''}
                        onChange={(e) => handleChange('he', e.target.value)}
                        placeholder={placeholder}
                        className={`w-full bg-[#130b1e] border border-white/5 rounded-lg p-3 text-gray-100 text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-700 ${isTextArea ? 'h-24 resize-none' : 'h-11'}`}
                    />
                </div>
                
                {/* English Input */}
                <div dir="ltr" className="relative">
                     <label className="text-[10px] text-green-400/80 font-bold uppercase tracking-wider mb-1.5 block">English</label>
                    <InputComponent
                        value={value?.en || ''}
                        onChange={(e) => handleChange('en', e.target.value)}
                        placeholder={placeholder}
                        className={`w-full bg-[#130b1e] border border-white/5 rounded-lg p-3 text-gray-100 text-sm focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 outline-none transition-all placeholder-gray-700 ${isTextArea ? 'h-24 resize-none' : 'h-11'}`}
                    />
                </div>
            </div>
        </div>
    );
};

export default BilingualInput;