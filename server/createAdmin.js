require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin'); // וודאי שהנתיב למודל נכון

// כתובת ה-URI (החליפי לכתובת של אירלנד אם את מריצה מקומית בלי .env)
const mongoURI = 'mongodb+srv://escapevrbsh_db_user:DwVLmTDcafRVhIxy@clus-scapevr-stable.g7teaig.mongodb.net/?appName=Clus-scapeVR-Stable';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected for Admin Creation...'))
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });

const createInitialAdmin = async () => {
    try {
        // 1. בדיקה אם כבר קיים אדמין (כדי לא ליצור כפילויות)
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            console.log('❌ Admin already exists. No need to create one.');
            process.exit();
        }

        // 2. הגדרת פרטי המנהל (שני אותם למה שאת רוצה)
        const username = 'yechiel-admin'; 
        const password = 'Escape@VR2026'; // וודאי שזה עומד בחוקים: 8 תווים, אות גדולה, קטנה, מספר ותו מיוחד

        // 3. יצירת האדמין
        // הערה: אני מניח שבמודל Admin שלך יש pre-save hook שמצפין את הסיסמה (bcrypt)
        const admin = new Admin({
            username,
            password,
            failedAttempts: 0
        });

        await admin.save();
        console.log('====================================');
        console.log('✅ Initial Admin Created Successfully!');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log('====================================');

        process.exit();
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    }
};

createInitialAdmin();