// 1. Session Authorization Verification Guard
const token =
  localStorage.getItem("token") || localStorage.getItem("jwt_token");
const userString = localStorage.getItem("user");

if (!token) {
  // If no auth token key is present, redirect straight back to landing/login
  window.location.replace("/");
}

// Parse user details
let studentUser = { name: "Student", email: "student@mastpath.edu" };
if (userString) {
  try {
    studentUser = JSON.parse(userString);
  } catch (error) {
    console.error("Error parsing user object from localStorage:", error);
  }
}

// 2. DOM Elements Bindings
document.addEventListener("DOMContentLoaded", () => {
  // Setup user details greeting
  document.getElementById("nav-email").textContent = studentUser.email;
  document.getElementById("welcome-heading").textContent =
    `Welcome back, ${studentUser.name || "Student"}`;

  // Hook logout button dispatcher
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user");
    window.location.replace("/");
  });

  // Hook Quiz navigation & submission handlers
  document
    .getElementById("cancel-quiz-btn")
    ?.addEventListener("click", closeQuizView);
  document
    .getElementById("quiz-form")
    ?.addEventListener("submit", handleQuizSubmit);

  // Load Dashboard Data Modules
  loadLectures();
  loadMastery();
  loadRecommendations();
});

// 3. API Standard Fetching Helper (Supports GET & POST)
async function apiFetch(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`/api${endpoint}`, options);

    if (response.status === 401 || response.status === 403) {
      // Session expired or token invalidated, force logout
      localStorage.removeItem("token");
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user");
      window.location.replace("/");
      return null;
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.error || `Request failed with status ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API Fetch Error on ${endpoint}:`, error.message);
    return null;
  }
}

// 4. Render Lectures List & Bind Assessment Trigger
async function loadLectures() {
  const container = document.getElementById("lectures-container");
  const countBadge = document.getElementById("lecture-count");

  const lectures = await apiFetch("/lectures");

  // Clear loading state spinner
  container.innerHTML = "";

  if (!lectures || lectures.length === 0) {
    countBadge.textContent = "0";
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <p>No enrolled lectures found in this category.</p>
      </div>
    `;
    return;
  }

  countBadge.textContent = lectures.length;

  lectures.forEach((lecture) => {
    const card = document.createElement("div");
    card.className = "lecture-card card";

    // Extract lecturer initial for icon avatar
    const initial = lecture.professor_name
      ? lecture.professor_name.charAt(0).toUpperCase()
      : "P";
    const dateFormatted = new Date(lecture.created_at).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    card.innerHTML = `
      <h3 class="lecture-title">${escapeHTML(lecture.title)}</h3>
      <p class="lecture-topic">${escapeHTML(lecture.topic)}</p>
      <div class="lecture-meta">
        <div class="lecturer-info">
          <div class="lecturer-avatar">${initial}</div>
          <span>${escapeHTML(lecture.professor_name || "Faculty Member")}</span>
        </div>
        <span>${dateFormatted}</span>
      </div>
    `;

    // Open assessment view in-page on card click
    card.addEventListener("click", () => {
      openQuizView(lecture.id, lecture.title);
    });

    container.appendChild(card);
  });
}

// 5. In-Page Assessment Controller Logic
async function openQuizView(lectureId, lectureTitle) {
  document.getElementById("dashboard-view").style.display = "none";
  document.getElementById("quiz-view").style.display = "block";
  document.getElementById("quiz-title").textContent = lectureTitle;

  const container = document.getElementById("quiz-questions-container");
  container.innerHTML = `
    <div class="card" style="text-align: center;">
      <p style="color: #94a3b8;">Loading assessment questions...</p>
    </div>`;

  // Fetch assessment questions for the selected lecture
  const questions = await apiFetch(`/questions/lecture/${lectureId}`);

  if (!questions || questions.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center;">
        <p style="color: #94a3b8;">No assessment questions available for this lecture yet.</p>
      </div>`;
    return;
  }

  container.innerHTML = "";
  questions.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "1.5rem";

    const optionsHtml = (q.options || [])
      .map(
        (opt) => `
        <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; margin-bottom: 0.5rem; cursor: pointer;">
          <input type="radio" name="question_${q.id}" value="${opt.id}" required style="accent-color: #10b981;">
          <span style="font-size: 0.95rem; color: #fff;">${escapeHTML(opt.option_text)}</span>
        </label>
      `,
      )
      .join("");

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h3 style="font-size: 1.1rem; font-weight: 600;">Question ${index + 1}</h3>
        <span style="font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 12px; background: rgba(255,255,255,0.1); text-transform: capitalize;">${escapeHTML(q.difficulty || "medium")}</span>
      </div>
      <p style="font-size: 1rem; margin-bottom: 1.25rem;">${escapeHTML(q.question_text)}</p>
      
      <div class="options-group" style="margin-bottom: 1.25rem;">
        ${optionsHtml}
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label style="display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.4rem;">
          <strong>Why did you choose this answer?</strong> (AI Reasoning Signal)
        </label>
        <textarea 
          name="reasoning_${q.id}" 
          rows="2" 
          required 
          placeholder="Briefly explain your reasoning..."
          style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; color: #fff; outline: none; resize: vertical;"
        ></textarea>
      </div>
    `;
    container.appendChild(card);
  });
}

function closeQuizView() {
  document.getElementById("quiz-view").style.display = "none";
  document.getElementById("dashboard-view").style.display = "block";
}

// 6. Handle Assessment Submission & Re-fetch Mastery Metrics
async function handleQuizSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("submit-quiz-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  const formData = new FormData(e.target);
  const questionIds = new Set();

  for (let key of formData.keys()) {
    if (key.startsWith("question_")) {
      questionIds.add(key.replace("question_", ""));
    }
  }

  for (let qId of questionIds) {
    const payload = {
      question_id: parseInt(qId),
      selected_option_id: parseInt(formData.get(`question_${qId}`)),
      reasoning: formData.get(`reasoning_${qId}`),
    };
    await apiFetch("/analytics/attempts", "POST", payload);
  }

  alert(
    "Assessment submitted successfully! Your mastery levels and recommendations have been updated.",
  );
  submitBtn.disabled = false;
  submitBtn.textContent = "Submit Assessment";

  // Return to main dashboard view & refresh metrics
  closeQuizView();
  loadMastery();
  loadRecommendations();
}

// 7. Render Concept Mastery Metrics
async function loadMastery() {
  const container = document.getElementById("mastery-container");
  const masteryList = await apiFetch("/analytics/mastery");

  container.innerHTML = "";

  if (!masteryList || masteryList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📈</div>
        <p class="font-sm">No concept mastery metrics active. Complete assessments to start charting progress!</p>
      </div>
    `;
    return;
  }

  masteryList.forEach((item) => {
    const masteryVal = parseFloat(item.mastery_level) || 0;
    const progressPercent = Math.min(Math.max(masteryVal, 0), 100);

    // Determine performance level classification color gradient
    let levelClass = "level-low";
    if (progressPercent >= 75) {
      levelClass = "level-high";
    } else if (progressPercent >= 40) {
      levelClass = "level-med";
    }

    const itemEl = document.createElement("div");
    itemEl.className = "mastery-item";
    itemEl.innerHTML = `
      <div class="mastery-info">
        <span class="mastery-name" title="${escapeHTML(item.concept_name)}">${escapeHTML(item.concept_name)}</span>
        <span class="mastery-val">${progressPercent.toFixed(1)}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-bar ${levelClass}" style="width: 0%"></div>
      </div>
    `;

    container.appendChild(itemEl);

    // Micro-animation delay to transition progress bar width
    setTimeout(() => {
      const progressBar = itemEl.querySelector(".progress-bar");
      if (progressBar) progressBar.style.width = `${progressPercent}%`;
    }, 100);
  });
}

// 8. Render AI Study Recommendations
async function loadRecommendations() {
  const container = document.getElementById("recommendations-container");
  const recommendations = await apiFetch("/analytics/recommendations");

  container.innerHTML = "";

  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💡</div>
        <p class="font-sm">You are fully up to date! Solidify concepts by completing course quizzes.</p>
      </div>
    `;
    return;
  }

  recommendations.forEach((rec) => {
    const li = document.createElement("li");
    li.className = "recommendation-item";
    li.innerHTML = `
      <div class="rec-icon">🎯</div>
      <div class="rec-content">
        <span class="rec-concept">${escapeHTML(rec.concept_name)}</span>
        <span class="rec-text">${escapeHTML(rec.recommendation_text)}</span>
      </div>
    `;
    container.appendChild(li);
  });
}

// Helper utility to escape HTML inputs
function escapeHTML(str) {
  if (!str) return "";
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag] || tag,
  );
}
