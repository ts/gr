// ==UserScript==
// @name         eBay Shipping Badge (Safe)
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Dynamic shipping difference badge for eBay, safe version
// @author       You
// @match        https://www.ebay.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log('[Shipping Badge] Script started');

    function parseDollar(str) {
        if (!str) return 0;
        const match = str.match(/\$([\d,.]+)/);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    }

    function updateBadge() {
        try {
            const shippingH3 = [...document.querySelectorAll('h3')].find(h => h.textContent.includes('Shipping paid'));
            if (!shippingH3) return;

            const shippingPaid = parseDollar(shippingH3.nextElementSibling?.textContent);
            const totalDiv = document.querySelector('div[data-testid="total-cost"]');
            if (!totalDiv) return;

            const totalSpan = totalDiv.querySelector('span:nth-child(2)');
            if (!totalSpan) return;

            const totalCost = parseDollar(totalSpan.textContent);

            // Only update if value changed
            const diff = shippingPaid - totalCost;
            let badge = document.getElementById('shipping-diff-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.id = 'shipping-diff-badge';
                badge.style.marginLeft = '8px';
                badge.style.padding = '2px 6px';
                badge.style.borderRadius = '4px';
                badge.style.fontWeight = 'bold';
                badge.style.background = '#fff';
                badge.style.border = '1px solid #ccc';
                totalDiv.appendChild(badge);
            }

            const newText = (diff >= 0 ? '+' : '-') + '$' + Math.abs(diff).toFixed(2);
            if (badge.textContent !== newText) {
                badge.textContent = newText;
                badge.style.color = diff >= 0 ? 'green' : 'red';
                console.log('[Shipping Badge] Updated:', badge.textContent);
            }
        } catch (err) {
            console.error('[Shipping Badge] Error:', err);
        }
    }

    // Only observe the **span with the total value**, not the entire div
    function initObserver() {
        const totalSpan = document.querySelector('div[data-testid="total-cost"] span:nth-child(2)');
        if (!totalSpan) return;

        let lastValue = totalSpan.textContent;
        const observer = new MutationObserver(() => {
            if (totalSpan.textContent !== lastValue) {
                lastValue = totalSpan.textContent;
                updateBadge();
            }
        });

        observer.observe(totalSpan, { characterData: true, subtree: true, childList: true });
        console.log('[Shipping Badge] Observer attached to total span');
    }

    // Wait until elements exist, then init once
    const readyCheck = setInterval(() => {
        const shippingH3 = [...document.querySelectorAll('h3')].find(h => h.textContent.includes('Shipping paid'));
        const totalSpan = document.querySelector('div[data-testid="total-cost"] span:nth-child(2)');
        if (shippingH3 && totalSpan) {
            clearInterval(readyCheck);
            updateBadge();
            initObserver();
            console.log('[Shipping Badge] Initialized successfully');
        }
    }, 500);

})();
