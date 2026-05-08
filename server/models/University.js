const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: String,
    logo_url: String
}, { timestamps: true });

module.exports = mongoose.model('University', universitySchema);
