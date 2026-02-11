'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Shield } from 'lucide-react';
import { useSettings } from '../../../../context/SettingsContext';
import Footer from '../../../../components/Footer';

const privacyContent = {
    he: {
        title: "מדיניות פרטיות",
        lastUpdate: "עדכון אחרון: פברואר 2026",
        sections: [
            {
                title: "1. כללי",
                content: "ברוכים הבאים לאתר VR Escape Reality (להלן: \"האתר\"). אנו מחויבים להגן על פרטיותכם ולשמור על המידע האישי שלכם בהתאם לחוק הגנת הפרטיות, התשמ\"א-1981 ותקנות הגנת הפרטיות (אבטחת מידע), התשע\"ז-2017. מדיניות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלכם."
            },
            {
                title: "2. מידע שאנו אוספים",
                content: "אנו אוספים מידע שאתם מספקים לנו באופן ישיר בעת:\n• מילוי טופס יצירת קשר (שם, אימייל, טלפון, תוכן ההודעה)\n• ביצוע הזמנה (שם, טלפון, אימייל, מספר משתתפים, תאריך ושעה מועדפים)\n• השארת ביקורת (שם, אימייל, דירוג, תוכן הביקורת)\n\nבנוסף, אנו אוספים מידע טכני באופן אוטומטי כגון כתובת IP, סוג דפדפן, זמני גישה ועמודים שנצפו, באמצעות כלי ניתוח כגון Google Analytics."
            },
            {
                title: "3. שימוש במידע",
                content: "המידע שנאסף משמש אותנו למטרות הבאות:\n• טיפול בפניות ובקשות יצירת קשר\n• ניהול הזמנות ותיאום מועדי משחק\n• שליחת אישור הזמנה לכתובת האימייל שסיפקתם\n• הצגת ביקורות באתר (לאחר אישור)\n• שיפור השירותים והחוויה באתר"
            },
            {
                title: "4. שיתוף מידע עם צדדים שלישיים",
                content: "אנו לא מוכרים, סוחרים או מעבירים את המידע האישי שלכם לצדדים שלישיים, למעט:\n• ספקי שירותי ענן לצורך תפעול האתר (אחסון תוכן ומשלוח דוא\"ל)\n• Google Analytics לצורך ניתוח סטטיסטי אנונימי של השימוש באתר\n• במקרים בהם נדרש על פי חוק או צו בית משפט"
            },
            {
                title: "5. דוא\"ל תפעולי",
                content: "בעת ביצוע הזמנה או שליחת פנייה באתר, ייתכן שנשלח לכם הודעת דוא\"ל הכוללת:\n• אישור הזמנה עם פרטי ההזמנה\n• מענה לפנייתכם\n\nמדובר בהודעות תפעוליות בלבד ולא בדיוור שיווקי. איננו שולחים ניוזלטרים או הודעות פרסומיות."
            },
            {
                title: "6. עוגיות (Cookies)",
                content: "האתר משתמש בעוגיות לצורך:\n• שמירת העדפות שפה ותצוגה\n• שמירת הסכמה לשימוש בעוגיות\n• ניתוח סטטיסטי של השימוש באתר (Google Analytics)\n• שיפור חוויית הגלישה\n\nתוכלו לשלוט בהגדרות העוגיות דרך הדפדפן שלכם. חסימת עוגיות מסוימות עלולה להשפיע על חוויית השימוש באתר."
            },
            {
                title: "7. אבטחת מידע",
                content: "אנו נוקטים באמצעי אבטחה מתקדמים כדי להגן על המידע האישי שלכם, כולל הצפנת מידע רגיש, תקשורת מאובטחת והגנה מפני גישה לא מורשית.\n\nעם זאת, אין שיטת העברה או אחסון באינטרנט שהיא בטוחה ב-100%, ולכן איננו יכולים להבטיח אבטחה מוחלטת."
            },
            {
                title: "8. זכויות המשתמש",
                content: "בהתאם לחוק, עומדות לכם הזכויות הבאות:\n• לעיין במידע האישי שלכם המוחזק אצלנו\n• לבקש תיקון או מחיקה של מידע אישי\n• להתנגד לשימוש במידע שלכם\n• לבקש העברת המידע שלכם\n\nלמימוש זכויות אלה, ניתן לפנות אלינו דרך פרטי הקשר המופיעים בתחתית עמוד זה."
            },
            {
                title: "9. שינויים במדיניות",
                content: "אנו שומרים לעצמנו את הזכות לעדכן מדיניות פרטיות זו מעת לעת. שינויים מהותיים יפורסמו באתר. המשך השימוש באתר לאחר עדכון המדיניות מהווה הסכמה לשינויים."
            },
            {
                title: "10. יצירת קשר",
                content: "לכל שאלה או בקשה בנוגע למדיניות הפרטיות, ניתן לפנות אלינו דרך עמוד יצירת הקשר באתר או בטלפון המופיע באתר."
            }
        ]
    },
    en: {
        title: "Privacy Policy",
        lastUpdate: "Last updated: February 2026",
        sections: [
            {
                title: "1. General",
                content: "Welcome to the VR Escape Reality website (hereinafter: \"the Website\"). We are committed to protecting your privacy and safeguarding your personal information in accordance with the Israeli Privacy Protection Law, 5741-1981 and the Privacy Protection Regulations (Data Security), 5777-2017. This policy explains how we collect, use, and protect your information."
            },
            {
                title: "2. Information We Collect",
                content: "We collect information that you provide directly when:\n• Filling out the contact form (name, email, phone, message content)\n• Making a booking (name, phone, email, number of participants, preferred date and time)\n• Leaving a review (name, email, rating, review content)\n\nAdditionally, we automatically collect technical information such as IP address, browser type, access times, and pages viewed, using analytics tools such as Google Analytics."
            },
            {
                title: "3. Use of Information",
                content: "The collected information is used for the following purposes:\n• Handling inquiries and contact requests\n• Managing bookings and scheduling game sessions\n• Sending booking confirmation to the email address you provided\n• Displaying reviews on the website (after approval)\n• Improving our services and website experience"
            },
            {
                title: "4. Sharing Information with Third Parties",
                content: "We do not sell, trade, or transfer your personal information to third parties, except:\n• Cloud service providers for website operation (content hosting and email delivery)\n• Google Analytics for anonymous statistical analysis of website usage\n• When required by law or court order"
            },
            {
                title: "5. Operational Emails",
                content: "When making a booking or submitting an inquiry on the website, we may send you an email including:\n• Booking confirmation with your booking details\n• A response to your inquiry\n\nThese are operational messages only, not marketing communications. We do not send newsletters or promotional messages."
            },
            {
                title: "6. Cookies",
                content: "The website uses cookies for:\n• Saving language and display preferences\n• Saving cookie consent preference\n• Statistical analysis of website usage (Google Analytics)\n• Improving the browsing experience\n\nYou can control cookie settings through your browser. Blocking certain cookies may affect your experience on the website."
            },
            {
                title: "7. Data Security",
                content: "We take advanced security measures to protect your personal information, including encryption of sensitive data, secure communication, and protection against unauthorized access.\n\nHowever, no method of internet transmission or storage is 100% secure, and therefore we cannot guarantee absolute security."
            },
            {
                title: "8. User Rights",
                content: "In accordance with the law, you have the following rights:\n• To review your personal information held by us\n• To request correction or deletion of personal information\n• To object to the use of your information\n• To request transfer of your information\n\nTo exercise these rights, please contact us through the contact details at the bottom of this page."
            },
            {
                title: "9. Changes to the Policy",
                content: "We reserve the right to update this privacy policy from time to time. Material changes will be published on the website. Continued use of the website after the policy update constitutes agreement to the changes."
            },
            {
                title: "10. Contact Us",
                content: "For any question or request regarding the privacy policy, you can contact us through the contact page on the website or by phone listed on the site."
            }
        ]
    }
};

export default function PrivacyPage() {
    const params = useParams();
    const lang = params?.lang || 'he';
    const { settings, t: tDB } = useSettings();
    const content = privacyContent[lang] || privacyContent.he;
    const siteName = tDB(settings?.general?.siteName) || 'VR Escape Reality';

    return (
        <div className="min-h-screen bg-brand-dark text-brand-text font-sans selection:bg-brand-neon selection:text-white">
            <main className="pt-24 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary/10 mb-6">
                            <Shield className="text-brand-primary" size={32} />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-3">{content.title}</h1>
                        <p className="text-gray-400 text-sm">{content.lastUpdate}</p>
                        <p className="text-gray-500 text-sm mt-1">{siteName}</p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-8">
                        {content.sections.map((section, index) => (
                            <div
                                key={index}
                                className="bg-[#130620] border border-white/10 rounded-xl p-6 sm:p-8 transition-all duration-300 hover:border-brand-primary/30"
                            >
                                <h2 className="text-xl font-bold text-white mb-4">{section.title}</h2>
                                <div className="text-gray-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                                    {section.content}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
}
