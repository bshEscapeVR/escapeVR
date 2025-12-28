// models/Schemas/BilingualSchema.js
const mongoose = require('mongoose');

// זהו מבנה שנשתמש בו בכל מקום שיש טקסט דו-לשוני
const BilingualSchema = new mongoose.Schema({
    he: { type: String, trim: true, default: '' },
    en: { type: String, trim: true, default: '' }
}, { _id: false }); // _id: false כי זה תת-מסמך ולא צריך מזהה משלו

module.exports = BilingualSchema;