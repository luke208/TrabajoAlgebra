document.addEventListener("DOMContentLoaded", function () {
    // --- VARIABLES GLOBALES ---
    const pantallaAcceso = document.getElementById("pantallaAcceso");
    const btnAcceso = document.getElementById("btnAcceso");
    const menu = document.getElementById("menu-principal");
    const usuarioInfo = document.getElementById("usuarioInfo");
    const videoFondo = document.getElementById("videoFondo");
    const audioMenu = document.getElementById("sonido-menu");
    const sonidoAcceso = document.getElementById("sonidoAcceso");
    const nuevaPartidaBtn = document.getElementById("nuevaPartidaBtn");
    const pantallaCarga = document.getElementById("pantallaCarga");
    const sonidoInicio = document.getElementById("sonidoInicio");
    
    let matrixInterval = null;
    let audioContext;
    let sistemaAccedido = false;

    // --- FUNCIONES DE UTILIDAD ---
    function limpiarMatrix() {
        if (matrixInterval !== null) {
            clearInterval(matrixInterval);
            matrixInterval = null;
            console.log('🧹 Matrix limpiado');
        }
    }

    function ocultarPantallaCarga() {
        if (pantallaCarga) {
            pantallaCarga.style.display = "none";
            console.log('🚫 Pantalla de carga ocultada');
        }
    }

    function mostrarMenu() {
        // Mostrar elementos del menú
        if(pantallaAcceso){
           pantallaAcceso.style.display = "none";
        }
        
        if (menu) {
            menu.style.display = "block";
        }
        if (usuarioInfo) {
            usuarioInfo.style.display = "block";
        }
         if (videoFondo) {
            videoFondo.style.display = "block";
        }

        console.log('📋 Menú principal mostrado');
    }

    // --- GESTIÓN DE AUDIO ---
    async function iniciarAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('🔊 AudioContext activado');
        }
    }

    async function reproducirAudioMenu() {
        try {
            await iniciarAudioContext();
            
            // Reiniciar audio
            audioMenu.pause();
            audioMenu.currentTime = 0;
            
            // Reproducir
            await audioMenu.play();
            console.log('🎵 Audio del menú iniciado correctamente');
            return true;
        } catch (error) {
            console.log('⚠️ Error al reproducir audio del menú:', error.message);
            return false;
        }
    }

    async function reproducirSonidoAcceso() {
        try {
            await iniciarAudioContext();
            await sonidoAcceso.play();
            console.log('✅ Sonido de acceso reproducido');
        } catch (error) {
            console.log('⚠️ Error al reproducir sonido de acceso:', error.message);
        }
    }

    // --- EFECTO MATRIX ---
    function iniciarMatrix() {
        const canvas = document.getElementById("matrixCanvas");
        if (!canvas) {
            console.error('❌ ERROR: No se encontró el canvas del Matrix');
            return;
        }
        
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

        // Limpiar interval anterior si existe
        limpiarMatrix();
        
        matrixInterval = setInterval(draw, 10);
        console.log('🟢 Efecto Matrix iniciado');
    }

    // --- CARGAR NIVEL ---
    function cargarNivel(salaId) {
        console.log(`🎮 Cargando nivel con sala ID: ${salaId}`);
        
        if (!pantallaCarga) {
            console.error('❌ ERROR: No se encontró pantallaCarga');
            return;
        }
        
        // Pausar audio del menú
        if (audioMenu) {
            audioMenu.pause();
            audioMenu.currentTime = 0;
        }
        
        // Mostrar pantalla de carga
        pantallaCarga.style.display = "flex";
        
        // Reproducir sonido de inicio
        if (sonidoInicio) {
            sonidoInicio.play().catch(e => console.log('⚠️ No se pudo reproducir sonidoInicio:', e));
        }
        
        // Iniciar efecto Matrix
        iniciarMatrix();
        
        // Marcar que estamos cargando
        sessionStorage.setItem('cargandoNivel', 'true');
        
        // Construir URL dinámicamente
        const url = `/nivelSeleccionado/${salaId}/`;
        
        // Redirigir después de 5 segundos
        setTimeout(function () {
            console.log(`🚀 Redirigiendo a: ${url}`);
            window.location.href = url;
        }, 5000);
    }

    // --- DETECCIÓN DE REGRESO CON BOTÓN ATRÁS ---
    function manejarRegreso() {
    // Si estábamos cargando un nivel y regresamos
    const estabaCargando = sessionStorage.getItem('cargandoNivel');
    
    if (estabaCargando === 'true') {
        console.log('🔄 Detectado regreso desde carga de nivel');
        
        // Limpiar estado
        sessionStorage.removeItem('cargandoNivel');
        
        // Limpiar y ocultar elementos de carga
        limpiarMatrix();
        ocultarPantallaCarga();
        
        // Solo mostrar menú si ya se había accedido al sistema
        if (sistemaAccedido) {
            mostrarMenu();
            reproducirAudioMenu();
        } else {
            // Si no habíamos accedido, mostrar pantalla de acceso
            if (pantallaAcceso) pantallaAcceso.style.display = "flex";
            if (menu) menu.style.display = "none";
            if (usuarioInfo) usuarioInfo.style.display = "none";
            if (videoFondo) videoFondo.style.display = "none";
        }
    }
}

    // --- EVENT LISTENERS ---
    
    // ÚNICO Event listener para el botón de acceso
    if (btnAcceso) {
        btnAcceso.addEventListener("click", async function(e) {
            e.preventDefault();
            console.log('🎯 Botón de acceso clickeado');
            
            // Marcar que el sistema fue accedido
            sistemaAccedido = true;
            
            // Mostrar menú inmediatamente
            mostrarMenu();
            
            // Reproducir sonido de acceso y luego audio del menú
            setTimeout(async () => {
                // Comentado para evitar doble sonido
                // await reproducirSonidoAcceso();
                await reproducirAudioMenu();
            }, 100);
        });
        console.log('✅ Event listener único configurado para btnAcceso');
    }

    // Botón Nueva Partida
    if (nuevaPartidaBtn) {
        nuevaPartidaBtn.addEventListener("click", function (e) {
            e.preventDefault();
            
            const salaId = this.getAttribute('data-sala-id');
            if (salaId) {
                cargarNivel(salaId);
            } else {
                console.error('❌ ERROR: No se encontró data-sala-id en el botón');
            }
        });
    }

    // Clicks en otros elementos del menú
    if (menu) {
        menu.addEventListener("click", function (e) {
            const target = e.target;
            const isMenuElement = target.tagName === "H2" || target.tagName === "H3" || target.tagName === "A";
            const isNotNewGameBtn = !target.closest('#nuevaPartidaBtn');
            
            if (isMenuElement && isNotNewGameBtn) {
                console.log('🔇 Click en elemento del menú, pausando audio');
                
                if (audioMenu) {
                    audioMenu.pause();
                    audioMenu.currentTime = 0;
                }
            }
        });
    }

    // Manejo de visibilidad de la página
    //document.addEventListener('visibilitychange', function() {
        //if (!document.hidden && sistemaAccedido) {
            //console.log('👁️ Página visible de nuevo');
            
            // Si el audio está pausado, reiniciarlo
            //setTimeout(() => {
                //if (audioMenu && audioMenu.paused) {
                    //reproducirAudioMenu();
                //}
            //}, 500);
        //}
    //});

    // Detectar navegación con botones del navegador
    // Detectar navegación con botones del navegador
window.addEventListener('pageshow', function(event) {
    console.log('📄 Evento pageshow detectado');
    
    // Solo manejar regreso si venimos de una carga
    const estabaCargando = sessionStorage.getItem('cargandoNivel');
    if (estabaCargando === 'true') {
        manejarRegreso();
    } else {
        // Para cualquier otra situación, siempre mostrar pantalla de acceso
        console.log('🔄 Mostrando pantalla de acceso');
        if (pantallaAcceso) pantallaAcceso.style.display = "flex";
        if (menu) menu.style.display = "none";
        if (usuarioInfo) usuarioInfo.style.display = "none";
        if (videoFondo) videoFondo.style.display = "none";
        sistemaAccedido = false;
    }
});

    // --- INICIALIZACIÓN ---
    console.log('🚀 Menu.js cargado correctamente');
    
    // COMENTADO: No verificar sessionStorage para evitar auto-skip
    // const yaAccedido = sessionStorage.getItem('sistemaAccedido');
    // if (yaAccedido === 'true') {
    //     console.log('🔄 Sistema ya fue accedido previamente');
    //     sistemaAccedido = true;
    //     mostrarMenu();
    //     setTimeout(() => {
    //         reproducirAudioMenu();
    //     }, 500);
    // }
    
    // Forzar estado inicial siempre
    console.log('🔐 Forzando pantalla de acceso inicial');
    if (pantallaAcceso) pantallaAcceso.style.display = "flex";
    if (menu) menu.style.display = "none";
    if (usuarioInfo) usuarioInfo.style.display = "none";
    if (videoFondo) videoFondo.style.display = "none";
    
    // Limpiar cualquier estado previo
    limpiarMatrix();
    ocultarPantallaCarga();
    
    // Solo manejar regreso si venimos de una carga
    const estabaCargando = sessionStorage.getItem('cargandoNivel');
    if (estabaCargando === 'true') {
        manejarRegreso();
    }
    
    // Hacer funciones disponibles globalmente
    window.iniciarMatrix = iniciarMatrix;
    window.cargarNivel = cargarNivel;
    window.limpiarMatrix = limpiarMatrix;
});