/* =====================================================================
   PÁGINA INICIAL — modal de login / cadastro
   Usa o cliente "sb" definido em supabase-config.js.
   Após o login, leva o usuário para a área do membro (area.html).
   ===================================================================== */

const $ = (id) => document.getElementById(id);
const show = (el) => el && el.classList.remove("hidden");
const hide = (el) => el && el.classList.add("hidden");

const AREA_URL = "area.html";

const els = {
  modal:      $("auth-modal"),
  openBtn:    $("open-auth"),
  formLogin:  $("form-login"),
  formSignup: $("form-signup"),
  loginEmail:     $("login-email"),
  loginPassword:  $("login-password"),
  signupName:     $("signup-name"),
  signupEmail:    $("signup-email"),
  signupPassword: $("signup-password"),
  msg:        $("auth-msg"),
};

let isLogged = false;

function setMessage(text, type) {
  els.msg.textContent = text || "";
  els.msg.className = "auth-msg" + (type ? " " + type : "");
}

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
  const first = (view === "signup" ? els.signupName : els.loginEmail);
  setTimeout(() => first && first.focus(), 50);
}

function closeModal() {
  hide(els.modal);
  els.modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function switchView(view) {
  setMessage("");
  if (view === "signup") { show(els.formSignup); hide(els.formLogin); }
  else { show(els.formLogin); hide(els.formSignup); }
}

/* ----- Botão da navbar reflete o estado ----- */
function renderNav(session) {
  isLogged = !!(session && session.user);
  els.openBtn.textContent = isLogged ? "Minha Área" : "Entrar";
}

/* ----- Eventos ----- */
els.openBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (isLogged) window.location.href = AREA_URL;
  else openModal("login");
});

els.modal.querySelectorAll("[data-close]").forEach((el) =>
  el.addEventListener("click", closeModal)
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.modal.classList.contains("hidden")) closeModal();
});

els.modal.querySelectorAll(".auth-switch-btn").forEach((btn) =>
  btn.addEventListener("click", () => switchView(btn.dataset.go))
);

els.modal.querySelectorAll(".auth-eye").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = $(btn.dataset.eye);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    btn.classList.toggle("on", !showing);
  });
});

// Cadastro (com nome)
els.formSignup.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMessage("Criando conta...");
  const { data, error } = await sb.auth.signUp({
    email: els.signupEmail.value.trim(),
    password: els.signupPassword.value,
    options: { data: { full_name: els.signupName.value.trim() } },
  });
  if (error) { setMessage(traduzErro(error), "error"); return; }
  if (data.session) {
    window.location.href = AREA_URL;
  } else {
    setMessage("Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois faça login.", "success");
    els.formSignup.reset();
  }
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
  window.location.href = AREA_URL;
});

/* ----- Estado inicial ----- */
(async () => {
  const { data } = await sb.auth.getSession();
  renderNav(data.session);
})();

sb.auth.onAuthStateChange((_event, session) => renderNav(session));
