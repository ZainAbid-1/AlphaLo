const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../auth');

const upload = multer({ dest: 'uploads/' });

router.use(isAdmin);

// 1. POST University
router.post('/university', adminController.addUniversity);

// 2. POST Course
router.post('/course', adminController.addCourse);

// 3. POST Topic
router.post('/topic', adminController.addTopic);

// 4. POST Instructor
router.post('/instructor', adminController.addInstructor);

// 5. POST Upload Textbook
router.post('/upload-textbook/:course_id', upload.single('file'), adminController.uploadTextbook);

// 6. POST Upload Past Paper
router.post('/upload-past-paper/:course_id', upload.single('file'), adminController.uploadPastPaper);

// 7. POST Resource
router.post('/resource', adminController.addResource);

module.exports = router;