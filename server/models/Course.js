const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    university_id: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    code: String
}, { timestamps: true, collection: 'courses' });

module.exports = mongoose.model('Course', courseSchema);
