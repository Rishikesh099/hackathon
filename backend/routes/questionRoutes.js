const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const authMiddleware = require('../middleware/authMiddleware');

// Route: POST /api/questions
router.post('/', authMiddleware.verifyToken, authMiddleware.isProfessor, questionController.createQuestion);
// Route: POST /api/questions/link-concept (Professor only)
router.post('/link-concept', authMiddleware.verifyToken, authMiddleware.isProfessor, questionController.linkQuestionToConcept);

// Route: GET /api/questions/lecture/:lectureId (Students & Professors can view)
router.get('/lecture/:lectureId', authMiddleware.verifyToken, questionController.getQuestionsByLecture);

module.exports = router;