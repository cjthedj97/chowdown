(function (window, document) {
  function init(options) {
    var button = document.getElementById(options.buttonId);
    var panel = document.getElementById(options.panelId);

    if (!button || !panel) return;

    var loaded = false;
    var repo = panel.getAttribute('data-repo') || '';
    var branch = panel.getAttribute('data-branch') || 'main';
    var path = panel.getAttribute('data-path') || '';
    var historyUrl = panel.getAttribute('data-history-url') || '';
    var limit = Number(panel.getAttribute('data-limit') || 5);
    var status = document.getElementById('recipe-history-status');
    var list = document.getElementById('recipe-history-list');
    var githubLink = document.getElementById('recipe-history-github');

    if (githubLink && historyUrl) {
      githubLink.href = historyUrl;
    }

    button.addEventListener('click', function () {
      var isHidden = panel.hidden || panel.classList.contains('is-hidden');
      setPanelVisible(isHidden);

      if (isHidden && !loaded) {
        loaded = true;
        loadHistory();
      }
    });

    function setPanelVisible(visible) {
      panel.hidden = !visible;
      panel.classList.toggle('is-hidden', !visible);
      button.setAttribute('aria-expanded', visible ? 'true' : 'false');
    }

    function loadHistory() {
      if (!repo || !path || !window.fetch) {
        showFallback('History is available on GitHub.');
        return;
      }

      if (status) status.textContent = 'Loading history from GitHub…';

      var endpoint = 'https://api.github.com/repos/' + repo + '/commits'
        + '?sha=' + encodeURIComponent(branch)
        + '&path=' + encodeURIComponent(path)
        + '&per_page=' + encodeURIComponent(limit);

      window.fetch(endpoint, { headers: { accept: 'application/vnd.github+json' } })
        .then(function (response) {
          if (!response.ok) throw new Error('History request failed');
          return response.json();
        })
        .then(function (commits) {
          renderHistory(Array.isArray(commits) ? commits : []);
        })
        .catch(function () {
          showFallback('Could not load history here. Use the GitHub link for full recipe history.');
        });
    }

    function renderHistory(commits) {
      if (!list) return;

      list.innerHTML = '';

      if (!commits.length) {
        showFallback('No recipe history entries were returned by GitHub.');
        return;
      }

      commits.forEach(function (entry) {
        var commit = entry.commit || {};
        var authorInfo = commit.author || commit.committer || {};
        var author = getAuthorName(entry, authorInfo);
        var message = firstLine(commit.message) || 'Recipe update';
        var date = formatDate(authorInfo.date);
        var url = entry.html_url || historyUrl;

        var item = document.createElement('li');
        var title = document.createElement('a');
        var meta = document.createElement('span');

        title.className = 'recipe-history-entry-title';
        title.href = url;
        title.target = '_blank';
        title.rel = 'noopener';
        title.textContent = message;

        meta.className = 'recipe-history-entry-meta';
        meta.textContent = [date, author].filter(Boolean).join(' · ');

        item.appendChild(title);
        item.appendChild(meta);
        list.appendChild(item);
      });

      if (status) status.textContent = 'Latest recipe updates from GitHub.';
    }

    function showFallback(message) {
      if (status) status.textContent = message;
      if (list) list.innerHTML = '';
    }
  }

  function getAuthorName(entry, authorInfo) {
    if (entry.author && entry.author.login) return entry.author.login;
    if (authorInfo && authorInfo.name) return authorInfo.name;
    return 'Unknown author';
  }

  function firstLine(message) {
    return String(message || '').split('\n')[0].trim();
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  window.ChowdownRecipeHistory = { init: init };
})(window, document);
