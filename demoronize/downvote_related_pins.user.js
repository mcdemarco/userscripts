// ==UserScript== 
// @name Downvote related pins 
// @author mcdemarco
// @namespace m 
// @description Automatically downvote "Related Pins" on Pinterest to make them disappear.
// @include http://www.pinterest.com/* 
// @include https://www.pinterest.com/* 
// @match http://www.pinterest.com/* 
// @match https://www.pinterest.com/* 
// @version 2014-11-06
// @copyright	ninguno 
// @run-at document-end 
// @grant none 
// ==/UserScript==

// This is an updated version of "Cargarse related pins" by Yo
// http://userscripts-mirror.org/topics/193153.html
// I added better matching, removed the counter, and freed it from jQuery.

// The original script was a version of "Remove related pins"
// (which actually only hid them):
// http://userscripts-mirror.org/scripts/show/183047.html
// which I found via this blog post:
// http://www.linda-matthews.com/pinterest-how-to-get-rid-of-related-pins/
// To use that script you should add the https URLs as I did here.

// You can install this with Tampermonkey (for Chrome) 
// or by dragging it directly into your Chrome extensions.
// Other browsers were not tested.

//
// User editable variable.

var repeat_every_x_seconds = 60;

// 
// Edit the rest at your own risk.

function killKillKill() { 
	document.getElementsByClassName('thumbsDownButton')[0].click(); 
}

function kill_related_pins() {
	var rpins = document.getElementsByClassName('moreInfoDropdown');
	//Count backwards because the rpins object is live.
	for (var i = rpins.length - 1; i >= 0; i--) {
		//Check for existence because unknown Pinterest-side consequences of previous thumbs-down.
		if (rpins[i]) {
			rpins[i].click();
			setTimeout(killKillKill,100); // 500 
		}
	}
}

// at load time 

window.setInterval(function(){ 
	kill_related_pins();
}, (repeat_every_x_seconds * 1000));
