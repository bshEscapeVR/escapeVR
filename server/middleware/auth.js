const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // קבלת הטוקן מה-Header
    const token = req.header('x-auth-token');
    
    // אם אין טוקן בכלל -> 401 (לא מורשה)
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // אימות הטוקן
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');
        req.user = decoded;
        next();
    } catch (e) {
        // 👇 הוספתי כאן לוג כדי שנראה את השגיאה בטרמינל
        console.error("Auth Middleware Error:", e.message); 
        
        
        res.status(400).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;