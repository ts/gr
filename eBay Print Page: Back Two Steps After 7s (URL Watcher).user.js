
// ==UserScript==
// @downloadURL      
// @updateURL      
// @name         eBay Print Page: Back Two Steps After 7s (URL Watcher)
// @namespace    http://tampermonkey.net/
// @version      
// @description  Start a 7s timer to go back two steps only when the URL becomes the eBay shipping print page.
// @match        *://*.ebay.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // --- Configuration ---
    const TARGET_ORIGIN = 'https://www.ebay.com';
    const TARGET_PATH = '/ship/single/print/'; // exact path with trailing slash
    const TIMEOUT_MS = 7000;


    // Use this for exact match (origin + path must match exactly)// ==/UserScript==
    const isOnTargetExact = () =>
        location.origin === TARGET_ORIGIN && location.pathname === TARGET_PATH;

    // If the print page sometimes omits trailing slash or adds query params, use this instead:
    // const isOnTargetExact = () =>
    //     location.origin === TARGET_ORIGIN &&
    //     location.pathname.startsWith('/ship/single/print');

    let currentUrl = location.href;
    let timerId = null;
    let startedForUrl = null; // which URL we started the timer for

    function clearTimer() {
        if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
        }
    }

    function startTimerIfNeeded() {
        const href = location.href;

        // Avoid starting multiple times for the same URL
        if (startedForUrl === href) return;

        if (isOnTargetExact()) {
            startedForUrl = href;

            const run = () => {
                clearTimer(); // ensure only one timer is active
                timerId = setTimeout(() => {
                    try {
                        if (history.length >= 2) {
                            history.go(-2);
                        } else {
                            history.back();
                        }
                    } catch (e) {
                        console.error('Back navigation failed:', e);
                    } finally {
                        timerId = null;
                    }
                }, TIMEOUT_MS);
            };

            // If DOM is already at least interactive, run immediately; else wait once
            if (document.readyState === 'interactive' || document.readyState === 'complete') {
                run();
            } else {
                const onReady = () => {
                    document.removeEventListener('DOMContentLoaded', onReady);
                    run();
                };
                document.addEventListener('DOMContentLoaded', onReady);
            }
        } else {
            // Leaving target page: cleanup and allow future triggers
            clearTimer();
            startedForUrl = null;
        }
    }

    function onUrlChange() {
        const href = location.href;
        if (href === currentUrl) return;
        currentUrl = href;
        startTimerIfNeeded();
    }

    // --- Hook into SPA navigation ---
    // popstate: back/forward navigation
    window.addEventListener('popstate', onUrlChange);
    // hashchange: fragment changes
    window.addEventListener('hashchange', onUrlChange);

    // Patch pushState/replaceState to catch programmatic navigations
    const _pushState = history.pushState;
    history.pushState = function () {
        const ret = _pushState.apply(this, arguments);
        // Dispatch after state change
        window.dispatchEvent(new Event('urlchange'));
        return ret;
    };

    const _replaceState = history.replaceState;
    history.replaceState = function () {
        const ret = _replaceState.apply(this, arguments);
        window.dispatchEvent(new Event('urlchange'));
        return ret;
    };

    // Listen for our synthetic event
    window.addEventListener('urlchange', onUrlChange);

    // Initial check for direct loads
    startTimerIfNeeded();
})();

