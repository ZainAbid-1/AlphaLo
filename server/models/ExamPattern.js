const mongoose = require('mongoose');

const examPatternSchema = new mongoose.Schema({
    topic_id: { type: String, required: true },
    pattern_name: String,
    frequency: Number,
    description: String,
    examples: [String]
}, { timestamps: true });

module.exports = mongoose.model('ExamPattern', examPatternSchema);
