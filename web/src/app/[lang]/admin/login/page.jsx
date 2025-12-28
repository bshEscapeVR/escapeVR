'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { authService } from '../../../../services';
import NeonButton from '../../../../components/ui/NeonButton';

export default function LoginPage() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [status, setStatus] = useState('idle');
    const router = useRouter();
    const params = useParams();
    const lang = params.lang || 'he';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            await authService.login(formData.username, formData.password);
            window.location.href = `/${lang}`;
        } catch (err) {
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen pt-24 flex items-center justify-center bg-brand-dark relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-secondary/20 rounded-full blur-[100px]"></div>

            <div className="glass-panel p-8 rounded-3xl w-full max-w-md relative z-10 animate-fade-in border-t border-white/20">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-primary/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        <ShieldCheck size={32} className="text-brand-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-wide">Admin Portal</h2>
                    <p className="text-gray-400 text-sm mt-2">VR Escape Reality Management</p>
                </div>

                {status === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl mb-6 flex items-center gap-2 text-sm animate-pulse">
                        <AlertCircle size={16} />
                        Invalid username or password
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <User className="absolute top-3.5 left-3 text-gray-400 group-focus-within:text-brand-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Username"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute top-3.5 left-3 text-gray-400 group-focus-within:text-brand-primary transition-colors" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <NeonButton
                        type="submit"
                        fullWidth
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? 'Logging in...' : 'Login'}
                    </NeonButton>
                </form>
            </div>
        </div>
    );
}
