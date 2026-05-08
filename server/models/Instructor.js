const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    course_id: { type: String, required: true },
    name: { type: String, required: true },
    title: String,
    avatar: String,
    bio: String
}, { timestamps: true, collection: 'instructors' });

module.exports = mongoose.model('Instructor', instructorSchema);
