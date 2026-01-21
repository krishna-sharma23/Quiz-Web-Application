from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import re
from django.http import JsonResponse
from django.conf import settings

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

def create_survey(request):
    return render(request, "members/create_survey.html")

def create_quizz(request):
    return render(request, "members/create_quizz.html")

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

@csrf_exempt
def save_details(request):
    if request.method == 'POST':
        try:
            #parsing data from the request
            data = json.loads(request.body.decode('utf-8'))
            
            # Validate input
            email = data.get('Email', '').strip()
            username = data.get('Username', '').strip()
            password = data.get('Password', '')
            name = data.get('Name', '').strip()
            
            if not email or not validate_email(email):
                return JsonResponse({'status': 'error', 'message': 'Invalid email format'})
            if not username or not validate_username(username):
                return JsonResponse({'status': 'error', 'message': 'Username must be 3-20 chars (alphanumeric, underscore only)'})
            if not password or not validate_password(password):
                return JsonResponse({'status': 'error', 'message': 'Password must be 6-100 characters'})
            if not name:
                return JsonResponse({'status': 'error', 'message': 'Name cannot be empty'})

            #setting the file path
            file_path = os.path.join(settings.BASE_DIR, f'credentials/details.json')

            #saving the data
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=4)

            return JsonResponse({'status': 'success', 'message': 'done'})
        
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': "Your data is not saved"})

@csrf_exempt
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
            
            # Validate password
            if not password or not validate_password(password):
                return JsonResponse({'status': 'error', 'message': 'Invalid password format'})
            if not user_input:
                return JsonResponse({'status': 'error', 'message': 'Username or email required'})

            if '@' in user_input:
                if not validate_email(user_input):
                    return JsonResponse({'status': 'error', 'message': 'Invalid email format'})
                email = user_input
            else:
                if not validate_username(user_input):
                    return JsonResponse({'status': 'error', 'message': 'Invalid username format'})
                username = user_input
           
            file_path = os.path.join(settings.BASE_DIR, f'credentials/details.json')

            with open(file_path, 'r') as file:
                details = json.loads(file.read())
            
            if len(email) > 0:
                if details.get("Email") == email:
                    checkUserName = True
            elif len(username) > 0:
                if details.get("Username") == username:
                    checkUserName = True
            
            if details.get("Password") == password:
                checkPassWord = True
            
            if checkPassWord and checkUserName:
                return JsonResponse({'status': 'success', 'message': 'Matched'})
            else:
                return JsonResponse({'status': 'success', 'message': 'Not Matched'})
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

            
    
        

