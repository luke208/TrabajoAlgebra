from django.shortcuts import render, get_object_or_404, redirect
from .models import Pregunta, Opcion, Jugador
from .forms import RespuestaForm
#Coloco esta libreria para tener en cuenta el tiempo del usuario
from django.utils.timezone import now

#Cuando se crea el usuario
def crearUsuario(request):
    if request.method == 'POST':
        #Trae el nombre que el usuario coloco, en una variable
        nombre = request.POST.get('nombre')
        #Crea el objeto jugador
        jugador = Jugador.objects.create(nombre=nombre)
        
        # Podés guardar el ID del jugador en la sesión para usarlo luego (Se guarda en el navegador)
        request.session['jugador_id'] = jugador.id
        
        
        return redirect('jugar', pregunta_orden=0)  # Dirige al usuario al nivel (Primera Pregunta)

    return render(request, 'crearJugador.html') #Desde donde viene los datos y la pagina 

#Arranca desde la primera pregunta 
def jugar(request, pregunta_orden=0):
    #Trae el dato de jugador, lo guarda en una variable
    jugador_id = request.session.get('jugador_id')
    #Crea el objeto
    jugador = Jugador.objects.get(id=jugador_id)

    #Aca empieza el registro de inicio, apenas se llama a la funcion
    if not jugador.tiempo_inicio: #Pregunta si esta vacio el campo de tiempo de inicio del jugador
        #En ese caso se coloca
        #hacemos esto en el caso que el usuario refresque la pagina, para que no se actualice el tiempo
        jugador.tiempo_inicio = now()
        jugador.save()
    
    #Trae las preguntas ordenadas
    preguntas = Pregunta.objects.all().order_by('id')  # O por dificultad, aleatorio, etc.
    
    # Validar si hay más preguntas
    if pregunta_orden >= len(preguntas):
        #Calculamos el tiempo final, ya que no habra mas preguntas
        jugador.tiempo_final = now()
        #Realizamos el calculo del tiempo total
        jugador.tiempo_total = (jugador.tiempo_final - jugador.tiempo_inicio).total_seconds()

        # Calcular puntaje real 
        puntaje = int(request.POST.get("puntaje", jugador.puntaje))  # ¡Nunca confiar solo en JS!
        jugador.puntaje = puntaje
        jugador.save()
        return redirect('resultado_final')  # Cuando terminó todo

    #Se selecciona una de las preguntas que estan en la lista
    #Cual? segun el valor indico en el argumento de la funcion
    pregunta = preguntas[pregunta_orden]


    #El metodo de respuesta, es que se envio el formulario, eligio una respuesta y dio a enviar
    if request.method == 'POST':
        #Esto es una instancia al objeto formulario
        #request.Post: Es todos los datos que el usuario envio
        #le pasas la  pregunta para que identifique de cual opcion has elegido
        form = RespuestaForm(request.POST, pregunta=pregunta)
        #Se valida el formulario, si se coloco alguna opcion
        if form.is_valid():
            
            #se ve la opcion elegida
            opcion_id = form.cleaned_data['opcion']
            #se busca la opcion correcta
            opcion = get_object_or_404(Opcion, id=opcion_id)

            tiempo_actual=now()
            tiempoTranscurrido=(tiempo_actual-jugador.tiempo_inicio).total_seconds()
            #Se obtiene el valor entero, que sera los puntos a penalizar
            #Sera a partir de los 10 segundos
            penalizacion_tiempo = int(tiempoTranscurrido // 10)

            # Aplico penalización al puntaje actual del jugador
            puntaje_actual = jugador.puntaje #Traigo el puntaje
            puntaje_actual -= penalizacion_tiempo #y resto
            # Verificamos si la opción es la correcta
            if opcion.es_correcta:
                # Redirigimos a la siguiente pregunta
                jugador.puntaje= max(puntaje_actual,0)
                jugador.save()
                return redirect('jugar', pregunta_orden=pregunta_orden + 1)
            else:
                # Si no es correcta, mostramos un mensaje de error
                penalizacion_error=int(jugador.puntaje*0.05)
                jugador.puntaje= max(puntaje_actual-penalizacion_error,0)
                jugador.save() #guarda en el request, porque sino queda en memoria y al avanzar se limpia
                tiempo_inicio_str = jugador.tiempo_inicio.replace(microsecond=0).isoformat()
                return render(request, 'jugar.html', {
                    'jugador':jugador, #Se manda al jugador
                    'pregunta': pregunta,
                    'form': form,
                    'pregunta_actual': pregunta_orden+1,
                    'total': len(preguntas),
                    'mensaje_error': "Respuesta incorrecta. Intenta nuevamente.",
                    'tiempo_inicio_js': tiempo_inicio_str,
                })
    else:
        form = RespuestaForm(pregunta=pregunta)
        tiempo_inicio_str = jugador.tiempo_inicio.replace(microsecond=0).isoformat()
        #Avanza a la siguiente pregunta
    return render(request, 'jugar.html', {
        'jugador':jugador,
        'pregunta': pregunta,
        'form': form,
        'pregunta_actual': pregunta_orden + 1,
        'total': len(preguntas),
        'mensaje_error': None,  # No mostrar mensaje de error al principio
        'tiempo_inicio_js': tiempo_inicio_str,
    })


def resultado_final(request):
    jugador = Jugador.objects.last()
    return render(request, 'resultado.html', {'jugador': jugador})

def ranking(request):
    jugadores = Jugador.objects.all().order_by('-puntaje')  # Una lista con los jugadores listados por el puntaje 
    return render(request, 'ranking.html', {'jugadores': jugadores}) #Retorna a html de resultado final 