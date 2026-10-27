const jwt = require('jsonwebtoken');

// כמו auth, אבל לא חוסם: אם יש טוקן תקין - req.user מוגדר (מנהל), אחרת ממשיכים כאורח.
// משמש בנתיבים ציבוריים שמתנהגים אחרת עבור מנהל (למשל מחיר ידני בהזמנה).
const optionalAuth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (token && process.env.JWT_SECRET) {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) { /* טוקן לא תקין - ממשיכים כאורח */ }
    }
    next();
};

module.exports = optionalAuth;
