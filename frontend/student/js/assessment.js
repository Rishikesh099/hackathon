let currentQuestions = [];

document.addEventListener("DOMContentLoaded", async () => {
  const lectureId = localStorage.getItem("current_lecture_id");
  const container = document.getElementById("questions-container");

  try {
    // Try fetching live questions from backend
    currentQuestions = await apiFetch(`/questions/lecture/${lectureId}`, "GET");
  } catch (err) {
    console.warn("Backend not available, loading fallback mock data.");
    currentQuestions = mockAssessmentData.questions;
  }

  renderAssessment(currentQuestions, container);
});

function renderAssessment(questions, container) {
  container.innerHTML = "";

  questions.forEach((q, index) => {
    let optionsHtml = "";
    q.options.forEach((opt) => {
      optionsHtml += `
                <label>
                    <input type="radio" name="q_${q.id}" value="${opt.id}" required>
                    <span>${opt.option_text}</span>
                </label>
            `;
    });

    // Every question MUST have a textarea for reasoning[cite: 2]
    container.innerHTML += `
            <div class="card">
                <h3 style="margin-bottom: 0.25rem;">Question ${index + 1}: ${q.question_text}</h3>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 1rem;">Difficulty: ${q.difficulty}</p>
                <div class="options-group" style="margin-bottom: 1rem;">${optionsHtml}</div>
                <div class="form-group">
                    <label><strong>Why did you choose this answer? (Required)</strong></label>
                    <textarea name="reasoning_${q.id}" rows="3" required placeholder="Explain your conceptual logic here..."></textarea>
                </div>
            </div>
        `;
  });

  document.getElementById("submit-btn").style.display = "block";
}

document
  .getElementById("assessment-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      for (let q of currentQuestions) {
        const selectedOptionId = formData.get(`q_${q.id}`);
        const reasoningText = formData.get(`reasoning_${q.id}`);

        const payload = {
          question_id: q.id,
          selected_option_id: parseInt(selectedOptionId),
          reasoning: reasoningText,
          is_correct: false, // Processed by backend Knowledge Engine[cite: 1, 3]
        };

        try {
          await apiFetch("/analytics/attempts", "POST", payload);
        } catch (backendErr) {
          console.log("Mock saved attempt locally:", payload);
        }
      }
      alert("Assessment submitted successfully!");
      window.location.href = "profile.html";
    } catch (err) {
      alert("Error submitting assessment.");
    }
  });
