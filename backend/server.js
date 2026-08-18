// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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