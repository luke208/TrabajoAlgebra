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

        // Event listener para el botón de acceso
        if (btnAcceso) {
            btnAcceso.addEventListener("click", function() {
            console.log('🎯 Botón acceso clickeado - mostrando menú');
            mostrarMenu();
        
            // Iniciar audio del menú después de mostrar
            setTimeout(() => {
                manejarAudioMenu();
            }, 300);
        });
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
                
                // Si ya accedimos al sistema, mostrar menú y reproducir audio
                if (sistemaAccedido) {
                    setTimeout(() => {
                        reproducirAudioMenu();
                    }, 500);
                }
            }
        }

        // --- EVENT LISTENERS ---
        
        // Botón de acceso al sistema
        btnAcceso.addEventListener("click", async function() {
            console.log('🎯 Botón de acceso clickeado');
            
            // Reproducir sonido de acceso
            await reproducirSonidoAcceso();
            
            // Marcar que el sistema fue accedido
            sistemaAccedido = true;
            sessionStorage.setItem('sistemaAccedido', 'true');
            
            // Mostrar menú después de un breve delay
            setTimeout(async () => {
                mostrarMenu();
                
                // Iniciar audio del menú
                await reproducirAudioMenu();
            }, 300);
        });

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
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && sistemaAccedido) {
                console.log('👁️ Página visible de nuevo');
                
                // Si el audio está pausado, reiniciarlo
                setTimeout(() => {
                    if (audioMenu && audioMenu.paused) {
                        reproducirAudioMenu();
                    }
                }, 500);
            }
        });

        // Detectar navegación con botones del navegador
        window.addEventListener('pageshow', function(event) {
            console.log('📄 Evento pageshow detectado');
            manejarRegreso();
        });

        // --- INICIALIZACIÓN ---
        console.log('🚀 Menu.js cargado correctamente');
        
        // Verificar si ya accedimos al sistema anteriormente
        const yaAccedido = sessionStorage.getItem('sistemaAccedido');
        
        if (yaAccedido === 'true') {
            console.log('🔄 Sistema ya fue accedido previamente');
            sistemaAccedido = true;
            mostrarMenu();
            
            // Delay para reproducir audio si venimos de otra página
            setTimeout(() => {
                reproducirAudioMenu();
            }, 500);
        }
        
        // Limpiar cualquier estado previo
        limpiarMatrix();
        ocultarPantallaCarga();
        manejarRegreso();
        
        // Hacer funciones disponibles globalmente
        window.iniciarMatrix = iniciarMatrix;
        window.cargarNivel = cargarNivel;
        window.limpiarMatrix = limpiarMatrix;
    });