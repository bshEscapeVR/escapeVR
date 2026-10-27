'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../../../context/SettingsContext';
import NeonButton from '../../../../../components/ui/NeonButton';
import Spinner from '../../../../../components/ui/Spinner';
import Footer from '../../../../../components/Footer';
import BookingConfirmation from '../../../../../components/BookingConfirmation';
import { bookingService } from '../../../../../services';

// דף מעבר אחרי הזמנה / תשלום - מציג את פרטי ההזמנה לפי ?id=<bookingId>
const BookingSuccessContent = () => {
    const { t } = useTranslation();
    const { language } = useSettings();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('id');

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(Boolean(bookingId));

    useEffect(() => {
        if (!bookingId) return;
        bookingService.getPublic(bookingId)
            .then(setBooking)
            .catch((err) => console.error('Error fetching booking:', err))
            .finally(() => setLoading(false));
    }, [bookingId]);

    if (loading) {
        return <div className="flex justify-center py-32"><Spinner size="md" /></div>;
    }

    if (!booking) {
        return (
            <div className="glass-panel rounded-3xl p-10 text-center">
                <AlertCircle size={64} className="text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-6">{t('booking_success.not_found')}</h1>
                <Link href={`/${language}`}><NeonButton>{t('booking_success.btn_home')}</NeonButton></Link>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-3xl p-6 md:p-10 border border-white/10">
            <BookingConfirmation booking={booking} />

            <div className="flex justify-center">
                <Link href={`/${language}`}><NeonButton>{t('booking_success.btn_home')}</NeonButton></Link>
            </div>
        </div>
    );
};

export default function BookingSuccessPage() {
    return (
        <div className="min-h-screen bg-brand-dark text-brand-text font-sans">
            <main className="max-w-2xl mx-auto px-4 pt-28 pb-20">
                <Suspense fallback={<div className="flex justify-center py-32"><Spinner size="md" /></div>}>
                    <BookingSuccessContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
