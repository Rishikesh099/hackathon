const express = require('express');
const router = express.Router();
const lectureController = require('../controllers/lectureController');
const authMiddleware = require('../middleware/authMiddleware');

// Route: POST /api/lectures
// Middleware chain: Check Token -> Check if Professor -> Run Controller
router.post(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.isProfessor, 
  lectureController.createLecture
);

// Route: GET /api/lectures
// Middleware: Only requires a valid token (Students and Professors can both view)
router.get('/', authMiddleware.verifyToken, lectureController.getAllLectures);


module.exports = router;