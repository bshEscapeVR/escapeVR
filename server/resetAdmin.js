require('dotenv').config(); // טוען את החיבור לענן מה-.env
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

console.log("Connecting to DB...", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to Cloud DB');
        
        // מחיקת האדמין הישן (כדי למנוע בעיות הצפנה כפולות)
        await Admin.deleteOne({ username: 'admin' });
        
        // יצירת אדמין חדש ונקי
        const newAdmin = new Admin({
            username: 'admin',
            password: '123' // הסיסמה החדשה
        });

        await newAdmin.save();
        
        console.log('🎉 Admin Reset Successfully!');
        console.log('User: admin');
        console.log('Pass: 123');
        
        process.exit();
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });