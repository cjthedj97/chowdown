import { createRecipeEditPullRequest } from "../../_shared/github-edit.js";
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
      return json({ ok: false, errors: validation.errors, warnings: validation.warnings }, 400);
    }

    const turnstile = await verifyTurnstile(submission.turnstileToken, request, env);
    if (!turnstile.ok) {
      return json({ ok: false, errors: [turnstile.error || "Turnstile verification failed."], warnings: validation.warnings }, 403);
    }

    const editRequest = {
      original_path: submission.original_path,
      original_title: submission.original_title
    };
    const pr = await createRecipeEditPullRequest(validation.recipe, validation.warnings, env, editRequest);
    return json({ ok: true, pullRequest: pr, warnings: validation.warnings }, 201);
  } catch (error) {
    return json({ ok: false, error: error.message || "Unexpected error" }, 500);
  }
}

export async function onRequest() {
  return methodNotAllowed();
}
