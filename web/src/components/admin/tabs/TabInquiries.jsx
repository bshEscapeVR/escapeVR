'use client';

import React, { useState } from 'react';
import { Mail, Trash2, Reply } from 'lucide-react';

const TabInquiries = () => {
    // Mock Data - בהמשך זה יגיע מהשרת
    const [inquiries, setInquiries] = useState([
        { id: 1, name: 'ישראל ישראלי', email: 'israel@gmail.com', message: 'היי, האם יש הנחה לקבוצות גדולות?', date: '10/12/2025' },
        { id: 2, name: 'דנה כהן', email: 'dana@walla.co.il', message: 'רוצה להזמין יום הולדת לילד בן 10, האם החדר המפחיד מתאים?', date: '09/12/2025' }
    ]);

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Mail className="text-blue-400" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">תיבת פניות מהאתר</h2>
                    <p className="text-gray-400 text-sm">הודעות שנשלחו דרך טופס "צור קשר"</p>
                </div>
            </div>

            <div className="space-y-4">
                {inquiries.map((inq) => (
                    <div key={inq.id} className="bg-[#2A0A45]/50 border border-white/10 rounded-xl p-6 hover:border-brand-neon/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                                    {inq.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{inq.name}</h3>
                                    <p className="text-sm text-gray-400">{inq.email}</p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{inq.date}</span>
                        </div>
                        
                        <div className="bg-[#150822] p-4 rounded-lg text-gray-300 text-sm mb-4">
                            "{inq.message}"
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/40 text-sm">
                                <Reply size={16} /> השיב במייל
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/40 text-sm">
                                <Trash2 size={16} /> מחק
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TabInquiries;