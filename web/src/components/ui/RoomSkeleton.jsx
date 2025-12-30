'use client';

import React from 'react';

const RoomSkeleton = () => {
    return (
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full animate-pulse">
            {/* Image area skeleton */}
            <div className="h-64 bg-white/5 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-transparent z-10 opacity-80" />
                {/* Badge skeletons */}
                <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                    <div className="h-6 w-16 bg-white/10 rounded-full" />
                    <div className="h-6 w-12 bg-white/10 rounded-full" />
                </div>
            </div>

            {/* Content skeleton */}
            <div className="p-6 flex flex-col flex-grow">
                {/* Title skeleton */}
                <div className="h-7 w-3/4 bg-white/10 rounded-lg mb-3" />

                {/* Description skeleton - 3 lines */}
                <div className="space-y-2 mb-6 flex-grow">
                    <div className="h-4 w-full bg-white/5 rounded" />
                    <div className="h-4 w-full bg-white/5 rounded" />
                    <div className="h-4 w-2/3 bg-white/5 rounded" />
                </div>

                {/* Button skeleton */}
                <div className="h-12 w-full bg-white/10 rounded-full" />
            </div>
        </div>
    );
};

export default RoomSkeleton;
