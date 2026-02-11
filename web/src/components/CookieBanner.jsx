'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';

const COOKIE_CONSENT_KEY = 'cookie_consent';

const CookieBanner = () => {
    // Start visible so crawlers/scanners can detect the banner in the DOM
    const [hidden, setHidden] = useState(false);
    const { t } = useTranslation();
    const params = useParams();
    const lang = params?.lang || 'he';

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (consent) {
            setHidden(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        setHidden(true);
    };

    return (
        <div
            id="cookie-consent-banner"
            role="dialog"
            aria-label="Cookie Consent"
            className={`fixed bottom-0 left-0 right-0 z-[90] p-4 transition-all duration-500 ${hidden ? 'translate-y-full pointer-events-none opacity-0' : 'translate-y-0 opacity-100'}`}
        >
            <div className="max-w-4xl mx-auto bg-[#1a0b2e]/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 sm:p-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

                    {/* Icon + Text */}
                    <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-purple-500/15 rounded-lg shrink-0 mt-0.5">
                            <Cookie className="text-purple-400" size={20} />
                        </div>
                        <div>
                            <p className="text-gray-200 text-sm leading-relaxed">
                                {t('cookie_banner.message')}{' '}
                                <Link
                                    href={`/${lang}/privacy`}
                                    className="text-brand-primary hover:text-purple-300 underline underline-offset-2 transition-colors"
                                >
                                    {t('cookie_banner.learn_more')}
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                        <button
                            onClick={acceptCookies}
                            className="flex-1 sm:flex-initial px-6 py-2.5 bg-brand-primary hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition-all duration-300 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40"
                        >
                            {t('cookie_banner.accept')}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CookieBanner;
