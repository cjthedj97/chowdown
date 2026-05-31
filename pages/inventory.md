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
        border: 1px solid var(--border);
        background-color: var(--surface-soft);
        color: var(--text);
        border-radius: 5px;
        transition: background-color 0.3s;
    }

    button:hover {
        background-color: color-mix(in srgb, var(--accent) 12%, var(--surface-soft));
    }

    #scanner-panel {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 20px;
        background: var(--surface);
        color: var(--text);
    }

    #scanner-reader {
        width: 100%;
        max-width: 420px;
        min-height: 240px;
        border-radius: 8px;
        overflow: hidden;
        background: var(--surface-soft);
        border: 1px solid var(--border);
    }

    #scanner-status {
        margin-top: 8px;
        color: var(--muted);
    }

    .scanner-decision {
        margin-top: 12px;
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: color-mix(in srgb, var(--surface-soft) 75%, var(--surface));
    }

    .scanner-decision p {
        margin-top: 0;
    }

    .scanner-decision.is-hidden {
        display: none;
    }

    #scanner-panel .tip {
        font-size: 0.95rem;
        color: var(--muted);
        margin-bottom: 0;
    }

    .status-ok {
        color: var(--success);
    }

    .status-error {
        color: var(--danger);
    }

    .missing-warning {
        margin-top: 4px;
        color: color-mix(in srgb, var(--accent) 65%, var(--danger));
    }

    .missing-good {
        margin-top: 4px;
        color: var(--success);
    }

    .inventory-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
    }

    .summary-card {
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
        box-shadow: var(--shadow);
    }

    .summary-card .summary-value {
        display: block;
        font-size: 2rem;
        line-height: 1;
        font-weight: 700;
        margin-bottom: 4px;
        color: var(--accent);
    }

    .summary-card .summary-label {
        color: var(--muted);
        font-size: 0.95rem;
    }

    .inventory-row {
        display: flex;
        gap: 12px;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        margin-bottom: 10px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
    }

    .inventory-row.used {
        background: color-mix(in srgb, var(--surface-soft) 85%, var(--surface));
    }

    .inventory-row-main {
        min-width: 0;
        flex: 1 1 auto;
    }

    .inventory-row-title {
        display: block;
        font-weight: 700;
        word-break: break-word;
    }

    .inventory-row-meta {
        color: var(--muted);
        font-size: 0.9rem;
        margin-top: 2px;
    }

    .inventory-row-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
        flex: 0 0 auto;
    }

    .inventory-row-actions button {
        padding: 8px 10px;
        font-size: 0.95rem;
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
        Keep scanning after each action
    </label>
    <div id="scanner-reader"></div>
    <p id="scanner-status">Scanner idle.</p>
    <div id="scanner-decision" class="scanner-decision is-hidden">
        <p id="scanner-decision-text"></p>
        <div class="controls">
            <button id="scanner-add-item" type="button">Add to Inventory</button>
            <button id="scanner-mark-used" type="button">Mark as Used</button>
            <button id="scanner-scan-next" type="button">Scan Next</button>
        </div>
    </div>
    <p class="tip">Tip: Works best over HTTPS and good lighting. If scan fails, enter UPC manually below.</p>
</div>
<form id="manual-upc-form" class="button-container">
    <label for="manual-upc">Enter UPC Code:</label>
    <input type="text" id="manual-upc" name="manual-upc" required>
    <button type="submit">Add to Inventory</button>
    <button type="button" id="manual-upc-remove">Mark as Used</button>
</form>
<div class="controls">
    <button onclick="shareList()">Share List</button>
    <button onclick="clearData()">Clear Data</button>
    <button onclick="clearUsedProducts()">Clear Used Products</button>
    <button onclick="refreshPantryMatches()">Find Matching Recipes</button>
</div>
<div id="inventory-summary" class="inventory-summary"></div>
<div id="result"></div>
<div id="lists"></div>
<div id="pantry-matches"></div>

<script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
<script>
    const storageKey = 'upcProducts';
    function toInt(value, fallback) {
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function normalizeStoredProduct(item) {
        if (!item) return null;

        if (typeof item === 'string') {
            const code = item.trim();
            if (!code) return null;
            return {
                code: code,
                product_name: code,
                count: 1,
                used: 0
            };
        }

        if (typeof item !== 'object') return null;

        const code = String(item.code || item.upc || '').trim();
        const productName = String(item.product_name || item.productName || item.name || code || 'Unknown Product').trim();
        if (!code && !productName) return null;

        let count = toInt(item.count, 1);
        let used = toInt(item.used, 0);
        if (count < 0) count = 0;
        if (used < 0) used = 0;
        if (count < used) count = used;

        return {
            code: code,
            product_name: productName,
            count: count,
            used: used
        };
    }

    function loadProducts() {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            const source = Array.isArray(parsed)
                ? parsed
                : (parsed && Array.isArray(parsed.products) ? parsed.products : []);

            return source.map(normalizeStoredProduct).filter(Boolean);
        } catch (error) {
            console.warn('Could not load stored inventory data:', error);
            return [];
        }
    }

    function saveProducts() {
        localStorage.setItem(storageKey, JSON.stringify(products));
    }

    let products = loadProducts();
    let cachedRecipes = [];
    let barcodeScanner = null;
    let scannerActive = false;
    let pendingScan = null;

    if (products.length) {
        saveProducts();
    }

    document.getElementById('manual-upc-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const upc = document.getElementById('manual-upc').value.trim();
        lookupUPC(upc);
    });

    document.getElementById('manual-upc-remove').addEventListener('click', function() {
        const upc = document.getElementById('manual-upc').value.trim();
        markUPCAsUsed(upc);
    });

    document.getElementById('lists').addEventListener('click', function(event) {
        const button = event.target.closest('button[data-inventory-action]');
        if (!button) return;

        const action = button.getAttribute('data-inventory-action');
        const upc = button.getAttribute('data-upc');

        if (action === 'increment') {
            adjustProductCount(upc, 1);
        } else if (action === 'decrement') {
            adjustProductCount(upc, -1);
        } else if (action === 'use') {
            markUPCAsUsed(upc);
        }
    });

    document.getElementById('start-scan').addEventListener('click', startBarcodeScanner);
    document.getElementById('stop-scan').addEventListener('click', stopBarcodeScanner);
    document.getElementById('scanner-add-item').addEventListener('click', handlePendingScanAdd);
    document.getElementById('scanner-mark-used').addEventListener('click', handlePendingScanRemove);
    document.getElementById('scanner-scan-next').addEventListener('click', handlePendingScanSkip);

    window.addEventListener('beforeunload', function () {
        if (scannerActive) {
            stopBarcodeScanner();
        }
    });

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
        upc = String(upc).trim();

        fetchProduct(upc)
            .then(product => {
                if (product) {
                    addProduct(upc, product);
                } else {
                    displayError('Product not found. To add unknown product visit https://world.openfoodfacts.org/');
                }
            })
            .catch(error => {
                console.error('Error fetching product:', error);
                displayError('Error fetching product information.');
            })
            .finally(() => {
                document.getElementById('manual-upc').value = '';
            });
    }

    function fetchProduct(upc) {
        const url = `https://world.openfoodfacts.org/api/v0/product/${upc}.json`;

        return fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.status === 1) {
                    return data.product;
                }

                return null;
            });
    }

    function setScannerStatus(message, isError) {
        const statusEl = document.getElementById('scanner-status');
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.style.color = isError ? 'var(--danger)' : 'var(--muted)';
    }

    function setScannerButtons() {
        const startButton = document.getElementById('start-scan');
        const stopButton = document.getElementById('stop-scan');
        if (!startButton || !stopButton) return;
        startButton.disabled = scannerActive;
        stopButton.disabled = !scannerActive;
    }

    function updateInventorySummary() {
        const summary = document.getElementById('inventory-summary');
        if (!summary) return;

        const distinctProducts = products.length;
        const totalItems = products.reduce((sum, product) => sum + product.count, 0);
        const usedItems = products.reduce((sum, product) => sum + product.used, 0);
        const availableItems = products.reduce((sum, product) => sum + Math.max(0, product.count - product.used), 0);

        summary.innerHTML = `
            <div class="summary-card">
                <span class="summary-value">${distinctProducts}</span>
                <div class="summary-label">Distinct UPCs</div>
            </div>
            <div class="summary-card">
                <span class="summary-value">${totalItems}</span>
                <div class="summary-label">Total Items</div>
            </div>
            <div class="summary-card">
                <span class="summary-value">${availableItems}</span>
                <div class="summary-label">Available</div>
            </div>
            <div class="summary-card">
                <span class="summary-value">${usedItems}</span>
                <div class="summary-label">Used</div>
            </div>
        `;
    }

    function normalizeUPC(rawCode) {
        return String(rawCode || '').replace(/[^0-9]/g, '').trim();
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function findProductIndex(upc) {
        return products.findIndex(p => p.code === upc);
    }

    function renderProductRow(product, isUsedList) {
        const available = Math.max(0, product.count - product.used);
        const href = `https://world.openfoodfacts.org/product/${encodeURIComponent(product.code)}`;
        const title = escapeHtml(product.product_name);
        const code = escapeHtml(product.code);
        const usedLabel = product.used === 1 ? 'used' : 'used';
        const availableLabel = available === 1 ? 'available' : 'available';
        const rowClass = isUsedList ? 'inventory-row used' : 'inventory-row';

        return `
            <div class="${rowClass}">
                <div class="inventory-row-main">
                    <a class="inventory-row-title" href="${href}" target="_blank" rel="noopener noreferrer">${title}</a>
                    <div class="inventory-row-meta">UPC: ${code} | ${product.used} ${usedLabel} | ${available} ${availableLabel}</div>
                </div>
                <div class="inventory-row-actions">
                    <button type="button" data-inventory-action="increment" data-upc="${code}">+1</button>
                    <button type="button" data-inventory-action="decrement" data-upc="${code}">-1</button>
                    <button type="button" data-inventory-action="use" data-upc="${code}">Use 1</button>
                </div>
            </div>
        `;
    }

    function adjustProductCount(upc, delta) {
        const index = findProductIndex(upc);
        if (index === -1) {
            displayError(`The product with UPC "${upc}" is not in your inventory.`);
            return;
        }

        const product = products[index];
        if (delta > 0) {
            product.count += delta;
            saveProducts();
            displaySuccess(`Added one more of "${product.product_name}".`);
            generateLists();
            return;
        }

        if (product.count <= 0) {
            displayError(`The product with UPC "${upc}" cannot be reduced further.`);
            return;
        }

        product.count = Math.max(0, product.count + delta);
        if (product.used > product.count) {
            product.used = product.count;
        }

        if (product.count === 0 && product.used === 0) {
            products.splice(index, 1);
            displaySuccess(`Removed "${product.product_name}" from inventory.`);
        } else {
            displaySuccess(`Removed one of "${product.product_name}".`);
        }

        saveProducts();
        generateLists();
    }

    function onBarcodeScanned(decodedText) {
        const upc = normalizeUPC(decodedText);
        if (pendingScan) {
            return;
        }

        if (!upc) {
            setScannerStatus('Scanned code was not a valid numeric UPC.', true);
            return;
        }

        stopBarcodeScanner();
        setScannerStatus(`Scanned: ${upc}. Looking up product...`);

        fetchProduct(upc)
            .then(product => {
                if (!product) {
                    setScannerStatus('Open Food Facts did not have a product name for this UPC. Choose an action below.');
                }

                showPendingScan(upc, product || { product_name: 'Unknown Product' });
            })
            .catch(error => {
                console.error('Error fetching product:', error);
                displayError('Error fetching product information.');
            });
    }

    function showPendingScan(upc, product) {
        pendingScan = {
            upc: upc,
            product: product
        };

        const decision = document.getElementById('scanner-decision');
        const decisionText = document.getElementById('scanner-decision-text');
        if (decisionText) {
            const productName = product.product_name || 'Unknown Product';
            const quantity = product.quantity ? ` (${product.quantity})` : '';
            decisionText.textContent = `Scanned ${upc}: ${productName}${quantity}. Add it to inventory or mark it as used?`;
        }

        if (decision) {
            decision.classList.remove('is-hidden');
        }

        setScannerStatus('Choose what to do with this scan.');
    }

    function hidePendingScan() {
        pendingScan = null;
        const decision = document.getElementById('scanner-decision');
        if (decision) {
            decision.classList.add('is-hidden');
        }
    }

    function resumeScannerIfRequested() {
        const continuousScan = document.getElementById('scan-continuous');
        if (continuousScan && continuousScan.checked) {
            startBarcodeScanner();
            return;
        }

        setScannerStatus('Scan complete. Start the camera when you are ready for another item.');
    }

    function handlePendingScanAdd() {
        if (!pendingScan) return;

        addProduct(pendingScan.upc, pendingScan.product);
        hidePendingScan();
        resumeScannerIfRequested();
    }

    function handlePendingScanRemove() {
        if (!pendingScan) return;

        markUPCAsUsed(pendingScan.upc);
        hidePendingScan();
        resumeScannerIfRequested();
    }

    function handlePendingScanSkip() {
        if (!pendingScan) return;

        hidePendingScan();
        setScannerStatus('Scan skipped. Start the camera when you are ready for another item.');

        const continuousScan = document.getElementById('scan-continuous');
        if (continuousScan && continuousScan.checked) {
            startBarcodeScanner();
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
        saveProducts();
    
        // Regenerate the product list display
        generateLists();
    
        // Clear the UPC input field
        document.getElementById('manual-upc').value = '';
    }

    function markUPCAsUsed(upc) {
        const index = products.findIndex(p => p.code === upc);
    
        if (index !== -1 && products[index].count > products[index].used) {
            products[index].used += 1; // Increment the used count
            saveProducts();
            displaySuccess(`Marked one of "${products[index].product_name}" as used.`);
            generateLists();
        } else {
            displayError(`The product with UPC "${upc}" is not available in your local inventory or all have been marked as used.`);
        }
    
        document.getElementById('manual-upc').value = ''; // Clear the manual UPC text box
    }
    
    // Function to display success messages to the user
    function displaySuccess(message) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<p class="status-ok">${message}</p>`;
    }
    
    // Function to display error messages to the user
    function displayError(message) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<p class="status-error">${message}</p>`;
    }

    function generateLists() {
        const listsDiv = document.getElementById('lists');
        updateInventorySummary();
        const usedProducts = products.filter(p => p.used > 0);
        const unusedProducts = products.filter(p => p.count > p.used);

        listsDiv.innerHTML = `
            <h2>Used Products (${usedProducts.reduce((sum, p) => sum + p.used, 0)})</h2>
            ${usedProducts.map(p => renderProductRow(p, true)).join('') || '<p>No products used yet.</p>'}
            <h2>Unused Products (${unusedProducts.reduce((sum, p) => sum + (p.count - p.used), 0)})</h2>
            ${unusedProducts.map(p => renderProductRow(p, false)).join('') || '<p>No products unused.</p>'}
        `;

        refreshPantryMatches();
    }

    function clearData() {
        products = [];
        localStorage.removeItem(storageKey);
        updateInventorySummary();
        document.getElementById('lists').innerHTML = '';
        hidePendingScan();
        if (scannerActive) {
            stopBarcodeScanner();
        }
        setScannerStatus('Scanner idle.');
        setScannerButtons();
        displaySuccess('All data cleared.');
    }

    function clearUsedProducts() {
        products.forEach(product => product.used = 0);
        saveProducts();
        updateInventorySummary();
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
                    ${item.missing.length ? `<div class="missing-warning"><em>Likely missing:</em> ${item.missing.join(', ')}</div>` : '<div class="missing-good"><em>Likely have most core ingredients.</em></div>'}
                </div>
            `).join('')}
        `;
    }

    setScannerButtons();
</script>
