const axios = require('axios');
const University = require('../models/University');
const Course = require('../models/Course');
const Instructor = require('../models/Instructor');
const SyllabusTopic = require('../models/SyllabusTopic');
const ExamPattern = require('../models/ExamPattern');
const Resource = require('../models/Resource');

// 1. GET Universities
exports.getUniversities = async (req, res) => {
    try {
        const data = await University.find({});
        const formattedData = data.map(u => ({
            id: u.id,
            name: u.name || "Unknown University",
            logo: u.name ? u.name[0] : 'U'
        }));
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. GET Courses
exports.getCourses = async (req, res) => {
    try {
        const { university_id } = req.params;
        const data = await Course.find({ university_id });
        const formattedData = data.map(c => ({
            id: c.id,
            universityId: c.university_id,
            code: c.id.includes('-') ? c.id.split('-')[1].toUpperCase() : 'CS',
            name: c.name
        }));
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. GET Instructors
exports.getInstructors = async (req, res) => {
    try {
        const { course_id } = req.params;
        const data = await Instructor.find({ course_id });
        const formattedData = data.map(i => ({
            id: i.id,
            courseId: i.course_id,
            name: i.name,
            title: i.title,
            avatar: i.avatar
        }));
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. GET Course Details
exports.getCourseDetails = async (req, res) => {
    try {
        const { course_id } = req.params;
        const course = await Course.findOne({ id: course_id });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const university = await University.findOne({ id: course.university_id });

        res.json({
            courseId: course.id,
            courseName: course.name || 'Your Course',
            courseCode: course.id.includes('-') ? course.id.split('-').slice(1).join('-').toUpperCase() : 'CS',
            universityName: university?.name || 'Your University',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. GET Roadmap
exports.getRoadmap = async (req, res) => {
    try {
        const { course_id } = req.params;
        const data = await SyllabusTopic.find({ course_id }).sort({ week_number: 1 });
        const formattedData = data.map(t => ({
            id: t.id,
            course_id: t.course_id,
            week_number: t.week_number,
            phase: `Week ${t.week_number}`,
            topic: t.topic,
            aiPattern: t.ai_pattern_summary,
            ai_pattern_summary: t.ai_pattern_summary,
            complexity: t.complexity
        }));
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. GET Correlation
exports.getCorrelation = async (req, res) => {
    try {
        const { topic_id } = req.params;
        const data = await ExamPattern.find({ topic_id });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 7. POST Display Exam (Proxy)
exports.displayExam = async (req, res) => {
    try {
        const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.post(`${pythonServiceUrl}/api/student/displayexam`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error('Express Error calling Python service:', error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response ? (error.response.data.detail || error.response.data.error) : error.message;
        res.status(status).json({ error: `AI generation failed: ${message}` });
    }
};

// 8. GET Book Patterns (Proxy)
exports.getBookPatterns = async (req, res) => {
    const { course_id, topic_name } = req.params;
    try {
        const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.get(`${pythonServiceUrl}/api/student/book-patterns/${course_id}/${topic_name}`);
        res.json(response.data);
    } catch (error) {
        console.error('Express Error calling Python service for book-patterns:', error.message);
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ error: error.message });
    }
};

// 9. GET Resources
exports.getResources = async (req, res) => {
    try {
        const { courseId } = req.params;
        const resources = await Resource.find({ course_id: courseId });
        res.json(resources);
    } catch (error) {
        console.error("Error fetching resources:", error);
        res.status(500).json({ error: "Failed to fetch helping materials." });
    }
};
