const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: [3, 'Username must be at least 3 characters'],
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: [8, 'Password must be at least 8 characters']
    },
    lastLogin: {
        type: Date,
        default: null
    },
    failedAttempts: {
        type: Number,
        default: 0
    }
});

AdminSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('Admin', AdminSchema);
