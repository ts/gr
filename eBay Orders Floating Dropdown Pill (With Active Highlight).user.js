// ==UserScript==
// @name         eBay Orders Floating Dropdown Pill (With Active Highlight)
// @namespace    https://example.com/ebay-floating-dropdown-pill
// @version      1.2
// @description  Floating pill with dropdown for eBay Orders SPA, highlights selected option
// @match        *://www.ebay.com/sh/ord*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const BUTTON_SELECTOR = '.listbox-button__control';
    const OPTION_SELECTOR = '.listbox__option';

    let floatingPill, dropdownContainer;
    let lastText = '';

    function createPill() {
        floatingPill = document.createElement('div');
        floatingPill.style.position = 'fixed';
        floatingPill.style.top = '12px';
        floatingPill.style.right = '12px';
        floatingPill.style.zIndex = '999999';
        floatingPill.style.padding = '8px 14px';
        floatingPill.style.borderRadius = '999px';
        floatingPill.style.background = '#111';
        floatingPill.style.color = '#fff';
        floatingPill.style.fontWeight = '600';
        floatingPill.style.fontSize = '13px';
        floatingPill.style.cursor = 'pointer';
        floatingPill.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        floatingPill.style.fontFamily = 'system-ui, sans-serif';
        floatingPill.style.display = 'inline-flex';
        floatingPill.style.alignItems = 'center';
        floatingPill.style.gap = '6px';
        floatingPill.textContent = 'Loading…';

        document.body.appendChild(floatingPill);

        dropdownContainer = document.createElement('div');
        dropdownContainer.style.position = 'fixed';
        dropdownContainer.style.top = '0';
        dropdownContainer.style.left = '0';
        dropdownContainer.style.minWidth = '200px';
        dropdownContainer.style.background = '#fff';
        dropdownContainer.style.color = '#111';
        dropdownContainer.style.border = '1px solid #ccc';
        dropdownContainer.style.borderRadius = '6px';
        dropdownContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        dropdownContainer.style.display = 'none';
        dropdownContainer.style.flexDirection = 'column';
        dropdownContainer.style.padding = '6px 0';
        dropdownContainer.style.zIndex = '1000000';
        document.body.appendChild(dropdownContainer);

        floatingPill.addEventListener('click', () => {
            dropdownContainer.style.display = dropdownContainer.style.display === 'none' ? 'flex' : 'none';
            positionDropdown();
        });

        document.addEventListener('click', e => {
            if (!floatingPill.contains(e.target) && !dropdownContainer.contains(e.target)) {
                dropdownContainer.style.display = 'none';
            }
        });

        window.addEventListener('resize', positionDropdown);
        window.addEventListener('scroll', positionDropdown, true);
    }

    function positionDropdown() {
        if (!floatingPill || !dropdownContainer) return;
        const rect = floatingPill.getBoundingClientRect();
        dropdownContainer.style.top = `${rect.bottom + 6}px`;
        dropdownContainer.style.left = `${rect.left}px`;
        dropdownContainer.style.minWidth = `${rect.width}px`;
    }

    function updateDropdown(button) {
        const options = button.closest('.listbox-button').querySelectorAll(OPTION_SELECTOR);
        if (!options || options.length === 0) return;

        // Avoid rebuilding if nothing changed
        const currentText = Array.from(options).map(o => o.textContent.trim()).join('|');
        if (dropdownContainer.dataset.last === currentText) return;
        dropdownContainer.dataset.last = currentText;

        dropdownContainer.innerHTML = '';

        options.forEach(opt => {
            const textEl = opt.querySelector('.listbox__value');
            if (!textEl) return;

            const div = document.createElement('div');
            div.textContent = textEl.textContent.trim();
            div.style.padding = '6px 12px';
            div.style.cursor = 'pointer';

            // Highlight active option
            if (opt.classList.contains('listbox__option--active') || opt.getAttribute('aria-selected') === 'true') {
                div.style.background = '#e0e0e0';
                div.style.fontWeight = '600';
            }

            div.addEventListener('mouseenter', () => div.style.background = '#eee');
            div.addEventListener('mouseleave', () => {
                if (opt.classList.contains('listbox__option--active') || opt.getAttribute('aria-selected') === 'true') {
                    div.style.background = '#e0e0e0';
                } else {
                    div.style.background = 'transparent';
                }
            });

            // Proxy click to real option
            div.addEventListener('click', () => {
                opt.click(); // SPA-friendly
                dropdownContainer.style.display = 'none';
            });

            dropdownContainer.appendChild(div);
        });
    }

    function updatePillText(button) {
        const textSpan = button.querySelector('.btn__text');
        if (!textSpan) return;
        const text = textSpan.textContent.trim();
        if (text === lastText) return;
        lastText = text;
        floatingPill.textContent = text;
    }

    function init(button) {
        if (!floatingPill) createPill();
        updatePillText(button);
        updateDropdown(button);

        let timeout;
        const observer = new MutationObserver(() => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                updatePillText(button);
                updateDropdown(button);
            }, 100);
        });
        observer.observe(button, { childList: true, subtree: true, characterData: true });
    }

    // SPA-safe: watch for button appearing
    const scanObserver = new MutationObserver(() => {
        const button = document.querySelector(BUTTON_SELECTOR);
        if (button) init(button);
    });

    scanObserver.observe(document.body, { childList: true, subtree: true });

})();
