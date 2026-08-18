const db = require('../../database/db');

// Create a new learning concept
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

// Link a concept to a lecture
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