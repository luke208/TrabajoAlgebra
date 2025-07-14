from django import forms #Importa la libreria de formularios preinstalada de Djang0
from .models import Pregunta

#Crea la clase Respuesta del formulario
class RespuestaForm(forms.Form): #Estoy utilizando el formulario clasico, por eso el argumento
    opcion = forms.ChoiceField(widget=forms.RadioSelect) #Da una posibilidad de opciones para la pregunta
                            #De forma grafica permite ver un diseño para elegir las opciones

    #Aca desglosa las opciones
    def __init__(self, *args, **kwargs):
        pregunta = kwargs.pop('pregunta')
        super().__init__(*args, **kwargs)
        self.fields['opcion'].choices = [
            (opcion.id, opcion.texto) for opcion in pregunta.opciones.all()
        ]