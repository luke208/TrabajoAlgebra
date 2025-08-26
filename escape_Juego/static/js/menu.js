document.addEventListener("DOMContentLoaded", function () {
    // --- Detener el audio y ejecutar acciones del menú principal ---
    const menu = document.getElementById("menu-principal");
    const audioMenu = document.getElementById("sonido-menu");

    // Seleccionamos el botón de "Nueva Partida" por su ID
    const nuevaPartidaBtn = document.getElementById("nuevaPartidaBtn");

    // Variable para la carga por matrix
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
    function cargarNivel(salaId) {
        document.getElementById("pantallaCarga").style.display = "flex";
        document.getElementById("sonidoInicio").play();
        iniciarMatrix();

        // La URL se construye dinámicamente con el ID de la sala
        const url = `/nivelSeleccionado/${salaId}/`;

        setTimeout(function () {
            window.location.href = url;
        }, 5000);
    }

    // El evento ahora se adjunta directamente al botón de "Nueva Partida"
    if (nuevaPartidaBtn) {
        nuevaPartidaBtn.addEventListener("click", function (e) {
            e.preventDefault(); // Evitamos la acción por defecto del enlace

            const salaId = this.getAttribute('data-sala-id');
            if (salaId) {
                audioMenu.pause();
                audioMenu.currentTime = 0;
                cargarNivel(salaId); // Se pasa el ID a la función
            }
        });
    }

    // Evento para el resto del menú, solo para pausar el audio
    if (menu) {
      menu.addEventListener("click", function (e) {
        // Pausa el audio si se hace clic en cualquier elemento dentro del menú que no sea el botón de Nueva Partida
        if (e.target.tagName === "H2" || e.target.tagName === "H3" || e.target.tagName === "A") {
            // Se asegura de que no sea el botón de "Nueva Partida"
            if (!e.target.closest('#nuevaPartidaBtn')) {
                audioMenu.pause();
                audioMenu.currentTime = 0;
            }
        }
      });
    }

    window.iniciarMatrix = iniciarMatrix;
    window.cargarNivel = cargarNivel;
});

