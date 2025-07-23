  
  // Pasás desde Django al JS el tiempo de inicio
  const tiempoInicio = new Date("{{tiempo_inicio_js}}");

  function actualizarCronometro() {
      const ahora = new Date();
      const diferencia = Math.floor((ahora - tiempoInicio) / 1000);
      const minutos = Math.floor(diferencia / 60);
      const segundos = diferencia % 60;

      document.getElementById("cronometro").textContent =
          `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }

  setInterval(actualizarCronometro, 1000);

