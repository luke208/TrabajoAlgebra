from django.urls import path
from . import views

urlpatterns=[
    path('',views.crearUsuario, name= 'nuevoJuego'),
    #path('iniciar/', views.iniciar_juego, name='iniciar'),
    path('jugar/<int:pregunta_orden>/',views.jugar, name='jugar'),
    path('resultado', views.resultado_final, name='resultado_final'),
    path('ranking/', views.ranking, name='ranking'),
]
