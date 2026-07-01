(function (window, document) {
  var STORAGE_KEY = 'chowdownRecipeEditDraft';
  var activeDraft = null;

  function initRecipePage(options) {
    var button = document.getElementById(options.buttonId);
    var data = readJson(options.dataId);

    if (!button || !data || !data.path) return;

    button.addEventListener('click', function () {
      data.ingredients = data.ingredients || collectTextItemsFromFirst('ul[itemprop="ingredients"]', '[itemprop="recipeIngredient"]');
      data.directions = data.directions || collectTextItemsFromFirst('ul[itemprop="recipeInstructions"]', '[itemprop="instruction"]');

      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        window.alert('Could not start recipe edit in this browser.');
        return;
      }

      window.location.href = options.submitUrl || '/submit-recipe.html?edit=1';
    });
  }

  function populateSubmitForm(options) {
    var params = new URLSearchParams(window.location.search);
    if (params.get('edit') !== '1') return;

    var draft = loadDraft();
    if (!draft || !draft.path) {
      if (options.statusBox) {
        options.statusBox.textContent = 'No recipe edit data was found. Go back to a recipe page and choose Edit Recipe again.';
      }
      return;
    }

    activeDraft = draft;
    fillForm(options.form, draft);

    var heading = document.querySelector('.recipe-submit-heading');
    var intro = document.querySelector('.recipe-submit-intro');
    var submitButton = options.form ? options.form.querySelector('button[type="submit"]') : null;

    if (heading) heading.textContent = 'Edit Recipe';
    if (intro) intro.textContent = 'Preview your edits first, then submit them as a pull request for review.';
    if (submitButton) submitButton.textContent = 'Submit Edit PR';
    if (options.statusBox) options.statusBox.textContent = 'Editing existing recipe: ' + (draft.title || draft.path);
  }

  function getActiveDraft() {
    return activeDraft;
  }

  function clearActiveDraft() {
    activeDraft = null;
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Ignore storage cleanup errors.
    }
  }

  function loadDraft() {
    try {
      return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || 'null');
    } catch (error) {
      return null;
    }
  }

  function readJson(id) {
    var node = document.getElementById(id);
    if (!node) return null;

    try {
      return JSON.parse(node.textContent || 'null');
    } catch (error) {
      return null;
    }
  }

  function fillForm(form, draft) {
    if (!form) return;

    setField(form, 'title', draft.title);
    setField(form, 'yield', draft.yield);
    setDurationFields(form, 'prep', draft.preptime || draft.prepTime);
    setDurationFields(form, 'cook', draft.cooktime || draft.cookTime);
    setField(form, 'date_added', draft.date_added || draft.dateAdded);
    setField(form, 'status', draft.status || 'published');
    setChecked(form, 'reviewed', Boolean(draft.reviewed));
    setField(form, 'difficulty', draft.difficulty);
    setField(form, 'categories', arrayToCsv(draft.categories));
    setField(form, 'tags', arrayToCsv(draft.tags));
    setField(form, 'image', draft.image);
    setField(form, 'imagecredit', draft.imagecredit || draft.imageCredit);
    setField(form, 'notes', draft.notes);
    setField(form, 'ingredients', groupsToText(draft.ingredients));
    setField(form, 'directions', groupsToText(draft.directions));
  }

  function setField(form, name, value) {
    if (!form.elements[name] || value === undefined || value === null) return;
    form.elements[name].value = value;
  }

  function setChecked(form, name, checked) {
    if (!form.elements[name]) return;
    form.elements[name].checked = checked;
  }

  function setDurationFields(form, prefix, duration) {
    var parts = durationToParts(duration);
    setField(form, prefix + '_hours', parts.hours);
    setField(form, prefix + '_minutes', parts.minutes);
  }

  function durationToParts(value) {
    var match = String(value || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
    return {
      hours: match && match[1] ? Number(match[1]) : 0,
      minutes: match && match[2] ? Number(match[2]) : 0
    };
  }

  function arrayToCsv(value) {
    return Array.isArray(value) ? value.filter(Boolean).join(', ') : '';
  }

  function groupsToText(value) {
    if (!Array.isArray(value)) return '';

    var lines = [];
    value.forEach(function (entry) {
      if (typeof entry === 'string') {
        lines.push(entry);
        return;
      }

      if (!entry || typeof entry !== 'object') return;

      Object.keys(entry).forEach(function (name) {
        var items = entry[name];
        if (!Array.isArray(items)) return;
        if (name) lines.push(name + ':');
        items.forEach(function (item) {
          if (item) lines.push(item);
        });
      });
    });

    return lines.join('\n');
  }

  function collectTextItemsFromFirst(containerSelector, itemSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) return [];

    return Array.prototype.slice.call(container.querySelectorAll(itemSelector))
      .map(function (item) { return item.textContent.replace(/\s+/g, ' ').trim(); })
      .filter(Boolean);
  }

  window.ChowdownRecipeEdit = {
    initRecipePage: initRecipePage,
    populateSubmitForm: populateSubmitForm,
    getActiveDraft: getActiveDraft,
    clearActiveDraft: clearActiveDraft
  };
})(window, document);
