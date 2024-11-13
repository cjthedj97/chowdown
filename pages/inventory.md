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
<script>
    const storageKey = 'upcProducts';
    let products = JSON.parse(localStorage.getItem(storageKey)) || [];

    document.getElementById('upc-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const upc = document.getElementById('upc').value;
        if (upc) {
            lookupUPC(upc);
        } else {
            displayError('Please enter a UPC code.');
        }
    });

    document.getElementById('remove-upc-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const upc = document.getElementById('remove-upc').value;
        if (upc) {
            markUPCAsUsed(upc);
        } else {
            displayError('Please enter a UPC code to mark as used.');
        }
    });

    window.onload = generateLists;

    function lookupUPC(upc) {
        if (typeof upc !== 'string') {
            console.error('Invalid UPC type:', typeof upc);
            return;
        }
        upc = upc.trim();
        const url = `https://world.openfoodfacts.org/api/v0/product/${upc}.json`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.status === 1) {
                    const name = data.product.product_name || 'Unknown Product';
                    const size = data.product.quantity || 'Unknown Size';
                    addProduct(upc, name, size);
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

    function addProduct(upc, name, size) {
        if (typeof upc !== 'string') {
            console.error('Invalid UPC type:', typeof upc);
            return;
        }
        upc = upc.trim(); // Ensure no leading or trailing spaces
    
        // Check if the product already exists in the list
        const existingProductIndex = products.findIndex(p => p.code === upc);
    
        if (existingProductIndex !== -1) {
            // If the product exists, update its details or count
            products[existingProductIndex].count += 1;
            displaySuccess(`Updated quantity for "${products[existingProductIndex].product_name}".`);
        } else {
            // Add new product to the list
            const newProduct = {
                code: upc,
                product_name: name,
                size: size,
                count: 1,
                used: 0
            };
            products.push(newProduct);
            displaySuccess(`Added new product: "${name} - ${size}".`);
        }
    
        // Save the updated list to local storage
        localStorage.setItem(storageKey, JSON.stringify(products));
    
        // Regenerate the product list display
        generateLists();
    }

    function markUPCAsUsed(upc) {
        if (typeof upc !== 'string') {
            console.error('Invalid UPC type:', typeof upc);
            return;
        }
        upc = upc.trim(); // Ensure no leading or trailing spaces
        console.log("Attempting to mark UPC as used:", upc);
    
        // Find the product by its UPC code
        const index = products.findIndex(p => p.code === upc);
        console.log("Index found:", index, "for UPC:", upc);
    
        if (index !== -1) {
            if (products[index].count > products[index].used) {
                products[index].used += 1; // Increment the used count
                localStorage.setItem(storageKey, JSON.stringify(products));
                displaySuccess(`Marked one of "${products[index].product_name}" as used.`);
            } else {
                displayError(`All units of "${products[index].product_name}" are already marked as used.`);
            }
        } else {
            // If not found, verify against the external database
            verifyProductWithAPI(upc);
        }
    
        // Clear the remove UPC text box
        document.getElementById('remove-upc').value = '';
    }

    function verifyProductWithAPI(upc) {
        if (typeof upc !== 'string') {
            console.error('Invalid UPC type:', typeof upc);
            return;
        }
        upc = upc.trim();
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
