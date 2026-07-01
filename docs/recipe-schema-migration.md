# Recipe schema migration helper

Use `scripts/migrate-recipe-schema.rb` to safely add `recipe_schema: 1` to existing recipe files that are missing it.

The helper is intentionally conservative:

- It only scans `_recipes/*.md` by default.
- It only adds `recipe_schema: 1`.
- It does not infer or fill missing recipe metadata.
- It preserves existing front matter values and recipe body content.
- It inserts the schema line after `layout:` when present, otherwise before `title:` when present.
- It exits non-zero if a recipe file does not have valid front matter delimiters.

## Dry run

```sh
ruby scripts/migrate-recipe-schema.rb
```

## Fix mode

```sh
ruby scripts/migrate-recipe-schema.rb --fix
```

## Specific files

```sh
ruby scripts/migrate-recipe-schema.rb _recipes/example.md
ruby scripts/migrate-recipe-schema.rb --fix _recipes/example.md
```

## Verbose output

```sh
ruby scripts/migrate-recipe-schema.rb --verbose
```

## What it does not do

The helper may report files that are missing schema metadata, but it does not fix or invent human-judgment fields such as yield, time fields, difficulty, categories, tags, images, image credits, notes, nutrition, ingredients, or directions.
