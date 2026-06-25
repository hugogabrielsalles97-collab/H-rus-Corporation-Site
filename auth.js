/* =====================================================================
   AUTENTICAÇÃO (Supabase) + LIBERAÇÃO DO DOWNLOAD
   =====================================================================
   COMO CONFIGURAR:
   1. Cole abaixo, em SUPABASE_URL, a URL do seu projeto Supabase.
      Onde achar: painel do Supabase → Connect → App Frameworks,
      ou Settings → Data API → "Project URL".
      Formato: https://xxxxxxxxxxxxxxxx.supabase.co
   2. A chave publishable já está preenchida (pode ficar pública).
   ===================================================================== */

const SUPABASE_URL = "https://pjzhbgsyoiidelmmhnjc.supabase.co";
const SUPABASE_KEY = "sb_publishable_sZmVrKddQykoPLAaB4S4Sw_x8EEFEwe";

// Link do arquivo no Cloudflare R2 (só é usado depois do login)
const DOWNLOAD_URL = "https://pub-f6e4a6b969db4ef8a2efd42fda361926.r2.dev/Horus-portatil.zip";

// ---------------------------------------------------------------------

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos da interface
const els = {
  loading:  document.getElementById("auth-loading"),
  forms:    document.getElementById("auth-forms"),
  logged:   document.getElementById("auth-logged"),
  msg:      document.getElementById("auth-msg"),
  userEmail:document.getElementById("user-email"),
  formLogin:  document.getElementById("form-login"),
  formSignup: document.getElementById("form-signup"),
  loginEmail:    document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  signupEmail:    document.getElementById("signup-email"),
  signupPassword: document.getElementById("signup-password"),
  downloadBtn: document.getElementById("download-btn"),
  logoutBtn:   document.getElementById("logout-btn"),
  tabs: document.querySelectorAll(".auth-tab"),
};

function show(el)  { el && el.classList.remove("hidden"); }
function hide(el)  { el && el.classList.add("hidden"); }

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

// Alterna entre os estados visuais conforme a sessão
function render(session) {
  hide(els.loading);
  if (session && session.user) {
    hide(els.forms);
    show(els.logged);
    els.userEmail.textContent = session.user.email;
  } else {
    hide(els.logged);
    show(els.forms);
  }
}

// Troca de aba (Entrar / Criar conta)
els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    els.tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    setMessage("");
    if (tab.dataset.tab === "login") {
      show(els.formLogin); hide(els.formSignup);
    } else {
      show(els.formSignup); hide(els.formLogin);
    }
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

  // Se a confirmação de e-mail estiver ativa, não há sessão imediata
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
});

// Logout
els.logoutBtn.addEventListener("click", async () => {
  await sb.auth.signOut();
  setMessage("");
});

// Download — só dispara com sessão ativa (proteção extra no clique)
els.downloadBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const { data } = await sb.auth.getSession();
  if (data.session && data.session.user) {
    window.location.href = DOWNLOAD_URL;
  } else {
    render(null);
    setMessage("Sua sessão expirou. Entre novamente para baixar.", "error");
  }
});

// Estado inicial + reação a login/logout
(async () => {
  const { data } = await sb.auth.getSession();
  render(data.session);
})();

sb.auth.onAuthStateChange((_event, session) => render(session));
