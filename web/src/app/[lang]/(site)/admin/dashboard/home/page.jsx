'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Calendar, Users, MessageSquare, DoorOpen, TrendingUp, LogOut, ExternalLink, Home } from 'lucide-react';
import { statsService, authService } from '../../../../../../services';

export default function AdminHomePage() {
    const router = useRouter();
    const params = useParams();
    const lang = params.lang || 'he';

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!authService.isAuthenticated()) {
                return router.push(`/${lang}/admin/login`);
            }

            try {
                setLoading(true);
                const data = await statsService.getStats();
                setStats(data);
            } catch (err) {
                console.error("Error loading stats", err);
                if (err.response?.status === 401) {
                    authService.logout();
                    router.push(`/${lang}/admin/login`);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [router, lang]);

    const handleLogout = () => {
        authService.logout();
        router.push(`/${lang}/admin/login`);
    };

    const statCards = [
        {
            label: 'הזמנות',
            value: stats?.bookings ?? 0,
            icon: Calendar,
            gradient: 'from-purple-500 to-indigo-600',
            shadowColor: 'rgba(139, 92, 246, 0.3)'
        },
        {
            label: 'לידים',
            value: stats?.leads ?? 0,
            icon: TrendingUp,
            gradient: 'from-cyan-500 to-blue-600',
            shadowColor: 'rgba(6, 182, 212, 0.3)'
        },
        {
            label: 'ביקורות',
            value: stats?.reviews ?? 0,
            icon: MessageSquare,
            gradient: 'from-pink-500 to-rose-600',
            shadowColor: 'rgba(236, 72, 153, 0.3)'
        },
        {
            label: 'חדרים',
            value: stats?.rooms ?? 0,
            icon: DoorOpen,
            gradient: 'from-emerald-500 to-teal-600',
            shadowColor: 'rgba(16, 185, 129, 0.3)'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white animate-pulse">
                טוען נתונים...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-dark pt-20 text-gray-100 font-sans selection:bg-brand-primary/30" dir="rtl">

            {/* Header */}
            <header className="relative pt-6 pb-8 px-4 md:px-6 text-center z-10 border-b border-white/5 bg-[#1a0b2e]/50">
                <div className="flex flex-col md:block items-center justify-center relative">
                    <div className="inline-flex items-center gap-3 mb-4 md:mb-2 animate-fade-in">
                        <Home className="text-brand-secondary" size={28} />
                        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                            דף הבית - לוח ניהול
                        </h1>
                    </div>

                    <div className="flex gap-3 md:absolute md:top-2 md:left-0 justify-center w-full md:w-auto">
                        <a
                            href={`/${lang}/admin/dashboard`}
                            className="flex items-center gap-2 text-gray-400 hover:text-brand-secondary transition-colors text-sm px-4 py-2 rounded-full hover:bg-white/5 border border-white/10 hover:border-brand-secondary/30"
                        >
                            ניהול מלא
                        </a>
                        <a
                            href={`/${lang}`}
                            target="_blank"
                            className="flex items-center gap-2 text-gray-400 hover:text-brand-secondary transition-colors text-sm px-4 py-2 rounded-full hover:bg-white/5 border border-white/10 hover:border-brand-secondary/30"
                        >
                            <ExternalLink size={16} /> צפה באתר
                        </a>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm px-4 py-2 rounded-full hover:bg-red-500/10 border border-white/10 hover:border-red-500/20"
                        >
                            <LogOut size={16} /> יציאה
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-12 relative z-10">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((card, index) => {
                        const IconComponent = card.icon;
                        return (
                            <div
                                key={card.label}
                                className="relative group"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Card */}
                                <div
                                    className="bg-[#1a0b2e]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:border-white/20 hover:scale-105"
                                    style={{
                                        boxShadow: `0 0 30px ${card.shadowColor}`
                                    }}
                                >
                                    {/* Icon */}
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                                        <IconComponent className="text-white" size={28} />
                                    </div>

                                    {/* Value */}
                                    <div className="text-4xl font-bold text-white mb-2">
                                        {card.value.toLocaleString()}
                                    </div>

                                    {/* Label */}
                                    <div className="text-gray-400 text-sm font-medium">
                                        {card.label}
                                    </div>

                                    {/* Neon glow effect on hover */}
                                    <div
                                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Links */}
                <div className="mt-12 text-center">
                    <a
                        href={`/${lang}/admin/dashboard`}
                        className="inline-flex items-center gap-2 bg-brand-primary hover:bg-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-brand-primary/40 transition-all hover:scale-105"
                    >
                        כניסה ללוח הניהול המלא
                    </a>
                </div>
            </main>
        </div>
    );
}
