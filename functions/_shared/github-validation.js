const DEFAULT_BASE_BRANCH = "main";

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
