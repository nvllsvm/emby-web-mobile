define(["dom"],function(dom){"use strict";function pushScope(elem){scopes.push(elem)}function popScope(elem){scopes.length&&(scopes.length-=1)}function autoFocus(view,defaultToFirst,findAutoFocusElement){var element;return findAutoFocusElement!==!1&&(element=view.querySelector("*[autofocus]"))?(focus(element),element):defaultToFirst!==!1&&(element=getFocusableElements(view,1)[0])?(focus(element),element):null}function focus(element){try{element.focus()}catch(err){console.log("Error in focusManager.autoFocus: "+err)}}function isFocusable(elem){return focusableTagNames.indexOf(elem.tagName)!==-1||!(!elem.classList||!elem.classList.contains("focusable"))}function focusableParent(elem){for(;!isFocusable(elem);)if(elem=elem.parentNode,!elem)return null;return elem}function isCurrentlyFocusableInternal(elem){return null!==elem.offsetParent}function isCurrentlyFocusable(elem){if(elem.disabled)return!1;if("-1"===elem.getAttribute("tabindex"))return!1;if("INPUT"===elem.tagName){var type=elem.type;if("range"===type)return!1}return isCurrentlyFocusableInternal(elem)}function getDefaultScope(){return scopes[0]||document.body}function getFocusableElements(parent,limit){for(var elems=(parent||getDefaultScope()).querySelectorAll(focusableQuery),focusableElements=[],i=0,length=elems.length;i<length;i++){var elem=elems[i];if(isCurrentlyFocusableInternal(elem)&&(focusableElements.push(elem),limit&&focusableElements.length>=limit))break}return focusableElements}function isFocusContainer(elem,direction){if(focusableContainerTagNames.indexOf(elem.tagName)!==-1)return!0;if(elem.classList.contains("focuscontainer"))return!0;if(direction<2){if(elem.classList.contains("focuscontainer-x"))return!0}else if(3===direction&&elem.classList.contains("focuscontainer-down"))return!0;return!1}function getFocusContainer(elem,direction){for(;!isFocusContainer(elem,direction);)if(elem=elem.parentNode,!elem)return getDefaultScope();return elem}function getOffset(elem){var box;return box=elem.getBoundingClientRect?elem.getBoundingClientRect():{top:0,left:0,width:0,height:0},{top:box.top,left:box.left,width:box.width,height:box.height}}function getViewportBoundingClientRect(elem){var offset=getOffset(elem);return offset.right=offset.left+offset.width,offset.bottom=offset.top+offset.height,offset}function nav(activeElement,direction){activeElement=activeElement||document.activeElement,activeElement&&(activeElement=focusableParent(activeElement));var container=activeElement?getFocusContainer(activeElement,direction):getDefaultScope();if(!activeElement)return void autoFocus(container,!0,!1);for(var focusableContainer=dom.parentWithClass(activeElement,"focusable"),rect=getViewportBoundingClientRect(activeElement),focusableElements=[],focusable=container.querySelectorAll(focusableQuery),i=0,length=focusable.length;i<length;i++){var curr=focusable[i];if(curr!==activeElement&&curr!==focusableContainer){var elementRect=getViewportBoundingClientRect(curr);if(elementRect.width||elementRect.height){switch(direction){case 0:if(elementRect.left>=rect.left)continue;if(elementRect.right===rect.right)continue;break;case 1:if(elementRect.right<=rect.right)continue;if(elementRect.left===rect.left)continue;break;case 2:if(elementRect.top>=rect.top)continue;if(elementRect.bottom>=rect.bottom)continue;break;case 3:if(elementRect.bottom<=rect.bottom)continue;if(elementRect.top<=rect.top)continue}focusableElements.push({element:curr,clientRect:elementRect})}}}var nearest=getNearestElements(focusableElements,rect,direction);if(nearest.length){var nearestElement=nearest[0].node;if(activeElement){var nearestElementFocusableParent=dom.parentWithClass(nearestElement,"focusable");nearestElementFocusableParent&&nearestElementFocusableParent!==nearestElement&&focusableContainer!==nearestElementFocusableParent&&(nearestElement=nearestElementFocusableParent)}focus(nearestElement)}}function intersectsInternal(a1,a2,b1,b2){return b1>=a1&&b1<=a2||b2>=a1&&b2<=a2}function intersects(a1,a2,b1,b2){return intersectsInternal(a1,a2,b1,b2)||intersectsInternal(b1,b2,a1,a2)}function getNearestElements(elementInfos,options,direction){for(var cache=[],point1x=parseFloat(options.left)||0,point1y=parseFloat(options.top)||0,point2x=parseFloat(point1x+options.width-1)||point1x,point2y=parseFloat(point1y+options.height-1)||point1y,sourceMidX=(Math.min,Math.max,options.left+options.width/2),sourceMidY=options.top+options.height/2,i=0,length=elementInfos.length;i<length;i++){var distX,distY,elementInfo=elementInfos[i],elem=elementInfo.element,off=elementInfo.clientRect,x=off.left,y=off.top,x2=x+off.width-1,y2=y+off.height-1,intersectX=intersects(point1x,point2x,x,x2),intersectY=intersects(point1y,point2y,y,y2),midX=off.left+off.width/2,midY=off.top+off.height/2;switch(direction){case 0:distX=Math.abs(point1x-Math.min(point1x,x2)),distY=intersectY?0:Math.abs(sourceMidY-midY);break;case 1:distX=Math.abs(point2x-Math.max(point2x,x)),distY=intersectY?0:Math.abs(sourceMidY-midY);break;case 2:distY=Math.abs(point1y-Math.min(point1y,y2)),distX=intersectX?0:Math.abs(sourceMidX-midX);break;case 3:distY=Math.abs(point2y-Math.max(point2y,y)),distX=intersectX?0:Math.abs(sourceMidX-midX)}var distT=Math.sqrt(distX*distX+distY*distY);cache.push({node:elem,distX:distX,distY:distY,distT:distT,index:i})}return cache.sort(sortNodesT),cache}function sortNodesT(a,b){var result=a.distT-b.distT;return 0!==result?result:(result=a.index-b.index,0!==result?result:0)}function sendText(text){var elem=document.activeElement;elem.value=text}var scopes=[],focusableTagNames=["INPUT","TEXTAREA","SELECT","BUTTON","A"],focusableContainerTagNames=["BODY","DIALOG"],focusableQuery=focusableTagNames.map(function(t){return"INPUT"===t&&(t+=':not([type="range"])'),t+':not([tabindex="-1"]):not(:disabled)'}).join(",")+",.focusable";return{autoFocus:autoFocus,focus:focus,focusableParent:focusableParent,getFocusableElements:getFocusableElements,moveLeft:function(sourceElement){nav(sourceElement,0)},moveRight:function(sourceElement){nav(sourceElement,1)},moveUp:function(sourceElement){nav(sourceElement,2)},moveDown:function(sourceElement){nav(sourceElement,3)},sendText:sendText,isCurrentlyFocusable:isCurrentlyFocusable,pushScope:pushScope,popScope:popScope}});