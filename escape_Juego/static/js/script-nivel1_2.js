// =================================================================================
// Archivo: script-nivel1.js (con guardado de respuestas integrado)
// =================================================================================

// ---------------------- ELEMENTOS DEL DOM ----------------------
const fondo = document.querySelector('#game-image');
const contenedor = document.getElementById('game-container');
const botonVolver = document.getElementById('boton-volver');

// Modal genérico
const modal = document.getElementById('custom-modal');
const modalMsg = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

// Popup pista
const pistaOverlay = document.getElementById('pista-overlay');
const pistaImg = document.getElementById('pista-img');
const pistaCloseBtn = document.getElementById('pista-close-btn');

// ---------------------- ESTADO DEL JUEGO ----------------------
let computadorasEstado = {};      // { target: { resuelto: bool } }
let misionesCompletadas = {};
let habitacionActual = 'lobby_nivel1';
const historialHabitaciones = [];
const historialFuentes = [];
let transicionesEnProgreso = false;

// Misiones desde JSON
let misionesDataList = [];

// ---------------------- CRONÓMETRO Y GAME OVER ----------------------
let tiempoRestante = 3600*3; //Tiempo del temporizador
let intervaloCronometro;
const timerDisplay = document.getElementById("timer");  //Del temporizador
const gameOverScreen = document.getElementById("gameOverScreen"); //Ventana-Game Over

// ---------------------- TUTORIAL ----------------------
let pasoActual = 0;
const mensajes = [//Mensajes que ve el usuario, en el tutorial
    "¿Conexión establecida? Bien… Escuchen con atención, porque solo lo voy a decir una vez. Yo soy Ghost. Ustedes son la última línea entre nosotros… y el caos",
    "El grupo WampaSeca ha tomado el control total de la red de televisión nacional. Pero eso es solo la fachada. Están usando esa red para infiltrar un malware que, si no lo detenemos, tomará el control de todos los sistemas de emergencia del país: hospitales, aeropuertos, centrales eléctricas… todo.",
    "Si el contador llega a cero, ellos activarán un apagón masivo y, en cuestión de minutos, las ciudades quedarán a oscuras. El caos hará el resto. Para evitarlo debes colocar el código de desactivación del malware que obtendrás en las computadoras de la sala de control.",
    "No tenemos refuerzos. No hay botón de reinicio. Cada computadora que aseguren es una puerta que cerramos en su cara. Cada segundo que pierdan es un paso más hacia la catástrofe. Limpien el sistema, corten sus accesos y no dejen que ZeroSignal llegue al control maestro. Si fallan… esta noche el país entero caerá en la oscuridad",
    "debes volver a la sala de control y eliminar el malware que ZeroSignal ha instalado en las computadoras.",
    "ahora todo esta en sus manos. ¡Buena suerte!"
];
const pasoFlecha = 2;
const pasoFlechaVolver = 4;
let tutorialFinalizado = false; //Variable que indica si el tutorial finaliza

const tutorialContainer = document.getElementById("tutorial-container");
const tutorialText = document.getElementById("tutorial-text");
const nextBtn = document.getElementById("next-btn");

// ---------------------- BOTONES POR HABITACIÓN ----------------------
const botonesPorHabitacion = {
    'lobby_nivel1': [ //Principal del nivel
        { top: '12%', left: '33%', target: 'principal' },
        { top: '35%', left: '20%', target: '2' },
        { top: '20%', left: '80%', target: '3' },
        { top: '90%', left: '45%', target: 'compu3' }
    ],
    'compu3': [{ top: '87%', left: '45%', target: 'compu3', accion: 'comprobarcomputadora' }],
    '2': [ //Seccion de la mesa de las 4 computadoras
        { top: '35%', left: '59%', target: 'compu1' },
        { top: '34%', left: '45%', target: 'compu1_2' },
        { top: '34%', left: '36%', target: 'compu1_3' },
        { top: '33%', left: '30%', target: 'compu1_4' }
    ],
    'compu1':   [{ top: '87%', left: '45%', target: 'compu1', accion: 'comprobarcomputadora' }],
    'compu1_2': [{ top: '87%', left: '45%', target: 'compu1_2', accion: 'comprobarcomputadora' }],
    'compu1_3': [{ top: '87%', left: '45%', target: 'compu1_3', accion: 'comprobarcomputadora' }],
    'compu1_4': [{ top: '87%', left: '45%', target: 'compu1_4', accion: 'comprobarcomputadora' }],
    '3': [
    { top: '41%', left: '47%', target: 'compu2' }
    ],
    'compu2': [{ top: '87%', left: '45%', target: 'compu2', accion: 'comprobarcomputadora' }],
    //Pantalla principal
    'principal': [{ top: '87%', left: '45%', target: 'principal', accion: 'mostrarMision' }],
};

// ✅ FUNCIÓN PARA OBTENER PARTIDA_ID DE FORMA SEGURA
function obtenerPartidaId() {
    // Método 1: Variable global de window
    if (window.PARTIDA_ID && !isNaN(window.PARTIDA_ID)) {
        return window.PARTIDA_ID;
    }
    
    // Método 2: Desde el div game-data (tu método actual)
    const gameData = document.getElementById('game-data');
    if (gameData && gameData.dataset.partidaId) {
        const partidaId = parseInt(gameData.dataset.partidaId, 10);
        if (!isNaN(partidaId) && partidaId > 0) {
            // Cache para próximos usos
            window.PARTIDA_ID = partidaId;
            return partidaId;
        }
    }
    
    // Método 3: Desde un input hidden como fallback
    const partidaInput = document.querySelector('input[name="partida_id"]');
    if (partidaInput && partidaInput.value) {
        const partidaId = parseInt(partidaInput.value, 10);
        if (!isNaN(partidaId) && partidaId > 0) {
            window.PARTIDA_ID = partidaId;
            return partidaId;
        }
    }
    
    // Método 4: Desde data attribute en el body
    const bodyPartidaId = document.body.getAttribute('data-partida-id');
    if (bodyPartidaId && !isNaN(bodyPartidaId)) {
        return parseInt(bodyPartidaId, 10);
    }
    
    // Método 5: Desde la URL (como último recurso)
    const urlParams = new URLSearchParams(window.location.search);
    const partidaFromUrl = urlParams.get('partida_id');
    if (partidaFromUrl && !isNaN(partidaFromUrl)) {
        return parseInt(partidaFromUrl, 10);
    }
    
    console.error('No se pudo obtener PARTIDA_ID de ninguna fuente');
    return null;
}

// ✅ FUNCIÓN DE INICIALIZACIÓN SEGURA
function inicializarPartidaId() {
    return new Promise((resolve) => {
        function tryGetPartidaId() {
            const partidaId = obtenerPartidaId();
            if (partidaId) {
                console.log('✅ PARTIDA_ID inicializado:', partidaId);
                resolve(partidaId);
            } else {
                // Reintentar después de un pequeño delay
                setTimeout(tryGetPartidaId, 50);
            }
        }
        tryGetPartidaId();
    });
}

// ---------------------- FUNCIONES DE BACKEND ----------------------
/**
 * Obtiene el token CSRF de Django
 */
function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
           document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
           '';
}

/**
 * Guarda la respuesta de una celda en el backend
 */
// ✅ FUNCIÓN MEJORADA: Guardar respuesta del candado con inicialización segura
async function guardarRespuestaCandado(misionId, respuesta) {
    console.log('=== GUARDANDO RESPUESTA CANDADO ===');
    console.log('Misión ID:', misionId);
    
    try {
        // Asegurar que PARTIDA_ID esté disponible
        const partidaId = await inicializarPartidaId();
        
        if (!partidaId) {
            throw new Error('No se pudo obtener PARTIDA_ID después de múltiples intentos');
        }
        
        console.log('Partida ID:', partidaId);
        console.log('Respuesta:', respuesta);
        
        const url = `/guardar_respuesta_candado/${partidaId}/${misionId}/`;
        console.log('URL:', url);
        
        const csrfToken = getCsrfToken();
        console.log('CSRF Token:', csrfToken ? 'Presente' : 'No encontrado');
        
        const requestBody = {
            respuesta: respuesta
        };
        console.log('Request body:', requestBody);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error text:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        // Verificar que la respuesta tiene el formato esperado
        if (typeof data.es_correcta !== 'boolean') {
            console.error('Formato de respuesta inesperado:', data);
            throw new Error('Formato de respuesta del servidor incorrecto');
        }
        
        return data.es_correcta;
        
    } catch (error) {
        console.error('Error completo guardando respuesta de candado:', error);
        throw error;
    }
}

// ✅ TAMBIÉN ACTUALIZAR LAS OTRAS FUNCIONES
async function guardarRespuestaCelda(celdaId, respuesta) {
    try {
        const partidaId = await inicializarPartidaId();
        if (!partidaId) {
            throw new Error('PARTIDA_ID no disponible para guardar celda');
        }
        
        const response = await fetch(`/guardar_respuesta_celda/${partidaId}/${celdaId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                respuesta: respuesta
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data.es_correcta;
    } catch (error) {
        console.error('Error guardando respuesta de celda:', error);
        return false;
    }
}

async function guardarRespuestaFinal(misionId, respuesta) {
    try {
        const partidaId = await inicializarPartidaId();
        if (!partidaId) {
            throw new Error('PARTIDA_ID no disponible para respuesta final');
        }
        
        const response = await fetch(`/guardar_respuesta_final/${partidaId}/${misionId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                respuesta: respuesta
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data.es_correcta;
    } catch (error) {
        console.error('Error guardando respuesta final:', error);
        return false;
    }
}

// ✅ MODIFICAR LA INICIALIZACIÓN PRINCIPAL
/*document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando juego...');
    
    // Asegurar que PARTIDA_ID esté disponible antes de continuar
    try {
        await inicializarPartidaId();
        console.log('✅ PARTIDA_ID listo, continuando inicialización...');
        
        inicializarMision();
        if (tutorialText && mensajes.length > 0) tutorialText.textContent = mensajes[0];
        if (tutorialContainer) tutorialContainer.style.display = 'flex';
        actualizarTimer();
        
    } catch (error) {
        console.error('❌ Error inicializando PARTIDA_ID:', error);
        showCustomModal('Error: No se pudo inicializar la partida. Recarga la página.');
    }
});*/

// ✅ DEBUGGING: Función para verificar el estado al cargar la página
function debugPartidaId() {
    console.log('=== DEBUG PARTIDA_ID ===');
    console.log('window.PARTIDA_ID:', window.PARTIDA_ID, 'Tipo:', typeof window.PARTIDA_ID);
    console.log('obtenerPartidaId():', obtenerPartidaId());
    console.log('URL actual:', window.location.href);
    console.log('Inputs con partida:', document.querySelectorAll('input[name*="partida"]'));
    console.log('Meta partida:', document.querySelector('meta[name="partida-id"]'));
    console.log('Body data-partida-id:', document.body.getAttribute('data-partida-id'));
}

//Comprobar el estado de la computadora
function comprobarcomputadora(idCompu) {
  const targetsTrampa = ['compu1_2', 'compu1_3', 'compu3'];
  const nombreNormalizado = idCompu.toLowerCase();

  if (targetsTrampa.includes(nombreNormalizado)) {
    comportamientoComputadoraMala(nombreNormalizado);
  } else {
    mostrarMision(nombreNormalizado);
  }
}

//Computadora mala
function comportamientoComputadoraMala(idCompu){
    eliminarBotones()
    const pantalla = document.createElement('div');
    pantalla.classList.add('pantalla-interactiva');
    pantalla.innerHTML = `
        <h2>Acceso Denegado</h2>
        <p>Esta compu ya ha sido controlada por los hackers</p>
        <button id="cerrar-pantalla">Cerrar</button>
    `;

    pantalla.querySelector('#cerrar-pantalla').addEventListener('click', () => {
        pantalla.remove();
        computadorasEstado[idCompu] = { resuelto: true };
        cambiarImagenCompuResuelta(idCompu)
    });

    contenedor.appendChild(pantalla);
}

// ---------------------- UTILIDADES ----------------------
function showCustomModal(message) {
    if (modal && modalMsg && modalCloseBtn) {
        modalMsg.textContent = message;
        modal.style.display = 'flex';
        modalCloseBtn.onclick = () => modal.style.display = 'none';
    } else {
        alert(message);
    }
}

function eliminarBotones() {
    document.querySelectorAll('.boton-puerta, .pantalla-interactiva').forEach(el => el.remove());
}

function ocultarBotonesConAnimacion() {
    const botones = document.querySelectorAll('.boton-puerta');
    botones.forEach(boton => {
        boton.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        boton.style.opacity = '0';
        boton.style.transform = 'scale(0.8)';
        boton.style.pointerEvents = 'none';
    });

    if (botonVolver && botonVolver.style.display !== 'none') {
        botonVolver.style.transition = 'opacity 0.3s ease-out';
        botonVolver.style.opacity = '0';
        botonVolver.style.pointerEvents = 'none';
    }
}

function mostrarBotonesConAnimacion() {
    setTimeout(() => {
        const botones = document.querySelectorAll('.boton-puerta');
        botones.forEach((boton, index) => {
            setTimeout(() => {
                boton.style.transition = 'opacity 0.4s ease-in, transform 0.4s ease-in';
                boton.style.opacity = '1';
                boton.style.transform = 'scale(1)';
                boton.style.pointerEvents = 'auto';
            }, index * 50);
        });

        if (botonVolver && historialHabitaciones.length > 0 && tutorialFinalizado) {
            setTimeout(() => {
                botonVolver.style.transition = 'opacity 0.4s ease-in';
                botonVolver.style.opacity = '1';
                botonVolver.style.pointerEvents = 'auto';
                botonVolver.style.display = 'block';
            }, 200);
        }
    }, 100);
}

// ---------------------- CRONÓMETRO ----------------------
function actualizarTimer() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    timerDisplay.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

    if (tiempoRestante <= 0) {
        clearInterval(intervaloCronometro);
        mostrarGameOver();
    }
    tiempoRestante--;
}
function mostrarGameOver(){ gameOverScreen.style.display = 'flex'; }
function reiniciarNivel(){ window.location.reload(); }
window.reiniciarNivel = reiniciarNivel;

// ---------------------- TUTORIAL ----------------------
function deshabilitarBotonSiguiente(){ if(nextBtn){ nextBtn.disabled=true; nextBtn.style.opacity='0.5'; nextBtn.style.cursor='not-allowed'; } }
function habilitarBotonSiguiente(){ if(nextBtn){ nextBtn.disabled=false; nextBtn.style.opacity='1'; nextBtn.style.cursor='pointer'; } }
function mostrarFlechaVolver(){ if(botonVolver) botonVolver.style.display='block'; }
function ocultarFlechaVolver(){ if(botonVolver) botonVolver.style.display='none'; }

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        pasoActual++;
        if (pasoActual < mensajes.length) {
            if (tutorialText) tutorialText.textContent = mensajes[pasoActual];

            if (pasoActual === pasoFlecha) {
                const principalButtonConfig = botonesPorHabitacion['lobby_nivel1'].find(btn => btn.target === 'principal');
                if (principalButtonConfig) {
                    crearBoton(principalButtonConfig, 'boton-principal-lobby');
                    setTimeout(() => {
                        const botonPrincipal = document.querySelector('#boton-principal-lobby');
                        if (botonPrincipal) {
                            resaltarBoton(botonPrincipal);
                            deshabilitarBotonSiguiente();
                        }
                    }, 200);
                }
            }

            if (pasoActual === pasoFlechaVolver) {
                mostrarFlechaVolver();
                resaltarBoton('#boton-volver');
                deshabilitarBotonSiguiente();
            }
        } else {
            if (tutorialContainer) tutorialContainer.style.display = 'none';
            tutorialFinalizado = true;
            crearBotones('lobby_nivel1');
            ocultarFlechaVolver();
            intervaloCronometro = setInterval(actualizarTimer, 1000);
        }
    });
}

// Spotlight
function resaltarBoton(selectorOrElement) {
    quitarResaltado();
    const boton = typeof selectorOrElement === 'string'
        ? document.querySelector(selectorOrElement)
        : selectorOrElement;
    if (!boton) return;
    const overlay = document.createElement('div');
    overlay.classList.add('overlay-tutorial');
    document.body.appendChild(overlay);
    boton.classList.add('highlight-tutorial');
    const rect = boton.getBoundingClientRect();
    const flecha = document.createElement('div');
    flecha.classList.add('flecha-tutorial');
    flecha.textContent = '👁‍🗨';
    flecha.style.top = `${rect.top + rect.height / 2 - 30}px`;
    flecha.style.left = `${rect.right + 10}px`;
    document.body.appendChild(flecha);
}
function quitarResaltado() {
    document.querySelectorAll('.overlay-tutorial, .flecha-tutorial').forEach(el => el.remove());
    document.querySelectorAll('.highlight-tutorial').forEach(el => el.classList.remove('highlight-tutorial'));
}

// ---------------------- HABITACIONES ----------------------
function crearBoton(btnConfig, id = null) {
    const boton = document.createElement('div');
    boton.classList.add('boton-puerta');
    if (id) boton.id = id;
    boton.style.top = btnConfig.top;
    boton.style.left = btnConfig.left;

    const idCompu = btnConfig.target;
    const accion = btnConfig.accion || null;

    if (accion === 'mostrarMision') {
        if (computadorasEstado[idCompu] && computadorasEstado[idCompu].resuelto) {
            boton.classList.add('resuelto');
            boton.style.cursor = 'not-allowed';
        } else {
            boton.addEventListener('click', () => mostrarMision(idCompu));
        }
    }
    else if (accion === 'comprobarcomputadora') {
        if (computadorasEstado[idCompu]?.resuelto) {
            boton.classList.add('resuelto');
            boton.style.cursor = 'not-allowed';
        } else {
            boton.addEventListener('click', (e) => {
                e.stopPropagation();
                comprobarcomputadora(idCompu);
            });
        }
    }
    else {
        boton.dataset.target = idCompu;
        boton.addEventListener('click', () => {
            if (id === 'boton-principal-lobby') {
                quitarResaltado();
                habilitarBotonSiguiente();
            }
            cambiarHabitacion(idCompu, boton);
        });
    }

    contenedor.appendChild(boton);
}

function crearBotones(habitacion) {
    eliminarBotones();
    if (!tutorialFinalizado && habitacion !== 'lobby_nivel1') return;

    if (computadorasEstado[habitacion]?.resuelto) {
        return;
    }
    
    const botones = botonesPorHabitacion[habitacion];
    if (!botones) return;

    botones.forEach(btnConfig => {
        const idCompu = btnConfig.target;
        
        if (btnConfig.accion === 'comprobarcomputadora' && computadorasEstado[idCompu]?.resuelto) {
            return;
        }
        
        crearBoton(btnConfig);
    });
    if (historialHabitaciones.length > 0) mostrarFlechaVolver();
}

function cambiarHabitacion(habitacion, boton) {
    if (transicionesEnProgreso) return;
    transicionesEnProgreso = true;

    ocultarBotonesConAnimacion();

    const rect = boton.getBoundingClientRect();
    const offsetX = rect.left + rect.width / 2;
    const offsetY = rect.top + rect.height / 2;
    fondo.style.transformOrigin = `${offsetX}px ${offsetY}px`;
    fondo.style.transform = 'scale(1.5)';
    fondo.style.filter = 'blur(3px)';

    historialFuentes.push(fondo.src);
    historialHabitaciones.push(habitacionActual);
    habitacionActual = habitacion;

    setTimeout(() => {
        eliminarBotones();

        const estadoCompu = computadorasEstado[habitacion];
        if (estadoCompu && estadoCompu.resuelto) {
            fondo.src = `${window.STATIC_URL_BASE}imagenes/${habitacion}_resuelto.jpeg`;
        } else {
            fondo.src = `${window.STATIC_URL_BASE}imagenes/${habitacion}.jpeg`;
        }
        
        fondo.style.transform = 'scale(1)';
        fondo.style.filter = 'none';

        if (tutorialFinalizado) {
            setTimeout(() => {
                crearBotones(habitacion);
                mostrarBotonesConAnimacion();
                
                if (historialHabitaciones.length > 0) {
                    mostrarFlechaVolver();
                }
                
                transicionesEnProgreso = false;
            }, 200);
        } else {
            transicionesEnProgreso = false;
        }
    }, 700);
}

// ---------------------- LÓGICA DE MISIÓN ----------------------
function inicializarMision() {
    const scriptEl = document.getElementById('mision-data');
    if (!scriptEl) {
        console.error('No se encontró el script #mision-data con JSON.');
        return;
    }
    try {
        const parsed = JSON.parse(scriptEl.textContent);
        misionesDataList = Array.isArray(parsed) ? parsed : [parsed];

        const targets = new Set(misionesDataList.map(m => m.target));
        targets.forEach(t => {
            computadorasEstado[t] = { resuelto: false };
        });

        misionesDataList.forEach(m => {
            misionesCompletadas[m.id_mision] = {
                tabla: !m.filas_tabla || m.filas_tabla.length === 0,
                candado: !m.candado_intermedio_pregunta,
                completa: false
            };
        });

    } catch (e) {
        console.error('Error parseando misiones JSON:', e);
    }
}

function mostrarInstruccionesModal(instrucciones) {
    const instruccionModal = document.createElement('div');
    instruccionModal.classList.add('pantalla-interactiva', 'instrucciones-modal');
    instruccionModal.innerHTML = `
        <h3>Instrucciones</h3>
        <p>${instrucciones}</p>
        <button id="cerrar-instrucciones-btn">Cerrar</button>
    `;

    instruccionModal.querySelector('#cerrar-instrucciones-btn').addEventListener('click', () => {
        instruccionModal.remove();
    });

    contenedor.appendChild(instruccionModal);
}

function mostrarPantallaTransicion(titulo, mensaje, callback) {
    eliminarBotones();
    const pantalla = document.createElement('div');
    pantalla.classList.add('pantalla-interactiva', 'transicion-modal');
    pantalla.innerHTML = `
        <h2>${titulo}</h2>
        <p>${mensaje}</p>
        <button id="continuar-btn">Continuar</button>
    `;
    pantalla.querySelector('#continuar-btn').addEventListener('click', () => {
        pantalla.remove();
        callback();
    });
    contenedor.appendChild(pantalla);
}

function normalizarValor(valor) {
    if (valor === null || typeof valor === 'undefined') {
        return "";
    }
    return valor
        .toString()
        .trim()
        .replace(/\s+/g, "")
        .replace(/,/g, ".")
        .toLowerCase();
}

function compararRespuestas(respuestaUsuario, respuestaCorrecta) {
    const respUsuarioNorm = normalizarValor(respuestaUsuario);
    const respCorrectaNorm = normalizarValor(respuestaCorrecta);
    
    if (respUsuarioNorm === respCorrectaNorm) {
        return true;
    }
    
    const numUsuario = parseFloat(respUsuarioNorm);
    const numCorrecta = parseFloat(respCorrectaNorm);
    
    if (!isNaN(numUsuario) && !isNaN(numCorrecta)) {
        return Math.abs(numUsuario - numCorrecta) < 0.001;
    }
    
    return false;
}

// ✅ FUNCIÓN CON GUARDADO: Verificar tabla con backend
async function verificarTablaConBackend(mision, pantalla, headers) {
    let todasCorrectas = true;
    const verificarBtn = pantalla.querySelector('#verificar-mision-btn');
    verificarBtn.disabled = true;
    verificarBtn.textContent = 'Verificando...';
    
    for (const fila of mision.filas_tabla) {
        for (const header of headers) {
            const celda = fila.celdas[header];
            if (celda?.es_campo_rellenable && celda.id) {
                const input = pantalla.querySelector(`[data-row="${fila.order}"][data-col="${header}"]`);
                if (input) {
                    const respuestaUsuario = input.value;
                    const esCorrectaBackend = await guardarRespuestaCelda(celda.id, respuestaUsuario);
                    
                    if (!esCorrectaBackend) {
                        todasCorrectas = false;
                        input.style.backgroundColor = '#ffebee';
                    } else {
                        input.style.backgroundColor = '#e8f5e8';
                    }
                }
            }
        }
    }
    
    verificarBtn.disabled = false;
    verificarBtn.textContent = 'Verificar';
    return todasCorrectas;
}

// ✅ FUNCIÓN CORREGIDA: Mostrar candado intermedio con mejor debugging
function mostrarCandadoIntermedio(mision, idCompu) {
    eliminarBotones();
    const pantalla = document.createElement('div');
    pantalla.classList.add('pantalla-interactiva');

    const tieneInstrucciones = mision.instrucciones?.trim().length > 0;
    const botonInstruccionesHTML = tieneInstrucciones ?
        `<button id="mostrar-instrucciones-btn">Ver Instrucciones</button>` : '';

    const enunciadoHTML = mision.enunciado_mision ? 
        `<p class="enunciado-mision">${mision.enunciado_mision}</p>` : '';

    pantalla.innerHTML = `
        <h2>Candado de Seguridad</h2>
        ${enunciadoHTML}
        <p>${mision.candado_intermedio_pregunta}</p>
        <input type="text" id="candado-input" placeholder="Ingresa tu respuesta" />
        ${botonInstruccionesHTML}
        <button id="verificar-candado-btn">Verificar</button>
        <div id="feedback-candado"></div>
        <button id="cerrar-candado">Cerrar</button>
    `;

    const input = pantalla.querySelector('#candado-input');

    if (tieneInstrucciones) {
        pantalla.querySelector('#mostrar-instrucciones-btn').addEventListener('click', () => {
            mostrarInstruccionesModal(mision.instrucciones);
        });
    }
    
    pantalla.querySelector('#verificar-candado-btn').addEventListener('click', async () => {
        const feedbackDiv = pantalla.querySelector('#feedback-candado');
        const verificarBtn = pantalla.querySelector('#verificar-candado-btn');
        const respuestaUsuario = input.value.trim();
        
        // Validación básica
        if (!respuestaUsuario) {
            feedbackDiv.textContent = 'Por favor ingresa una respuesta.';
            feedbackDiv.style.color = 'orange';
            return;
        }
        
        verificarBtn.disabled = true;
        verificarBtn.textContent = 'Verificando...';
        
        // Debug: Mostrar información en consola
        console.log('=== DEBUG CANDADO ===');
        console.log('Misión ID:', mision.id_mision);
        console.log('Partida ID:', window.PARTIDA_ID);
        console.log('Respuesta usuario:', respuestaUsuario);
        console.log('Candado pregunta:', mision.candado_intermedio_pregunta);
        console.log('Respuesta correcta (si está disponible):', mision.candado_respuesta_correcta);
        
        try {
            // Verificar que tenemos los datos necesarios
            if (!window.PARTIDA_ID) {
                throw new Error('PARTIDA_ID no está definido');
            }
            
            if (!mision.id_mision) {
                throw new Error('id_mision no está definido en la misión');
            }
            
            const esCorrectaBackend = await guardarRespuestaCandado(mision.id_mision, respuestaUsuario);
            
            console.log('Respuesta del backend:', esCorrectaBackend);
            
            if (esCorrectaBackend === true) {
                feedbackDiv.textContent = '¡Candado desbloqueado! ✅';
                feedbackDiv.style.color = 'lime';
                
                misionesCompletadas[mision.id_mision].candado = true;
                misionesCompletadas[mision.id_mision].completa = (
                    misionesCompletadas[mision.id_mision].tabla && 
                    misionesCompletadas[mision.id_mision].candado
                );
                
                console.log('Estado misión actualizado:', misionesCompletadas[mision.id_mision]);
                
                setTimeout(() => {
                    pantalla.remove();
                    verificarProgresoMisiones(idCompu);
                }, 1200);

            } else {
                feedbackDiv.textContent = 'Respuesta incorrecta. Inténtalo de nuevo. ❌';
                feedbackDiv.style.color = 'red';
                input.style.backgroundColor = '#ffebee';
                
                // Limpiar el campo después de un error
                setTimeout(() => {
                    input.style.backgroundColor = '';
                    input.focus();
                }, 2000);
                
                verificarBtn.disabled = false;
                verificarBtn.textContent = 'Verificar';
            }
        } catch (error) {
            console.error('Error completo verificando candado:', error);
            feedbackDiv.textContent = `Error: ${error.message}`;
            feedbackDiv.style.color = 'orange';
            
            verificarBtn.disabled = false;
            verificarBtn.textContent = 'Verificar';
        }
    });

    // Permitir envío con Enter
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            pantalla.querySelector('#verificar-candado-btn').click();
        }
    });

    pantalla.querySelector('#cerrar-candado').addEventListener('click', () => {
        pantalla.remove();
        crearBotones(habitacionActual);
    });

    contenedor.appendChild(pantalla);
    
    // Focus automático en el input
    setTimeout(() => input.focus(), 100);
}

// ✅ FUNCIÓN MEJORADA: Guardar respuesta del candado con mejor debugging
async function guardarRespuestaCandado(misionId, respuesta) {
    console.log('=== GUARDANDO RESPUESTA CANDADO ===');
    console.log('Misión ID:', misionId);
    console.log('Partida ID:', window.PARTIDA_ID);
    console.log('Respuesta:', respuesta);
    
    try {
        const url = `/guardar_respuesta_candado/${window.PARTIDA_ID}/${misionId}/`;
        console.log('URL:', url);
        
        const csrfToken = getCsrfToken();
        console.log('CSRF Token:', csrfToken ? 'Presente' : 'No encontrado');
        
        const requestBody = {
            respuesta: respuesta
        };
        console.log('Request body:', requestBody);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error text:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        // Verificar que la respuesta tiene el formato esperado
        if (typeof data.es_correcta !== 'boolean') {
            console.error('Formato de respuesta inesperado:', data);
            throw new Error('Formato de respuesta del servidor incorrecto');
        }
        
        return data.es_correcta;
        
    } catch (error) {
        console.error('Error completo guardando respuesta de candado:', error);
        throw error; // Re-lanzar para que el componente que llama pueda manejarlo
    }
}

function verificarProgresoMisiones(idCompu) {
    const misionesTarget = misionesDataList.filter(m => m.target === idCompu);
    const misionesPendientes = misionesTarget.filter(m => !misionesCompletadas[m.id_mision].completa);

    if (misionesPendientes.length > 0) {
        mostrarPantallaTransicion(
            "Misión en Progreso",
            "¡Excelente! Todavía hay tareas pendientes en este sistema.",
            () => mostrarMision(idCompu)
        );
    } else {
        computadorasEstado[idCompu].resuelto = true;
        mostrarPantallaTransicion(
            "Computadora Hackeada",
            "¡Misiones completadas! La computadora está asegurada.",
            () => {
                crearBotones(habitacionActual);
                cambiarImagenCompuResuelta(idCompu)
                eliminarBotones()
            }
        );
    }
}

function cambiarImagenCompuResuelta(idCompu) {
    if (habitacionActual === idCompu) {
        fondo.src = `${window.STATIC_URL_BASE}imagenes/${idCompu}_resuelto.jpeg`;
    }
}

// ✅ FUNCIÓN CON GUARDADO: Función principal para mostrar misiones
function mostrarMision(idCompu) {
    if (computadorasEstado[idCompu]?.resuelto) {
        return;
    }

    const misionesTarget = misionesDataList
        .filter(m => m.target === idCompu)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const mision = misionesTarget.find(m => !misionesCompletadas[m.id_mision].completa);

    if (!mision) {
        computadorasEstado[idCompu].resuelto = true;
        verificarProgresoMisiones(idCompu);
        return;
    }
    
    // Lógica para la computadora principal
    if (idCompu === 'principal') {
        const estado = computadorasEstado[idCompu];
        eliminarBotones();

        const pantalla = document.createElement('div');
        pantalla.classList.add('pantalla-interactiva');

        if (!verificarTodasResueltas()) {
            pantalla.innerHTML = `
                <h2>Acceso Denegado</h2>
                <p>Debes completar todas las computadoras secundarias.</p>
                <button id="cerrar-pantalla">Cerrar</button>
            `;    
        } else {
            pantalla.innerHTML = `
                <h2>${mision?.titulo || 'Misión Final'}</h2>
                <p>${mision?.pregunta_final || 'Ingresa el código final'}</p>
                <input type="text" id="respuesta-final-input" placeholder="Código" />
                <button id="verificar-respuesta-final-btn">Verificar</button>
                <div id="feedback-mision"></div>
                <button id="cerrar-pantalla">Cerrar</button>
            `;
            
            // ✅ MODIFICADO: Verificar respuesta final con guardado en backend
            pantalla.querySelector('#verificar-respuesta-final-btn').addEventListener('click', async () => {
                const input = pantalla.querySelector('#respuesta-final-input');
                const feedbackDiv = pantalla.querySelector('#feedback-mision');
                const verificarBtn = pantalla.querySelector('#verificar-respuesta-final-btn');

                verificarBtn.disabled = true;
                verificarBtn.textContent = 'Verificando...';

                try {
                    const esCorrectaBackend = await guardarRespuestaFinal(mision.id_mision, input.value);

                    if (esCorrectaBackend) {
                        feedbackDiv.textContent = '¡Código correcto! ✅';
                        feedbackDiv.style.color = 'lime';
                        estado.resuelto = true;
                        setTimeout(() => mostrarNivelCompletado(), 1200);
                    } else {
                        feedbackDiv.textContent = 'Código incorrecto ❌';
                        feedbackDiv.style.color = 'red';
                        input.style.backgroundColor = '#ffebee';
                        
                        verificarBtn.disabled = false;
                        verificarBtn.textContent = 'Verificar';
                    }
                } catch (error) {
                    console.error('Error verificando respuesta final:', error);
                    feedbackDiv.textContent = 'Error de conexión. Inténtalo de nuevo. ⚠️';
                    feedbackDiv.style.color = 'orange';
                    
                    verificarBtn.disabled = false;
                    verificarBtn.textContent = 'Verificar';
                }
            });
        }

        pantalla.querySelector('#cerrar-pantalla').addEventListener('click', () => {
            pantalla.remove();
            crearBotones(habitacionActual);
        });

        contenedor.appendChild(pantalla);
        return;
    }
    
    // Caso: Misión con tabla que no ha sido completada aún
    if (mision.filas_tabla && mision.filas_tabla.length > 0 && !misionesCompletadas[mision.id_mision].tabla) {
        eliminarBotones();
        const pantalla = document.createElement('div');
        pantalla.classList.add('pantalla-interactiva');

        const headers = (mision.encabezados?.length)
            ? mision.encabezados
            : Object.keys(mision.filas_tabla[0].celdas);

        let tableHTML = '<table class="tabla-mision"><thead><tr>';
        headers.forEach(h => {
            const pretty = h === 'theta_k' ? 'θk'
                : h === 'zk_real' ? 'zk (real)'
                : h === 'zk_imaginario' ? 'zk (imag)' : h;
            tableHTML += `<th>${pretty}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        mision.filas_tabla.forEach(fila => {
            tableHTML += `<tr>`;
            headers.forEach(header => {
                const celda = fila.celdas[header];
                if (celda?.es_campo_rellenable) {
                    tableHTML += `<td><input type="text" data-row="${fila.order}" data-col="${header}" data-celda-id="${celda.id || ''}" /></td>`;
                } else {
                    tableHTML += `<td>${celda?.respuesta_correcta || ''}</td>`;
                }
            });
            tableHTML += `</tr>`;
        });
        tableHTML += '</tbody></table>';

        const tieneInstrucciones = mision.instrucciones?.trim().length > 0;
        const botonInstruccionesHTML = tieneInstrucciones ? 
            `<button id="mostrar-instrucciones-btn">Ver Instrucciones</button>` : '';

        pantalla.innerHTML = `
            <h2>${mision.titulo || 'Misión'}</h2>
            <p>${mision.enunciado_mision || ''}</p>
            ${tableHTML}
            ${botonInstruccionesHTML}
            <button id="verificar-mision-btn">Verificar</button>
            <button id="cerrar-pantalla">Cerrar</button>
            <div id="feedback-mision"></div>
        `;
        
        if (tieneInstrucciones) {
            pantalla.querySelector('#mostrar-instrucciones-btn').addEventListener('click', () => {
                mostrarInstruccionesModal(mision.instrucciones);
            });
        }

        // ✅ MODIFICADO: Verificar tabla con backend
        pantalla.querySelector('#verificar-mision-btn').addEventListener('click', async () => {
            const feedbackDiv = pantalla.querySelector('#feedback-mision');
            
            try {
                const esCorrecto = await verificarTablaConBackend(mision, pantalla, headers);
                
                if (esCorrecto) {
                    feedbackDiv.textContent = '¡Tabla completada! ✅';
                    feedbackDiv.style.color = 'lime';
                    misionesCompletadas[mision.id_mision].tabla = true;

                    setTimeout(() => {
                        pantalla.remove();
                        if (mision.candado_intermedio_pregunta) {
                            mostrarPantallaTransicion("Tabla completada", "Ahora, ¡desbloquea el candado!", () => mostrarCandadoIntermedio(mision, idCompu));
                        } else {
                            misionesCompletadas[mision.id_mision].completa = true;
                            verificarProgresoMisiones(idCompu);
                        }
                    }, 1200);

                } else {
                    feedbackDiv.textContent = 'Hay errores en la tabla ❌';
                    feedbackDiv.style.color = 'red';
                }
            } catch (error) {
                console.error('Error verificando tabla:', error);
                feedbackDiv.textContent = 'Error de conexión. Inténtalo de nuevo. ⚠️';
                feedbackDiv.style.color = 'orange';
            }
        });

        pantalla.querySelector('#cerrar-pantalla').addEventListener('click', () => {
            pantalla.remove();
            crearBotones(habitacionActual);
        });

        contenedor.appendChild(pantalla);
    }
    // Caso: Misión SIN tabla o Misión con tabla YA completada
    else if (mision.candado_intermedio_pregunta && !misionesCompletadas[mision.id_mision].candado) {
        mostrarCandadoIntermedio(mision, idCompu);
    }
    else {
        misionesCompletadas[mision.id_mision].completa = true;
        verificarProgresoMisiones(idCompu);
    }
}

function verificarTodasResueltas() {
    const keys = Object.keys(computadorasEstado).filter(k => k !== 'principal');
    return keys.every(k => computadorasEstado[k]?.resuelto);
}

function mostrarNivelCompletado() {
    clearInterval(intervaloCronometro);
    eliminarBotones();

    const nivelCompletadoScreen = document.createElement('div');
    nivelCompletadoScreen.classList.add('cinematica-final');
    nivelCompletadoScreen.innerHTML = `
        <div class="cinematica-content">
            <h1>¡NIVEL COMPLETADO!</h1>
            <p>El código de desactivación ha sido introducido. El apagón masivo de ZeroSignal ha sido detenido.</p>
            <p>Pero esto no ha terminado... ¡Prepárate para el siguiente desafío!</p>
            <button id="siguiente-nivel-btn">Siguiente Nivel</button>
        </div>
    `;  
    contenedor.appendChild(nivelCompletadoScreen);
    nivelCompletadoScreen.querySelector('#siguiente-nivel-btn').addEventListener('click', () => {
        window.location.href = `/nivelSeleccionado/2/`;
    });
}

// ---------------------- BOTÓN VOLVER ----------------------
if (botonVolver) {
    botonVolver.addEventListener('click', () => {
        if (historialHabitaciones.length === 0) return;
        if (transicionesEnProgreso) return;
        
        transicionesEnProgreso = true;
        
        if (pasoActual === pasoFlechaVolver) { 
            quitarResaltado(); 
            habilitarBotonSiguiente(); 
        }
        
        ocultarBotonesConAnimacion();
        
        const rect = botonVolver.getBoundingClientRect();
        const offsetX = rect.left + rect.width / 2;
        const offsetY = rect.top + rect.height / 2;
        fondo.style.transformOrigin = `${offsetX}px ${offsetY}px`;
        fondo.style.transform = 'scale(1.5)';
        fondo.style.filter = 'blur(3px)';
        
        const anterior = historialFuentes.pop();
        const habAnterior = historialHabitaciones.pop();
        
        setTimeout(() => {
            eliminarBotones();
            
            fondo.src = anterior;
            habitacionActual = habAnterior;
            fondo.style.transform = 'scale(1)';
            fondo.style.filter = 'none';
            
            if (tutorialFinalizado) {
                setTimeout(() => {
                    crearBotones(habitacionActual);
                    mostrarBotonesConAnimacion();
                    
                    if (historialHabitaciones.length === 0) {
                        ocultarFlechaVolver();
                    }
                    
                    transicionesEnProgreso = false;
                }, 200);
            } else {
                transicionesEnProgreso = false;
            }
        }, 700);
    });
}

// ---------------------- INICIALIZACIÓN ----------------------
document.addEventListener('DOMContentLoaded', () => {
    inicializarMision();
    if (tutorialText && mensajes.length > 0) tutorialText.textContent = mensajes[0];
    if (tutorialContainer) tutorialContainer.style.display = 'flex';
    actualizarTimer();
});