// utils/googleReviewsService.js
// סנכרון ביקורות מגוגל מפות (Places API - New) למסד הנתונים.
// ביקורות חדשות נשמרות כ"ממתינות לאישור" - המנהל מחליט מה יוצג באתר.
const Review = require('../models/Review');

const PLACES_URL = 'https://places.googleapis.com/v1/places';
const DEFAULT_SYNC_HOURS = 6;

let isSyncing = false;

const isConfigured = () => Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID);

// שליפת הביקורות מגוגל (גוגל מחזירה עד 5 ביקורות לכל בקשה)
const fetchGoogleReviews = async () => {
    const url = `${PLACES_URL}/${encodeURIComponent(process.env.GOOGLE_PLACE_ID)}?languageCode=he`;
    const res = await fetch(url, {
        headers: {
            'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'reviews'
        }
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Google Places API ${res.status}: ${body}`);
    }

    const data = await res.json();
    return data.reviews || [];
};

// המרת ביקורת גוגל למבנה של Review
const mapGoogleReview = (r) => ({
    authorName: r.authorAttribution?.displayName || 'Google User',
    rating: r.rating,
    content: (r.originalText?.text || r.text?.text || '').trim(), // הטקסט המקורי של הכותב, לא התרגום
    authorPhotoUrl: r.authorAttribution?.photoUri,
    externalUrl: r.googleMapsUri || r.authorAttribution?.uri,
    publishedAt: r.publishTime ? new Date(r.publishTime) : undefined,
    dateDisplay: r.relativePublishTimeDescription
});

/**
 * מסנכרן ביקורות מגוגל. ביקורת קיימת מתעדכנת (אם הכותב ערך אותה)
 * בלי לגעת בסטטוס האישור שהמנהל קבע.
 * @returns {Promise<{ fetched: number, added: number }>}
 */
const syncGoogleReviews = async () => {
    if (!isConfigured()) {
        throw new Error('Google reviews sync not configured (GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID missing)');
    }
    if (isSyncing) return { fetched: 0, added: 0 };

    isSyncing = true;
    try {
        const googleReviews = await fetchGoogleReviews();
        let added = 0;

        for (const r of googleReviews) {
            const review = mapGoogleReview(r);
            if (!r.name || !review.content) continue; // דירוג בלי טקסט - לא מציגים

            const result = await Review.updateOne(
                { externalId: r.name },
                {
                    $set: review,
                    $setOnInsert: { source: 'google', isApproved: false }
                },
                { upsert: true }
            );
            if (result.upsertedCount) added++;
        }

        console.log(`Google reviews sync: fetched ${googleReviews.length}, added ${added}`);
        return { fetched: googleReviews.length, added };
    } finally {
        isSyncing = false;
    }
};

// סנכרון אוטומטי תקופתי (רץ פעם אחת בעליית השרת ואז כל X שעות)
const startGoogleReviewsSync = () => {
    if (!isConfigured()) {
        console.warn('⚠️ Google reviews sync disabled (GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID missing).');
        return;
    }

    const hours = Number(process.env.GOOGLE_REVIEWS_SYNC_HOURS) || DEFAULT_SYNC_HOURS;
    const run = () => syncGoogleReviews().catch(err => console.error('Google reviews sync error:', err.message));

    run();
    setInterval(run, hours * 60 * 60 * 1000);
};

module.exports = { syncGoogleReviews, startGoogleReviewsSync };
