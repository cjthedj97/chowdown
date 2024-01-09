---
layout: default
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

    // Display recipes with tags
    statsContainer.innerHTML += '<h2>Recipes with Tags</h2>';
    data.recipesWithTags.forEach(recipe => {
        statsContainer.innerHTML += `<p>{{ recipe.title }}: Tags - ${recipe.tags.join(', ')}</p>`;
    });

    // Display recipes without tags
    statsContainer.innerHTML += '<h2>Recipes without Tags</h2>';
    data.recipesWithoutTags.forEach(recipe => {
        statsContainer.innerHTML += `<p>{{ recipe.title }}</p>`;
    });

    // Display total recipes with and without tags
    statsContainer.innerHTML += `<p>Total Recipes with Tags: ${data.totalRecipesWithTags}</p>`;
    statsContainer.innerHTML += `<p>Total Recipes without Tags: ${data.totalRecipesWithoutTags}</p>`;
}
</script