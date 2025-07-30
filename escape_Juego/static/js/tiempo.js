  //Busca en el html, desde el cronometro container (Que es el div)
  document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("cronometro-container");

    if (!contenedor) return; // por si no existe

    //Trae el dato del dato que contiene el div
    const inicioStr = contenedor.dataset.inicio;
    const tiempoInicio = new Date(inicioStr);

  function actualizarCronometro() {
      const ahora = new Date();
      const diferencia = Math.floor((ahora - tiempoInicio) / 1000);
      const minutos = Math.floor(diferencia / 60);
      const segundos = diferencia % 60;

      document.getElementById("cronometro").textContent =
          `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }

  setInterval(actualizarCronometro, 1000);
});
