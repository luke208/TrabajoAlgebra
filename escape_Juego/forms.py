from django import forms #Importa la libreria de formularios preinstalada de Django
from .models import Pregunta

# Este formulario permite que el usuario elija una opción para una pregunta
class RespuestaForm(forms.Form): #Estoy utilizando el formulario clasico, por eso el argumento
    opcion = forms.ChoiceField(widget=forms.RadioSelect) #Da una posibilidad de opciones para la pregunta
                            #De forma grafica permite ver un diseño para elegir las opciones
    #Aca desglosa las opciones
    #En general, lo que hace es mostrar dinamicamente las preguntas y las opciones para elegir 
    def __init__(self, *args, **kwargs): 
        #Kwargs funcionaria como las preguntas que se le cargo desde la vista
        #En realidad, se cargo a partir del admin de django
        pregunta = kwargs.pop('pregunta')
         # Se llama al constructor original del formulario (muy importante)
        # Esto permite que Django haga su trabajo normal de procesamiento de datos del form
        super().__init__(*args, **kwargs)
        
        # Se cargan dinámicamente las opciones que pertenecen a esa pregunta
        # Cada opción se agrega como una tupla (id, texto) al campo 'opcion'
        self.fields['opcion'].choices = [
            (opcion.id, opcion.texto) for opcion in pregunta.opciones.all()
        ]