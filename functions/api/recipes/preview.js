import { buildRecipe } from "../../_shared/recipe.js";
import { json, methodNotAllowed, optionsResponse, readSubmission } from "../../_shared/http.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost({ request }) {
  try {
    const submission = await readSubmission(request);
    const result = buildRecipe(submission, { verifyTurnstile: false });

    if (!result.ok) {
      return json({ ok: false, errors: result.errors, warnings: result.warnings }, 400);
    }

    return json(result);
  } catch (error) {
    return json({ ok: false, error: error.message || "Unexpected error" }, 500);
  }
}

export async function onRequest() {
  return methodNotAllowed();
}
