---
layout: post
permalink: /stats
---
<h1>Recipe Statistics</h1>
<p>Quick health check for the family recipe catalog. These stats are generated from recipe front matter and do not use analytics, tracking, or external chart libraries.</p>

<div id="stats-status" class="stats-status">Loading recipe statistics...</div>

<section class="stats-grid" aria-label="Recipe summary statistics">
  <article class="stats-card"><span>Total Recipes</span><strong id="total-recipes">—</strong></article>
  <article class="stats-card"><span>Published</span><strong id="published-recipes">—</strong></article>
  <article class="stats-card"><span>Planned</span><strong id="planned-recipes">—</strong></article>
  <article class="stats-card"><span>Drafts</span><strong id="draft-recipes">—</strong></article>
  <article class="stats-card"><span>Reviewed</span><strong id="reviewed-recipes">—</strong></article>
  <article class="stats-card"><span>With Images</span><strong id="recipes-with-images">—</strong></article>
  <article class="stats-card"><span>Missing Images</span><strong id="recipes-missing-images">—</strong></article>
  <article class="stats-card"><span>Last Build</span><strong id="build-time">—</strong></article>
</section>

<section class="stats-section">
  <h2>Status</h2>
  <div id="status-chart" class="stats-chart"></div>
</section>

<section class="stats-section">
  <h2>Image Coverage</h2>
  <div id="image-chart" class="stats-chart"></div>
</section>

<section class="stats-section">
  <h2>Difficulty</h2>
  <div id="difficulty-chart" class="stats-chart"></div>
</section>

<section class="stats-section">
  <h2>Top Categories</h2>
  <div id="category-chart" class="stats-chart stats-chart-wide"></div>
</section>

<section class="stats-section">
  <h2>Top Tags</h2>
  <div id="tag-chart" class="stats-chart stats-chart-wide"></div>
</section>

<section class="stats-section">
  <h2>Recently Added</h2>
  <ol id="recent-recipes" class="stats-recent"></ol>
</section>

<style>
  .stats-status {
    margin: 1rem 0;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border, #d1d5db);
    border-radius: 8px;
    background: var(--surface-soft, #f7f7f7);
  }

  .stats-status.is-error {
    border-color: #fca5a5;
    background: #fef2f2;
    color: #7f1d1d;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0 2rem;
  }

  .stats-card,
  .stats-chart,
  .stats-recent {
    border: 1px solid var(--border, #d1d5db);
    border-radius: 12px;
    background: var(--surface, #fff);
  }

  .stats-card {
    padding: 1rem;
  }

  .stats-card span {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.9rem;
    opacity: 0.8;
  }

  .stats-card strong {
    display: block;
    font-size: 1.65rem;
    line-height: 1.1;
  }

  .stats-section {
    margin: 2rem 0;
  }

  .stats-chart {
    display: grid;
    gap: 0.7rem;
    padding: 1rem;
  }

  .stats-chart-empty {
    opacity: 0.75;
  }

  .stats-bar-row {
    display: grid;
    grid-template-columns: minmax(120px, 0.35fr) minmax(140px, 1fr) auto;
    gap: 0.75rem;
    align-items: center;
  }

  .stats-bar-label {
    overflow-wrap: anywhere;
    font-weight: 700;
  }

  .stats-bar-track {
    min-height: 1rem;
    border-radius: 999px;
    background: var(--surface-soft, #f3f4f6);
    overflow: hidden;
  }

  .stats-bar-fill {
    display: block;
    min-width: 0.35rem;
    height: 1rem;
    border-radius: 999px;
    background: var(--accent, #007fff);
  }

  .stats-bar-count {
    min-width: 2.5rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }

  .stats-recent {
    padding: 1rem 1rem 1rem 2.25rem;
  }

  .stats-recent li {
    margin: 0.4rem 0;
  }

  .stats-recent a {
    font-weight: 700;
  }

  @media (max-width: 640px) {
    .stats-bar-row {
      grid-template-columns: 1fr auto;
    }

    .stats-bar-track {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
</style>

<script>
  fetch('{{ "/recipes.json" | relative_url }}')
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(displayStats)
    .catch((error) => {
      const status = document.getElementById('stats-status');
      status.classList.add('is-error');
      status.textContent = `Unable to load recipe statistics: ${error.message}`;
    });

  function displayStats(data) {
    const recipes = Array.isArray(data.recipes) ? data.recipes : [];
    const imageCounts = countImages(recipes);
    const statusCounts = countBy(recipes, (recipe) => normalizeStatus(recipe.status));
    const difficultyCounts = countBy(recipes, (recipe) => recipe.difficulty || 'Not specified');
    const categoryCounts = countListValues(recipes, 'categories', 'Uncategorized');
    const tagCounts = countListValues(recipes, 'tags', 'Untagged');

    setText('total-recipes', data.recipeCount || recipes.length);
    setText('published-recipes', statusCounts.Published || data.publishedRecipeCount || 0);
    setText('planned-recipes', statusCounts.Planned || 0);
    setText('draft-recipes', statusCounts.Draft || 0);
    setText('reviewed-recipes', recipes.filter((recipe) => recipe.reviewed).length);
    setText('recipes-with-images', imageCounts.Local + imageCounts.Remote);
    setText('recipes-missing-images', imageCounts.Missing);
    setText('build-time', formatDateTime(data.buildDateTime));

    renderBarChart('status-chart', statusCounts);
    renderBarChart('image-chart', imageCounts);
    renderBarChart('difficulty-chart', difficultyCounts);
    renderBarChart('category-chart', categoryCounts, 12);
    renderBarChart('tag-chart', tagCounts, 15);
    renderRecentRecipes(recipes);

    const status = document.getElementById('stats-status');
    status.textContent = `Stats loaded for ${recipes.length} recipes.`;
  }

  function normalizeStatus(value) {
    const status = String(value || '').toLowerCase();
    if (status === 'planned') return 'Planned';
    if (status === 'draft') return 'Draft';
    return 'Published';
  }

  function countImages(recipes) {
    return recipes.reduce((counts, recipe) => {
      const image = String(recipe.image || '').trim().toLowerCase();
      if (!image) counts.Missing += 1;
      else if (image.startsWith('http://') || image.startsWith('https://')) counts.Remote += 1;
      else counts.Local += 1;
      return counts;
    }, { Local: 0, Remote: 0, Missing: 0 });
  }

  function countBy(items, getKey) {
    return sortCounts(items.reduce((counts, item) => {
      const key = getKey(item);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {}));
  }

  function countListValues(items, key, fallback) {
    const counts = {};
    items.forEach((item) => {
      const values = Array.isArray(item[key]) ? item[key].filter(Boolean) : [];
      if (!values.length) {
        counts[fallback] = (counts[fallback] || 0) + 1;
        return;
      }
      values.forEach((value) => {
        counts[value] = (counts[value] || 0) + 1;
      });
    });
    return sortCounts(counts);
  }

  function sortCounts(counts) {
    return Object.fromEntries(Object.entries(counts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])));
  }

  function renderBarChart(elementId, counts, limit) {
    const element = document.getElementById(elementId);
    const entries = Object.entries(counts).filter((entry) => entry[1] > 0).slice(0, limit || 20);
    const max = entries.reduce((largest, entry) => Math.max(largest, entry[1]), 0);

    element.innerHTML = '';
    if (!entries.length) {
      element.innerHTML = '<p class="stats-chart-empty">No data yet.</p>';
      return;
    }

    entries.forEach(([label, count]) => {
      const width = max ? Math.max((count / max) * 100, 2) : 0;
      const row = document.createElement('div');
      row.className = 'stats-bar-row';
      row.innerHTML = `
        <span class="stats-bar-label"></span>
        <span class="stats-bar-track" aria-hidden="true"><span class="stats-bar-fill" style="width: ${width}%"></span></span>
        <span class="stats-bar-count"></span>
      `;
      row.querySelector('.stats-bar-label').textContent = label;
      row.querySelector('.stats-bar-count').textContent = count;
      element.appendChild(row);
    });
  }

  function renderRecentRecipes(recipes) {
    const element = document.getElementById('recent-recipes');
    const recent = recipes
      .filter((recipe) => recipe.date_added)
      .sort((left, right) => String(right.date_added).localeCompare(String(left.date_added)))
      .slice(0, 10);

    element.innerHTML = '';
    if (!recent.length) {
      element.innerHTML = '<li>No dated recipes yet.</li>';
      return;
    }

    recent.forEach((recipe) => {
      const item = document.createElement('li');
      const link = document.createElement(recipe.url ? 'a' : 'span');
      link.textContent = recipe.title || 'Untitled recipe';
      if (recipe.url) link.href = recipe.url;
      item.appendChild(link);
      item.append(` — ${recipe.date_added}`);
      element.appendChild(item);
    });
  }

  function setText(id, value) {
    document.getElementById(id).textContent = value;
  }

  function formatDateTime(value) {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
</script>
