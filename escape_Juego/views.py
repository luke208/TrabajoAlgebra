from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.urls import reverse_lazy # Importar reverse_lazy
from django.views.generic import FormView
from django.contrib.auth import logout as auth_logout
from .models import Sala,ProgresoUsuario, Mision, FilaTabla, CeldaTabla,Partida,Jugador
from .forms import NombreJuegoForm
from django.views.decorators.csrf import csrf_exempt
import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST
#Coloco esta libreria para tener en cuenta el tiempo del usuario
from django.utils.timezone import now
from decimal import Decimal
from .signals import crear_nombre_juego_unico
#Inicio de pagina-Nombrado como Home
def home(request):
    return render(request, 'home.html')

# --- NUEVA VISTA: Punto de entrada después del login ---
@login_required
def despues_login(request):
    #Si trae el usuario 
    if hasattr(request.user, 'jugador'):
        jugador = request.user.jugador #Lo trae y ya esta configurado el nombre en el juego
        print(f"🔍 Nombre: '{jugador.nombre_juego}', Configurado manualmente: {jugador.nombre_configurado_manualmente}")
        
        # Si NO ha configurado manualmente su nombre (primera vez)
        if not jugador.nombre_configurado_manualmente:
            print("➡️ Primera vez - Redirigiendo a configurar nombre")
            return redirect('configurar_nombre_juego')
        else:#Sino va a directo al menu del juego
            return redirect('menu_juego')
    else: #Si no hay un jugador creado, se forma
        # Crear jugador si no existe (por si falla el signal)
        base_nombre = request.user.first_name or request.user.username or request.user.email.split('@')[0]
        nombre_juego_unico = crear_nombre_juego_unico(base_nombre)
        Jugador.objects.create(
            user=request.user,
            nombre_juego=nombre_juego_unico,
            nombre_configurado_manualmente=False  # Debe configurar
        )
        return redirect('configurar_nombre_juego')

class ConfigurarNombreJuego(LoginRequiredMixin, FormView):
    template_name = 'configurar_nombre_juego.html'
    form_class = NombreJuegoForm
    success_url = reverse_lazy('menu_juego')

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def get_initial(self):
        initial = super().get_initial()
        if hasattr(self.request.user, 'jugador'):
            initial['nombre_juego'] = self.request.user.jugador.nombre_juego
        return initial
    
    def form_valid(self, form):
        if not hasattr(self.request.user, 'jugador'):
            # Crear jugador si no existe
            jugador = Jugador.objects.create(
                user=self.request.user,
                nombre_juego='',
                nombre_configurado_manualmente=False
            )
        else:
            jugador = self.request.user.jugador
            
        jugador.nombre_juego = form.cleaned_data['nombre_juego']
        jugador.nombre_configurado_manualmente = True  # ← CLAVE: Ya configuró
        jugador.save()
        messages.success(self.request, "¡Tu nombre de juego ha sido guardado con éxito!")
        return super().form_valid(form)

# --- Vista del menú principal del juego (sin cambios en su lógica) ---
@login_required
def menu_juego(request):
    jugador=request.user.jugador
    return render(request, 'menu_juego.html',{'jugador':jugador})

#Cierre de sesión , cuando clickea
@login_required
def custom_logout_view(request):
    """
    Cierra la sesión del usuario y lo redirige a la página de inicio.
    """
    auth_logout(request)
    return redirect('home') # 'home' es el nombre de la URL de tu página de inicio

#La parte dedicada a seleccionar el nivel de la sala

@login_required
def eleccionNivel(request):
    progreso, created = ProgresoUsuario.objects.get_or_create(user=request.user)
     # Obtener todas las salas (niveles)
    todas_las_salas = Sala.objects.all().order_by('id')
    
    
    return render(request, 'selector-niveles.html', {
        'unlocked_levels': progreso.unlocked_levels,
        'todas_las_salas': todas_las_salas})


@login_required
# @login_required (Recomendado si esta vista es solo para usuarios logueados)
def nivelSeleccionado(request, sala_id):
    # Obtiene la sala o devuelve un 404 si no existe
    sala = get_object_or_404(Sala, pk=sala_id)

    # =========================================================================
    # 🆕 CREAR O OBTENER PARTIDA PARA ESTA SALA
    # =========================================================================

    try:
        jugador = request.user.jugador
    except AttributeError:
        messages.error(request, "No tienes un perfil de jugador asociado.")
        return redirect('home')
    
    # Buscar si ya existe una partida en curso para esta sala
    partida = Partida.objects.filter(
        jugador=jugador,
        sala=sala,
        completada=False
    ).first()
    
    # Si no existe, crear una nueva partida
    if not partida:
        partida = Partida.objects.create(
            jugador=jugador,
            sala=sala,
            completada=False
        )
        print(f"✅ Nueva partida creada: ID {partida.id} para sala {sala.nombre}")
    else:
        print(f"✅ Partida existente encontrada: ID {partida.id} para sala {sala.nombre}")

    # =========================================================================
    # Lógica para decidir qué plantilla de nivel específico cargar
    # =========================================================================
    template_name = None
    if sala_id == 1:
        template_name = 'nivel1.html'
    elif sala_id == 2:
        template_name = 'nivel2.html'
    elif sala_id == 3:
        template_name = 'nivel3.html'
    elif sala_id == 4:
        template_name = 'nivel4.html'
    else:
        messages.error(request, "Nivel no válido o no configurado.")
        return redirect('eleccionNivel')

    # =========================================================================
    # LÓGICA PARA LA MISIÓN: Obtener y estructurar los datos de la Misión
    # =========================================================================
    misiones = Mision.objects.filter(sala=sala).order_by('target', 'order')

    misiones_data_list = []
    
    for mision in misiones:
        # ==============================
        # Normalizar candado intermedio
        # ==============================
        valor_candado = mision.candado_intermedio_respuesta
        if valor_candado not in [None, '']:
            try:
                num = float(valor_candado)
                if num.is_integer():
                    candado_respuesta = str(int(num))       # enteros sin decimales
                else:
                    candado_respuesta = f"{num:.4f}"        # decimales a 4 cifras
            except ValueError:
                candado_respuesta = str(valor_candado)      # por si hay texto raro
        else:
            candado_respuesta = ''

        mision_data = {
            'id_mision': mision.id,
            'target': mision.target,
            'order': mision.order,
            'titulo': mision.titulo or '',
            'enunciado_mision': mision.enunciado_mision or '',
            'instrucciones': mision.instrucciones or '',
            'candado_intermedio_pregunta': mision.candado_intermedio_pregunta or '',
            'candado_respuesta_correcta': candado_respuesta,
            'filas_tabla': [],
            # ==========================================================
            # Campos para misión final (solo si target == 'principal')
            'pregunta_final': mision.pregunta_final or '',
            'respuesta_final': mision.respuesta_final or '',
            'encabezados': [],
        }

        # Traer filas y celdas de cada misión
        encabezados_set = []
        for fila in mision.filas_tabla.all():
            fila_data = {
                'nombre_fila': fila.nombre_fila,
                'order': fila.order,
                'celdas': {}
            }
            
            for celda in fila.celdas.all():
                fila_data['celdas'][celda.encabezado_columna] = {
                    'respuesta_correcta': celda.respuesta_correcta,
                    'es_campo_rellenable': celda.es_campo_rellenable, 
                }
                if celda.encabezado_columna not in encabezados_set:
                    encabezados_set.append(celda.encabezado_columna)
            
            mision_data['filas_tabla'].append(fila_data)
        
        mision_data['encabezados'] = encabezados_set
        misiones_data_list.append(mision_data)

    if not misiones_data_list:
        messages.warning(request, "No hay misiones configuradas para este nivel.")

    # =========================================================================
    # Creación del contexto final
    # =========================================================================
    context = {
        'sala': sala,
        'partida': partida,
        'misiones_data': misiones_data_list, 
    }
    print(f"🎮 Contexto creado - Partida ID: {partida.id}, Sala: {sala.nombre}")

    return render(request, template_name, context)

@login_required
def obtener_tiempo_restante(request, partida_id):
    """API para obtener el tiempo restante sincronizado con el servidor"""
    try:
        partida = get_object_or_404(Partida, pk=partida_id, jugador=request.user.jugador)
        
        tiempo_restante = partida.get_tiempo_restante()
        tiempo_agotado = partida.esta_tiempo_agotado()
        
        return JsonResponse({
            'tiempo_restante': tiempo_restante,
            'tiempo_agotado': tiempo_agotado,
            'completada': partida.completada
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def puntaje_actual(request, partida_id):
    try:
        partida = get_object_or_404(Partida, id=partida_id, jugador=request.user.jugador)
        
        return JsonResponse({
            'puntaje_actual': float(partida.puntaje),
            'status': 'success'
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'puntaje_actual': 100.00  # Fallback
        }, status=500)
    
#Verificar Candado
@login_required
@require_POST
def verificar_candado(request, partida_id):
    """Verificar respuesta de candado intermedio y penalizar si es incorrecta"""
    try:
        partida = get_object_or_404(Partida, pk=partida_id, jugador=request.user.jugador)
        data = json.loads(request.body)
        
        respuesta_usuario = data.get('respuesta', '').strip()
        respuesta_correcta = data.get('respuesta_correcta', '').strip()
        
        if not respuesta_usuario:
            return JsonResponse({'error': 'Respuesta vacía'}, status=400)
        
        # Comparación de respuestas (puedes hacerla más sofisticada)
        es_correcta = respuesta_usuario.lower() == respuesta_correcta.lower()
        
        if es_correcta:
            return JsonResponse({
                'correcta': True,
                'puntaje_actual': float(partida.puntaje),
                'debe_reiniciar': False
            })
        else:
            # Penalizar error en candado
            resultado = partida.restar_puntos_candado()
            return JsonResponse({
                'correcta': False,
                'puntaje_actual': resultado['puntaje_actual'],
                'debe_reiniciar': resultado['debe_reiniciar'],
                'mensaje': resultado.get('mensaje', 'Respuesta incorrecta')
            })
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

#Verificar celda
@login_required
@require_POST
def verificar_celda(request, partida_id):
    try:
        partida = get_object_or_404(Partida, pk=partida_id, jugador=request.user.jugador)
        data = json.loads(request.body)
        
        respuesta_usuario = data.get('respuesta', '').strip()
        respuesta_correcta = data.get('respuesta_correcta', '').strip()
        
        # 🔍 DEBUG: Logging inicial
        print(f"=== VERIFICAR CELDA DEBUG ===")
        print(f"PARTIDA ID: {partida_id}")
        print(f"PUNTAJE ANTES: {partida.puntaje}")
        print(f"RESPUESTA USUARIO: '{respuesta_usuario}'")
        print(f"RESPUESTA CORRECTA: '{respuesta_correcta}'")
        
        if not respuesta_usuario:
            return JsonResponse({'error': 'Respuesta vacía'}, status=400)
        
        # Normalización y comparación...
        def normalizar_valor(valor):
            if not valor:
                return ""
            return str(valor).strip().replace(' ', '').replace(',', '.').lower()
        
        resp_usuario_norm = normalizar_valor(respuesta_usuario)
        resp_correcta_norm = normalizar_valor(respuesta_correcta)
        es_correcta = resp_usuario_norm == resp_correcta_norm
        
        if not es_correcta:
            try:
                num_usuario = float(resp_usuario_norm)
                num_correcta = float(resp_correcta_norm)
                es_correcta = abs(num_usuario - num_correcta) < 0.001
            except:
                pass
        
        print(f"ES CORRECTA: {es_correcta}")
        
        if es_correcta:
            print(f"✅ RESPUESTA CORRECTA - Puntaje se mantiene: {partida.puntaje}")
            return JsonResponse({
                'correcta': True,
                'puntaje_actual': float(partida.puntaje),
                'debe_reiniciar': False
            })
        else:
            print(f"❌ RESPUESTA INCORRECTA - Restando puntos...")
            resultado = partida.restar_puntos_celda()
            print(f"🔥 RESULTADO DESPUÉS DE RESTAR: {resultado}")
            
            # 🔍 Recargar partida desde DB para verificar
            partida.refresh_from_db()
            print(f"💾 PUNTAJE EN DB DESPUÉS DE REFRESH: {partida.puntaje}")
            
            return JsonResponse({
                'correcta': False,
                'puntaje_actual': resultado['puntaje_actual'],
                'debe_reiniciar': resultado['debe_reiniciar'],
                'mensaje': resultado.get('mensaje', 'Respuesta incorrecta')
            })
            
    except Exception as e:
        print(f"💥 ERROR EN VERIFICAR_CELDA: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)
    
def restar_puntos_celda(self):
    print(f"📉 RESTAR_PUNTOS_CELDA - Puntaje actual: {self.puntaje}")
    puntaje_anterior = self.puntaje
    self.puntaje -= Decimal('1.0')
    print(f"📉 Puntaje después de restar: {self.puntaje}")
    resultado = self._verificar_puntaje_minimo()
    print(f"📉 Resultado final: {resultado}")
    return resultado

def _verificar_puntaje_minimo(self):
    print(f"🔍 VERIFICAR_PUNTAJE_MINIMO - Puntaje: {self.puntaje}, Mínimo: {self.PUNTAJE_MINIMO}")
    if self.puntaje < self.PUNTAJE_MINIMO:
        print("🔄 REINICIANDO NIVEL por puntaje insuficiente")
        return self._reiniciar_nivel()
    
    print("💾 GUARDANDO partida...")
    self.save()
    resultado = {
        'puntaje_actual': float(self.puntaje),
        'debe_reiniciar': False
    }
    print(f"✅ PARTIDA GUARDADA - Resultado: {resultado}")
    return resultado

#Reiniciar Partida
@login_required
@require_POST
def reiniciar_partida(request, partida_id):
    """Reinicia una partida - resetea puntaje y estado"""
    try:
        partida = get_object_or_404(Partida, pk=partida_id, jugador=request.user.jugador)
        
        # Resetear la partida
        partida.puntaje = Decimal('100.00')
        partida.completada = False
        partida.fecha_fin = None
        partida.tiempo_total = None
        # fecha_inicio se mantiene igual para conservar el tiempo de inicio original
        partida.save()
        
        print(f"🔄 Partida {partida_id} reiniciada - Puntaje: {partida.puntaje}")
        
        return JsonResponse({
            'success': True,
            'puntaje_actual': float(partida.puntaje),
            'mensaje': 'Partida reiniciada exitosamente'
        })
        
    except Exception as e:
        print(f"❌ Error reiniciando partida: {e}")
        return JsonResponse({'error': str(e)}, status=500)

#Verifica Pregunta final
@login_required
@require_POST 
def verificar_pregunta_final(request, partida_id):
    """Verificar respuesta de pregunta final y penalizar si es incorrecta"""
    try:
        partida = get_object_or_404(Partida, pk=partida_id, jugador=request.user.jugador)
        data = json.loads(request.body)
        
        respuesta_usuario = data.get('respuesta', '').strip()
        respuesta_correcta = data.get('respuesta_correcta', '').strip()
        
        if not respuesta_usuario:
            return JsonResponse({'error': 'Respuesta vacía'}, status=400)
        
        # Comparación de respuestas
        es_correcta = respuesta_usuario.lower() == respuesta_correcta.lower()
        
        if es_correcta:
            # Si la pregunta final es correcta, podría significar que completó todo
            return JsonResponse({
                'correcta': True,
                'puntaje_actual': float(partida.puntaje),
                'debe_reiniciar': False,
                'nivel_completado': True  # Podrías usar esto para finalizar la partida
            })
        else:
            # Penalizar error en pregunta final (mayor penalización)
            resultado = partida.restar_puntos_pregunta_final()
            return JsonResponse({
                'correcta': False,
                'puntaje_actual': resultado['puntaje_actual'],
                'debe_reiniciar': resultado['debe_reiniciar'],
                'mensaje': resultado.get('mensaje', 'Respuesta incorrecta'),
                'nivel_completado': False
            })
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_POST
def completar_nivel(request, partida_id):
    """Marcar el nivel como completado"""
    try:
        partida = get_object_or_404(Partida, pk=partida_id, jugador=request.user.jugador)
        
        # Finalizar la partida
        partida.finalizar()
        
        return JsonResponse({
            'success': True,
            'puntaje_final': float(partida.puntaje),
            'tiempo_total': str(partida.tiempo_total) if partida.tiempo_total else None,
            'mensaje': f'¡Nivel completado! Puntaje final: {partida.puntaje}'
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def resultado_final(request,intento_id):
    intento=get_object_or_404(intento,pk=intento_id,jugador=request.user.jugador)
    return render(request, 'resultado.html', {'intento':intento,'jugador': request.user.jugador})

@login_required
def ranking(request):
    intentos_ranking = Intento.objects.filter(fecha_fin__isnull=False).order_by('-puntaje', 'tiempo_total')[:100]  # Una lista con los jugadores listados por el puntaje 
    return render(request, 'ranking.html', {'intentos_ranking': intentos_ranking}) #Retorna a html de resultado final 