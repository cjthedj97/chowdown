const DEFAULT_BASE_BRANCH = "main";
const RECIPE_DIR = "_recipes";
const MAX_SIMILAR_MATCHES = 5;

export async function checkRecipeFileExists(recipe, env) {
  const owner = env.GITHUB_OWNER || "cjthedj97";
  const repo = env.GITHUB_REPO || "chowdown";
  const base = env.GITHUB_BASE_BRANCH || DEFAULT_BASE_BRANCH;
  const token = env.GITHUB_TOKEN;
  const path = `/repos/${owner}/${repo}/contents/${encodeURIComponentPath(recipe.path)}?ref=${encodeURIComponent(base)}`;
  const response = await fetch(`https://api.github.com${path}`, {
    headers: buildHeaders(token)
  });

  if (response.status === 404) {
    return {
      checked: true,
      exists: false,
      path: recipe.path,
      branch: base
    };
  }

  if (!response.ok) {
    return {
      checked: false,
      exists: false,
      path: recipe.path,
      branch: base,
      error: `GitHub duplicate check failed with status ${response.status}.`
    };
  }

  return {
    checked: true,
    exists: true,
    path: recipe.path,
    branch: base
  };
}

export async function findSimilarRecipeMatches(recipe, env) {
  const owner = env.GITHUB_OWNER || "cjthedj97";
  const repo = env.GITHUB_REPO || "chowdown";
  const base = env.GITHUB_BASE_BRANCH || DEFAULT_BASE_BRANCH;
  const token = env.GITHUB_TOKEN;
  const path = `/repos/${owner}/${repo}/contents/${RECIPE_DIR}?ref=${encodeURIComponent(base)}`;
  const response = await fetch(`https://api.github.com${path}`, {
    headers: buildHeaders(token)
  });

  if (!response.ok) {
    return {
      checked: false,
      branch: base,
      matches: [],
      error: `GitHub similar recipe check failed with status ${response.status}.`
    };
  }

  const files = await response.json();
  if (!Array.isArray(files)) {
    return {
      checked: false,
      branch: base,
      matches: [],
      error: "GitHub similar recipe check returned an unexpected response."
    };
  }

  const incoming = recipeFingerprint(recipe.title || titleFromPath(recipe.path), recipe.path);
  const matches = files
    .filter((file) => file && file.type === "file" && file.path && file.path.endsWith(".md"))
    .filter((file) => file.path !== recipe.path)
    .map((file) => {
      const title = titleFromPath(file.path);
      const existing = recipeFingerprint(title, file.path);
      const titleScore = similarity(incoming.normalizedTitle, existing.normalizedTitle);
      const slugScore = similarity(incoming.normalizedSlug, existing.normalizedSlug);
      const tokenScore = tokenSimilarity(incoming.tokens, existing.tokens);
      const score = Math.max(titleScore, slugScore, tokenScore);
      const kind = duplicateKind(incoming, existing, score);

      return {
        title,
        path: file.path,
        kind,
        score
      };
    })
    .filter((match) => match.kind)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, MAX_SIMILAR_MATCHES);

  return {
    checked: true,
    branch: base,
    matches
  };
}

function duplicateKind(incoming, existing, score) {
  if (incoming.normalizedTitle && incoming.normalizedTitle === existing.normalizedTitle) return "matching title";
  if (incoming.normalizedSlug && incoming.normalizedSlug === existing.normalizedSlug) return "matching filename";
  if (incoming.tokens.length >= 2 && existing.tokens.length >= 2 && score >= 0.82) return "similar title";
  return "";
}

function recipeFingerprint(title, path) {
  const normalizedTitle = normalizeTitle(title);
  const normalizedSlug = normalizeTitle(slugFromPath(path));
  const tokens = tokenize(`${normalizedTitle} ${normalizedSlug}`);

  return {
    normalizedTitle,
    normalizedSlug,
    tokens
  };
}

function titleFromPath(path) {
  return slugFromPath(path)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function slugFromPath(path) {
  return String(path || "")
    .split("/")
    .pop()
    .replace(/\.md$/i, "")
    .trim();
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|and|or|with|of|for|to)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const seen = new Set();
  return normalizeTitle(value)
    .split(" ")
    .filter((token) => token.length > 1)
    .filter((token) => {
      if (seen.has(token)) return false;
      seen.add(token);
      return true;
    });
}

function similarity(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 1;

  const distance = levenshtein(left, right);
  return 1 - (distance / Math.max(left.length, right.length));
}

function tokenSimilarity(leftTokens, rightTokens) {
  if (!leftTokens.length || !rightTokens.length) return 0;

  const left = new Set(leftTokens);
  const right = new Set(rightTokens);
  let intersection = 0;

  left.forEach((token) => {
    if (right.has(token)) intersection += 1;
  });

  return intersection / new Set([...left, ...right]).size;
}

function levenshtein(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let i = 0; i < left.length; i += 1) {
    let current = [i + 1];

    for (let j = 0; j < right.length; j += 1) {
      const insert = current[j] + 1;
      const remove = previous[j + 1] + 1;
      const replace = previous[j] + (left[i] === right[j] ? 0 : 1);
      current.push(Math.min(insert, remove, replace));
    }

    for (let j = 0; j < current.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
}

function buildHeaders(token) {
  const headers = {
    "accept": "application/vnd.github+json",
    "user-agent": "recipe-validation-pages-function",
    "x-github-api-version": "2022-11-28"
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  return headers;
}

function encodeURIComponentPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}
