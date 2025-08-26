from django.contrib import admin
from .models import Jugador, Pregunta, Opcion, Sala, Partida, ProgresoUsuario, Mision, FilaTabla, CeldaTabla

# ======================================================================
# INLINES para la Misión y la Pregunta
# ======================================================================

class CeldaTablaInline(admin.TabularInline):
    """
    Permite editar las celdas de una fila de tabla.
    """
    model = CeldaTabla
    extra = 1

class FilaTablaInline(admin.StackedInline):
    """
    Permite editar las filas de una tabla de misión.
    """
    model = FilaTabla
    extra = 1

class OpcionInline(admin.TabularInline):
    """Muestra las opciones en forma de tabla."""
    model = Opcion
    extra = 1
    min_num = 0
    can_delete = True

# ======================================================================
# MODEL ADMINS registrados con el decorador @admin.register
# ======================================================================

@admin.register(Jugador)
class JugadorAdmin(admin.ModelAdmin):
    pass # No necesitas configuraciones especiales, pero lo registramos así.



@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    list_display = ('enunciado', 'tipo', 'sala', 'dificultad', 'target', 'es_pregunta_principal', 'order')
    list_filter = ('tipo', 'sala', 'dificultad', 'es_pregunta_principal', 'order')
    search_fields = ('enunciado', 'target', 'order')

    def get_inlines(self, request, obj=None):
        if obj and obj.tipo == 'multiple_choice':
            return [OpcionInline]
        return []
    
    def get_fields(self, request, obj=None):
        fields = ['sala', 'tipo', 'enunciado', 'dificultad', 'target', 'order']
        if obj:
            if obj.tipo == 'directa':
                fields.append('respuesta_correcta')
                fields.append('es_pregunta_principal')
        else:
            fields.extend(['respuesta_correcta', 'es_pregunta_principal'])
        return fields

@admin.register(Sala)
class SalaAdmin(admin.ModelAdmin):
    list_display = ('nombre',) # Ejemplo de una configuración básica.

@admin.register(Partida)
class PartidaAdmin(admin.ModelAdmin):
    pass

@admin.register(ProgresoUsuario)
class ProgresoUsuarioAdmin(admin.ModelAdmin):
    pass

@admin.register(Opcion)
class OpcionAdmin(admin.ModelAdmin):
    pass
    
@admin.register(Mision)
class MisionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'sala', 'target', 'order')
    list_filter = ('sala', 'target')
    inlines = [FilaTablaInline] # Incluye las filas de la tabla en el formulario de Mision

@admin.register(FilaTabla)
class FilaTablaAdmin(admin.ModelAdmin):
    """
    Registra el modelo FilaTabla para poder editarlo y ver sus celdas.
    """
    list_display = ('mision', 'nombre_fila', 'order')
    inlines = [CeldaTablaInline] # Esto hace que las celdas sean editables cuando entres a la fila

@admin.register(CeldaTabla)
class CeldaTablaAdmin(admin.ModelAdmin):
    list_display = ('fila_tabla', 'encabezado_columna', 'respuesta_correcta')