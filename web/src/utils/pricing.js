// utils/pricing.js
// לוגיקה משותפת לכרטיסי מחירון - כרטיס רגיל (כמות אחת) או כרטיס טווח (למשל 6-8 שחקנים).
// המחיר בכרטיס הוא תמיד לאדם.

export const isRangePlan = (plan) => plan.maxPlayers > plan.players;

// טווח השחקנים שכרטיס מכסה
export const getPlanRange = (plan) => ({
    min: plan.players,
    max: isRangePlan(plan) ? plan.maxPlayers : plan.players
});

// תווית תצוגה: "4" או "6-8"
export const formatPlanPlayers = (plan) => {
    const { min, max } = getPlanRange(plan);
    return min === max ? `${min}` : `${min}-${max}`;
};

// הכרטיס הפעיל שמכסה כמות שחקנים נתונה
export const findPlanForPlayers = (plans, players) =>
    plans.find((plan) => {
        if (!plan.isActive) return false;
        const { min, max } = getPlanRange(plan);
        return players >= min && players <= max;
    });

// מחיר כולל להזמנה = מחיר לאדם * מספר משתתפים (0 אם אין כרטיס מתאים)
export const calcTotalPrice = (plans, players) => {
    const plan = findPlanForPlayers(plans, players);
    return plan ? plan.newPrice * players : 0;
};

// כל כמויות השחקנים שיש להן מחיר (כולל פריסת טווחים), ממוינות
export const getPricedPlayerCounts = (plans) => {
    const counts = new Set();
    plans.filter((p) => p.isActive).forEach((plan) => {
        const { min, max } = getPlanRange(plan);
        for (let n = min; n <= max; n++) counts.add(n);
    });
    return [...counts].sort((a, b) => a - b);
};

// כמויות ללא מחיר בין הכמות הנמוכה לגבוהה ביותר שמתומחרות (חורים במחירון)
export const getMissingPlayerCounts = (plans) => {
    const counts = getPricedPlayerCounts(plans);
    if (counts.length === 0) return [];
    const missing = [];
    for (let n = counts[0]; n <= counts[counts.length - 1]; n++) {
        if (!counts.includes(n)) missing.push(n);
    }
    return missing;
};
