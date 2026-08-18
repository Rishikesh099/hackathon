const express = require('express');
const router = express.Router();
const conceptController = require('../controllers/conceptController');
const authMiddleware = require('../middleware/authMiddleware');

// Route: POST /api/concepts
router.post('/', authMiddleware.verifyToken, authMiddleware.isProfessor, conceptController.createConcept);

// Route: POST /api/concepts/link
router.post('/link', authMiddleware.verifyToken, authMiddleware.isProfessor, conceptController.linkConceptToLecture);

module.exports = router;