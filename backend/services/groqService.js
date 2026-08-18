const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Robust helper to extract and parse JSON from Groq LLM outputs
 */
function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Failed to parse valid JSON from Groq LLM response');
  }
}

/**
 * Generates sub-concepts and prerequisites for a given lecture topic.
 * @param {string} topic - e.g., "Dijkstra's Algorithm"
 * @returns {Promise<Array<{name: string, description: string, prerequisites: string[]}>>}
 */
async function generateConcepts(topic) {
  const prompt = `You are an expert computer science professor. 
Analyze the lecture topic: "${topic}".
Extract 2 to 4 core sub-concepts. For each concept:
1. Provide the name.
2. Provide a 1-sentence description/what must be understood.
3. List prerequisite concepts as an array of strings (or empty array [] if none).

Return ONLY a JSON array matching this exact schema:
[
  {
    "name": "Concept Name",
    "description": "Core factual logic or invariant a student must grasp",
    "prerequisites": ["Prerequisite 1"]
  }
]`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-120b',
    response_format: { type: 'json_object' }
  });

  const parsed = parseJSON(completion.choices[0].message.content);
  return Array.isArray(parsed) ? parsed : (parsed.concepts || Object.values(parsed)[0]);
}

/**
 * Generates diagnostic MCQs based on a topic and its extracted concepts.
 * @param {string} topic 
 * @param {Array} concepts 
 * @returns {Promise<Array>} List of formatted MCQ objects
 */
async function generateQuestions(topic, concepts) {
  const prompt = `You are an expert CS professor. Topic: "${topic}".
Concepts: ${JSON.stringify(concepts)}

Generate 6 to 8 diagnostic MCQs evaluating these concepts.
For each question:
- Provide 4 distinct options.
- 0-indexed correctIndex (0, 1, 2, or 3).
- difficulty: "easy", "medium", or "hard".
- concepts: an array containing the exact concept name it tests.
- Provide a subtle distractor flaw/misconception tag for each incorrect option.

Return ONLY a JSON object:
{
  "questions": [
    {
      "question": "Which data structure is commonly used to extract the minimum distance node in Dijkstra's algorithm?",
      "options": ["Stack", "Queue", "Priority Queue", "Linked List"],
      "correctIndex": 2,
      "difficulty": "medium",
      "concepts": ["Priority Queue"],
      "distractorMisconceptions": {
        "0": "Confuses LIFO ordering with optimal distance selection",
        "1": "Assumes standard BFS unweighted queue works for weighted graphs",
        "3": "Assumes linear scan without considering log-time min-extraction"
      }
    }
  ]
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-120b',
    response_format: { type: 'json_object' }
  });

  const parsed = parseJSON(completion.choices[0].message.content);
  return parsed.questions || parsed;
}

/**
 * Combined single-call generator matching the exact AI JSON Output Contract from PDF Page 1.
 * @param {string} topic 
 */
async function generateAssessment(topic) {
  const prompt = `You are an expert computer science professor. Analyze the topic: "${topic}".
1. Extract 2-4 core concepts with prerequisites and descriptions.
2. Generate 6-8 diagnostic MCQs covering these concepts.
3. Every question must include: question, options (4 items), correctIndex (0-3), difficulty ("easy"|"medium"|"hard"), and concepts array.

Return ONLY a valid JSON object matching this exact schema from the PDF specification:
{
  "topic": "${topic}",
  "concepts": [
    {
      "name": "Graph Fundamentals",
      "description": "Understanding vertices, edges, and adjacency representations",
      "prerequisites": []
    },
    {
      "name": "Priority Queue",
      "description": "Min-heap for greedy node extraction",
      "prerequisites": ["Heap"]
    }
  ],
  "questions": [
    {
      "question": "Which data structure is commonly used to extract the minimum distance node in Dijkstra's algorithm?",
      "options": ["Stack", "Queue", "Priority Queue", "Linked List"],
      "correctIndex": 2,
      "difficulty": "medium",
      "concepts": ["Priority Queue"]
    }
  ]
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-120b',
    response_format: { type: 'json_object' }
  });

  return parseJSON(completion.choices[0].message.content);
}

/**
 * Evaluates the student's chosen answer and their 1-line "Why" justification.
 * @param {string} question - Question text
 * @param {string} answer - Selected option text
 * @param {string} reasoning - Student's 1-line justification text
 * @param {string} conceptName - Associated concept
 * @param {boolean} isCorrect - Whether chosen option was correct
 */
async function analyzeReasoning(question, answer, reasoning, conceptName = "", isCorrect = false) {
  const prompt = `You are an AI diagnostic evaluator for a computer science learning platform.
Evaluate the student's selected answer and their one-sentence reasoning.

[CONCEPT TESTED]: ${conceptName}
[QUESTION]: ${question}
[STUDENT CHOSEN OPTION]: "${answer}" (Is Option Correct: ${isCorrect})
[STUDENT JUSTIFICATION]: "${reasoning}"

Classify into one alignment status:
- TRUE_MASTERY: Correct answer + sound, coherent reasoning.
- LUCKY_GUESS: Correct answer, but flawed, vague, or guessing reasoning.
- SPECIFIC_MISCONCEPTION: Wrong answer with an identifiable logical flaw.
- FUNDAMENTAL_GAP: Incoherent logic or total absence of prerequisite understanding.

Return ONLY a JSON object:
{
  "is_correct": ${isCorrect},
  "alignment_status": "TRUE_MASTERY" | "LUCKY_GUESS" | "SPECIFIC_MISCONCEPTION" | "FUNDAMENTAL_GAP",
  "reasoning_score": 0.0 to 1.0,
  "concept_score": 0.0 to 1.0,
  "feedback": "2 sentences explaining whether their thinking was flawed or validating their premise."
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-120b',
    response_format: { type: 'json_object' }
  });

  return parseJSON(completion.choices[0].message.content);
}

/**
 * Generates personalized study recommendations based on student's weak mastery profile.
 * @param {Object} profile - e.g., { concept_name: "Priority Queue", mastery_score: 43.0 }
 */
async function generateRecommendation(profile) {
  const conceptName = profile.concept_name || profile.name || "Target Concept";
  const score = profile.mastery_score || profile.score || 40.0;

  const prompt = `A student has a low mastery score of ${score}% in the concept "${conceptName}".
Generate a concise, targeted 3-step study recommendation for this student.

Return ONLY a JSON object:
{
  "concept_id": ${profile.concept_id || 1},
  "concept_name": "${conceptName}",
  "recommendation_text": "1. Review heap operations. 2. Solve 3 priority queue insertion problems. 3. Re-attempt Dijkstra relaxation questions."
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-120b',
    response_format: { type: 'json_object' }
  });

  return parseJSON(completion.choices[0].message.content);
}

/**
 * Synthesizes all attempts into a holistic diagnostic report with collective scores.
 */
async function generateCollectiveReport(topic, weakestConceptId, attemptsSummary) {
  // 1. Calculate deterministic collective metrics
  const totalQuestions = attemptsSummary.length;
  const rawAvgReasoning = attemptsSummary.reduce((acc, a) => acc + Number(a.reasoning_score || 0), 0) / totalQuestions;
  const rawAvgConcept = attemptsSummary.reduce((acc, a) => acc + Number(a.concept_score || 0), 0) / totalQuestions;
  const correctCount = attemptsSummary.filter(a => a.is_correct).length;

  const collectiveReasoningScore = Math.round(rawAvgReasoning * 100) / 100;
  const collectiveConceptScore = Math.round(rawAvgConcept * 100) / 100;
  const accuracyPercentage = Math.round((correctCount / totalQuestions) * 100);

  // 2. Groq AI synthesis for qualitative diagnostic review
  const prompt = `You are a CS professor evaluating a full diagnostic test on "${topic}".
Total Questions: ${totalQuestions}
Correct Answers: ${correctCount}/${totalQuestions}
Collective Reasoning Score: ${collectiveReasoningScore} / 1.0
Collective Concept Score: ${collectiveConceptScore} / 1.0

Student's full breakdown:
${JSON.stringify(attemptsSummary, null, 2)}

Provide a concise 3-part diagnostic review (Summary, Key Misconceptions, Action Plan).
Return ONLY JSON:
{
  "summary": "2 sentences summarizing student's holistic performance.",
  "action_plan": "1. Review ... 2. Practice ... 3. Solidify ..."
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-120b',
    response_format: { type: 'json_object' }
  });

  const parsed = parseJSON(completion.choices[0].message.content);

  // Formatted string ready for insertion into the MySQL recommendations table
  const formattedRecommendationText = `[Test Accuracy: ${accuracyPercentage}% | Reasoning: ${collectiveReasoningScore * 100}% | Concept: ${collectiveConceptScore * 100}%] Summary: ${parsed.summary} Action Plan: ${parsed.action_plan}`;

  return {
    concept_id: weakestConceptId || 1,
    collective_reasoning_score: collectiveReasoningScore,
    collective_concept_score: collectiveConceptScore,
    accuracy_percentage: accuracyPercentage,
    recommendation_text: formattedRecommendationText
  };
}

module.exports = {
  generateConcepts,
  generateQuestions,
  generateAssessment,
  analyzeReasoning,
  generateRecommendation,
  generateCollectiveReport
};
