const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// 1. GET Universities
router.get('/universities', studentController.getUniversities);

// 2. GET Courses
router.get('/courses/:university_id', studentController.getCourses);

// 3. GET Instructors
router.get('/instructors/:course_id', studentController.getInstructors);

// 4. GET Course Details
router.get('/course-details/:course_id', studentController.getCourseDetails);

// 5. GET Roadmap
router.get('/roadmap/:course_id', studentController.getRoadmap);

// 6. GET Correlation
router.get('/correlation/:topic_id', studentController.getCorrelation);

// 7. POST Display Exam
router.post('/displayexam', studentController.displayExam);

// 8. GET Book Patterns
router.get('/book-patterns/:course_id/:topic_name', studentController.getBookPatterns);

// 9. GET Resources
router.get('/resources/:courseId', studentController.getResources);

module.exports = router;
