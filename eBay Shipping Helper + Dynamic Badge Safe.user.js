// ==UserScript==
// @version      0.0.2
// @updateURL    https://raw.githubusercontent.com/ts/gr/main/eBay%20Shipping%20Helper%20+%20Dynamic%20Badge%20Safe.user.js
// @downloadURL  https://raw.githubusercontent.com/ts/gr/main/eBay%20Shipping%20Helper%20+%20Dynamic%20Badge%20Safe.user.js
// @name         eBay Shipping Helper + Dynamic Badge Safe
// @namespace    http://tampermonkey.net/
// @description  Dynamic shipping badge + global keyboard shortcuts + shipping filter
// @author       @tksb
// @match        https://www.ebay.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  /********** Keyboard Manager **********/
  window.KeyboardManager = {
    shortcuts: {},
    register(key, callback) {
      if (!key || typeof callback !== "function") return;
      this.shortcuts[key.toLowerCase()] = callback;
    },
    handleEvent(e) {
      const k = e.key.toLowerCase();
      if (this.shortcuts[k]) {
        e.preventDefault();
        this.shortcuts[k](e);
      }
    },
  };
  document.addEventListener("keydown", (e) =>
    window.KeyboardManager.handleEvent(e),
  );

  /********** Badge **********/
  function parseDollarAmount(text) {
    return (
      parseFloat((text.match(/\$([\d,.]+)/) || [0, 0])[1].replace(/,/g, "")) ||
      0
    );
  }

  function updateBadge() {
    try {
      const shippingPaidDiv = [...document.querySelectorAll("h3")].find((h) =>
        h.textContent.includes("Shipping paid"),
      );
      const totalCostDiv = document.querySelector(
        'div[data-testid="total-cost"]',
      );

      if (!shippingPaidDiv || !totalCostDiv) return;

      const shippingPaid = parseDollarAmount(
        shippingPaidDiv.nextElementSibling?.textContent || "",
      );
      const totalSpans = totalCostDiv.querySelectorAll("span");
      const labelCost = parseDollarAmount(totalSpans[1]?.textContent || "");

      const diff = shippingPaid - labelCost;

      let badge = document.getElementById("shipping-diff-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.id = "shipping-diff-badge";
        badge.style.marginLeft = "8px";
        badge.style.marginRight = "16px";
        badge.style.padding = "2px 6px";
        badge.style.borderRadius = "4px";
        badge.style.fontWeight = "bold";
        badge.style.background = "#fff";
        badge.style.border = "1px solid #ccc";
        totalCostDiv.appendChild(badge);
      }

      // Only update if changed
      const newText = (diff >= 0 ? "+" : "-") + "$" + Math.abs(diff).toFixed(2);
      if (badge.textContent !== newText) {
        badge.textContent = newText;
        badge.style.color = diff >= 0 ? "green" : "red";
      }
    } catch (err) {
      console.error("[Badge] Error updating badge:", err);
    }
  }

  function watchBadge() {
    const shippingPaidDiv = [...document.querySelectorAll("h3")].find((h) =>
      h.textContent.includes("Shipping paid"),
    );
    const totalCostDiv = document.querySelector(
      'div[data-testid="total-cost"]',
    );
    if (!shippingPaidDiv || !totalCostDiv) return;

    // Observe only the text nodes that can change
    const shippingNode = shippingPaidDiv.nextElementSibling;
    const labelNode = totalCostDiv.querySelectorAll("span")[1];

    if (shippingNode) {
      new MutationObserver(updateBadge).observe(shippingNode, {
        characterData: true,
        subtree: true,
        childList: true,
      });
    }
    if (labelNode) {
      new MutationObserver(updateBadge).observe(labelNode, {
        characterData: true,
        subtree: true,
        childList: true,
      });
    }

    updateBadge();
  }

  /********** Shipping Filter **********/
  function initShippingFilter() {
    const shippingFieldset = document.querySelector(
      'fieldset[data-testid="service-list-table"]',
    );
    if (!shippingFieldset) return;

    let filterBox = document.getElementById("shipping-filter-box");
    if (!filterBox) {
      filterBox = document.createElement("input");
      filterBox.id = "shipping-filter-box";
      filterBox.type = "text";
      filterBox.placeholder = "Filter shipping…";
      filterBox.style.marginBottom = "4px";
      filterBox.style.display = "none";
      filterBox.style.width = "98%";
      filterBox.style.padding = "4px";
      filterBox.style.fontSize = "14px";
      shippingFieldset.parentNode.insertBefore(filterBox, shippingFieldset);
    }

    let options = [];
    let selectedIndex = -1;

    function refreshOptions() {
      options = [
        ...shippingFieldset.querySelectorAll(
          'input[type="radio"][name="service"]',
        ),
      ];
    }

    function filterOptions(query) {
      refreshOptions();
      const q = query.toLowerCase();
      options.forEach((radio) => {
        const label = radio.closest("label");
        if (!label) return;
        const text = label.textContent.toLowerCase();
        label.style.display = text.includes(q) ? "" : "none";
      });
      selectedIndex = -1;
    }

    filterBox.addEventListener("input", () => filterOptions(filterBox.value));

    filterBox.addEventListener("keydown", (e) => {
      if (options.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        do {
          selectedIndex = (selectedIndex + 1) % options.length;
        } while (
          options[selectedIndex].closest("label").style.display === "none"
        );
        highlightSelected();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        do {
          selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        } while (
          options[selectedIndex].closest("label").style.display === "none"
        );
        highlightSelected();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && options[selectedIndex]) {
          options[selectedIndex].click();
          filterBox.style.display = "none";
          filterBox.value = "";
          filterOptions("");
        }
      }
    });

    function highlightSelected() {
      options.forEach((radio, i) => {
        const lbl = radio.closest("label");
        lbl.style.backgroundColor = i === selectedIndex ? "#cce5ff" : "";
      });
    }

    window.KeyboardManager.register("f", () => {
      filterBox.style.display =
        filterBox.style.display === "none" ? "" : "none";
      if (filterBox.style.display !== "none") {
        filterBox.value = "";
        filterOptions("");
        filterBox.focus();
      }
    });
  }

  /********** Init **********/
  function init() {
    watchBadge();
    initShippingFilter();
  }

  const interval = setInterval(() => {
    if (
      document.querySelector('fieldset[data-testid="service-list-table"]') &&
      document.querySelector('div[data-testid="total-cost"]')
    ) {
      clearInterval(interval);
      init();
    }
  }, 500);
})();
