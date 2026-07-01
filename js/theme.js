(function () {
  var STORAGE_KEY = 'chowdown:theme';
  var timerObserver = null;

  function setVars(vars) {
    Object.keys(vars).forEach(function (key) {
      document.documentElement.style.setProperty(key, vars[key]);
    });
  }

  function applyPalette(theme) {
    if (theme === 'dark') {
      setVars({
        '--bg': '#0f1420',
        '--panel': '#161c2c',
        '--surface': '#161c2c',
        '--surface-soft': '#20283a',
        '--text': '#f5f7fb',
        '--muted': '#c8d0df',
        '--line': '#343d52',
        '--border': '#343d52',
        '--accent': '#93c5fd',
        '--accent-soft': '#1d3557',
        '--accent-contrast': '#0f1420',
        '--sidebar-bg': '#151b29',
        '--sidebar-hover-bg': '#20283a',
        '--sidebar-active-bg': '#1d3557'
      });
    } else {
      setVars({
        '--accent': '#2563eb',
        '--accent-soft': '#eff6ff',
        '--accent-contrast': '#ffffff',
        '--sidebar-active-bg': '#eff6ff'
      });
    }
  }

  function syncLogos(theme) {
    var lightLogos = document.querySelectorAll('.chowdown-logo-light');
    var darkLogos = document.querySelectorAll('.chowdown-logo-dark');
    for (var i = 0; i < lightLogos.length; i++) {
      lightLogos[i].style.display = theme === 'dark' ? 'none' : 'block';
    }
    for (var j = 0; j < darkLogos.length; j++) {
      darkLogos[j].style.display = theme === 'dark' ? 'block' : 'none';
    }
  }

  function syncTimerModal() {
    var modal = document.querySelector('.recipe-timer-modal');
    if (!modal) return;

    if (modal.classList.contains('is-hidden')) {
      modal.style.display = 'none';
    } else {
      modal.style.display = 'flex';
      modal.style.position = 'fixed';
      modal.style.inset = '0';
      modal.style.zIndex = '1050';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.padding = '1rem';
    }

    if (timerObserver) return;
    timerObserver = new MutationObserver(syncTimerModal);
    timerObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  function getPreferredTheme() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    applyPalette(theme);
    syncLogos(theme);
    syncTimerModal();

    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
  }

  function initTheme() {
    setTheme(getPreferredTheme());

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
