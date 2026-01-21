
# 🧠 Quiz Web Application (Django)

A full-stack **Quiz Web Application** built using **Django, HTML, CSS, and JavaScript** with **JSON-based storage**. This project was created as a **first semester project** to understand how real-world web applications work, including frontend–backend communication, data handling, validation, and scoring logic.

The application allows users to:

* Register & login
* Create quizzes
* Attempt quizzes
* Get scores instantly
* View leaderboard

> ⚠️ This project is functional and complete, but still under active improvement in terms of **security, UI/UX, and code structure**.

---

## 🚀 Features

* 👤 User Registration & Login (with validation)
* 📝 Create custom quizzes
* 📂 Quiz storage using JSON files
* 🎯 Attempt quizzes through UI
* ⚡ Instant score calculation
* 🏆 Leaderboard system
* 🛡️ Input validation (email, username, password)
* ❌ Answers are hidden before showing quiz (backend removes them)
* 📊 Scores saved and displayed

---

## 🛠️ Tech Stack

**Frontend:**

* HTML
* CSS
* JavaScript

**Backend:**

* Django (Python)

**Storage:**

* JSON files (for quizzes, users, scores)

---

## 🧱 Project Structure (Concept)

* `views.py` → All backend logic (auth, quiz, scoring, validation)
* `quiz/` → Stores quiz JSON files
* `credentials/` → Stores user details
* `scores/` → Stores leaderboard data
* `templates/` → All HTML pages

---

## 📌 What I Learned From This Project

* Django request/response cycle
* Frontend ↔ Backend communication using fetch & JSON
* Form validation & error handling
* File handling in Python
* How quiz systems and scoring logic work
* Structuring a real-world web application
* Basic security concepts like validation & CSRF awareness

---

## ▶️ How To Run This Project

1. Clone the repository:

```bash
git clone https://github.com/krishna-sharma23/Quiz-Web-Application.git
```

2. Go into the project folder:

```bash
cd Quiz-Web-Application
```

3. Install Django:

```bash
pip install django
```

4. Run the server:

```bash
python manage.py runserver
```

5. Open in browser:

```
http://127.0.0.1:8000/
```

---

## ⚠️ Current Limitations

* Uses JSON instead of a database
* Authentication is basic (no hashing yet)
* CSRF is disabled in some places (will be fixed)
* UI is simple and not fully polished

---

## 🔮 Future Improvements

* Move from JSON to Database (SQLite/MySQL)
* Proper Django authentication system
* Password hashing
* Admin panel for managing quizzes
* Timer-based quizzes
* Better UI/UX
* Better security & permission system

---

## 📎 Short Description (GitHub About Section)

> A Django-based quiz web application using HTML, CSS, JS and JSON. Supports quiz creation, login, scoring, and leaderboard. Built as a first semester project and under active improvement.

---

## 🏁 Final Note

This project represents my **first full-stack web application** and my first experience building a complete system with frontend + backend + data storage.

---

# 🔥 For your LinkedIn:

> 🚀 Just published my first full-stack project: A Quiz Web Application built using Django, HTML, CSS, JS and JSON. It supports login, quiz creation, attempts, scoring and leaderboard. Still improving it with better security and UI!

---
