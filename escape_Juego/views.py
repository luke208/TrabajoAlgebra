from django.shortcuts import render, get_object_or_404, redirect
from .models import Pregunta, Opcion
from .forms import RespuestaForm

#Arranca desde la primera pregunta 
def jugar(request, pregunta_orden=0):
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
                # Si es correcta, sumamos el puntaje y avanzamos
                request.session['puntaje'] = request.session.get('puntaje', 0) + 1
                # Redirigimos a la siguiente pregunta
                return redirect('jugar', pregunta_orden=pregunta_orden + 1)
            else:
                # Si no es correcta, mostramos un mensaje de error
                return render(request, 'jugar.html', {
                    'pregunta': pregunta,
                    'form': form,
                    'mensaje_error': "Respuesta incorrecta. Intenta nuevamente.",
                })
    else:
        form = RespuestaForm(pregunta=pregunta)
        #Avanza a la siguiente pregunta
    return render(request, 'jugar.html', {
        'pregunta': pregunta,
        'form': form,
        'pregunta_actual': pregunta_orden + 1,
        'total': len(preguntas),
        'mensaje_error': None,  # No mostrar mensaje de error al principio
    })

#Iniciar el juego desde el comienzo
def iniciar_juego(request):
    # Reiniciar puntaje si querés
    request.session['puntaje'] = 0
    return redirect('jugar', pregunta_orden=0)

def resultado_final(request):
    puntaje = request.session.get('puntaje', 0)
    return render(request, 'resultado_final.html', {'puntaje': puntaje})
