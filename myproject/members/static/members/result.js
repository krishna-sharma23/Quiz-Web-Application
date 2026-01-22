const SCORE = parseFloat(new URLSearchParams(window.location.search).get('score')) || 0;
const BOARD = document.getElementById('score');
const EMOJI = document.getElementById('emoji');
const IMAGE = document.getElementById('result-image');
const RESULT_MESSAGE = document.getElementById('result-message');
const RESULT_DESCRIPTION = document.getElementById('result-description');
const FEEDBACK_TEXT = document.getElementById('feedback-text');

// Display score with animation
animateCountUp(SCORE);

// Set emoji, image, and messages based on score
if (SCORE >= 90) {
    EMOJI.textContent = "🏆";
    RESULT_MESSAGE.textContent = "Outstanding! 🌟";
    RESULT_DESCRIPTION.textContent = "You're a quiz master!";
    FEEDBACK_TEXT.textContent = "Excellent performance! You've mastered this topic. Consider helping others!";
    IMAGE.src = "/static/members/images/trophy.png";
} else if (SCORE >= 80) {
    EMOJI.textContent = "🥇";
    RESULT_MESSAGE.textContent = "Excellent! 🎉";
    RESULT_DESCRIPTION.textContent = "That's a fantastic score!";
    FEEDBACK_TEXT.textContent = "Great work! You have a strong understanding of the material.";
    IMAGE.src = "/static/members/images/trophy.png";
} else if (SCORE >= 70) {
    EMOJI.textContent = "😊";
    RESULT_MESSAGE.textContent = "Good Job! 👍";
    RESULT_DESCRIPTION.textContent = "You're on the right track!";
    FEEDBACK_TEXT.textContent = "Nice performance! A bit more practice will help you reach excellence.";
    IMAGE.src = "/static/members/images/medal.png";
} else if (SCORE >= 50) {
    EMOJI.textContent = "😐";
    RESULT_MESSAGE.textContent = "Not Bad! 💪";
    RESULT_DESCRIPTION.textContent = "There's room for improvement.";
    FEEDBACK_TEXT.textContent = "You got some right! Review the material and try again to improve.";
    IMAGE.src = "/static/members/images/medal.png";
} else if (SCORE > 0) {
    EMOJI.textContent = "😕";
    RESULT_MESSAGE.textContent = "Keep Trying! 🚀";
    RESULT_DESCRIPTION.textContent = "Every attempt makes you stronger.";
    FEEDBACK_TEXT.textContent = "Don't worry! Study the material more carefully and retake the quiz.";
    IMAGE.src = "/static/members/images/try_again.png";
} else {
    EMOJI.textContent = "😢";
    RESULT_MESSAGE.textContent = "Better Luck Next Time! 📚";
    RESULT_DESCRIPTION.textContent = "You can do better!";
    FEEDBACK_TEXT.textContent = "Review the learning materials thoroughly before your next attempt.";
    IMAGE.src = "/static/members/images/fail.png";
}

// Animate count up for score
function animateCountUp(finalScore) {
    let currentScore = 0;
    const increment = finalScore / 40;
    const interval = setInterval(() => {
        currentScore += increment;
        if (currentScore >= finalScore) {
            currentScore = finalScore;
            clearInterval(interval);
        }
        BOARD.textContent = currentScore.toFixed(1);
    }, 20);
}

// Button actions
document.getElementById('retake-btn').addEventListener('click', () => {
    window.history.back();
});

document.getElementById('home-btn').addEventListener('click', () => {
    window.location.href = "/";
});
