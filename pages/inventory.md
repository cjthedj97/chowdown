---
layout: post
title: Food Inventory Scanner
permalink: /inventory
---

> Please note that the inventory is stored locally on your device. This means that if you access the application from a different browser or device, the inventory will not be the same.

<style>
    .button-container,
    .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 10px; /* Space between buttons */
        margin-bottom: 20px; /* Space below the button group */
        align-items: center; /* Align items vertically center */
    }

    .button-container label,
    .button-container input {
        margin-right: 10px; /* Space between label/input and button */
    }

    button {
        padding: 10px 15px;
        font-size: 16px;
        cursor: pointer;
        border: 1px solid #ccc;
        background-color: #f8f8f8;
        border-radius: 5px;
        transition: background-color 0.3s;
    }

    button:hover {
        background-color: #e0e0e0;
    }
</style>
<form id="upc-form" class="button-container">
    <label for="upc">Enter UPC Code:</label>
    <input type="text" id="upc" name="upc" required>
    <button type="submit">Add Single UPC</button>
</form>
<form id="remove-upc-form" class="button-container">
    <label for="remove-upc">Mark UPC as Used:</label>
    <input type="text" id="remove-upc" name="remove-upc" required>
    <button type="submit">Mark as Used</button>
</form>
<div class="controls">
    <button onclick="shareList()">Share List</button>
    <button onclick="clearData()">Clear Data</button>
    <button onclick="clearUsedProducts()">Clear Used Products</button>
</div>
<div id="result"></div>
<div id="lists"></div>

<script>
    const storageKey = 'upcProducts';
    let products = JSON.parse(localStorage.getItem(storageKey)) || [];

    document.getElementById('upc-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const upc = document.getElementById('upc').value.trim();
        lookupUPC(upc);
    });

    document.getElementById('remove-upc-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const upc = document.getElementById('remove-upc').value.trim();
        markUPCAsUsed(upc);
    });

    window.onload = generateLists;
    
    function lookupUPC(upc) {
        // Ensure the UPC is treated as a string
        upc = String(upc).trim();
    
        const url = `https://world.openfoodfacts.org/api/v0/product/${upc}.json`;
    
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.status === 1) {
                    addProduct(upc, data.product);
                } else {
                    displayError('Product not found. To add unknown product visit https://world.openfoodfacts.org/');
                }
            })
            .catch(error => {
                console.error('Error fetching product:', error);
                displayError('Error fetching product information.');
            })
            .finally(() => {
                document.getElementById('upc').value = ''; // Clear the add UPC text box
            });
    }

    function addProduct(upc, product) {
        // Ensure the UPC is a string and trim any extra spaces
        if (typeof upc !== 'string') {
            console.error('Invalid UPC type:', typeof upc);
            return;
        }
        upc = String(upc).trim();
    
        // Extract product details
        const productName = product.product_name || 'Unknown Product';
        const productQuantity = product.quantity ? " - " + product.quantity : '';
        const fullName = productName + productQuantity;
    
        // Find if the product already exists in the list
        const existingIndex = products.findIndex(p => p.code === upc);
        if (existingIndex === -1) {
            // Add new product if it doesn't exist
            products.push({
                code: upc,
                product_name: fullName,
                count: 1,
                used: 0
            });
            displaySuccess(`Product "${fullName}" added.`);
        } else {
            // Increment the count if the product already exists
            products[existingIndex].count += 1;
            displaySuccess(`Updated quantity for "${fullName}".`);
        }
    
        // Save the updated list to local storage
        localStorage.setItem(storageKey, JSON.stringify(products));
    
        // Regenerate the product list display
        generateLists();
    
        // Clear the UPC input field
        document.getElementById('upc').value = '';
    }

    function markUPCAsUsed(upc) {
        const index = products.findIndex(p => p.code === upc);
    
        if (index !== -1 && products[index].count > products[index].used) {
            products[index].used += 1; // Increment the used count
            localStorage.setItem(storageKey, JSON.stringify(products));
            displaySuccess(`Marked one of "${products[index].product_name}" as used.`);
            generateLists();
        } else {
            displayError(`The product with UPC "${upc}" is not available in your local inventory or all have been marked as used.`);
        }
    
        document.getElementById('remove-upc').value = ''; // Clear the remove UPC text box
    }
    
    // Function to display success messages to the user
    function displaySuccess(message) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<p style="color: green;">${message}</p>`;
    }
    
    // Function to display error messages to the user
    function displayError(message) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<p style="color: red;">${message}</p>`;
    }

    function displaySuccess(message) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<p style="color: green;">${message}</p>`;
    }

    function displayError(message) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<p style="color: red;">${message}</p>`;
    }

    function generateLists() {
        const listsDiv = document.getElementById('lists');
        const usedProducts = products.filter(p => p.used > 0);
        const unusedProducts = products.filter(p => p.count > p.used);

        listsDiv.innerHTML = `
            <h2>Used Products (${usedProducts.reduce((sum, p) => sum + p.used, 0)})</h2>
            ${usedProducts.map(p => `<div class="product used">${p.used} | <a href="https://world.openfoodfacts.org/product/${p.code}" target="_blank">${p.product_name}</a></div>`).join('') || '<p>No products used yet.</p>'}
            <h2>Unused Products (${unusedProducts.reduce((sum, p) => sum + (p.count - p.used), 0)})</h2>
            ${unusedProducts.map(p => `<div class="product">${p.count - p.used} | <a href="https://world.openfoodfacts.org/product/${p.code}" target="_blank">${p.product_name}</a></div>`).join('') || '<p>No products unused.</p>'}
        `;
    }

    function clearData() {
        products = [];
        localStorage.removeItem(storageKey);
        document.getElementById('lists').innerHTML = '';
        displaySuccess('All data cleared.');
    }

    function clearUsedProducts() {
        products.forEach(product => product.used = 0);
        localStorage.setItem(storageKey, JSON.stringify(products));
        generateLists();
        displaySuccess('Used products cleared.');
    }

    function shareList() {
        const usedProducts = products
            .filter(p => p.used > 0)
            .map(p => `${p.used} | ${p.product_name}`)
            .join('\n');

        const unusedProducts = products
            .filter(p => p.count > p.used)
            .map(p => `${p.count - p.used} | ${p.product_name}`)
            .join('\n');

        const text = `Used Products (${products.filter(p => p.used > 0).reduce((sum, p) => sum + p.used, 0)}):\n${usedProducts || 'No products used yet.'}\n\nUnused Products (${products.filter(p => p.count > p.used).reduce((sum, p) => sum + (p.count - p.used), 0)}):\n${unusedProducts || 'No products unused.'}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            displaySuccess('List copied to clipboard.');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    }
</script>
