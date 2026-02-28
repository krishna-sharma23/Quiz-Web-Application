//html elements
const question_container = document.getElementById("maker");
const Mcq = document.getElementById("mcq");
const Dat = document.getElementById("dat");
const answer_container = document.getElementById("answer_container");
const submit = document.getElementById("Submit");
const reset = document.getElementById("Reset");
const add_question = document.getElementById("Add");
const questionTextArea = document.getElementById("question");
const Entered_Questions_Container = document.getElementById("question_container");
const Quizz_Name = document.getElementById("quizz_name");
const Question_Counter = document.getElementById("number_of_questions");
const GENERATE_QUESTION = document.getElementById("G_Ques");
const QUESTION_GENERATOR = document.getElementById("Question_Generator");
const BLUR_BG = document.getElementById("blur");
const DURATION = document.getElementById("Duration");
const TOPIC = document.getElementById("Topic");
const customDuration = document.getElementById('custom_duration');
const customTopic = document.getElementById('custom_topic');
const preview_title = document.getElementById("preview_title");

//computing variables
let allQuestions = [];
let options = [];
let correctOption; 
let questionNumber = 1;
let correct_option_entered = false;
let number_of_questions = 0;
Mcq.checked = true;

// watch the selects so we can show custom inputs
DURATION.addEventListener('change', () => {
    if (DURATION.value === 'Other') {
        customDuration.style.display = 'block';
    } else {
        customDuration.style.display = 'none';
        customDuration.value = '';
    }
});
TOPIC.addEventListener('change', () => {
    if (TOPIC.value === 'Other') {
        customTopic.style.display = 'block';
    } else {
        customTopic.style.display = 'none';
        customTopic.value = '';
    }
});

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

// function for choosing answer types
function renderAnswerFields(){
    answer_container.innerHTML='';

    if(Mcq.checked){
        
        // MCQ: show option input and buttons
        const optionInput = document.createElement('input');
        optionInput.type = 'text';
        optionInput.placeholder = 'Enter option here';
        optionInput.id = 'option_input';
        optionInput.className = 'form-input';

        const addBtn = document.createElement('button');
        addBtn.textContent = '➕ Add Option';
        addBtn.type = 'button';
        addBtn.id = 'add_option';
        addBtn.className = 'btn btn-secondary';
        addBtn.style.width = 'auto';

        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑️ Delete Last';
        delBtn.type = 'button';
        delBtn.id = 'delete_option';
        delBtn.className = 'btn btn-secondary';
        delBtn.style.width = 'auto';

        const correctBtn = document.createElement('button');
        correctBtn.textContent = '✅ Add Correct';
        correctBtn.type = 'button';
        correctBtn.id = 'correct_option';
        correctBtn.className = 'btn btn-info';
        correctBtn.style.width = 'auto';

        const optionList = document.createElement('ul');
        optionList.id = 'option_list';

        // Add button functionality
        addBtn.addEventListener('click', () => {
            if (optionInput.value.trim() !== '') {
                options.push(optionInput.value.trim());
                const li = document.createElement('li');
                li.textContent = optionInput.value.trim();
                optionList.appendChild(li);
                optionInput.value = '';
                optionInput.focus();
                showToast("Option added", "success");
            } else {
                showToast("Please enter an option", "warning");
            }
        });

        // Delete last option
        delBtn.addEventListener('click', () => {
            if (optionList.lastChild) {
                options.pop();
                optionList.removeChild(optionList.lastChild);
                showToast("Option removed", "warning");
            }
        });

        //adding functions to correct option button
        correctBtn.addEventListener('click', () =>{
            if(!correct_option_entered){
                if(optionInput.value.trim() === '') {
                    showToast("Please enter an option", "warning");
                    return;
                }
                options.push(optionInput.value.trim());
                correctOption = optionInput.value.trim();
                const li = document.createElement('li');
                li.textContent = optionInput.value.trim() + " ✅";
                li.style.fontWeight = 'bold';
                li.style.color = 'green';
                optionList.appendChild(li);
                optionInput.value = '';
                correct_option_entered = true;
                showToast("Correct answer set", "success");
            } else {
                showToast("Correct answer already set. Delete and try again.", "warning");
            }
        })

        // Append everything
        answer_container.appendChild(optionInput);
        const btnGroup = document.createElement('div');
        btnGroup.className = 'button-group';
        btnGroup.style.gap = '8px';
        btnGroup.appendChild(addBtn);
        btnGroup.appendChild(delBtn);
        btnGroup.appendChild(correctBtn);
        answer_container.appendChild(btnGroup);
        answer_container.appendChild(optionList);

    } 
    else if (Dat.checked) {
        // Description: show textarea
        const descArea = document.createElement('textarea');
        descArea.className = 'form-textarea';
        descArea.rows = 3;
        descArea.placeholder = 'Enter keywords (comma separated)...';
        answer_container.appendChild(descArea);
    }
}

renderAnswerFields();

// Re-render when radio selection changes
Mcq.addEventListener('change', renderAnswerFields);
Dat.addEventListener('change', renderAnswerFields);

// Update preview title in real-time
Quizz_Name.addEventListener('input', () => {
    preview_title.textContent = Quizz_Name.value.trim() || 'Not Set';
});

//Adding action listener to the submit button
submit.addEventListener('click', submit_question);
add_question.addEventListener('click', savingQuestions)

//saving the question
function savingQuestions(){
    if (questionTextArea.value.trim() === '') {
        showToast("Question cannot be empty", "error");
        return;
    }
    
    if (Mcq.checked && !correct_option_entered) {
        showToast("Please set a correct answer", "error");
        return;
    }
    
    if (Dat.checked && !document.querySelector('.answer-container textarea')?.value.trim()) {
        showToast("Please enter keywords for answer", "error");
        return;
    }

    allQuestions.push({
        question_number: questionNumber,
        question: questionTextArea.value.trim(),
        type: Mcq.checked ? 'MCQ' : 'DAT',
        options: Mcq.checked ? options : [],
        answer: Mcq.checked ? correctOption : document.querySelector('.answer-container textarea')?.value.trim(),
    });
    
    questionNumber++;
    questionTextArea.value = '';
    renderAnswerFields();
    options = [];
    correct_option_entered = false;
    addingQuestionToList();
    showToast("Question added successfully!", "success");
}

//submitting to the backend
function submit_question(){
    if (Quizz_Name.value.trim() === '') {
        showToast("Please enter quiz name", "error");
        return;
    }
    
    if (allQuestions.length === 0) {
        showToast("Please add at least one question", "error");
        return;
    }

    // make sure custom inputs are filled when needed
    if (DURATION.value === 'Other' && customDuration.value.trim() === '') {
        showToast("Please specify a custom duration", "error");
        return;
    }
    if (TOPIC.value === 'Other' && customTopic.value.trim() === '') {
        showToast("Please specify a custom topic", "error");
        return;
    }

    // pick custom values when "Other" is selected
    let Duration = DURATION.value === 'Other' ? customDuration.value.trim() : DURATION.value;
    let Topic = TOPIC.value === 'Other' ? customTopic.value.trim() : TOPIC.value;

    // Show loading state
    submit.disabled = true;
    submit.textContent = "⏳ Saving...";

    fetch("/save_quiz/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            title: Quizz_Name.value.trim(),
            questions: allQuestions,
            duration: Duration,
            topic: Topic
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showToast("Quiz saved successfully! 🎉", "success");
            // Reset everything
            allQuestions = [];
            questionNumber = 1;
            Entered_Questions_Container.innerHTML = '<p class="empty-state">No questions added yet</p>';
            Quizz_Name.value = "";
            preview_title.textContent = "Not Set";
            Question_Counter.innerText = "0";
            submit.disabled = false;
            submit.textContent = "✅ Save & Publish Quiz";
        } else {
            showToast("Error: " + data.message, "error");
            submit.disabled = false;
            submit.textContent = "✅ Save & Publish Quiz";
        }
    })
    .catch(error => {
        showToast("Error saving quiz", "error");
        console.error('Error:', error);
        submit.disabled = false;
        submit.textContent = "✅ Save & Publish Quiz";
    });
}

//generating cookies
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

//adding question to the list
function addingQuestionToList(){
    Question_Counter.innerText = "" + (questionNumber - 1);
    
    let entered_question = document.createElement("div");
    entered_question.classList.add("question-box");

    // Get the last question entered
    let latestQuestion = allQuestions[allQuestions.length - 1];

    // Question text
    let question_name = document.createElement("h2");
    question_name.textContent = `Q${latestQuestion.question_number}: ${latestQuestion.question}`;
    entered_question.appendChild(question_name);

    // Options/Answer list
    if (latestQuestion.type === "MCQ" && latestQuestion.options.length > 0) {
        let optionList = document.createElement("ul");

        latestQuestion.options.forEach(opt => {
            let li = document.createElement("li");
            li.textContent = opt;

            // Highlight the correct option
            if (opt === latestQuestion.answer) {
                li.style.fontWeight = "bold";
                li.style.color = "#10b981";
                li.textContent += "  ✅";
            }

            optionList.appendChild(li);
        });

        entered_question.appendChild(optionList);
    } else if (latestQuestion.type === "DAT") {
        let answerDiv = document.createElement("div");
        answerDiv.style.cssText = "padding: 8px 12px; background: #ecfdf5; border-left: 3px solid #10b981; border-radius: 6px;";
        answerDiv.innerHTML = `<strong>Keywords:</strong> ${latestQuestion.answer}`;
        entered_question.appendChild(answerDiv);
    }

    // Clear empty state if first question
    if (Question_Counter.innerText === '1') {
        Entered_Questions_Container.innerHTML = '';
    }

    // Append the whole question block to container
    Entered_Questions_Container.appendChild(entered_question);
}

//resetting 
reset.addEventListener('click', ()=>{
    Entered_Questions_Container.innerHTML = '<p class="empty-state">No questions added yet</p>';
    questionNumber = 1;
    allQuestions = [];
    Question_Counter.innerText = '0';
    showToast("Questions cleared", "warning");
})

//generating questions from api
GENERATE_QUESTION.addEventListener('click', ()=>{
    BLUR_BG.classList.add('active');
    
    // Create modal content
    const modalBody = QUESTION_GENERATOR.querySelector('.modal-body');
    modalBody.innerHTML = '';
    
    const H3 = document.createElement('h3');
    H3.textContent = "🤖 Generate Questions from API";
    H3.style.marginBottom = "20px";
    
    const LABEL = document.createElement('label');
    LABEL.textContent = "Number of Questions";
    LABEL.htmlFor = 'num_of_ques';
    LABEL.className = 'form-group';
    
    const INPUT = document.createElement('input');
    INPUT.setAttribute('id', 'num_of_ques');
    INPUT.setAttribute('type', 'number');
    INPUT.setAttribute('max', '20');
    INPUT.setAttribute('min', '5');
    INPUT.setAttribute('value', '5');
    INPUT.className = 'form-input';
    
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    formGroup.appendChild(LABEL);
    formGroup.appendChild(INPUT);
    
    const SUBMIT = document.createElement('button');
    SUBMIT.textContent = "✨ Generate"
    SUBMIT.className = 'btn btn-primary';

    //generating questions from api via our Django proxy (uses Gemini API key)
    // make sure you set GEMINI_API_KEY in your settings environment
    SUBMIT.addEventListener('click', async ()=>{
        let num = INPUT.value;
        
        if (num < 5 || num > 20) {
            showToast("Please enter between 5 and 20 questions", "warning");
            return;
        }
        
        SUBMIT.disabled = true;
        SUBMIT.textContent = "⏳ Generating...";
        
        try {
            // call our Django proxy which will use the Gemini API key
            const response = await fetch("/gen_gemini/", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: num, topic: TOPIC.value })
            });
            const data = await response.json();

            // Normalize response to an array of question objects
            const items = normalizeGeneratedQuestions(data.generated_text);
            console.log(items)

            if (!Array.isArray(items) || items.length === 0) {
                showToast("No valid questions returned from backend", "error");
                SUBMIT.disabled = false;
                SUBMIT.textContent = "âœ¨ Generate";
                return;
            }

                // Clear previous preview and append returned questions
                Entered_Questions_Container.innerHTML = '';

                items.forEach(q => {
                    const text = decodeHTML(q.question || q.question_text || '');
                    const optsRaw = q.options || q.incorrect_answers || [];
                    const opts = Array.isArray(optsRaw) ? optsRaw.map(o => decodeHTML(o)) : [];
                    const ans = decodeHTML(q.answer || q.correctAnswer || q.correct_answer || '');

                    allQuestions.push({
                        question_number: questionNumber,
                        question: text,
                        type: 'MCQ',
                        options: opts,
                        answer: ans,
                    });

                    questionNumber++;
                    addingQuestionToList();
                });

                // Update counter
                Question_Counter.innerText = "" + (questionNumber - 1);
                BLUR_BG.classList.remove('active');
                showToast("Questions generated successfully!", "success");

        } catch(error) {
            showToast("Error generating questions", "error");
            console.error(error);
        }
        
        SUBMIT.disabled = false;
        SUBMIT.textContent = "✨ Generate";
    })

    // Close button functionality
    document.getElementById('escape').addEventListener('click', ()=>{
        BLUR_BG.classList.remove('active');
    });
    
    // Close on backdrop click
    BLUR_BG.addEventListener('click', (e) => {
        if (e.target === BLUR_BG) {
            BLUR_BG.classList.remove('active');
        }
    });

    modalBody.appendChild(H3);
    modalBody.appendChild(formGroup);
    modalBody.appendChild(SUBMIT);
})

// Helper function to decode HTML entities
function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

// Parse backend generated_text into an array of questions
function normalizeGeneratedQuestions(generatedText) {
    if (Array.isArray(generatedText)) return generatedText;

    if (typeof generatedText === 'string') {
        const cleaned = generatedText
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

        try {
            const parsed = JSON.parse(cleaned);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (_) {
            const start = cleaned.indexOf('[');
            const end = cleaned.lastIndexOf(']');
            if (start !== -1 && end !== -1 && end > start) {
                try {
                    return JSON.parse(cleaned.slice(start, end + 1));
                } catch (_) {
                    return [];
                }
            }
            return [];
        }
    }

    return [];
}
