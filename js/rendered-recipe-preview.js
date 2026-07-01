(function (window, document) {
  function init(options) {
    var form = options.form;
    var buildPayload = options.buildPayload;
    var endpoint = options.endpoint || '/api/recipes/preview';
    var panel = document.getElementById('recipe-rendered-preview');
    var card = document.getElementById('recipe-rendered-card');
    var feedback = document.getElementById('recipe-preview-feedback');
    var timer = null;
    var requestId = 0;

    if (!form || !buildPayload || !panel || !card || !feedback) return null;

    form.addEventListener('input', function () { schedule(350); });
    form.addEventListener('change', function () { schedule(0); });

    function schedule(delay) {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, delay === undefined ? 350 : delay);
    }

    async function update() {
      var payload = buildPayload(new FormData(form));
      var currentRequestId = ++requestId;

      panel.hidden = false;
      renderRecipe(payload);
      setFeedback('Checking preview…', [], []);

      try {
        var response = await window.fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload)
        });
        var result = await response.json();

        if (currentRequestId !== requestId) return;

        if (!response.ok || !result.ok) {
          setFeedback('Preview needs attention', result.errors || [result.error].filter(Boolean), result.warnings || []);
          return;
        }

        setFeedback('Preview looks ready', [], result.warnings || []);
      } catch (error) {
        if (currentRequestId !== requestId) return;
        setFeedback('Could not refresh preview validation', [error.message || 'Preview validation failed.'], []);
      }
    }

    function clear() {
      requestId += 1;
      window.clearTimeout(timer);
      panel.hidden = false;
      card.innerHTML = '';
      setFeedback('Start typing to see a rendered recipe preview.', [], []);
      schedule(0);
    }

    function renderRecipe(recipe) {
      card.innerHTML = '';

      var title = document.createElement('h3');
      title.className = 'recipe-rendered-title';
      title.textContent = recipe.title || 'Untitled Recipe';
      card.appendChild(title);

      var meta = compact([
        recipe.yield ? 'Yield: ' + recipe.yield : '',
        recipe.preptime ? 'Prep: ' + friendlyDuration(recipe.preptime) : '',
        recipe.cooktime ? 'Cook: ' + friendlyDuration(recipe.cooktime) : '',
        recipe.totaltime ? 'Total: ' + friendlyDuration(recipe.totaltime) : '',
        recipe.difficulty ? 'Difficulty: ' + recipe.difficulty : ''
      ]);

      if (meta.length) {
        var metaList = document.createElement('ul');
        metaList.className = 'recipe-rendered-meta';
        meta.forEach(function (value) {
          var item = document.createElement('li');
          item.textContent = value;
          metaList.appendChild(item);
        });
        card.appendChild(metaList);
      }

      if (recipe.image) {
        var imageWrap = document.createElement('div');
        imageWrap.className = 'recipe-rendered-image';
        var image = document.createElement('img');
        image.alt = recipe.title ? recipe.title + ' preview image' : 'Recipe preview image';
        image.src = imageUrl(recipe.image);
        image.addEventListener('error', function () { imageWrap.classList.add('has-image-error'); });
        imageWrap.appendChild(image);
        if (recipe.imagecredit) {
          var credit = document.createElement('a');
          credit.href = recipe.imagecredit;
          credit.target = '_blank';
          credit.rel = 'noopener';
          credit.textContent = 'Image credit';
          imageWrap.appendChild(credit);
        }
        card.appendChild(imageWrap);
      }

      if (recipe.notes) {
        var notes = document.createElement('div');
        notes.className = 'recipe-rendered-notes';
        var notesLabel = document.createElement('strong');
        notesLabel.textContent = 'Notes: ';
        notes.appendChild(notesLabel);
        notes.appendChild(document.createTextNode(recipe.notes));
        card.appendChild(notes);
      }

      var grid = document.createElement('div');
      grid.className = 'recipe-rendered-grid';
      grid.appendChild(groupSection('Ingredients', recipe.ingredients, 'No ingredients entered yet.'));
      grid.appendChild(groupSection('Directions', recipe.directions, 'No directions entered yet.'));
      card.appendChild(grid);

      var taxonomy = compact([
        recipe.categories && recipe.categories.length ? 'Categories: ' + recipe.categories.join(', ') : '',
        recipe.tags && recipe.tags.length ? 'Tags: ' + recipe.tags.join(', ') : '',
        recipe.status ? 'Status: ' + recipe.status : ''
      ]);

      if (taxonomy.length) {
        var footer = document.createElement('div');
        footer.className = 'recipe-rendered-taxonomy';
        taxonomy.forEach(function (value) {
          var line = document.createElement('p');
          line.textContent = value;
          footer.appendChild(line);
        });
        card.appendChild(footer);
      }
    }

    function groupSection(title, groups, emptyText) {
      var section = document.createElement('section');
      var heading = document.createElement('h4');
      heading.textContent = title;
      section.appendChild(heading);

      if (!groups || !groups.length) {
        var empty = document.createElement('p');
        empty.className = 'recipe-rendered-empty';
        empty.textContent = emptyText;
        section.appendChild(empty);
        return section;
      }

      groups.forEach(function (group) {
        if (group.name) {
          var groupHeading = document.createElement('h5');
          groupHeading.textContent = group.name;
          section.appendChild(groupHeading);
        }

        var list = document.createElement(title === 'Directions' ? 'ol' : 'ul');
        group.items.forEach(function (value) {
          var item = document.createElement('li');
          item.textContent = value;
          list.appendChild(item);
        });
        section.appendChild(list);
      });

      return section;
    }

    function setFeedback(title, errors, warnings) {
      feedback.innerHTML = '';
      var heading = document.createElement('strong');
      heading.textContent = title;
      feedback.appendChild(heading);

      appendMessages('Errors', errors, 'recipe-preview-errors');
      appendMessages('Warnings', warnings, 'recipe-preview-warnings');
    }

    function appendMessages(title, messages, className) {
      if (!messages || !messages.length) return;
      var label = document.createElement('p');
      label.textContent = title + ':';
      feedback.appendChild(label);
      var list = document.createElement('ul');
      list.className = className;
      messages.forEach(function (message) {
        var item = document.createElement('li');
        item.textContent = message;
        list.appendChild(item);
      });
      feedback.appendChild(list);
    }

    function friendlyDuration(value) {
      var match = String(value || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
      if (!match) return value;
      return compact([
        match[1] ? match[1] + ' hr' + (match[1] === '1' ? '' : 's') : '',
        match[2] ? match[2] + ' min' : ''
      ]).join(' ');
    }

    function imageUrl(value) {
      return /^https?:\/\//i.test(value) ? value : '/images/' + value.replace(/^\/+/, '');
    }

    function compact(values) {
      return values.filter(function (value) { return Boolean(value); });
    }

    return { schedule: schedule, update: update, clear: clear };
  }

  window.ChowdownRenderedRecipePreview = { init: init };
})(window, document);
