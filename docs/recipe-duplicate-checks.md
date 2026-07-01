# Recipe duplicate checks

Recipe submissions use two duplicate checks before creating a review pull request.

## Exact filename check

The submission flow checks whether the generated recipe file already exists in `_recipes` on the base branch. This is treated as a blocking error because creating the PR would overwrite an existing recipe path.

## Similar recipe warning

The submission flow also compares the new recipe title and generated filename against existing recipe filenames in `_recipes`. This is a warning, not a blocker. Family members can still submit when the recipe is intentionally different.

The warning looks for:

- Matching normalized titles derived from recipe filenames.
- Matching normalized filename slugs.
- Similar titles based on lightweight text and token similarity.

## Limitations

This check intentionally avoids full recipe scraping or expensive content comparison. It compares the new title/slug against existing filenames, so it may miss duplicates when an old filename does not closely match the actual recipe title. It may also warn on recipes that are related but intentionally different, such as two versions of the same cake or sauce.

Reviewers should treat similarity warnings as a prompt to compare recipes, not as a final decision.
