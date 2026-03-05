from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import requests
import os
import re
from django.http import JsonResponse
from django.conf import settings
# google gemini client
from google import genai
# Import the User model from this app
from .models import User, Quiz, Question, Option, Score
from django.db import transaction
from django.db.models import Q

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username):
    """Validate username - alphanumeric and underscore only, 3-20 chars"""
    pattern = r'^[a-zA-Z0-9_]{3,20}$'
    return re.match(pattern, username) is not None

def validate_password(password):
    """Validate password - minimum 6 characters"""
    return len(password) >= 6 and len(password) <= 100

def home(request):
    return render(request, "members/index.html")

def members(request):
    return render(request, "members/members.html")

def index(request):
    return render(request, "members/index.html")

def leaderboard(request):
    return render(request, "members/leaderboard.html")

def explore(request):
    return render(request, "members/explore.html")

def login_view(request):
    return render(request, "members/login.html")

def register(request):
    return render(request, "members/register.html")

def is_user_logged_in(request):
    """Check if user is logged in by checking session data"""
    return 'user_id' in request.session

def logout_view(request):
    """Clear user session to log out"""
    if 'user_id' in request.session:
        del request.session['user_id']
        del request.session['username']
        del request.session['email']
    return render(request, "members/index.html")

@csrf_exempt
def register_user(request):
    """
    Handle user registration with validation and save to MySQL database.
    
    This view receives POST/JSON data, validates it, creates a User object,
    and saves it to the database.
    Flow: Request → Validation → User Object → MySQL Database
    """
    
    if request.method == 'POST':
        try:
            # Parse JSON or form data
            if request.content_type == 'application/json':
                data = json.loads(request.body.decode('utf-8'))
                # Match the keys from register.js (Name, Email, Username, Password)
                full_name = data.get('Name', '').strip()
                username = data.get('Username', '').strip()
                email = data.get('Email', '').strip()
                password = data.get('Password', '')
            else:
                full_name = request.POST.get('full_name', '').strip()
                username = request.POST.get('username', '').strip()
                email = request.POST.get('email', '').strip()
                password = request.POST.get('password', '')
            
            # VALIDATION STEP 1: Check email
            if not email or not validate_email(email):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid email format'
                }, status=400)
            
            # VALIDATION STEP 2: Check username
            if not username or not validate_username(username):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Username must be 3-20 chars (alphanumeric, underscore only)'
                }, status=400)
            
            # VALIDATION STEP 3: Check password
            if not password or not validate_password(password):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Password must be 6-100 characters'
                }, status=400)
            
            # VALIDATION STEP 4: Check full name
            if not full_name:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Full name cannot be empty'
                }, status=400)
            
            # Create new User object with validated data
            new_user = User(
                full_name=full_name,
                username=username,
                email=email,
                password=password
            )
            
            # Save to MySQL database
            new_user.save()
            
            # Return success response with user ID
            return JsonResponse({
                'status': 'success',
                'message': 'User registered successfully!',
                'user_id': new_user.id
            })
        
        except Exception as e:
            # If anything goes wrong, return error
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)
    
    # If not POST request, return error
    return JsonResponse({
        'status': 'error',
        'message': 'Only POST requests are allowed'
    }, status=405)



def create_survey(request):
    return render(request, "members/create_survey.html")

def create_quizz(request):
    # render the quiz‑creation page in all cases, but provide a flag
    # so the template can show a friendly message if the user isn't logged in.
    context = {}
    if not is_user_logged_in(request):
        context['not_logged_in'] = True
    return render(request, "members/create_quizz.html", context)

@csrf_exempt
def take_quizz(request):
    return render(request, "members/take_quizz.html")

def display(request):
    quiz_id = request.GET.get("id")   # get query param
    return render(request, "members/quiz.html", {"quiz_id": quiz_id})

def result(request):
    score = request.GET.get("score")   # get query param
    return render(request, "members/result.html", {"Score": score}) #{"quiz_id": quiz_id})

@transaction.atomic
def save_quiz(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Only POST requests are allowed'}, status=405)

    try:
        data = json.loads(request.body)

        quiz_title = (data.get('title') or '').strip()
        topic = (data.get('topic') or 'General').strip()
        questions = data.get('questions') or []
        duration_raw = data.get('duration', 30)

        if not quiz_title:
            return JsonResponse({'status': 'error', 'message': 'Quiz title cannot be empty'}, status=400)
        if not questions:
            return JsonResponse({'status': 'error', 'message': 'At least one question is required'}, status=400)

        try:
            duration = int(duration_raw)
        except (TypeError, ValueError):
            return JsonResponse({'status': 'error', 'message': 'Duration must be a valid number'}, status=400)

        user_id = request.session.get('user_id')
        if not user_id:
            return JsonResponse({'status': 'error', 'message': 'Login required to create a quiz'}, status=401)

        creator = User.objects.filter(id=user_id).first()
        if creator is None:
            return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)

        quiz = Quiz.objects.create(
            title=quiz_title,
            topic=topic,
            duration=duration,
            created_by=creator
        )

        for index, q in enumerate(questions, start=1):
            question_text = (q.get('question') or '').strip()
            question_type = (q.get('type') or 'MCQ').strip().upper()
            correct_answer = (q.get('answer') or '').strip()
            options = q.get('options') or []

            if not question_text:
                return JsonResponse({'status': 'error', 'message': f'Question {index} text cannot be empty'}, status=400)
            if question_type not in {'MCQ', 'DAT'}:
                return JsonResponse({'status': 'error', 'message': f'Invalid question type in question {index}'}, status=400)
            if not correct_answer:
                return JsonResponse({'status': 'error', 'message': f'Correct answer missing in question {index}'}, status=400)

            question = Question.objects.create(
                quiz=quiz,
                question_number=index,
                question_text=question_text,
                question_type=question_type,
                correct_answer=correct_answer
            )

            if question_type == 'MCQ':
                if len(options) < 2:
                    return JsonResponse({'status': 'error', 'message': f'Question {index} needs at least 2 options'}, status=400)
                for option_text in options:
                    cleaned_option = str(option_text).strip()
                    if cleaned_option:
                        Option.objects.create(
                            question=question,
                            option_text=cleaned_option
                        )

        return JsonResponse({
            'status': 'success',
            'message': f'Quiz {quiz_title} saved successfully',
            'quiz_id': quiz.id
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON format'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def get_details(request):
    if request.method == 'POST':
        try:
            email = ""
            username = ""
            password = ""
            details = {}
            checkUserName = False
            checkPassWord = False

            #parsing data from the request
            data = json.loads(request.body.decode('utf-8'))

            password = data.get("PassWord", "").strip()
            user_input = data.get("UserName", "").strip()
            
            user = User.objects.filter(Q(username=user_input) | Q(email=user_input)).first()
            
            #Check if user not found
            if user is None:
                return JsonResponse({'status': 'error', 'message': 'User not found'})
            #Check if password matches
            if user.password == password:
                request.session['user_id'] = user.id  # Store user ID in session
                request.session['username'] = user.username  # Store username in session
                request.session['email'] = user.email  # Store email in session
                return JsonResponse({'status': 'success', 'message': 'Matched'})
            else:
                return JsonResponse({'status': 'error', 'message': 'Not Matched'})

        except Exception as e:
            return JsonResponse({'status': 'error', 'message': "error"})

def get_quiz(request):
    try:
        quizzes = Quiz.objects.all().order_by("-created_at")
        data = []

        for quiz in quizzes:
            data.append({
                "id": quiz.id,
                "title": quiz.title,
                "topic": quiz.topic,
                "duration": quiz.duration,
                "question_count": quiz.questions.count(),
            })

        return JsonResponse({"status": "success", "quizzes": data})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def display_quiz(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            quiz_id = data.get('id')

            if not quiz_id:
                return JsonResponse({'status': 'error', 'message': 'Quiz ID is required'})

            try:
                quiz_id = int(quiz_id)
            except (TypeError, ValueError):
                return JsonResponse({'status': 'error', 'message': 'Invalid quiz ID'}, status=400)

            quiz = Quiz.objects.filter(id=quiz_id).prefetch_related("questions__options").first()
            if quiz is None:
                return JsonResponse({'status': 'error', 'message': 'Quiz not found'}, status=404)

            questions = []
            for question in quiz.questions.all():
                options = [opt.option_text for opt in question.options.all()]
                questions.append({
                    "question_id": question.id,
                    "question_number": question.question_number,
                    "question": question.question_text,
                    "type": question.question_type,
                    "options": options,
                })

            payload = {
                "quiz_id": quiz.id,
                "title": quiz.title,
                "topic": quiz.topic,
                "duration": quiz.duration,
                "Questions": questions,
            }

            return JsonResponse({'status': 'success', 'message': 'Quiz loaded successfully', 'data': payload})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON in request body'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': f"Error: {str(e)}"})
    return JsonResponse({'status': 'error', 'message': 'Only POST requests are allowed'}, status=405)
@csrf_exempt

def submit_quiz(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            quiz_id = data.get('id')
            submitted_answers = data.get('answers') or []

            if not quiz_id:
                return JsonResponse({'status': 'error', 'message': 'Quiz ID is required'}, status=400)

            try:
                quiz_id = int(quiz_id)
            except (TypeError, ValueError):
                return JsonResponse({'status': 'error', 'message': 'Invalid quiz ID'}, status=400)

            quiz = Quiz.objects.filter(id=quiz_id).prefetch_related("questions").first()
            if quiz is None:
                return JsonResponse({'status': 'error', 'message': 'Quiz not found'}, status=404)

            questions = list(quiz.questions.all())
            if not questions:
                return JsonResponse({'status': 'error', 'message': 'Quiz has no questions'}, status=400)

            answers_by_question_id = {}
            for ans in submitted_answers:
                question_id = ans.get('question')
                if question_id is None:
                    continue
                try:
                    question_id = int(question_id)
                except (TypeError, ValueError):
                    continue
                answers_by_question_id[question_id] = (ans.get('answer') or '').strip()

            correct_answers = 0
            total_number_of_question = len(questions)

            for question in questions:
                given_answer = answers_by_question_id.get(question.id, '').strip()
                if not given_answer:
                    continue

                expected = (question.correct_answer or '').strip()
                if question.question_type == 'DAT':
                    keywords = [k.strip().lower() for k in expected.split(',') if k.strip()]
                    candidate = given_answer.lower()
                    if not keywords:
                        continue
                    if len(keywords) == 1:
                        if candidate == keywords[0]:
                            correct_answers += 1
                    elif any(keyword in candidate for keyword in keywords):
                        correct_answers += 1
                else:
                    if expected.lower() == given_answer.lower():
                        correct_answers += 1

            score = round((correct_answers / total_number_of_question) * 100, 2) if total_number_of_question else 0
            user = None
            user_id = request.session.get("user_id")
            if user_id:
                user = User.objects.filter(id=user_id).first()

            Score.objects.create(
                quiz = quiz,
                user = user,
                guest_name = None if user else "Guest",
                score = score,
                total_questions = total_number_of_question,
                correct_answers = correct_answers,
            )
            return JsonResponse({
                'status': 'success',
                'message': 'page loaded successfully',
                'Score': score,
                'score': score
            })
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON format'})
        except ValueError as e:
            return JsonResponse({'status': 'error', 'message': f'Invalid data format: {str(e)}'})
        except Exception as e:
            print("Error during grading:", repr(e))
            return JsonResponse({'status': 'error', 'message': f"Grading error: {str(e)}"})
    return JsonResponse({'status': 'error', 'message': 'Only POST requests are allowed'}, status=405)


@csrf_exempt

def gemini_generate(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            num = data.get('amount', 5)  # default to 5 questions if not provided
            # subject = "maths"
            topic = data.get('topic', 'general')
            difficulty = "medium"
            standard = "college level"
            prompt = f"""
            Generate {num} multiple choice quiz questions on the topic: {topic}.

            Requirements:
            - Each question must have 4 options.
            - Only one correct answer.
            - Questions should be clear and not ambiguous.
            - Avoid repeated questions.
            - Keep difficulty level: {difficulty} + {standard}.
            - Do not include explanations.
            - Output in clean JSON format.

            JSON structure:
            (
                "question": "Question text",
                "options": ["A", "B", "C", "D"],
                "correctAnswer": "Correct option text"
            )
            """

            # First API call with reasoning
            response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": "Bearer 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",
                "Content-Type": "application/json",
            },
            data=json.dumps({
                "model": "stepfun/step-3.5-flash:free",
                "messages": [
                    {
                    "role": "user",
                    "content": prompt,
                    }
                ],
                "reasoning": {"enabled": True}
            })
            )

            # Extract the assistant message with reasoning_details
            response = response.json()
            response = response['choices'][0]['message']

            generated_content = response.get('content', '')

            # Normalize model text output into JSON list for frontend consumption
            cleaned = generated_content.replace("```json", "").replace("```", "").strip()
            parsed_questions = []
            try:
                parsed = json.loads(cleaned)
                parsed_questions = parsed if isinstance(parsed, list) else [parsed]
            except Exception:
                start = cleaned.find('[')
                end = cleaned.rfind(']')
                if start != -1 and end != -1 and end > start:
                    try:
                        parsed_questions = json.loads(cleaned[start:end + 1])
                    except Exception:
                        parsed_questions = []

            if not isinstance(parsed_questions, list):
                parsed_questions = []

            return JsonResponse({
                'status': 'success',
                'message': 'Content generated successfully',
                'generated_text': parsed_questions
            })
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON format'})
        except Exception as e:
            print(f"Error generating content: {str(e)}")
            return JsonResponse({'status': 'error', 'message': f"Error: {str(e)}"})

@csrf_exempt
def get_Score(request):
    if request.method != "POST":
        return JsonResponse({'status': 'error', 'message': 'Only POST requests are allowed'}, status=405)

    try:
        rows = (
            Score.objects
            .select_related("user", "quiz")
            .order_by("-score", "-submitted_at")[:100]
        )
        data = []
        for s in rows:
            data.append({
                "user_id": s.user_id,
                "username": s.user.username if s.user else (s.guest_name or "Guest"),
                "quiz_id": s.quiz_id,
                "quiz_title": s.quiz.title,
                "score": float(s.score),
                "total_questions": s.total_questions,
                "correct_answers": s.correct_answers,
                "submitted_at": s.submitted_at.isoformat(),
            })

        return JsonResponse({'status': 'success', 'message': "done", 'Data': data})
    except Exception as e:
        print("Error retrieving scores:", repr(e))
        return JsonResponse({'status': 'error', 'message': f"Error: {str(e)}"}, status=500)

            
    
        

