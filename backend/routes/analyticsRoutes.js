const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

// Route: POST /api/analytics/attempts
router.post('/attempts', authMiddleware.verifyToken, analyticsController.submitAttempt);

// Route: GET /api/analytics/mastery
router.get('/mastery', authMiddleware.verifyToken, analyticsController.getStudentMastery);

// Route: GET /api/analytics/recommendations
router.get('/recommendations', authMiddleware.verifyToken, analyticsController.getRecommendations);
// Route: POST /api/analytics/recommendations
router.post('/recommendations', authMiddleware.verifyToken, analyticsController.createRecommendation);
module.exports = router;