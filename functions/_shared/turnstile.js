export async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return { ok: false };
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
  return { ok: Boolean(result.success), result };
}
