# Download protegido — Cloudflare Worker

Este Worker entrega o arquivo `Horus-portatil.zip` do R2 **somente** para
usuários autenticados no Supabase. Sem login válido, retorna 401.

Fluxo: o site manda o token do usuário → o Worker valida no Supabase →
se ok, transmite o arquivo direto do bucket (que fica privado).

---

## Opção A — Pelo painel da Cloudflare (mais simples, sem instalar nada)

1. **Workers & Pages** → **Create application** → **Create Worker** →
   dê o nome `horus-download` → **Deploy**.
2. **Edit code** → apague o conteúdo e cole o código de `worker.js` →
   **Deploy**.
3. **Settings → Variables and Secrets** → adicione as variáveis (texto):
   - `SUPABASE_URL` = `https://pjzhbgsyoiidelmmhnjc.supabase.co`
   - `SUPABASE_ANON_KEY` = `sb_publishable_sZmVrKddQykoPLAaB4S4Sw_x8EEFEwe`
   - `FILE_KEY` = `Horus-portatil.zip`
   - `ALLOW_ORIGIN` = `*` (depois troque pela URL final do site)
4. **Settings → Bindings → Add → R2 bucket**:
   - Variable name: `BUCKET`
   - R2 bucket: selecione o bucket do arquivo (Hórus)
   - **Deploy** para aplicar.
5. Copie a URL do Worker (algo como
   `https://horus-download.SEU-SUBDOMINIO.workers.dev`).

## Opção B — Pela linha de comando (wrangler)

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

(As variáveis já estão no `wrangler.toml`. Confirme o `bucket_name`.)

---

## Depois de publicar

1. **Cole a URL do Worker** em `auth.js` na constante `WORKER_URL`.
2. **Torne o bucket privado de novo**: no R2 → bucket → **Configurações** →
   **URL de desenvolvimento público** → **Desabilitar**. (O Worker não
   precisa da URL pública — ele lê o arquivo direto pelo binding.)

Pronto: o download só funciona logado, e o link público deixa de existir.
