from django.urls import path
from . import views

urlpatterns=[
    #hasta el momento para crear el usuario
    #path('',views.crearUsuario, name= 'nuevoJuego'),

    #Eleccion de Nivel<En el selector de niveles>
    path('eleccionNivel',views.eleccionNivel, name='eleccionNivel'),
    #Direccion al nivel seleccionado, lo considera a partir de la sala id 
    path('nivelSeleccionado/<int:sala_id>/', views.nivelSeleccionado, name='sala_seleccionada'),
    
    path('jugar/<int:pregunta_orden>/',views.jugar, name='jugar'),
    path('resultado', views.resultado_final, name='resultado_final'),
    path('ranking/', views.ranking, name='ranking'),
]
