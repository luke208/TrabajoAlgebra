from django.urls import path
from . import views

urlpatterns=[
    path('iniciar/', views.iniciar_juego, name='iniciar'),
    path('jugar/<int:pregunta_orden>/',views.jugar, name='jugar'),
    #path('resultado/<int:jugador_id>/', views.resultado, name='resultado'),
    #path('ranking/', views.ranking, name='ranking'),
]
