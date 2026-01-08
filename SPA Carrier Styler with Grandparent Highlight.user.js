// ==UserScript==
// @name         SPA Carrier Styler with Grandparent Highlight
// @namespace    https://example.com/carrier-styler-grandparent
// @version      1.5
// @description  Apply styles based on carrier and style "Purchase shipping label" links/buttons with grandparent background
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Define full style objects per carrier
    const CARRIER_STYLES = [
        { match: /fedex/i, styles: { color: 'purple', fontWeight: 'bold', fontStyle: 'italic', backgroundColor: '#f0e6ff' } },
        { match: /usps/i,  styles: { color: 'blue', fontWeight: 'bold', fontStyle: 'normal', backgroundColor: '#e6f0ff' } },
        { match: /ups/i,   styles: { color: 'brown', fontWeight: 'normal', fontStyle: 'italic', backgroundColor: '#f5f0e6' } }
    ];

    const processedElements = new WeakSet();
    const processedLinks = new WeakSet();

    function applyStyling(container) {
        if (!container) return;

        const text = container.textContent || '';
        let matched = false;
        let appliedColor = null;

        for (const carrier of CARRIER_STYLES) {
            if (carrier.match.test(text)) {
                if (!processedElements.has(container) || container.dataset.lastCarrier !== carrier.match) {
                    console.log(`[CarrierStyler] Applying styles to "${text.trim()}"`);
                    Object.assign(container.style, carrier.styles);
                    container.dataset.lastCarrier = carrier.match; // track which carrier applied
                }
                matched = true;
                appliedColor = carrier.styles.color;
                break;
            }
        }

        if (!matched && container.style.color !== '') {
            console.log(`[CarrierStyler] Resetting styles for "${text.trim()}"`);
            container.style = ''; // reset all inline styles
            delete container.dataset.lastCarrier;
        }

        // Apply link/button styling if we have a carrier color
        if (appliedColor) {
            const selector = 'a, button'; // match both links and buttons
            document.querySelectorAll(selector).forEach(el => {
                if (/Purchase shipping label/i.test(el.textContent)) {
                    if (!processedLinks.has(el) || el.dataset.lastCarrierColor !== appliedColor) {

                        // Navigate manually up the DOM
                        const parentDiv = el.parentElement; // immediate parent
                        const grandParentDiv = parentDiv ? parentDiv.parentElement : null; // parent of parent

                        if (grandParentDiv) {
                            grandParentDiv.style.backgroundColor = appliedColor;
                        }

                        // Set element (link/button) styles
                        el.style.backgroundColor = 'white';
                        el.style.color = appliedColor;
                        el.style.border = 'none'; // remove previous border if needed

                        el.dataset.lastCarrierColor = appliedColor;
                        processedLinks.add(el);
                    }
                }
            });
        }
    }

    function processElement(el) {
        applyStyling(el);
        if (!processedElements.has(el)) {
            const observer = new MutationObserver(() => applyStyling(el));
            observer.observe(el, { characterData: true, childList: true, subtree: true });
            processedElements.add(el);
        }
    }

    // Observe the document for new cost-breakdown divs
    const docObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return; // only elements
                if (node.matches && node.matches('[data-testid="cost-breakdown"]')) {
                    console.log('[CarrierStyler] New cost-breakdown element detected');
                    processElement(node);
                }
                node.querySelectorAll && node.querySelectorAll('[data-testid="cost-breakdown"]').forEach(processElement);
            });
        }
    });

    docObserver.observe(document.body, { childList: true, subtree: true });

    // Initial scan in case elements are already present
    document.querySelectorAll('[data-testid="cost-breakdown"]').forEach(processElement);

})();
