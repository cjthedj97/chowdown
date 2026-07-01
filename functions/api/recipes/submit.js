import { createRecipePullRequest } from "../../_shared/github.js";
import { findSimilarRecipeMatches } from "../../_shared/github-validation.js";
import { addValidationCheck, buildRecipe, finalizeValidationReport } from "../../_shared/recipe.js";
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

    await addSimilarRecipeChecks(validation, env);

    const pr = await createRecipePullRequest(validation.recipe, validation.warnings, env);
    return json({ ok: true, pullRequest: pr, warnings: validation.warnings, validation_report: validation.validation_report }, 201);
  } catch (error) {
    return json({ ok: false, error: error.message || "Unexpected error" }, 500);
  }
}

export async function onRequest() {
  return methodNotAllowed();
}

async function addSimilarRecipeChecks(validation, env) {
  const similar = await findSimilarRecipeMatches(validation.recipe, env);

  if (!similar.checked) {
    addValidationCheck(validation.validation_report, validation.errors, validation.warnings, "warning", "title", "similar_recipe_unchecked", similar.error || "Could not check for similar recipe titles.");
  } else if (similar.matches.length) {
    const matches = similar.matches
      .map((match) => `${match.title} (${match.path})`)
      .join("; ");
    addValidationCheck(validation.validation_report, validation.errors, validation.warnings, "warning", "title", "similar_recipe_found", `Possible duplicate recipe found: ${matches}. You can still submit if this is intentionally different.`);
  } else {
    addValidationCheck(validation.validation_report, validation.errors, validation.warnings, "pass", "title", "similar_recipe_clear", "No similar recipe titles were found.");
  }

  finalizeValidationReport(validation.validation_report);
  validation.ok = validation.errors.length === 0;
}
