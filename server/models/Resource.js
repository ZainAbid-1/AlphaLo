const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    course_id: { type: String, required: true },
    title: { type: String, required: true },
    type: String, // e.g., 'pdf', 'video', 'link'
    url: String,
    description: String
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
