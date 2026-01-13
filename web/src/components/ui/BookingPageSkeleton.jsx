'use client';

import React from 'react';

const InfoCardSkeleton = () => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center animate-pulse">
        {/* Icon placeholder */}
        <div className="w-10 h-10 bg-white/10 rounded-full mb-2" />
        {/* Title placeholder */}
        <div className="h-2 w-12 bg-white/5 rounded mb-1" />
        {/* Value placeholder */}
        <div className="h-4 w-10 bg-white/10 rounded" />
    </div>
);

const BookingPageSkeleton = () => {
    return (
        <div className="min-h-screen bg-brand-dark text-white pt-24 px-4 pb-20 relative overflow-hidden animate-pulse">
            {/* Background placeholder */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-brand-dark via-brand-dark/95 to-brand-dark" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Back button placeholder */}
                <div className="h-6 w-32 bg-white/5 rounded mb-8" />

                <div className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden">
                    {/* Glow Effect Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">

                        {/* Left side - Image + Info Cards */}
                        <div className="space-y-4">
                            {/* Image placeholder */}
                            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                <div className="w-full h-72 md:h-96 bg-white/10" />
                            </div>

                            {/* Info cards - 3 cards in a row */}
                            <div className="grid grid-cols-3 gap-3">
                                <InfoCardSkeleton />
                                <InfoCardSkeleton />
                                <InfoCardSkeleton />
                            </div>
                        </div>

                        {/* Right side - Text + Button */}
                        <div className="space-y-6 flex flex-col h-full">
                            {/* Title */}
                            <div>
                                <div className="h-12 md:h-14 w-3/4 bg-white/10 rounded-lg mb-3" />
                                <div className="h-6 w-1/2 bg-white/5 rounded" />
                            </div>

                            {/* Description */}
                            <div className="space-y-3 flex-grow">
                                <div className="h-5 w-full bg-white/5 rounded" />
                                <div className="h-5 w-full bg-white/5 rounded" />
                                <div className="h-5 w-4/5 bg-white/5 rounded" />
                                <div className="h-5 w-3/4 bg-white/5 rounded" />
                            </div>

                            {/* CTA Button placeholder */}
                            <div className="h-14 w-full bg-white/10 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPageSkeleton;
