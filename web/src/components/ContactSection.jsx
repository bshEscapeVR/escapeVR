'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Phone, Mail, Send, Star, User, Hash, CheckCircle, AlertCircle, Flame, FileText, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { roomService, leadService, reviewService } from '../services';
import Link from 'next/link';
import SectionTitle from './ui/SectionTitle';

// 1. ייבוא ספריות הולידציה
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- רכיבי UI פנימיים ---

const FormInput = ({ label, icon: Icon, className = "", error, ...props }) => (
    <div className={`mb-4 ${className}`}>
        {label && <label className="text-xs font-bold text-gray-400 mb-1 block uppercase tracking-wider">{label}</label>}
        <div className="relative group">
            <input 
                className={`w-full bg-[#0a0310] border rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none transition-all duration-300 ${Icon ? 'ps-10' : ''} ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'}`}
                {...props} 
            />
            {Icon && <Icon size={16} className={`absolute top-3.5 start-3 transition-colors ${error ? 'text-red-500' : 'text-gray-500 group-focus-within:text-brand-primary'}`} />}
        </div>
        {error && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {error.message}</p>}
    </div>
);

const FormTextarea = ({ label, className = "", error, ...props }) => (
    <div className={`mb-4 ${className}`}>
        {label && <label className="text-xs font-bold text-gray-400 mb-1 block uppercase tracking-wider">{label}</label>}
        <textarea
            className={`w-full h-32 bg-[#0a0310] border rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none transition-all duration-300 resize-none ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'}`}
            {...props}
        ></textarea>
        {error && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {error.message}</p>}
    </div>
);

const FormSelect = ({ label, options, placeholder, error, ...props }) => (
    <div className="mb-4">
        {label && <label className="text-xs font-bold text-gray-400 mb-1 block uppercase tracking-wider">{label}</label>}
        <div className="relative">
            <select
                className={`w-full bg-[#0a0310] border rounded-lg py-3 px-4 text-white focus:outline-none transition-all duration-300 appearance-none ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'}`}
                {...props}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#1a0b2e]">{opt.label}</option>
                ))}
            </select>
            <div className={`absolute top-4 left-4 pointer-events-none rtl:right-auto rtl:left-4 ltr:right-4 ltr:left-auto text-xs ${error ? 'text-red-500' : 'text-gray-500'}`}>▼</div>
        </div>
        {error && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {error.message}</p>}
    </div>
);

const ContactCard = ({ icon: Icon, title, content, subContent, action, colorClass = "text-brand-primary", bgIcon = "bg-brand-primary/10", borderColor = "border-white/10 hover:border-brand-primary/50" }) => (
    // 👇 הוספתי transform-gpu למניעת רעידות
    <div className={`bg-[#1c0e38] border ${borderColor} rounded-xl p-5 transition-all duration-300 group text-start shadow-lg transform-gpu hover:scale-[1.02]`}>
        <div className="flex justify-between items-start">
            <div>
                <h4 className="text-white font-bold text-lg">{title}</h4>
                {content && <p className={`mt-1 font-medium ${content.className || 'text-gray-400'}`} dir="ltr">{content.text}</p>}
                {subContent && <p className="text-gray-400 text-sm mt-1">{subContent}</p>}
            </div>
            {Icon && (
                <div className={`p-3 rounded-full ${bgIcon} transition-colors group-hover:scale-110 duration-300`}>
                    <Icon className={colorClass} size={22} />
                </div>
            )}
        </div>
        {action}
    </div>
);

// --- הקומפוננטה הראשית ---

const ContactSection = () => {
    const { t } = useTranslation();
    const { t: tDB, settings, loading } = useSettings(); // שליפת הגדרות מה-DB
    const params = useParams();
    const lang = params?.lang || 'he';

    const [activeTab, setActiveTab] = useState('contact');
    const [status, setStatus] = useState('idle');
    const [rooms, setRooms] = useState([]);

    // שליפת נתונים דינמיים מההגדרות (עם פולבק לערכים קבועים)
    const contactPhone = settings?.general?.contactPhone || "0000000000";
    const contactEmail = settings?.general?.contactEmail || "escapevr.bsh@gmail.com";

    // 2. הגדרת הולידציות (Zod)

    const contactSchema = z.object({
        fullName: z.string().min(2, t('validation.name_short')),
        email: z.string().email(t('validation.email_invalid')),
        phone: z.string().regex(/^05\d-?\d{7}$/, t('validation.phone_invalid')).or(z.literal('')),
        message: z.string().min(5, t('validation.message_short')),
        privacyConsent: z.literal(true, { errorMap: () => ({ message: t('validation.privacy_required') }) }),
        marketingConsent: z.boolean().optional()
    });

    const reviewSchema = z.object({
        fullName: z.string().min(2, t('validation.name_short')),
        email: z.string().email(t('validation.email_invalid')),
        roomId: z.string().min(1, t('validation.room_required')),
        rating: z.number().min(1).max(5),
        content: z.string().min(10, t('validation.review_short')),
        privacyConsent: z.literal(true, { errorMap: () => ({ message: t('validation.privacy_required') }) }),
        marketingConsent: z.boolean().optional()
    });

    // ערכי ברירת מחדל לטפסים - מוגדרים כקבוע לשימוש חוזר
    const defaultFormValues = {
        fullName: '',
        email: '',
        phone: '',
        message: '',
        content: '',
        roomId: '',
        rating: 5,
        privacyConsent: false,
        marketingConsent: false
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm({
        resolver: zodResolver(activeTab === 'contact' ? contactSchema : reviewSchema),
        defaultValues: defaultFormValues
    });

    const currentRating = watch('rating');
    const privacyChecked = watch('privacyConsent');
    const marketingChecked = watch('marketingConsent');

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const data = await roomService.getAll();
                setRooms(data);
            } catch (err) {
                console.error("Error fetching rooms:", err);
            }
        };
        fetchRooms();
    }, []);

    // איפוס הטופס בעת מעבר בין טאבים
    useEffect(() => {
        reset(defaultFormValues);
        setStatus('idle');
    }, [activeTab, reset]);

    const onSubmit = async (data) => {
        setStatus('loading');
        try {
            if (activeTab === 'contact') {
                await leadService.create({
                    fullName: data.fullName,
                    phone: data.phone,
                    email: data.email,
                    interest: 'Contact Form Message',
                    notes: data.message,
                    marketingConsent: data.marketingConsent
                });
            } else {
                await reviewService.create({
                    authorName: data.fullName,
                    email: data.email,
                    rating: data.rating,
                    content: data.content,
                    roomId: data.roomId,
                    marketingConsent: data.marketingConsent
                });
            }

            setStatus('success');
            // איפוס מלא של כל שדות הטופס לערכי ברירת המחדל
            reset(defaultFormValues);
            setTimeout(() => setStatus('idle'), 4000);

        } catch (err) {
            console.error("Submission error:", err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 4000);
        }
    };

    return (
        <section id="contact" className="py-20  relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 px-4 mb-10">
                {loading ? (
                    <div className="text-center mb-12">
                        <div className="h-10 w-64 mx-auto bg-white/10 animate-pulse rounded-lg mb-4" />
                        <div className="h-5 w-96 max-w-full mx-auto bg-white/5 animate-pulse rounded-lg" />
                    </div>
                ) : (
                    <SectionTitle
                        title={tDB(settings?.content?.contact?.title) || t('contact.title')}
                        subtitle={tDB(settings?.content?.contact?.subtitle) || t('contact.subtitle')}
                    />
                )}
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* === טופס === */}
                    <div className="bg-gradient-to-b from-[#1c0e38] to-[#140a2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full order-2 lg:order-1 relative z-20">

                        <div className="flex border-b border-white/10">
                            <button
                                type="button"
                                onClick={() => setActiveTab('contact')}
                                className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === 'contact' ? 'text-white bg-[#1c0e38]' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                            >
                                {t('contact.tab_contact')}
                                {activeTab === 'contact' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('review')}
                                className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === 'review' ? 'text-white bg-[#1c0e38]' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                            >
                                {t('contact.tab_review')}
                                {activeTab === 'review' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 shadow-[0_0_10px_#22c55e]"></div>}
                            </button>
                        </div>

                        <div className="p-8 flex-grow flex flex-col justify-center animate-fade-in">

                            <div className="mb-6 flex items-center gap-3 text-start border-b border-white/5 pb-4">
                                {activeTab === 'contact' ? (
                                    <>
                                        <div className="p-2 bg-blue-500/20 rounded-full"><Send className="text-blue-400" size={20} /></div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{t('contact.talk_to_us')}</h3>
                                            <p className="text-xs text-gray-400">{t('contact.talk_desc')}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-2 bg-green-500/20 rounded-full"><Star className="text-green-400 fill-green-400" size={20} /></div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{t('contact.share_exp')}</h3>
                                            <p className="text-xs text-gray-400">{t('contact.share_desc')}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="text-start">

                                <FormInput
                                    label={t('contact.label_name')}
                                    placeholder={t('contact.holder_name')}
                                    icon={User}
                                    error={errors.fullName}
                                    {...register('fullName')}
                                />

                                <FormInput
                                    label={t('contact.label_email')}
                                    placeholder="example@mail.com"
                                    dir="ltr"
                                    icon={Mail}
                                    error={errors.email}
                                    {...register('email')}
                                />

                                {activeTab === 'contact' && (
                                    <div className="animate-fade-in">
                                        <FormInput
                                            label={t('contact.label_phone')}
                                            placeholder="050-0000000"
                                            dir="ltr"
                                            icon={Phone}
                                            error={errors.phone}
                                            {...register('phone')}
                                        />
                                        <FormTextarea
                                            label={t('contact.label_msg')}
                                            placeholder={t('contact.holder_msg')}
                                            error={errors.message}
                                            {...register('message')}
                                        />
                                    </div>
                                )}

                                {activeTab === 'review' && (
                                    <div className="animate-fade-in">
                                        <FormSelect
                                            label={t('contact.label_room')}
                                            placeholder={t('contact.holder_room')}
                                            options={rooms.map(r => ({ value: r._id, label: tDB(r.title) }))}
                                            error={errors.roomId}
                                            {...register('roomId')}
                                        />

                                        <div className="mb-4">
                                            <label className="text-xs font-bold text-gray-400 mb-1 block uppercase tracking-wider">{t('contact.label_rating')}</label>
                                            <div className="flex gap-2 p-3 bg-[#0a0310] border border-white/10 rounded-lg justify-center">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        type="button"
                                                        key={star}
                                                        onClick={() => setValue('rating', star)}
                                                        className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                                                    >
                                                        <Star
                                                            size={32}
                                                            className={`${star <= currentRating ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-gray-700'}`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <FormTextarea
                                            label={t('contact.label_review')}
                                            placeholder={t('contact.holder_review')}
                                            error={errors.content}
                                            {...register('content')}
                                        />
                                    </div>
                                )}

                                {/* Privacy Policy Consent */}
                                <div className="mb-4">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            id="privacyConsent"
                                            className={`mt-1 shrink-0 w-5 h-5 rounded border-2 appearance-none cursor-pointer transition-all duration-200 checked:bg-brand-primary checked:border-brand-primary
                                                ${errors.privacyConsent
                                                    ? 'border-red-500 bg-red-500/10'
                                                    : 'border-white/20 group-hover:border-white/40 bg-transparent'
                                                }`}
                                            style={{ backgroundImage: privacyChecked ? "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")" : 'none', backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                                            {...register('privacyConsent')}
                                        />
                                        <span className="text-sm text-gray-300 leading-relaxed">
                                            {t('contact.privacy_agree')}{' '}
                                            <Link href={`/${lang}/privacy`} className="text-brand-primary hover:text-purple-300 underline underline-offset-2 transition-colors" target="_blank">
                                                {t('contact.privacy_link')}
                                            </Link>
                                        </span>
                                    </label>
                                    {errors.privacyConsent && (
                                        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1 ms-8">
                                            <AlertCircle size={10} /> {errors.privacyConsent.message}
                                        </p>
                                    )}
                                </div>

                                {/* Marketing Consent (opt-in) */}
                                <div className="mb-4">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="mt-1 shrink-0 w-5 h-5 rounded border-2 appearance-none cursor-pointer transition-all duration-200 checked:bg-brand-primary checked:border-brand-primary border-white/20 group-hover:border-white/40 bg-transparent"
                                            style={{ backgroundImage: marketingChecked ? "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")" : 'none', backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                                            {...register('marketingConsent')}
                                        />
                                        <span className="text-sm text-gray-400 leading-relaxed">
                                            {t('contact.marketing_consent')}
                                        </span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success'}
                                    className={`w-full font-bold py-3.5 rounded-lg flex justify-center items-center gap-2 mt-2 transition-all duration-300 shadow-lg
                                        ${status === 'success'
                                            ? 'bg-green-600 text-white cursor-default'
                                            : activeTab === 'contact'
                                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                                                : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/30'
                                        }
                                        ${status === 'loading' ? 'opacity-80 cursor-wait' : ''}
                                    `}
                                >
                                    {status === 'loading' && <span className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></span>}
                                    {status === 'success' && <><CheckCircle size={20} /> {t('contact.success')}</>}
                                    {status === 'error' && <><AlertCircle size={20} /> {t('contact.error')}</>}
                                    {status === 'idle' && (activeTab === 'contact' ? t('contact.btn_send') : t('contact.btn_post'))}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* === אזור מידע דינמי === */}
                    <div className="flex flex-col gap-4 order-1 lg:order-2">
                        <div className="flex items-center gap-3 mb-2 text-start">
                            <Phone className="text-brand-primary animate-pulse" />
                            <h3 className="text-2xl font-bold text-white">{t('contact.details_title')}</h3>
                        </div>

                        <ContactCard
                            title={t('contact.label_phone')}
                            content={{ text: contactPhone, className: "text-white text-lg font-mono tracking-wide" }}
                            icon={Phone}
                        />

                        <ContactCard
                            title={t('contact.label_email')}
                            content={{ text: contactEmail, className: "text-cyan-400 break-all" }}
                            icon={Mail}
                            colorClass="text-cyan-400" bgIcon="bg-cyan-500/10" borderColor="border-white/10 hover:border-cyan-500/50"
                        />

                        <ContactCard
                            title={t('contact.online_form_title')}
                            subContent={t('contact.online_form_desc')}
                            icon={FileText}
                            colorClass="text-green-500" bgIcon="bg-green-500/10" borderColor="border-white/10 hover:border-green-500/50"
                        />

                        <ContactCard
                            title={t('contact.book_now')}
                            content={{ text: t('contact.book_click'), className: "text-blue-400 underline" }}
                            icon={Hash}
                            colorClass="text-blue-400" bgIcon="bg-blue-500/10" borderColor="border-white/10 hover:border-blue-500/50"
                            action={<a href={`/${lang}#rooms`} className="absolute inset-0 z-10"></a>}
                        />

                        <div className="bg-[#1c0e38] border border-orange-500/30 rounded-xl p-5 relative overflow-hidden text-start group transition-all duration-300 transform-gpu hover:scale-[1.02] shadow-lg">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 to-red-500 rtl:left-auto rtl:right-0"></div>
                            <div className="flex justify-between items-start pl-2 rtl:pl-0 rtl:pr-2">
                                <div>
                                    <h4 className="text-white font-bold text-lg">{t('contact.shabbat_title')}</h4>
                                    <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-[85%]">
                                        {t('contact.shabbat_desc')}
                                    </p>
                                </div>
                                <Flame className="text-orange-400 group-hover:animate-pulse duration-300" size={24} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;