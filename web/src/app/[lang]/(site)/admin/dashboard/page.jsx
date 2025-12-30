'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Settings, Save, Image, FileText, Youtube, BarChart, LogOut, Calendar, MessageSquare, TrendingUp, ExternalLink, Layout } from 'lucide-react';
import { settingsService, authService } from '../../../../../services';
import NeonButton from '../../../../../components/ui/NeonButton';
import Spinner from '../../../../../components/ui/Spinner';

// Import tabs
import TabSEO from '../../../../../components/admin/tabs/TabSEO';
import TabImages from '../../../../../components/admin/tabs/TabImages';
import TabContent from '../../../../../components/admin/tabs/TabContent';
import TabBookings from '../../../../../components/admin/tabs/TabBookings';
import TabTrailer from '../../../../../components/admin/tabs/TabTrailer';
import TabReviews from '../../../../../components/admin/tabs/TabReviews';
import TabLeads from '../../../../../components/admin/tabs/TabLeads';
import TabRooms from '../../../../../components/admin/tabs/TabRooms';

export default function DashboardPage() {
    const router = useRouter();
    const params = useParams();
    const lang = params.lang || 'he';

    const [activeTab, setActiveTab] = useState('bookings');
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const tabs = [
        { id: 'bookings', label: 'הזמנות', icon: <Calendar size={15} /> },
        { id: 'rooms', label: 'חדרים', icon: <Layout size={15} /> },
        { id: 'leads', label: 'לידים', icon: <TrendingUp size={15} /> },
        { id: 'reviews', label: 'ביקורות', icon: <MessageSquare size={15} /> },
        { id: 'seo', label: 'SEO', icon: <BarChart size={15} /> },
        { id: 'content', label: 'תוכן', icon: <FileText size={15} /> },
        { id: 'images', label: 'תמונות', icon: <Image size={15} /> },
        { id: 'trailer', label: 'טריילר', icon: <Youtube size={15} /> },
    ];

    useEffect(() => {
        const fetchSettings = async () => {
            if (!authService.isAuthenticated()) {
                return router.push(`/${lang}/admin/login`);
            }

            try {
                setLoading(true);
                const data = await settingsService.get();
                setSettings(data);
            } catch (err) {
                console.error("Error loading settings", err);
                if (err.response?.status === 401) {
                    authService.logout();
                    router.push(`/${lang}/admin/login`);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [router, lang]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await settingsService.update(settings);
            alert("הגדרות נשמרו בהצלחה!");
        } catch (err) {
            console.error(err);
            alert("שגיאה בשמירה");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        router.push(`/${lang}/admin/login`);
    };

    const updateSettingsState = (section, newValue) => {
        setSettings(prev => ({ ...prev, [section]: newValue }));
    };

    if (loading || !settings) return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center">
            <Spinner size="md" />
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-dark pt-20 text-gray-100 font-sans selection:bg-brand-primary/30" dir="rtl">

            {/* Header Area - תיקון רספונסיבי למובייל */}
            <header className="relative pt-6 pb-8 px-4 md:px-6 text-center z-10 border-b border-white/5 bg-[#1a0b2e]/50">

                <div className="flex flex-col md:block items-center justify-center relative">
                    {/* כותרת */}
                    <div className="inline-flex items-center gap-3 mb-4 md:mb-2 animate-fade-in">
                        <Settings className="text-brand-secondary animate-spin-slow" size={28} />
                        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                            לוח ניהול
                        </h1>
                    </div>

                    {/* כפתורים - במובייל הם יהיו שורה מתחת לכותרת, בדסקטופ הם יצופו לצד */}
                    <div className="flex gap-3 md:absolute md:top-2 md:left-0 justify-center w-full md:w-auto">
                        <a href={`/${lang}`} target="_blank" className="flex items-center gap-2 text-gray-400 hover:text-brand-secondary transition-colors text-sm px-4 py-2 rounded-full hover:bg-white/5 border border-white/10 hover:border-brand-secondary/30">
                            <ExternalLink size={16} /> צפה באתר
                        </a>
                        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm px-4 py-2 rounded-full hover:bg-red-500/10 border border-white/10 hover:border-red-500/20">
                            <LogOut size={16} /> יציאה
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 relative z-10">

                {/* Tabs Navigation - תיקון רספונסיבי (גריד במובייל) */}
                <div className="bg-[#1a1025] border border-white/5 rounded-xl p-1.5 grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-wrap shadow-xl mb-8 gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center justify-center gap-2 px-2 py-3 text-sm rounded-lg transition-all duration-300
                                ${activeTab === tab.id
                                    ? 'bg-brand-primary text-white font-bold shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }
                                md:flex-1
                            `}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="glass-panel rounded-2xl p-4 md:p-8 min-h-[600px] relative animate-fade-in-up">

                    {/* Management tabs */}
                    {activeTab === 'bookings' && <TabBookings />}
                    {activeTab === 'rooms' && <TabRooms />}
                    {activeTab === 'leads' && <TabLeads />}
                    {activeTab === 'reviews' && <TabReviews />}

                    {/* Settings tabs */}
                    {activeTab === 'seo' && <TabSEO settings={settings} update={updateSettingsState} />}
                    {activeTab === 'content' && <TabContent settings={settings} update={updateSettingsState} />}
                    {activeTab === 'images' && <TabImages settings={settings} update={updateSettingsState} />}
                    {activeTab === 'trailer' && <TabTrailer settings={settings} update={updateSettingsState} />}

                    {/* Global save button (only for settings tabs) */}
                    {['seo', 'images', 'content', 'trailer'].includes(activeTab) && (
                        <div className="mt-12 pt-8 border-t border-white/5 flex justify-end sticky bottom-0 bg-[#1a0b2e]/95 py-4 -mb-4 z-20 rounded-b-2xl">
                            <NeonButton onClick={handleSave} disabled={isSaving} icon={Save}>
                                {isSaving ? 'שומר...' : 'שמור שינויים'}
                            </NeonButton>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
