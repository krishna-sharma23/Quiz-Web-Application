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
from .models import User
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

def save_quiz(request):
    if request.method == 'POST':
        try:
            # Parse JSON data from request
            data = json.loads(request.body)

            #getting the data
            quizz_title = data.get('title', 'untitled_quiz').replace(' ','_')
            questions = data.get('questions', [])
            topic = data.get('topic', 'General')
            duration = data.get('duration', '30')
            
            # Validate input
            if not quizz_title or len(quizz_title) == 0:
                return JsonResponse({'status': 'error', 'message': 'Quiz title cannot be empty'})
            if not questions or len(questions) == 0:
                return JsonResponse({'status': 'error', 'message': 'At least one question is required'})

            print(topic)
            print(duration)

            quiz_data = {'Title':quizz_title ,'Duration':duration, 'Topic': topic, 'Questions':questions}

            # Decide where to save (inside your Django project folder)
            file_path = os.path.join(settings.BASE_DIR, f'quiz/title={quizz_title}&duration={duration}&topic={topic}_quiz.json')


            # Save updated data back to file
            with open(file_path, 'w') as f:
                json.dump(quiz_data, f, indent=4)

            return JsonResponse({'status': 'success', 'message': f'Quiz {quizz_title} saved successfully'})

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON format'})
        except IOError as e:
            return JsonResponse({'status': 'error', 'message': f'File error: {str(e)}'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})

    return JsonResponse({'status': 'error', 'message': 'Invalid request'})


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
    folder_path = os.path.join(settings.BASE_DIR, "quiz")
    try:
        files = os.listdir(folder_path)
        return JsonResponse({"files": files})
    except Exception as e:
        return JsonResponse({"error" : str(e)}, status = 500)

@csrf_exempt
def display_quiz(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            file_name = data.get('id', '')
            
            if not file_name:
                return JsonResponse({'status': 'error', 'message': 'Quiz ID is required'})
                
            file_path = os.path.join(settings.BASE_DIR, f"quiz/{file_name}")

            with open(file_path, 'r') as file:
                questions = json.loads(file.read())

            for q in questions.get("Questions", []):
                q.pop("answer", None)

            return JsonResponse({'status': 'success', 'message': 'page loaded successfully', 'data': questions})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON in quiz file'})
        except FileNotFoundError:
            return JsonResponse({'status': 'error', 'message': 'Quiz not found'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': f"Error: {str(e)}"})
@csrf_exempt

def submit_quiz(request):
    if request.method == "POST":
        try:
            score = 0
            total_number_of_question = 1
            correct_answers = 0
            answer = ''
            answers = {}
            data = json.loads(request.body)
            file_path = os.path.join(settings.BASE_DIR, f"quiz/{data.get('id')}")
            # print(data)
            with open(file_path, 'r') as file:
                questions = json.loads(file.read())
                for q in questions["Questions"]:
                    answer = q.pop("answer", None)
                    answers[q["question_number"] - 1] = answer
                total_number_of_question = len(answers)
                # print(answers)
                # print(total_number_of_question)
                for ans in data['answers']:
                    # print(ans)
                    question_number = int(ans['question'])
                    if ans['answer'] == None:
                        continue
                    elif answers.get(question_number).upper() == ans['answer'].upper():
                        correct_answers += 1
                if correct_answers > 0:
                    score = (correct_answers/total_number_of_question) * 100
                    score = round(score, 2)
                else:
                    score = 0
                saving_the_score(score)
            return JsonResponse({'status': 'success', 'message': 'page loaded successfully', 'Score': score})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON format'})
        except FileNotFoundError:
            return JsonResponse({'status': 'error', 'message': 'Quiz file not found'})
        except ValueError as e:
            return JsonResponse({'status': 'error', 'message': f'Invalid data format: {str(e)}'})
        except Exception as e:
            print("Error during grading:", repr(e))
            return JsonResponse({'status': 'error', 'message': f"Grading error: {str(e)}"})

def saving_the_score(score):
    """Save the user's score to scores.json file"""
    try:
        detail_path = os.path.join(settings.BASE_DIR, "credentials/details.json")
        store_path = os.path.join(settings.BASE_DIR, "scores/scores.json")
        name = ''
        
        # Read user details
        with open(detail_path, 'r') as detail:
            ids = json.loads(detail.read())
            name = ids.get('Name', 'Unknown')
        
        # Read and update scores
        with open(store_path, 'r') as file:
            data = json.loads(file.read())
            data[name] = score
            with open(store_path, 'w') as f:
                json.dump(data, f, indent=4)
    except FileNotFoundError as e:
        print(f"Error: Required file not found - {str(e)}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in file - {str(e)}")
    except Exception as e:
        print(f"Error saving score: {str(e)}")


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
    if request.method == "POST":
        try:
            file_path = os.path.join(settings.BASE_DIR, "scores/scores.json")
            with open(file_path, 'r') as file:
                data = json.loads(file.read())
            return JsonResponse({'status': 'success', 'message': "done", 'Data': data})
        except FileNotFoundError:
            return JsonResponse({'status': 'error', 'message': 'Scores file not found'})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Scores file is corrupted'})
        except Exception as e:
            print("Error retrieving scores:", repr(e))
            return JsonResponse({'status': 'error', 'message': f"Error: {str(e)}"})

            
    
        

