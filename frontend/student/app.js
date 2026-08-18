// 1. Session Authorization Verification Guard
const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
const userString = localStorage.getItem('user');

if (!token) {
    // If no auth token key is present, redirect straight back to landing/login
    window.location.replace('/');
}

// Parse user details
let studentUser = { name: 'Student', email: 'student@mastpath.edu' };
if (userString) {
    try {
        studentUser = JSON.parse(userString);
    } catch (error) {
        console.error('Error parsing user object from localStorage:', error);
    }
}

// 2. DOM Elements Bindings
document.addEventListener('DOMContentLoaded', () => {
    // Setup user details greeting
    document.getElementById('nav-email').textContent = studentUser.email;
    document.getElementById('welcome-heading').textContent = `Welcome back, ${studentUser.name || 'Student'}`;

    // Hook logout button dispatcher
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        window.location.replace('/');
    });

    // Load Dashboard Data Modules
    loadLectures();
    loadMastery();
    loadRecommendations();
});

// 3. API Standard Fetching Helper
async function apiFetch(endpoint) {
    try {
        const response = await fetch(`/api${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            // Session expired or token invalidated, force logout
            localStorage.removeItem('token');
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user');
            window.location.replace('/');
            return null;
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Request failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Fetch Error on ${endpoint}:`, error.message);
        return null;
    }
}

// 4. Render Lectures List
async function loadLectures() {
    const container = document.getElementById('lectures-container');
    const countBadge = document.getElementById('lecture-count');

    const lectures = await apiFetch('/lectures');

    // Clear loading state spinner
    container.innerHTML = '';

    if (!lectures || lectures.length === 0) {
        countBadge.textContent = '0';
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <p>No enrolled lectures found in this category.</p>
      </div>
    `;
        return;
    }

    countBadge.textContent = lectures.length;

    lectures.forEach(lecture => {
        const card = document.createElement('div');
        card.className = 'lecture-card card';

        // Extract lecturer initial for icon avatar
        const initial = lecture.professor_name ? lecture.professor_name.charAt(0).toUpperCase() : 'P';
        const dateFormatted = new Date(lecture.created_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        card.innerHTML = `
      <h3 class="lecture-title">${escapeHTML(lecture.title)}</h3>
      <p class="lecture-topic">${escapeHTML(lecture.topic)}</p>
      <div class="lecture-meta">
        <div class="lecturer-info">
          <div class="lecturer-avatar">${initial}</div>
          <span>${escapeHTML(lecture.professor_name || 'Faculty Member')}</span>
        </div>
        <span>${dateFormatted}</span>
      </div>
    `;

        // Interactive clicking behavior (stubbed for routing to specific lectures later)
        card.addEventListener('click', () => {
            // E.g. Redirect to lecture assessment detail view
            alert(`Lecture: "${lecture.title}" selected. Classroom module coming in next update!`);
        });

        container.appendChild(card);
    });
}

// 5. Render Concept Mastery Metrics
async function loadMastery() {
    const container = document.getElementById('mastery-container');
    const masteryList = await apiFetch('/analytics/mastery');

    container.innerHTML = '';

    if (!masteryList || masteryList.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📈</div>
        <p class="font-sm">No concept mastery metrics active. Complete assessments to start charting progress!</p>
      </div>
    `;
        return;
    }

    masteryList.forEach(item => {
        const masteryVal = parseFloat(item.mastery_level) || 0;
        const progressPercent = Math.min(Math.max(masteryVal, 0), 100);

        // Determine performance level classification color gradient
        let levelClass = 'level-low';
        if (progressPercent >= 75) {
            levelClass = 'level-high';
        } else if (progressPercent >= 40) {
            levelClass = 'level-med';
        }

        const itemEl = document.createElement('div');
        itemEl.className = 'mastery-item';
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
            const progressBar = itemEl.querySelector('.progress-bar');
            if (progressBar) progressBar.style.width = `${progressPercent}%`;
        }, 100);
    });
}

// 6. Render AI Study Recommendations
async function loadRecommendations() {
    const container = document.getElementById('recommendations-container');
    const recommendations = await apiFetch('/analytics/recommendations');

    container.innerHTML = '';

    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💡</div>
        <p class="font-sm">You are fully up to date! Solidify concepts by completing course quizzes.</p>
      </div>
    `;
        return;
    }

    recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.className = 'recommendation-item';
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
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
