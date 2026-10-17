'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// כתובת מייל לחיצה (פותחת את תוכנת המייל במכשיר) + אייקון להעתקת הכתובת
const EmailLink = ({ email, className = '' }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    return (
        <span className="inline-flex items-center gap-2 relative z-20" dir="ltr">
            <a href={`mailto:${email}`} className={`hover:underline ${className}`}>
                {email}
            </a>
            <button
                type="button"
                onClick={copyEmail}
                title={copied ? t('contact.copied') : t('contact.copy_email')}
                aria-label={copied ? t('contact.copied') : t('contact.copy_email')}
                className="shrink-0 p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
        </span>
    );
};

export default EmailLink;
