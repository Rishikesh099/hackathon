const db = require('../database/db');

// 1. Manually create a question with options
exports.createQuestion = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { lecture_id, question_text, difficulty, concept_id, options } = req.body;

    if (!lecture_id || !question_text || !difficulty || !options || options.length === 0) {
      return res.status(400).json({ error: 'lecture_id, question_text, difficulty, and options are required' });
    }

    await connection.beginTransaction();

    // Insert Question
    const [qResult] = await connection.execute(
      'INSERT INTO questions (lecture_id, question_text, difficulty) VALUES (?, ?, ?)',
      [lecture_id, question_text, difficulty]
    );
    const questionId = qResult.insertId;

    // Link Concept if provided
    if (concept_id) {
      await connection.execute(
        'INSERT INTO question_concepts (question_id, concept_id) VALUES (?, ?)',
        [questionId, concept_id]
      );
    }

    // Insert Options
    for (let opt of options) {
      await connection.execute(
        'INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
        [questionId, opt.option_text, Boolean(opt.is_correct)]
      );
    }

    await connection.commit();

    res.status(201).json({ 
      message: 'Question and options created successfully!', 
      questionId 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating question:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// 2. Fetch all questions + options for a lecture (Safe for Students)
exports.getQuestionsByLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const isProf = (req.userRole === 'professor');

    // Fetch Questions with linked Concept info
    const [questions] = await db.execute(`
      SELECT q.id, q.lecture_id, q.question_text, q.difficulty,
             c.id AS concept_id, c.name AS concept_name
      FROM questions q
      LEFT JOIN question_concepts qc ON q.id = qc.question_id
      LEFT JOIN concepts c ON qc.concept_id = c.id
      WHERE q.lecture_id = ?
    `, [lectureId]);

    // Attach options to each question
    const fullQuestions = [];
    for (let q of questions) {
      // If student, do not reveal 'is_correct' in the payload
      const optionQuery = isProf
        ? 'SELECT id, option_text, is_correct FROM question_options WHERE question_id = ?'
        : 'SELECT id, option_text FROM question_options WHERE question_id = ?';

      const [options] = await db.execute(optionQuery, [q.id]);
      fullQuestions.push({ ...q, options });
    }

    res.status(200).json(fullQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 3. Link a question to a concept
exports.linkQuestionToConcept = async (req, res) => {
  try {
    const { question_id, concept_id } = req.body;

    if (!question_id || !concept_id) {
      return res.status(400).json({ error: 'question_id and concept_id are required' });
    }

    await db.execute(
      'INSERT INTO question_concepts (question_id, concept_id) VALUES (?, ?)',
      [question_id, concept_id]
    );

    res.status(201).json({ message: 'Question successfully linked to concept!' });
  } catch (error) {
    console.error('Error linking question to concept:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};