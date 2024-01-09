---
layout: post
---

<style>
  #stats-container {
    font-family: Arial, sans-serif;
    margin: 20px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  h2 {
    margin-top: 15px;
  }

  p {
    margin: 5px 0;
  }
</style>

<div id="stats-container"></div>

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
    const statsContainer = document.getElementById('stats-container');

    // Display total recipe count
    statsContainer.innerHTML += `<p>Total Recipes: ${data.recipeCount}</p>`;

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
    statsContainer.innerHTML += '<h2>Tag Counts</h2>';
    for (const [tag, count] of Object.entries(tagCounts)) {
      statsContainer.innerHTML += `<p>${tag}: ${count}</p>`;
    }
  }
</script>
