from django.db.models.signals import post_save
from django.dispatch import receiver
from allauth.socialaccount.models import SocialAccount
from .models import Jugador
import random

# Este código asume que tienes un modelo Jugador con el campo nombre_juego

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

# Usamos un signal para que esto ocurra automáticamente después de que se crea un SocialAccount
@receiver(post_save, sender=SocialAccount)
def crear_jugador_con_nombre_unico(sender, instance, created, **kwargs):
    # Verificamos si se acaba de crear una nueva cuenta social
    if created:
        user = instance.user
        # Si el usuario NO tiene un objeto Jugador asociado, lo creamos
        if not hasattr(user, 'jugador'):
            # Obtenemos el nombre del usuario de la cuenta social
            base_nombre = user.username or user.email.split('@')[0]
            
            # Generamos un nombre de juego único
            nombre_juego_unico = crear_nombre_juego_unico(base_nombre)
            
            # Creamos el objeto Jugador con el nombre único
            Jugador.objects.create(
                user=user,
                nombre_juego=nombre_juego_unico
            )
