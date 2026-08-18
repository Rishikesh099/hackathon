/**
 * Calculates updated concept mastery using the EMA formula:
 * newMastery = oldMastery * 0.7 + currentPerformance * 0.3
 */
function calculateMastery(oldMastery = 50.0, isCorrect = false, reasoningScore = 0.0) {
  // Combine correctness (60% weight) and reasoning quality (40% weight)
  const correctnessPoints = isCorrect ? 60 : 0;
  const reasoningPoints = Math.max(0, Math.min(1, Number(reasoningScore))) * 40;
  const currentPerformance = correctnessPoints + reasoningPoints;

  // Apply EMA formula
  const newMastery = (Number(oldMastery) * 0.7) + (currentPerformance * 0.3);
  return Math.round(newMastery * 100) / 100;
}

/**
 * Maps numeric scores to standard threshold tiers
 */
function getMasteryTier(score) {
  const numericScore = Number(score);
  if (numericScore < 50) return 'Needs attention';
  if (numericScore <= 70) return 'Developing';
  return 'Good';
}

module.exports = {
  calculateMastery,
  getMasteryTier
};