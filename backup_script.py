import os
import django
from django.core.management import execute_from_command_line
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'escape_juego.settings')  # Cambia por tu settings
django.setup()

from django.core import serializers
from escape_Juego.models import Sala, Mision, FilaTabla, CeldaTabla
import json

# Obtener todos los datos
salas = Sala.objects.all()
misiones = Mision.objects.all()
filas = FilaTabla.objects.all()
celdas = CeldaTabla.objects.all()

# Crear una lista con todos los objetos
all_objects = list(salas) + list(misiones) + list(filas) + list(celdas)

# Serializar
serialized_data = serializers.serialize('json', all_objects, indent=2)

# Guardar con codificación UTF-8
with open('backup_misiones.json', 'w', encoding='utf-8') as f:
    f.write(serialized_data)

print("Backup creado exitosamente en backup_misiones.json")