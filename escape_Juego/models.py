from django.db import models
from django.conf import settings # Importa settings para User model
from django.db.models.signals import post_save # Para crear el Jugador automáticamente
from django.dispatch import receiver # Para el decorador de la señal
from django.utils import timezone # Para la lógica de fecha de desbloqueo en Sala
# ===============================
# Modelo que representa al jugador del juego
# Modelo que representa el perfil extendido del usuario del juego
# Vinculado directamente al modelo User de Django
# ===============================
class Jugador(models.Model):
    # Un OneToOneField es crucial aquí. Cada Jugador está vinculado a un único User.
    # primary_key=True hace que el ID del Jugador sea el mismo que el ID del User.
    # Esto significa que request.user.id == request.user.jugador.id
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True)
    nombre_juego = models.CharField(max_length=100, blank=True, null=True,
                                    help_text="Nombre visible en el juego (nickname). Déjalo vacío para usar el nombre de usuario.")
    # Ya no necesitas 'nombre' ni 'email' aquí, se obtienen del User model (user.username, user.email)
    fecha_registro = models.DateTimeField(auto_now_add=True)  # Fecha en la que se registró automáticamente

    # Otros campos específicos del jugador que no están en el User de Django
    # Por ejemplo, un avatar, una biografía, etc.
    # avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    #Se utiliza para cambiar el nombre de ciertos titulos del admin de django, respecto al modelo
    class Meta:
        #Este es de la tabla, donde se encuentra el perfil del jugador
        verbose_name = "Nombre de Perfil" # O "Perfil del Jugador", "Héroe", "Personaje", etc. (nombre singular)
        verbose_name_plural = "Jugadores" # O "Perfiles de Jugadores", "Héroes", "Personajes", etc. (nombre plural)

    def __str__(self):
        #Muestra el nombre que se coloco el usuario
        if self.nombre_juego:
            return self.nombre_juego
        #Sino colocara el generado en el user de django
        return self.user.username if self.user.username else self.user.email
    
# Señal para crear/actualizar el perfil Jugador automáticamente
# Cada vez que un User se guarda (ej. al registrarse con allauth), esta función se llama.
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_or_update_jugador_profile(sender, instance, created, **kwargs):
    if created:
        # Si el usuario es nuevo, crea un perfil de Jugador para él, el nombre del juego, esta en limpio
        #Debera realizarlo el usuario
        Jugador.objects.create(user=instance, nombre_juego='')
    # else:
    #     # Si el usuario ya existe y se está actualizando, también podrías actualizar el perfil del jugador
    #     # Por ejemplo, si tu Jugador tuviera otros campos que necesitaran ser sincronizados
    #     instance.jugador.save()
# ===============================
# Modelo que representa una sala o nivel del juego
# ===============================

class Sala(models.Model):
    nombre = models.CharField(max_length=100)  # Nombre de la sala (ej: "Nivel 1")
    descripcion = models.TextField()  # Descripción o introducción de la sala
    orden = models.PositiveIntegerField()  # Número de orden que indica el progreso (ej: 1, 2, 3...)

    def __str__(self):
        return self.nombre

# ===============================
# Modelo que representa una pregunta de una sala
# ===============================
class Pregunta(models.Model):
    TIPO_PREGUNTA = [
        ('directa', 'Respuesta Directa'),  # Tipo donde el jugador escribe la respuesta
        ('multiple_choice', 'Opción Múltiple'),  # Tipo donde el jugador elige entre opciones
    ]

    sala = models.ForeignKey(Sala, on_delete=models.CASCADE, related_name='preguntas',null=True,blank=True)  # Relación con la sala
    tipo = models.CharField(max_length=20, choices=TIPO_PREGUNTA)  # Tipo de pregunta
    enunciado = models.TextField()  # Enunciado de la pregunta
    respuesta_correcta = models.CharField(max_length=100, blank=True, null=True)  # Para preguntas de tipo directa
    dificultad = models.IntegerField(default=1)  # Nivel de dificultad (1 = fácil, 2 = media, etc.)

    def __str__(self):
        # guarda en que sala se encuentra la pregunta, sino no hay sala
        sala_nombre = self.sala.nombre if self.sala else "Sin Sala"

        #Y se visualizara la pregunta, en que sala y que dificultad tiene
        return f"{self.get_tipo_display()} en {sala_nombre} (Dificultad: {self.dificultad})"

# =================================
# Modelo para las opciones de una pregunta de múltiple elección
# =================================

class Opcion(models.Model):
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name='opciones')  # Pregunta relacionada
    texto = models.TextField()  # Texto de la opción
    es_correcta = models.BooleanField(default=False)  # Marca si esta opción es la correcta

    def __str__(self):
        return self.texto

# ===============================
# Modelo para las pistas que se pueden mostrar en una pregunta
# ===============================

class Pista(models.Model):
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name='pistas')  # Pregunta a la que pertenece
    contenido = models.TextField()  # Texto de la pista
    orden = models.PositiveIntegerField()  # Orden en que se muestra la pista

    def __str__(self):
        return f"Pista {self.orden} para Pregunta ID {self.pregunta.id}"

# ===============================
# Modelo que registra cada intento del jugador en una sala
# ===============================
class Intento(models.Model):
    jugador = models.ForeignKey(Jugador, on_delete=models.CASCADE)  # Jugador que hizo el intento
    sala = models.ForeignKey(Sala, on_delete=models.CASCADE)  # Sala correspondiente al intento
    fecha_inicio = models.DateTimeField(auto_now_add=True)  # Cuándo empezó el intento
    fecha_fin = models.DateTimeField(null=True, blank=True)  # Cuándo terminó el intento
    tiempo_total = models.DurationField(null=True, blank=True)  # Tiempo total jugado
    pistas_totales_usadas = models.PositiveIntegerField(default=0)  # Total de pistas utilizadas en ese intento
    puntaje=models.IntegerField(default=100)

    def __str__(self):
        jugador_nombre = self.jugador.user.username if self.jugador and self.jugador.user else "Anónimo"
        sala_nombre = self.sala.nombre if self.sala else "Sin Sala"
        return f"Intento de {jugador_nombre} en {sala_nombre} (Puntaje: {self.puntaje})"
    
# ===============================
# Modelo que guarda la respuesta dada por un jugador a una pregunta
# ===============================
#class RespuestaJugador(models.Model):
    #jugador = models.ForeignKey(Jugador, on_delete=models.CASCADE)  # Jugador que respondió
     #pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE)  # Pregunta respondida
    #respuesta_dada = models.CharField(max_length=100)  # Texto de la respuesta ingresada
    #es_correcta = models.BooleanField()  # Si la respuesta fue correcta
    #fecha_respuesta = models.DateTimeField(auto_now_add=True)  # Fecha y hora de la respuesta
    #pistas_usadas = models.PositiveIntegerField(default=0)  # Número de pistas usadas en esa pregunta

    #def _str_(self):
        #return f"{self.jugador} respondió a {self.pregunta}"