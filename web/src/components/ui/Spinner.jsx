'use client';

import React from 'react';

const Spinner = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-16 h-16',
        lg: 'w-24 h-24'
    };

    const dotSizes = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    };

    return (
        <div className={`relative ${sizes[size]} ${className}`}>
            {/* Outer glowing ring */}
            <div className={`${sizes[size]} rounded-full border-4 border-brand-primary/30 animate-pulse`} />

            {/* Spinning neon ring */}
            <div
                className={`absolute inset-0 ${sizes[size]} rounded-full border-4 border-transparent border-t-brand-primary animate-spin`}
                style={{
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.5), inset 0 0 20px rgba(168, 85, 247, 0.1)',
                    animationDuration: '1s'
                }}
            />

            {/* Inner glow dot */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className={`${dotSizes[size]} rounded-full bg-brand-primary animate-pulse`}
                    style={{ boxShadow: '0 0 15px rgba(168, 85, 247, 0.8), 0 0 30px rgba(168, 85, 247, 0.4)' }}
                />
            </div>
        </div>
    );
};

export default Spinner;
