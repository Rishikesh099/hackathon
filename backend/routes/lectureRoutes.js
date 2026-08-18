const express = require('express');
const router = express.Router();
const lectureController = require('../controllers/lectureController');
const authMiddleware = require('../middleware/authMiddleware');

// Route: POST /api/lectures (Auto-generates questions + concepts with AI)
router.post(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.isProfessor, 
  lectureController.createLectureWithAI
);

// Route: GET /api/lectures[cite: 10]
router.get('/', authMiddleware.verifyToken, lectureController.getAllLectures);

module.exports = router;