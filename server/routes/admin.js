const express = require('express');
const router = express.Router();
const { getDb } = require('../mongodb');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const { isAdmin } = require('../auth');

const upload = multer({ dest: 'uploads/' });

router.use(isAdmin);

// 1. POST University
router.post('/university', async (req, res) => {
    const { id, name } = req.query;
    try {
        const db = await getDb();
        await db.collection('universities').insertOne({ id, name });
        res.json({ status: 'University added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. POST Course
router.post('/course', async (req, res) => {
    const { id, university_id, name } = req.query;
    try {
        const db = await getDb();
        await db.collection('courses').insertOne({ id, university_id, name });
        res.json({ status: 'Course added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. POST Topic
router.post('/topic', async (req, res) => {
    const { course_id, id, week, topic } = req.query;
    try {
        const db = await getDb();
        await db.collection('syllabus_topics').insertOne({
            id,
            course_id,
            week_number: parseInt(week),
            topic
        });
        res.json({ status: 'Topic added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. POST Instructor
router.post('/instructor', async (req, res) => {
    const { id, course_id, name, title, avatar } = req.query;
    try {
        const db = await getDb();
        await db.collection('instructors').insertOne({
            id,
            course_id,
            name,
            title,
            avatar
        });
        res.json({ status: 'Instructor added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. POST Upload Textbook (Forward to FastAPI)
router.post('/upload-textbook/:course_id', upload.single('file'), async (req, res) => {
    const { course_id } = req.params;
    const { title, instructor_id } = req.query;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.path), file.originalname);

        const response = await axios.post(`${pythonServiceUrl}/api/admin/upload-textbook/${course_id}`, formData, {
            params: { title, instructor_id },
            headers: { 
                ...formData.getHeaders(),
                'Authorization': req.headers.authorization
            }
        });

        // Cleanup temp file
        fs.unlinkSync(file.path);

        res.json(response.data);
    } catch (error) {
        console.error('Error forwarding textbook to Python:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 6. POST Upload Past Paper (Forward to FastAPI)
router.post('/upload-past-paper/:course_id', upload.single('file'), async (req, res) => {
    const { course_id } = req.params;
    const { title, instructor_id, paper_type } = req.query;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.path), file.originalname);

        const response = await axios.post(`${pythonServiceUrl}/api/admin/upload-past-paper/${course_id}`, formData, {
            params: { title, instructor_id, paper_type },
            headers: { 
                ...formData.getHeaders(),
                'Authorization': req.headers.authorization
            }
        });

        // Cleanup temp file
        fs.unlinkSync(file.path);

        res.json(response.data);
    } catch (error) {
        console.error('Error forwarding past paper to Python:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/resource', async (req, res) => {
    try {
        const { course_id, instructor_id, title, url, topic } = req.query;
        const db = await getDb();
        
        await db.collection('resources').insertOne({
            course_id,
            instructor_id,
            title,
            url,
            topic,
            created_at: new Date()
        });

        res.json({ status: 'success', message: 'Resource added successfully' });
    } catch (error) {
        console.error("Error saving resource:", error);
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;