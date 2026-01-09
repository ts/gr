// ==UserScript==
// @version      0.0.2
// @updateURL    https://raw.githubusercontent.com/ts/gr/main/eBay%20Orders%20Shipping%20Label%20Navigator.user.js
// @downloadURL  https://raw.githubusercontent.com/ts/gr/main/eBay%20Orders%20Shipping%20Label%20Navigator.user.js
// @name         eBay Orders Shipping Label Navigator
// @namespace    https://example.com/ebay-shipping-keyboard
// @description  Navigate eBay Orders table with arrow keys and enter to open Get shipping label
// @match        *://www.ebay.com/sh/ord*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let buttons = [];
    let selectedIndex = 0;
    const SELECTED_STYLE = 'outline: 2px solid #0077cc; background: #e6f2ff;';

    function refreshButtons() {
        buttons = Array.from(document.querySelectorAll('button, a')).filter(btn => {
            return /get shipping label/i.test(btn.textContent);
        });

        if (buttons.length > 0) {
            // Ensure selectedIndex is valid
            selectedIndex = Math.min(selectedIndex, buttons.length - 1);
            // Apply selection immediately
            updateSelection();
        }
    }

    function updateSelection() {
        buttons.forEach((btn, i) => {
            if (i === selectedIndex) {
                btn.style.cssText += SELECTED_STYLE;
                btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                // Remove previous selection styles
                btn.style.outline = '';
                btn.style.background = '';
            }
        });
    }

    function handleKey(e) {
        if (buttons.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % buttons.length;
                updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + buttons.length) % buttons.length;
                updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (buttons[selectedIndex]) buttons[selectedIndex].click();
                break;
        }
    }

    // Initial scan
    refreshButtons();

    // Keyboard listener
    document.addEventListener('keydown', handleKey);

    // SPA-safe: watch for table changes
    const observer = new MutationObserver(refreshButtons);
    observer.observe(document.body, { childList: true, subtree: true });
})();
