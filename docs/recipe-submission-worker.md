# Recipe Submission Worker Draft

This branch adds a draft Cloudflare Worker flow for public recipe submissions that open GitHub pull requests instead of writing directly to `main`.

## Goals

- Let visitors submit structured recipe data.
- Generate Markdown compatible with the existing `layout: recipe` format.
- Provide a preview endpoint before anything is committed.
- Use Cloudflare Turnstile and a honeypot field for lightweight anti-abuse.
- Validate input server-side before touching GitHub.
- Create a recipe branch and open a pull request for human review.

## Files

- `workers/recipe-submission-worker.js` — Worker API with `/api/recipes/preview` and `/api/recipes/submit`.
- `submit-recipe.html` — Draft Jekyll page with a form, Markdown preview, Turnstile widget, and honeypot field.

## Worker routes

### `POST /api/recipes/preview`

Accepts recipe JSON, validates it, generates Markdown, and returns the generated Markdown preview.

This endpoint does **not** require Turnstile because it does not write to GitHub.

### `POST /api/recipes/submit`

Accepts the same recipe JSON plus a Turnstile token. If validation and Turnstile pass, the Worker:

1. Reads the latest base branch SHA.
2. Creates a new branch named `recipe-submissions/<slug>-<timestamp>`.
3. Checks for a duplicate recipe filename on the base branch.
4. Commits the generated recipe Markdown under `_recipes/<slug>.md`.
5. Opens a pull request against `main`.

## Required Worker secrets / variables

Set these in Cloudflare Workers:

```text
GITHUB_TOKEN=github fine-grained token or GitHub App installation token
TURNSTILE_SECRET_KEY=cloudflare turnstile secret key
ALLOWED_ORIGIN=https://recipes.saathoff.us
GITHUB_OWNER=cjthedj97
GITHUB_REPO=chowdown
GITHUB_BASE_BRANCH=main
```

`GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_BASE_BRANCH` have safe defaults in the draft Worker, but defining them explicitly is clearer.

## GitHub token permissions

For a fine-grained GitHub token, scope it only to `cjthedj97/chowdown` and grant:

- Contents: Read and write
- Pull requests: Read and write

A GitHub App installation token would be cleaner long-term, but a fine-grained token is simpler for the first version.

## Turnstile setup

1. Create a Cloudflare Turnstile widget for the recipe site domain.
2. Replace `REPLACE_WITH_TURNSTILE_SITE_KEY` in `submit-recipe.html`.
3. Store the secret as `TURNSTILE_SECRET_KEY` in the Worker.

## Form setup

Replace this placeholder in `submit-recipe.html`:

```js
const WORKER_BASE_URL = "REPLACE_WITH_WORKER_URL";
```

Example:

```js
const WORKER_BASE_URL = "https://recipe-submit.example.workers.dev";
```

## Validation currently included

- Required title.
- Required ingredients.
- Required directions.
- Honeypot rejection if `website`, `company`, or `url` is filled.
- Turnstile required on submit.
- Payload size limit.
- Field length limits.
- Expected arrays for categories, tags, ingredients, and directions.
- ISO-8601-ish durations like `PT20M`, `PT45M`, and `PT1H5M`.
- Slug-safe filename generation.
- Duplicate filename check against the base branch.

## Known draft limitations

- The preview endpoint does not require Turnstile. That is intentional for UX, but it could be abused for compute if the endpoint becomes popular.
- There is no rate limiting. That matches the current free-tier-friendly plan.
- YAML is generated from sanitized structured data rather than parsed from user-written YAML.
- The form is intentionally basic and should be styled/refined after the API flow is confirmed.
- The Worker is plain JavaScript with no Wrangler project files yet.
- A GitHub App would be better than a long-lived token for production.

## Suggested next steps

1. Decide whether the Worker should live in this repo or a separate repo.
2. Add a `wrangler.toml` once the Worker name and route are chosen.
3. Replace placeholder Turnstile and Worker URLs.
4. Deploy Worker to a test route.
5. Submit a test recipe and confirm the generated PR and Cloudflare Pages preview.
6. Tighten form styling and user-facing validation messages.
