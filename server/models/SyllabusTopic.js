const mongoose = require('mongoose');

const syllabusTopicSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    course_id: { type: String, required: true },
    week_number: Number,
    topic: { type: String, required: true },
    ai_pattern_summary: String,
    complexity: String
}, { timestamps: true, collection: 'syllabus_topics' });

module.exports = mongoose.model('SyllabusTopic', syllabusTopicSchema);
