#Trae lo que necesito para trabajar con modelo de bd
from django.db import models

class Jugador(models.Model):
    #clase Jugador con Nombre, puntaje y fecha que se jugo
    nombre=models.CharField(max_length=100)
    puntaje=models.IntegerField(default=100)
    fecha_jugada=models.DateTimeField(auto_now_add=True)

    #Como muestra los datos
    def __str__(self):
        return f"{self.nombre} - {self.puntaje} pts"

class Pregunta(models.Model):
    #Las preguntas tiene un enunciado y la respuesta correcta
    #Que es la que tiene en cuenta
    enunciado=models.TextField()
    

    #Muestra solo el enunciado
    def __str__(self):
        return self.enunciado
    
#Clase Opcion, que tendra las preguntas
class Opcion(models.Model):
    #La linea nos indica que las opciones se basaran en una misma pregunta (ForeignKey)
    #delete, nos dice que si se borra una pregunta, se borra sus opciones
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name='opciones')
    #Muestra el texto de cada opcion
    texto = models.TextField()
    #Verifica si la opcion es la correcta
    es_correcta= models.BooleanField(default=False)

    def __str__(self):
        return self.texto
