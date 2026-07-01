# Recipe Submission Pages Functions Draft

This branch adds Cloudflare Pages Functions for recipe submissions. The API lives in this repo and opens GitHub pull requests for review.

## Files

- `functions/api/recipes/preview.js` — preview endpoint.
- `functions/api/recipes/submit.js` — submit endpoint.
- `functions/_shared/recipe.js` — recipe validation and Markdown formatting.
- `functions/_shared/github.js` — GitHub pull request helper.
- `functions/_shared/turnstile.js` — Turnstile helper.
- `functions/_shared/http.js` — shared HTTP helpers.
- `submit-recipe.html` — draft form page.

## Routes

- `POST /api/recipes/preview`
- `POST /api/recipes/submit`

The form calls same-origin routes, so no separate Worker URL is needed.

## Generated recipe behavior

Generated recipes include `layout: recipe`, `recipe_schema: 1`, title, optional metadata, ingredients, and directions. Blank optional fields are omitted instead of filled with guessed values.

## Cloudflare Pages environment variables

Set these in the Pages project:

- `GITHUB_TOKEN`
- `TURNSTILE_SECRET_KEY`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BASE_BRANCH`

## Form placeholder

Replace `REPLACE_WITH_TURNSTILE_SITE_KEY` before testing.

## Related issues

- #69
- #71
- #74
- #76
- #81
- #83
