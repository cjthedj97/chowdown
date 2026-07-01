const DEFAULT_BASE_BRANCH = "main";
const BRANCH_PREFIX = "recipe-edits";
const REPLACED_FRONT_MATTER_KEYS = new Set([
  "layout",
  "recipe_schema",
  "title",
  "image",
  "imagecredit",
  "categories",
  "tags",
  "date_added",
  "status",
  "reviewed",
  "yield",
  "preptime",
  "cooktime",
  "totaltime",
  "difficulty",
  "notes",
  "ingredients",
  "directions"
]);

export async function createRecipeEditPullRequest(recipe, warnings, env, editRequest = {}) {
  const owner = env.GITHUB_OWNER || "cjthedj97";
  const repo = env.GITHUB_REPO || "chowdown";
  const base = env.GITHUB_BASE_BRANCH || DEFAULT_BASE_BRANCH;
  const token = env.GITHUB_TOKEN;
  const originalPath = normalizeRecipePath(editRequest.original_path || editRequest.originalPath);
  const originalTitle = cleanText(editRequest.original_title || editRequest.originalTitle, 120) || recipe.title;

  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured.");
  }

  if (!originalPath) {
    throw new Error("Original recipe path is required for edits.");
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

  const existing = await github(`${repoPath}/contents/${encodeURIComponentPath(originalPath)}?ref=${encodeURIComponent(base)}`, {
    token,
    allow404: true
  });

  if (!existing || existing.notFound) {
    throw new Error(`Recipe not found at ${originalPath}.`);
  }

  const originalMarkdown = atobUtf8(existing.content || "");
  const nextMarkdown = mergePreservedFrontMatter(originalMarkdown, recipe.markdown);
  const changedFields = summarizeChangedFields(originalMarkdown, nextMarkdown);

  await github(`${repoPath}/contents/${encodeURIComponentPath(originalPath)}`, {
    token,
    method: "PUT",
    body: {
      message: `Update ${recipe.title} recipe`,
      content: btoaUtf8(nextMarkdown),
      sha: existing.sha,
      branch
    }
  });

  const validationLines = [
    "✅ Generated updated recipe Markdown from structured form data",
    "✅ Required fields validated before commit",
    "✅ Spam-check field checked before GitHub write",
    "✅ Turnstile checked before GitHub write",
    "✅ Existing recipe file checked against the base branch"
  ];

  if (warnings && warnings.length) {
    validationLines.push("", "### Warnings", "", ...warnings.map((warning) => `- ${warning}`));
  }

  const changedFieldLines = changedFields.length
    ? changedFields.map((field) => `- ${field}`)
    : ["- No simple front matter field changes detected; review the file diff for details."];

  const prBody = [
    "## Recipe edit",
    "",
    `Original recipe: ${originalTitle}`,
    `Updated recipe: ${recipe.title}`,
    `File: ${originalPath}`,
    "",
    "## Changed fields",
    "",
    ...changedFieldLines,
    "",
    "## Validation",
    "",
    ...validationLines,
    "",
    "## Notes",
    "",
    "This PR was opened by the recipe edit Pages Function. Review the generated Markdown and Cloudflare Pages preview before merging.",
    "",
    "Related roadmap issues: #69, #72"
  ].join("\n");

  const pr = await github(`${repoPath}/pulls`, {
    token,
    method: "POST",
    body: {
      title: `Update ${recipe.title} recipe`,
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
    path: originalPath
  };
}

async function github(path, options) {
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method || "GET",
    headers: {
      "accept": "application/vnd.github+json",
      "authorization": `Bearer ${options.token}`,
      "content-type": "application/json",
      "user-agent": "recipe-edit-pages-function",
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

function mergePreservedFrontMatter(originalMarkdown, nextMarkdown) {
  const original = splitFrontMatter(originalMarkdown);
  const next = splitFrontMatter(nextMarkdown);

  if (!original || !next) return nextMarkdown;

  const preservedBlocks = frontMatterBlocks(original.frontMatter)
    .filter((block) => block.key && !REPLACED_FRONT_MATTER_KEYS.has(block.key));

  if (!preservedBlocks.length && !original.body) return nextMarkdown;

  const lines = next.frontMatter.split("\n");
  const insertIndex = findInsertIndex(lines, "ingredients");
  const preservedLines = preservedBlocks.flatMap((block) => block.lines);

  if (preservedLines.length) {
    lines.splice(insertIndex, 0, ...preservedLines);
  }

  const body = original.body ? `\n${original.body.replace(/^\n+/, "")}` : "";
  return `---\n${lines.join("\n")}\n---\n${body}`;
}

function summarizeChangedFields(originalMarkdown, nextMarkdown) {
  const original = splitFrontMatter(originalMarkdown);
  const next = splitFrontMatter(nextMarkdown);
  if (!original || !next) return [];

  const originalBlocks = blockMap(frontMatterBlocks(original.frontMatter));
  const nextBlocks = blockMap(frontMatterBlocks(next.frontMatter));
  const fields = [];

  REPLACED_FRONT_MATTER_KEYS.forEach((key) => {
    if ((originalBlocks.get(key) || "") !== (nextBlocks.get(key) || "")) {
      fields.push(key);
    }
  });

  return fields;
}

function splitFrontMatter(markdown) {
  const value = String(markdown || "");
  if (!value.startsWith("---\n")) return null;

  const end = value.indexOf("\n---", 4);
  if (end === -1) return null;

  return {
    frontMatter: value.slice(4, end),
    body: value.slice(end + 4)
  };
}

function frontMatterBlocks(frontMatter) {
  const lines = String(frontMatter || "").split("\n");
  const blocks = [];
  let current = null;

  lines.forEach((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):/);
    if (match) {
      current = { key: match[1], lines: [line] };
      blocks.push(current);
      return;
    }

    if (current) current.lines.push(line);
  });

  return blocks;
}

function blockMap(blocks) {
  const map = new Map();
  blocks.forEach((block) => map.set(block.key, block.lines.join("\n").trim()));
  return map;
}

function findInsertIndex(lines, key) {
  const index = lines.findIndex((line) => line.startsWith(`${key}:`));
  return index === -1 ? lines.length : index;
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/\r/g, "").trim().slice(0, maxLength);
}

function normalizeRecipePath(value) {
  const path = cleanText(value, 200);
  if (!path.startsWith("_recipes/") || !path.endsWith(".md")) return "";
  if (path.includes("..") || path.includes("//")) return "";
  return path;
}

function encodeURIComponentPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function btoaUtf8(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function atobUtf8(value) {
  return decodeURIComponent(escape(atob(String(value || "").replace(/\s/g, ""))));
}
