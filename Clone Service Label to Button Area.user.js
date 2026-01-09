// ==UserScript==
// @name         Clone Service Label to Button Area
// @namespace    https://example.com/
// @description  Clone label text from selected service row into a span near a button
// @match        *://*/*
// @grant        none
// @version      0.0.3
// @updateURL    https://raw.githubusercontent.com/ts/gr/main/Clone%20Service%20Label%20to%20Button%20Area.user.js
// @downloadURL  https://raw.githubusercontent.com/ts/gr/main/Clone%20Service%20Label%20to%20Button%20Area.user.js
// ==/UserScript==

(function () {
  'use strict';

  /* ========= CONFIG ========= */

  // Button the span should be positioned relative to
  const BUTTON_SELECTOR = 'data-testid="purchase-button"';

  // Where to insert the span relative to the button
  // beforebegin | afterbegin | beforeend | afterend
  const INSERT_POSITION = 'beforebegin';

  // ID used so the span can be updated instead of duplicated
  const SPAN_ID = 'selected-service-label';

  /* ========= HELPERS ========= */

  function getServiceLabelText(row) {
    if (!row) return null;

    // Prefer explicit <label> text if it exists
    const label = row.querySelector('label');
    if (label) {
      return label.textContent.trim();
    }

    // Fallback: use the row's visible text minus inputs
    const clone = row.cloneNode(true);
    clone.querySelectorAll('input').forEach(el => el.remove());

    return clone.textContent.trim().replace(/\s+/g, ' ');
  }

  function updateSpan(text) {
    if (!text) return;

    const button = document.querySelector(BUTTON_SELECTOR);
    if (!button) return;

    let span = document.getElementById(SPAN_ID);

    if (!span) {
      span = document.createElement('span');
      span.id = SPAN_ID;
      span.style.marginLeft = '8px';
      button.insertAdjacentElement(INSERT_POSITION, span);
    }

    span.textContent = text;
  }

  /* ========= EVENT HANDLER ========= */

  document.addEventListener('change', (event) => {
    const radio = event.target;

    if (!radio.matches('input[type="radio"]') || !radio.checked) return;

    const serviceRow = radio.closest('tr[data-testid="service"]');
    if (!serviceRow) return;

    const labelText = getServiceLabelText(serviceRow);
    updateSpan(labelText);
  });

})();
