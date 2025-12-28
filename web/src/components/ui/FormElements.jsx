'use client';

import React from 'react';

// שדה קלט רגיל (Input)
export const FormInput = ({ label, icon: Icon, className = "", ...props }) => (
    <div className={className}>
        {label && <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">{label}</label>}
        <div className="relative">
            <input 
                className={`w-full bg-[#0a0310] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-primary outline-none transition-colors ${Icon ? 'pl-10 rtl:pr-10 rtl:pl-4' : ''}`}
                {...props}
            />
            {Icon && <Icon size={16} className="absolute top-3.5 left-3 text-gray-600 rtl:right-3 rtl:left-auto" />}
        </div>
    </div>
);

// שדה טקסט ארוך (Textarea)
export const FormTextarea = ({ label, className = "", ...props }) => (
    <div className={className}>
        {label && <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">{label}</label>}
        <textarea 
            className="w-full h-32 bg-[#0a0310] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-primary outline-none transition-colors resize-none"
            {...props}
        ></textarea>
    </div>
);

// שדה בחירה (Select)
export const FormSelect = ({ label, options, placeholder, ...props }) => (
    <div>
        {label && <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">{label}</label>}
        <select 
            className="w-full bg-[#0a0310] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-primary outline-none transition-colors"
            {...props}
        >
            <option value="">{placeholder}</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

// כרטיסייה לפרטי קשר (צד ימין/שמאל)
export const ContactCard = ({ icon: Icon, title, content, subContent, action, colorClass = "text-brand-primary", borderHover = "hover:border-brand-primary/50", bgIcon = "bg-brand-primary/10" }) => (
    <div className={`bg-[#1a0b2e] border border-white/10 rounded-xl p-5 ${borderHover} transition-colors group text-start`}>
        <div className="flex justify-between items-start">
            <div>
                <h4 className="text-white font-bold">{title}</h4>
                {content && <p className={`mt-1 ${content.className || 'text-gray-400'}`}>{content.text}</p>}
                {subContent && <p className="text-gray-400 text-sm mt-1">{subContent}</p>}
            </div>
            {Icon && (
                <div className={`p-2 rounded-full ${bgIcon} transition-colors`}>
                    <Icon className={colorClass} size={20} />
                </div>
            )}
        </div>
        {action}
    </div>
);