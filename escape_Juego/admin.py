from django.contrib import admin
from .models import Jugador, Pregunta, Opcion

class OpcionInline(admin.TabularInline):  # Muestra las opciones en forma de tabla
    model = Opcion
    extra = 4  # Cuántas opciones vacías querés que aparezcan por defecto
    min_num = 2  # Mínimo de opciones
    max_num = 10  # Máximo opcional

class PreguntaAdmin(admin.ModelAdmin):
    inlines = [OpcionInline]

# Registro mejorado
admin.site.register(Jugador) #Registra al jugador
admin.site.register(Pregunta, PreguntaAdmin) #Re