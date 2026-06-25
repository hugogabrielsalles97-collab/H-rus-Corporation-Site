/* =====================================================================
   ÁREA DO MEMBRO (dashboard) — proteção + perfil + download + logout
   Vídeo de fundo roda sozinho (loop) via atributos do <video>.
   Usa "sb" e baixarAplicativo() de supabase-config.js.
   ===================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const byId = (id) => document.getElementById(id);
  const setText = (id, txt) => { const el = byId(id); if (el) el.textContent = txt; };

  /* ---------- Proteção: só entra logado ---------- */
  const { data: { session } } = await sb.auth.getSession();
  if (!session || !session.user) {
    window.location.replace("index.html");
    return;
  }
  sb.auth.onAuthStateChange((_event, s) => {
    if (!s) window.location.replace("index.html");
  });

  /* ---------- Perfil (nome, e-mail, avatar) ---------- */
  const u = session.user;
  const meta = u.user_metadata || {};
  const fullName = (meta.full_name || meta.name || "").trim();
  const displayName = fullName || (u.email ? u.email.split("@")[0] : "Membro");
  const firstName = displayName.split(" ")[0];

  setText("user-name", displayName);
  setText("user-email", u.email || "");
  setText("welcome-name", firstName);

  const initials = (fullName
    ? fullName.split(/\s+/).map((p) => p[0]).slice(0, 2).join("")
    : displayName.charAt(0)).toUpperCase();
  setText("user-avatar", initials);
  setText("user-avatar-lg", initials);

  /* ---------- Download protegido ---------- */
  async function dispararDownload(e) {
    if (e) e.preventDefault();
    const { data } = await sb.auth.getSession();
    if (data.session && data.session.user) baixarAplicativo(data.session);
    else window.location.replace("index.html");
  }
  document.querySelectorAll(".js-download").forEach((el) =>
    el.addEventListener("click", dispararDownload)
  );

  /* ---------- Logout ---------- */
  async function sair(e) {
    if (e) e.preventDefault();
    await sb.auth.signOut();
    window.location.replace("index.html");
  }
  const outBtn = byId("logout-btn");
  if (outBtn) outBtn.addEventListener("click", sair);

  /* ---------- Destaque do menu conforme a seção visível ---------- */
  const links = Array.from(document.querySelectorAll(".sidebar-link"));
  const sections = links
    .map((l) => byId(l.dataset.section))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.toggle("active", l.dataset.section === entry.target.id));
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    sections.forEach((s) => obs.observe(s));
  }
});
