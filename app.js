document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('bridge-canvas');
  const ctx = canvas.getContext('2d');
  const loaderContainer = document.querySelector('.loader-container');
  const loaderText = document.querySelector('.loader-text');
  const loaderBar = document.querySelector('.loader-bar');
  const loaderPercent = document.querySelector('.loader-percent');
  const scrollContainer = document.querySelector('.scroll-hero-container');
  const cards = document.querySelectorAll('.scroll-card');
  const stickyViewport = document.querySelector('.sticky-viewport');

  // Configuração dos frames — 120 frames para máxima suavidade
  const frameCount = 120;
  const images = [];
  let loadedCount = 0;

  // Interpolação ultra-suave com crossfade
  let currentFrame = 0;
  let targetFrame = 0;
  let displayFrame = 0; // frame fracionário para crossfade

  // Faixas de ativação dos cards (mesma proporção do original)
  const cardRanges = [
    { cardIndex: 0, start: 0.0, end: 0.16 },
    { cardIndex: 1, start: 0.22, end: 0.42 },
    { cardIndex: 2, start: 0.48, end: 0.68 },
    { cardIndex: 3, start: 0.74, end: 0.94 }
  ];

  function getFramePath(index) {
    const paddedIndex = String(index).padStart(3, '0');
    return `bridge-video-frames/frame-${paddedIndex}.jpg`;
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFrame(currentFrame);
  }

  function drawCoverImage(img, alpha) {
    const cw = canvas.width, ch = canvas.height;
    const iw = img.width, ih = img.height;
    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale, nh = ih * scale;
    const x = (cw - nw) / 2, y = (ch - nh) / 2;

    if (alpha !== undefined && alpha < 1) {
      ctx.globalAlpha = alpha;
    }
    ctx.drawImage(img, x, y, nw, nh);
    ctx.globalAlpha = 1;
  }

  // Renderiza com crossfade entre frames adjacentes para suavidade máxima
  function renderFrame(framePos) {
    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const lowerFrame = Math.floor(framePos);
    const upperFrame = Math.ceil(framePos);
    const blend = framePos - lowerFrame; // 0.0 a 1.0

    const imgLower = images[Math.min(lowerFrame, frameCount - 1)];
    const imgUpper = images[Math.min(upperFrame, frameCount - 1)];

    if (imgLower && imgUpper && lowerFrame !== upperFrame) {
      // Crossfade entre dois frames para transição ultra-suave
      drawCoverImage(imgLower, 1);
      drawCoverImage(imgUpper, blend);
    } else if (imgLower) {
      drawCoverImage(imgLower, 1);
    }
  }

  function preloadImages() {
    // Preload em ordem de prioridade: primeiro frames-chave, depois intermediários
    const priorityOrder = [];
    
    // Primeiro: frames espaçados (a cada 10) para preview rápido
    for (let i = 1; i <= frameCount; i += 10) {
      priorityOrder.push(i);
    }
    // Depois: todos os frames restantes em sequência
    for (let i = 1; i <= frameCount; i++) {
      if (!priorityOrder.includes(i)) {
        priorityOrder.push(i);
      }
    }

    priorityOrder.forEach(i => {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        loadedCount++;
        const percent = Math.round((loadedCount / frameCount) * 100);
        if (loaderBar) loaderBar.style.width = percent + '%';
        if (loaderPercent) loaderPercent.textContent = percent + '%';
        if (loadedCount === frameCount) {
          setTimeout(() => {
            loaderContainer.style.opacity = '0';
            setTimeout(() => { loaderContainer.style.display = 'none'; }, 500);
            requestAnimationFrame(animate);
          }, 300);
        }
      };
      // Store in correct position (0-indexed)
      images[i - 1] = img;
    });
  }

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const containerTop = scrollContainer.offsetTop;
    const containerHeight = scrollContainer.offsetHeight;
    const windowHeight = window.innerHeight;
    const maxScroll = containerHeight - windowHeight;
    let scrollFraction = (scrollTop - containerTop) / maxScroll;
    scrollFraction = Math.max(0, Math.min(1, scrollFraction));

    targetFrame = scrollFraction * (frameCount - 1);

    // Fade out o canvas quando sair da seção hero
    const heroEnd = containerTop + containerHeight;
    if (scrollTop > heroEnd - windowHeight * 0.5) {
      const fadeProgress = Math.min(1, (scrollTop - (heroEnd - windowHeight * 0.5)) / (windowHeight * 0.3));
      stickyViewport.style.opacity = 1 - fadeProgress;
    } else {
      stickyViewport.style.opacity = 1;
    }

    // Ativa/desativa cards
    cardRanges.forEach(range => {
      const card = cards[range.cardIndex];
      if (card) {
        if (scrollFraction >= range.start && scrollFraction <= range.end) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      }
    });
  }

  function animate() {
    // Interpolação suave com easing mais lento para maior fluidez
    const ease = 0.08; // mais lento = mais suave (era 0.12)
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.005) {
      currentFrame += diff * ease;
    } else {
      currentFrame = targetFrame;
    }

    // Renderiza com crossfade fracionário
    renderFrame(currentFrame);
    requestAnimationFrame(animate);
  }

  // ========== SCROLL REVEAL ==========
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  function checkReveals() {
    const windowHeight = window.innerHeight;
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const triggerPoint = windowHeight * 0.88;
      if (rect.top < triggerPoint) {
        el.classList.add('visible');
      }
    });
  }


  // ========== NAVBAR ==========
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    updateScrollProgress();
    checkReveals();
  });


  // Inicializa
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  preloadImages();
  updateScrollProgress();
  checkReveals();
});
