const RECIPE_DIR = "_recipes";
const RECIPE_SCHEMA_VERSION = 1;
const ALLOWED_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const ALLOWED_STATUSES = new Set(["published", "planned", "draft"]);

export function buildRecipe(input, options = {}) {
  const errors = [];
  const warnings = [];
  const validation_report = createValidationReport();

  if (input.website || input.company || input.url) {
    addValidationCheck(validation_report, errors, warnings, "error", "spam_check", "spam_check_failed", "Spam check failed.");
  } else {
    addValidationCheck(validation_report, errors, warnings, "pass", "spam_check", "spam_check_passed", "Spam check passed.");
  }

  if (options.verifyTurnstile && !input.turnstileToken) {
    addValidationCheck(validation_report, errors, warnings, "error", "turnstile", "turnstile_required", "Turnstile token is required.");
  } else if (options.verifyTurnstile) {
    addValidationCheck(validation_report, errors, warnings, "pass", "turnstile", "turnstile_present", "Turnstile token is present.");
  }

  const title = cleanText(input.title, 120);
  const yieldValue = cleanText(input.yield || input.servings, 40);
  const preptime = normalizeDuration(input.preptime || input.prepTime);
  const cooktime = normalizeDuration(input.cooktime || input.cookTime);
  const totaltime = normalizeDuration(input.totaltime || input.totalTime);
  const difficulty = normalizeDifficulty(input.difficulty);
  const submittedDate = input.date_added || input.dateAdded;
  const normalizedDate = normalizeDate(submittedDate);
  const date_added = normalizedDate || todayDate();
  const status = normalizeStatus(input.status);
  const reviewed = Boolean(input.reviewed);
  const notes = cleanText(input.notes, 600);
  const image = cleanText(input.image, 400);
  const imagecredit = cleanText(input.imagecredit || input.imageCredit, 400);
  const categories = cleanList(input.categories, 8, 40);
  const tags = cleanList(input.tags, 16, 40).map(slugifyTag).filter(Boolean);
  const ingredients = cleanGroups(input.ingredients, 12, 50, 180);
  const directions = cleanGroups(input.directions, 12, 60, 320);

  if (title) {
    addValidationCheck(validation_report, errors, warnings, "pass", "title", "title_present", "Title is present.");
  } else {
    addValidationCheck(validation_report, errors, warnings, "error", "title", "title_required", "Title is required.");
  }

  if (yieldValue) {
    addValidationCheck(validation_report, errors, warnings, "pass", "yield", "yield_present", "Yield is present.");
  } else {
    addValidationCheck(validation_report, errors, warnings, "warning", "yield", "yield_missing", "Yield is missing.");
  }

  validateDuration(validation_report, errors, warnings, "preptime", input.preptime || input.prepTime, preptime, "Prep time is missing or not an ISO-8601 duration like PT20M.");
  validateDuration(validation_report, errors, warnings, "cooktime", input.cooktime || input.cookTime, cooktime, "Cook time is missing or not an ISO-8601 duration like PT45M.");
  validateDuration(validation_report, errors, warnings, "totaltime", input.totaltime || input.totalTime, totaltime, "Total time is missing or not an ISO-8601 duration like PT1H5M.");

  if (input.difficulty && !difficulty) {
    addValidationCheck(validation_report, errors, warnings, "warning", "difficulty", "difficulty_invalid", "Difficulty must be Easy, Medium, or Hard.");
  } else if (difficulty) {
    addValidationCheck(validation_report, errors, warnings, "pass", "difficulty", "difficulty_valid", "Difficulty is valid.");
  }

  if (input.status && !status) {
    addValidationCheck(validation_report, errors, warnings, "warning", "status", "status_invalid", "Status must be published, planned, or draft.");
  } else if (status) {
    addValidationCheck(validation_report, errors, warnings, "pass", "status", "status_valid", "Status is valid.");
  }

  if (submittedDate && !normalizedDate) {
    addValidationCheck(validation_report, errors, warnings, "warning", "date_added", "date_added_invalid", "Date added must use YYYY-MM-DD format. Using today's date instead.");
  } else if (date_added) {
    addValidationCheck(validation_report, errors, warnings, "pass", "date_added", "date_added_valid", "Date added is valid.");
  }

  if (categories.length) {
    addValidationCheck(validation_report, errors, warnings, "pass", "categories", "categories_present", "Categories are present.");
  } else {
    addValidationCheck(validation_report, errors, warnings, "warning", "categories", "categories_missing", "Categories are missing.");
  }

  if (tags.length) {
    addValidationCheck(validation_report, errors, warnings, "pass", "tags", "tags_present", "Tags are present.");
  } else {
    addValidationCheck(validation_report, errors, warnings, "warning", "tags", "tags_missing", "Tags are missing.");
  }

  if (!image) {
    addValidationCheck(validation_report, errors, warnings, "warning", "image", "image_missing", "No image provided.");
  } else if (!imagecredit) {
    addValidationCheck(validation_report, errors, warnings, "warning", "imagecredit", "image_credit_missing", "Image provided without image credit.");
  } else {
    addValidationCheck(validation_report, errors, warnings, "pass", "image", "image_and_credit_present", "Image and image credit are present.");
  }

  validateGroups(validation_report, errors, warnings, "ingredients", input.ingredients, ingredients, "At least one ingredient is required.");
  validateGroups(validation_report, errors, warnings, "directions", input.directions, directions, "At least one direction is required.");

  const slug = slugify(title);
  if (slug) {
    addValidationCheck(validation_report, errors, warnings, "pass", "slug", "slug_valid", `Recipe filename will be ${RECIPE_DIR}/${slug}.md.`);
  } else {
    addValidationCheck(validation_report, errors, warnings, "error", "slug", "slug_invalid", "Title must produce a valid filename slug.");
  }

  addValidationCheck(validation_report, errors, warnings, "pass", "layout", "layout_valid", "Generated layout field is valid.");
  addValidationCheck(validation_report, errors, warnings, "pass", "recipe_schema", "recipe_schema_valid", `Generated recipe_schema is ${RECIPE_SCHEMA_VERSION}.`);

  const recipeData = {
    layout: "recipe",
    recipe_schema: RECIPE_SCHEMA_VERSION,
    title,
    image,
    imagecredit,
    categories,
    tags,
    date_added,
    status,
    reviewed,
    yield: yieldValue,
    preptime,
    cooktime,
    totaltime,
    difficulty,
    notes,
    ingredients,
    directions
  };

  const markdown = formatRecipeMarkdown(recipeData);
  finalizeValidationReport(validation_report);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    validation_report,
    recipe: {
      title,
      slug,
      path: `${RECIPE_DIR}/${slug}.md`,
      markdown
    },
    preview: markdown
  };
}

export function addValidationCheck(report, errors, warnings, status, field, code, message) {
  const check = { status, field, code, message };
  report.checks.push(check);

  if (status === "error") errors.push(message);
  if (status === "warning") warnings.push(message);

  return check;
}

export function finalizeValidationReport(report) {
  report.ok = !report.checks.some((check) => check.status === "error");
  report.summary = report.checks.reduce((summary, check) => {
    if (check.status === "error") summary.errors += 1;
    if (check.status === "warning") summary.warnings += 1;
    if (check.status === "pass") summary.passes += 1;
    return summary;
  }, { errors: 0, warnings: 0, passes: 0 });
  return report;
}

export function formatRecipeMarkdown(recipe) {
  const lines = [
    "---",
    "layout: recipe",
    `recipe_schema: ${RECIPE_SCHEMA_VERSION}`,
    `title: ${yamlString(recipe.title)}`
  ];

  if (recipe.image) lines.push(`image: ${yamlString(recipe.image)}`);
  if (recipe.imagecredit) lines.push(`imagecredit: ${yamlString(recipe.imagecredit)}`);

  appendList(lines, "categories", recipe.categories);
  appendList(lines, "tags", recipe.tags);

  appendOptionalString(lines, "date_added", recipe.date_added);
  appendOptionalString(lines, "status", recipe.status);
  if (recipe.reviewed) lines.push("reviewed: true");
  appendOptionalString(lines, "yield", recipe.yield);
  appendOptionalString(lines, "preptime", recipe.preptime);
  appendOptionalString(lines, "cooktime", recipe.cooktime);
  appendOptionalString(lines, "totaltime", recipe.totaltime);
  appendOptionalString(lines, "difficulty", recipe.difficulty);

  if (recipe.notes) {
    lines.push("notes: >");
    wrapText(recipe.notes, 76).forEach((line) => lines.push(`  ${line}`));
  }

  lines.push("ingredients:");
  appendGroups(lines, recipe.ingredients);
  lines.push("directions:");
  appendGroups(lines, recipe.directions);
  lines.push("---");

  return `${lines.join("\n")}\n`;
}

function createValidationReport() {
  return {
    ok: false,
    summary: { errors: 0, warnings: 0, passes: 0 },
    checks: []
  };
}

function validateDuration(report, errors, warnings, field, rawValue, normalizedValue, message) {
  if (normalizedValue) {
    addValidationCheck(report, errors, warnings, "pass", field, `${field}_valid`, `${field} is a valid ISO-8601 duration.`);
    return;
  }

  addValidationCheck(report, errors, warnings, "warning", field, `${field}_missing_or_invalid`, message);
}

function validateGroups(report, errors, warnings, field, rawGroups, groups, requiredMessage) {
  if (!groups.length) {
    addValidationCheck(report, errors, warnings, "error", field, `${field}_required`, requiredMessage);
    return;
  }

  if (hasEmptyGroups(rawGroups)) {
    addValidationCheck(report, errors, warnings, "error", field, `${field}_empty_group`, `${field} cannot include empty groups.`);
    return;
  }

  addValidationCheck(report, errors, warnings, "pass", field, `${field}_valid`, `${field} are present and groups are non-empty.`);
}

function appendOptionalString(lines, key, value) {
  if (value) lines.push(`${key}: ${yamlString(value)}`);
}

function appendList(lines, key, values) {
  if (!values || !values.length) return;
  lines.push(`${key}:`);
  values.forEach((value) => lines.push(`  - ${yamlString(value)}`));
}

function appendGroups(lines, groups) {
  groups.forEach((group) => {
    if (group.name) {
      lines.push(`  - ${yamlKey(group.name)}:`);
      group.items.forEach((item) => lines.push(`    - ${yamlString(item)}`));
    } else {
      group.items.forEach((item) => lines.push(`  - ${yamlString(item)}`));
    }
  });
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/\r/g, "").trim().slice(0, maxLength);
}

function cleanList(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

function cleanGroups(value, maxGroups, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];

  const groups = [];
  for (const entry of value.slice(0, maxGroups)) {
    if (typeof entry === "string") {
      const item = normalizeUnitsAndFractions(cleanText(entry, maxLength));
      if (item) groups.push({ name: "", items: [item] });
      continue;
    }

    if (entry && typeof entry === "object") {
      const name = cleanText(entry.name, 60);
      const items = cleanList(entry.items, maxItems, maxLength).map(normalizeUnitsAndFractions).filter(Boolean);
      if (items.length) groups.push({ name, items });
    }
  }

  return groups;
}

function hasEmptyGroups(value) {
  if (!Array.isArray(value)) return false;

  return value.some((entry) => {
    if (!entry || typeof entry !== "object" || typeof entry === "string") return false;
    return Array.isArray(entry.items) && entry.items.length === 0;
  });
}

function normalizeDuration(value) {
  const duration = cleanText(value, 20).toUpperCase();
  return /^PT(?=\d)(?:(\d+)H)?(?:(\d+)M)?$/.test(duration) ? duration : "";
}

function normalizeDifficulty(value) {
  const difficulty = cleanText(value, 20);
  if (!difficulty) return "";
  const normalized = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  return ALLOWED_DIFFICULTIES.has(normalized) ? normalized : "";
}

function normalizeStatus(value) {
  const status = cleanText(value, 20).toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : "";
}

function normalizeDate(value) {
  const date = cleanText(value, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeUnitsAndFractions(value) {
  return String(value || "")
    .replace(/\bounces?\b/gi, "oz")
    .replace(/\bpounds?\b/gi, "lb")
    .replace(/1\/8/g, "⅛")
    .replace(/1\/4/g, "¼")
    .replace(/1\/3/g, "⅓")
    .replace(/1\/2/g, "½")
    .replace(/2\/3/g, "⅔")
    .replace(/3\/4/g, "¾");
}

function slugify(value) {
  return cleanText(value, 140)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function slugifyTag(value) {
  return slugify(value).slice(0, 40);
}

function yamlString(value) {
  return JSON.stringify(String(value || ""));
}

function yamlKey(value) {
  const key = String(value || "").replace(/:/g, "").trim();
  return key || "Group";
}

function wrapText(value, width) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    if ((line + " " + word).trim().length > width) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }

  if (line) lines.push(line);
  return lines;
}
