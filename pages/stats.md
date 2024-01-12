---
layout: post
permalink: /stats
---

<h1>Recipe Statistics</h1>
<p>Welcome to our recipe statistics page. Here, you'll find valuable insights into our collection of delicious recipes.</p>

<hr>

<h2>Total Recipes: <span id="total-recipes"></span></h2>
<h2>Recipes with Images: <span id="image-recipe-count"></span></h2> <!-- Added line -->

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
    const imageRecipeCountElement = document.getElementById('image-recipe-count'); // Added line
    const tagCountsElement = document.getElementById('tag-counts');

    // Display build date and time
    buildTimeElement.textContent = data.buildDateTime;

    // Display total recipe count
    totalRecipesElement.textContent = data.recipeCount;

    // New variable to count recipes with images
    let imageRecipeCount = 0; // Added line

    // Generate tag count per tag
    const tagCounts = {};

    // Check if the 'recipes' property exists
    if (data.recipes) {
      data.recipes.forEach(recipe => {
        // Assuming each recipe has an 'imageUrl' property
        if (recipe.image && recipe.image.trim() !== '') {
          imageRecipeCount++; // Added line
        }

        // Existing code for processing tags
        if (recipe.tags && recipe.tags.length > 0) {
          recipe.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        } else {
          // Increment count for untagged recipes
          tagCounts['Untagged'] = (tagCounts['Untagged'] || 0) + 1;
        }
      });
    }

    // Display tag counts
    for (const [tag, count] of Object.entries(tagCounts)) {
      tagCountsElement.innerHTML += `<p>${tag}: ${count}</p>`;
    }

    // Display recipes with images count
    imageRecipeCountElement.textContent = imageRecipeCount; // Added line
  }
</script>
