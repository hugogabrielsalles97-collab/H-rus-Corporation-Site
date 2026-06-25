/* =====================================================================
   CLOUDFLARE WORKER — Download protegido do Hórus Portátil
   =====================================================================
   Só entrega o arquivo do R2 se o visitante tiver um login válido no
   Supabase. O token de acesso (JWT) é validado a cada download.

   Bindings/variáveis necessários (configurados no painel ou no
   wrangler.toml):
     - BUCKET            (binding R2 para o bucket do arquivo)
     - SUPABASE_URL      (ex.: https://pjzhbgsyoiidelmmhnjc.supabase.co)
     - SUPABASE_ANON_KEY (a chave publishable, sb_publishable_...)
     - FILE_KEY          (nome do arquivo no bucket: Horus-portatil.zip)
     - ALLOW_ORIGIN      (origem do site, ex.: https://seusite.com.br
                          ou * durante os testes)
   ===================================================================== */

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    };

    // Pré-voo CORS (caso o front use fetch com header Authorization)
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Método não permitido.", { status: 405, headers: cors });
    }

    // Token vem do header Authorization OU da query string (?token=...)
    const url = new URL(request.url);
    const headerToken = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const token = headerToken || url.searchParams.get("token") || "";

    if (!token) {
      return new Response("Não autorizado: faça login para baixar.", { status: 401, headers: cors });
    }

    // Valida o token no Supabase
    const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    });

    if (userRes.status !== 200) {
      return new Response("Sessão inválida ou expirada. Faça login novamente.", {
        status: 401,
        headers: cors,
      });
    }

    // Busca o arquivo no R2
    const object = await env.BUCKET.get(env.FILE_KEY);
    if (!object) {
      return new Response("Arquivo não encontrado no bucket.", { status: 404, headers: cors });
    }

    const headers = new Headers(cors);
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Content-Type", "application/zip");
    headers.set("Content-Disposition", `attachment; filename="${env.FILE_KEY}"`);
    headers.set("Cache-Control", "no-store");

    // HEAD: só os cabeçalhos, sem corpo
    if (request.method === "HEAD") {
      headers.set("Content-Length", String(object.size));
      return new Response(null, { headers });
    }

    return new Response(object.body, { headers });
  },
};
