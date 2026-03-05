from django.db import models

class User(models.Model):
    full_name = models.CharField(max_length=100)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)

    def __str__(self):
        return self.username

class Quiz(models.Model):
    title = models.TextField()
    topic = models.CharField(max_length=100)
    duration = models.PositiveIntegerField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="quizzes")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.topic})"

class Question(models.Model):
    TYPE_CHOICES = (
        ("MCQ", "Multiple Choice"),
        ("DAT", "Descriptive Answer Type"),
    )

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    question_number = models.PositiveIntegerField()
    question_text = models.TextField()
    question_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default="MCQ")
    correct_answer = models.TextField()

    class Meta:
        ordering = ["question_number"]
        constraints = [
            models.UniqueConstraint(fields=["quiz", "question_number"], name="unique_question_order_per_quiz")
        ]
    
    def __str__(self):
        return f"Q{self.question_number} - {self.quiz.title}"

class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="options")
    option_text = models.CharField(max_length=255)

    def __str__(self):
        return self.option_text

class Score(models.Model):
    quiz = models.ForeignKey("Quiz", on_delete=models.CASCADE, related_name="scores")
    user = models.ForeignKey("User", on_delete=models.SET_NULL, null=True, blank=True)
    guest_name = models.CharField(max_length=100, null=True, blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    total_questions = models.IntegerField()
    correct_answers = models.IntegerField()
    submitted_at = models.DateTimeField(auto_now_add=True)