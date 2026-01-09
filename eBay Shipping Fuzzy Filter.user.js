// ==UserScript==
// @name         eBay Shipping Fuzzy Filter
// @namespace    http://tampermonkey.net/
// @description  Fuzzy filter for eBay shipping options (standalone)
// @author       You
// @match        https://www.ebay.com/*
// @grant        none
// @version      0.0.4
// @updateURL    https://raw.githubusercontent.com/ts/gr/main/eBay%20Shipping%20Fuzzy%20Filter.user.js
// @downloadURL  https://raw.githubusercontent.com/ts/gr/main/eBay%20Shipping%20Fuzzy%20Filter.user.js
// ==/UserScript==

(function() {
    'use strict';
    console.log('[Shipping Filter] Script started');

    const shippingFieldsetSelector = 'fieldset[data-testid="service-list-table"]';
    const fieldset = document.querySelector(shippingFieldsetSelector);
    if (!fieldset) {
        console.log('[Shipping Filter] Fieldset not found yet, will retry...');
        const interval = setInterval(() => {
            const fs = document.querySelector(shippingFieldsetSelector);
            if (fs) {
                clearInterval(interval);
                initFilter(fs);
            }
        }, 500);
    } else {
        initFilter(fieldset);
    }

    function initFilter(fs) {
        console.log('[Shipping Filter] Initializing...');
        let filterBox = document.getElementById('shipping-filter-box');
        if (!filterBox) {
            filterBox = document.createElement('input');
            filterBox.id = 'shipping-filter-box';
            filterBox.type = 'text';
            filterBox.placeholder = 'Filter shipping…';
            filterBox.style.marginBottom = '4px';
            filterBox.style.display = 'none';
            filterBox.style.width = '98%';
            filterBox.style.padding = '4px';
            filterBox.style.fontSize = '14px';
            fs.parentNode.insertBefore(filterBox, fs);
        }

        let radios = [];
        let selectedIndex = -1;

        function refreshRadios() {
            radios = [...fs.querySelectorAll('input[type="radio"][name="service"]')];
        }

        function filterRadios(query) {
            refreshRadios();
            const q = query.toLowerCase();
            radios.forEach(radio => {
                const label = radio.closest('label');
                if (!label) return;
                const text = label.textContent.toLowerCase();
                const matches = text.includes(q); // simple fuzzy
                label.style.display = matches ? '' : 'none';
            });
            selectedIndex = -1;
        }

        function highlightSelected() {
            radios.forEach((radio, i) => {
                const lbl = radio.closest('label');
                if (!lbl) return;
                lbl.style.backgroundColor = i === selectedIndex ? '#cce5ff' : '';
            });
        }

        filterBox.addEventListener('input', () => filterRadios(filterBox.value));

        filterBox.addEventListener('keydown', e => {
            if (radios.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                do { selectedIndex = (selectedIndex + 1) % radios.length; }
                while (radios[selectedIndex].closest('label').style.display === 'none');
                highlightSelected();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                do { selectedIndex = (selectedIndex - 1 + radios.length) % radios.length; }
                while (radios[selectedIndex].closest('label').style.display === 'none');
                highlightSelected();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && radios[selectedIndex]) {
                    radios[selectedIndex].click();
                    filterBox.style.display = 'none';
                    filterBox.value = '';
                    filterRadios('');
                }
            }
        });

        // Global `f` shortcut
        window.KeyboardManager = window.KeyboardManager || {
            shortcuts: {},
            register(key, cb) { this.shortcuts[key.toLowerCase()] = cb; },
            handleEvent(e) { const k=e.key.toLowerCase(); if(this.shortcuts[k]) { e.preventDefault(); this.shortcuts[k](e); } }
        };
        document.addEventListener('keydown', e => window.KeyboardManager.handleEvent(e));

        window.KeyboardManager.register('f', () => {
            filterBox.style.display = filterBox.style.display === 'none' ? '' : 'none';
            if (filterBox.style.display !== 'none') {
                filterBox.value = '';
                filterRadios('');
                filterBox.focus();
            }
        });

        console.log('[Shipping Filter] Initialized successfully');
    }
})();
