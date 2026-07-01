(function () {
  var STORAGE_KEY = 'chowdown:theme';

  function getPreferredTheme() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
  }

  function syncHiddenTimer() {
    var modal = document.querySelector('.recipe-timer-modal');
    if (!modal) return;

    if (modal.classList.contains('is-hidden')) {
      modal.style.display = 'none';
    }
  }

  function initTheme() {
    setTheme(getPreferredTheme());
    syncHiddenTimer();

    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  window.ChowdownTheme = {
    initTheme: initTheme,
    setTheme: setTheme
  };
})();
