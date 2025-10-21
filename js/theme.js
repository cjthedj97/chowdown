// Theme switcher: applies `html.dark` when dark mode is active.
(function(){
  const storageKey = 'chowdown-theme';
  const html = document.documentElement;

  function applyTheme(theme){
    if(theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
    // mark initialized so CSS media query fallback won't override
    html.classList.add('theme-initialized');
  }

  function getStored(){
    try{ return localStorage.getItem(storageKey); }catch(e){ return null; }
  }

  function store(theme){
    try{ localStorage.setItem(storageKey, theme); }catch(e){}
  }

  // initialize from storage or system preference
  const stored = getStored();
  if(stored){ applyTheme(stored); }
  else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  // Expose toggle for UI
  window.chowdownTheme = {
    get(){ return html.classList.contains('dark') ? 'dark' : 'light'; },
    set(theme){ applyTheme(theme); store(theme); },
    toggle(){ const newTheme = html.classList.contains('dark') ? 'light' : 'dark'; this.set(newTheme); }
  };

  // Optional: watch for system changes when user hasn't set a preference
  try{
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e)=>{
      if(!getStored()) applyTheme(e.matches ? 'dark' : 'light');
    });
  }catch(e){}

})();
