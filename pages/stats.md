---
layout: post
permalink: /stats
---
<h1>Recipe Statistics</h1>
<p>Welcome to our recipe statistics page. Here, you'll find valuable insights into our collection of delicious recipes.</p>
<hr>
<h2>Total Recipes: <span id="total-recipes"></span></h2>
<h2>Recipes with Images (Local): <span id="local-image-recipe-count"></span></h2>
<h2>Recipes with Images (Remote): <span id="remote-image-recipe-count"></span></h2>
<p>This page was last updated on: <span id="build-time"></span></p>
<h3>Explore the popularity of various tags among our recipes:</h3>
<div id="tag-counts"></div>

<script>
  // Fetch data from your JSON endpoint
  fetch('{{ "/recipes.json" }}')
    .then(response => response.json())
    .then(data => {
      // Process and display the data on the stats page
      displayStats(data);
    })
    .catch(error => console.error('Error fetching data:', error));

  // Function to display stats on the page
  function displayStats(data) {
    const buildTimeElement = document.getElementById('build-time');
    const totalRecipesElement = document.getElementById('total-recipes');
    const localImageCountElement = document.getElementById('local-image-recipe-count');
    const remoteImageCountElement = document.getElementById('remote-image-recipe-count');
    const tagCountsElement = document.getElementById('tag-counts');

    buildTimeElement.textContent = data.buildDateTime;
    totalRecipesElement.textContent = data.recipeCount;

    let localImageCount = 0;
    let remoteImageCount = 0;
    const tagCounts = {};

    if (data.recipes) {
      data.recipes.forEach(recipe => {
        if (recipe.image && recipe.image.trim() !== '') {
          const img = recipe.image.trim().toLowerCase();
          if (img.startsWith('http://') || img.startsWith('https://')) {
            remoteImageCount++;
          } else {
            localImageCount++;
          }
        }

        if (recipe.tags && recipe.tags.length > 0) {
          recipe.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        } else {
          tagCounts['Untagged'] = (tagCounts['Untagged'] || 0) + 1;
        }
      });
    }

    // Clear previous tag counts to avoid duplicates if rerun
    tagCountsElement.innerHTML = '';

    // Display tag counts
    for (const [tag, count] of Object.entries(tagCounts)) {
      tagCountsElement.innerHTML += `<p>${tag}: ${count}</p>`;
    }

    // Display image counts
    localImageCountElement.textContent = localImageCount;
    remoteImageCountElement.textContent = remoteImageCount;
  }
</script>
