from django.contrib import admin
from .models import Jugador, Pregunta, Opcion,Sala,Pista,Intento

class OpcionInline(admin.TabularInline):  # Muestra las opciones en forma de tabla
    model = Opcion
    extra = 1  # Cuántas opciones vacías querés que aparezcan por defecto
    min_num = 4  # Mínimo de opciones
    can_delete=True #Permite eliminar opciones

class PistaInline(admin.TabularInline):
    model=Pista
    min_num=1
    extra=1
    can_delete=True

class PreguntaAdmin(admin.ModelAdmin):
    list_display = ('enunciado', 'tipo', 'sala', 'dificultad')
    list_filter = ('tipo', 'sala', 'dificultad')
    search_fields = ('enunciado',)

    # Define cómo se agrupan y muestran los campos en el formulario de edición/creación
    fieldsets = (
        (None, { # Sección principal sin título
            'fields': ('sala', 'tipo', 'enunciado', 'dificultad'),
        }),
        ('Respuesta Correcta para Pregunta Directa', {
            'fields': ('respuesta_correcta',),
            'description': 'Este campo es solo para preguntas de tipo "Directa".',
            # Añadimos una clase CSS para poder manipular este fieldset con JS
            'classes': ('ocultar-por-defecto', 'directa-fieldset'), # Añade 'ocultar-por-defecto' y un nombre descriptivo
        }),
    )

    # Definimos los inlines que se mostrarán para este modelo
    # El OpcionInline solo se mostrará/ocultará vía JS
    inlines = [OpcionInline,PistaInline]

    # Inyectamos JavaScript y CSS personalizados para el Admin
    class Media:
        js = ('js/admin_pregunta_condicional.js',) # Ruta a tu JS estático. Asume 'static/js/admin_pregunta_condicional.js'
        
# Registro mejorado
admin.site.register(Jugador) #Registra al jugador
admin.site.register(Pregunta, PreguntaAdmin) #Re
admin.site.register(Sala)
admin.site.register(Intento)