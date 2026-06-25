/* =====================================================================
   CONFIGURAÇÃO COMPARTILHADA DO SUPABASE
   Carregado em todas as páginas que usam login (index e área do membro).
   ===================================================================== */

const SUPABASE_URL = "https://pjzhbgsyoiidelmmhnjc.supabase.co";
const SUPABASE_KEY = "sb_publishable_sZmVrKddQykoPLAaB4S4Sw_x8EEFEwe";

// URL do Cloudflare Worker que protege o download (valida o login).
const WORKER_URL = "https://horus-download.hugogabrielsalles97.workers.dev";

// Fallback público (não usado enquanto WORKER_URL estiver preenchido).
const DOWNLOAD_URL = "https://pub-f6e4a6b969db4ef8a2efd42fda361926.r2.dev/Horus-portatil.zip";

// Cliente único do Supabase, reutilizado pelas demais scripts da página.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Dispara o download protegido usando o token da sessão informada.
async function baixarAplicativo(session) {
  if (!(session && session.user)) return false;
  if (WORKER_URL) {
    const token = encodeURIComponent(session.access_token);
    window.location.href = `${WORKER_URL}?token=${token}`;
  } else {
    window.location.href = DOWNLOAD_URL;
  }
  return true;
}
