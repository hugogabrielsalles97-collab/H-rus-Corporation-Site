/* =====================================================================
   AUTENTICAÇÃO (Supabase) + LIBERAÇÃO DO DOWNLOAD
   =====================================================================
   COMO CONFIGURAR:
   1. Em SUPABASE_URL, a URL do seu projeto Supabase.
      (painel → Settings → Data API → "Project URL")
   2. A chave publishable já está preenchida (pode ficar pública).
   ===================================================================== */

const SUPABASE_URL = "https://pjzhbgsyoiidelmmhnjc.supabase.co";
const SUPABASE_KEY = "sb_publishable_sZmVrKddQykoPLAaB4S4Sw_x8EEFEwe";

// URL do Cloudflare Worker que protege o download (recomendado).
// Depois de publicar o Worker (veja a pasta /worker), cole a URL aqui.
// Ex.: "https://horus-download.SEU-SUBDOMINIO.workers.dev"
const WORKER_URL = "";

// Link público direto no R2 — usado APENAS enquanto o WORKER_URL estiver
// vazio. Assim que o Worker for configurado, deixe o bucket privado e
// este link deixa de ser usado.
const DOWNLOAD_URL = "https://pub-f6e4a6b969db4ef8a2efd42fda361926.r2.dev/Horus-portatil.zip";

// ---------------------------------------------------------------------

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);
const show = (el) => el && el.classList.remove("hidden");
const hide = (el) => el && el.classList.add("hidden");

const els = {
  // modal
  modal:      $("auth-modal"),
  closeBtn:   $("auth-close"),
  openBtn:    $("open-auth"),
  // formulários
  formLogin:  $("form-login"),
  formSignup: $("form-signup"),
  loginEmail:     $("login-email"),
  loginPassword:  $("login-password"),
  signupEmail:    $("signup-email"),
  signupPassword: $("signup-password"),
  msg:        $("auth-msg"),
  // seção de download
  loading:    $("auth-loading"),
  locked:     $("dl-locked"),
  unlocked:   $("dl-unlocked"),
  loginTrigger: $("dl-login-trigger"),
  userEmail:  $("user-email"),
  downloadBtn:$("download-btn"),
  logoutBtn:  $("logout-btn"),
};

let isLogged = false;

function setMessage(text, type) {
  els.msg.textContent = text || "";
  els.msg.className = "auth-msg" + (type ? " " + type : "");
}

// Traduz os erros mais comuns do Supabase para português
function traduzErro(err) {
  const m = (err && err.message ? err.message : String(err)).toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed"))       return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  if (m.includes("user already registered"))   return "Este e-mail já possui cadastro. Faça login.";
  if (m.includes("password should be"))         return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("unable to validate email"))   return "E-mail inválido.";
  if (m.includes("for security purposes"))      return "Muitas tentativas. Aguarde alguns segundos e tente de novo.";
  return err && err.message ? err.message : "Ocorreu um erro. Tente novamente.";
}

/* ----- Modal ----- */
function openModal(view) {
  setMessage("");
  switchView(view || "login");
  show(els.modal);
  els.modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  const firstInput = (view === "signup" ? els.signupEmail : els.loginEmail);
  setTimeout(() => firstInput && firstInput.focus(), 50);
}

function closeModal() {
  hide(els.modal);
  els.modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function switchView(view) {
  setMessage("");
  if (view === "signup") {
    show(els.formSignup); hide(els.formLogin);
  } else {
    show(els.formLogin); hide(els.formSignup);
  }
}

/* ----- Estado de login na seção de download ----- */
function render(session) {
  hide(els.loading);
  isLogged = !!(session && session.user);
  if (isLogged) {
    hide(els.locked);
    show(els.unlocked);
    els.userEmail.textContent = session.user.email;
    els.openBtn.textContent = "Sair";
  } else {
    hide(els.unlocked);
    show(els.locked);
    els.openBtn.textContent = "Entrar";
  }
}

/* ----- Eventos ----- */

// Botão da navbar: abre login (deslogado) ou faz logout (logado)
els.openBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (isLogged) {
    await sb.auth.signOut();
  } else {
    openModal("login");
  }
});

// Botão "Entrar para baixar" da seção de download
els.loginTrigger.addEventListener("click", () => openModal("login"));

// Fechar modal (X, backdrop)
els.modal.querySelectorAll("[data-close]").forEach((el) =>
  el.addEventListener("click", closeModal)
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.modal.classList.contains("hidden")) closeModal();
});

// Alternar login <-> cadastro
els.modal.querySelectorAll(".auth-switch-btn").forEach((btn) =>
  btn.addEventListener("click", () => switchView(btn.dataset.go))
);

// Mostrar / ocultar senha
els.modal.querySelectorAll(".auth-eye").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = $(btn.dataset.eye);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    btn.classList.toggle("on", !showing);
  });
});

// Cadastro
els.formSignup.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMessage("Criando conta...");
  const { data, error } = await sb.auth.signUp({
    email: els.signupEmail.value.trim(),
    password: els.signupPassword.value,
  });
  if (error) { setMessage(traduzErro(error), "error"); return; }
  if (data.session) {
    setMessage("Conta criada com sucesso!", "success");
  } else {
    setMessage("Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois faça login.", "success");
  }
  els.formSignup.reset();
});

// Login
els.formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMessage("Entrando...");
  const { error } = await sb.auth.signInWithPassword({
    email: els.loginEmail.value.trim(),
    password: els.loginPassword.value,
  });
  if (error) { setMessage(traduzErro(error), "error"); return; }
  setMessage("");
  els.formLogin.reset();
  closeModal();
});

// Logout (botão dentro da seção de download)
els.logoutBtn.addEventListener("click", () => sb.auth.signOut());

// Download — só dispara com sessão ativa
els.downloadBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const { data } = await sb.auth.getSession();
  if (data.session && data.session.user) {
    if (WORKER_URL) {
      // Proteção real: o Worker valida o token antes de entregar o arquivo
      const token = encodeURIComponent(data.session.access_token);
      window.location.href = `${WORKER_URL}?token=${token}`;
    } else {
      // Fallback: link público direto (enquanto o Worker não está configurado)
      window.location.href = DOWNLOAD_URL;
    }
  } else {
    render(null);
    openModal("login");
    setMessage("Sua sessão expirou. Entre novamente para baixar.", "error");
  }
});

/* ----- Estado inicial + reação a login/logout ----- */
(async () => {
  const { data } = await sb.auth.getSession();
  render(data.session);
})();

sb.auth.onAuthStateChange((_event, session) => render(session));
