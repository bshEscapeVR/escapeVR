require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect('mongodb://localhost:27017/vr_escape')
    .then(async () => {
        // כאן את בוחרת שם משתמש וסיסמה
        const admin = new Admin({ username: 'admin', password: '123' });
        await admin.save();
        console.log('✅ Admin created successfully');
        process.exit();
    })
    .catch(err => console.log(err));