---
layout: post
---

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
    data.recipesWithTags.forEach(recipe => {
        recipe.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    // Display tag counts
    statsContainer.innerHTML += '<h2>Tag Counts</h2>';
    for (const [tag, count] of Object.entries(tagCounts)) {
        statsContainer.innerHTML += `<p>${tag}: ${count}</p>`;
    }

    // Display count for untagged recipes
    const untaggedCount = data.totalRecipesWithTags - data.tagCount;
    statsContainer.innerHTML += `<p>Untagged: ${untaggedCount}</p>`;
}
</script>
