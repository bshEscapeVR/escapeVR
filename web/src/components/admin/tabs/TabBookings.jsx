'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Calendar as CalendarIcon, RefreshCw, AlertTriangle, Trash2, RotateCcw, Trash } from 'lucide-react';
import { bookingService } from '../../../services';
import { useBooking } from '../../../context/BookingContext';
import NeonButton from '../../../components/ui/NeonButton';
import Spinner from '../../../components/ui/Spinner';
import BookingModal from '../../../components/BookingModal';
import WeeklyScheduleEditor from '../../../components/admin/WeeklyScheduleEditor';

const TabBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [trashedBookings, setTrashedBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('active'); // 'active' | 'trash'

    const { openBooking } = useBooking();

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, trashRes] = await Promise.all([
                bookingService.getAll(),
                bookingService.getTrash()
            ]);
            setBookings(bookingsRes);
            setTrashedBookings(trashRes);
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

    // פתיחת פופאפ הזמנה עם callback לרענון
    const handleOpenBookingModal = () => {
        openBooking(null, fetchAllData);
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Spinner size="md" />
        </div>
    );

    return (
        <div className="animate-fade-in space-y-6">

            {/* BookingModal - יוצג כשהמנהל לוחץ על הזמנה חדשה */}
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
                            ? 'צפה בכל ההזמנות וצור הזמנות חדשות'
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
                        <NeonButton
                            onClick={handleOpenBookingModal}
                            icon={Plus}
                            variant="primary"
                            className="py-2 px-4 text-sm w-full sm:w-auto"
                        >
                            הזמנה חדשה
                        </NeonButton>
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
                                <p className="text-sm">הזמנות חדשות יופיעו כאן</p>
                            </div>
                            <button onClick={handleOpenBookingModal} className="mt-2 text-brand-primary text-sm hover:underline">
                                צור הזמנה חדשה
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
