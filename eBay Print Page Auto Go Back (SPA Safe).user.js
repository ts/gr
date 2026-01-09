// ==UserScript==
// @name         eBay Print Page Auto Go Back (SPA Safe)
// @namespace    https://example.com/ebay-auto-back
// @description  Detects URL changes and goes back 2 steps when "print" appears
// @match        https://www.ebay.com/*
// @grant        none
// @version      0.0.4
// @updateURL    https://raw.githubusercontent.com/ts/gr/main/eBay%20Print%20Page%20Auto%20Go%20Back%20(SPA%20Safe).user.js
// @downloadURL  https://raw.githubusercontent.com/ts/gr/main/eBay%20Print%20Page%20Auto%20Go%20Back%20(SPA%20Safe).user.js
// ==/UserScript==

(function () {
    'use strict';

    const DELAY_MS = 7000;
    let hasTriggered = false;

    console.log('[eBay Auto Back] Script loaded');

    function checkForPrint() {
        const url = window.location.href;

        console.log('[eBay Auto Back] Checking URL:', url);

        if (hasTriggered) return;

        if (url.toLowerCase().includes('print')) {
            hasTriggered = true;
            console.log('[eBay Auto Back] "print" detected — scheduling back navigation');

            setTimeout(() => {
                console.log('[eBay Auto Back] Timeout fired');
                console.log('[eBay Auto Back] History length:', window.history.length);

                if (window.history.length > 2) {
                    console.log('[eBay Auto Back] Going back 2 steps');
                    window.history.go(-2);
                } else if (window.history.length == 0) {
                   console.warn('[eBay Auto Back] Not enough history — attempting window.close()');
                   window.close();
                }
            }, DELAY_MS);
        }
    }

    // --- Hook into SPA navigation ---
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
        originalPushState.apply(this, arguments);
        checkForPrint();
    };

    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        checkForPrint();
    };

    window.addEventListener('popstate', checkForPrint);

    window.addEventListener('beforeprint', () => {
        console.log('Print dialog about to open');
    });

    window.addEventListener('afterprint', () => {
        console.log('Print dialog closed');
    });

    // Initial check (in case already on print)
    checkForPrint();
})();