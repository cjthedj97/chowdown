---
layout: post
---

  <h1>Recipe Statistics</h1>
  <p>Welcome to our recipe statistics page. Here, you'll find valuable insights into our collection of delicious recipes.</p>
 
  <hr> 

  <h2>Total Recipes: <span id="total-recipe"></span></h2>

  <p class="right">This page was last updated on: <span id="build-time"></span></p>

  <h3>Explore the popularity of various tags among our recipes:</h3>
  <div id="tag-counts"></div>

<script>
  // Fetch data from your JSON endpoint
  fetch('{{ "/recipes.json" | relative_url }}')
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
    const tagCountsElement = document.getElementById('tag-counts');

    // Display build date and time
    buildTimeElement.textContent = data.buildDateTime;

    // Display total recipe count
    totalRecipesElement.textContent = data.recipeCount;

    // Generate tag count per tag
    const tagCounts = {};

    // Check if the 'recipes' property exists
    if (data.recipes) {
      data.recipes.forEach(recipe => {
        // Check if the 'tags' property exists
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
  }
</script>