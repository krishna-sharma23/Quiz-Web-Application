const SCORE = parseFloat(new URLSearchParams(window.location.search).get('score')) || 0;
const BOARD = document.getElementById('score');
const EMOJI = document.getElementById('emoji');
const IMAGE = document.getElementById('result-image');

// display score
BOARD.textContent = SCORE.toFixed(2);

// set emoji & image based on score
if (SCORE >= 80) {
    EMOJI.textContent = "🏆";
    IMAGE.src = "/static/members/images/trophy.png"; // happy trophy
} else if (SCORE >= 50) {
    EMOJI.textContent = "😊";
    IMAGE.src = "/static/members/images/medal.png"; // decent score
} else if (SCORE > 0) {
    EMOJI.textContent = "😕";
    IMAGE.src = "/static/members/images/try_again.png"; // low score
} else {
    EMOJI.textContent = "😢";
    IMAGE.src = "/static/members/images/fail.png"; // fail
}

// button actions
// document.getElementById('retake-btn').addEventListener('click', () => {
//     window.history.href = " ";
// });

// document.getElementById('home-btn').addEventListener('click', () => {
//     window.location.href = " ";
// });
