from django.db.models.signals import post_save
from django.dispatch import receiver
from allauth.socialaccount.models import SocialAccount
from django.contrib.auth.models import User
from .models import Jugador
import random

def crear_nombre_juego_unico(base_nombre):
    """
    Genera un nombre de juego único.
    Si el nombre base ya existe, le añade un número aleatorio al final.
    """
    nombre_juego_final = base_nombre.replace(" ", "").lower()
    contador = 1
    while Jugador.objects.filter(nombre_juego=nombre_juego_final).exists():
        nombre_juego_final = f"{base_nombre.replace(' ', '').lower()}_{contador}"
        contador += 1
    return nombre_juego_final

@receiver(post_save, sender=SocialAccount)
def crear_jugador_con_nombre_unico(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        # Verificar si ya existe un jugador para este usuario
        # Como usas OneToOneField con primary_key=True, usa hasattr
        if not hasattr(user, 'jugador'):
            # Obtenemos el nombre del usuario de la cuenta social
            base_nombre = user.first_name or user.username or user.email.split('@')[0]
            
            # Generamos un nombre de juego único
            nombre_juego_unico = crear_nombre_juego_unico(base_nombre)
            
            # Creamos el objeto Jugador con el nombre único
            Jugador.objects.create(
                user=user,  # Correcto: el campo es 'user'
                nombre_juego=nombre_juego_unico,
                nombre_configurado_manualmente=False
            )
            print(f"Jugador creado para {user.username} con nombre: {nombre_juego_unico}")

# Signal para usuarios creados manualmente
@receiver(post_save, sender=User)
def crear_jugador_usuario_normal(sender, instance, created, **kwargs):
    if created and not hasattr(instance, 'jugador'):
        # Solo crear si no fue creado por social auth
        if not SocialAccount.objects.filter(user=instance).exists():
            base_nombre = instance.username or instance.email.split('@')[0]
            nombre_juego_unico = crear_nombre_juego_unico(base_nombre)
            Jugador.objects.create(
                user=instance,
                nombre_juego=nombre_juego_unico
            )