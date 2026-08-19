const db = require('../database/db');
const { analyzeReasoning, generateCollectiveReport } = require('../services/groqService');
const { calculateMastery, getMasteryTier } = require('../services/knowledgeEngine');

// 1. Submit Single Question Attempt with Live AI Cross-Check
exports.submitAttempt = async (req, res) => {
  try {
    const { question_id, selected_option_id, reasoning } = req.body;
    const studentId = req.userId; // From JWT[cite: 1, 6]

    if (!question_id || !selected_option_id) {
      return res.status(400).json({ error: 'question_id and selected_option_id are required' });
    }

    // A. Query question text, chosen option, correctness, and linked concept[cite: 15]
    const [optRows] = await db.execute(
      `SELECT qo.option_text, qo.is_correct, q.question_text, q.difficulty, qc.concept_id, c.name AS concept_name
       FROM question_options qo
       JOIN questions q ON qo.question_id = q.id
       LEFT JOIN question_concepts qc ON q.id = qc.question_id
       LEFT JOIN concepts c ON qc.concept_id = c.id
       WHERE qo.id = ? AND q.id = ?`,
      [selected_option_id, question_id]
    );

    if (optRows.length === 0) {
      return res.status(404).json({ error: 'Question or option not found' });
    }

    const optData = optRows[0];
    const isCorrect = Boolean(optData.is_correct);
    const conceptId = optData.concept_id;
    const conceptName = optData.concept_name || 'General Concept';

    // B. AI Reasoning Cross-Check
    const aiAnalysis = await analyzeReasoning(
      optData.question_text,
      optData.option_text,
      reasoning || 'No reasoning provided',
      conceptName,
      isCorrect
    );

    // C. Insert Attempt into Database[cite: 1, 15]
    await db.execute(
      `INSERT INTO attempts 
      (student_id, question_id, selected_option_id, is_correct, reasoning, reasoning_score, concept_score) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId, 
        question_id, 
        selected_option_id, 
        isCorrect, 
        reasoning || null, 
        aiAnalysis.reasoning_score, 
        aiAnalysis.concept_score
      ]
    );

    // D. Compute & Upsert Mastery into student_mastery[cite: 15]
    let updatedMasteryScore = 50.0;
    if (conceptId) {
      const [masteryRows] = await db.execute(
        `SELECT mastery_score, attempt_count FROM student_mastery WHERE student_id = ? AND concept_id = ?`,
        [studentId, conceptId]
      );

      const oldMastery = masteryRows.length > 0 ? Number(masteryRows[0].mastery_score) : 50.0;
      updatedMasteryScore = calculateMastery(oldMastery, isCorrect, aiAnalysis.reasoning_score);

      await db.execute(
        `INSERT INTO student_mastery (student_id, concept_id, mastery_score, attempt_count)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE 
           mastery_score = VALUES(mastery_score),
           attempt_count = attempt_count + 1`,
        [studentId, conceptId, updatedMasteryScore]
      );
    }

    // Return instant feedback payload
    res.status(201).json({
      message: 'Attempt submitted and evaluated successfully!',
      alignment_status: aiAnalysis.alignment_status,
      feedback: aiAnalysis.feedback,
      reasoning_score: aiAnalysis.reasoning_score,
      concept_score: aiAnalysis.concept_score,
      updated_mastery: updatedMasteryScore,
      tier: getMasteryTier(updatedMasteryScore)
    });

  } catch (error) {
    console.error('Error submitting attempt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 2. Finalize Assessment & Save Collective Diagnostic Report[cite: 15]
exports.finalizeAssessment = async (req, res) => {
  try {
    const { lecture_id } = req.body;
    const studentId = req.userId; // From JWT[cite: 1, 6]

    if (!lecture_id) {
      return res.status(400).json({ error: 'lecture_id is required' });
    }

    // A. Fetch Lecture Topic & All Student Attempts for this Lecture[cite: 15]
    const [lecRows] = await db.execute('SELECT topic FROM lectures WHERE id = ?', [lecture_id]);
    if (lecRows.length === 0) return res.status(404).json({ error: 'Lecture not found' });
    const topic = lecRows[0].topic;

    const [attempts] = await db.execute(`
      SELECT a.is_correct, a.reasoning, a.reasoning_score, a.concept_score,
             q.question_text, qo.option_text AS selected_option, c.id AS concept_id, c.name AS concept_name
      FROM attempts a
      JOIN questions q ON a.question_id = q.id
      JOIN question_options qo ON a.selected_option_id = qo.id
      LEFT JOIN question_concepts qc ON q.id = qc.question_id
      LEFT JOIN concepts c ON qc.concept_id = c.id
      WHERE a.student_id = ? AND q.lecture_id = ?
    `, [studentId, lecture_id]);

    if (attempts.length === 0) {
      return res.status(400).json({ error: 'No attempts found for this lecture' });
    }

    // Find weakest concept ID
    const weakestConceptId = attempts[0].concept_id || 1;

    // B. AI Generates Collective Diagnostic Action Plan
    const collectiveReport = await generateCollectiveReport(topic, weakestConceptId, attempts);

    // C. Save Recommendation in MySQL[cite: 1, 15]
    await db.execute(
      'INSERT INTO recommendations (student_id, concept_id, recommendation_text) VALUES (?, ?, ?)',
      [studentId, collectiveReport.concept_id, collectiveReport.recommendation_text]
    );

    res.status(201).json({
      message: 'Collective assessment report generated and saved!',
      report: collectiveReport
    });

  } catch (error) {
    console.error('Error finalizing assessment:', error);
    res.status(500).json({ error: 'Failed to generate assessment report' });
  }
};

// 3. Get Student Mastery (Returns class concept analytics for professors)
exports.getStudentMastery = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    // Check if the caller is a professor or check role from database if not in token
    let isProfessor = (userRole === 'professor');
    
    if (!userRole) {
      const [userRows] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
      if (userRows.length > 0 && userRows[0].role === 'professor') {
        isProfessor = true;
      }
    }

    if (isProfessor) {
      // Fetch all concepts and their average mastery across all students
      const [classMastery] = await db.execute(`
        SELECT 
          c.id AS concept_id,
          c.name AS concept_name,
          c.description AS concept_description,
          COALESCE(AVG(sm.mastery_score), 50.0) AS mastery_score,
          COALESCE(SUM(sm.attempt_count), 0) AS total_attempts
        FROM concepts c
        LEFT JOIN student_mastery sm ON c.id = sm.concept_id
        GROUP BY c.id, c.name, c.description
        ORDER BY c.id ASC
      `);

      const formatted = classMastery.map(row => {
        const score = parseFloat(row.mastery_score) || 50.0;
        let tier = 'Good';
        if (score < 50) tier = 'Knowledge Gap';
        else if (score < 70) tier = 'Developing';

        return {
          concept_id: row.concept_id,
          concept_name: row.concept_name,
          concept_description: row.concept_description,
          mastery_score: score,
          tier: tier,
          total_attempts: row.total_attempts
        };
      });

      return res.status(200).json(formatted);
    }

    // Student view: Fetch individual student records
    const [mastery] = await db.execute(`
      SELECT m.*, c.name AS concept_name, c.description AS concept_description
      FROM student_mastery m 
      JOIN concepts c ON m.concept_id = c.id 
      WHERE m.student_id = ?
    `, [userId]);

    const formattedMastery = mastery.map(m => {
      const score = parseFloat(m.mastery_score) || 0;
      let tier = 'Good';
      if (score < 50) tier = 'Knowledge Gap';
      else if (score < 70) tier = 'Developing';

      return {
        ...m,
        mastery_score: score,
        tier: tier
      };
    });

    res.status(200).json(formattedMastery);
  } catch (error) {
    console.error('Error fetching mastery:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 4. Get Recommendations[cite: 1]
exports.getRecommendations = async (req, res) => {
  try {
    const studentId = req.userId; //[cite: 1, 6]

    const [recommendations] = await db.execute(`
      SELECT r.*, c.name AS concept_name 
      FROM recommendations r 
      JOIN concepts c ON r.concept_id = c.id 
      WHERE r.student_id = ?
      ORDER BY r.created_at DESC
    `, [studentId]);

    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};