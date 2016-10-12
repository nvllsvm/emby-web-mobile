define(["visibleinviewport","imageFetcher","layoutManager","events","browser","dom","appSettings","require"],function(visibleinviewport,imageFetcher,layoutManager,events,browser,dom,appSettings,require){"use strict";function resetThresholds(){var x=screen.availWidth,y=screen.availHeight;browser.touch&&(x*=1.5,y*=1.5),thresholdX=x,thresholdY=y}function isVisible(elem){return visibleinviewport(elem,!0,thresholdX,thresholdY)}function fillImage(elem,source,enableEffects){source||(source=elem.getAttribute("data-src")),source&&fillImageElement(elem,source,enableEffects)}function fillImageElement(elem,source,enableEffects){imageFetcher.loadImage(elem,source).then(function(){var fillingVibrant="IMG"===elem.tagName&&fillVibrant(elem,source);!enableFade||layoutManager.tv||enableEffects===!1||fillingVibrant||fadeIn(elem),elem.removeAttribute("data-src")})}function fillVibrant(img,url,canvas,canvasContext){var vibrantElement=img.getAttribute("data-vibrant");return!!vibrantElement&&(window.Vibrant?(fillVibrantOnLoaded(img,url,vibrantElement,canvas,canvasContext),!0):(require(["vibrant"],function(){fillVibrantOnLoaded(img,url,vibrantElement,canvas,canvasContext)}),!0))}function fillVibrantOnLoaded(img,url,vibrantElement,canvas,canvasContext){vibrantElement=document.getElementById(vibrantElement),vibrantElement&&requestIdleCallback(function(){var swatch=getVibrantInfo(canvas||img,url,canvasContext).split("|");if(swatch.length){var index=0;vibrantElement.style.backgroundColor=swatch[index],vibrantElement.style.color=swatch[index+1]}})}function getSettingsKey(url){var parts=url.split("://");url=parts[parts.length-1],url=url.substring(url.indexOf("/")+1),url=url.split("?")[0];var cacheKey="vibrant11";return cacheKey+url}function getCachedVibrantInfo(url){return appSettings.get(getSettingsKey(url))}function getVibrantInfo(img,url,canvasContext){var value=getCachedVibrantInfo(url);if(value)return value;var vibrant=new Vibrant(img,canvasContext),swatches=vibrant.swatches();value="";var swatch=swatches.DarkVibrant;return swatch&&(value+=swatch.getHex()+"|"+swatch.getBodyTextColor()),appSettings.set(getSettingsKey(url),value),value}function fadeIn(elem){var duration=layoutManager.tv?160:300,keyframes=[{opacity:"0",offset:0},{opacity:"1",offset:1}],timing={duration:duration,iterations:1};elem.animate(keyframes,timing)}function cancelAll(tokens){for(var i=0,length=tokens.length;i<length;i++)tokens[i]=!0}function unveilWithIntersection(images,root){for(var filledCount=0,options={},observer=new IntersectionObserver(function(entries){for(var j=0,length2=entries.length;j<length2;j++){var entry=entries[j],target=entry.target;observer.unobserve(target),fillImage(target),filledCount++}},options),i=0,length=images.length;i<length;i++)observer.observe(images[i])}function unveilElements(images,root){function unveilInternal(tokenIndex){for(var anyFound=!1,out=!1,i=0,length=images.length;i<length;i++){if(cancellationTokens[tokenIndex])return;if(!filledImages[i]){var img=images[i];!out&&isVisible(img)?(anyFound=!0,filledImages[i]=!0,fillImage(img)):anyFound&&(out=!0)}}images.length||(dom.removeEventListener(document,"focus",unveil,{capture:!0,passive:!0}),dom.removeEventListener(document,"scroll",unveil,{capture:!0,passive:!0}),dom.removeEventListener(document,wheelEvent,unveil,{capture:!0,passive:!0}),dom.removeEventListener(window,"resize",unveil,{capture:!0,passive:!0}))}function unveil(){cancelAll(cancellationTokens);var index=cancellationTokens.length;cancellationTokens.length++,setTimeout(function(){unveilInternal(index)},1)}if(images.length){if(supportsIntersectionObserver)return void unveilWithIntersection(images,root);var filledImages=[],cancellationTokens=[];dom.addEventListener(document,"focus",unveil,{capture:!0,passive:!0}),dom.addEventListener(document,"scroll",unveil,{capture:!0,passive:!0}),dom.addEventListener(document,wheelEvent,unveil,{capture:!0,passive:!0}),dom.addEventListener(window,"resize",unveil,{capture:!0,passive:!0}),unveil()}}function lazyChildren(elem){unveilElements(elem.getElementsByClassName("lazy"),elem)}function getPrimaryImageAspectRatio(items){for(var values=[],i=0,length=items.length;i<length;i++){var ratio=items[i].PrimaryImageAspectRatio||0;ratio&&(values[values.length]=ratio)}if(!values.length)return null;values.sort(function(a,b){return a-b});var result,half=Math.floor(values.length/2);result=values.length%2?values[half]:(values[half-1]+values[half])/2;var aspect2x3=2/3;if(Math.abs(aspect2x3-result)<=.15)return aspect2x3;var aspect16x9=16/9;if(Math.abs(aspect16x9-result)<=.2)return aspect16x9;if(Math.abs(1-result)<=.15)return 1;var aspect4x3=4/3;return Math.abs(aspect4x3-result)<=.15?aspect4x3:result}function fillImages(elems){for(var i=0,length=elems.length;i<length;i++){var elem=elems[0];fillImage(elem)}}var thresholdX,thresholdY,requestIdleCallback=window.requestIdleCallback||function(fn){fn()},supportsIntersectionObserver=function(){return!!window.IntersectionObserver}();supportsIntersectionObserver||(dom.addEventListener(window,"orientationchange",resetThresholds,{passive:!0}),dom.addEventListener(window,"resize",resetThresholds,{passive:!0}),resetThresholds());var wheelEvent=document.implementation.hasFeature("Event.wheel","3.0")?"wheel":"mousewheel",self={},enableFade=browser.animate&&!browser.slow;return self.fillImages=fillImages,self.lazyImage=fillImage,self.lazyChildren=lazyChildren,self.getPrimaryImageAspectRatio=getPrimaryImageAspectRatio,self.getCachedVibrantInfo=getCachedVibrantInfo,self});