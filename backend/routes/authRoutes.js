const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define the POST route for registration
// When the frontend sends data to /register, it triggers the controller logic
router.post('/register', authController.register);

// Define the POST route for login
router.post('/login', authController.login);

module.exports = router;