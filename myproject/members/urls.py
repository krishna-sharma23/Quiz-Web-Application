from django.urls import path
from . import views

urlpatterns = [
    path('members/', views.members, name='members'),
    path('', views.index, name='index'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('explore/', views.explore, name='explore'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register, name='register'),
    path('create_survey', views.create_survey, name='create_survey'),
    path('create_quizz', views.create_quizz, name='create_quizz'),
    path('save_quiz/', views.save_quiz, name='save_quiz'),
    path('take_quiz/', views.take_quizz, name='take_quizz'),
    path('save_details/', views.save_details, name='save_details'),
    path('get_details/', views.get_details, name='get_details'),
    path('get_quiz/', views.get_quiz, name='get_quiz'),
    path('display_quiz/', views.display_quiz, name='display_quiz'),
    path('take_quiz/display', views.display, name='display'),
    path('submit_quiz/', views.submit_quiz, name='submit_quiz'),
    path('result/', views.result, name='result'),
    path('get_score/', views.get_Score, name='get_Score'),
]
