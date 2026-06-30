# Recipe Submission Worker Draft

This branch adds a draft Cloudflare Worker flow for public recipe submissions that open GitHub pull requests instead of writing directly to `main`.

## Goals

- Let visitors submit structured recipe data.
- Generate Markdown compatible with the existing `layout: recipe` format.
- Add `recipe_schema: 1` to new Worker-generated recipes.
- Provide a preview endpoint before anything is committed.
- Validate input server-side before touching GitHub.
- Create a recipe branch and open a pull request for review.

## Related roadmap issues

- #69 — Recipe submission workflow epic
- #71 — Recipe validation report
- #74 — Add recipe difficulty field
- #76 — Worker deployment and Cloudflare configuration
- #81 — Add recipe schema version field
- #83 — Standardize generated recipe YAML

## Files

- `workers/recipe-submission-worker.js` — Worker API with `/api/recipes/preview` and `/api/recipes/submit`.
- `submit-recipe.html` — Draft Jekyll page with a form, Markdown preview, Turnstile widget, and hidden spam-check field.

## Worker routes

### `POST /api/recipes/preview`

Accepts recipe JSON, validates it, generates Markdown, and returns the generated Markdown preview.

### `POST /api/recipes/submit`

Accepts the same recipe JSON plus a Turnstile token. If validation passes, the Worker creates a branch, commits `_recipes/<slug>.md`, and opens a pull request against `main`.

## Generated recipe behavior

The Worker now follows the field names confirmed in #81.

Generated recipes include:

- `layout: recipe`
- `recipe_schema: 1`
- `title`
- optional `image` and `imagecredit`
- optional `categories`
- optional `tags`
- optional `yield`
- optional `preptime`, `cooktime`, and `totaltime`
- optional `difficulty`
- optional `notes`
- required `ingredients`
- required `directions`

Blank optional fields are omitted instead of filled with guessed values.

## Required Worker secrets and variables

```text
GITHUB_TOKEN=github fine-grained token or GitHub App installation token
TURNSTILE_SECRET_KEY=cloudflare turnstile secret key
ALLOWED_ORIGIN=https://recipes.saathoff.us
GITHUB_OWNER=cjthedj97
GITHUB_REPO=chowdown
GITHUB_BASE_BRANCH=main
```

## GitHub token permissions

For a fine-grained GitHub token, scope it only to `cjthedj97/chowdown` and grant:

- Contents: Read and write
- Pull requests: Read and write

## Setup placeholders

Replace these before testing:

```text
REPLACE_WITH_TURNSTILE_SITE_KEY
REPLACE_WITH_WORKER_URL
```

If the Worker is routed on the same origin as the site, `WORKER_BASE_URL` can eventually be an empty string.

## Validation currently included

- Required title.
- Required ingredients.
- Required directions.
- Hidden spam-check field rejection.
- Turnstile required on submit.
- Payload size limit.
- Field length limits.
- Expected arrays for categories, tags, ingredients, and directions.
- Difficulty limited to `Easy`, `Medium`, or `Hard` when provided.
- ISO-8601-ish durations like `PT20M`, `PT45M`, and `PT1H5M`.
- Slug-safe filename generation.
- Duplicate filename check against the base branch.

## Known draft limitations

- The preview endpoint does not require Turnstile.
- There is no rate limiting.
- The form is intentionally basic.
- The Worker is plain JavaScript with no Wrangler project files yet.
- GitHub App authentication is tracked separately in #77.

## Suggested next steps

1. Decide whether the Worker should live in this repo or a separate repo.
2. Add a `wrangler.toml` once the Worker name and route are chosen.
3. Replace placeholder Turnstile and Worker URLs.
4. Deploy Worker to a test route.
5. Submit a test recipe and confirm the generated PR and Cloudflare Pages preview.
