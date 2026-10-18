'use client';

import { useEffect, useState } from 'react';
import { roomService, pricingService } from '../services';
import { getPricedPlayerCounts } from '../utils/pricing';

// "2-8" או "60" אם המינימום והמקסימום זהים
const formatRange = (values) => {
    if (values.length === 0) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? `${min}` : `${min}-${max}`;
};

/**
 * נתוני הסטטיסטיקה במסך הפתיחה, מחושבים מהנתונים האמיתיים:
 * - שחקנים: כמויות שאפשר להזמין לפי המחירון (כולל כרטיסי טווח); אם אין מחירון - לפי טווחי החדרים
 * - דקות: משך המשחק של החדרים הפעילים
 * - עולמות: מספר החדרים הפעילים
 * כל ערך הוא null עד שהנתונים נטענו.
 */
const useSiteStats = () => {
    const [stats, setStats] = useState({ players: null, minutes: null, worlds: null });

    useEffect(() => {
        Promise.all([roomService.getAll(), pricingService.getAll()])
            .then(([rooms, plans]) => {
                const activeRooms = (rooms || []).filter((r) => r.isActive !== false);

                const pricedCounts = getPricedPlayerCounts(plans || []);
                const roomCounts = activeRooms.flatMap((r) => [r.features?.minPlayers, r.features?.maxPlayers]).filter(Boolean);

                setStats({
                    players: formatRange(pricedCounts.length ? pricedCounts : roomCounts),
                    minutes: formatRange(activeRooms.map((r) => r.features?.durationMinutes).filter(Boolean)),
                    worlds: activeRooms.length ? `${activeRooms.length}` : null
                });
            })
            .catch((err) => console.error('Error loading hero stats:', err));
    }, []);

    return stats;
};

export default useSiteStats;
