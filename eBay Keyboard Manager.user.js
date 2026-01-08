// ==UserScript==
// @name         eBay Keyboard Manager
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Central keyboard manager for eBay userscripts. Allows multiple scripts to register shortcuts safely.
// @match        *://*.ebay.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Prevent multiple instances
    if (window.KeyboardManager) return;

    // Internal storage of listeners: { key: [callback1, callback2, ...] }
    const listeners = {};

    // Single global keydown listener
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        // Skip typing fields
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

        const key = e.key.toLowerCase();
        if (listeners[key]) {
            listeners[key].forEach(cb => {
                try {
                    cb(e);
                } catch (err) {
                    console.error('KeyboardManager callback error:', err);
                }
            });
        }
    });

    // Public API
    window.KeyboardManager = {
        /**
         * Register a callback for a key
         * @param {string} key - Key character, e.g., 's' or 'r'
         * @param {function} callback - Function to call when key is pressed
         */
        register: (key, callback) => {
            const k = key.toLowerCase();
            if (!listeners[k]) listeners[k] = [];
            listeners[k].push(callback);
        },
        /**
         * Unregister a callback for a key
         * @param {string} key
         * @param {function} callback
         */
        unregister: (key, callback) => {
            const k = key.toLowerCase();
            if (!listeners[k]) return;
            listeners[k] = listeners[k].filter(cb => cb !== callback);
        },
        /**
         * List all registered keys
         * @returns {string[]}
         */
        listKeys: () => Object.keys(listeners)
    };

    console.log('KeyboardManager loaded: scripts can now register shortcuts via KeyboardManager.register(key, callback)');
})();
