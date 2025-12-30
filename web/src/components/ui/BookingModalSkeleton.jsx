'use client';

import React from 'react';

const BookingModalSkeleton = () => {
    return (
        <div className="flex flex-col md:flex-row w-full animate-pulse">
            {/* Left side - Room details */}
            <div className="md:w-1/3 bg-black/20 p-6 border-l rtl:border-r rtl:border-l-0 border-white/5 flex flex-col gap-4">
                {/* Title */}
                <div className="h-7 w-40 bg-white/10 rounded mb-2" />

                {/* Room select placeholder */}
                <div className="mb-4">
                    <div className="h-4 w-16 bg-white/5 rounded mb-2" />
                    <div className="h-12 w-full bg-white/5 rounded-lg" />
                </div>

                {/* Image placeholder */}
                <div className="h-32 w-full bg-white/5 rounded-lg mb-2" />

                {/* Details summary */}
                <div className="space-y-3 bg-white/5 p-4 rounded-xl">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <div className="h-4 w-20 bg-white/5 rounded" />
                        <div className="h-4 w-8 bg-white/10 rounded" />
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <div className="h-4 w-16 bg-white/5 rounded" />
                        <div className="h-4 w-20 bg-white/10 rounded" />
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <div className="h-4 w-12 bg-white/5 rounded" />
                        <div className="h-4 w-14 bg-white/10 rounded" />
                    </div>
                    <div className="flex justify-between pt-1">
                        <div className="h-5 w-16 bg-white/10 rounded" />
                        <div className="h-5 w-16 bg-white/10 rounded" />
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="md:w-2/3 p-6 bg-brand-card/50">
                {/* When section */}
                <div className="mb-6">
                    <div className="h-5 w-32 bg-white/10 rounded mb-3" />

                    {/* Calendar placeholder */}
                    <div className="h-64 w-full bg-white/5 rounded-lg mb-4" />

                    {/* Time slots placeholder */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-10 bg-white/5 rounded-lg" />
                        ))}
                    </div>
                </div>

                {/* Participants section */}
                <div className="mb-6">
                    <div className="h-5 w-28 bg-white/10 rounded mb-3" />
                    <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-10 h-10 bg-white/5 rounded-xl" />
                        ))}
                    </div>
                </div>

                {/* Form inputs */}
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <div className="h-12 w-full bg-white/5 rounded-xl" />
                        <div className="h-12 w-full bg-white/5 rounded-xl" />
                    </div>
                    <div className="h-12 w-full bg-white/5 rounded-xl" />

                    {/* Submit button */}
                    <div className="mt-2">
                        <div className="h-12 w-full bg-white/10 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingModalSkeleton;
