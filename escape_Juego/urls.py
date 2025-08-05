from django.urls import path
from . import views

urlpatterns=[
    #La principal, por la que inicia el usuario y le pide ingresar
    #Hara el registro o inicio de sesion
    path('',views.home, name= 'home'),
    #Punto intermedio que verifica si ya se encuentra logueado el usuario
    #Sino lo esta, lleva a pedir el nombre del usuario, con el que se identificara en el juego
    #Sino va al menu del juego
    path('despues-login/', views.despues_login, name='despues_login'),
    #Para configurar el nombre
    path('configurar-nombre/', views.ConfigurarNombreJuego.as_view(), name='configurar_nombre_juego'),
    #El menu del juego
    path('menu/', views.menu_juego, name='menu_juego'),
    path('logout/', views.custom_logout_view, name='account_logout'),

    #Eleccion de Nivel<En el selector de niveles>
    path('eleccionNivel',views.eleccionNivel, name='eleccionNivel'),
    #Direccion al nivel seleccionado, lo considera a partir de la sala id 
    path('nivelSeleccionado/<int:sala_id>/', views.nivelSeleccionado, name='sala_seleccionada'),
    
    path('jugar/<int:pregunta_orden>/',views.jugar, name='jugar'),
    path('resultado', views.resultado_final, name='resultado_final'),
    path('ranking/', views.ranking, name='ranking'),
]
