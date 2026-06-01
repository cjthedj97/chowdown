(function () {
  function markBrokenCard(card) {
    card.classList.remove('has-image');
    card.classList.add('no-image');
    card.removeAttribute('data-image-url');
    card.style.removeProperty('--tile-image');
  }

  function checkCard(card) {
    var url = card.getAttribute('data-image-url');
    if (!url) return;

    var probe = new Image();
    probe.onload = function () {
      probe.onload = null;
      probe.onerror = null;
    };
    probe.onerror = function () {
      markBrokenCard(card);
    };
    probe.src = url;
  }

  function init() {
    var cards = document.querySelectorAll('.recipe-tile[data-image-url]');
    for (var i = 0; i < cards.length; i += 1) {
      checkCard(cards[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
