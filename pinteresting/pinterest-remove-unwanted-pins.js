// ==UserScript==
// @name        Pinterest - Remove Unwanted Pins
// @namespace   valacar.pinterest.remove-picked-for-you
// @author      valacar
// @description Remove unwanted pins on Pinterest, like "Promoted", "Sponsored", "Picked for you"
// @include     /^https?://(www|[a-z]{2})\.pinterest\.(com|se)/$/
// @include     /^https?://(www|[a-z]{2})\.pinterest\.(com|se)/(categories|pin|discover)/.*$/
// @include     /^https?://(www|[a-z]{2})\.pinterest\.(com|se)/search/pins/.*$/
// @version     0.4.3
// @grant       none
// @compatible  firefox Firefox with GreaseMonkey
// @compatible  chrome Chrome with TamperMonkey
// ==/UserScript==

const DEBUGGING = false;

function appendStyle(cssString)
{
    "use strict";
    var head = document.getElementsByTagName("head")[0];
    if (head)
    {
        var style = document.createElement("style");
        style.setAttribute("type", "text/css");
        style.textContent = cssString;
        head.appendChild(style);
        return style;
    }
    return null;
}

appendStyle(`
    [badpin] { display: none; }
`);

function debugLog()
{
    "use strict";
    if (DEBUGGING)
    {
        Function.apply.call(console.log, console, arguments);
    }
}

function testCreditName(pinBaseNode)
{
    "use strict";
    var node = pinBaseNode.querySelector(".creditName");
    if (node)
    {
        var text = node.textContent.toLowerCase();
        if (text.indexOf("promoted by") !== -1)
        {
            return true;
        }
    }
    return false;
}

function testCreditFooter(pinBaseNode)
{
    "use strict";
    var node = pinBaseNode.querySelector(".creditFooter");
    if (node)
    {
        var text = node.textContent.toLowerCase();
        if (text.indexOf("ideas for you") !== -1)
        {
            return true;
        }
    }
    return false;
}

function testPinMetaWrapper(pinBaseNode)
{
    "use strict";
    var node = pinBaseNode.querySelector(".pinMetaWrapper");
    if (node)
    {
        var text = node.textContent;
        // search for dollar sign (commerce pin)
        if (text.indexOf("$") !== -1)
        {
            return true;
        }
    }
    return false;
}

function modifyBadPin(pin)
{
    "use strict";
    var testFn = [testCreditName, testCreditFooter, testPinMetaWrapper];

    // call all functions in testFn array to test for bad pins
    for (var i = 0; i < testFn.length; ++i)
    {
        var f = testFn[i];
        var result = f(pin); // call function from array
        if (result)
        {
            // pin.remove();
            pin.setAttribute("badPin", "badPin");
            return;
        }
    }
}

function findGrid()
{
    "use strict";
    var result = null;

    // Check for one of those random named grids, by finding the last
    // .Pin.Module and then walking backwards to find the closest
    // item attribute, and then its parent
    var lastPin = null;
    // TODO: don't use document as base node.  add function param?
    var x = document.querySelectorAll(".Pin.Module:not(.detailed)");
    if (x.length)
    {
        lastPin = x[x.length - 1];  // last pin because there can be multiple grids, and we want the last grid
        debugLog("::: Found last .Pin.Module (%d) %o", x.length, lastPin);
        var y = lastPin.closest(".item");
        if (y)
        {
            debugLog("::: Found closest item", y);
            var gridItemParent = y.parentNode;
            if (gridItemParent)
            {
                debugLog("::: Found grid %o", gridItemParent);
                result = gridItemParent;
            }
        }
        else
        {
            debugLog("!!! Can't find closest item");
        }
    }
    else
    {
        debugLog("!!! Can't find .Pin.Module");
    }
    return result;
}

function searchAndDestroy()
{
    "use strict";
    var grid = findGrid();

    if (grid)
    {
        // debugLog(grid);
        var gridItems = grid.querySelectorAll(".item");
        // if (!gridItems.length)
        // {
        //     gridItems = grid.querySelectorAll(".absolute");
        // }
        debugLog("    Found %d grid items", gridItems.length);
        gridItems.forEach(function(x) {
            modifyBadPin(x);
        });
    }
}

/* jshint ignore:start */
// expose these functions (while debugging) so I can use them in the developer console
if (DEBUGGING)
{
    unsafeWindow.modifyBadPin = this.modifyBadPin;
    unsafeWindow.findGrid = this.findGrid;
    unsafeWindow.searchAndDestroy = this.searchAndDestroy;
}
/* jshint ignore:end */

// Simplify creating a Mutation Observer (from document root)
function createObserver(target, callbackFunction, rules)
{
    "use strict";
    function getOptionsAsString(options)
    {
        var result = '';
        for (let k of Object.keys(options))
        {
            // XXX: this is wrong when using attribute filter array
            if (options[k]) {
                result += k + " ";
            }
        }
        return result.trim();
    }

    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    var targetElement;
    var selector = "dynamic grid";
    if (typeof target === "string")
    {
        selector = target;
        targetElement = document.querySelector(target);
    }
    else
    {
        // XXX: assume it's an element for now
        targetElement = target;
        debugLog(targetElement);
    }

    if (targetElement && MutationObserver)
    {
        debugLog("::: observer for %s created, with rules (%s)", selector, getOptionsAsString(rules));
        var observer = new MutationObserver(callbackFunction);
        observer.observe(targetElement, rules);
    }
    else
    {
        debugLog("::: %s not found while creating observer", selector);
    }
}

if (DEBUGGING)
{
    window.addEventListener("keydown", function (event) {
        'use strict';
        if (event.defaultPrevented || /(input|textarea)/i.test(document.activeElement.nodeName)) { return; }
        switch (event.key) {
            case "s":
            /* fall through */
            case "S":
                debugLog("%cSearch and destroy!", "color: #fff; background-color: #600; font-weight: bold; display: block;");
                searchAndDestroy();
                break;
            default:
                return;
        }
        event.preventDefault();
    }, true);
}

function onAppBase()
{
    'use strict';
    searchAndDestroy();
}

createObserver(".App.AppBase", onAppBase, {childList: true, subtree: true});

searchAndDestroy();
