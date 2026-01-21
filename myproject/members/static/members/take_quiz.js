document.addEventListener("DOMContentLoaded", () => {
    display_quiz();
    setupSearch();
    setupFilters();
});

let allQuizzes = [];
let filteredQuizzes = [];
let currentFilter = "all";

// Display all quizzes
function display_quiz() {
    const QUIZZ_CONTAINER = document.getElementById("quiz_container");
    const LOADING_STATE = document.getElementById("loadingState");
    const ERROR_STATE = document.getElementById("errorState");
    const EMPTY_STATE = document.getElementById("emptyState");

    if (!QUIZZ_CONTAINER) {
        console.error("❌ Element with id 'quiz_container' not found in HTML");
        return;
    }

    LOADING_STATE.style.display = "flex";
    QUIZZ_CONTAINER.innerHTML = "";
    ERROR_STATE.style.display = "none";
    EMPTY_STATE.style.display = "none";

    fetch('/get_quiz/')
        .then(response => response.json())
        .then(data => {
            LOADING_STATE.style.display = "none";

            if (data.files && data.files.length > 0) {
                console.log("✅ Quizzes loaded:", data.files);
                
                allQuizzes = data.files.map(file => parseQuizFile(file));
                filteredQuizzes = [...allQuizzes];
                
                renderQuizzes(filteredQuizzes);
            } else {
                ERROR_STATE.style.display = "block";
                console.error("No quizzes available");
            }
        })
        .catch(err => {
            LOADING_STATE.style.display = "none";
            ERROR_STATE.style.display = "block";
            console.error("Fetch failed:", err);
        });
}

// Parse quiz file name to extract details
function parseQuizFile(file) {
    const details = file.split('&');
    const title = details[0].slice(details[0].indexOf('=') + 1);
    const duration = details[1].slice(details[1].indexOf('=') + 1);
    const topic = details[2].slice(details[2].indexOf('=') + 1).replace('_quiz.json', '');

    return {
        file: file,
        title: decodeURIComponent(title),
        duration: duration,
        topic: topic
    };
}

// Render quiz cards
function renderQuizzes(quizzes) {
    const QUIZZ_CONTAINER = document.getElementById("quiz_container");
    const EMPTY_STATE = document.getElementById("emptyState");

    QUIZZ_CONTAINER.innerHTML = "";

    if (quizzes.length === 0) {
        EMPTY_STATE.style.display = "block";
        return;
    }

    EMPTY_STATE.style.display = "none";

    quizzes.forEach((quiz, index) => {
        const quizCard = createQuizCard(quiz, index);
        QUIZZ_CONTAINER.appendChild(quizCard);
    });
}

// Create individual quiz card
function createQuizCard(quiz, index) {
    const card = document.createElement('a');
    card.href = `${url}?id=${quiz.file}`;
    card.className = 'quiz-card';
    card.style.animation = `fadeInUp 0.6s ease ${0.05 * index}s both`;

    // Get category color
    const categoryColors = {
        'Science': { bg: '#f093fb', text: '#f5576c' },
        'History': { bg: '#4facfe', text: '#00f2fe' },
        'Geography': { bg: '#43e97b', text: '#38f9d7' },
        'Mathematics': { bg: '#fa709a', text: '#fee140' },
        'Literature': { bg: '#30cfd0', text: '#330867' },
        'Technology': { bg: '#a8edea', text: '#fed6e3' },
        'Sports': { bg: '#ff9a56', text: '#ff6a88' },
        'General Knowledge': { bg: '#667eea', text: '#764ba2' }
    };

    const colors = categoryColors[quiz.topic] || { bg: '#667eea', text: '#764ba2' };

    // Parse duration
    const durationNum = parseInt(quiz.duration);
    const durationText = durationNum >= 60 
        ? `${Math.floor(durationNum / 60)}h ${durationNum % 60}m` 
        : `${durationNum}m`;

    // Get difficulty based on duration
    const difficulty = durationNum <= 10 ? 'Easy' : durationNum <= 30 ? 'Medium' : 'Hard';

    card.innerHTML = `
        <div class="quiz-card-header" style="background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.text} 100%);">
            <h3 class="quiz-card-title">${quiz.title}</h3>
        </div>
        <div class="quiz-card-body">
            <span class="category-badge" style="background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.text} 100%);">
                ${quiz.topic}
            </span>
            <div class="quiz-meta">
                <div class="meta-item">
                    <span class="meta-icon">⏱️</span>
                    <div>
                        <span class="meta-label">Duration</span>
                        <span class="meta-value">${durationText}</span>
                    </div>
                </div>
                <div class="meta-item">
                    <span class="meta-icon">📊</span>
                    <div>
                        <span class="meta-label">Level</span>
                        <span class="meta-value">${difficulty}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="quiz-card-footer">
            <button class="btn-start" onclick="event.preventDefault(); window.location.href='${url}?id=${quiz.file}';">
                <span>🎮</span>
                Start Quiz
            </button>
            <div class="difficulty-indicator"></div>
        </div>
    `;

    return card;
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            filterAndRender(searchTerm);
        });
    }
}

// Setup filter chips
function setupFilters() {
    const chips = document.querySelectorAll('.chip');
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Remove active class from all chips
            chips.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked chip
            chip.classList.add('active');
            
            // Get filter value
            currentFilter = chip.dataset.filter;
            
            // Filter quizzes
            filterAndRender();
        });
    });

    // Set first chip as active
    if (chips.length > 0) {
        chips[0].classList.add('active');
    }
}

// Filter and render quizzes
function filterAndRender(searchTerm = '') {
    filteredQuizzes = allQuizzes.filter(quiz => {
        // Apply topic filter
        const topicMatch = currentFilter === 'all' || quiz.topic === currentFilter;
        
        // Apply search filter
        const searchMatch = searchTerm === '' || 
                           quiz.title.toLowerCase().includes(searchTerm) ||
                           quiz.topic.toLowerCase().includes(searchTerm);
        
        return topicMatch && searchMatch;
    });

    renderQuizzes(filteredQuizzes);
}

// Show toast notification
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#f59e0b"};
        color: white;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = "slideOut 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}