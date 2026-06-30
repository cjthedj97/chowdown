const DEFAULT_BASE_BRANCH = "main";
const RECIPE_DIR = "_recipes";
const BRANCH_PREFIX = "recipe-submissions";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), env);
    }

    const url = new URL(request.url);

    try {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed" }, 405, env);
      }

      if (url.pathname === "/api/recipes/preview") {
        const submission = await readSubmission(request);
        const result = buildRecipe(submission, { verifyTurnstile: false });
        return json(result.ok ? result : { ok: false, errors: result.errors, warnings: result.warnings }, result.ok ? 200 : 400, env);
      }

      if (url.pathname === "/api/recipes/submit") {
        const submission = await readSubmission(request);
        const validation = buildRecipe(submission, { verifyTurnstile: true });

        if (!validation.ok) {
          return json({ ok: false, errors: validation.errors, warnings: validation.warnings }, 400, env);
        }

        const turnstile = await verifyTurnstile(submission.turnstileToken, request, env);
        if (!turnstile.ok) {
          return json({ ok: false, errors: ["Turnstile verification failed."], warnings: validation.warnings }, 403, env);
        }

        const pr = await createRecipePullRequest(validation.recipe, env);
        return json({ ok: true, pullRequest: pr, warnings: validation.warnings }, 201, env);
      }

      return json({ ok: false, error: "Not found" }, 404, env);
    } catch (error) {
      return json({ ok: false, error: error.message || "Unexpected error" }, 500, env);
    }
  }
};

async function readSubmission(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64_000) {
    throw new Error("Submission is too large.");
  }

  const body = await request.json();
  return body || {};
}

function buildRecipe(input, options = {}) {
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
  const notes = cleanText(input.notes, 600);
  const image = cleanText(input.image, 400);
  const imagecredit = cleanText(input.imagecredit || input.imageCredit, 400);
  const categories = cleanList(input.categories, 8, 40);
  const tags = cleanList(input.tags, 16, 40).map(slugifyTag);
  const ingredients = cleanGroups(input.ingredients, 12, 50, 180);
  const directions = cleanGroups(input.directions, 12, 60, 320);

  if (!title) errors.push("Title is required.");
  if (!yieldValue) warnings.push("Yield is missing.");
  if (!preptime) warnings.push("Prep time is missing or not an ISO-8601 duration like PT20M.");
  if (!cooktime) warnings.push("Cook time is missing or not an ISO-8601 duration like PT45M.");
  if (!totaltime) warnings.push("Total time is missing or not an ISO-8601 duration like PT1H5M.");
  if (!image) warnings.push("No image provided.");
  if (image && !imagecredit) warnings.push("Image provided without image credit.");
  if (!ingredients.length) errors.push("At least one ingredient is required.");
  if (!directions.length) errors.push("At least one direction is required.");

  const slug = slugify(title);
  if (!slug) errors.push("Title must produce a valid filename slug.");

  const markdown = renderRecipeMarkdown({
    title,
    image,
    imagecredit,
    categories,
    tags,
    yield: yieldValue,
    preptime,
    cooktime,
    totaltime,
    notes,
    ingredients,
    directions
  });

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

function renderRecipeMarkdown(recipe) {
  const lines = [
    "---",
    "layout: recipe",
    `title: ${yamlString(recipe.title)}`,
    `image: ${recipe.image ? yamlString(recipe.image) : ""}`,
    `imagecredit: ${recipe.imagecredit ? yamlString(recipe.imagecredit) : ""}`
  ];

  lines.push("categories:");
  if (recipe.categories.length) {
    recipe.categories.forEach((category) => lines.push(`  - ${yamlString(category)}`));
  } else {
    lines.push("  - Uncategorized");
  }

  lines.push("tags:");
  if (recipe.tags.length) {
    recipe.tags.forEach((tag) => lines.push(`  - ${yamlString(tag)}`));
  } else {
    lines.push("  - recipe");
  }

  lines.push(`yield: ${yamlString(recipe.yield || "")}`);
  if (recipe.preptime) lines.push(`preptime: ${yamlString(recipe.preptime)}`);
  if (recipe.cooktime) lines.push(`cooktime: ${yamlString(recipe.cooktime)}`);
  if (recipe.totaltime) lines.push(`totaltime: ${yamlString(recipe.totaltime)}`);
  if (recipe.notes) {
    lines.push("notes: >");
    wrapText(recipe.notes, 76).forEach((line) => lines.push(`  ${line}`));
  }

  lines.push("ingredients:");
  renderGroups(lines, recipe.ingredients);
  lines.push("directions:");
  renderGroups(lines, recipe.directions);
  lines.push("---");
  return `${lines.join("\n")}\n`;
}

function renderGroups(lines, groups) {
  groups.forEach((group) => {
    if (group.name) {
      lines.push(`  - ${yamlKey(group.name)}:`);
      group.items.forEach((item) => lines.push(`    - ${yamlString(item)}`));
    } else {
      group.items.forEach((item) => lines.push(`  - ${yamlString(item)}`));
    }
  });
}

async function verifyTurnstile(token, request, env) {
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

async function createRecipePullRequest(recipe, env) {
  const owner = env.GITHUB_OWNER || "cjthedj97";
  const repo = env.GITHUB_REPO || "chowdown";
  const base = env.GITHUB_BASE_BRANCH || DEFAULT_BASE_BRANCH;
  const token = env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured.");
  }

  const branch = `${BRANCH_PREFIX}/${recipe.slug}-${Date.now()}`;
  const repoPath = `/repos/${owner}/${repo}`;
  const baseRef = await github(`${repoPath}/git/ref/heads/${base}`, { token });
  const baseSha = baseRef.object.sha;

  await github(`${repoPath}/git/refs`, {
    token,
    method: "POST",
    body: {
      ref: `refs/heads/${branch}`,
      sha: baseSha
    }
  });

  const existing = await github(`${repoPath}/contents/${encodeURIComponentPath(recipe.path)}?ref=${encodeURIComponent(base)}`, {
    token,
    allow404: true
  });

  if (existing && !existing.notFound) {
    throw new Error(`A recipe already exists at ${recipe.path}.`);
  }

  await github(`${repoPath}/contents/${encodeURIComponentPath(recipe.path)}`, {
    token,
    method: "PUT",
    body: {
      message: `Add ${recipe.title} recipe`,
      content: btoaUtf8(recipe.markdown),
      branch
    }
  });

  const prBody = [
    "## Recipe submission",
    "",
    `Adds: ${recipe.title}`,
    "",
    "## Validation",
    "",
    "✅ Generated recipe Markdown from structured form data",
    "✅ Required fields validated before commit",
    "✅ Honeypot field checked before GitHub write",
    "✅ Turnstile checked before GitHub write",
    "✅ Duplicate filename checked against the base branch",
    "",
    "## Notes",
    "",
    "This PR was opened by the recipe submission Worker draft. Review the generated Markdown and Cloudflare Pages preview before merging."
  ].join("\n");

  const pr = await github(`${repoPath}/pulls`, {
    token,
    method: "POST",
    body: {
      title: `Add ${recipe.title} recipe`,
      head: branch,
      base,
      body: prBody,
      maintainer_can_modify: true
    }
  });

  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    branch,
    path: recipe.path
  };
}

async function github(path, options) {
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method || "GET",
    headers: {
      "accept": "application/vnd.github+json",
      "authorization": `Bearer ${options.token}`,
      "content-type": "application/json",
      "user-agent": "recipe-submission-worker",
      "x-github-api-version": "2022-11-28"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (options.allow404 && response.status === 404) {
    return { notFound: true };
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data && data.message ? data.message : `GitHub API error ${response.status}`;
    throw new Error(message);
  }

  return data;
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
      const item = cleanText(entry, maxLength);
      if (item) groups.push({ name: "", items: [item] });
      continue;
    }

    if (entry && typeof entry === "object") {
      const name = cleanText(entry.name, 60);
      const items = cleanList(entry.items, maxItems, maxLength);
      if (items.length) groups.push({ name, items });
    }
  }

  return groups;
}

function normalizeDuration(value) {
  const duration = cleanText(value, 20).toUpperCase();
  return /^PT(?=\d)(?:(\d+)H)?(?:(\d+)M)?$/.test(duration) ? duration : "";
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

function encodeURIComponentPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function btoaUtf8(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function json(payload, status, env) {
  return withCors(new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  }), env);
}

function withCors(response, env) {
  const allowedOrigin = env.ALLOWED_ORIGIN || "*";
  response.headers.set("access-control-allow-origin", allowedOrigin);
  response.headers.set("access-control-allow-methods", "POST, OPTIONS");
  response.headers.set("access-control-allow-headers", "content-type");
  return response;
}
