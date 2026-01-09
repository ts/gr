// ==UserScript==
// @version      0.0.2
// @updateURL    https://raw.githubusercontent.com/ts/gr/main/Autofocus%20Package%20Weight%20Input.user.js
// @downloadURL  https://raw.githubusercontent.com/ts/gr/main/Autofocus%20Package%20Weight%20Input.user.js
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
