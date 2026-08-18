const db = require('../../database/db');

exports.createLecture = async (req, res) => {
  try {
    // 1. Changed 'description' to 'topic'
    const { title, topic } = req.body;
    
    const professorId = req.userId;

    // 2. Changed 'description' to 'topic'
    if (!title || !topic) {
      return res.status(400).json({ error: 'Title and topic are required' });
    }

    // 3 & 4. Changed 'description' to 'topic' in the SQL query and array
    const [result] = await db.execute(
      'INSERT INTO lectures (title, topic, professor_id) VALUES (?, ?, ?)',
      [title, topic, professorId]
    );

    res.status(201).json({ 
      message: 'Lecture created successfully!', 
      lectureId: result.insertId 
    });

  } catch (error) {
    console.error('Error creating lecture:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
exports.getAllLectures = async (req, res) => {
  try {
    // A simple SELECT query to grab all lectures. 
    // We are also joining the users table so we can send the professor's name to the frontend!
    const [lectures] = await db.execute(`
      SELECT l.id, l.title, l.topic, l.created_at, u.name AS professor_name 
      FROM lectures l
      JOIN users u ON l.professor_id = u.id
      ORDER BY l.created_at DESC
    `);

    res.status(200).json(lectures);

  } catch (error) {
    console.error('Error fetching lectures:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};