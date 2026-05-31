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

    #scanner-panel {
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 20px;
        background: #fff;
    }

    #scanner-reader {
        width: 100%;
        max-width: 420px;
        min-height: 240px;
        border-radius: 8px;
        overflow: hidden;
        background: #000;
    }

    #scanner-status {
        margin-top: 8px;
        color: #374151;
    }

    @media screen and (max-width: 768px) {
        #scanner-reader {
            min-height: 200px;
        }
    }
</style>
<div id="scanner-panel">
    <h2 style="margin-top: 0;">Scan Barcode</h2>
    <p style="margin-top: 0;">Use your camera to scan a product barcode, then it will auto-add to inventory.</p>
    <div class="controls">
        <button id="start-scan" type="button">Start Camera Scan</button>
        <button id="stop-scan" type="button" disabled>Stop Camera</button>
    </div>
    <label style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 10px;">
        <input type="checkbox" id="scan-continuous">
        Keep scanning after successful add
    </label>
    <div id="scanner-reader"></div>
    <p id="scanner-status">Scanner idle.</p>
    <p style="font-size: 0.95rem; color: #6b7280; margin-bottom: 0;">Tip: Works best over HTTPS and good lighting. If scan fails, enter UPC manually below.</p>
</div>
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
    <button onclick="refreshPantryMatches()">Find Matching Recipes</button>
</div>
<div id="result"></div>
<div id="lists"></div>
<div id="pantry-matches"></div>

<script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
<script>
    const storageKey = 'upcProducts';
    let products = JSON.parse(localStorage.getItem(storageKey)) || [];
    let cachedRecipes = [];
    let barcodeScanner = null;
    let scannerActive = false;

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

    document.getElementById('start-scan').addEventListener('click', startBarcodeScanner);
    document.getElementById('stop-scan').addEventListener('click', stopBarcodeScanner);

    window.onload = generateLists;

    fetch('/search.json')
        .then(response => response.json())
        .then(data => {
            cachedRecipes = Array.isArray(data) ? data : [];
            refreshPantryMatches();
        })
        .catch(error => {
            console.error('Error loading recipe search data:', error);
        });
    
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

    function setScannerStatus(message, isError) {
        const statusEl = document.getElementById('scanner-status');
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.style.color = isError ? '#b91c1c' : '#374151';
    }

    function setScannerButtons() {
        const startButton = document.getElementById('start-scan');
        const stopButton = document.getElementById('stop-scan');
        if (!startButton || !stopButton) return;
        startButton.disabled = scannerActive;
        stopButton.disabled = !scannerActive;
    }

    function normalizeUPC(rawCode) {
        return String(rawCode || '').replace(/[^0-9]/g, '').trim();
    }

    function onBarcodeScanned(decodedText) {
        const upc = normalizeUPC(decodedText);
        if (!upc) {
            setScannerStatus('Scanned code was not a valid numeric UPC.', true);
            return;
        }

        setScannerStatus(`Scanned: ${upc}. Looking up product...`);
        lookupUPC(upc);

        var continuousScan = document.getElementById('scan-continuous');
        if (!continuousScan || !continuousScan.checked) {
            stopBarcodeScanner();
        }
    }

    async function startBarcodeScanner() {
        if (scannerActive) return;

        if (typeof Html5Qrcode === 'undefined') {
            setScannerStatus('Scanner library failed to load. Use manual UPC entry.', true);
            return;
        }

        try {
            barcodeScanner = new Html5Qrcode('scanner-reader');
            await barcodeScanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 280, height: 160 } },
                onBarcodeScanned,
                function () {}
            );
            scannerActive = true;
            setScannerButtons();
            setScannerStatus('Camera active. Point at a barcode.');
        } catch (error) {
            console.error('Unable to start barcode scanner:', error);
            setScannerStatus('Could not start camera scanner. Check camera permission and HTTPS.', true);
            scannerActive = false;
            setScannerButtons();
        }
    }

    async function stopBarcodeScanner() {
        if (!barcodeScanner || !scannerActive) {
            scannerActive = false;
            setScannerButtons();
            return;
        }

        try {
            await barcodeScanner.stop();
            await barcodeScanner.clear();
        } catch (error) {
            console.error('Error stopping scanner:', error);
        }

        scannerActive = false;
        barcodeScanner = null;
        setScannerButtons();
        setScannerStatus('Scanner stopped.');
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

        refreshPantryMatches();
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

    function normalizeText(value) {
        return (value || '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function tokenize(value) {
        const stop = new Set(['and', 'with', 'from', 'for', 'the', 'a', 'an', 'of', 'to', 'in', 'on']);
        return normalizeText(value)
            .split(' ')
            .filter(token => token.length >= 3 && !stop.has(token));
    }

    function buildPantryTokens() {
        const unusedProducts = products.filter(p => p.count > p.used);
        const tokenSet = new Set();

        unusedProducts.forEach(product => {
            tokenize(product.product_name).forEach(token => tokenSet.add(token));
        });

        return tokenSet;
    }

    function scoreRecipeAgainstPantry(recipe, pantryTokens) {
        const haystack = [recipe.title || '', recipe.ingredients || '', recipe.tags || ''].join(' ');
        const recipeTokens = new Set(tokenize(haystack));
        let matches = 0;

        pantryTokens.forEach(token => {
            if (recipeTokens.has(token)) {
                matches += 1;
            }
        });

        return matches;
    }

    function getLikelyMissingIngredients(recipe, pantryTokens) {
        const rawIngredients = (recipe.ingredients || '').split(',').map(item => item.trim()).filter(Boolean);
        const missing = [];

        for (let i = 0; i < rawIngredients.length; i++) {
            const ingredient = rawIngredients[i];
            const tokens = tokenize(ingredient);
            if (!tokens.length) continue;

            const hasMatch = tokens.some(token => pantryTokens.has(token));
            if (!hasMatch) {
                missing.push(ingredient);
            }

            if (missing.length >= 4) break;
        }

        return missing;
    }

    function refreshPantryMatches() {
        const container = document.getElementById('pantry-matches');
        if (!container) return;

        if (!cachedRecipes.length) {
            container.innerHTML = '<h2>Pantry Recipe Matches</h2><p>Loading recipe data...</p>';
            return;
        }

        const pantryTokens = buildPantryTokens();
        if (!pantryTokens.size) {
            container.innerHTML = '<h2>Pantry Recipe Matches</h2><p>Add unused products to see recipe matches.</p>';
            return;
        }

        const scored = cachedRecipes
            .map(recipe => {
                const score = scoreRecipeAgainstPantry(recipe, pantryTokens);
                const missing = getLikelyMissingIngredients(recipe, pantryTokens);
                return { recipe, score, missing };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 12);

        if (!scored.length) {
            container.innerHTML = '<h2>Pantry Recipe Matches</h2><p>No strong matches yet. Add more items or try broader ingredients.</p>';
            return;
        }

        container.innerHTML = `
            <h2>Pantry Recipe Matches</h2>
            <p>Best matches based on your unused inventory items.</p>
            ${scored.map(item => `
                <div class="product">
                    <strong>${item.score} match${item.score === 1 ? '' : 'es'}</strong> |
                    <a href="${item.recipe.url}">${item.recipe.title}</a>
                    ${item.missing.length ? `<div style="margin-top: 4px; color: #b45309;"><em>Likely missing:</em> ${item.missing.join(', ')}</div>` : '<div style="margin-top: 4px; color: #15803d;"><em>Likely have most core ingredients.</em></div>'}
                </div>
            `).join('')}
        `;
    }

    setScannerButtons();
</script>
