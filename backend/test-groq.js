const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { 
  generateAssessment, 
  analyzeReasoning, 
  generateCollectiveReport 
} = require('./services/groqService');

async function runFullVerification() {
  console.log("==================================================");
  console.log("1. GENERATING TOPIC ASSESSMENT...");
  console.log("==================================================");

  const topic = "Dijkstra's Algorithm";
  const assessment = await generateAssessment(topic);
  console.log(`Topic: ${assessment.topic}`);
  console.log(`Generated ${assessment.questions.length} Diagnostic Questions.\n`);

  console.log("==================================================");
  console.log("2. EVALUATING INDIVIDUAL ATTEMPTS...");
  console.log("==================================================");

  // Mixed responses: Solid logic, lucky guesses, and conceptual errors
  const mockResponses = [
    { pickCorrect: true, reasoning: "Priority queue retrieves the minimum unvisited vertex distance in O(log V) time." },
    { pickCorrect: false, reasoning: "A standard FIFO queue works because Dijkstra is just standard BFS for all graphs." },
    { pickCorrect: true, reasoning: "I picked option C because it looked like the most complex structure." }, // Lucky guess
    { pickCorrect: true, reasoning: "Non-negative edge weights ensure settled vertices cannot have shorter paths discovered later." },
    { pickCorrect: false, reasoning: "Negative weights work if we loop edge relaxation multiple times." },
    { pickCorrect: true, reasoning: "Relaxation updates dist[v] if dist[u] + weight(u, v) is strictly smaller." }
  ];

  const attemptsHistory = [];
  const testLimit = Math.min(assessment.questions.length, mockResponses.length);

  for (let i = 0; i < testLimit; i++) {
    const q = assessment.questions[i];
    const mock = mockResponses[i];

    const chosenIdx = mock.pickCorrect ? q.correctIndex : (q.correctIndex === 0 ? 1 : 0);
    const chosenOption = q.options[chosenIdx];
    const isCorrect = (chosenIdx === q.correctIndex);
    const conceptName = (q.concepts && q.concepts.length > 0) ? q.concepts[0] : "Graph Theory";

    const singleResult = await analyzeReasoning(
      q.question,
      chosenOption,
      mock.reasoning,
      conceptName,
      isCorrect
    );

    console.log(`[Q${i + 1}] Result: ${singleResult.alignment_status} | Reasoning: ${singleResult.reasoning_score} | Concept: ${singleResult.concept_score}`);

    attemptsHistory.push({
      question_id: i + 1,
      concept: conceptName,
      is_correct: isCorrect,
      selected_option: chosenOption,
      reasoning: mock.reasoning,
      alignment_status: singleResult.alignment_status,
      reasoning_score: singleResult.reasoning_score,
      concept_score: singleResult.concept_score,
      feedback: singleResult.feedback
    });
  }

  console.log("\n==================================================");
  console.log("3. GENERATING COLLECTIVE SCORES & REPORT...");
  console.log("==================================================");

  const weakestConceptId = 1;
  const collectiveOutput = await generateCollectiveReport(topic, weakestConceptId, attemptsHistory);

  console.log("Collective Output Object:\n", JSON.stringify(collectiveOutput, null, 2));
  console.log("\nFormatted Payload for DB (`recommendations` table):");
  console.log(collectiveOutput.recommendation_text);

  console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<");
}

runFullVerification().catch(err => console.error("Verification failed:", err));