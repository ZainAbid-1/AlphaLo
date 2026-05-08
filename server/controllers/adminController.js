const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const University = require('../models/University');
const Course = require('../models/Course');
const Instructor = require('../models/Instructor');
const SyllabusTopic = require('../models/SyllabusTopic');
const Resource = require('../models/Resource');

// 1. POST University
exports.addUniversity = async (req, res) => {
    const { id, name } = req.query;
    try {
        const university = new University({ id, name });
        await university.save();
        res.json({ status: 'University added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. POST Course
exports.addCourse = async (req, res) => {
    const { id, university_id, name } = req.query;
    try {
        const course = new Course({ id, university_id, name });
        await course.save();
        res.json({ status: 'Course added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. POST Topic
exports.addTopic = async (req, res) => {
    const { course_id, id, week, topic } = req.query;
    try {
        const syllabusTopic = new SyllabusTopic({
            id,
            course_id,
            week_number: parseInt(week),
            topic
        });
        await syllabusTopic.save();
        res.json({ status: 'Topic added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. POST Instructor
exports.addInstructor = async (req, res) => {
    const { id, course_id, name, title, avatar } = req.query;
    try {
        const instructor = new Instructor({ id, course_id, name, title, avatar });
        await instructor.save();
        res.json({ status: 'Instructor added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. POST Upload Textbook (Proxy)
exports.uploadTextbook = async (req, res) => {
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

        fs.unlinkSync(file.path);
        res.json(response.data);
    } catch (error) {
        console.error('Error forwarding textbook to Python:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// 6. POST Upload Past Paper (Proxy)
exports.uploadPastPaper = async (req, res) => {
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

        fs.unlinkSync(file.path);
        res.json(response.data);
    } catch (error) {
        console.error('Error forwarding past paper to Python:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// 7. POST Resource
exports.addResource = async (req, res) => {
    try {
        const { course_id, instructor_id, title, url, topic } = req.query;
        const resource = new Resource({
            course_id,
            instructor_id,
            title,
            url,
            topic
        });
        await resource.save();
        res.json({ status: 'success', message: 'Resource added successfully' });
    } catch (error) {
        console.error("Error saving resource:", error);
        res.status(500).json({ error: error.message });
    }
};
