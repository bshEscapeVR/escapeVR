'use strict';
// utils/pricing.js
// חישוב מחיר הזמנה לפי כרטיסי המחירון - אותה לוגיקה כמו web/src/utils/pricing.js.
// המחיר בכרטיס הוא לאדם; כרטיס טווח (players-maxPlayers) מכסה כמה כמויות.

const getPlanRange = (plan) => ({
    min: plan.players,
    max: plan.maxPlayers > plan.players ? plan.maxPlayers : plan.players
});

// מחיר כולל = מחיר לאדם * מספר משתתפים (0 אם אין כרטיס פעיל מתאים)
const calcTotalPrice = (plans, players) => {
    const plan = plans.find((p) => {
        if (!p.isActive) return false;
        const { min, max } = getPlanRange(p);
        return players >= min && players <= max;
    });
    return plan ? plan.newPrice * players : 0;
};

module.exports = { calcTotalPrice };
