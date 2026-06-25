/* =====================================================================
   ÁREA DO MEMBRO — animação de frames (vídeo) + proteção + download
   Usa o cliente "sb" e baixarAplicativo() de supabase-config.js.
   ===================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  /* ---------- 1) Proteção: só entra quem está logado ---------- */
  const { data: { session } } = await sb.auth.getSession();
  if (!session || !session.user) {
    window.location.replace("index.html");
    return;
  }

  // Sai automaticamente se a sessão acabar
  sb.auth.onAuthStateChange((_event, s) => {
    if (!s) window.location.replace("index.html");
  });

  /* ---------- 2) Nome do usuário ---------- */
  const meta = session.user.user_metadata || {};
  const nome = (meta.full_name || meta.name || session.user.email || "Membro").trim();
  const primeiroNome = nome.split(" ")[0];
  const navName = document.getElementById("nav-user-name");
  const welcomeName = document.getElementById("welcome-name");
  if (navName) navName.textContent = primeiroNome;
  if (welcomeName) welcomeName.textContent = nome;

  /* ---------- 3) Download protegido ---------- */
  async function dispararDownload(e) {
    if (e) e.preventDefault();
    const { data } = await sb.auth.getSession();
    if (data.session && data.session.user) {
      baixarAplicativo(data.session);
    } else {
      window.location.replace("index.html");
    }
  }
  ["download-btn", "download-btn-2"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", dispararDownload);
  });

  /* ---------- 4) Logout ---------- */
  async function sair(e) {
    if (e) e.preventDefault();
    await sb.auth.signOut();
    window.location.replace("index.html");
  }
  ["logout-btn", "logout-link"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", sair);
  });

  /* ---------- 5) Animação de frames controlada pelo scroll ---------- */
  const canvas = document.getElementById("bridge-canvas");
  const ctx = canvas.getContext("2d");
  const loaderContainer = document.querySelector(".loader-container");
  const loaderBar = document.querySelector(".loader-bar");
  const loaderPercent = document.querySelector(".loader-percent");
  const scrollContainer = document.querySelector(".scroll-hero-container");
  const cards = document.querySelectorAll(".scroll-card");
  const stickyViewport = document.querySelector(".sticky-viewport");

  const frameCount = 120;
  const images = [];
  let loadedCount = 0;
  let currentFrame = 0;
  let targetFrame = 0;

  const cardRanges = [
    { cardIndex: 0, start: 0.0,  end: 0.24 },
    { cardIndex: 1, start: 0.32, end: 0.62 },
    { cardIndex: 2, start: 0.70, end: 1.0 },
  ];

  const getFramePath = (i) => `area-frames/frame-${String(i).padStart(3, "0")}.jpg`;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFrame(currentFrame);
  }

  function drawCoverImage(img, alpha) {
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / img.width, ch / img.height);
    const nw = img.width * scale, nh = img.height * scale;
    const x = (cw - nw) / 2, y = (ch - nh) / 2;
    if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(img, x, y, nw, nh);
    ctx.globalAlpha = 1;
  }

  function renderFrame(framePos) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const lower = Math.floor(framePos);
    const upper = Math.ceil(framePos);
    const blend = framePos - lower;
    const imgLower = images[Math.min(lower, frameCount - 1)];
    const imgUpper = images[Math.min(upper, frameCount - 1)];
    if (imgLower && imgUpper && lower !== upper) {
      drawCoverImage(imgLower, 1);
      drawCoverImage(imgUpper, blend);
    } else if (imgLower) {
      drawCoverImage(imgLower, 1);
    }
  }

  function preloadImages() {
    const order = [];
    for (let i = 1; i <= frameCount; i += 10) order.push(i);
    for (let i = 1; i <= frameCount; i++) if (!order.includes(i)) order.push(i);

    order.forEach((i) => {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        loadedCount++;
        const percent = Math.round((loadedCount / frameCount) * 100);
        if (loaderBar) loaderBar.style.width = percent + "%";
        if (loaderPercent) loaderPercent.textContent = percent + "%";
        if (loadedCount === frameCount) {
          setTimeout(() => {
            loaderContainer.style.opacity = "0";
            setTimeout(() => { loaderContainer.style.display = "none"; }, 500);
            requestAnimationFrame(animate);
          }, 300);
        }
      };
      img.onerror = () => { loadedCount++; }; // não trava o loader se faltar 1
      images[i - 1] = img;
    });
  }

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const containerTop = scrollContainer.offsetTop;
    const containerHeight = scrollContainer.offsetHeight;
    const windowHeight = window.innerHeight;
    const maxScroll = containerHeight - windowHeight;
    let f = (scrollTop - containerTop) / maxScroll;
    f = Math.max(0, Math.min(1, f));
    targetFrame = f * (frameCount - 1);

    const heroEnd = containerTop + containerHeight;
    if (scrollTop > heroEnd - windowHeight * 0.5) {
      const fade = Math.min(1, (scrollTop - (heroEnd - windowHeight * 0.5)) / (windowHeight * 0.3));
      stickyViewport.style.opacity = 1 - fade;
    } else {
      stickyViewport.style.opacity = 1;
    }

    cardRanges.forEach((range) => {
      const card = cards[range.cardIndex];
      if (!card) return;
      if (f >= range.start && f <= range.end) card.classList.add("active");
      else card.classList.remove("active");
    });
  }

  function animate() {
    const ease = 0.08;
    const diff = targetFrame - currentFrame;
    currentFrame = Math.abs(diff) > 0.005 ? currentFrame + diff * ease : targetFrame;
    renderFrame(currentFrame);
    requestAnimationFrame(animate);
  }

  /* ---------- 6) Reveal + navbar ---------- */
  const revealElements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");
  function checkReveals() {
    const trigger = window.innerHeight * 0.88;
    revealElements.forEach((el) => {
      if (el.getBoundingClientRect().top < trigger) el.classList.add("visible");
    });
  }

  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 50) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
    updateScrollProgress();
    checkReveals();
  });

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  preloadImages();
  updateScrollProgress();
  checkReveals();
});
