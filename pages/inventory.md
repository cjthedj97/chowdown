---
layout: post
title: Food Inventory UPC Scanner
permalink: /inventory
---
<form id="upc-form">
    <label for="upc">Enter UPC Code:</label>
    <input type="text" id="upc" name="upc" required>
    <button type="submit">Add Single UPC</button>
</form>
<form id="remove-upc-form">
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
        const url = `https://world.openfoodfacts.org/api/v0/product/${upc}.json`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.status === 1) {
                    addProduct(data.product);
                } else {
                    displayError('Product not found.');
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

    function addProduct(product) {
        const productName = product.product_name || 'Unknown Product';
        const productQuantity = product.quantity ? " - " + product.quantity : '';
        const fullName = productName + productQuantity;

        const existingIndex = products.findIndex(p => p.code === product.code);
        if (existingIndex === -1) {
            products.push({
                code: product.code,
                product_name: fullName,
                count: 1,
                used: 0
            });
        } else {
            products[existingIndex].count += 1;
        }
        localStorage.setItem(storageKey, JSON.stringify(products));
        displaySuccess(`Product "${fullName}" added.`);
        generateLists();
        document.getElementById('upc').value = ''; // Clear the add UPC text box
    }

    function markUPCAsUsed(upc) {
        const index = products.findIndex(p => p.code === upc);
        if (index !== -1 && products[index].count > products[index].used) {
            products[index].used += 1; // Increment the used count
            localStorage.setItem(storageKey, JSON.stringify(products));
            displaySuccess(`Marked one of "${products[index].product_name}" as used.`);
            generateLists();
        } else {
            verifyProductWithAPI(upc);
        }
        document.getElementById('remove-upc').value = ''; // Clear the remove UPC text box
    }

    function verifyProductWithAPI(upc) {
        const url = `https://world.openfoodfacts.org/api/v0/product/${upc}.json`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.status === 1) {
                    displayError(`Product found in the database: ${data.product.product_name}. Please check your local list.`);
                } else {
                    displaySuccess('Product not found in the global database, safe to assume it is not present.');
                }
            })
            .catch(error => {
                console.error('Error verifying product:', error);
                displayError('Error verifying product information.');
            });
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
