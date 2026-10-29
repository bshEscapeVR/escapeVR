'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Ticket, Plus, Trash2, Eye, EyeOff, Users, Download, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { couponService } from '../../../services';
import Spinner from '../../ui/Spinner';

const emptyForm = {
    code: '', type: 'percent', value: '', description: '',
    expiresAt: '', maxUses: '', minParticipants: '', oncePerCustomer: false
};

const emptyBatchForm = {
    campaign: '', prefix: '', count: '50', type: 'percent', value: '', description: '',
    expiresAt: '', minParticipants: '', singleUse: true
};

// "חצות UTC של התאריך" → "dd/MM/yyyy"
const formatDate = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '');

const discountLabel = (c) => (c.type === 'percent' ? `${c.value}% הנחה` : `₪${c.value} הנחה`);

// הורדת קובץ CSV שנפתח באקסל בעברית (BOM כדי שהעברית תוצג נכון)
const downloadCsv = (filename, rows) => {
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '﻿' + rows.map(r => r.map(escape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

// ניהול קודי קופון + סדרות קופונים לשותפים (נשמר מיד בשרת - לא דרך "שמור שינויים")
const TabCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mode, setMode] = useState('single'); // 'single' = קופון בודד, 'batch' = סדרה לשותף
    const [form, setForm] = useState(emptyForm);
    const [batchForm, setBatchForm] = useState(emptyBatchForm);
    const [openCampaign, setOpenCampaign] = useState(null);

    const fetchCoupons = async () => {
        try {
            setCoupons(await couponService.getAll() || []);
        } catch (err) {
            console.error('Error fetching coupons:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    // קופונים בודדים / סדרות לפי שם השותף
    const singles = coupons.filter(c => !c.campaign);
    const campaigns = useMemo(() => {
        const groups = {};
        coupons.filter(c => c.campaign).forEach((c) => {
            (groups[c.campaign] = groups[c.campaign] || []).push(c);
        });
        return Object.entries(groups).map(([name, list]) => ({
            name,
            codes: list.sort((a, b) => (a.batchNumber || 0) - (b.batchNumber || 0)),
            used: list.filter(c => c.usedCount > 0).length,
            active: list.filter(c => c.isActive).length,
        }));
    }, [coupons]);

    const handleCreate = async () => {
        if (!form.code.trim()) return alert('יש להזין קוד');
        if (!Number(form.value) || Number(form.value) <= 0) return alert('יש להזין גובה הנחה');
        if (form.type === 'percent' && Number(form.value) > 100) return alert('הנחה באחוזים - עד 100');

        setSaving(true);
        try {
            await couponService.create({ ...form, code: form.code.trim(), value: Number(form.value) });
            setForm(emptyForm);
            await fetchCoupons();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'שגיאה ביצירת הקופון');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateBatch = async () => {
        if (!batchForm.campaign.trim()) return alert('יש להזין שם שותף / מועדון');
        if (!batchForm.prefix.trim()) return alert('יש להזין קידומת לקודים');
        if (!Number(batchForm.count) || Number(batchForm.count) < 1 || Number(batchForm.count) > 500) return alert('כמות: 1 עד 500');
        if (!Number(batchForm.value) || Number(batchForm.value) <= 0) return alert('יש להזין גובה הנחה');
        if (batchForm.type === 'percent' && Number(batchForm.value) > 100) return alert('הנחה באחוזים - עד 100');

        setSaving(true);
        try {
            const { singleUse, ...rest } = batchForm;
            await couponService.createBatch({
                ...rest,
                campaign: batchForm.campaign.trim(),
                count: Number(batchForm.count),
                value: Number(batchForm.value),
                maxUses: singleUse ? 1 : '',
            });
            setOpenCampaign(batchForm.campaign.trim());
            setBatchForm(emptyBatchForm);
            await fetchCoupons();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'שגיאה ביצירת הסדרה');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (coupon) => {
        try {
            const updated = await couponService.update(coupon._id, { isActive: !coupon.isActive });
            setCoupons(prev => prev.map(c => (c._id === coupon._id ? updated : c)));
        } catch (err) {
            console.error(err);
            alert('שגיאה בעדכון הקופון');
        }
    };

    const handleDelete = async (coupon) => {
        if (!confirm(`למחוק את הקופון ${coupon.code}?`)) return;
        try {
            await couponService.remove(coupon._id);
            setCoupons(prev => prev.filter(c => c._id !== coupon._id));
        } catch (err) {
            console.error(err);
            alert('שגיאה במחיקת הקופון');
        }
    };

    const toggleCampaign = async (campaign) => {
        const activate = campaign.active === 0;
        try {
            await couponService.setCampaignActive(campaign.name, activate);
            await fetchCoupons();
        } catch (err) {
            console.error(err);
            alert('שגיאה בעדכון הסדרה');
        }
    };

    const deleteCampaign = async (campaign) => {
        if (!confirm(`למחוק את כל ${campaign.codes.length} הקופונים של "${campaign.name}"? הזמנות שכבר בוצעו לא יושפעו.`)) return;
        try {
            await couponService.removeCampaign(campaign.name);
            await fetchCoupons();
        } catch (err) {
            console.error(err);
            alert('שגיאה במחיקת הסדרה');
        }
    };

    // רשימת קודים לשליחה לשותף (בלי פרטי לקוחות)
    const exportCodes = (campaign) => {
        downloadCsv(`${campaign.name} - קודי קופון.csv`, [
            ['מספר', 'קוד', 'הנחה', 'בתוקף עד'],
            ...campaign.codes.map(c => [c.batchNumber, c.code, discountLabel(c), formatDate(c.expiresAt) || 'ללא הגבלה']),
        ]);
    };

    // דוח מעקב: מה נוצל, מתי ובאיזו הזמנה
    const exportReport = async (campaign) => {
        try {
            const report = await couponService.getCampaignReport(campaign.name);
            const rows = [['מספר', 'קוד', 'הנחה', 'סטטוס', 'נוצל', 'מספר הזמנה', 'תאריך המשחק', 'שעה', 'משתתפים', 'הנחה בש"ח', 'שולם', 'נוצר בתאריך']];
            report.forEach((c) => {
                const base = [c.batchNumber, c.code, discountLabel(c), c.isActive ? 'פעיל' : 'מושבת'];
                if (c.uses.length === 0) {
                    rows.push([...base, 'לא', '', '', '', '', '', '', '']);
                } else {
                    c.uses.forEach((u) => rows.push([
                        ...base, 'כן', u.bookingId, formatDate(new Date(u.date).toISOString()), u.timeSlot,
                        u.participantsCount, u.discount, u.totalPrice, formatDate(new Date(u.createdAt).toISOString()),
                    ]));
                }
            });
            downloadCsv(`${campaign.name} - דוח שימוש.csv`, rows);
        } catch (err) {
            console.error(err);
            alert('שגיאה בהפקת הדוח');
        }
    };

    const inputClass = 'w-full bg-[#130b1e] border border-white/10 rounded-lg p-2.5 text-white text-sm';
    const labelClass = 'text-gray-400 text-xs font-bold mb-1 block';
    const tabClass = (active) => `flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${active ? 'bg-brand-primary text-white' : 'text-gray-400 hover:bg-white/5'}`;

    // תיאור ההגבלות של קופון ("עד 31/12/2026 · 4 משתתפים ומעלה · ...")
    const describeLimits = (c) => [
        c.expiresAt && `עד ${formatDate(c.expiresAt)}`,
        c.minParticipants && `${c.minParticipants} משתתפים ומעלה`,
        c.maxUses && `${c.usedCount}/${c.maxUses} שימושים`,
        !c.maxUses && `${c.usedCount} שימושים`,
        c.oncePerCustomer && 'פעם אחת ללקוח',
    ].filter(Boolean).join(' · ');

    // שדות ההנחה וההגבלות - משותפים לקופון בודד ולסדרה
    const DiscountFields = ({ values, setValues }) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className={labelClass}>סוג הנחה</label>
                <select value={values.type} onChange={(e) => setValues({ ...values, type: e.target.value })} className={inputClass}>
                    <option value="percent">אחוזים (%)</option>
                    <option value="fixed">סכום קבוע (₪)</option>
                </select>
            </div>
            <div>
                <label className={labelClass}>{values.type === 'percent' ? 'אחוז הנחה' : 'סכום הנחה (₪)'}</label>
                <input type="number" min="1" max={values.type === 'percent' ? 100 : undefined} value={values.value} onChange={(e) => setValues({ ...values, value: e.target.value })} className={inputClass} />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Ticket size={24} className="text-cyan-400" />
                    קופונים
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                    הלקוח מזין את הקוד בחלון ההזמנה ורואה מיד את ההנחה. ההנחה מחושבת על המחיר מהמחירון. נשמר מיד (אין צורך ב&quot;שמור שינויים&quot;).
                </p>
            </div>

            {/* --- יצירה --- */}
            <div className="bg-[#1a0b2e]/50 border border-white/10 p-4 md:p-6 rounded-2xl space-y-4">
                <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                    <button type="button" onClick={() => setMode('single')} className={tabClass(mode === 'single')}>קופון בודד</button>
                    <button type="button" onClick={() => setMode('batch')} className={tabClass(mode === 'batch')}>סדרת קופונים לשותף / מועדון</button>
                </div>

                {mode === 'single' ? (
                    <>
                        <div>
                            <label className={labelClass}>קוד (למשל SUMMER10)</label>
                            <input dir="ltr" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={inputClass} />
                        </div>
                        {DiscountFields({ values: form, setValues: setForm })}

                        <p className="text-gray-500 text-xs">הגבלות (אופציונלי - שדה ריק = ללא הגבלה):</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>תקף עד תאריך</label>
                                <input type="date" dir="ltr" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>מספר שימושים מקסימלי</label>
                                <input type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>מינימום משתתפים</label>
                                <input type="number" min="1" max="8" value={form.minParticipants} onChange={(e) => setForm({ ...form, minParticipants: e.target.value })} className={inputClass} />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={form.oncePerCustomer} onChange={(e) => setForm({ ...form, oncePerCustomer: e.target.checked })} className="w-4 h-4 accent-cyan-500" />
                            שימוש אחד לכל לקוח (לפי מספר טלפון)
                        </label>

                        <div className="flex flex-wrap items-center gap-3">
                            <input placeholder="הערה לעצמך (אופציונלי)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} flex-1 min-w-[200px]`} />
                            <button type="button" onClick={handleCreate} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary/20 border border-brand-primary/40 text-white font-bold hover:bg-brand-primary/30 disabled:opacity-50">
                                <Plus size={16} /> {saving ? 'יוצר...' : 'צור קופון'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-gray-400 text-sm">
                            יוצר רשימת קודים ממוספרת לשותף, למשל <span dir="ltr" className="font-mono text-cyan-300">MACCABI-001-K7Q</span>, <span dir="ltr" className="font-mono text-cyan-300">MACCABI-002-H3M</span>...
                            המספר שומר על סדר ומעקב, והאותיות בסוף מונעות ניחוש של קודים אחרים. אפשר לייצא לאקסל את הרשימה לשליחה לשותף ואת דוח השימוש.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>שם השותף / המועדון</label>
                                <input value={batchForm.campaign} onChange={(e) => setBatchForm({ ...batchForm, campaign: e.target.value })} placeholder="מועדון מכבי" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>קידומת לקודים (אנגלית / מספרים)</label>
                                <input dir="ltr" value={batchForm.prefix} onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} placeholder="MACCABI" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>כמה קודים (עד 500)</label>
                                <input type="number" min="1" max="500" value={batchForm.count} onChange={(e) => setBatchForm({ ...batchForm, count: e.target.value })} className={inputClass} />
                            </div>
                        </div>
                        {DiscountFields({ values: batchForm, setValues: setBatchForm })}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>תקף עד תאריך (אופציונלי)</label>
                                <input type="date" dir="ltr" value={batchForm.expiresAt} onChange={(e) => setBatchForm({ ...batchForm, expiresAt: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>מינימום משתתפים (אופציונלי)</label>
                                <input type="number" min="1" max="8" value={batchForm.minParticipants} onChange={(e) => setBatchForm({ ...batchForm, minParticipants: e.target.value })} className={inputClass} />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={batchForm.singleUse} onChange={(e) => setBatchForm({ ...batchForm, singleUse: e.target.checked })} className="w-4 h-4 accent-cyan-500" />
                            כל קוד לשימוש אחד בלבד (מומלץ)
                        </label>

                        <div className="flex flex-wrap items-center gap-3">
                            <input placeholder="הערה לעצמך (אופציונלי)" value={batchForm.description} onChange={(e) => setBatchForm({ ...batchForm, description: e.target.value })} className={`${inputClass} flex-1 min-w-[200px]`} />
                            <button type="button" onClick={handleCreateBatch} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary/20 border border-brand-primary/40 text-white font-bold hover:bg-brand-primary/30 disabled:opacity-50">
                                <Plus size={16} /> {saving ? 'יוצר...' : 'צור סדרה'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Spinner size="md" /></div>
            ) : (
                <>
                    {/* --- סדרות לשותפים --- */}
                    {campaigns.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-white font-bold flex items-center gap-2"><Users size={18} className="text-cyan-400" /> סדרות לשותפים</h3>
                            {campaigns.map((campaign) => {
                                const isOpen = openCampaign === campaign.name;
                                const sample = campaign.codes[0];
                                return (
                                    <div key={campaign.name} className={`bg-black/20 border rounded-xl ${campaign.active ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                                        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                                            <button type="button" onClick={() => setOpenCampaign(isOpen ? null : campaign.name)} className="text-start flex items-center gap-2">
                                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                <span>
                                                    <span className="text-white font-bold">{campaign.name}</span>
                                                    <span className="text-cyan-300 text-sm ms-3">{discountLabel(sample)}</span>
                                                    <span className="block text-xs text-gray-400 mt-0.5">
                                                        {campaign.codes.length} קודים · נוצלו {campaign.used} · נשארו {campaign.codes.length - campaign.used}
                                                        {sample.expiresAt && ` · עד ${formatDate(sample.expiresAt)}`}
                                                        {campaign.active === 0 && ' · מושבתת'}
                                                    </span>
                                                </span>
                                            </button>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <button type="button" onClick={() => exportCodes(campaign)} title="רשימת קודים לשליחה לשותף" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-200 border border-white/10 hover:bg-white/5">
                                                    <Download size={14} /> קודים לשותף
                                                </button>
                                                <button type="button" onClick={() => exportReport(campaign)} title="מה נוצל, מתי ובאיזו הזמנה" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-200 border border-white/10 hover:bg-white/5">
                                                    <FileSpreadsheet size={14} /> דוח שימוש
                                                </button>
                                                <button type="button" onClick={() => toggleCampaign(campaign)} title={campaign.active ? 'השבת את כל הסדרה' : 'הפעל את כל הסדרה'} className="p-2 rounded-lg text-gray-300 hover:bg-white/5">
                                                    {campaign.active ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} />}
                                                </button>
                                                <button type="button" onClick={() => deleteCampaign(campaign)} title="מחק את כל הסדרה" className="p-2 rounded-lg text-red-400 hover:bg-red-500/10">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <ul className="border-t border-white/5 max-h-72 overflow-y-auto divide-y divide-white/5">
                                                {campaign.codes.map((c) => (
                                                    <li key={c._id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                                                        <span dir="ltr" className={`font-mono ${c.isActive ? 'text-white' : 'text-gray-500'}`}>{c.code}</span>
                                                        <span className="flex items-center gap-2">
                                                            <span className={`text-xs ${c.usedCount > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                                                {c.usedCount > 0 ? `נוצל (${c.usedCount})` : 'לא נוצל'}
                                                            </span>
                                                            <button type="button" onClick={() => toggleActive(c)} title={c.isActive ? 'השבת' : 'הפעל'} className="p-1 rounded text-gray-400 hover:bg-white/5">
                                                                {c.isActive ? <Eye size={14} className="text-green-400" /> : <EyeOff size={14} />}
                                                            </button>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* --- קופונים בודדים --- */}
                    <div className="space-y-2">
                        <h3 className="text-white font-bold">קופונים בודדים</h3>
                        {singles.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-6">עדיין אין קופונים בודדים</p>
                        ) : (
                            <ul className="space-y-2">
                                {singles.map((c) => (
                                    <li key={c._id} className={`flex flex-wrap items-center justify-between gap-3 bg-black/20 border rounded-xl p-4 ${c.isActive ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                                        <div>
                                            <p className="text-white font-bold">
                                                <span dir="ltr" className="font-mono">{c.code}</span>
                                                <span className="text-cyan-300 ms-3">{discountLabel(c)}</span>
                                                {!c.isActive && <span className="text-gray-400 text-xs ms-3">(מושבת)</span>}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">{describeLimits(c)}</p>
                                            {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={() => toggleActive(c)} title={c.isActive ? 'השבת' : 'הפעל'} className="p-2 rounded-lg text-gray-300 hover:bg-white/5">
                                                {c.isActive ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} />}
                                            </button>
                                            <button type="button" onClick={() => handleDelete(c)} title="מחק" className="p-2 rounded-lg text-red-400 hover:bg-red-500/10">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TabCoupons;
