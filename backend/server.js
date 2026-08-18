// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const lectureRoutes = require('./routes/lectureRoutes'); 

const conceptRoutes = require('./routes/conceptRoutes');
const questionRoutes = require('./routes/questionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/analytics', analyticsRoutes);
app.use('/api/concepts', conceptRoutes);
app.use('/api/questions', questionRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/lectures', lectureRoutes);

// Correct paths pointing one directory up to /frontend
const frontendPath = path.join(__dirname, '..', 'frontend');

// Serve Frontend Static Directories
app.use(express.static(path.join(frontendPath, 'public')));
app.use('/professor', express.static(path.join(frontendPath, 'professor')));
app.use('/student', express.static(path.join(frontendPath, 'student')));

// HTML Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'public', 'index.html'));
});

app.get('/professor', (req, res) => {
  res.sendFile(path.join(frontendPath, 'professor', 'professor.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(frontendPath, 'student', 'student.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// 404 handler for missing API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});