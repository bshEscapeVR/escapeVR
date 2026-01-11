'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { Plus, X, Phone, Save, Calendar as CalendarIcon, RefreshCw, AlertTriangle, Trash2, AlertCircle, RotateCcw, Trash, Eye, Users } from 'lucide-react';
import { bookingService, roomService, pricingService } from '../../../services';
import { useBooking } from '../../../context/BookingContext';
import { useSettings } from '../../../context/SettingsContext';
import NeonButton from '../../../components/ui/NeonButton';
import Spinner from '../../../components/ui/Spinner';
import BookingModal from '../../../components/BookingModal';
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
    const [trashedBookings, setTrashedBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [pricingPlans, setPricingPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showManualForm, setShowManualForm] = useState(false);
    const [viewMode, setViewMode] = useState('active'); // 'active' | 'trash'
    const [calculatedPrice, setCalculatedPrice] = useState(0);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const { openBooking } = useBooking();
    const { getImg } = useSettings();

    // סכמת ולידציה בסיסית - המגבלות הדינמיות יבדקו בנפרד
    const manualBookingSchema = z.object({
        roomId: z.string().min(1, "חובה לבחור חדר"),
        date: z.date(),
        timeSlot: z.string().min(1, "חובה לבחור שעה"),
        participants: z.number().min(1, "מינימום משתתף אחד"),
        fullName: z.string().min(2, "השם קצר מדי (מינימום 2 תווים)"),
        phone: z.string().regex(/^05\d-?\d{7}$/, "מספר טלפון לא תקין (05X-XXXXXXX)"),
        email: z.string().email("כתובת אימייל לא תקינה").or(z.literal('')),
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
            timeSlot: '',
            participants: 2,
            fullName: '',
            phone: '',
            email: ''
        }
    });

    const selectedDate = watch('date');
    const selectedRoomId = watch('roomId');
    const participants = watch('participants');

    // החדר הנבחר
    const selectedRoom = useMemo(() => {
        return rooms.find(r => r._id === selectedRoomId);
    }, [rooms, selectedRoomId]);

    // חישוב מחיר דינמי לפי כרטיסי המחיר (מקור האמת היחיד)
    useEffect(() => {
        if (!participants || pricingPlans.length === 0) {
            setCalculatedPrice(0);
            return;
        }

        // חיפוש כרטיס מחיר מתאים לפי מספר המשתתפים
        const matchingPlan = pricingPlans.find(plan => plan.players === participants && plan.isActive);

        if (matchingPlan) {
            // המחיר הסופי = מחיר לאדם * מספר משתתפים
            setCalculatedPrice(matchingPlan.newPrice * participants);
        } else {
            // אם אין כרטיס מחיר מתאים, מציגים 0 (המנהל צריך להוסיף כרטיס)
            setCalculatedPrice(0);
        }
    }, [participants, pricingPlans]);

    // עדכון משתתפים כשמשנים חדר
    useEffect(() => {
        if (selectedRoom) {
            const currentParticipants = watch('participants');
            const min = selectedRoom.features?.minPlayers || 1;
            const max = selectedRoom.features?.maxPlayers || 10;

            if (currentParticipants < min) {
                setValue('participants', min);
            } else if (currentParticipants > max) {
                setValue('participants', max);
            }
        }
    }, [selectedRoom, setValue, watch]);

    // טעינת שעות פנויות כשמשנים חדר או תאריך
    useEffect(() => {
        const fetchSlots = async () => {
            if (!selectedRoomId || !selectedDate) {
                setAvailableSlots([]);
                return;
            }

            setLoadingSlots(true);
            setValue('timeSlot', ''); // איפוס שעה נבחרת

            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const slots = await bookingService.getAvailableSlots(selectedRoomId, dateStr);
                setAvailableSlots(slots || []);
            } catch (err) {
                console.error("Error fetching slots:", err);
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedRoomId, selectedDate, setValue]);

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
            const [roomsRes, bookingsRes, trashRes, pricingRes] = await Promise.all([
                roomService.getAll(),
                bookingService.getAll(),
                bookingService.getTrash(),
                pricingService.getAll()
            ]);
            setRooms(roomsRes);
            setBookings(bookingsRes);
            setTrashedBookings(trashRes);
            setPricingPlans(pricingRes);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // מחיקה רכה - העברה לפח
    const handleDelete = async (id) => {
        if (!window.confirm("האם להעביר את ההזמנה לפח?")) return;
        try {
            await bookingService.remove(id);
            const deletedBooking = bookings.find(b => b._id === id);
            setBookings(prev => prev.filter(b => b._id !== id));
            if (deletedBooking) {
                setTrashedBookings(prev => [{ ...deletedBooking, deletedAt: new Date() }, ...prev]);
            }
        } catch (err) {
            alert("שגיאה במחיקת ההזמנה");
        }
    };

    // שחזור מהפח
    const handleRestore = async (id) => {
        try {
            const restored = await bookingService.restore(id);
            setTrashedBookings(prev => prev.filter(b => b._id !== id));
            setBookings(prev => [restored, ...prev]);
        } catch (err) {
            alert("שגיאה בשחזור ההזמנה");
        }
    };

    // מחיקה לצמיתות
    const handlePermanentDelete = async (id) => {
        if (!window.confirm("האם למחוק את ההזמנה לצמיתות? פעולה זו בלתי הפיכה!")) return;
        try {
            await bookingService.permanentDelete(id);
            setTrashedBookings(prev => prev.filter(b => b._id !== id));
        } catch (err) {
            alert("שגיאה במחיקה");
        }
    };

    // ריקון הפח
    const handleEmptyTrash = async () => {
        if (!window.confirm(`האם לרוקן את הפח? ${trashedBookings.length} הזמנות יימחקו לצמיתות!`)) return;
        try {
            await bookingService.emptyTrash();
            setTrashedBookings([]);
        } catch (err) {
            alert("שגיאה בריקון הפח");
        }
    };

    // פתיחת פופאפ הזמנה ללקוחות (לצפייה)
    const handleOpenCustomerBookingModal = () => {
        openBooking(null, fetchAllData);
    };

    const onManualSubmit = async (data) => {
        // ולידציה נוספת לפי החדר הנבחר
        if (selectedRoom) {
            const min = selectedRoom.features?.minPlayers || 1;
            const max = selectedRoom.features?.maxPlayers || 10;
            if (data.participants < min || data.participants > max) {
                alert(`מספר משתתפים חייב להיות בין ${min} ל-${max}`);
                return;
            }
        }

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
                totalPrice: calculatedPrice,
                source: 'phone'
            });

            const roomDetails = rooms.find(r => r._id === data.roomId);
            const bookingForDisplay = { ...newBooking, roomId: roomDetails };

            setBookings(prev => [bookingForDisplay, ...prev]);
            alert("ההזמנה נוצרה בהצלחה!");

            reset({
                roomId: data.roomId,
                date: data.date,
                timeSlot: '',
                participants: selectedRoom?.features?.minPlayers || 2,
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

    // מגבלות החדר הנבחר
    const minPlayers = selectedRoom?.features?.minPlayers || 1;
    const maxPlayers = selectedRoom?.features?.maxPlayers || 10;

    return (
        <div className="animate-fade-in space-y-6">

            {/* BookingModal - פופאפ הזמנה ללקוחות */}
            <BookingModal />

            {/* קומפוננטת ניהול שעות פעילות */}
            <WeeklyScheduleEditor />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        {viewMode === 'active' ? 'ניהול הזמנות' : 'פח הזמנות'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {viewMode === 'active'
                            ? 'צפה בכל ההזמנות וצור הזמנות ידניות'
                            : 'הזמנות שנמחקו - ניתן לשחזר או למחוק לצמיתות'}
                    </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto flex-wrap">
                    <button onClick={fetchAllData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="רענן רשימה">
                        <RefreshCw size={20} />
                    </button>

                    {/* כפתור מעבר בין תצוגות */}
                    <button
                        onClick={() => setViewMode(viewMode === 'active' ? 'trash' : 'active')}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                            viewMode === 'trash'
                                ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                        }`}
                        title={viewMode === 'active' ? 'צפה בפח' : 'חזור להזמנות'}
                    >
                        <Trash size={18} />
                        {trashedBookings.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {trashedBookings.length}
                            </span>
                        )}
                    </button>

                    {viewMode === 'active' && (
                        <>
                            {/* כפתור צפייה בפופאפ לקוחות */}
                            <button
                                onClick={handleOpenCustomerBookingModal}
                                className="p-2 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-cyan-500/30"
                                title="צפה בפופאפ הזמנה ללקוחות"
                            >
                                <Eye size={18} />
                                הזמנה ללקוחות
                            </button>

                            {/* כפתור הזמנה ידנית */}
                            <NeonButton
                                onClick={() => setShowManualForm(!showManualForm)}
                                icon={showManualForm ? X : Plus}
                                variant={showManualForm ? "outline" : "primary"}
                                className="py-2 px-4 text-sm w-full sm:w-auto"
                            >
                                {showManualForm ? 'סגור טופס' : 'הזמנה חדשה'}
                            </NeonButton>
                        </>
                    )}

                    {viewMode === 'trash' && trashedBookings.length > 0 && (
                        <button
                            onClick={handleEmptyTrash}
                            className="p-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-red-500/30"
                        >
                            <Trash2 size={18} />
                            רוקן פח
                        </button>
                    )}
                </div>
            </div>

            {/* טופס הזמנה ידנית עם ולידציות משודרגות */}
            {showManualForm && viewMode === 'active' && (
                <div className="bg-[#1a0b2e] border border-brand-primary/30 p-6 rounded-2xl shadow-2xl animate-fade-in mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-brand-primary"></div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Phone size={20} className="text-brand-primary" /> הזמנה ידנית (טלפונית)
                    </h3>

                    <form onSubmit={handleSubmit(onManualSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* צד שמאל - בחירת חדר, לוח שנה ותמונה */}
                        <div className="lg:col-span-4 space-y-4">
                            <AdminSelect
                                label="בחירת חדר"
                                placeholder="בחר חדר..."
                                options={rooms.map(r => ({ value: r._id, label: r.title?.he || r.title?.en }))}
                                error={errors.roomId}
                                {...register('roomId')}
                            />

                            {/* תמונת החדר */}
                            {selectedRoom && (
                                <div className="relative rounded-xl overflow-hidden border border-white/10">
                                    <img
                                        src={getImg(selectedRoom.images?.main)}
                                        alt={selectedRoom.title?.he || selectedRoom.title?.en}
                                        className="w-full h-40 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <h4 className="text-white font-bold">{selectedRoom.title?.he || selectedRoom.title?.en}</h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-300 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Users size={12} />
                                                {minPlayers}-{maxPlayers} משתתפים
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="booking-calendar-container">
                                <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">תאריך ההזמנה</label>
                                <Calendar onChange={(date) => setValue('date', date)} value={selectedDate} minDate={new Date()} className="text-sm w-full rounded-lg border-none shadow-none" />
                            </div>
                        </div>

                        {/* צד ימין - פרטי ההזמנה */}
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                            <div className="md:col-span-2">
                                <AdminInput label="שם הלקוח" placeholder="דני דין" error={errors.fullName} {...register('fullName')} />
                            </div>
                            <AdminInput label="טלפון" type="tel" placeholder="050-0000000" error={errors.phone} {...register('phone')} />
                            <AdminInput label="אימייל (אופציונלי)" type="email" placeholder="example@mail.com" error={errors.email} {...register('email')} />

                            {/* בחירת שעה מתוך רבועים */}
                            <div className="md:col-span-2">
                                <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">בחירת שעה</label>
                                {loadingSlots ? (
                                    <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                                        <RefreshCw size={16} className="animate-spin" />
                                        טוען שעות פנויות...
                                    </div>
                                ) : availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                                        {availableSlots.map(slot => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => setValue('timeSlot', slot, { shouldValidate: true })}
                                                className={`py-2 px-1 text-sm rounded-lg border transition-all
                                                    ${watch('timeSlot') === slot
                                                        ? 'bg-brand-primary border-brand-primary text-white shadow-[0_0_10px_#a855f7]'
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm py-4">
                                        {selectedRoomId ? 'אין שעות פנויות בתאריך זה' : 'בחר חדר ותאריך כדי לראות שעות'}
                                    </p>
                                )}
                                {errors.timeSlot && (
                                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle size={10}/> {errors.timeSlot.message}
                                    </p>
                                )}
                            </div>

                            {/* בחירת משתתפים דינמית */}
                            <div className="w-full">
                                <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">
                                    כמות משתתפים ({minPlayers}-{maxPlayers})
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {selectedRoom && [...Array(maxPlayers - minPlayers + 1).keys()].map(i => {
                                        const num = i + minPlayers;
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
                                            >
                                                {num}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.participants && (
                                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle size={10}/> {errors.participants.message}
                                    </p>
                                )}
                            </div>

                            {/* תצוגת מחיר */}
                            {selectedRoom && (
                                <div className={`md:col-span-2 border rounded-xl p-4 ${calculatedPrice > 0 ? 'bg-white/5 border-white/10' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">מחיר סופי:</span>
                                        {calculatedPrice > 0 ? (
                                            <span className="text-2xl font-bold text-green-400">₪{calculatedPrice}</span>
                                        ) : (
                                            <span className="text-lg font-bold text-yellow-400">לא הוגדר מחיר</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {calculatedPrice > 0
                                            ? `מחושב אוטומטית לפי כרטיס מחיר ל-${participants} משתתפים`
                                            : `יש להוסיף כרטיס מחיר ל-${participants} משתתפים בטאב "כרטיסי מחירים"`
                                        }
                                    </p>
                                </div>
                            )}

                            <div className="md:col-span-2 mt-4">
                                <NeonButton type="submit" fullWidth icon={Save}>שמור הזמנה במערכת</NeonButton>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* תצוגת הזמנות פעילות */}
            {viewMode === 'active' && (
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
                                                    <button onClick={() => handleDelete(booking._id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="העבר לפח"><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* תצוגת פח */}
            {viewMode === 'trash' && (
                <div className="bg-[#1a0b2e] rounded-xl border border-red-500/20 overflow-hidden">
                    {trashedBookings.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center justify-center gap-4 text-gray-600">
                            <div className="bg-white/5 p-6 rounded-full">
                                <Trash size={48} className="opacity-40" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-400">הפח ריק</h3>
                                <p className="text-sm">הזמנות שתמחקו יופיעו כאן</p>
                            </div>
                            <button onClick={() => setViewMode('active')} className="mt-2 text-brand-primary text-sm hover:underline">
                                חזור להזמנות
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-right min-w-[800px]">
                                <thead className="bg-red-900/20 text-gray-300 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 font-bold">נמחק ב-</th>
                                        <th className="p-4 font-bold">מועד המשחק</th>
                                        <th className="p-4 font-bold">חדר</th>
                                        <th className="p-4 font-bold">לקוח</th>
                                        <th className="p-4 font-bold text-center">משתתפים</th>
                                        <th className="p-4 font-bold">מחיר</th>
                                        <th className="p-4 font-bold text-center">פעולות</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {trashedBookings.map((booking) => {
                                        const roomName = booking.roomId?.title?.he || booking.roomId?.title?.en || "חדר לא ידוע";
                                        return (
                                            <tr key={booking._id} className="hover:bg-white/5 transition-colors group opacity-70 hover:opacity-100">
                                                <td className="p-4 text-gray-400 text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-red-400">{booking.deletedAt ? format(new Date(booking.deletedAt), 'dd/MM/yyyy') : '---'}</span>
                                                        <span>{booking.deletedAt ? format(new Date(booking.deletedAt), 'HH:mm') : ''}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white text-lg">{booking.date ? format(new Date(booking.date), 'dd/MM/yyyy') : '---'}</span>
                                                        <span className="text-gray-500 font-bold">{booking.timeSlot}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-bold block text-gray-400">{roomName}</span>
                                                    <span className="text-xs text-gray-500 font-mono">{booking.bookingId}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-400 font-medium">{booking.customer?.fullName}</span>
                                                        <span className="text-xs text-gray-500">{booking.customer?.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center"><span className="bg-white/5 px-2 py-1 rounded-md text-gray-400">{booking.details?.participantsCount}</span></td>
                                                <td className="p-4 text-gray-500 font-bold font-mono">₪{booking.details?.totalPrice}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleRestore(booking._id)}
                                                            className="p-2 text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                                            title="שחזר הזמנה"
                                                        >
                                                            <RotateCcw size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePermanentDelete(booking._id)}
                                                            className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="מחק לצמיתות"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = { confirmed: "bg-green-500/10 text-green-400 border-green-500/20", pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", cancelled: "bg-red-500/10 text-red-400 border-red-500/20", completed: "bg-blue-500/10 text-blue-400 border-blue-500/20", 'no-show': "bg-gray-700 text-gray-400 border-gray-600" };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>{status}</span>;
};

export default TabBookings;
