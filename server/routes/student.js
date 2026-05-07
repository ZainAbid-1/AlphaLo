const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getDb } = require('../mongodb');

// 1. GET Universities
router.get('/universities', async (req, res) => {
    try {
        const db = await getDb();
        const data = await db.collection('universities').find({}).toArray();
        
        const formattedData = data.map(u => ({
            id: u.id,
            name: u.name || "Unknown University",
            logo: u.name ? u.name[0] : 'U'
        }));
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. GET Courses
router.get('/courses/:university_id', async (req, res) => {
    try {
        const { university_id } = req.params;
        const db = await getDb();
        const data = await db.collection('courses').find({ university_id }).toArray();

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
});

// 3. GET Instructors
router.get('/instructors/:course_id', async (req, res) => {
    try {
        const { course_id } = req.params;
        const db = await getDb();
        const data = await db.collection('instructors').find({ course_id }).toArray();

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
});

// 4. GET Roadmap
router.get('/roadmap/:course_id', async (req, res) => {
    try {
        const { course_id } = req.params;
        const db = await getDb();
        const data = await db.collection('syllabus_topics').find({ course_id }).sort({ week_number: 1 }).toArray();

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
});

// 5. GET Correlation
router.get('/correlation/:topic_id', async (req, res) => {
    try {
        const { topic_id } = req.params;
        const db = await getDb();
        const data = await db.collection('exam_patterns').find({ topic_id }).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. POST Display Exam (Wrapper for Python Service)
router.post('/displayexam', async (req, res) => {
    const { course_id, instructor_id, generation_count, paper_type } = req.body;
    
    try {
        const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
        
        // Forward request to FastAPI Service (which handles MongoDB internally)
        const response = await axios.post(`${pythonServiceUrl}/api/student/displayexam`, req.body);
        
        res.json(response.data);
    } catch (error) {
        console.error('Express Error calling Python service:', error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response ? (error.response.data.detail || error.response.data.error) : error.message;
        res.status(status).json({ error: `AI generation failed: ${message}` });
    }
});

// 7. GET Book Patterns (Forward to FastAPI)
router.get('/book-patterns/:course_id/:topic_name', async (req, res) => {
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
});

module.exports = router;
