'use client';

import React from 'react';

const SectionTitle = ({ title, subtitle, center = true }) => {
    return (
        <div className={`mb-12 ${center ? 'text-center' : ''}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                {title}
            </h2>
            {subtitle && (
                <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                    {subtitle}
                </p>
            )}
            {/* פס מפריד זוהר */}
            <div className={`h-1 w-24 bg-gradient-to-r from-transparent via-brand-primary to-transparent rounded-full mt-6 ${center ? 'mx-auto' : ''}`}></div>
        </div>
    );
};

export default SectionTitle;