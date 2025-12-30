'use client';

import React from 'react';

const ReviewSkeleton = () => {
    return (
        <div className="bg-[#1a0b2e] border border-white/5 p-8 rounded-2xl relative h-full flex flex-col animate-pulse">
            {/* Quote icon placeholder */}
            <div className="absolute top-4 right-4 w-10 h-10 bg-white/5 rounded" />

            {/* Stars line */}
            <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-white/10 rounded" />
                ))}
            </div>

            {/* Review text block */}
            <div className="space-y-2 mb-4 flex-grow">
                <div className="h-5 w-full bg-white/5 rounded" />
                <div className="h-5 w-full bg-white/5 rounded" />
                <div className="h-5 w-3/4 bg-white/5 rounded" />
            </div>

            {/* Author section */}
            <div className="mt-auto border-t border-white/5 pt-4">
                <div className="h-5 w-32 bg-white/10 rounded mb-2" />
                <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
        </div>
    );
};

export default ReviewSkeleton;
