// Hardcoded JSON data to use during offline/frontend-only testing
const mockAssessmentData = {
  topic: "Dijkstra's Algorithm",
  concepts: [
    { id: 1, name: "Graph Fundamentals", prerequisites: [] },
    { id: 2, name: "Priority Queue", prerequisites: ["Heap"] },
  ],
  questions: [
    {
      id: 1,
      question_text:
        "Which data structure is commonly used to efficiently select the next minimum-distance vertex?",
      difficulty: "medium",
      options: [
        { id: 1, option_text: "Stack" },
        { id: 2, option_text: "Queue" },
        { id: 3, option_text: "Priority Queue" },
        { id: 4, option_text: "Linked List" },
      ],
    },
    {
      id: 2,
      question_text:
        "What happens if Dijkstra's algorithm is run on a graph with negative edge weights?",
      difficulty: "hard",
      options: [
        { id: 5, option_text: "It always produces the correct answer." },
        {
          id: 6,
          option_text: "It may produce incorrect results or loop endlessly.",
        },
        { id: 7, option_text: "It throws a runtime exception." },
        {
          id: 8,
          option_text: "It automatically converts weights to positive values.",
        },
      ],
    },
  ],
};

const mockMasteryData = [
  {
    concept_id: 1,
    name: "Graph Fundamentals",
    mastery_score: 85,
    attempt_count: 5,
    last_updated: new Date(),
  },
  {
    concept_id: 2,
    name: "Priority Queue",
    mastery_score: 42,
    attempt_count: 4,
    last_updated: new Date(),
  },
  {
    concept_id: 3,
    name: "Heap Data Structure",
    mastery_score: 62,
    attempt_count: 3,
    last_updated: new Date(),
  },
];

const mockRecommendationsData = [
  {
    recommendation_text:
      "Review Priority Queue operations. Your accuracy drops when extracting minimum values.",
    created_at: new Date(),
  },
  {
    recommendation_text:
      "Revisit Heap prerequisites before attempting advanced Dijkstra problems.",
    created_at: new Date(),
  },
];
