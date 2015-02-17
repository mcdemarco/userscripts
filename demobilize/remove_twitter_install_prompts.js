// ==UserScript==
// @name        Remove twitter install prompt
// @author mcdemarco
// @namespace m 
// @description Remove twitter install prompt in mobile view
// @include     https://mobile.twitter.com
// @include     https://mobile.twitter.com/*
// @match       https://mobile.twitter.com
// @match       https://mobile.twitter.com/*
// @version 2015-02-16
// @copyright	mcdemarco
// @run-at document-end
// @grant none 
// ==/UserScript==

document.getElementsByTagName("prompt")[0].style.display = 'none';
