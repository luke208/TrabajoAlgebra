const totalLevels = 5;
const levelsContainer = document.querySelector('.levels');
let unlockedLevels = parseInt(localStorage.getItem('unlockedLevels')) || 1;

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

  return setInterval(draw, 10);
}

function createLevels() {
  levelsContainer.innerHTML = '';

  for (let i = 1; i <= totalLevels; i++) {
    const level = document.createElement('a');
    level.classList.add('level');
    level.textContent = `Nivel ${i}`;

    if (i <= unlockedLevels) {
      level.href = '#';

      level.addEventListener('click', (e) => {
        e.preventDefault();

        if (i === 1) {
          // Mostrar pantalla hacker, reproducir sonido y activar Matrix
          document.getElementById("pantallaCarga").style.display = "flex";
          document.getElementById("sonidoInicio").play();
          iniciarMatrix();

          setTimeout(() => {
            window.location.href = `${window.STATIC_URL_BASE}html/nivel${i}.html`;
          }, 5000);
        } else {
          // Redirección directa para otros niveles desbloqueados
          window.location.href = `${window.STATIC_URL_BASE}html/nivel${i}.html`;
        }
      });

    } else {
      level.classList.add('locked');
      level.href = 'javascript:void(0)';
    }

    levelsContainer.appendChild(level);
  }
}

createLevels();
