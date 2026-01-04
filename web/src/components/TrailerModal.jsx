'use client';
import React from 'react';
import { X } from 'lucide-react';

const TrailerModal = ({ isOpen, onClose, videoUrl }) => {
    if (!isOpen || !videoUrl) return null;

    // Check if URL is a YouTube link
    const getYouTubeEmbed = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
        }
        return null;
    };

    // Check if URL is a Vimeo link
    const getVimeoEmbed = (url) => {
        if (!url) return null;
        const regExp = /vimeo\.com\/(?:video\/)?(\d+)/;
        const match = url.match(regExp);
        if (match && match[1]) {
            return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
        }
        return null;
    };

    const youtubeEmbed = getYouTubeEmbed(videoUrl);
    const vimeoEmbed = getVimeoEmbed(videoUrl);
    const embedUrl = youtubeEmbed || vimeoEmbed;

    // For direct video files (Cloudinary or legacy local)
    const getDirectVideoUrl = (url) => {
        if (!url) return '';
        // Absolute URLs (Cloudinary, CDN) - use as-is
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // Legacy local paths - prepend server URL
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://escapevr-server.onrender.com').trim();
        let cleanPath = url.replace(/\.\.\//g, '').replace('public/', '').replace('/public/', '/');
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        return `${apiUrl}${cleanPath}`;
    };

    // Get the final video URL for the player
    const finalVideoUrl = !embedUrl ? getDirectVideoUrl(videoUrl) : '';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-fade-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {embedUrl ? (
                    // YouTube or Vimeo embed
                    <iframe
                        src={embedUrl}
                        title="Trailer"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                ) : (
                    // Direct video file (Cloudinary or local)
                    <video
                        key={finalVideoUrl}
                        className="w-full h-full"
                        controls
                        autoPlay
                        playsInline
                    >
                        <source src={finalVideoUrl} type="video/mp4" />
                        Your browser does not support the video player.
                    </video>
                )}
            </div>
        </div>
    );
};

export default TrailerModal;
