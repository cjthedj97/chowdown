import { checkRecipeFileExists, findSimilarRecipeMatches } from "../../_shared/github-validation.js";
import { addValidationCheck, buildRecipe, finalizeValidationReport } from "../../_shared/recipe.js";
import { json, methodNotAllowed, optionsResponse, readSubmission } from "../../_shared/http.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost({ request, env }) {
  try {
    const submission = await readSubmission(request);
    const result = buildRecipe(submission, { verifyTurnstile: false });

    if (isEditSubmission(submission)) {
      addEditPathCheck(result, submission);
    } else if (result.recipe && result.recipe.path && result.recipe.slug) {
      await addDuplicatePathCheck(result, env);
      await addSimilarRecipeChecks(result, env);
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

function isEditSubmission(submission) {
  return submission.mode === "edit" || Boolean(submission.original_path || submission.originalPath);
}

function addEditPathCheck(result, submission) {
  const originalPath = submission.original_path || submission.originalPath || "the original recipe file";
  addValidationCheck(result.validation_report, result.errors, result.warnings, "pass", "slug", "edit_recipe_path", `Edit mode will update ${originalPath}; duplicate filename checks are skipped for the existing recipe.`);
  finalizeValidationReport(result.validation_report);
  result.ok = result.errors.length === 0;
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

async function addSimilarRecipeChecks(result, env) {
  const similar = await findSimilarRecipeMatches(result.recipe, env);

  if (!similar.checked) {
    addValidationCheck(result.validation_report, result.errors, result.warnings, "warning", "title", "similar_recipe_unchecked", similar.error || "Could not check for similar recipe titles.");
  } else if (similar.matches.length) {
    const matches = similar.matches
      .map((match) => `${match.title} (${match.path})`)
      .join("; ");
    addValidationCheck(result.validation_report, result.errors, result.warnings, "warning", "title", "similar_recipe_found", `Possible duplicate recipe found: ${matches}. You can still submit if this is intentionally different.`);
  } else {
    addValidationCheck(result.validation_report, result.errors, result.warnings, "pass", "title", "similar_recipe_clear", "No similar recipe titles were found.");
  }

  finalizeValidationReport(result.validation_report);
  result.ok = result.errors.length === 0;
}
