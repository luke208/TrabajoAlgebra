from django.shortcuts import render, get_object_or_404, redirect
from .models import Pregunta, Opcion, Jugador
from .forms import RespuestaForm

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
    #Trae las preguntas ordenadas
    preguntas = Pregunta.objects.all().order_by('id')  # O por dificultad, aleatorio, etc.
    
    # Validar si hay más preguntas
    if pregunta_orden >= len(preguntas):
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

            # Verificamos si la opción es la correcta
            if opcion.es_correcta:
                # Redirigimos a la siguiente pregunta
                return redirect('jugar', pregunta_orden=pregunta_orden + 1)
            else:
                # Si no es correcta, mostramos un mensaje de error
                jugador.puntaje-= int(jugador.puntaje*0.05)
                jugador.save() #guarda en el request, porque sino queda en memoria y al avanzar se limpia
                return render(request, 'jugar.html', {
                    'jugador':jugador, #Se manda al jugador
                    'pregunta': pregunta,
                    'form': form,
                    'pregunta_actual': pregunta_orden+1,
                    'total': len(preguntas),
                    'mensaje_error': "Respuesta incorrecta. Intenta nuevamente.",
                })
    else:
        form = RespuestaForm(pregunta=pregunta)
        #Avanza a la siguiente pregunta
    return render(request, 'jugar.html', {
        'jugador':jugador,
        'pregunta': pregunta,
        'form': form,
        'pregunta_actual': pregunta_orden + 1,
        'total': len(preguntas),
        'mensaje_error': None,  # No mostrar mensaje de error al principio
    })


def resultado_final(request):
    jugador = Jugador.objects.last()
    return render(request, 'resultado.html', {'jugador': jugador})

def ranking(request):
    jugadores = Jugador.objects.all().order_by('-puntaje')  # Una lista con los jugadores listados por el puntaje 
    return render(request, 'ranking.html', {'jugadores': jugadores}) #Retorna a html de resultado final 