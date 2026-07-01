export async function readSubmission(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64_000) {
    throw new Error("Submission is too large.");
  }

  const body = await request.json();
  return body || {};
}

export function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

export function methodNotAllowed() {
  return json({ ok: false, error: "Method not allowed" }, 405);
}

export function optionsResponse() {
  return new Response(null, { status: 204 });
}
