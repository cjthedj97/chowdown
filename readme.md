# Chowdown

A simple, plaintext recipe database for hackers.

Be aware my version of chowdown has diverged from the orignal name sake by quite a bit as I have changed and modifided things.

[https://recipes.saathoff.us](https://recipes.saathoff.us)

# Run Locally (Docker)

Serve the site locally with Jekyll in Docker:

```bash
docker run --rm -it -p 4000:4000 -v "$PWD:/srv/jekyll" jekyll/jekyll:4 jekyll serve --host 0.0.0.0 --livereload
```

Then open <http://localhost:4000>.

Run a one-time build test:

```bash
docker run --rm -it -v "$PWD:/srv/jekyll" jekyll/jekyll:4 jekyll build
```

If you hit a permissions error like `Permission denied ... /srv/jekyll/.jekyll-cache`, use the Linux-safe variant:

```bash
docker run --rm -it -p 4000:4000 -v "$PWD:/srv/jekyll:Z" -u root jekyll/jekyll:4 jekyll serve --host 0.0.0.0 --livereload
```

And for build:

```bash
docker run --rm -it -v "$PWD:/srv/jekyll:Z" -u root jekyll/jekyll:4 jekyll build
```

# Writing a Recipe

The recipes are stored in the collection "Recipes" (the folder /_recipes).

They are written in Markdown and contain a few special sections:

- The frontmatter, which contains:
 - Title, Image, and Layout (which is "recipe")
 - Ingredients (a list of things in the dish)
 - Directions (a list of steps for the dish)
- Body content (for intros, stories, written detail)


Below is an example of most of the options you can use

```
---
layout: recipe
title: "Recipe Title Here"
image: image-name.jpg or https://url.tld/image.jpg  # Replace with the image file or URL to one
imagecredit: URL to image credit  # Optional: link to source of the image
tags: tag1 tag2 tag3  # List of tags or keywords related to the recipe
date_added: 2026-05-31  # Optional: Used by the "Recently Added" section
status: planned  # Optional: Hide the recipe until it is ready to publish
reviewed: true  # Optional: Marks a recipe as tested/reviewed
servings: 4  # Optional: Number of servings
prep_time: "10 mins"  # Optional: Preparation time
cook_time: "30 mins"  # Optional: Cooking time
total_time: "40 mins"  # Optional: Total time
notes: |
  Optional recipe notes shown near the top of recipe pages.
  You can use multiple lines.

ingredients:
- Ingredient 1
- Ingredient 2, with quantity and preparation details if needed
- Ingredient 3, etc.

directions:
- Describe the first step here
- Continue with detailed steps
- Additional steps if needed
- Final steps

---
Optional markdown body content can go here.
```

If you need help with Markdown, here's a [handy cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet).

# Recipe Timer Sounds

Add audio files to `/sounds/timer/` to load them automatically in the recipe timer popup.

# Writing a component recipe

A component recipe is a special recipe made up of other recipes. To make a new component recipe:

- place your smaller, single recipes into the /_components folder
- make a new recipe like normal in the /_recipes folders
- in the frontmatter of this new recipe, include your recipes from the /_components folder (instead of the usual Ingredeints list)

# Backfill date_added from history

If you want to backfill `date_added` in existing recipes, use:

```bash
python3 scripts/set_date_added_from_mtime.py
```

By default this prefers git history (first commit date per file) and falls back to mtime when needed.

This runs a dry run and includes a safety stop if every derived date resolves to today.

To apply updates:

```bash
python3 scripts/set_date_added_from_mtime.py --write
```

If you really expect all mtimes to be today, override the safety check:

```bash
python3 scripts/set_date_added_from_mtime.py --write --allow-all-today
```

Optional source controls:

```bash
# Force git-only attempt (falls back to mtime if file has no git history)
python3 scripts/set_date_added_from_mtime.py --source git

# Force filesystem modified time
python3 scripts/set_date_added_from_mtime.py --source mtime
```
