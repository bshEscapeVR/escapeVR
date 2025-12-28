'use client';

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Film, Loader, X } from 'lucide-react'; // הוספתי Film
import { uploadService } from '../../../services'; 

const ImageUploader = ({ 
    title, 
    description, 
    imageUrl, 
    onUpload, 
    isWide = false,
    mediaType = 'image' // 👈 ברירת מחדל תמונה, אבל אפשר לשלוח 'video'
}) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // הגדרת סוגי קבצים מותרים לפי הסוג שנבחר
    const acceptTypes = mediaType === 'video' ? 'video/mp4,video/x-m4v,video/*' : 'image/*';
    // בחירת האייקון המתאים
    const TypeIcon = mediaType === 'video' ? Film : ImageIcon;

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await uploadService.uploadImage(file);
            if (response.imageUrl) {
                onUpload(response.imageUrl); 
            }
        } catch (err) {
            console.error("Upload failed", err);
            alert("שגיאה בהעלאה (ודא שהקובץ לא גדול מדי)");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-[#0f0716] border border-white/5 rounded-xl overflow-hidden group hover:border-brand-primary/30 transition-all duration-300 mb-6 shadow-lg">
            
            <div className="px-5 py-4 flex justify-between items-center bg-[#1a1025] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                        <TypeIcon size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-200 text-sm">{title}</h3>
                        <p className="text-gray-500 text-[11px] mt-0.5">{description}</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleClick}
                    disabled={uploading}
                    className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-4 py-1.5 rounded-md text-xs font-bold transition-all border border-white/5 hover:border-white/20 flex items-center gap-2"
                >
                    {uploading ? 'מעלה...' : (mediaType === 'video' ? 'בחר סרטון' : 'בחר תמונה')}
                </button>
            </div>
            
            {/* Input נסתר עם סינון נכון */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept={acceptTypes} // 👈 כאן התיקון שפותח MP4
            />

            {/* אזור התצוגה */}
            <div 
                onClick={handleClick}
                className={`relative w-full ${isWide ? 'h-56' : 'h-40'} flex items-center justify-center overflow-hidden bg-[#0a0510] cursor-pointer`}
            >
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                {uploading ? (
                    <div className="flex flex-col items-center gap-2 z-20">
                        <Loader className="animate-spin text-brand-primary" size={32} />
                        <span className="text-xs text-gray-400">מעלה לשרת... (זה עשוי לקחת זמן)</span>
                    </div>
                ) : imageUrl ? (
                    // 👈 תצוגה חכמה: וידאו או תמונה
                    mediaType === 'video' ? (
                        <video 
                            src={imageUrl} 
                            className="relative z-10 w-full h-full object-cover" 
                            muted // מושתק כדי לא להפריע
                            loop // לופ כדי לראות שזה עובד
                            onMouseOver={e => e.target.play()} // מנגן כשעוברים עם העכבר
                            onMouseOut={e => e.target.pause()} 
                        />
                    ) : (
                        <img 
                            src={imageUrl} 
                            alt={title} 
                            className="relative z-10 w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-700 ease-out" 
                        />
                    )
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-600">
                        <TypeIcon size={32} />
                        <span className="text-xs">
                            {mediaType === 'video' ? 'אין סרטון מוגדר' : 'אין תמונה מוגדרת'}
                        </span>
                    </div>
                )}

                {/* Hover Overlay */}
                {!uploading && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <Upload size={24} className="text-brand-primary" />
                            <span className="text-sm font-bold">לחץ להעלאת קובץ</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUploader;