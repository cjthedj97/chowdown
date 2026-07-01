import { createRecipePullRequest } from "../../_shared/github.js";
import { buildRecipe } from "../../_shared/recipe.js";
import { verifyTurnstile } from "../../_shared/turnstile.js";
import { json, methodNotAllowed, optionsResponse, readSubmission } from "../../_shared/http.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost({ request, env }) {
  try {
    const submission = await readSubmission(request);
    const validation = buildRecipe(submission, { verifyTurnstile: true });

    if (!validation.ok) {
      return json({ ok: false, errors: validation.errors, warnings: validation.warnings, validation_report: validation.validation_report }, 400);
    }

    const turnstile = await verifyTurnstile(submission.turnstileToken, request, env);
    if (!turnstile.ok) {
      return json({ ok: false, errors: [turnstile.error || "Turnstile verification failed."], warnings: validation.warnings, validation_report: validation.validation_report }, 403);
    }

    const pr = await createRecipePullRequest(validation.recipe, validation.warnings, env);
    return json({ ok: true, pullRequest: pr, warnings: validation.warnings, validation_report: validation.validation_report }, 201);
  } catch (error) {
    return json({ ok: false, error: error.message || "Unexpected error" }, 500);
  }
}

export async function onRequest() {
  return methodNotAllowed();
}
