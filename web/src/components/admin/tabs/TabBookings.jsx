'use client';

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { Plus, X, Phone, User, Clock, Save, Calendar as CalendarIcon, RefreshCw, AlertTriangle, Trash2, AlertCircle } from 'lucide-react';
import { bookingService, roomService } from '../../../services';
import NeonButton from '../../../components/ui/NeonButton';
import Spinner from '../../../components/ui/Spinner';
import WeeklyScheduleEditor from '../../../components/admin/WeeklyScheduleEditor';
import 'react-calendar/dist/Calendar.css';
import '../../../BookingCalendarOverride.css';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- רכיבי UI פנימיים ---
const AdminInput = ({ label, error, ...props }) => (
    <div className="w-full">
        {label && <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">{label}</label>}
        <input 
            className={`w-full bg-[#0a0310] border rounded-lg p-3 text-white focus:outline-none transition-colors 
                ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-brand-primary'}`}
            {...props} 
        />
        {error && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {error.message}</p>}
    </div>
);

const AdminSelect = ({ label, options, placeholder, error, ...props }) => (
    <div className="w-full">
        {label && <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">{label}</label>}
        <div className="relative">
            <select 
                className={`w-full bg-[#0a0310] border rounded-lg p-3 text-white focus:outline-none transition-colors appearance-none
                    ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-brand-primary'}`}
                {...props}
            >
                <option value="" disabled className="text-gray-500">{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
                ))}
            </select>
            <div className="absolute top-4 left-4 text-gray-400 text-xs pointer-events-none">▼</div>
        </div>
        {error && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {error.message}</p>}
    </div>
);

const TabBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showManualForm, setShowManualForm] = useState(false);

    const manualBookingSchema = z.object({
        roomId: z.string().min(1, "חובה לבחור חדר"),
        date: z.date(),
        timeSlot: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "שעה לא תקינה (HH:MM)"),
        participants: z.number().min(1, "מינימום משתתף אחד").max(20, "מקסימום 20 משתתפים"),
        fullName: z.string().min(2, "שם קצר מדי"),
        phone: z.string().regex(/^05\d-?\d{7}$/, "מספר טלפון לא תקין"),
        email: z.string().email("אימייל לא תקין").or(z.literal('')),
    });

    const { 
        register, 
        handleSubmit, 
        setValue, 
        watch, 
        reset, 
        formState: { errors } 
    } = useForm({
        resolver: zodResolver(manualBookingSchema),
        defaultValues: {
            roomId: '',
            date: new Date(),
            timeSlot: '18:00',
            participants: 2,
            fullName: '',
            phone: '',
            email: ''
        }
    });

    const selectedDate = watch('date');

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        if (rooms.length > 0 && !watch('roomId')) {
            setValue('roomId', rooms[0]._id);
        }
    }, [rooms, setValue, watch]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [roomsRes, bookingsRes] = await Promise.all([
                roomService.getAll(),
                bookingService.getAll()
            ]);
            setRooms(roomsRes);
            setBookings(bookingsRes);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("האם למחוק את ההזמנה לצמיתות?")) return;
        try {
            await bookingService.remove(id);
            setBookings(prev => prev.filter(b => b._id !== id));
        } catch (err) {
            alert("שגיאה במחיקת ההזמנה");
        }
    };

    const onManualSubmit = async (data) => {
        try {
            const newBooking = await bookingService.create({
                roomId: data.roomId,
                date: format(data.date, 'yyyy-MM-dd'),
                timeSlot: data.timeSlot,
                participantsCount: data.participants,
                customer: {
                    fullName: data.fullName,
                    phone: data.phone,
                    email: data.email || 'manual@admin.com'
                },
                source: 'phone'
            });
            
            const roomDetails = rooms.find(r => r._id === data.roomId);
            const bookingForDisplay = { ...newBooking, roomId: roomDetails };
            
            setBookings(prev => [bookingForDisplay, ...prev]);
            alert("ההזמנה נוצרה בהצלחה!");
            
            reset({
                roomId: data.roomId,
                date: data.date,
                timeSlot: '18:00',
                participants: 2,
                fullName: '',
                phone: '',
                email: ''
            });
            
            setShowManualForm(false);
            
        } catch (err) {
            console.error(err);
            alert("שגיאה ביצירת הזמנה");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Spinner size="md" />
        </div>
    );

    return (
        <div className="animate-fade-in space-y-6">

            {/* קומפוננטת ניהול שעות פעילות */}
            <WeeklyScheduleEditor />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
                <div>
                    <h2 className="text-2xl font-bold text-white">ניהול הזמנות</h2>
                    <p className="text-gray-400 text-sm">צפה בכל ההזמנות וצור הזמנות ידניות</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={fetchAllData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="רענן רשימה">
                        <RefreshCw size={20} />
                    </button>
                    <NeonButton 
                        onClick={() => setShowManualForm(!showManualForm)} 
                        icon={showManualForm ? X : Plus} 
                        variant={showManualForm ? "outline" : "primary"}
                        className="py-2 px-4 text-sm w-full sm:w-auto"
                    >
                        {showManualForm ? 'סגור טופס' : 'הזמנה חדשה'}
                    </NeonButton>
                </div>
            </div>

            {showManualForm && (
                <div className="bg-[#1a0b2e] border border-brand-primary/30 p-6 rounded-2xl shadow-2xl animate-fade-in mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-brand-primary"></div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Phone size={20} className="text-brand-primary" /> ניהול הזמנה ידנית
                    </h3>
                    
                    <form onSubmit={handleSubmit(onManualSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-4">
                            <AdminSelect 
                                label="בחירת חדר"
                                placeholder="בחר חדר..."
                                options={rooms.map(r => ({ value: r._id, label: r.title?.he || r.title?.en }))}
                                error={errors.roomId}
                                {...register('roomId')}
                            />
                            <div className="booking-calendar-container">
                                <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">תאריך ההזמנה</label>
                                <Calendar onChange={(date) => setValue('date', date)} value={selectedDate} className="text-sm w-full rounded-lg border-none shadow-none" />
                            </div>
                        </div>
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                            <div className="md:col-span-2">
                                <AdminInput label="שם הלקוח" placeholder="דני דין" error={errors.fullName} {...register('fullName')} />
                            </div>
                            <AdminInput label="טלפון" type="tel" placeholder="050-0000000" error={errors.phone} {...register('phone')} />
                            <AdminInput label="שעה (24H)" type="time" error={errors.timeSlot} {...register('timeSlot')} />
                            <AdminInput label="כמות משתתפים" type="number" error={errors.participants} {...register('participants', { valueAsNumber: true })} />
                             <div className="md:col-span-2 mt-4">
                                <NeonButton type="submit" fullWidth icon={Save}>שמור הזמנה במערכת</NeonButton>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-[#1a0b2e] rounded-xl border border-white/10 overflow-hidden">
                {bookings.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center justify-center gap-4 text-gray-600">
                        <div className="bg-white/5 p-6 rounded-full">
                            <CalendarIcon size={48} className="opacity-40" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-400">אין הזמנות כרגע</h3>
                            <p className="text-sm">הזמנות חדשות מהאתר או הזמנות ידניות יופיעו כאן</p>
                        </div>
                        <button onClick={() => setShowManualForm(true)} className="mt-2 text-brand-primary text-sm hover:underline">
                            צור הזמנה ידנית
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-right min-w-[800px]">
                            <thead className="bg-[#25103a] text-gray-300 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 font-bold">נוצר ב-</th>
                                    <th className="p-4 font-bold">מועד המשחק</th>
                                    <th className="p-4 font-bold">חדר</th>
                                    <th className="p-4 font-bold">לקוח</th>
                                    <th className="p-4 font-bold text-center">משתתפים</th>
                                    <th className="p-4 font-bold">מחיר</th>
                                    <th className="p-4 font-bold">סטטוס</th>
                                    <th className="p-4 font-bold text-center">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {bookings.map((booking) => {
                                    const roomName = booking.roomId?.title?.he || booking.roomId?.title?.en || "חדר לא ידוע";
                                    return (
                                        <tr key={booking._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 text-gray-400 text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white">{format(new Date(booking.createdAt), 'dd/MM/yyyy')}</span>
                                                    <span>{format(new Date(booking.createdAt), 'HH:mm')}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white text-lg">{booking.date ? format(new Date(booking.date), 'dd/MM/yyyy') : '---'}</span>
                                                    <span className="text-brand-primary font-bold">{booking.timeSlot}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-bold block ${!booking.roomId ? 'text-red-400 flex items-center gap-1' : 'text-white'}`}>
                                                    {!booking.roomId && <AlertTriangle size={14}/>} {roomName}
                                                </span>
                                                <span className="text-xs text-gray-500 font-mono">{booking.bookingId}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">{booking.customer?.fullName}</span>
                                                    <a href={`tel:${booking.customer?.phone}`} className="text-xs text-gray-500 hover:text-brand-primary transition-colors">{booking.customer?.phone}</a>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center"><span className="bg-white/5 px-2 py-1 rounded-md">{booking.details?.participantsCount}</span></td>
                                            <td className="p-4 text-green-400 font-bold font-mono">₪{booking.details?.totalPrice}</td>
                                            <td className="p-4"><StatusBadge status={booking.status} /></td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleDelete(booking._id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = { confirmed: "bg-green-500/10 text-green-400 border-green-500/20", pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", cancelled: "bg-red-500/10 text-red-400 border-red-500/20", completed: "bg-blue-500/10 text-blue-400 border-blue-500/20", 'no-show': "bg-gray-700 text-gray-400 border-gray-600" };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>{status}</span>;
};

export default TabBookings;