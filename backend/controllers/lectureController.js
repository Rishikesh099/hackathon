const db = require('../database/db');
const { generateAssessment } = require('../services/groqService');

// 1. Create Lecture + Auto-generate Assessment via AI
exports.createLectureWithAI = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { title, topic } = req.body;
    const professorId = req.userId; // From authMiddleware[cite: 6]

    if (!title || !topic) {
      return res.status(400).json({ error: 'Title and topic are required' });
    }

    await connection.beginTransaction();

    // A. Insert Lecture[cite: 15]
    const [lecResult] = await connection.execute(
      'INSERT INTO lectures (title, topic, professor_id) VALUES (?, ?, ?)',
      [title, topic, professorId]
    );
    const lectureId = lecResult.insertId;

    // B. Generate Concepts & Questions with Groq
    const assessment = await generateAssessment(topic);

    // C. Save Concepts and Link to Lecture[cite: 15]
    const conceptMap = {};
    for (let c of assessment.concepts) {
      const [cResult] = await connection.execute(
        'INSERT INTO concepts (name, description) VALUES (?, ?)',
        [c.name, c.description]
      );
      const conceptId = cResult.insertId;
      conceptMap[c.name] = conceptId;

      await connection.execute(
        'INSERT INTO lecture_concepts (lecture_id, concept_id, is_prerequisite) VALUES (?, ?, ?)',
        [lectureId, conceptId, (c.prerequisites && c.prerequisites.length > 0)]
      );
    }

    // D. Save Questions, Options, and Link Concepts[cite: 15]
    for (let q of assessment.questions) {
      const [qResult] = await connection.execute(
        'INSERT INTO questions (lecture_id, question_text, difficulty) VALUES (?, ?, ?)',
        [lectureId, q.question, q.difficulty]
      );
      const questionId = qResult.insertId;

      // Link to tested concept[cite: 15]
      const primaryConcept = q.concepts && q.concepts.length > 0 ? q.concepts[0] : null;
      if (primaryConcept && conceptMap[primaryConcept]) {
        await connection.execute(
          'INSERT INTO question_concepts (question_id, concept_id) VALUES (?, ?)',
          [questionId, conceptMap[primaryConcept]]
        );
      }

      // Save Options and Flag Correct Answer[cite: 15]
      for (let i = 0; i < q.options.length; i++) {
        await connection.execute(
          'INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
          [questionId, q.options[i], i === q.correctIndex]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Lecture created and AI diagnostic questions generated successfully!',
      lectureId,
      concepts_generated: assessment.concepts.length,
      questions_generated: assessment.questions.length
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error generating lecture assessment:', error);
    res.status(500).json({ error: 'Failed to create lecture and assessment' });
  } finally {
    connection.release();
  }
};

// 2. Fetch All Lectures[cite: 4]
exports.getAllLectures = async (req, res) => {
  try {
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