// ==UserScript==
// @name        Pinterest - Remove Unwanted Pins
// @namespace   valacar.pinterest.remove-picked-for-you
// @author      mcd
// @version     0.9.9
// @description Remove unwanted pins on Pinterest, like Promoted pins, Product pins, and Ideas for you. (edited from valacar's 0.8.9)
// @include     https://*.pinterest.tld/*
// @exclude     /^https://(help|blog|about|buisness|developers|engineering|careers|policy|offsite|newsroom)\.pinterest/
// @grant       none
// @run-at      document-start
// @noframes
// @license     MIT
// @compatible  firefox Firefox
// @compatible  chrome Chrome
// ==/UserScript==

(function() {
  "use strict";

  const DEBUGGING = 0; // output debugging info to the developer console
  const ENABLE_KEYS = 0; // r = reveal (unhide), s = search (find and hide)
  const SHOW_BAD_PINS = 0; // show bad pins, outlined and faded

  const badStoryType = [
    "real_time_boards", // ideas for you
    "BUBBLE_ONE_COL", // ideas for you
    "BUBBLE_TRAY_CAROUSEL", // ideas you might love
    "PINART_INTEREST", // topics for you
    "single_column_recommended_board",
    "recommended_searches", // searches to try
    "RECOMMENDED_TOPICS",
    "explore_board_ideas" // new ideas for your board
  ];

  const badRecommendation = [
    "INTENTIONAL_DISTRIBUTION_TOPICS_STORY_PINS", // story
    "INTENTIONAL_DISTRIBUTION_TOPICS_VIDEO", // some videos ads
    //"GRAPHSAGE_PRODUCT_PINS", // product pins
    //"GEMINI_INTERESTS_FRESH", // often ad-like, but unsure about enabling
    //"FRESH_TEXT_EMBEDDINGS",
  ];

  const badStoryTypeSet = new Set(badStoryType);
  const badRecommendationSet = new Set(badRecommendation);

  const hidePinClass = "unwanted";

  let cachedReactInfo;
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

  appendStyle(`
.${hidePinClass} { display: none !important; }
.dbg { outline: 2px dashed red; opacity: 0.2; }
div[data-test-id="search-tab-bar"] { display: none !important; }
`);

  const debugLog = DEBUGGING ? console.log.bind(console, "[unwanted]") : function() {};

  function isPromotedPin(data, pin)
  {
    let result = (data.is_promoted && data.is_promoted === true) ||
      data.promoter ||
      pin.querySelector('[data-test-id="one-tap-desktop"]') ||
      pin.querySelector('[data-test-id="one-tap-desktop-carousel"]') ||
      pin.querySelector('[title="Test GPT"]') || 
      pin.querySelector('[data-test-id="otpp"]') || 
      pin.querySelector('[data-test-id="oneTapPromotedPin"]') || 
      pin.querySelector('[data-test-id="pinrep-video"]');
    if (result) debugLog("--- removed PROMOTED pin:", data.domain || "unknown domain");
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

  function hasPriceTagIcon(pin)
  {
		return false;
    const paths = pin.querySelectorAll('path');
    for (let path of paths) {
      if (path && path.hasAttribute('d')) {
        // check the first few curves and lines of the svg icon (hopefully unique)
        if (path.attributes.d.textContent.startsWith(
          'M6 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m7.36-6.2l8.84 8.84'
        ))
        {
          debugLog("::: price tag icon found");
          return true;
        }
      }
    }
    return false;
  }

  function isCommercePin(data, pin)
  {
		return false;
    let result = ((data.shopping_flags && data.shopping_flags.length > 0)
      || data.buyable_product) || hasPriceTagIcon(pin);
    if (result) {
      debugLog("--- removed COMMERCE pin:",
        data.domain || "unknown domain",
        data.buyable_product ? "(buyable)" : "");
    }
    return result;
  }

  function isBadRecommendation(data)
  {
    let result = data.recommendation_reason &&
      badRecommendationSet.has(data.recommendation_reason.reason);
    if (result) {
      debugLog("--- removed RECOMMENDED pin:", data.recommendation_reason.reason);
    }
    return result;
  }

  function getReactInfo(pin)
  {
    return Object.keys(pin).find(
      prop => prop.startsWith("__reactProps")
    );
  }

  function getChildrenPropsData(target)
  {
    let path;
    if (target && "children" in target && target.children) {
      if (Array.isArray(target.children)) {
        for (let child of target.children) {
          path = getPathToPinDataFromChild(child);
          if (path) {
            if ("id" in path) {
              return path;
            }
          }
        }
      } else {
        path = getPathToPinDataFromChild(target.children);
        if (path) {
          if ("id" in path) {
            return path;
          }
        }
      }
    }
  }

  function getPathToPinDataFromChild(obj)
  {
    if (obj && "props" in obj) {
      if ("data" in obj.props) {
        return obj.props.data;
      }
      if ("pin" in obj.props) {
        return obj.props.pin;
      }
    }
  }

  function getPinData(pin)
  {
    let reactInfo = cachedReactInfo || getReactInfo(pin);
    if (!reactInfo) {
      return false;
    }
    cachedReactInfo = reactInfo;
    let data;
    let target;
    try {
      // try pinWrapper
      target = pin.querySelector('[data-test-id="pinWrapper"]');
      if (target) {
        data = getChildrenPropsData(target[reactInfo]);
        if (data) {
          return data;
        }
      }
      // try "root" of pin
      target = pin;
      if (!"children" in target[reactInfo]) {
        return false;
      }
      data = target[reactInfo].children.props.data;
      if (data && "id" in data) {
        return data;
      }
      // try pin.firstchild
      target = pin.firstChild;
      if (target && target[reactInfo].children && target[reactInfo].children.props) {
        data = target[reactInfo].children.props.data;
        if (data && "id" in data) {
          return data;
        }
      }
      // try pin.firstchild.firstChild
      target = pin.firstChild.firstChild;
      if (target && target[reactInfo].children && target[reactInfo].children.props) {
        data = target[reactInfo].children.props.data;
        if (data && "id" in data) {
          return data;
        }
        if (Array.isArray(target[reactInfo].children) && target[reactInfo].children[0].props) {
          data = target[reactInfo].children[0].props.data;
          if (data && "id" in data) {
            return data;
          }
        }
      }
    }
    catch(err) {
      debugLog("!!! Caught error:", err, pin);
    }
  }

  function isBadPin(pin)
  {
    let data = getPinData(pin);
    if (!data) return false;
    if (
      isCommercePin(data, pin) ||
      isPromotedPin(data, pin) ||
      isIdeaPin(data) ||
      isBadRecommendation(data)
    ) {
      return true;
    }
  }

  function modifyBadPin(pin)
  {
    if (isBadPin(pin)) {
      if (SHOW_BAD_PINS) {
        pin.classList.add("dbg");
      } else {
        pin.classList.add(hidePinClass);
      }
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
		/*
		var i, elements = document.querySelectorAll('[data-root-margin]');
		//remove sticky bars.  don't need to check for sticky anymore but do.
		for (i = 0; i < elements.length; i++) {
			elements[i].parentNode.removeChild(elements[i]);
		}
		elements = document.querySelectorAll('body div[role="tablist"]');
		for (i = 0; i < elements.length; i++) {
			elements[i].parentNode.remove();
		}
		elements = document.querySelectorAll('body a[role="tab"]');
		for (i = 0; i < elements.length; i++) {
			elements[i].parentNode.remove();
		}
		elements = document.querySelectorAll('div.fixedHeader');
		for (i = 0; i < elements.length; i++) {
			elements[i].remove();
		}
		*/

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
    const target = ".mainContainer";
    const targetElement = document.querySelector(target);
    if (targetElement) {
      const observer = new MutationObserver(mutationCallback);
      observer.observe(targetElement, { childList: true, subtree: true });
      debugLog("::: Observer created for", target);
    } else {
      debugLog("::: Couldn't create observer for", target);
    }
    searchAndDestroy();
  });

  window.addEventListener("DOMContentLoaded", () => {
    searchAndDestroy();
  });

})();
