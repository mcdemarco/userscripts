// ==UserScript== 
// @name Remove picked pins
// @author mcdemarco
// @namespace m 
// @description Automatically X "Picked for you" pins on Pinterest.
// @include http://www.pinterest.com/* 
// @include https://www.pinterest.com/* 
// @match http://www.pinterest.com/* 
// @match https://www.pinterest.com/* 
// @version 2015-10-06
// @copyright	mcdemarco
// @run-at document-end 
// @grant none 
// ==/UserScript==

// Based on my remove_related_pins userscript.

// You can install this with Tampermonkey (for Chrome) 
// or by dragging it directly into your Chrome extensions.
// Other browsers were not tested.

//
// User editable variable.

var repeat_every_x_seconds = 3;

// 
// Edit the rest at your own risk.

function killKillKill() {
	$(".hidePin").click();
	//document.getElementsByClassName('hidePin')[0].click();
	if (console) console.log("Gotcha!");
}

function kill_picked_pins() {
	if (console) console.log("Search and destroy...");
	$(".hidePinInfo").click();
	//	var rpins = document.getElementsByClassName('hidePinInfo');
	//Count backwards because the rpins object is live.
//	for (var i = rpins.length - 1; i >= 0; i--) {
		//Check for existence because unknown Pinterest-side consequences of previous thumbs-down.
//		if (rpins[i]) {
//			rpins[i].click();
			setTimeout(killKillKill,100); // 500 
//		}
//	}
	setTimeout(kill_picked_pins,repeat_every_x_seconds * 1000);
}

// at load time 

//window.setInterval(function(){ 
	kill_picked_pins();
//	killKillKill();
//}, (repeat_every_x_seconds * 1000));
