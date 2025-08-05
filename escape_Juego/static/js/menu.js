document.addEventListener("DOMContentLoaded", function () {
  

  // --- Detener el audio y ejecutar acciones del menú principal ---
  const menu = document.getElementById("menu-principal");
  const audioMenu = document.getElementById("sonido-menu");

  //Evento del menu
  menu.addEventListener("click", function (e) {
    //Si la accion, se busca en la lista de clases de html y es "clickeables"
    if (e.target.classList.contains("clickeables")) {
      audioMenu.pause();//Se pone el audio del menu en pausa
      audioMenu.currentTime = 0;
      cargarNivel(); //CargaNivel
      e.preventDefault();
      return;
    }
    if (
      e.target.tagName === "H2" ||
      e.target.tagName === "H3" ||
      e.target.tagName === "A"
    ) {
      audioMenu.pause();
      audioMenu.currentTime = 0;
    }
  });

  //Variable para la carga por matrix
  let matrixInterval = null;

  // --- Efecto Matrix en la pantalla hacker ---
  function iniciarMatrix() {
    const canvas = document.getElementById("matrixCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const letters = "01";
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function draw() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0F0";
      ctx.font = fontSize + "px monospace";
      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    if (matrixInterval !== null) {
      clearInterval(matrixInterval);
    }
    matrixInterval = setInterval(draw, 10);
  }

  // --- Acción de Nueva Partida ---
  function cargarNivel() {
    document.getElementById("pantallaCarga").style.display = "flex";
    document.getElementById("sonidoInicio").play();
    iniciarMatrix();
    
    // ✅ CORREGIDO: ruta relativa válida para navegador
    setTimeout(function () {
      window.location.href = "../templates/nivel1.html";
    }, 5000);
  }

   // Exponer la función al ámbito global para que el HTML pueda llamarla
  window.entrar = entrar;
  window.cargarNivel = cargarNivel;
});