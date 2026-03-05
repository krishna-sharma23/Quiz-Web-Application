const MAIN = document.querySelector("main");
const MESSAGE = document.getElementById("message");
const QUESTION_CONTAINER = document.getElementById("Question_container");
const SUBMIT = document.getElementById("Submit");

const QUIZ_ID = new URLSearchParams(window.location.search).get('id');

load();

async function load() {
    if (!QUIZ_ID) {
        alert("Quiz ID is missing from URL.");
        return;
    }

    const res = await fetch("/display_quiz/",{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),  
        },
        body: JSON.stringify({
            id: QUIZ_ID,
        })
    })
    const data = await res.json();
    if (data.status !== "success" || !data.data) {
        alert(data.message || "Failed to load quiz.");
        return;
    }

    const quiz = data.data;
    const questions = quiz.Questions || [];

    if (!Array.isArray(questions) || questions.length === 0) {
        alert("No questions found for this quiz.");
        return;
    }

    startCountdown(parseDurationToSeconds(quiz.duration));

    for (let i = 0; i < questions.length; i++) {
        const currentQuestion = questions[i];
        //creating a div for storing seperate questions
        const BLOCK = document.createElement('div');
        // creating a h3 element to store questions
        const QUESTION = document.createElement('h3');
        QUESTION.setAttribute('class', `${i}`);
        QUESTION.textContent = `Q${currentQuestion.question_number}: ` + currentQuestion.question;
        const LIST = document.createElement('div')

        if (currentQuestion.type === "DAT") {
            const input = document.createElement('textarea');
            input.classList.add('option-text');
            input.setAttribute('rows', '3');
            input.setAttribute('placeholder', 'Enter your answer...');
            input.dataset.questionId = String(currentQuestion.question_id);
            input.style.width = "100%";
            LIST.appendChild(input);
        } else {
            //adding options
            for (let j = 0; j < currentQuestion.options.length; j++) {
                const optText = currentQuestion.options[j];
                const safeId = `q${currentQuestion.question_id}_opt${j}`;

                const label = document.createElement('label');
                label.classList.add('option');
                label.setAttribute('for', safeId);

                const input = document.createElement('input');
                input.type = 'radio';
                input.id = safeId;
                input.name = `${currentQuestion.question_id}`;
                input.value = optText;
                input.classList.add('option-input');

                const span = document.createElement('span');
                span.classList.add('option-text');
                span.textContent = optText;

                label.appendChild(input);
                label.appendChild(span);

                LIST.appendChild(label);
                LIST.appendChild(document.createElement('br'));
            }
        }

        //appending questions to the block
        BLOCK.appendChild(QUESTION);
        BLOCK.appendChild(LIST);
        
        
        //appending the block to the container
        QUESTION_CONTAINER.appendChild(BLOCK);
    }
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

async function submitQuiz(auto = false) {
  // avoid double submits
  if (submitQuiz._submitting) return;
  submitQuiz._submitting = true;

  // collect answers
  const answers = collectAnswers();

  // optionally disable inputs/UI
  document.querySelectorAll('input[type="radio"]').forEach(i => i.disabled = true);
  document.querySelectorAll('textarea[data-question-id]').forEach(i => i.disabled = true);

  // show a quick message to user
  const timerSpan = document.getElementById('timer');
  if (timerSpan) timerSpan.textContent = 'Submitting...';

  try {
    const res = await fetch('/submit_quiz/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      body: JSON.stringify({
        auto_submit: !!auto,
        id: QUIZ_ID,
        answers // adjust shape if your backend expects different keys
      })
    });
    const json = await res.json();
    if (!res.ok || json.status !== "success") {
      throw new Error(json.message || "Submission failed");
    }

    // handle server response (score / message)
    // customize this block to match backend response
    const score = json.Score ?? json.score;
    alert(json.message ?? `Submitted${auto ? ' (auto)' : ''}. Score: ${score ?? 'N/A'}`);
    
    console.log(json);
    console.log(score);

    const scoreText = (score !== undefined && score !== null) ? `Score: ${score}` : '';
    document.getElementById('BOL').innerHTML = `
      <div class="success-message">
        <div class="checkmark">✓</div>
        <h2>Quiz Submitted Successfully!</h2>
        <p>${scoreText}</p>
        <p class="redirect-text">Redirecting to results...</p>
      </div>
    `;
    MESSAGE.style.animationDuration = '10s';
    MESSAGE.style.display = 'block';
    setTimeout(() => {
        window.location.href = `/result/?score=${score}`;
    }, 2000);

    // stop timer if running
    if (window._quizTimerInterval) {
      clearInterval(window._quizTimerInterval);
      window._quizTimerInterval = null;
    }

  } catch (err) {
    console.error('Submit error', err);
    alert('Failed to submit quiz. Please check your connection.');
    // Re-enable radios if you want user to retry
    document.querySelectorAll('input[type="radio"]').forEach(i => i.disabled = false);
    document.querySelectorAll('textarea[data-question-id]').forEach(i => i.disabled = false);
    submitQuiz._submitting = false;
  }
}

function collectAnswers() {
  // find all radio inputs on page
  const radios = document.querySelectorAll('input[type="radio"]');
  const groups = {}; // name -> chosen value or null

  radios.forEach(r => {
    const name = r.name || '__noname';
    if (!(name in groups)) groups[name] = null;
    if (r.checked) groups[name] = r.value ?? r.id ?? null;
  });

  // convert to array if backend expects that format
  // each item: { question_name: name, answer: value }
  const answers = Object.keys(groups).map(name => ({
    question: name,
    answer: groups[name]
  }));

  const datInputs = document.querySelectorAll('textarea[data-question-id]');
  datInputs.forEach(input => {
    answers.push({
      question: input.dataset.questionId,
      answer: input.value ? input.value.trim() : null
    });
  });

  return answers;
}

function parseDurationToSeconds(raw) {
  if (!raw) return 0;
  raw = String(raw).trim().toLowerCase();

  // explicit seconds like "90s"
  if (raw.endsWith('s')) {
    const v = parseFloat(raw.slice(0,-1));
    return isNaN(v) ? 0 : Math.round(v);
  }

  // explicit minutes like "1.5m"
  if (raw.endsWith('m')) {
    const v = parseFloat(raw.slice(0,-1));
    return isNaN(v) ? 0 : Math.round(v * 60);
  }

  // plain number -> assume minutes
  const v = parseFloat(raw);
  if (isNaN(v)) return 0;
  return Math.round(v * 60);
}

function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2,'0');
  const ss = String(seconds % 60).padStart(2,'0');
  return `${mm}:${ss}`;
}

function startCountdown(initialSeconds) {
  const timerEl = document.getElementById('timer');
  if (!timerEl) return;

  let remaining = initialSeconds;
  timerEl.textContent = formatTime(remaining);

  // if there's an existing interval, clear it first
  if (window._quizTimerInterval) clearInterval(window._quizTimerInterval);

  window._quizTimerInterval = setInterval(() => {
    remaining -= 1;
    if (remaining < 0) {
      clearInterval(window._quizTimerInterval);
      window._quizTimerInterval = null;
      // time's up -> auto submit
      submitQuiz(true);
      return;
    }
    timerEl.textContent = formatTime(remaining);
  }, 1000);

  // return a stop function
  return () => {
    if (window._quizTimerInterval) {
      clearInterval(window._quizTimerInterval);
      window._quizTimerInterval = null;
    }
  };
}
if (SUBMIT) {
  SUBMIT.addEventListener('click', submitQuiz);
}

MESSAGE.addEventListener('animationend', () =>{
    MESSAGE.style.display = 'none';
})

MESSAGE.addEventListener('animationstart', () => {
    document.body.style.overflow = 'hidden';   // Lock scroll
});

MESSAGE.addEventListener('animationend', () => {
    document.body.style.overflow = '';         // Unlock scroll
});
