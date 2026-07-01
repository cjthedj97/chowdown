(function () {
  function markHeroAsPlaceholder(hero) {
    if (!hero) return;
    hero.classList.add('recipe-placeholder');
  }

  function createHeroPlaceholder() {
    var container = document.querySelector('body.recipe-page .container');
    var article = container && container.querySelector('article.post-content');
    if (!container || !article) return;
    if (container.querySelector('.recipe-hero-image')) return;

    var placeholder = document.createElement('div');
    placeholder.className = 'xs-p2 recipe-hero-image recipe-placeholder';
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', 'No image was added or cannot be loaded.');
    container.insertBefore(placeholder, article);
  }

  function watchExistingHeroImages() {
    var images = document.querySelectorAll('.recipe-hero-image img');
    for (var i = 0; i < images.length; i += 1) {
      images[i].addEventListener('error', function () {
        markHeroAsPlaceholder(this.closest('.recipe-hero-image'));
        this.removeAttribute('src');
      }, { once: true });
    }
  }

  function init() {
    createHeroPlaceholder();
    watchExistingHeroImages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
