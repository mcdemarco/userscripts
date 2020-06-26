# Kill Sticky

The original [Kill Sticky Headers](https://alisdair.mcdiarmid.org/kill-sticky-headers/) is by Alisdair McDiarmid.  It's a bit oddly named because it kills fixed headers instead of sticky headers.  So I also made a kill -KILL sticky that would kill both:


```
javascript:(function(){(function () { 
  var i, elements = document.querySelectorAll('body *');

  for (i = 0; i < elements.length; i++) {
    if (getComputedStyle(elements[i]).position === 'fixed' || getComputedStyle(elements[i]).position === 'sticky') {
      elements[i].parentNode.removeChild(elements[i]);
    }
  }
})();})();
```

It got double-wrapped in function calls at some point, but that seems mostly harmless.  Here's the encoded version for bookmarkleting:

```
javascript:(function()%7B(function%20()%20%7B%20%0A%20%20var%20i%2C%20elements%20%3D%20document.querySelectorAll('body%20*')%3B%0A%0A%20%20for%20(i%20%3D%200%3B%20i%20%3C%20elements.length%3B%20i%2B%2B)%20%7B%0A%20%20%20%20if%20(getComputedStyle(elements%5Bi%5D).position%20%3D%3D%3D%20'fixed'%20%7C%7C%20getComputedStyle(elements%5Bi%5D).position%20%3D%3D%3D%20'sticky')%20%7B%0A%20%20%20%20%20%20elements%5Bi%5D.parentNode.removeChild(elements%5Bi%5D)%3B%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D)()%3B%7D)()%3B
```


Usually one or the other does it, but I came across a site that had a `-webkit-sticky` header and had to escalate to kill -9:


```
javascript:(function(){
	var i, elements = document.querySelectorAll('body *');
	for (i = 0; i < elements.length; i++) {
		if (getComputedStyle(elements[i]).position === 'fixed'||getComputedStyle(elements[i]).position === 'sticky'||getComputedStyle(elements[i]).position === '-webkit-sticky') {
			elements[i].parentNode.removeChild(elements[i]);
		}
	}
})()
```

Encoded as a bookmarklet:

```
javascript:(function()%7Bvar%20i%2C%20elements%20%3D%20document.querySelectorAll('body%20*')%3Bfor%20(i%20%3D%200%3B%20i%20%3C%20elements.length%3B%20i%2B%2B)%20%7Bif%20(getComputedStyle(elements%5Bi%5D).position%20%3D%3D%3D%20'fixed'%7C%7CgetComputedStyle(elements%5Bi%5D).position%20%3D%3D%3D%20'sticky'%7C%7CgetComputedStyle(elements%5Bi%5D).position%20%3D%3D%3D%20'-webkit-sticky')%20%7Belements%5Bi%5D.parentNode.removeChild(elements%5Bi%5D)%3B%7D%7D%7D)()
```
