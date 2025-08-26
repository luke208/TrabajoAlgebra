from django.apps import AppConfig


class EscapeJuegoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'escape_Juego'

    def ready(self):
        import escape_Juego.signals # Importamos el archivo de señales


    