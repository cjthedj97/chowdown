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
}
</script