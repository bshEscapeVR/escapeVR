'use client';

import React, { useEffect, useState } from 'react';
import { Phone, Mail, CheckCircle, Clock, Trash2, MessageSquare, Calendar } from 'lucide-react';
import { leadService } from '../../../services';
import Spinner from '../../../components/ui/Spinner';
import { format } from 'date-fns';

const TabLeads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const data = await leadService.getAll();
            setLeads(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (lead) => {
        const newStatus = lead.status === 'new' ? 'contacted' : 'new';
        try {
            setLeads(leads.map(l => l._id === lead._id ? { ...l, status: newStatus } : l));
            await leadService.updateStatus(lead._id, newStatus);
        } catch (err) {
            console.error(err);
            fetchLeads();
        }
    };

   const deleteLead = async (id) => {
        if (!window.confirm("למחוק את הפנייה הזו?")) return;
        try {
            setLeads(leads.filter(l => l._id !== id));
            await leadService.remove(id);
        } catch (err) {
            console.error(err);
            fetchLeads();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Spinner size="md" />
        </div>
    );

    return (
        <div className="animate-fade-in">
            
            {/* --- כותרת: תיקון רספונסיבי --- */}
            {/* במובייל: עמודה אחת (כותרת מעל המונה). בדסקטופ: שורה אחת (רווח ביניהם) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 sm:gap-0">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">ניהול לידים ופניות</h2>
                    <p className="text-gray-400 text-sm">רשימת הפניות שהגיעו מטופס יצירת הקשר באתר</p>
                </div>
                <div className="text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-lg border border-white/5 w-full sm:w-auto text-center sm:text-right">
                    סה"כ פניות: <span className="text-white font-bold">{leads.length}</span>
                </div>
            </div>

            <div className="space-y-4">
                {leads.length === 0 ? (
                    <div className="text-center py-12 bg-[#1a0b2e] rounded-2xl border border-white/5 text-gray-500">
                        אין פניות חדשות
                    </div>
                ) : (
                    leads.map(lead => (
                        <div
                            key={lead._id}
                            className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-lg
                                ${lead.status === 'new'
                                    ? 'bg-gradient-to-r from-[#2e1065] to-[#1a0b2e] border-brand-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                                    : 'bg-[#130620] border-white/5 opacity-75 hover:opacity-100'
                                }
                            `}
                        >
                            {/* --- פרטי הליד --- */}
                            <div className="flex items-start gap-4 w-full md:w-auto">
                                {/* אייקון סטטוס */}
                                <div className={`mt-1 p-3 rounded-full flex-shrink-0 flex items-center justify-center ${lead.status === 'new' ? 'bg-brand-primary text-white shadow-lg' : 'bg-gray-700 text-gray-400'}`}>
                                    {lead.status === 'new' ? <MessageSquare size={20} /> : <CheckCircle size={20} />}
                                </div>

                                <div className="flex-grow">
                                    <div className="flex flex-wrap items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-white">{lead.fullName}</h3>
                                        <span className="text-xs text-gray-400 flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded whitespace-nowrap">
                                            <Calendar size={10} />
                                            {format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm')}
                                        </span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-gray-300 mb-2">
                                        <div className="flex items-center gap-1.5 hover:text-brand-primary transition-colors cursor-pointer">
                                            <Phone size={14} />
                                            <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                                        </div>
                                        {lead.email && (
                                            <div className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer">
                                                <Mail size={14} />
                                                <a href={`mailto:${lead.email}`}>{lead.email}</a>
                                            </div>
                                        )}
                                    </div>

                                    {/* תוכן ההודעה */}
                                    {lead.notes && (
                                        <div className="bg-black/20 p-3 rounded-lg text-sm text-gray-300 border border-white/5 mt-2 w-full md:max-w-2xl">
                                            <span className="text-brand-secondary text-xs font-bold block mb-1">הודעה:</span>
                                            "{lead.notes}"
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- כפתורי פעולה --- */}
                            {/* תיקון: במובייל הם יקבלו מרווח עליון (mt-4) ויתפסו את כל הרוחב */}
                            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 md:ps-4">
                                <button
                                    onClick={() => toggleStatus(lead)}
                                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all
                                        ${lead.status === 'new'
                                            ? 'bg-white/10 text-white hover:bg-green-600 hover:text-white border border-white/10'
                                            : 'bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/40 border border-yellow-500/30'
                                        }
                                    `}
                                >
                                    {lead.status === 'new' ? <><CheckCircle size={16} /> סמן כטופל</> : <><Clock size={16} /> החזר לטיפול</>}
                                </button>

                                <button
                                    onClick={() => deleteLead(lead._id)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                    title="מחק פנייה"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TabLeads;