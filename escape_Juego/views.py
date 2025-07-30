from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.urls import reverse_lazy # Importar reverse_lazy
from django.views.generic import FormView
#from .models import Pregunta, Opcion, Jugador,Sala
#from .forms import RespuestaForm
from .models import Intento # Asegúrate de que Intento esté aquí
#Coloco esta libreria para tener en cuenta el tiempo del usuario
from django.utils.timezone import now

def home(request):
    return render(request, 'home.html')
# --- NUEVA VISTA: Punto de entrada después del login ---

@login_required
def despues_login(request):
    # Verifica si el Jugador tiene un nombre_juego configurado
    # Como es la primera vez, este se encuentra limpio
    #Por lo cual, deberia ir aqui
    if not request.user.jugador.nombre_juego:
        messages.info(request, "¡Bienvenido! Por favor, elige un nombre para tu jugador.")
        return redirect('configurar_nombre_juego')
    else:
        # Si ya tiene nombre de juego, va directo al menú principal del juego
        return redirect('menu_juego')

@login_required
def eleccionNivel(request):
    #Trae todas las salas, organizadas por el orden del id
    todas_salas = Sala.objects.all().order_by('id')
    #Trae al dato del jugador
    jugador = request.user.jugador # AHORA: Accede al perfil Jugador del usuario autenticado
    # --- CAMBIO 4: Redirigir si el nombre de juego no está configurado (OPCIONAL, pero recomendado) ---
    if not jugador.nombre_juego:
        messages.info(request, "Por favor, elige un nombre de juego para identificarte.")
        return redirect('configurar_nombre_juego') # Asumiendo que crearás esta URL/vista
    
    return render(request, 'salas.html', {'todas_salas': todas_salas, 'jugador':jugador})

# --- Vista para configurar el nombre del jugador ---
class ConfigurarNombreJuego(LoginRequiredMixin, FormView):
    template_name = 'configurar_nombre_juego.html'
    form_class = NombreJuegoForm
    success_url = reverse_lazy('menu_juego') # Después de guardar el nombre, ir al menú

    #Trae el nombre actual en caso de que exista
    def get_initial(self):
        initial = super().get_initial()
        # Precargar el nombre actual si ya existe
        if self.request.user.is_authenticated and hasattr(self.request.user, 'jugador'):
            initial['nombre_juego'] = self.request.user.jugador.nombre_juego
        return initial

    def form_valid(self, form):
        jugador = self.request.user.jugador
        jugador.nombre_juego = form.cleaned_data['nombre_juego']
        jugador.save()
        messages.success(self.request, "¡Tu nombre de juego ha sido guardado con éxito!")
        return super().form_valid(form)
@login_required
def nivelSeleccionado(request, sala_id):
    #Redirige a una plantilla específica de nivel según la sala seleccionada.
    #Pk se le dice a la variable que guarda el id de sala
    sala = get_object_or_404(Sala, pk=sala_id)
    

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
        # Si el sala_id no coincide con ningún nivel esperado, redirigir a un error o al menú
        messages.error(request, "Nivel no válido o no configurado.")
        return redirect('eleccionNivel') # Volver a la lista de salas
    
    
    #Retorna a la pagina pedida
    return render(request, template_name)
#Arranca desde la primera pregunta 
def jugar(request, pregunta_orden=0):
    jugador= request.user.jugador

    current_intento = Intento.objects.filter(jugador=jugador, fecha_fin__isnull=True).order_by('-fecha_inicio').first()
    if not current_intento:
        # Esto debería ocurrir cuando el usuario selecciona una sala, no aquí.
        # Pero para evitar fallos por ahora, crea un intento para la primera sala si no hay.
        primera_sala = Sala.objects.order_by('id').first()
        if not primera_sala:
            messages.error(request, "No hay salas configuradas en el juego.")
            return redirect('eleccionNivel')
        current_intento = Intento.objects.create(jugador=jugador, sala=primera_sala, puntaje=0)
        messages.info(request, "Se inició un nuevo intento (temporal).")

    
    #Trae las preguntas ordenadas
    preguntas = Pregunta.objects.filter(sala=current_intento.sala).order_by('id')  # O por dificultad, aleatorio, etc.
    
    # Validar si hay más preguntas
    if pregunta_orden >= len(preguntas):
        #Calculamos el tiempo final, ya que no habra mas preguntas
        current_intento.fecha_fin = now()
        #Realizamos el calculo del tiempo total
        current_intento.tiempo_total = (current_intento.fecha_fin- current_intento.fecha_inicio)
        current_intento.save()
        # Calcular puntaje real 
        
        return redirect('resultado_final_intento',intento_id=current_intento.id)  # Cuando terminó todo

    #Se selecciona una de las preguntas que estan en la lista
    #Cual? segun el valor indico en el argumento de la funcion
    pregunta = preguntas[pregunta_orden]
    es_correcta=False
    respuesta_dada=''

    #El metodo de respuesta, es que se envio el formulario, eligio una respuesta y dio a enviar
    if request.method == 'POST':
        if pregunta.tipo == 'multiple_choice':
          opcion_id=request.POST.get('opcion')
          if opcion_id:
                opcion = get_object_or_404(Opcion, id=opcion_id, pregunta=pregunta)
                es_correcta = opcion.es_correcta
                respuesta_dada = opcion.texto # Guardamos el texto de la opción para referencia
          else:
                messages.error(request, "Por favor, selecciona una opción.")
                tiempo_inicio_str = current_intento.fecha_inicio.strftime('%Y-%m-%dT%H:%M:%SZ')
                return render(request, 'layout/jugar.html', { # Asegúrate de que esta sea la plantilla base
                    'jugador': jugador,
                    'sala': sala,
                    'pregunta': pregunta,
                    'pregunta_actual': pregunta_orden + 1,
                    'total': len(preguntas),
                    'mensaje_error': "Por favor, selecciona una opción.",
                    'tiempo_inicio_js': tiempo_inicio_str,
                    'current_intento_id': current_intento.id,
                    'opciones': Opcion.objects.filter(pregunta=pregunta), # Pasar opciones para el render
                })
        else: # Tipo 'directa'
            respuesta_dada = request.POST.get('respuesta_directa', '').strip()
            es_correcta = (respuesta_dada.lower() == pregunta.respuesta_correcta.lower())

        # Lógica de penalización (ahora sobre current_intento.puntaje)
        tiempo_actual = now()
        tiempoTranscurrido = (tiempo_actual - current_intento.fecha_inicio).total_seconds()
        penalizacion_tiempo = int(tiempoTranscurrido // 10)

        current_intento.puntaje -= penalizacion_tiempo
        current_intento.puntaje = max(current_intento.puntaje, 100)
        if es_correcta:
            # Aquí podrías considerar sumar puntos por respuesta correcta si tu juego lo requiere
            current_intento.puntaje += 10 # Ejemplo: Sumar 10 puntos por respuesta correcta
            current_intento.save()
            return redirect('jugar', sala_id=sala.id, pregunta_orden=pregunta_orden + 1)
        else:
            penalizacion_error = int(current_intento.puntaje * 0.05)
            current_intento.puntaje = max(current_intento.puntaje - penalizacion_error, 0)
            current_intento.save()

            tiempo_inicio_str = current_intento.fecha_inicio.strftime('%Y-%m-%dT%H:%M:%SZ')
            # Si la respuesta es incorrecta, volvemos a mostrar la misma pregunta
            return render(request, 'layout/jugar.html', { # Asegúrate de que esta sea la plantilla base
                'jugador': jugador,
                'sala': sala,
                'pregunta': pregunta,
                'pregunta_actual': pregunta_orden + 1,
                'total': len(preguntas),
                'mensaje_error': "Respuesta incorrecta. Intenta nuevamente.",
                'tiempo_inicio_js': tiempo_inicio_str,
                'current_intento_id': current_intento.id,
                'opciones': Opcion.objects.filter(pregunta=pregunta), # Pasar opciones para el render
            })
    else:
        tiempo_inicio_str = jugador.tiempo_inicio.strftime('%Y-%m-%dT%H:%M:%SZ')
        #Avanza a la siguiente pregunta
    return render(request, 'jugar.html', {
        'jugador':jugador,
        'sala': sala,
        'pregunta': pregunta,
        'pregunta_actual': pregunta_orden + 1,
        'total': len(preguntas),
        'mensaje_error': None,  # No mostrar mensaje de error al principio
        'current_intento_id': current_intento.id,
        'tiempo_inicio_js': tiempo_inicio_str,
        'opciones': Opcion.objects.filter(pregunta=pregunta), # Pasar opciones para el render
    })

@login_required
def resultado_final(request,intento_id):
    intento=get_object_or_404(intento,pk=intento_id,jugador=request.user.jugador)
    return render(request, 'resultado.html', {'intento':intento,'jugador': request.user.jugador})

@login_required
def ranking(request):
    intentos_ranking = Intento.objects.filter(fecha_fin__isnull=False).order_by('-puntaje', 'tiempo_total')[:100]  # Una lista con los jugadores listados por el puntaje 
    return render(request, 'ranking.html', {'intentos_ranking': intentos_ranking}) #Retorna a html de resultado final 