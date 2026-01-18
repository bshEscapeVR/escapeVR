'use client';

import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { X, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../context/BookingContext';
import { useSettings } from '../context/SettingsContext';
import NeonButton from './ui/NeonButton';
import BookingModalSkeleton from './ui/BookingModalSkeleton';
import { bookingService, roomService, pricingService } from '../services';
import 'react-calendar/dist/Calendar.css';
import '../BookingCalendarOverride.css';

// 1. ייבוא ספריות הולידציה
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- רכיב Input פנימי לשימוש חוזר עם שגיאות ---
const FormInput = ({ placeholder, error, ...props }) => (
    <div className="w-full">
        <input 
            className={`w-full bg-[#0f0518] border rounded-xl p-3 outline-none transition-colors 
                ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-brand-primary'}`}
            placeholder={placeholder}
            {...props} 
        />
        {error && <p className="text-red-400 text-xs mt-1 ms-1 flex items-center gap-1"><AlertCircle size={10}/> {error.message}</p>}
    </div>
);

const BookingModal = () => {
  const { isOpen, closeBooking, preSelectedRoomId, handleSuccess } = useBooking();
  const { t } = useTranslation();
  const { t: tDB, getImg } = useSettings();
  
  const [rooms, setRooms] = useState([]);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingStatus, setBookingStatus] = useState('idle');
  const [totalPrice, setTotalPrice] = useState(0);

  // 2. הגדרת סכמת הולידציה (Rules)
  const schema = z.object({
      roomId: z.string().min(1, t('booking_modal.err_room_required')),
      date: z.date(),
      timeSlot: z.string().min(1, t('booking_modal.err_time_required')),
      participants: z.number().min(1),
      fullName: z.string().min(2, t('booking_modal.err_name_short')),
      // ולידציה למספר ישראלי תקין (מתחיל ב-05, מכיל 10 ספרות, עם או בלי מקף)
      phone: z.string().regex(/^05\d-?\d{7}$/, t('booking_modal.err_phone_invalid')),
      email: z.string().email(t('booking_modal.err_email_invalid'))
  });

  // 3. אתחול הטופס
  const { 
      register, 
      handleSubmit, 
      setValue, 
      watch, 
      reset, 
      formState: { errors } 
  } = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
          roomId: '',
          date: new Date(),
          timeSlot: '',
          participants: 2,
          fullName: '',
          phone: '',
          email: ''
      }
  });

  // משתנים "חיים" למעקב אחרי שינויים (במקום State רגיל)
  const selectedRoomId = watch('roomId');
  const selectedDate = watch('date');
  const selectedSlot = watch('timeSlot');
  const participants = watch('participants');

  // טעינת חדרים וכרטיסי מחירים
  useEffect(() => {
    if (isOpen) {
        setBookingStatus('idle');
        Promise.all([
            roomService.getAll(),
            pricingService.getAll()
        ]).then(([roomsData, pricingData]) => {
            setRooms(roomsData);
            setPricingPlans(pricingData);
            if (preSelectedRoomId) {
                setValue('roomId', preSelectedRoomId);
            } else if (roomsData.length > 0 && !selectedRoomId) {
                setValue('roomId', roomsData[0]._id);
            }
        }).catch(console.error);
    }
  }, [isOpen, preSelectedRoomId]);

  const selectedRoom = rooms.find(r => r._id === selectedRoomId);

  // בדיקת מינימום משתתפים כשמשנים חדר
  useEffect(() => {
    if (!selectedRoom) return;

    if (participants < selectedRoom.features.minPlayers) {
        setValue('participants', selectedRoom.features.minPlayers);
    }
  }, [selectedRoom, participants, setValue]);

  // חישוב מחיר לפי כרטיסי המחיר (מקור האמת היחיד)
  useEffect(() => {
    if (!participants || pricingPlans.length === 0) {
        setTotalPrice(0);
        return;
    }

    // חיפוש כרטיס מחיר מתאים לפי מספר המשתתפים
    const matchingPlan = pricingPlans.find(plan => plan.players === participants && plan.isActive);

    if (matchingPlan) {
        // המחיר הסופי = מחיר לאדם * מספר משתתפים
        setTotalPrice(matchingPlan.newPrice * participants);
    } else {
        setTotalPrice(0);
    }
  }, [participants, pricingPlans]);

  // טעינת שעות פנויות
  useEffect(() => {
    if (!selectedRoomId || !selectedDate) return;

    const fetchSlots = async () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        try {
            const slots = await bookingService.getAvailableSlots(selectedRoomId, dateStr);
            setAvailableSlots(slots || []);
        } catch (err) {
            console.error("Error fetching slots:", err);
        }
    };

    fetchSlots();
  }, [selectedRoomId, selectedDate]);

  // שליחת הטופס (נקרא רק אם הולידציה עברה)
  const onSubmit = async (data) => {
      setBookingStatus('loading');
      try {
          await bookingService.create({
              roomId: data.roomId,
              date: format(data.date, 'yyyy-MM-dd'),
              timeSlot: data.timeSlot,
              participantsCount: data.participants,
              customer: {
                  fullName: data.fullName,
                  phone: data.phone,
                  email: data.email
              },
              totalPrice: totalPrice
          });
          setBookingStatus('success');
          handleSuccess(); // קריאה ל-callback אם קיים (לרענון רשימת הזמנות באדמין)
      } catch (err) {
          setBookingStatus('error');
      }
  };

  const handleClose = () => {
      reset(); // איפוס הטופס
      closeBooking();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>
      
      <div className="glass-panel relative w-full max-w-4xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto flex flex-col md:flex-row shadow-2xl animate-fade-in">
        
        {/* כפתור סגירה תומך RTL */}
        <button 
            onClick={handleClose} 
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20 p-2 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors"
        >
            <X size={20} />
        </button>

        {bookingStatus === 'success' ? (
             <div className="w-full p-12 flex flex-col items-center justify-center text-center text-white bg-brand-card">
                <CheckCircle size={80} className="text-green-400 mb-6" />
                <h2 className="text-3xl font-bold mb-2">{t('booking_modal.success_title')}</h2>
                <p className="text-gray-300 mb-6">{t('booking_modal.success_desc')}</p>
                <NeonButton onClick={handleClose}>{t('booking_modal.btn_close')}</NeonButton>
             </div>
        ) : rooms.length === 0 ? (
            <BookingModalSkeleton />
        ) : (
        <>
            {/* צד ימין/שמאל - פרטי ההזמנה */}
            <div className="md:w-1/3 bg-black/20 p-6 border-l rtl:border-r rtl:border-l-0 border-white/5 flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-white mb-2">{t('booking_modal.details_title')}</h2>
                
                <div className="mb-4">
                    <label className="text-gray-400 text-sm block mb-1">{t('booking_modal.label_room')}</label>
                    <div className="relative">
                        <select 
                            className="w-full bg-[#0f0518] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-brand-primary appearance-none"
                            {...register('roomId')} // חיבור ל-Hook Form
                        >
                            {rooms.map(r => (
                                <option key={r._id} value={r._id} className="text-white bg-[#1a0b2e]">
                                    {tDB(r.title)}
                                </option>
                            ))}
                        </select>
                        <div className="absolute top-4 left-4 pointer-events-none rtl:right-auto rtl:left-4 ltr:right-4 ltr:left-auto text-gray-500 text-xs">▼</div>
                    </div>
                    {errors.roomId && <p className="text-red-400 text-xs mt-1">{errors.roomId.message}</p>}
                </div>

                {selectedRoom && (
                    <>
                        <img src={getImg(selectedRoom.images?.main)} alt="" className="rounded-lg h-32 w-full object-cover mb-2 border border-white/10" />
                        <div className="space-y-3 text-sm text-gray-300 bg-white/5 p-4 rounded-xl">
                            <div className="flex justify-between border-b border-white/5 pb-2"><span>{t('booking_modal.label_participants')}</span> <span>{participants}</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-2"><span>{t('booking_modal.label_date')}</span> <span>{format(selectedDate, 'dd/MM/yyyy')}</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-2"><span>{t('booking_modal.label_time')}</span> <span className="text-brand-primary font-bold">{selectedSlot || '--:--'}</span></div>
                            <div className="flex justify-between text-lg font-bold text-white pt-1"><span>{t('booking_modal.label_total')}</span> <span>₪{totalPrice}</span></div>
                        </div>
                    </>
                )}
            </div>

            {/* צד שמאל/ימין - הטופס */}
            <div className="md:w-2/3 p-6 text-white bg-brand-card/50">
                <div className="mb-6">
                    <h3 className="flex items-center gap-2 font-bold mb-3 text-brand-primary"><Clock size={18}/> {t('booking_modal.title_when')}</h3>
                    <div className="flex flex-col gap-4">
                        <div className="booking-calendar-container w-full">
                             <Calendar 
                                onChange={(date) => setValue('date', date)} 
                                value={selectedDate} 
                                minDate={new Date()} 
                                className="text-sm w-full" 
                             />
                        </div>

                        <div className="w-full">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                                {availableSlots.length > 0 ? availableSlots.map(slot => (
                                    <button
                                        key={slot}
                                        type="button" // חשוב כדי לא לשלוח טופס
                                        onClick={() => setValue('timeSlot', slot, { shouldValidate: true })}
                                        className={`py-2 px-1 text-sm rounded-lg border transition-all 
                                            ${selectedSlot === slot 
                                                ? 'bg-brand-primary border-brand-primary text-white shadow-[0_0_10px_#a855f7]' 
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                            }`}
                                    >
                                        {slot}
                                    </button>
                                )) : <p className="text-xs text-gray-500 col-span-3 text-center py-4">{t('booking_modal.no_slots')}</p>}
                            </div>
                            {errors.timeSlot && <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle size={10}/> {errors.timeSlot.message}</p>}
                        </div>
                    </div>
                </div>

                {selectedRoom && (
                <div className="mb-6">
                    <h3 className="flex items-center gap-2 font-bold mb-3 text-brand-primary"><Users size={18}/> {t('booking_modal.title_how_many')}</h3>
                    <div className="flex gap-2 flex-wrap">
                         {[...Array(selectedRoom.features.maxPlayers - selectedRoom.features.minPlayers + 1).keys()].map(i => {
                            const num = i + selectedRoom.features.minPlayers;
                            return (
                                <button 
                                    key={num} 
                                    type="button"
                                    onClick={() => setValue('participants', num)}
                                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold transition-all 
                                        ${participants === num 
                                            ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/30' 
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >{num}</button>
                            );
                        })}
                    </div>
                </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <FormInput 
                            placeholder={t('booking_modal.placeholder_name')} 
                            error={errors.fullName}
                            {...register('fullName')}
                        />
                        <FormInput 
                            placeholder={t('booking_modal.placeholder_phone')} 
                            error={errors.phone}
                            {...register('phone')}
                        />
                    </div>
                    <FormInput 
                        placeholder={t('booking_modal.placeholder_email')} 
                        error={errors.email}
                        {...register('email')}
                    />
                    
                    <div className="mt-2">
                        <NeonButton type="submit" disabled={bookingStatus === 'loading'} className="w-full">
                            {bookingStatus === 'loading' ? t('booking_modal.btn_sending') : t('booking_modal.btn_confirm')}
                        </NeonButton>
                        {bookingStatus === 'error' && <p className="text-red-400 text-center text-sm mt-2">{t('booking_modal.error_create')}</p>}
                    </div>
                </form>
            </div>
        </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;