define(["browser","connectionManager","playbackManager","dom","css!./style"],function(browser,connectionManager,playbackManager,dom){"use strict";function enableAnimation(elem){return!browser.slow}function enableRotation(){return!browser.tv}function Backdrop(){function cancelAnimation(){var elem=currentAnimatingElement;elem&&(elem.classList.remove("backdropImageFadeIn"),currentAnimatingElement=null)}var isDestroyed,currentAnimatingElement,self=this;self.load=function(url,parent,existingBackdropImage){var img=new Image;img.onload=function(){if(!isDestroyed){var backdropImage=document.createElement("div");if(backdropImage.classList.add("backdropImage"),backdropImage.classList.add("displayingBackdropImage"),backdropImage.style.backgroundImage="url('"+url+"')",backdropImage.setAttribute("data-url",url),backdropImage.classList.add("backdropImageFadeIn"),parent.appendChild(backdropImage),!enableAnimation(backdropImage))return existingBackdropImage&&existingBackdropImage.parentNode&&existingBackdropImage.parentNode.removeChild(existingBackdropImage),void internalBackdrop(!0);var onAnimationComplete=function(){dom.removeEventListener(backdropImage,dom.whichAnimationEvent(),onAnimationComplete,{once:!0}),backdropImage===currentAnimatingElement&&(currentAnimatingElement=null),existingBackdropImage&&existingBackdropImage.parentNode&&existingBackdropImage.parentNode.removeChild(existingBackdropImage)};dom.addEventListener(backdropImage,dom.whichAnimationEvent(),onAnimationComplete,{once:!0}),internalBackdrop(!0)}},img.src=url},self.destroy=function(){isDestroyed=!0,cancelAnimation()}}function getBackdropContainer(){return backdropContainer||(backdropContainer=document.querySelector(".backdropContainer")),backdropContainer||(backdropContainer=document.createElement("div"),backdropContainer.classList.add("backdropContainer"),document.body.insertBefore(backdropContainer,document.body.firstChild)),backdropContainer}function clearBackdrop(clearAll){clearRotation(),currentLoadingBackdrop&&(currentLoadingBackdrop.destroy(),currentLoadingBackdrop=null);var elem=getBackdropContainer();elem.innerHTML="",clearAll&&(hasExternalBackdrop=!1),internalBackdrop(!1)}function getBackgroundContainer(){return backgroundContainer||(backgroundContainer=document.querySelector(".backgroundContainer")),backgroundContainer}function setBackgroundContainerBackgroundEnabled(){hasInternalBackdrop||hasExternalBackdrop?getBackgroundContainer().classList.add("withBackdrop"):getBackgroundContainer().classList.remove("withBackdrop")}function internalBackdrop(enabled){hasInternalBackdrop=enabled,setBackgroundContainerBackgroundEnabled()}function externalBackdrop(enabled){hasExternalBackdrop=enabled,setBackgroundContainerBackgroundEnabled()}function setBackdropImage(url){currentLoadingBackdrop&&(currentLoadingBackdrop.destroy(),currentLoadingBackdrop=null);var elem=getBackdropContainer(),existingBackdropImage=elem.querySelector(".displayingBackdropImage");if(existingBackdropImage&&existingBackdropImage.getAttribute("data-url")===url){if(existingBackdropImage.getAttribute("data-url")===url)return;existingBackdropImage.classList.remove("displayingBackdropImage")}var instance=new Backdrop;instance.load(url,elem,existingBackdropImage),currentLoadingBackdrop=instance}function getItemImageUrls(item){var apiClient=connectionManager.getApiClient(item.ServerId);return item.BackdropImageTags&&item.BackdropImageTags.length>0?item.BackdropImageTags.map(function(imgTag,index){return apiClient.getScaledImageUrl(item.Id,{type:"Backdrop",tag:imgTag,maxWidth:Math.min(dom.getWindowSize().innerWidth,1920),index:index})}):item.ParentBackdropItemId&&item.ParentBackdropImageTags&&item.ParentBackdropImageTags.length?item.ParentBackdropImageTags.map(function(imgTag,index){return apiClient.getScaledImageUrl(item.ParentBackdropItemId,{type:"Backdrop",tag:imgTag,maxWidth:Math.min(dom.getWindowSize().innerWidth,1920),index:index})}):[]}function getImageUrls(items){for(var list=[],onImg=function(img){list.push(img)},i=0,length=items.length;i<length;i++){var itemImages=getItemImageUrls(items[i]);itemImages.forEach(onImg)}return list}function arraysEqual(a,b){if(a===b)return!0;if(null==a||null==b)return!1;if(a.length!==b.length)return!1;for(var i=0;i<a.length;++i)if(a[i]!==b[i])return!1;return!0}function setBackdrops(items,imageSetId){var images=getImageUrls(items);imageSetId=imageSetId||(new Date).getTime(),images.length?startRotation(images,imageSetId):clearBackdrop()}function startRotation(images){arraysEqual(images,currentRotatingImages)||(clearRotation(),currentRotatingImages=images,currentRotationIndex=-1,images.length>1&&enableRotation()&&(rotationInterval=setInterval(onRotationInterval,2e4)),onRotationInterval())}function onRotationInterval(){if(!playbackManager.isPlayingVideo()){var newIndex=currentRotationIndex+1;newIndex>=currentRotatingImages.length&&(newIndex=0),currentRotationIndex=newIndex,setBackdropImage(currentRotatingImages[newIndex])}}function clearRotation(){var interval=rotationInterval;interval&&clearInterval(interval),rotationInterval=null,currentRotatingImages=[],currentRotationIndex=-1}function setBackdrop(url){url&&"string"!=typeof url&&(url=getImageUrls([url])[0]),url?(clearRotation(),setBackdropImage(url)):clearBackdrop()}var backdropContainer,backgroundContainer,hasInternalBackdrop,hasExternalBackdrop,currentLoadingBackdrop,rotationInterval,currentRotatingImages=[],currentRotationIndex=-1;return{setBackdrops:setBackdrops,setBackdrop:setBackdrop,clear:clearBackdrop,externalBackdrop:externalBackdrop}});