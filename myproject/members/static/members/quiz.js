const MAIN = document.querySelector("main");
const MESSAGE = document.getElementById("message");
const QUESTION_CONTAINER = document.getElementById("Question_container");
const SUBMIT = document.getElementById("Submit");

const TITLE = new URLSearchParams(window.location.search).get('id');
const DURATION = new URLSearchParams(window.location.search).get('duration');
const TOPIC = new URLSearchParams(window.location.search).get('topic');

const QUIZ_ID = `${TITLE}&duration=${DURATION}&topic=${TOPIC}`;

load();

async function load() {
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
    console.log(data.data.Questions)
    for(i in data.data.Questions){
        //creating a div for storing seperate questions
        const BLOCK = document.createElement('div');
        // creating a h3 element to store questions
        const QUESTION = document.createElement('h3');
        QUESTION.setAttribute('class', `${i}`);
        QUESTION.textContent = `Q${data.data.Questions[i].question_number}: ` + data.data.Questions[i].question;
        const LIST = document.createElement('div')
        //adding options
        for (let j in data.data.Questions[i].options) {
            const optText = data.data.Questions[i].options[j];
            const safeId = `q${i}_opt${j}`;                // unique id, no spaces

            const label = document.createElement('label');
            label.classList.add('option');                 // used by CSS
            label.setAttribute('for', safeId);

            const input = document.createElement('input');
            input.type = 'radio';
            input.id = safeId;
            input.name = `${i}`;                          // groups radio buttons
            input.value = optText;
            input.classList.add('option-input');

            const span = document.createElement('span');
            span.classList.add('option-text');
            span.textContent = optText;

            // Append input first so CSS sibling/pseudo selectors work reliably
            label.appendChild(input);
            label.appendChild(span);

            LIST.appendChild(label);
            LIST.appendChild(document.createElement('br'));
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

    // handle server response (score / message)
    // customize this block to match backend response
    alert(json.message ?? `Submitted${auto ? ' (auto)' : ''}. Score: ${json.Score ?? 'N/A'}`);
    let score = json.Score;
    
    console.log(json);
    console.log(score);

    document.getElementById('BOL').innerText = 'You have sucessfully submitted the Quiz........ You will be shortly redirected';
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

  // plain number -> assume minutes (common)
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
(function initTimerFromUrl() {
  // you already have DURATION via URLSearchParams in your code
  const rawDuration = DURATION; // uses variable from your script
  const seconds = parseDurationToSeconds(rawDuration) || 0;

  if (seconds <= 0) return; // no timer provided

  // start the countdown
  startCountdown(seconds);

  // optional: lock scroll while timer running (example)
  // document.body.style.overflow = 'hidden';  // uncomment if desired
})();

SUBMIT.addEventListener('click', submitQuiz)

MESSAGE.addEventListener('animationend', () =>{
    MESSAGE.style.display = 'none';
})

MESSAGE.addEventListener('animationstart', () => {
    document.body.style.overflow = 'hidden';   // Lock scroll
});

MESSAGE.addEventListener('animationend', () => {
    document.body.style.overflow = '';         // Unlock scroll
});