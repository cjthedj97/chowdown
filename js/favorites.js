(function () {
  var STORAGE_KEY = 'chowdown:favorites';

  function readFavorites() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function writeFavorites(favorites) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }

  function normalizeUrl(url) {
    if (!url) return '';
    try {
      var parsed = new URL(url, window.location.origin);
      return (parsed.pathname || '').replace(/\/$/, '');
    } catch (err) {
      return String(url).replace(/\/$/, '');
    }
  }

  function isFavorite(url) {
    var normalizedUrl = normalizeUrl(url);
    return readFavorites().indexOf(normalizedUrl) !== -1;
  }

  function toggleFavorite(url) {
    var normalizedUrl = normalizeUrl(url);
    var favorites = readFavorites();
    var index = favorites.indexOf(normalizedUrl);

    if (index === -1) {
      favorites.push(normalizedUrl);
      writeFavorites(favorites);
      return true;
    }

    favorites.splice(index, 1);
    writeFavorites(favorites);
    return false;
  }

  function renderFavoriteCards(recipes) {
    return recipes.map(function (recipe) {
      return '<div class="sm-col sm-col-6 md-col-6 lg-col-4 xs-px1 xs-mb2">' +
        '<a class="block relative recipe-tile" href="' + recipe.url + '">' +
        '<div class="image ratio bg-cover" style="background-image:url(' + recipe.image + ');"></div>' +
        '<h1 class="title p2 m0 absolute bold white bottom-0 left-0 recipe-tile-title">' + recipe.title + '</h1>' +
        '</a>' +
      '</div>';
    }).join('');
  }

  function renderFavoritesPage(config) {
    var resultsContainer = document.getElementById(config.resultsContainerId);
    var emptyState = document.getElementById(config.emptyStateId);
    var clearButton = document.getElementById(config.clearButtonId);

    if (!resultsContainer || !emptyState || !clearButton) return;

    function refresh() {
      var favorites = readFavorites();

      fetch(config.searchJsonUrl)
        .then(function (response) { return response.json(); })
        .then(function (recipes) {
          var lookup = {};
          recipes.forEach(function (recipe) {
            lookup[normalizeUrl(recipe.url)] = recipe;
          });

          var favoriteRecipes = favorites
            .map(function (url) { return lookup[normalizeUrl(url)]; })
            .filter(function (recipe) { return !!recipe; });

          if (favoriteRecipes.length === 0) {
            resultsContainer.innerHTML = '';
            emptyState.style.display = 'block';
          } else {
            resultsContainer.innerHTML = '<div class="clearfix">' + renderFavoriteCards(favoriteRecipes) + '</div>';
            emptyState.style.display = 'none';
          }
        })
        .catch(function () {
          resultsContainer.innerHTML = '';
          emptyState.textContent = 'Could not load recipes right now.';
          emptyState.style.display = 'block';
        });
    }

    clearButton.addEventListener('click', function () {
      writeFavorites([]);
      refresh();
    });

    refresh();
  }

  function initRecipeFavoriteButton(config) {
    var button = document.getElementById(config.buttonId);
    if (!button) return;

    function paintState() {
      if (isFavorite(config.recipeUrl)) {
        button.textContent = 'Remove Favorite';
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-primary');
      } else {
        button.textContent = 'Save Favorite';
        button.classList.remove('btn-primary');
        button.classList.add('btn-outline-primary');
      }
    }

    button.addEventListener('click', function () {
      toggleFavorite(config.recipeUrl);
      paintState();
    });

    paintState();
  }

  window.ChowdownFavorites = {
    renderFavoritesPage: renderFavoritesPage,
    initRecipeFavoriteButton: initRecipeFavoriteButton
  };
})();
