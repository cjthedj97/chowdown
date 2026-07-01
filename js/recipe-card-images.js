(function () {
  function normalizeImageUrl(value) {
    return (value || '').toString().trim();
  }

  function markBrokenCard(card) {
    var image = card.querySelector('.image');

    card.classList.remove('has-image');
    card.classList.add('no-image');
    card.removeAttribute('data-image-url');
    card.style.removeProperty('--tile-image');

    if (image) {
      image.style.removeProperty('--tile-image');
    }
  }

  function markLoadedCard(card) {
    card.classList.add('has-image');
    card.classList.remove('no-image');
  }

  function checkCard(card) {
    if (!card || card.getAttribute('data-image-checked') === 'true') return;

    var url = normalizeImageUrl(card.getAttribute('data-image-url'));
    if (!url || url === 'null' || url === 'undefined') {
      markBrokenCard(card);
      card.setAttribute('data-image-checked', 'true');
      return;
    }

    card.setAttribute('data-image-checked', 'true');

    var probe = new Image();
    probe.onload = function () {
      probe.onload = null;
      probe.onerror = null;
      markLoadedCard(card);
    };
    probe.onerror = function () {
      probe.onload = null;
      probe.onerror = null;
      markBrokenCard(card);
    };
    probe.src = url;
  }

  function checkCards(root) {
    var scope = root || document;
    var cards = [];

    if (scope.matches && scope.matches('.recipe-tile')) {
      cards.push(scope);
    }

    var nestedCards = scope.querySelectorAll ? scope.querySelectorAll('.recipe-tile') : [];
    for (var i = 0; i < nestedCards.length; i += 1) {
      cards.push(nestedCards[i]);
    }

    for (var j = 0; j < cards.length; j += 1) {
      checkCard(cards[j]);
    }
  }

  function observeNewCards() {
    if (!('MutationObserver' in window)) return;

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i += 1) {
        for (var j = 0; j < mutations[i].addedNodes.length; j += 1) {
          var node = mutations[i].addedNodes[j];
          if (node.nodeType === 1) {
            checkCards(node);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    checkCards(document);
    observeNewCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
