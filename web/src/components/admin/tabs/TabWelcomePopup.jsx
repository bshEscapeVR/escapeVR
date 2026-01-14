'use client';

import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Clock, Sparkles, Gift, Star, Zap, PartyPopper, Flame, Heart, Rocket, Trophy, Crown, Gem, Target, Bell } from 'lucide-react';
import { settingsService } from '../../../services';
import NeonButton from '../../../components/ui/NeonButton';
import Spinner from '../../../components/ui/Spinner';

// Available icons for the welcome popup
const POPUP_ICONS = [
    { id: 'sparkles', icon: Sparkles, label: 'ניצוצות' },
    { id: 'gift', icon: Gift, label: 'מתנה' },
    { id: 'star', icon: Star, label: 'כוכב' },
    { id: 'zap', icon: Zap, label: 'ברק' },
    { id: 'partyPopper', icon: PartyPopper, label: 'חגיגה' },
    { id: 'flame', icon: Flame, label: 'להבה' },
    { id: 'heart', icon: Heart, label: 'לב' },
    { id: 'rocket', icon: Rocket, label: 'רקטה' },
    { id: 'trophy', icon: Trophy, label: 'גביע' },
    { id: 'crown', icon: Crown, label: 'כתר' },
    { id: 'gem', icon: Gem, label: 'יהלום' },
    { id: 'target', icon: Target, label: 'מטרה' },
    { id: 'bell', icon: Bell, label: 'פעמון' },
];

const TabWelcomePopup = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        enabled: false,
        delaySeconds: 3,
        icon: 'sparkles',
        title: { he: '', en: '' },
        content: { he: '', en: '' }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const settings = await settingsService.get();
            if (settings?.welcomePopup) {
                setFormData({
                    enabled: settings.welcomePopup.enabled || false,
                    delaySeconds: settings.welcomePopup.delaySeconds || 3,
                    icon: settings.welcomePopup.icon || 'sparkles',
                    title: settings.welcomePopup.title || { he: '', en: '' },
                    content: settings.welcomePopup.content || { he: '', en: '' }
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await settingsService.update({
                welcomePopup: formData
            });
            alert('הפופאפ נשמר בהצלחה!');
        } catch (err) {
            console.error(err);
            alert('שגיאה בשמירה');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = () => {
        setFormData(prev => ({ ...prev, enabled: !prev.enabled }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="md" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles size={24} className="text-cyan-400" />
                        פופאפ הודעת כניסה
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        הצג הודעה מיוחדת למבקרים בכניסה לאתר (מבצעים, הנחות, הודעות)
                    </p>
                </div>
                <NeonButton onClick={handleSave} icon={Save} disabled={saving}>
                    {saving ? 'שומר...' : 'שמור שינויים'}
                </NeonButton>
            </div>

            <div className="max-w-3xl space-y-6">
                {/* Toggle Enable/Disable */}
                <div className="bg-[#1a0b2e] border border-white/10 p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {formData.enabled ? (
                                <Eye size={24} className="text-green-400" />
                            ) : (
                                <EyeOff size={24} className="text-gray-500" />
                            )}
                            <div>
                                <h3 className="text-white font-bold">סטטוס הפופאפ</h3>
                                <p className="text-gray-500 text-sm">
                                    {formData.enabled ? 'הפופאפ יוצג למבקרים חדשים' : 'הפופאפ מושבת ולא יוצג'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleToggle}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                                formData.enabled ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                                formData.enabled ? 'right-1' : 'left-1'
                            }`}></div>
                        </button>
                    </div>
                </div>

                {/* Delay Setting */}
                <div className="bg-[#1a0b2e] border border-white/10 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock size={20} className="text-brand-primary" />
                        <h3 className="text-white font-bold">השהיה לפני הצגה</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            min="0"
                            max="30"
                            value={formData.delaySeconds}
                            onChange={(e) => setFormData(prev => ({ ...prev, delaySeconds: Number(e.target.value) }))}
                            className="w-24 bg-black/30 border border-white/10 rounded-lg p-3 text-white text-center text-lg font-bold focus:outline-none focus:border-brand-primary"
                        />
                        <span className="text-gray-400">שניות אחרי כניסה לאתר</span>
                    </div>
                </div>

                {/* Icon Selector */}
                <div className="bg-[#1a0b2e] border border-white/10 p-6 rounded-xl">
                    <h3 className="text-white font-bold mb-4">בחירת אייקון</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-3">
                        {POPUP_ICONS.map(({ id, icon: Icon, label }) => (
                            <button
                                key={id}
                                onClick={() => setFormData(prev => ({ ...prev, icon: id }))}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                                    formData.icon === id
                                        ? 'bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                        : 'bg-black/30 border border-white/10 hover:border-white/30 hover:bg-white/5'
                                }`}
                                title={label}
                            >
                                <div className={`relative w-10 h-10 flex items-center justify-center ${
                                    formData.icon === id ? '' : ''
                                }`}>
                                    {formData.icon === id && (
                                        <>
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 animate-pulse"></div>
                                            <div className="absolute inset-1 rounded-full border border-purple-400/30 bg-gradient-to-br from-purple-900/50 to-transparent"></div>
                                        </>
                                    )}
                                    <Icon
                                        size={24}
                                        className={`relative z-10 ${
                                            formData.icon === id
                                                ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                                                : 'text-gray-400'
                                        }`}
                                    />
                                </div>
                                <span className={`text-xs ${formData.icon === id ? 'text-cyan-400' : 'text-gray-500'}`}>
                                    {label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Title - Hebrew */}
                <div className="bg-[#1a0b2e] border border-white/10 p-6 rounded-xl">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">עברית</span>
                        כותרת הפופאפ
                    </h3>
                    <input
                        type="text"
                        value={formData.title?.he || ''}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            title: { ...prev.title, he: e.target.value }
                        }))}
                        placeholder="לדוגמה: מבצע מיוחד!"
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-brand-primary"
                    />
                </div>

                {/* Content - Hebrew */}
                <div className="bg-[#1a0b2e] border border-white/10 p-6 rounded-xl">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">עברית</span>
                        תוכן ההודעה
                    </h3>
                    <textarea
                        value={formData.content?.he || ''}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            content: { ...prev.content, he: e.target.value }
                        }))}
                        placeholder="לדוגמה: 20% הנחה על כל ההזמנות השבוע! הזמינו עכשיו ותיהנו מחוויה בלתי נשכחת."
                        rows={4}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-brand-primary resize-none"
                    />
                </div>

                {/* Title - English */}
                <div className="bg-[#1a0b2e] border border-white/10 p-6 rounded-xl">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">English</span>
                        Popup Title
                    </h3>
                    <input
                        type="text"
                        value={formData.title?.en || ''}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            title: { ...prev.title, en: e.target.value }
                        }))}
                        placeholder="e.g., Special Offer!"
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-brand-primary"
                        dir="ltr"
                    />
                </div>

                {/* Content - English */}
                <div className="bg-[#1a0b2e] border border-white/10 p-6 rounded-xl">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">English</span>
                        Message Content
                    </h3>
                    <textarea
                        value={formData.content?.en || ''}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            content: { ...prev.content, en: e.target.value }
                        }))}
                        placeholder="e.g., 20% off all bookings this week! Book now and enjoy an unforgettable experience."
                        rows={4}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-brand-primary resize-none"
                        dir="ltr"
                    />
                </div>

                {/* Preview hint */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-xl">
                    <p className="text-cyan-400 text-sm text-center">
                        לאחר השמירה, הפופאפ יופיע למבקרים חדשים בלבד (פעם אחת בסשן)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TabWelcomePopup;
