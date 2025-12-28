'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save, Layout, DollarSign, Clock, Users, Zap } from 'lucide-react';
import { roomService } from '../../../services';
import NeonButton from '../../../components/ui/NeonButton';
import BilingualInput from '../../../components/admin/ui/BilingualInput';
import ImageUploader from '../../../components/admin/ui/ImageUploader';
import { useSettings } from '../../../context/SettingsContext';

const TabRooms = () => {
    const { getImg } = useSettings();

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const initialRoomState = {
        slug: '',
        title: { he: '', en: '' },
        subtitle: { he: '', en: '' },
        description: { he: '', en: '' },
        features: {
            durationMinutes: 60,
            difficultyLevel: 3,
            minPlayers: 2,
            maxPlayers: 6,
            isVr: true
        },
        images: { main: '' },
        pricing: { basePrice: 350, personPenalty: 50 },
        isActive: true,
        order: 0
    };

    const [formData, setFormData] = useState(initialRoomState);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const data = await roomService.getAll();
            setRooms(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (room) => {
        setFormData(room);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setFormData(initialRoomState);
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("האם למחוק את החדר לצמיתות? לא ניתן לשחזר.")) return;
        try {
            await roomService.remove(id);
            fetchRooms();
        } catch (err) {
            alert("שגיאה במחיקה");
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.slug || !formData.title.he) {
                alert("חובה למלא מזהה (Slug) וכותרת בעברית");
                return;
            }

            if (formData._id) {
                await roomService.update(formData._id, formData);
            } else {
                await roomService.create(formData);
            }

            setIsEditing(false);
            fetchRooms();
        } catch (err) {
            console.error(err);
            alert("שגיאה בשמירה: " + (err.response?.data?.message || err.message));
        }
    };

    const updateFeature = (key, val) => setFormData(prev => ({ ...prev, features: { ...prev.features, [key]: val } }));
    const updatePricing = (key, val) => setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, [key]: val } }));

    if (loading) return <div className="text-center py-10 text-white animate-pulse">טוען חדרים...</div>;

    // --- מסך רשימה ---
    if (!isEditing) {
        return (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">ניהול חדרים</h2>
                    <NeonButton onClick={handleCreate} icon={Plus}>הוסף חדר חדש</NeonButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rooms.map(room => (
                        <div key={room._id} className="bg-[#1a0b2e] border border-white/10 p-4 rounded-xl flex items-center justify-between hover:border-brand-primary/50 transition-all group">
                            <div className="flex items-center gap-4">
                                <img 
                                    src={getImg(room.images?.main)} 
                                    alt="" 
                                    className="w-20 h-20 rounded-lg object-cover bg-black/50 border border-white/5 group-hover:scale-105 transition-transform" 
                                />
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">{room.title?.he}</h3>
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                        <Users size={12}/> {room.features?.minPlayers}-{room.features?.maxPlayers} שחקנים 
                                    </p>
                                    <p className="text-gray-400 text-xs flex items-center gap-2 mt-1">
                                        <Clock size={12}/> {room.features?.durationMinutes} דקות
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => handleEdit(room)} className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/40 transition-colors">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(room._id)} className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- מסך עריכה / יצירה (מותאם למובייל) ---
    return (
        <div className="animate-fade-in">
            {/* Header: Title + Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-white/10 pb-4 gap-4 sm:gap-0">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {formData._id ? <Edit size={24} className="text-brand-secondary" /> : <Plus size={24} className="text-green-400" />}
                    {formData._id ? 'עריכת חדר' : 'יצירת חדר חדש'}
                </h2>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 flex-1 sm:flex-none text-center border border-white/10">ביטול</button>
                    <NeonButton onClick={handleSave} icon={Save} className="flex-1 sm:flex-none">שמור</NeonButton>
                </div>
            </div>

            <div className="space-y-8">

                {/* 1. פרטים כלליים */}
                <div className="bg-[#130620] p-4 md:p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Layout size={18} /> פרטים ראשיים</h3>

                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-400 mb-1 block">מזהה ייחודי (Slug) - באנגלית בלבד ללא רווחים *</label>
                        <input
                            type="text"
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white font-mono text-sm"
                            placeholder="example: abandoned-hostel"
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                        />
                    </div>

                    <BilingualInput label="שם החדר" value={formData.title} onChange={val => setFormData({ ...formData, title: val })} />
                    <BilingualInput label="כותרת משנה" value={formData.subtitle} onChange={val => setFormData({ ...formData, subtitle: val })} />
                    <BilingualInput label="תיאור מלא" value={formData.description} onChange={val => setFormData({ ...formData, description: val })} isTextArea />
                </div>

                {/* 2. מאפיינים טכניים */}
                <div className="bg-[#130620] p-4 md:p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Zap size={18} /> מאפיינים</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">זמן (דקות)</label>
                            <input type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white"
                                value={formData.features.durationMinutes} onChange={e => updateFeature('durationMinutes', Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">רמת קושי (1-5)</label>
                            <input type="number" min="1" max="5" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white"
                                value={formData.features.difficultyLevel} onChange={e => updateFeature('difficultyLevel', Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">מינימום שחקנים</label>
                            <input type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white"
                                value={formData.features.minPlayers} onChange={e => updateFeature('minPlayers', Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">מקסימום שחקנים</label>
                            <input type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white"
                                value={formData.features.maxPlayers} onChange={e => updateFeature('maxPlayers', Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <input type="checkbox" id="isVr" className="w-5 h-5 accent-brand-primary"
                            checked={formData.features.isVr} onChange={e => updateFeature('isVr', e.target.checked)} />
                        <label htmlFor="isVr" className="text-white">חדר מציאות מדומה (VR)?</label>
                    </div>
                </div>

                {/* 3. מחירים */}
                <div className="bg-[#130620] p-4 md:p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><DollarSign size={18} /> תמחור</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">מחיר בסיס (למינימום)</label>
                            <input type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white"
                                value={formData.pricing.basePrice} onChange={e => updatePricing('basePrice', Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">תוספת לכל אדם נוסף</label>
                            <input type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white"
                                value={formData.pricing.personPenalty} onChange={e => updatePricing('personPenalty', Number(e.target.value))} />
                        </div>
                    </div>
                </div>

                {/* 4. תמונה */}
                <ImageUploader
                    title="תמונה ראשית לחדר"
                    description="תוצג בכרטיס החדר וברקע של דף ההזמנה"
                    imageUrl={getImg(formData.images.main)}
                    onUpload={(url) => setFormData(prev => ({ ...prev, images: { ...prev.images, main: url } }))}
                    isWide
                />

            </div>
        </div>
    );
};

export default TabRooms;