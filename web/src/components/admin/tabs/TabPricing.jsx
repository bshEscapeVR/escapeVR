'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save, Users, Tag, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { pricingService } from '../../../services';
import NeonButton from '../../../components/ui/NeonButton';
import Spinner from '../../../components/ui/Spinner';

const TabPricing = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const initialPlanState = {
        players: 2,
        oldPrice: 0,
        newPrice: 0,
        discount: 0,
        isActive: true,
        order: 0
    };

    const [formData, setFormData] = useState(initialPlanState);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await pricingService.getAllAdmin();
            setPlans(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (plan) => {
        setFormData(plan);
        setIsEditing(true);
    };

    const handleCreate = () => {
        // קבע order לפי הכרטיס האחרון
        const maxOrder = plans.length > 0 ? Math.max(...plans.map(p => p.order || 0)) : -1;
        setFormData({ ...initialPlanState, order: maxOrder + 1 });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("האם למחוק את כרטיס המחיר לצמיתות?")) return;
        try {
            await pricingService.remove(id);
            fetchPlans();
        } catch (err) {
            alert("שגיאה במחיקה");
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.players || formData.players < 1) {
                alert("יש להזין כמות שחקנים תקינה");
                return;
            }

            if (formData.newPrice <= 0) {
                alert("יש להזין מחיר תקין");
                return;
            }

            // חישוב הנחה אוטומטי - רק אם יש מחיר מקורי
            const calculatedDiscount = formData.oldPrice > 0
                ? Math.round((1 - formData.newPrice / formData.oldPrice) * 100)
                : 0;
            const dataToSave = { ...formData, discount: calculatedDiscount };

            if (formData._id) {
                await pricingService.update(formData._id, dataToSave);
            } else {
                await pricingService.create(dataToSave);
            }

            setIsEditing(false);
            fetchPlans();
        } catch (err) {
            console.error(err);
            alert("שגיאה בשמירה: " + (err.response?.data?.message || err.message));
        }
    };

    const handleMoveUp = async (index) => {
        if (index === 0) return;
        const newPlans = [...plans];
        [newPlans[index - 1], newPlans[index]] = [newPlans[index], newPlans[index - 1]];
        const orderedIds = newPlans.map(p => p._id);
        try {
            await pricingService.reorder(orderedIds);
            fetchPlans();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMoveDown = async (index) => {
        if (index === plans.length - 1) return;
        const newPlans = [...plans];
        [newPlans[index], newPlans[index + 1]] = [newPlans[index + 1], newPlans[index]];
        const orderedIds = newPlans.map(p => p._id);
        try {
            await pricingService.reorder(orderedIds);
            fetchPlans();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Spinner size="md" />
        </div>
    );

    // --- מסך רשימה ---
    if (!isEditing) {
        return (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">ניהול מחירון</h2>
                    <NeonButton onClick={handleCreate} icon={Plus}>הוסף כרטיס מחיר</NeonButton>
                </div>

                {plans.length === 0 ? (
                    <div className="text-center py-16 bg-[#1a0b2e] border border-white/10 rounded-xl">
                        <DollarSign size={48} className="mx-auto text-gray-500 mb-4" />
                        <p className="text-gray-400 text-lg mb-2">אין כרטיסי מחיר</p>
                        <p className="text-gray-500 text-sm mb-6">לחץ על "הוסף כרטיס מחיר" כדי ליצור את הכרטיס הראשון</p>
                        <NeonButton onClick={handleCreate} icon={Plus}>הוסף כרטיס מחיר</NeonButton>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((plan, index) => (
                            <div key={plan._id} className={`bg-[#1a0b2e] border ${plan.isActive ? 'border-white/10' : 'border-red-500/30 opacity-60'} p-6 rounded-xl hover:border-brand-primary/50 transition-all group`}>

                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-brand-primary/20 p-3 rounded-full">
                                            <Users className="text-brand-neon" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{plan.players} שחקנים</h3>
                                            {!plan.isActive && <span className="text-xs text-red-400">לא פעיל</span>}
                                        </div>
                                    </div>

                                    {/* Move buttons */}
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ArrowUp size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === plans.length - 1}
                                            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ArrowDown size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Prices */}
                                <div className="space-y-2 mb-4">
                                    {plan.oldPrice > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400 text-sm">מחיר מקורי:</span>
                                            <span className="text-gray-500 line-through">₪{plan.oldPrice}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">מחיר לאדם:</span>
                                        <span className="text-cyan-400 font-bold text-lg">₪{plan.newPrice}</span>
                                    </div>
                                    {plan.oldPrice > 0 && (plan.discount > 0 || plan.calculatedDiscount > 0) && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400 text-sm">הנחה:</span>
                                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                <Tag size={14} /> {plan.discount || plan.calculatedDiscount}%
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <span className="text-gray-400 text-sm">סה"כ:</span>
                                        <span className="text-white font-bold">₪{plan.totalPrice || plan.newPrice * plan.players}</span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => handleEdit(plan)}
                                        className="flex-1 p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/40 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit size={16} /> עריכה
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan._id)}
                                        className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- מסך עריכה / יצירה ---
    const calculatedDiscount = formData.oldPrice > 0
        ? Math.round((1 - formData.newPrice / formData.oldPrice) * 100)
        : 0;
    const totalPrice = formData.newPrice * formData.players;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-white/10 pb-4 gap-4 sm:gap-0">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {formData._id ? <Edit size={24} className="text-brand-secondary" /> : <Plus size={24} className="text-green-400" />}
                    {formData._id ? 'עריכת כרטיס מחיר' : 'יצירת כרטיס מחיר חדש'}
                </h2>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 flex-1 sm:flex-none text-center border border-white/10">ביטול</button>
                    <NeonButton onClick={handleSave} icon={Save} className="flex-1 sm:flex-none">שמור</NeonButton>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">

                {/* כמות שחקנים */}
                <div className="bg-[#130620] p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Users size={18} /> כמות שחקנים
                    </h3>
                    <input
                        type="number"
                        min="1"
                        max="20"
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-2xl text-center font-bold"
                        value={formData.players}
                        onChange={e => setFormData({ ...formData, players: Number(e.target.value) })}
                    />
                </div>

                {/* מחירים */}
                <div className="bg-[#130620] p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <DollarSign size={18} /> תמחור לאדם
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">מחיר לאדם *</label>
                            <div className="relative">
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">₪</span>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pr-8 text-white text-lg"
                                    value={formData.newPrice}
                                    onChange={e => setFormData({ ...formData, newPrice: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">מחיר לפני הנחה (אופציונלי)</label>
                            <div className="relative">
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">₪</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="השאר ריק אם אין הנחה"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pr-8 text-white text-lg placeholder:text-gray-600"
                                    value={formData.oldPrice || ''}
                                    onChange={e => setFormData({ ...formData, oldPrice: Number(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* חישובים אוטומטיים */}
                    <div className="mt-6 p-4 bg-black/30 rounded-lg border border-white/5">
                        <div className={`grid ${formData.oldPrice > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-4 text-center`}>
                            {formData.oldPrice > 0 && (
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">אחוז הנחה</p>
                                    <p className="text-2xl font-bold text-emerald-400">{calculatedDiscount}%</p>
                                </div>
                            )}
                            <div>
                                <p className="text-gray-400 text-sm mb-1">סה"כ ל-{formData.players} שחקנים</p>
                                <p className="text-2xl font-bold text-cyan-400">₪{totalPrice}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* הגדרות */}
                <div className="bg-[#130620] p-6 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            className="w-5 h-5 accent-brand-primary"
                            checked={formData.isActive}
                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label htmlFor="isActive" className="text-white">כרטיס פעיל (יוצג באתר)</label>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TabPricing;
