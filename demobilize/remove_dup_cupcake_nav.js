// ==UserScript==
// @name        Shrink cupcake menu
// @author mcdemarco
// @namespace m 
// @description Shrink the crazy cupcake navigation menu in mobile view
// @include     https://*.cupcake.io
// @include     https://*.cupcake.io/*
// @match       https://*.cupcake.io
// @match       https://*.cupcake.io/*
// @version 2015-02-16
// @copyright	mcdemarco
// @run-at document-end
// @grant none 
// ==/UserScript==

document.getElementsByClassName("menu-switch")[0].style.lineHeight = 1;
