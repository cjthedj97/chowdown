export async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return { ok: false, error: "Turnstile secret is not configured." };
  }

  if (!token) {
    return { ok: false, error: "Turnstile token is missing. Complete the Turnstile check and try again." };
  }

  const ip = request.headers.get("CF-Connecting-IP") || undefined;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip
    })
  });

  const result = await response.json();
  if (result.success) {
    return { ok: true, result };
  }

  const codes = Array.isArray(result["error-codes"]) ? result["error-codes"].join(", ") : "unknown-error";
  return { ok: false, error: `Turnstile verification failed: ${codes}` };
}
