// ==UserScript==
// @name        Change navigator.userAgent
// @namespace   mcd
// @description Changes navigator.userAgent to Android / Firefox on Pinterest
// @include     http://www.pinterest.com/* 
// @include     https://www.pinterest.com/* 
// @match       http://www.pinterest.com/* 
// @match       https://www.pinterest.com/* 
// @run-at      document-start
// @grant       none
// @version     2015-02-18
// ==/UserScript==

//Many thanks to http://superuser.com/a/695049
//However; the desired functionality actually required a user agent (header) switcher like UAControl.

Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Android; Mobile; rv:35.0) Gecko/35.0 Firefox/35.0'
});
