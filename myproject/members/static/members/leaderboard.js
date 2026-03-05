const TOP_LIMIT = 10; // Show top 10 scorers overall
const QUIZ_LIMIT = 5;  // Show top 5 per quiz

get_data();

async function get_data() {
    try {
        const res = await fetch("/get_score/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),  
            },
        });
        const data = await res.json();
        if (!res.ok || data.status !== 'success') {
            throw new Error(data.message || 'Failed to fetch scores');
        }

        const rawList = Array.isArray(data.Data) ? data.Data : [];

        // Parse the data to extract quiz info and organize by user and quiz
        const quizData = parseQuizData(rawList);
        
        console.log('Parsed Quiz Data:', quizData);

        // Display overall top scorers
        displayOverallLeaderboard(quizData);

        // Display quiz-specific leaderboards
        displayQuizLeaderboards(quizData);

        // Confetti effect
        dropConfetti();
    } catch (err) {
        console.error('Error fetching leaderboard data:', err);
    }
}

function parseQuizData(rawData) {
    const allScores = rawData
        .map(item => ({
            name: (item.username || "Guest"),
            score: Number(item.score),
            quiz: item.quiz_title || "General Quiz"
        }))
        .filter(item => Number.isFinite(item.score));

    // console.log(allScores)
    
    return {
        allScores,
        quizMap: {}
    };
}

function displayOverallLeaderboard(quizData) {
    const tbody = document.getElementById('overall-body');
    tbody.innerHTML = '';
    
    // Sort all scores by highest first
    const sorted = quizData.allScores
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_LIMIT);

    if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No scores yet. Be the first to take a quiz!</td></tr>';
        return;
    }

    sorted.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${index * 0.1}s`;
        tr.className = 'score-row';

        // Rank with badge
        const rankTd = document.createElement('td');
        rankTd.innerHTML = createRankBadge(index + 1);
        
        // Name
        const nameTd = document.createElement('td');
        nameTd.textContent = item.name.toUpperCase();
        nameTd.className = 'name-col-cell';
        
        // Score
        const scoreTd = document.createElement('td');
        scoreTd.innerHTML = `<span class="score-value">${item.score.toFixed(1)}</span>`;
        
        // Quiz
        const quizTd = document.createElement('td');
        quizTd.textContent = item.quiz;
        quizTd.className = 'quiz-col-cell';

        tr.appendChild(rankTd);
        tr.appendChild(nameTd);
        tr.appendChild(scoreTd);
        tr.appendChild(quizTd);
        
        tbody.appendChild(tr);
    });
}

function displayQuizLeaderboards(quizData) {
    const container = document.getElementById('quiz-sections');
    container.innerHTML = '';
    
    // Group scores by quiz (from the quiz info if available)
    const quizGroups = {};
    
    quizData.allScores.forEach(item => {
        if (!quizGroups[item.quiz]) {
            quizGroups[item.quiz] = [];
        }
        quizGroups[item.quiz].push(item);
    });

    // Display each quiz's top scorers
    Object.keys(quizGroups).forEach((quizName, quizIndex) => {
        const scores = quizGroups[quizName]
            .sort((a, b) => b.score - a.score)
            .slice(0, QUIZ_LIMIT);

        const section = document.createElement('div');
        section.className = 'leaderboard-section';
        section.style.animationDelay = `${(quizIndex + 1) * 0.2}s`;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'section-title';
        titleDiv.innerHTML = `<h2>${getQuizEmoji(quizIndex)} ${quizName}</h2>`;

        const boardDiv = document.createElement('div');
        boardDiv.className = 'score-board';

        const table = document.createElement('table');
        table.className = 'score-table';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th class="rank-col">Rank</th>
                <th class="name-col">Name</th>
                <th class="score-col">Score</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        scores.forEach((item, index) => {
            const tr = document.createElement('tr');
            
            const rankTd = document.createElement('td');
            rankTd.innerHTML = createRankBadge(index + 1);
            
            const nameTd = document.createElement('td');
            nameTd.textContent = item.name.toUpperCase();
            nameTd.className = 'name-col-cell';
            
            const scoreTd = document.createElement('td');
            scoreTd.innerHTML = `<span class="score-value">${item.score.toFixed(1)}</span>`;

            tr.appendChild(rankTd);
            tr.appendChild(nameTd);
            tr.appendChild(scoreTd);
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        boardDiv.appendChild(table);
        
        section.appendChild(titleDiv);
        section.appendChild(boardDiv);
        container.appendChild(section);
    });
}

function createRankBadge(rank) {
    const badges = {
        1: { class: 'gold', icon: '🥇' },
        2: { class: 'silver', icon: '🥈' },
        3: { class: 'bronze', icon: '🥉' }
    };

    const badge = badges[rank] || { class: 'default', icon: rank };
    return `<div class="rank-badge ${badge.class}">${badge.icon}</div>`;
}

function getQuizEmoji(index) {
    const emojis = ['📚', '🧪', '🔬', '🎨', '💻', '📐', '🌍', '⚡'];
    return emojis[index % emojis.length];
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function dropConfetti() {
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
        confetti.style.animationDuration = `${Math.random() * 2 + 1.5}s`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        confetti.style.top = '100vh';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 4000);
    }
}
