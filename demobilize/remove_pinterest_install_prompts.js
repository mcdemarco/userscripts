// ==UserScript==
// @name        Remove pinterest install prompt
// @author mcdemarco
// @namespace m 
// @description Remove pinterest install prompt in mobile view
// @include http://www.pinterest.com/* 
// @include https://www.pinterest.com/* 
// @match http://www.pinterest.com/* 
// @match https://www.pinterest.com/* 
// @version 2015-02-17
// @copyright	mcdemarco
// @run-at document-end
// @grant none 
// ==/UserScript==

document.getElementsByClassName("BannerDownloadApp")[0].style.display = 'none';
