// ==UserScript==
// @name        Pinterest - Remove Unwanted Pins
// @namespace   valacar.pinterest.remove-picked-for-you
// @author      mcd
// @version     0.9.1
// @description Remove unwanted pins on Pinterest, like Promoted pins, Product pins, and Ideas for you.
// @include     https://*.pinterest.tld/*
// @exclude     /^https://(help|blog|about|buisness|developers|engineering|careers|policy|offsite)\.pinterest/
// @grant       none
// @noframes
// @license     MIT
// @compatible  firefox Firefox
// @compatible  chrome Chrome
// ==/UserScript==

(function() {
  "use strict";

  const DEBUGGING = 0;

  // allow debugging keys without logging messages
  const ENABLE_KEYS = 0; // r = reveal (unhide), s = search (find and hide)

  const badStoryType = [
    "real_time_boards", // ideas for you
    "BUBBLE_TRAY_CAROUSEL", // ideas you might love
    "PINART_INTEREST", // topics for you
    "single_column_recommended_board",
    "recommended_searches" // searches to try
  ];

  const badStoryTypeSet = new Set(badStoryType);

  const hidePinClass = "unwanted";

  let cachedHandler;
  let cachedGrid;

  /* ---------------------------- */

  function appendStyle(cssString)
  {
    const parent = document.head || document.documentElement;
    if (parent) {
      const style = document.createElement("style");
      style.setAttribute("type", "text/css");
      style.textContent = cssString;
      parent.appendChild(style);
    }
  }

  appendStyle(`.${hidePinClass} { visibility: hidden !important; }`);

  const debugLog = DEBUGGING ? console.log.bind(console, "[unwanted]") : function() {};

  function isPromotedPin(data, pin)
  {
    let result = (data.is_promoted && data.is_promoted === true) ||
      data.promoter ||
      pin.querySelector('[data-test-id="one-tap-desktop"]') ||
      pin.querySelector('[data-test-id="one-tap-desktop-carousel"]') ||
      pin.querySelector('[data-test-id="oneTapPromotedPin"]');
    if (result) debugLog("--- removed PROMOTED pin:", data.domain);
    return result;
  }

  function isIdeaPin(data)
  {
    let result = data.type
      && data.type === "story"
      && badStoryTypeSet.has(data.story_type);
    if (result) {
      debugLog("--- removed IDEAS/TOPIC for you pin", data.story_type);
    }
    return result;
  }

  function isCommercePin(data)
  {
    let result = (data.shopping_flags && data.shopping_flags.length > 0)
      || data.buyable_product;
    if (result) {
      debugLog("--- removed COMMERCE pin:",
        data.domain,
        data.buyable_product ? "(buyable)" : "");
    }
    return result;
  }

  function getEventHandler(pin)
  {
    return Object.keys(pin).find(
      prop => prop.startsWith("__reactEventHandlers")
    );
  }

  function getPinData(pin)
  {
    let handler = cachedHandler || getEventHandler(pin);
    if (!handler) {
      debugLog("!!! can't find React event handler");
      return false;
    }
    cachedHandler = handler;
    //debugLog("::: found react event handler", handler);
    let data;
    let target;
    try {
      if (pin.hasAttribute("data-grid-item") || pin.classList.contains("Collection-Item")) {
        target = pin;
        data = target[handler].children.props.data;
        if (data && "id" in data) {
          return data;
        }
        target = pin.firstChild;
        if (target) {
          data = target[handler].children.props.data;
          if (data && "id" in data) {
            return data;
          }
        }
        target = pin.firstChild.firstChild;
        if (target) {
          data = target[handler].children.props.data;
          if (data && "id" in data) {
            return data;
          }
          data = target[handler].children[0].props.data;
          if (data && "id" in data) {
            return data;
          }
        }
      } else {
        debugLog("!!! couldn't find [data-grid-item] or .Collection-Item");
      }
    }
    catch(err) {
      debugLog("!!! Caught error:", err);
    }
  }

  function isBadPin(pin)
  {
    let data = getPinData(pin);
    if (!data) return false;
    if (isPromotedPin(data, pin) || isIdeaPin(data) ) {
      return true;
    }
  }

  function modifyBadPin(pin)
  {
    if (isBadPin(pin)) {
      pin.classList.add(hidePinClass);
    }
  }

  function processPins(pins)
  {
    debugLog("::: Processing", pins.length, "pins");
    for (let i = 0, len = pins.length; i < len; ++i) {
      modifyBadPin(pins[i]);
    }
  }

  function findGrid()
  {
    if (cachedGrid && cachedGrid.isConnected) {
      return cachedGrid;
    }
    const gridItems = document.querySelectorAll("[data-grid-item], .Collection-Item");
    if (!gridItems.length) {
      debugLog("!!! Can't find [data-grid-item] or .Collection-Item");
      return null;
    }
    const gridItemParent = gridItems[0].parentNode;
    if (gridItemParent) {
      debugLog("### Found grid:", gridItemParent);
      cachedGrid = gridItemParent;
      processPins(gridItems);
      return gridItemParent;
    }
  }

  function searchAndDestroy()
  {
		var i, elements = document.querySelectorAll('body div[data-root-margin="search-improvements-bar"]');
		//remove sticky bars.  don't need to check for sticky anymore but do.
		for (i = 0; i < elements.length; i++) {
			if (getComputedStyle(elements[i]).position === 'sticky') {
				elements[i].parentNode.removeChild(elements[i]);
			}
		}
		elements = document.querySelectorAll('body div[role="tablist"]');
		for (i = 0; i < elements.length; i++) {
			elements[i].parentNode.remove();
		}

    debugLog(">>> searching and destroying");
    const grid = findGrid();
    if (grid) {
      const gridItems = grid.querySelectorAll("[data-grid-item], .Collection-Item");
      processPins(gridItems);
    }
  }

  function mutationCallback(mutations)
  {
    findGrid();
    for (let mutation of mutations) {
      for (let i = 0, len = mutation.addedNodes.length; i < len; ++i) {
        let added = mutation.addedNodes[i];
        if (added.nodeType === Node.ELEMENT_NODE) {
          if (added.hasAttribute("data-grid-item") || added.classList.contains("Collection-Item")) {
            modifyBadPin(added);
          }
        }
      }
    }
  }

  // Simplify creating a Mutation Observer (from document root)
  function createObserver(target, callbackFunction, rules)
  {
    let targetElement;
    if (typeof target === "string") {
      targetElement = document.querySelector(target);
    } else {
      // XXX: assume it's an element for now
      targetElement = target;
      debugLog(targetElement);
    }
    if (targetElement) {
      const observer = new MutationObserver(callbackFunction);
      observer.observe(targetElement, rules);
      debugLog("::: Observer created for", target);
    } else {
      debugLog("::: Couldn't create observer for", target);
    }
  }

  if (DEBUGGING || ENABLE_KEYS) {
    window.addEventListener("keydown",
      function(event) {
        if (event.defaultPrevented ||
            /(input|textarea)/i.test(document.activeElement.nodeName) ||
            document.activeElement.matches('[role="textarea"]') ||
            document.activeElement.matches('[role="textbox"]')
        ) {
          return;
        }
        switch (event.key) {
          case "s": // find grid and hide unwanted pins
            searchAndDestroy();
            debugLog("::: Search and destroy!");
            break;
          case "r": // temporary restore hidden pins
            document
              .querySelectorAll(`.${hidePinClass}`)
              .forEach(pin => {
                pin.classList.remove(hidePinClass);
              });
            break;
          default:
            return;
        }
        event.preventDefault();
      },
      true
    );
  }

  window.addEventListener("load", () => {
    createObserver(".mainContainer", mutationCallback, {
      childList: true,
      subtree: true
    });
    searchAndDestroy();
  });

  window.addEventListener("DOMContentLoaded", () => {
    searchAndDestroy();
  });

})();
