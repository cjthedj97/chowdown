import { checkRecipeFileExists } from "../../_shared/github-validation.js";
import { addValidationCheck, buildRecipe, finalizeValidationReport } from "../../_shared/recipe.js";
import { json, methodNotAllowed, optionsResponse, readSubmission } from "../../_shared/http.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost({ request, env }) {
  try {
    const submission = await readSubmission(request);
    const result = buildRecipe(submission, { verifyTurnstile: false });

    if (result.recipe && result.recipe.path && result.recipe.slug) {
      await addDuplicatePathCheck(result, env);
    }

    if (!result.ok) {
      return json({ ok: false, errors: result.errors, warnings: result.warnings, validation_report: result.validation_report }, 400);
    }

    return json(result);
  } catch (error) {
    return json({ ok: false, error: error.message || "Unexpected error" }, 500);
  }
}

export async function onRequest() {
  return methodNotAllowed();
}

async function addDuplicatePathCheck(result, env) {
  const duplicate = await checkRecipeFileExists(result.recipe, env);

  if (duplicate.checked && duplicate.exists) {
    addValidationCheck(result.validation_report, result.errors, result.warnings, "error", "slug", "duplicate_recipe_path", `A recipe already exists at ${duplicate.path}.`);
  } else if (duplicate.checked) {
    addValidationCheck(result.validation_report, result.errors, result.warnings, "pass", "slug", "duplicate_recipe_path_clear", `No recipe file exists yet at ${duplicate.path}.`);
  } else {
    addValidationCheck(result.validation_report, result.errors, result.warnings, "warning", "slug", "duplicate_recipe_path_unchecked", duplicate.error || "Could not check for a duplicate recipe filename.");
  }

  finalizeValidationReport(result.validation_report);
  result.ok = result.errors.length === 0;
}
