const RECIPE_DIR = "_recipes";
const RECIPE_SCHEMA_VERSION = 1;
const ALLOWED_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const ALLOWED_STATUSES = new Set(["published", "planned", "draft"]);

export function buildRecipe(input, options = {}) {
  const errors = [];
  const warnings = [];

  if (input.website || input.company || input.url) {
    errors.push("Spam check failed.");
  }

  if (options.verifyTurnstile && !input.turnstileToken) {
    errors.push("Turnstile token is required.");
  }

  const title = cleanText(input.title, 120);
  const yieldValue = cleanText(input.yield || input.servings, 40);
  const preptime = normalizeDuration(input.preptime || input.prepTime);
  const cooktime = normalizeDuration(input.cooktime || input.cookTime);
  const totaltime = normalizeDuration(input.totaltime || input.totalTime);
  const difficulty = normalizeDifficulty(input.difficulty);
  const date_added = normalizeDate(input.date_added || input.dateAdded);
  const status = normalizeStatus(input.status);
  const reviewed = Boolean(input.reviewed);
  const notes = cleanText(input.notes, 600);
  const image = cleanText(input.image, 400);
  const imagecredit = cleanText(input.imagecredit || input.imageCredit, 400);
  const categories = cleanList(input.categories, 8, 40);
  const tags = cleanList(input.tags, 16, 40).map(slugifyTag).filter(Boolean);
  const ingredients = cleanGroups(input.ingredients, 12, 50, 180);
  const directions = cleanGroups(input.directions, 12, 60, 320);

  if (!title) errors.push("Title is required.");
  if (!yieldValue) warnings.push("Yield is missing.");
  if (!preptime) warnings.push("Prep time is missing or not an ISO-8601 duration like PT20M.");
  if (!cooktime) warnings.push("Cook time is missing or not an ISO-8601 duration like PT45M.");
  if (!totaltime) warnings.push("Total time is missing or not an ISO-8601 duration like PT1H5M.");
  if (input.difficulty && !difficulty) warnings.push("Difficulty must be Easy, Medium, or Hard.");
  if (input.status && !status) warnings.push("Status must be published, planned, or draft.");
  if (input.date_added && !date_added) warnings.push("Date added must use YYYY-MM-DD format.");
  if (!categories.length) warnings.push("Categories are missing.");
  if (!tags.length) warnings.push("Tags are missing.");
  if (!image) warnings.push("No image provided.");
  if (image && !imagecredit) warnings.push("Image provided without image credit.");
  if (!ingredients.length) errors.push("At least one ingredient is required.");
  if (!directions.length) errors.push("At least one direction is required.");

  const slug = slugify(title);
  if (!slug) errors.push("Title must produce a valid filename slug.");

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

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    recipe: {
      title,
      slug,
      path: `${RECIPE_DIR}/${slug}.md`,
      markdown
    },
    preview: markdown
  };
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
      const items = cleanList(entry.items, maxItems, maxLength).map(normalizeUnitsAndFractions);
      if (items.length) groups.push({ name, items });
    }
  }

  return groups;
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
