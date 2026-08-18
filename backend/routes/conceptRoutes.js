const express = require('express');
const router = express.Router();
const conceptController = require('../controllers/conceptController');
const authMiddleware = require('../middleware/authMiddleware');

// Route: GET /api/concepts (All concepts)
router.get('/', authMiddleware.verifyToken, conceptController.getAllConcepts);

// Route: GET /api/concepts/lecture/:lectureId (Concepts for a lecture)
router.get('/lecture/:lectureId', authMiddleware.verifyToken, conceptController.getConceptsByLecture);

// Route: POST /api/concepts (Professor only)[cite: 9]
router.post('/', authMiddleware.verifyToken, authMiddleware.isProfessor, conceptController.createConcept);

// Route: POST /api/concepts/link (Professor only)[cite: 9]
router.post('/link', authMiddleware.verifyToken, authMiddleware.isProfessor, conceptController.linkConceptToLecture);

module.exports = router;