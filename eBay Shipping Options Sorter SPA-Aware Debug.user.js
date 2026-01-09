// ==UserScript==
// @version      0.0.2
// @updateURL    https://raw.githubusercontent.com/ts/gr/main/eBay%20Shipping%20Options%20Sorter%20SPA-Aware%20Debug.user.js
// @downloadURL  https://raw.githubusercontent.com/ts/gr/main/eBay%20Shipping%20Options%20Sorter%20SPA-Aware%20Debug.user.js
// @name         eBay Shipping Options Sorter SPA-Aware Debug
// @namespace    https://example.com/ebay-shipping-sorter
// @description  Sort shipping options by price on eBay, sink excluded services below preferred ones, SPA-aware, pink for excluded
// @match        *://www.ebay.com/ship/single*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const TOP_VISIBLE = 5; // How many options to show initially

    // List of service names to deprioritize
    const EXCLUDE_SERVICES = [
        "FedEx",
        "UPS® Ground Saver"
    ];

    function parsePrice(text) {
        const match = text.replace(',', '').match(/\$([0-9.]+)/);
        return match ? parseFloat(match[1]) : Infinity;
    }

    function isExcluded(serviceName) {
        return EXCLUDE_SERVICES.some(name => serviceName.toLowerCase().includes(name.toLowerCase()));
    }

    function processShippingTable() {
        const tableBody = document.querySelector('fieldset[data-testid="service-list-table"] table tbody');
        if (!tableBody) return;

        // Disconnect observer temporarily to avoid infinite loops
        observer.disconnect();

        // Get all rows (including dynamically added)
        const rows = Array.from(tableBody.querySelectorAll('tr[data-testid="service"]'));

        // Split into preferred and excluded
        const preferredRows = [];
        const excludedRows = [];

        rows.forEach(row => {
            const name = row.querySelector('label[data-testid="service-title"]')?.textContent || '';
            if (isExcluded(name)) excludedRows.push(row);
            else preferredRows.push(row);
        });

        // Sort each group by price
        preferredRows.sort((a, b) => parsePrice(a.querySelector('td[data-testid="service-price"] span')?.textContent || '') -
                                     parsePrice(b.querySelector('td[data-testid="service-price"] span')?.textContent || ''));
        excludedRows.sort((a, b) => parsePrice(a.querySelector('td[data-testid="service-price"] span')?.textContent || '') -
                                    parsePrice(b.querySelector('td[data-testid="service-price"] span')?.textContent || ''));

        // Combine: preferred first, then excluded
        const sortedRows = [...preferredRows, ...excludedRows];

        // Reorder DOM and show/hide top N, color excluded rows pink
        sortedRows.forEach((row, i) => {
            tableBody.appendChild(row);
            row.style.display = i < TOP_VISIBLE ? '' : 'none';
            const name = row.querySelector('label[data-testid="service-title"]')?.textContent || '';
            row.style.color = isExcluded(name) ? 'pink' : '';
        });

        // Reconnect observer
        observer.observe(tableBody, { childList: true, subtree: true });
    }

    const tableBody = document.querySelector('fieldset[data-testid="service-list-table"] table tbody');
    const observer = new MutationObserver(processShippingTable);

    if (tableBody) {
        observer.observe(tableBody, { childList: true, subtree: true });
        processShippingTable();
    }

})();
