const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

// Route: POST /api/analytics/attempts (Evaluates attempt & updates mastery)[cite: 7]
router.post('/attempts', authMiddleware.verifyToken, analyticsController.submitAttempt);

// Route: POST /api/analytics/finalize (Generates & saves collective diagnostic report)
router.post('/finalize', authMiddleware.verifyToken, analyticsController.finalizeAssessment);

// Route: GET /api/analytics/mastery[cite: 7]
router.get('/mastery', authMiddleware.verifyToken, analyticsController.getStudentMastery);

// Route: GET /api/analytics/recommendations[cite: 7]
router.get('/recommendations', authMiddleware.verifyToken, analyticsController.getRecommendations);

module.exports = router;