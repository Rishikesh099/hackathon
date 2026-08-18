const db = require('../database/db');

// 1. Create a manual concept[cite: 3]
exports.createConcept = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const [result] = await db.execute(
      'INSERT INTO concepts (name, description) VALUES (?, ?)',
      [name, description]
    );

    res.status(201).json({ 
      message: 'Concept created successfully!', 
      conceptId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating concept:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 2. Link concept to lecture[cite: 3]
exports.linkConceptToLecture = async (req, res) => {
  try {
    const { lecture_id, concept_id, is_prerequisite } = req.body;

    if (!lecture_id || !concept_id) {
      return res.status(400).json({ error: 'lecture_id and concept_id are required' });
    }

    await db.execute(
      'INSERT INTO lecture_concepts (lecture_id, concept_id, is_prerequisite) VALUES (?, ?, ?)',
      [lecture_id, concept_id, is_prerequisite || false]
    );

    res.status(201).json({ message: 'Concept successfully linked to lecture!' });
  } catch (error) {
    console.error('Error linking concept:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 3. Get all concepts associated with a specific lecture
exports.getConceptsByLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const [concepts] = await db.execute(`
      SELECT c.id, c.name, c.description, lc.is_prerequisite
      FROM concepts c
      JOIN lecture_concepts lc ON c.id = lc.concept_id
      WHERE lc.lecture_id = ?
    `, [lectureId]);

    res.status(200).json(concepts);
  } catch (error) {
    console.error('Error fetching lecture concepts:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 4. Get all concepts in the system
exports.getAllConcepts = async (req, res) => {
  try {
    const [concepts] = await db.execute('SELECT * FROM concepts ORDER BY name ASC');
    res.status(200).json(concepts);
  } catch (error) {
    console.error('Error fetching concepts:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};