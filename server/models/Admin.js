// server/models/Admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// שימי לב: הסרנו את הפרמטר 'next' ופשוט נותנים לפונקציה לרוץ
AdminSchema.pre('save', async function() {
    // אם הסיסמה לא שונתה, אל תעשה כלום
    if (!this.isModified('password')) return;

    // הצפנת הסיסמה
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('Admin', AdminSchema);