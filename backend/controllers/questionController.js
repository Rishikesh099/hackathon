const db = require('../../database/db');

exports.createQuestion = async (req, res) => {
  try {
    const { lecture_id, question_text, difficulty, options } = req.body;

    if (!lecture_id || !question_text || !difficulty || !options || options.length === 0) {
      return res.status(400).json({ error: 'lecture_id, question_text, difficulty, and an array of options are required' });
    }

    // 1. Insert the main question
    const [qResult] = await db.execute(
      'INSERT INTO questions (lecture_id, question_text, difficulty) VALUES (?, ?, ?)',
      [lecture_id, question_text, difficulty]
    );
    const questionId = qResult.insertId;

    // 2. Loop through and insert all provided options tied to the new questionId
    for (let opt of options) {
      await db.execute(
        'INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
        [questionId, opt.option_text, opt.is_correct]
      );
    }

    res.status(201).json({ 
      message: 'Question and options created successfully!', 
      questionId: questionId 
    });
  } catch (error) {
    console.error('Error creating question:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// 1. Link a question to a concept
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

// 2. Fetch questions and their options for a lecture (so students can take the quiz)
exports.getQuestionsByLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    // Grab all questions for the lecture
    const [questions] = await db.execute(
      'SELECT * FROM questions WHERE lecture_id = ?',
      [lectureId]
    );

    // For each question, grab its options
    const fullQuestions = [];
    for (let q of questions) {
      const [options] = await db.execute(
        'SELECT id, option_text, is_correct FROM question_options WHERE question_id = ?',
        [q.id]
      );
      fullQuestions.push({ ...q, options });
    }

    res.status(200).json(fullQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};