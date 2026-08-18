const { calculateMastery, getMasteryTier } = require('./services/knowledgeEngine');

console.log("--- Testing Mastery Calculation ---");

// 1. True Mastery (Correct answer + high reasoning)
const score1 = calculateMastery(50.0, true, 0.9);
console.log(`True Mastery Score: ${score1}% (${getMasteryTier(score1)})`);

// 2. Lucky Guess (Correct answer + low/guessing reasoning)
const score2 = calculateMastery(50.0, true, 0.1);
console.log(`Lucky Guess Score:  ${score2}% (${getMasteryTier(score2)})`);

// 3. Incorrect (Wrong answer + low reasoning)
const score3 = calculateMastery(50.0, false, 0.0);
console.log(`Incorrect Score:    ${score3}% (${getMasteryTier(score3)})`);