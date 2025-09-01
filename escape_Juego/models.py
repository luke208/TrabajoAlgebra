from django.db import models
from django.conf import settings # Importa settings para User model
from django.db.models.signals import post_save # Para crear el Jugador automáticamente
from django.dispatch import receiver # Para el decorador de la señal
from django.utils import timezone # Para la lógica de fecha de desbloqueo en Sala
from django.contrib.auth.models import User
from django.db.models.fields.json import JSONField
from decimal import Decimal
from datetime import timedelta

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
    nombre_juego = models.CharField(max_length=100, blank=True, null=True,unique=True,
                                    help_text="Nombre visible en el juego (nickname). Déjalo vacío para usar el nombre de usuario.")
    # Ya no necesitas 'nombre' ni 'email' aquí, se obtienen del User model (user.username, user.email)
    fecha_registro = models.DateTimeField(auto_now_add=True)  # Fecha en la que se registró automáticamente

    nombre_configurado_manualmente = models.BooleanField(default=False, 
                                                         help_text="Indica si el usuario ya configuró su nombre de juego manualmente")
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
    

# ===============================
# Modelo que representa una sala o nivel del juego
# ===============================

class Sala(models.Model):
    nombre = models.CharField(max_length=100)  # Nombre de la sala (ej: "Nivel 1")
    descripcion = models.TextField()  # Descripción o introducción de la sala
    orden = models.PositiveIntegerField()  # Número de orden que indica el progreso (ej: 1, 2, 3...)
    fecha_desbloqueo = models.DateTimeField(null=True, blank=True) 

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
    target = models.CharField(max_length=50, default='default-target') 

    # Este campo define el orden en que las preguntas aparecerán en el juego.
    order = models.PositiveIntegerField(
        default=0,
        help_text="El orden en que aparecerá la pregunta. Las preguntas con el mismo 'target' se ordenarán según este número."
    )

    es_pregunta_principal= models.BooleanField(default=False)

    class Meta:
        # Ordena las preguntas primero por el target y luego por el order.
        ordering = ['target', 'order']
        # Evita que se creen dos preguntas con el mismo target y el mismo order.
        unique_together = ('target', 'order')
    
    def __str__(self):
        # guarda en que sala se encuentra la pregunta, sino no hay sala
        sala_nombre = self.sala.nombre if self.sala else "Sin Sala"

        #Y se visualizara la pregunta, en que sala y que dificultad tiene
        return f"{self.get_tipo_display()} en {sala_nombre} (Dificultad: {self.dificultad})"

# =================================
# Modelo para las opciones de una pregunta de múltiple elección
# =================================

class Opcion(models.Model):
    pregunta = models.ForeignKey(
        Pregunta,
        on_delete=models.CASCADE,
        related_name='opciones',
        null=True,  # Permite que el campo sea nulo en la base de datos
        blank=True  # Permite que el campo esté vacío en los formularios
    )
    texto = models.TextField()
    es_correcta = models.BooleanField(default=False)

    def __str__(self):
        return self.texto
    
class Mision(models.Model):
    sala = models.ForeignKey(
        'Sala', # <--- ¡CAMBIO AQUÍ! Usamos la cadena 'Sala'
        on_delete=models.CASCADE,
        related_name='misiones',
        null=True,
        blank=True
    )
    # ==========================================================
    # CAMPOS AHORA SON OPCIONALES
    # ==========================================================
    titulo = models.CharField(max_length=200, null=True, blank=True)
    enunciado_mision = models.TextField(null=True, blank=True)
    instrucciones = models.TextField(null=True, blank=True)
    candado_intermedio_pregunta = models.CharField(max_length=255, null=True, blank=True)
    candado_intermedio_respuesta = models.CharField(max_length=100, null=True, blank=True)
    target = models.CharField(max_length=50, default='default-target') 
    order = models.PositiveIntegerField(default=0, help_text="El orden en que aparecerá esta misión dentro de su target.")
    pregunta_final = models.TextField(null=True, blank=True, help_text="Pregunta que se mostrará en la misión final.")
    respuesta_final = models.CharField(max_length=255, null=True, blank=True, help_text="Respuesta correcta para la misión final.")

    class Meta:
        ordering = ['target', 'order']
        unique_together = ('target', 'order')

    def __str__(self):
        sala_nombre = self.sala.nombre if self.sala else "Sin Sala"
        return f"Misión: {self.titulo} en {sala_nombre}"

class FilaTabla(models.Model):
    """
    Representa una fila de la tabla de una misión.
    """
    mision = models.ForeignKey(
        'Mision',
        on_delete=models.CASCADE,
        related_name='filas_tabla'
    )
    nombre_fila = models.CharField(
        max_length=50,
        help_text="Ejemplo: z1, z2, etc."
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Fila '{self.nombre_fila}' para la Misión: {self.mision.titulo}"

class CeldaTabla(models.Model):
    """
    Representa una celda individual con la respuesta correcta.
    """
    fila_tabla = models.ForeignKey(
        'FilaTabla',
        on_delete=models.CASCADE,
        related_name='celdas'
    )
    encabezado_columna = models.CharField(
        max_length=50,
        help_text="Ejemplo: parte_real, parte_imaginaria"
    )
    respuesta_correcta = models.CharField(max_length=200)
    # ==========================================================
    # NUEVO CAMPO: Indica si esta celda debe ser un input
    # ==========================================================
    es_campo_rellenable = models.BooleanField(
        default=True,
        help_text="Marcar si el usuario debe rellenar este campo en la tabla."
    )
    
    def __str__(self):
        return f"Celda de {self.encabezado_columna} en {self.fila_tabla}"
    
# ===============================
# Modelo que registra cada intento del jugador en una sala
# ===============================
class Partida(models.Model):
    jugador = models.ForeignKey(Jugador, on_delete=models.CASCADE)
    sala = models.ForeignKey(Sala, on_delete=models.CASCADE)
    completada = models.BooleanField(default=False)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    tiempo_total = models.DurationField(null=True, blank=True)
    puntaje = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    
    PUNTAJE_MINIMO = Decimal('60.00')
    DURACION_NIVEL_SEGUNDOS = 3600 * 3  # 3 horas (igual que en tu JS)

    def __str__(self):
        return f"Partida de {self.jugador.user.username} en {self.sala.nombre} (Puntaje: {self.puntaje})"

    def finalizar(self):
        self.completada = True
        self.fecha_fin = timezone.now()
        if self.fecha_inicio:
            self.tiempo_total = self.fecha_fin - self.fecha_inicio
        self.save()

    def restar_puntos_celda(self):
        self.puntaje -= Decimal('1.0')
        return self._verificar_puntaje_minimo()
    
    def restar_puntos_candado(self):
        self.puntaje -= Decimal('3.0')
        return self._verificar_puntaje_minimo()
        
    def restar_puntos_pregunta_final(self):
        self.puntaje -= Decimal('5.0')
        return self._verificar_puntaje_minimo()
    
    def _verificar_puntaje_minimo(self):
        if self.puntaje < self.PUNTAJE_MINIMO:
            return self._reiniciar_nivel()
        
        self.save()
        return {
            'puntaje_actual': float(self.puntaje), 
            'debe_reiniciar': False
        }
    

    def _reiniciar_nivel(self):
        self.puntaje = Decimal('100.00')
        self.completada = False
        self.fecha_fin = None
        self.tiempo_total = None
        self.save()
        
        return {
            'puntaje_actual': float(self.puntaje), 
            'debe_reiniciar': True,
            'mensaje': 'Puntaje insuficiente. Reiniciando nivel.'
        }
    def get_tiempo_restante(self):
        """Calcula el tiempo restante basado en el servidor"""
        if not self.fecha_inicio:
            return self.DURACION_NIVEL_SEGUNDOS
            
        tiempo_transcurrido = timezone.now() - self.fecha_inicio
        tiempo_restante_segundos = self.DURACION_NIVEL_SEGUNDOS - int(tiempo_transcurrido.total_seconds())
        
        # Si se acabó el tiempo, marcar como completada (game over)
        if tiempo_restante_segundos <= 0:
            if not self.completada:
                self.completada = True
                self.save()
            return 0
            
        return max(0, tiempo_restante_segundos)
    
    def esta_tiempo_agotado(self):
        """Verifica si se agotó el tiempo"""
        return self.get_tiempo_restante() <= 0
    
class ProgresoUsuario(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    unlocked_levels = models.IntegerField(default=1)

    def __str__(self):
        return f'Progreso de {self.user.username}'
    