---
layout: page
permalink: /features
title: Static Feature Roadmap
show_title: false
---

# Static Feature Roadmap

Track feature work here and move items from `Idea` -> `Planned` -> `Building` -> `Done`.

Status key:
- [ ] Idea
- [~] Planned next
- [>] Building now
- [x] Done

## Notes (Latest)

- Converter now outputs `date_added` and `status` fields.
- Public recipe views now hide `status: draft` and `status: planned`.
- Stats now show both total recipe count and published recipe count.

## Core UX

- [x] Dark mode toggle and persisted theme
- [x] Favorites (localStorage + favorites page)
- [x] Tag Filter Chips on search results
- [x] Print-Friendly recipe view
- [x] Recently Added on home page (uses `date_added` frontmatter)
- [x] Random by tag (dessert, dinner, etc.)

## Planning and Organization

- [x] Recipe Collections pages (meal prep, holiday, game day)
- [~] Planned vs Published workflow tied to idea list
  - Update: `status` filtering is now active for home/search/all/collections.
  - Next: tie workflow status directly into the idea list flow.
- [ ] Duplicate title/similarity checker for new recipes

## Inventory and Utility

- [x] Pantry-to-Recipe match from inventory
- [x] Missing ingredients mode
- [ ] Servings scaler (1x, 2x, 3x)

## Sharing and Reach

- [ ] Share/copy link buttons on recipes
- [ ] Better offline cache for recipe pages and images
- [~] Import helper for pasted recipe text/url
  - Note: converter is now more robust and includes feature metadata fields.
  - Current converter output supports `date_added` for Recently Added and `status` for publishing workflow.

## Next Build Order

1. Planned vs Published workflow tied to idea list
2. Servings scaler (1x, 2x, 3x)
3. Share/copy link buttons on recipes
