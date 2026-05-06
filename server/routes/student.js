const express = require('express');
const router = express.Router();
const axios = require('axios');
const supabase = require('../supabase');

// 1. GET Universities
router.get('/universities', async (req, res) => {
    try {
        const { data, error } = await supabase.from('universities').select('*');
        if (error) throw error;
        
        const formattedData = data.map(u => ({
            id: u.id,
            name: u.name,
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
        const { data, error } = await supabase.from('courses').select('*').eq('university_id', university_id);
        if (error) throw error;

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
        const { data, error } = await supabase.from('instructors').select('*').eq('course_id', course_id);
        if (error) throw error;

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
        const { data, error } = await supabase.from('syllabus_topics').select('*').eq('course_id', course_id);
        if (error) throw error;

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
        const { data, error } = await supabase.from('exam_patterns').select('*').eq('topic_id', topic_id);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. POST Display Exam (Wrapper for Python Service)
router.post('/displayexam', async (req, res) => {
    const { course_id, instructor_id, generation_count, paper_type } = req.body;
    
    try {
        // Fetch past paper from Supabase
        const { data: papers, error } = await supabase.from('past_papers')
            .select('*')
            .eq('course_id', course_id)
            .eq('instructor_id', instructor_id)
            .eq('paper_type', paper_type);

        if (error) throw error;
        if (!papers || papers.length === 0) {
            return res.status(404).json({ error: 'Past paper not found for this course and instructor.' });
        }

        const past_paper = papers[0];
        const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

        // Forward request to FastAPI Service
        // We can either call a generic "generate" endpoint or specific ones if we restructure FastAPI
        // For now, let's assume we call a proxy endpoint on FastAPI that handles the logic
        // OR we just send the raw data to FastAPI and let it handle the AI logic.
        
        const payload = {
            course_id,
            instructor_id,
            generation_count,
            paper_type,
            // We pass the blueprint if available to save the Python service a DB call
            blueprint: past_paper.blueprint,
            raw_content: past_paper.raw_content
        };

        // Assuming we add a /generate-proxy endpoint to FastAPI or use existing ones
        // Actually, the original Python code was:
        // if past_paper.get("blueprint"): data = await exam_generator.generate_from_blueprint(past_paper["blueprint"])
        // else: data = await exam_generator.generate(past_paper["raw_content"], request.generation_count, cache_key)
        
        // Let's call the Python service. We'll need to make sure FastAPI has an endpoint that accepts these.
        const response = await axios.post(`${pythonServiceUrl}/api/student/displayexam`, req.body);
        
        res.json(response.data);
    } catch (error) {
        console.error('Express Error calling Python service:', error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data.detail : error.message;
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
