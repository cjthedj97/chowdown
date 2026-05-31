---
layout: default
permalink: /favorites
title: My Favorite Recipes
---

<div class="container max-width-3 py3">
  <h1 class="center">My Favorite Recipes</h1>
  <p class="center">Saved in this browser only.</p>

  <div class="center mb2">
    <button id="clear-favorites" class="btn btn-sm btn-outline-danger">Clear all favorites</button>
  </div>

  <div class="recipes xs-px1 xs-mt2 recipe-grid" id="favorite-results"></div>
  <p id="favorite-empty" class="center" style="display:none;">No favorites yet. Open a recipe and tap "Save Favorite".</p>
</div>

<script src="{{ "/js/favorites.js" | relative_url }}" type="text/javascript"></script>
<script>
  window.ChowdownFavorites.renderFavoritesPage({
    resultsContainerId: 'favorite-results',
    emptyStateId: 'favorite-empty',
    clearButtonId: 'clear-favorites',
    searchJsonUrl: '/search.json'
  });
</script>
