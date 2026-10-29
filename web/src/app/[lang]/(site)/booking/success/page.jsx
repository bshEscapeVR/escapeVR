'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../../../context/SettingsContext';
import NeonButton from '../../../../../components/ui/NeonButton';
import Spinner from '../../../../../components/ui/Spinner';
import Footer from '../../../../../components/Footer';
import BookingConfirmation from '../../../../../components/BookingConfirmation';
import { bookingService, paymentService } from '../../../../../services';

const VERIFY_ATTEMPTS = 5;      // Sumit לפעמים צריך רגע לרשום את התשלום
const VERIFY_INTERVAL_MS = 3000;
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// הודעה במקום פרטי ההזמנה (ממתין לתשלום / הזמן עבר / שולם אך השעה נתפסה)
const StatusPanel = ({ icon: Icon, iconClass, title, text, children }) => (
    <div className="glass-panel rounded-3xl p-10 text-center border border-white/10">
        <Icon size={64} className={`${iconClass} mx-auto mb-4`} />
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h1>
        <p className="text-gray-300 mb-8 leading-relaxed">{text}</p>
        <div className="flex flex-wrap gap-3 justify-center">{children}</div>
    </div>
);

// דף מעבר אחרי הזמנה / תשלום - מציג את פרטי ההזמנה לפי ?id=<bookingId>
// בחזרה מ-Sumit מצורף OG-PaymentID - השרת בודק מול Sumit שהתשלום באמת עבר
const BookingSuccessContent = () => {
    const { t } = useTranslation();
    const { language } = useSettings();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('id');
    const paymentId = searchParams.get('OG-PaymentID');
    const cancelled = searchParams.get('cancelled') === '1';

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(Boolean(bookingId));
    const [retrying, setRetrying] = useState(false);
    const [retryError, setRetryError] = useState(false);

    useEffect(() => {
        if (!bookingId) return;
        let active = true;

        const load = async () => {
            try {
                let current = await bookingService.getPublic(bookingId);
                // ממתין לתשלום - בודקים מול Sumit (כמה ניסיונות כשחזרנו עם מזהה תשלום)
                const awaitingPayment = (b) => b?.status === 'pending' || (paymentId && b?.paymentStatus === 'expired');
                // לחץ "ביטול" בדף התשלום - משחררים את השעה מיד (השרת מאשר במקום אם בכל זאת שולם)
                if (cancelled && current?.status === 'pending') {
                    await paymentService.cancel(bookingId).catch(() => null);
                    current = await bookingService.getPublic(bookingId);
                }
                if (awaitingPayment(current) && !cancelled) {
                    const attempts = paymentId ? VERIFY_ATTEMPTS : 1;
                    for (let i = 0; i < attempts && active; i++) {
                        await paymentService.verify(bookingId, paymentId).catch(() => null);
                        current = await bookingService.getPublic(bookingId);
                        if (!awaitingPayment(current) || current.paymentStatus === 'paid') break;
                        if (i < attempts - 1) await wait(VERIFY_INTERVAL_MS);
                    }
                }
                if (active) setBooking(current);
            } catch (err) {
                console.error('Error fetching booking:', err);
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => { active = false; };
    }, [bookingId, paymentId, cancelled]);

    // חזרה לדף התשלום (כל עוד השעה שמורה)
    const handleRetry = async () => {
        setRetrying(true);
        setRetryError(false);
        try {
            const { paymentUrl } = await paymentService.retry(bookingId, language);
            window.location.href = paymentUrl;
        } catch {
            setRetryError(true);
            setRetrying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center gap-4 py-32">
                <Spinner size="md" />
                {paymentId && <p className="text-gray-400 text-sm">{t('booking_success.verifying')}</p>}
            </div>
        );
    }

    const homeButton = <Link href={`/${language}`}><NeonButton>{t('booking_success.btn_home')}</NeonButton></Link>;

    if (!booking) {
        return <StatusPanel icon={AlertCircle} iconClass="text-red-400" title={t('booking_success.not_found')} text="">{homeButton}</StatusPanel>;
    }

    // שולם אחרי שהשעה שוחררה ונתפסה - בעל העסק קיבל התראה ויחזור ללקוח
    if (booking.paymentNeedsAttention) {
        const rows = [
            [t('booking_success.label_id'), <span key="id" dir="ltr">{booking.bookingId}</span>],
            [t('booking_success.label_date'), format(new Date(booking.date), 'dd/MM/yyyy')],
            [t('booking_success.label_requested_time'), <span key="time" dir="ltr">{booking.timeSlot}</span>],
            [t('booking_success.label_participants'), booking.participantsCount],
            [t('booking_success.label_paid'), `₪${booking.paidAmount ?? booking.totalPrice}`],
        ];
        return (
            <StatusPanel icon={CheckCircle} iconClass="text-yellow-300" title={t('booking_success.attention_title')} text={t('booking_success.attention_text')}>
                <div className="w-full bg-black/20 rounded-2xl px-5 py-2 mb-4 text-start">
                    {rows.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
                            <span className="text-gray-400">{label}</span>
                            <span className="text-white font-bold">{value}</span>
                        </div>
                    ))}
                </div>
                {homeButton}
            </StatusPanel>
        );
    }

    // עדיין לא שולם - השעה שמורה עד expiresAt
    if (booking.status === 'pending') {
        const until = booking.paymentExpiresAt ? format(new Date(booking.paymentExpiresAt), 'HH:mm') : '';
        return (
            <StatusPanel icon={Clock} iconClass="text-yellow-300" title={t('booking_success.pending_title')} text={t('booking_success.pending_text', { time: until })}>
                <NeonButton onClick={handleRetry} disabled={retrying}>
                    {retrying ? t('booking_modal.btn_redirecting') : t('booking_success.btn_pay_again')}
                </NeonButton>
                {retryError && <p className="w-full text-red-400 text-sm">{t('booking_success.retry_error')}</p>}
            </StatusPanel>
        );
    }

    // בוטל בדף התשלום / לא שולם בזמן - השעה שוחררה
    if (booking.status === 'cancelled' && ['expired', 'failed'].includes(booking.paymentStatus)) {
        return (
            <StatusPanel
                icon={AlertCircle}
                iconClass="text-red-400"
                title={t(cancelled ? 'booking_success.cancelled_title' : 'booking_success.expired_title')}
                text={t(cancelled ? 'booking_success.cancelled_text' : 'booking_success.expired_text')}
            >
                {homeButton}
            </StatusPanel>
        );
    }

    return (
        <div className="glass-panel rounded-3xl p-6 md:p-10 border border-white/10">
            <BookingConfirmation booking={booking} />

            <div className="flex justify-center">{homeButton}</div>
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
