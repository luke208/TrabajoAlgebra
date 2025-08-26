from django import forms
from .models import Jugador #Importa el modelo de jugador

#La clase para colocar el nombre del jugador
class NombreJuegoForm(forms.ModelForm):
    #Modifica los valores
    class Meta:
        model = Jugador #Aplica al modelo del jugador
        fields = ['nombre_juego'] #En el campo del nombre del juego
        labels = {
            'nombre_juego': 'Tu Nombre de Juego (nickname)', #Indica cual sera tu nombre
        }
        help_texts = {
            'nombre_juego': 'Este nombre será visible para otros jugadores y en el ranking.',
        }

    #Muestra el dato del nombre del usuario
    def __init__(self, *args, **kwargs):
        # Es crucial para la validación obtener el usuario actual
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

    #Funcion para limpiar el nombre del juego
    def clean_nombre_juego(self):
        nombre_juego = self.cleaned_data['nombre_juego']
        if not nombre_juego.strip(): # Evita nombres solo con espacios
            raise forms.ValidationError("El nombre de juego no puede estar vacío.")
        # Opcional: Podrías añadir validación para caracteres especiales, longitud, etc.
        return nombre_juego