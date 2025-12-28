'use client';

import React from 'react';

const NeonButton = ({ children, onClick, variant = 'primary', className = '', icon: Icon, fullWidth = false, ...props }) => {
    
    const baseStyles = "relative overflow-hidden font-bold py-3 px-8 rounded-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 group";
    
    const variants = {
        primary: "bg-gradient-to-r from-brand-primary to-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:brightness-110",
        secondary: "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:brightness-110",
        outline: "bg-transparent border border-white/20 hover:bg-white/5 text-white hover:border-brand-primary/50",
        ghost: "bg-transparent hover:bg-white/5 text-gray-300 hover:text-white"
    };

    return (
        <button 
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
        >
            {/* אפקט בוהק במעבר עכבר */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
            
            <span className="relative z-10 flex items-center gap-2">
                {Icon && <Icon size={20} className={variant === 'outline' ? 'text-brand-primary' : ''} />}
                {children}
            </span>
        </button>
    );
};

export default NeonButton;