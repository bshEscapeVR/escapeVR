'use client';

import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, Calendar, Clock, Users, CreditCard, Hash, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';

const DetailRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
        <span className="flex items-center gap-2 text-gray-400"><Icon size={16} className="text-brand-primary" /> {label}</span>
        <span className="text-white font-bold text-end">{value}</span>
    </div>
);

/**
 * אישור הזמנה עם כל הפרטים - משותף לדף האישור של הלקוח ולחלון ההזמנה בפאנל הניהול.
 * booking במבנה של GET /bookings/public/:bookingId:
 * { bookingId, date, timeSlot, roomTitle, participantsCount, totalPrice, paymentStatus, customerName }
 */
const BookingConfirmation = ({ booking }) => {
    const { t } = useTranslation();
    const { t: tDB, settings } = useSettings();

    const isPaid = booking.paymentStatus === 'paid';
    const phone = settings?.general?.contactPhone;

    return (
        <>
            <div className="text-center mb-8">
                <CheckCircle size={72} className="text-green-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(74,222,128,0.4)]" />
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {isPaid ? t('booking_success.title_paid') : t('booking_success.title')}
                </h1>
                <p className="text-gray-300">
                    {t('booking_success.subtitle', { name: booking.customerName || '' })}
                </p>
            </div>

            <div className="bg-black/20 rounded-2xl px-5 py-2 mb-6 text-start">
                <DetailRow icon={Hash} label={t('booking_success.label_id')} value={<span dir="ltr">{booking.bookingId}</span>} />
                {booking.roomTitle && <DetailRow icon={MapPin} label={t('booking_success.label_room')} value={tDB(booking.roomTitle)} />}
                <DetailRow icon={Calendar} label={t('booking_success.label_date')} value={format(new Date(booking.date), 'dd/MM/yyyy')} />
                <DetailRow icon={Clock} label={t('booking_success.label_time')} value={<span dir="ltr">{booking.timeSlot}</span>} />
                <DetailRow icon={Users} label={t('booking_success.label_participants')} value={booking.participantsCount} />
                <DetailRow icon={CreditCard} label={t('booking_success.label_total')} value={`₪${booking.totalPrice}`} />
                <DetailRow
                    icon={CreditCard}
                    label={t('booking_success.label_payment')}
                    value={isPaid
                        ? <span className="text-green-400">{t('booking_success.payment_paid')}</span>
                        : <span className="text-yellow-300">{t('booking_success.payment_on_site')}</span>}
                />
            </div>

            <p className="text-gray-400 text-sm text-center mb-8">
                {t('booking_success.email_note')}
                {phone && <> {t('booking_success.phone_note')} <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} dir="ltr" className="text-brand-primary hover:underline">{phone}</a></>}
            </p>
        </>
    );
};

export default BookingConfirmation;
