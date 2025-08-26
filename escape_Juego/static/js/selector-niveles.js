// =================================================================================
// Archivo: selector-niveles.js (Versión con tu función iniciarMatrix)
// =================================================================================
// Este script adjunta los eventos de clic a los botones que ya existen en el DOM,
// y utiliza la función de animación de Matrix que proporcionaste.
// =================================================================================

// --- Elementos HTML del DOM ---
const levelsContainer = document.querySelector('.levels');
const pantallaCarga = document.getElementById("pantallaCarga");
const sonidoInicio = document.getElementById("sonidoInicio");
const hackerTexto = document.querySelector(".hacker-texto");

// --- Variables para la animación de Matrix ---
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
let intervalId = null; // Variable para guardar el ID del intervalo y poder detenerlo

// --- Funciones para la animación de Matrix ---
// Esta es la función iniciarMatrix que has proporcionado.
// Le he añadido la lógica para guardar el ID del intervalo.
function iniciarMatrix() {
    if (!canvas || !ctx) {
        console.error("Canvas o contexto no encontrados.");
        return;
    }

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

    // Guardamos el ID del intervalo para poder detenerlo más tarde si fuera necesario.
    return setInterval(draw, 10);
}

// Función para detener la animación de Matrix
function detenerMatrix() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

// --- Función para cargar un nivel ---
function cargarNivel(levelNumber) {
    if (pantallaCarga) pantallaCarga.style.display = "flex";
    if (hackerTexto) hackerTexto.textContent = `STAGE ${levelNumber}`;

    if (sonidoInicio) {
        sonidoInicio.play();
    }
    
    // Al iniciar la animación, guardamos el ID que nos devuelve
    intervalId = iniciarMatrix();

    // Redirección a la URL de Django para el nivel seleccionado
    const url = `/nivelSeleccionado/${levelNumber}/`;
    
    setTimeout(() => {
        // Redirigimos al usuario
        window.location.href = url;
    }, 5000); // 5 segundos de espera para la animación
}

// =================================================================================
// Lógica principal: Adjuntar eventos a los botones existentes
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Buscar todos los botones de nivel que están 'unlocked'
    const unlockedLevelsButtons = document.querySelectorAll('.level.unlocked');
    
    // Adjuntar el evento 'click' a cada uno de ellos
    unlockedLevelsButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            // Obtener el ID de la sala del atributo 'data-sala-id'
            const salaId = e.target.dataset.salaId;
            if (salaId) {
              cargarNivel(parseInt(salaId, 10));
            }
        });
    });
});
