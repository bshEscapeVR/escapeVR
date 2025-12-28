'use client';

import React from 'react';
import { Video, Link as LinkIcon, Upload, FileVideo, CheckCircle2 } from 'lucide-react';
import ImageUploader from '../../../components/admin/ui/ImageUploader';

const TabTrailer = ({ settings, update }) => {
    
    const currentUrl = settings.media?.trailerUrl || '';

    // Detect URL type: Cloudinary/CDN, legacy local, or external embed link
    const isCloudinaryOrCdn = currentUrl.startsWith('http://') || currentUrl.startsWith('https://');
    const isLegacyLocalFile = currentUrl.startsWith('/uploads');
    const isUploadedFile = isCloudinaryOrCdn || isLegacyLocalFile;

    // External embed links (YouTube, Vimeo) - not a direct file upload
    const isYouTube = currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be');
    const isVimeo = currentUrl.includes('vimeo.com');
    const isExternalEmbed = isYouTube || isVimeo;

    // For display purposes: show as "external link" if it's YouTube/Vimeo, otherwise as "uploaded file"
    const isExternalLink = isExternalEmbed;
    const isLocalFile = isUploadedFile && !isExternalEmbed;

    const handleChange = (newValue) => {
        update('media', { ...settings.media, trailerUrl: newValue });
    };

    return (
        <div className="animate-fade-in space-y-6 pb-10">
            
            {/* כותרת */}
            <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Video className="text-brand-secondary" /> הגדרות טריילר
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                    הסרטון שיוצג בחלון הקופץ בעמוד הבית. בחרו באחת האפשרויות:
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* --- אפשרות א': קישור חיצוני (עיצוב קומפקטי) --- */}
                <div className={`p-5 rounded-xl border transition-all duration-300 ${isExternalLink ? 'bg-[#1a0b2e] border-brand-primary/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-black/20 border-white/5'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-white font-bold">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <LinkIcon size={18}/>
                            </div>
                            קישור חיצוני (מומלץ)
                        </div>
                        {isExternalLink && <div className="text-green-400 text-xs flex items-center gap-1 font-bold"><CheckCircle2 size={14}/> פעיל כרגע</div>}
                    </div>
                    
                    <p className="text-gray-500 text-xs mb-3">
                        YouTube או Vimeo. נטען מהר יותר ולא מכביד על השרת.
                    </p>

                    <div className="relative group">
                        <input 
                            type="text" 
                            value={!isLocalFile ? currentUrl : ''} // מציג רק אם זה לא קובץ מקומי
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full bg-[#0a0510] border border-white/10 rounded-lg py-3 px-4 pl-10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dir-ltr text-sm"
                            dir="ltr"
                        />
                        <LinkIcon size={16} className="absolute top-3.5 left-3 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                </div>

                {/* --- אפשרות ב': העלאת קובץ --- */}
                <div className={`p-5 rounded-xl border transition-all duration-300 ${isLocalFile ? 'bg-[#1a0b2e] border-brand-primary/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-black/20 border-white/5'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-white font-bold">
                            <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                <Upload size={18}/>
                            </div>
                            העלאת קובץ (MP4)
                        </div>
                        {isLocalFile && <div className="text-green-400 text-xs flex items-center gap-1 font-bold"><CheckCircle2 size={14}/> פעיל כרגע</div>}
                    </div>

                    <p className="text-gray-500 text-xs mb-4">
                        העלאה ישירה לשרת (מוגבל ל-100MB).
                    </p>
                    
                    <ImageUploader
                        title="קובץ וידאו"
                        description="לחץ לבחירת קובץ"
                        mediaType="video"
                        imageUrl={isLocalFile ? currentUrl : null}
                        onUpload={(url) => handleChange(url)}
                        isWide={false}
                    />

                    {/* Display current file info */}
                    {isLocalFile && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-2 rounded border border-white/5 overflow-hidden">
                            <FileVideo size={14} className="flex-shrink-0" />
                            <span className="truncate dir-ltr">
                                {isCloudinaryOrCdn ? 'Cloudinary Video' : currentUrl.split('/').pop()}
                            </span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default TabTrailer;