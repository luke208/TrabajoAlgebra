from django import forms
from .models import Jugador

class NombreJuegoForm(forms.ModelForm):
    class Meta:
        model = Jugador
        fields = ['nombre_juego']
        labels = {
            'nombre_juego': 'Tu Nombre de Juego (nickname)',
        }
        help_texts = {
            'nombre_juego': 'Este nombre será visible para otros jugadores y en el ranking.',
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        self.fields['nombre_juego'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Ingresa tu nombre de juego'
        })

    def clean_nombre_juego(self):
        nombre_juego = self.cleaned_data['nombre_juego'].strip()
        
        if not nombre_juego:
            raise forms.ValidationError("El nombre de juego no puede estar vacío.")
        
        # Verificar que el nombre no esté en uso por otro usuario
        if self.user and hasattr(self.user, 'jugador'):
            existing = Jugador.objects.filter(nombre_juego=nombre_juego).exclude(user=self.user)
            if existing.exists():
                raise forms.ValidationError("Este nombre de juego ya está en uso.")
        
        return nombre_juego