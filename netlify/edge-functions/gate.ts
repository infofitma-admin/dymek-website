// Site-wide password gate (like a Squarespace site password). Password: Dymo
import type { Config, Context } from "@netlify/edge-functions";

const PASSWORD = "Dymo";
const COOKIE = "dymek_access";
const MAX_AGE = 60 * 60 * 24 * 30; // stay unlocked for 30 days
const PUBLIC = ["/assets/dymek-logo.webp", "/assets/dymek-mark.webp", "/favicon.ico"];

async function token(): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("dymek-gate:" + PASSWORD));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeNext(n: string | null): string {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function page(next: string, error: boolean): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Dymek | Password protected</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Figtree:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding:24px 16px;font-family:Figtree,system-ui,sans-serif;color:#1B2E0A;
background:radial-gradient(1200px 600px at 85% -10%,#E4F3CF 0%,transparent 60%),radial-gradient(900px 500px at -10% 110%,#EAF5DC 0%,transparent 60%),#F6F8F1}
.card{width:100%;max-width:420px;background:#fff;border-radius:24px;padding:40px 32px 32px;text-align:center;box-shadow:0 1px 2px rgba(27,46,10,.06),0 20px 50px -20px rgba(27,46,10,.25)}
.logo{height:52px;width:auto;margin:0 auto 28px;display:block}
h1{font-family:Montserrat,sans-serif;font-weight:800;font-size:22px;letter-spacing:-.01em;margin-bottom:8px}
p{color:#5A6650;font-size:15px;line-height:1.55;margin-bottom:24px}
form{display:grid;gap:12px}
input{width:100%;height:50px;border:1.5px solid #D9E3CC;border-radius:14px;padding:0 16px;font:500 16px Figtree,sans-serif;color:#1B2E0A;background:#fff;outline:none;transition:border-color .2s,box-shadow .2s}
input:focus{border-color:#7BB54E;box-shadow:0 0 0 4px rgba(123,181,78,.18)}
button{height:50px;border:0;border-radius:14px;background:#1B2E0A;color:#fff;font:700 15px Montserrat,sans-serif;cursor:pointer;transition:transform .15s,background .2s}
button:hover{background:#2C4714}button:active{transform:translateY(1px)}
.err{color:#B3261E;font-size:14px;font-weight:500;margin:-2px 0 2px}
.foot{margin-top:24px;font-size:13px;color:#8A9580}
</style></head><body>
<main class="card">
<img class="logo" src="/assets/dymek-logo.webp" alt="Dymek Company Ltd.">
<h1>This site is password protected</h1>
<p>Please enter the password to continue.</p>
<form method="post" action="/__unlock">
<input type="hidden" name="next" value="${esc(next)}">
<input type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="current-password" autofocus required>
${error ? '<div class="err" role="alert">Incorrect password. Please try again.</div>' : ""}
<button type="submit">Enter</button>
</form>
<div class="foot">&copy; Dymek Company Ltd.</div>
</main></body></html>`;
  return new Response(html, {
    status: 401,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });
}

export default async (req: Request, ctx: Context) => {
  const url = new URL(req.url);
  if (PUBLIC.includes(url.pathname)) return ctx.next();

  const tok = await token();

  if (url.pathname === "/__unlock" && req.method === "POST") {
    const f = await req.formData();
    const next = safeNext(String(f.get("next") || "/"));
    if (String(f.get("password") || "") === PASSWORD) {
      return new Response(null, {
        status: 303,
        headers: {
          location: next,
          "set-cookie": `${COOKIE}=${tok}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          "cache-control": "no-store",
        },
      });
    }
    return page(next, true);
  }

  if (ctx.cookies.get(COOKIE) === tok) return ctx.next();
  return page(url.pathname + url.search, false);
};

export const config: Config = { path: "/*" };
