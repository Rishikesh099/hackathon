const db = require('../../database/db');

// 1. Submit a student's quiz attempt
exports.submitAttempt = async (req, res) => {
  try {
    const { 
      question_id, 
      selected_option_id, 
      is_correct, 
      reasoning, 
      reasoning_score, 
      concept_score 
    } = req.body;
    
    const studentId = req.userId; // Safely grabbed from the JWT token middleware

    if (!question_id || !selected_option_id || typeof is_correct === 'undefined') {
      return res.status(400).json({ error: 'question_id, selected_option_id, and is_correct are required' });
    }

    // Insert using the exact column names from your database
    await db.execute(
      `INSERT INTO attempts 
      (student_id, question_id, selected_option_id, is_correct, reasoning, reasoning_score, concept_score) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId, 
        question_id, 
        selected_option_id, 
        is_correct, 
        reasoning || null, 
        reasoning_score || 0, 
        concept_score || 0
      ]
    );

    res.status(201).json({ message: 'Attempt recorded successfully!' });
  } catch (error) {
    console.error('Error submitting attempt:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 2. Get a student's mastery dashboard
exports.getStudentMastery = async (req, res) => {
  try {
    const studentId = req.userId;

    // Matches 'student_id' column
    const [mastery] = await db.execute(`
      SELECT m.*, c.name AS concept_name 
      FROM student_mastery m 
      JOIN concepts c ON m.concept_id = c.id 
      WHERE m.student_id = ?
    `, [studentId]);

    res.status(200).json(mastery);
  } catch (error) {
    console.error('Error fetching mastery:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 3. Get recommendations for a student
exports.getRecommendations = async (req, res) => {
  try {
    const studentId = req.userId;

    // Matches 'student_id' column
    const [recommendations] = await db.execute(`
      SELECT r.*, c.name AS concept_name 
      FROM recommendations r 
      JOIN concepts c ON r.concept_id = c.id 
      WHERE r.student_id = ?
    `, [studentId]);

    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Save a recommendation for a student (Can be called by your backend/LLM service)
exports.createRecommendation = async (req, res) => {
  try {
    const { student_id, concept_id, recommendation_text } = req.body;

    if (!student_id || !concept_id || !recommendation_text) {
      return res.status(400).json({ error: 'student_id, concept_id, and recommendation_text are required' });
    }

    await db.execute(
      'INSERT INTO recommendations (student_id, concept_id, recommendation_text) VALUES (?, ?, ?)',
      [student_id, concept_id, recommendation_text]
    );

    res.status(201).json({ message: 'Recommendation saved successfully!' });
  } catch (error) {
    console.error('Error saving recommendation:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};