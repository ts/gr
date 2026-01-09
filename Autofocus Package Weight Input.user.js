// ==UserScript==
// @downloadURL      
// @updateURL      
// @version      
// @name         Autofocus Package Weight Input
// @match        https://www.ebay.com/*
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

//  const SELECTOR = 'input[aria-label="Package weight in pounds"]';
  const SELECTOR = 'input[aria-label="Package weight in ounces"]';
  let focused = false;

  function tryFocus() {
    if (focused) return;

    const input = document.querySelector(SELECTOR);
    if (input) {
      input.focus();
      input.select?.(); // optional: highlight existing text
      focused = true;
    }
  }

  // Try immediately
  tryFocus();

  // Observe DOM changes for SPA / dynamic loads
  const observer = new MutationObserver(() => {
    tryFocus();
    if (focused) observer.disconnect();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
