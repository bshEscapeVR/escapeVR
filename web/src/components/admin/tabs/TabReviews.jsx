'use client';

import React, { useEffect, useState } from 'react';
import { Star, Check, X, Trash2, Quote, Calendar, RefreshCw, ExternalLink } from 'lucide-react';
import { reviewService } from '../../../services';
import Spinner from '../../../components/ui/Spinner';
import { format } from 'date-fns';

const TabReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const data = await reviewService.getAll();
            setReviews(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleApproval = async (review) => {
        try {
            const updatedReviews = reviews.map(r => 
                r._id === review._id ? { ...r, isApproved: !r.isApproved } : r
            );
            setReviews(updatedReviews);
            await reviewService.toggleApproval(review._id);
        } catch (err) {
            console.error(err);
            fetchReviews();
        }
    };

    const syncGoogle = async () => {
        setSyncing(true);
        setSyncMessage(null);
        try {
            const { added } = await reviewService.syncGoogle();
            setSyncMessage({ ok: true, text: added ? `נוספו ${added} ביקורות חדשות מגוגל` : 'אין ביקורות חדשות בגוגל' });
            if (added) fetchReviews();
        } catch (err) {
            console.error(err);
            setSyncMessage({ ok: false, text: 'הסנכרון מגוגל נכשל' });
        } finally {
            setSyncing(false);
        }
    };

    const deleteReview = async (id) => {
        if (!window.confirm("האם למחוק את הביקורת לצמיתות?")) return;
        try {
            setReviews(reviews.filter(r => r._id !== id));
            await reviewService.remove(id);
        } catch (err) {
            console.error(err);
            fetchReviews();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Spinner size="md" />
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">ניהול ביקורות לקוחות</h2>
                    <p className="text-gray-400 text-sm">כאן תוכל לאשר ביקורות כדי שיופיעו באתר, או למחוק תוכן לא הולם. ביקורות חדשות מגוגל מפות נמשכות אוטומטית.</p>
                </div>
                <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                    <button
                        onClick={syncGoogle}
                        disabled={syncing}
                        className="px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 bg-[#4285F4] hover:bg-[#3367D6] text-white transition-colors disabled:opacity-60"
                    >
                        <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                        {syncing ? 'מסנכרן...' : 'סנכרן ביקורות מגוגל'}
                    </button>
                    {syncMessage && (
                        <span className={`text-xs ${syncMessage.ok ? 'text-green-400' : 'text-red-400'}`}>{syncMessage.text}</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-[#1a0b2e] rounded-2xl border border-white/5 text-gray-500">
                        אין עדיין ביקורות במערכת
                    </div>
                ) : (
                    reviews.map(review => (
                        <div 
                            key={review._id} 
                            className={`relative border rounded-2xl p-4 md:p-6 transition-all duration-300 group
                                ${review.isApproved 
                                    ? 'bg-[#1a0b2e] border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.05)]' 
                                    : 'bg-[#130620] border-yellow-500/20 border-l-4 border-l-yellow-500'
                                }
                            `}
                        >
                            {/* כותרת ופרטים */}
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3 sm:gap-0">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="font-bold text-lg text-white">{review.authorName}</h3>
                                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <Calendar size={10} />
                                            {format(new Date(review.publishedAt || review.createdAt), 'dd/MM/yyyy')}
                                        </span>
                                        {review.source === 'google' && (
                                            <a
                                                href={review.externalUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-[#8ab4f8] bg-[#4285F4]/10 border border-[#4285F4]/30 px-2 py-0.5 rounded-md flex items-center gap-1 hover:bg-[#4285F4]/20"
                                            >
                                                Google <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-yellow-400" : "text-gray-700"} />
                                            ))}
                                        </div>
                                        
                                        {/* 👇 התיקון כאן: הצגת שם החדר אם קיים */}
                                        {review.roomId && (
                                            <span className="text-xs text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded-full">
                                                {review.roomId?.title?.he || review.roomId?.title?.en || "חדר כללי"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* סטטוס */}
                                <div className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border ${review.isApproved ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                    {review.isApproved ? 'פורסם באתר' : 'ממתין לאישור'}
                                </div>
                            </div>

                            {/* תוכן הביקורת */}
                            <div className="bg-[#0a0310] p-4 rounded-xl border border-white/5 mb-4 relative">
                                <Quote size={20} className="text-white/10 absolute top-2 right-2 rotate-180" />
                                <p className="text-gray-300 text-sm leading-relaxed relative z-10 break-words">"{review.content}"</p>
                            </div>

                            {/* כפתורי פעולה */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-end w-full">
                                <button 
                                    onClick={() => deleteReview(review._id)} 
                                    className="order-2 sm:order-1 w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} /> מחק
                                </button>
                                
                                <button 
                                    onClick={() => toggleApproval(review)}
                                    className={`order-1 sm:order-2 w-full sm:w-auto px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                                        ${review.isApproved 
                                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                                            : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/20'
                                        }
                                    `}
                                >
                                    {review.isApproved ? <><X size={16}/> הסר מהאתר</> : <><Check size={16}/> אשר פרסום</>}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TabReviews;