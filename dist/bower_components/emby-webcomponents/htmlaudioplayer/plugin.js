define(["events","browser","pluginManager","apphost","appSettings","itemHelper"],function(events,browser,pluginManager,appHost,appSettings,itemHelper){"use strict";return function(){function getSavedVolume(){return appSettings.get("volume")||1}function saveVolume(value){value&&appSettings.set("volume",value)}function playUwp(options,elem){return Windows.Storage.StorageFile.getFileFromPathAsync(options.url).then(function(file){var playlist=new Windows.Media.Playback.MediaPlaybackList,source1=Windows.Media.Core.MediaSource.createFromStorageFile(file),startTime=(options.playerStartPositionTicks||0)/1e4,winJsPlaybackItem=new Windows.Media.Playback.MediaPlaybackItem(source1,startTime);return playlist.items.append(winJsPlaybackItem),elem.src=URL.createObjectURL(playlist,{oneTimeOnly:!0}),currentSrc=elem.src,currentPlayOptions=options,playWithPromise(elem)})}function playWithPromise(elem){try{var promise=elem.play();return promise&&promise.then?promise.catch(function(e){var errorName=(e.name||"").toLowerCase();return"notallowederror"===errorName||"aborterror"===errorName?Promise.resolve():Promise.reject()}):Promise.resolve()}catch(err){return console.log("error calling audio.play: "+err),Promise.reject()}}function getCrossOriginValue(mediaSource){return"anonymous"}function supportsFade(){return!browser.tv}function fade(elem,startingVolume){var newVolume=Math.max(0,startingVolume-.15);return console.log("fading volume to "+newVolume),elem.volume=newVolume,newVolume<=0?Promise.resolve():new Promise(function(resolve,reject){cancelFadeTimeout(),fadeTimeout=setTimeout(function(){fade(elem,newVolume).then(resolve,reject)},100)})}function cancelFadeTimeout(){var timeout=fadeTimeout;timeout&&(clearTimeout(timeout),fadeTimeout=null)}function onEnded(){var stopInfo={src:currentSrc};events.trigger(self,"stopped",[stopInfo]),_currentTime=null,currentSrc=null,currentPlayOptions=null}function onTimeUpdate(){var time=this.currentTime;_currentTime=time,events.trigger(self,"timeupdate")}function onVolumeChange(){fadeTimeout||(saveVolume(this.volume),events.trigger(self,"volumechange"))}function onPlaying(e){started||(started=!0,this.removeAttribute("controls"),seekOnPlaybackStart(e.target)),events.trigger(self,"playing")}function seekOnPlaybackStart(element){var seconds=(currentPlayOptions.playerStartPositionTicks||0)/1e7;if(seconds){var src=(self.currentSrc()||"").toLowerCase();if(!browser.chrome||src.indexOf(".m3u8")!==-1){var delay=browser.safari?2500:0;delay?setTimeout(function(){element.currentTime=seconds},delay):element.currentTime=seconds}}}function onPause(){events.trigger(self,"pause")}function onError(){var errorCode=this.error?this.error.code:"";errorCode=(errorCode||"").toString(),console.log("Media element error code: "+errorCode);var type;switch(errorCode){case 1:return;case 2:type="network";break;case 3:break;case 4:}}function createMediaElement(){var elem=document.querySelector(".mediaPlayerAudio");return elem||(elem=document.createElement("audio"),elem.classList.add("mediaPlayerAudio"),elem.classList.add("hide"),document.body.appendChild(elem),elem.volume=getSavedVolume(),elem.addEventListener("timeupdate",onTimeUpdate),elem.addEventListener("ended",onEnded),elem.addEventListener("volumechange",onVolumeChange),elem.addEventListener("pause",onPause),elem.addEventListener("playing",onPlaying),elem.addEventListener("error",onError)),mediaElement=elem,elem}function onDocumentClick(){document.removeEventListener("click",onDocumentClick);var elem=document.createElement("audio");elem.classList.add("mediaPlayerAudio"),elem.classList.add("hide"),document.body.appendChild(elem),elem.src=pluginManager.mapPath(self,"blank.mp3"),elem.play(),setTimeout(function(){elem.src="",elem.removeAttribute("src")},1e3)}var self=this;self.name="Html Audio Player",self.type="mediaplayer",self.id="htmlaudioplayer",self.priority=1;var mediaElement,currentSrc,currentPlayOptions,started,_currentTime;self.canPlayMediaType=function(mediaType){return"audio"===(mediaType||"").toLowerCase()},self.getDeviceProfile=function(){return new Promise(function(resolve,reject){require(["browserdeviceprofile"],function(profileBuilder){var profile=profileBuilder({});resolve(profile)})})},self.currentSrc=function(){return currentSrc},self.play=function(options){_currentTime=null,started=!1;var elem=createMediaElement(),val=options.url,seconds=(options.playerStartPositionTicks||0)/1e7;if(seconds&&(val+="#t="+seconds),elem.crossOrigin=getCrossOriginValue(options.mediaSource),elem.title=options.title,options.mimeType&&browser.operaTv)elem.currentSrc&&(elem.src="",elem.removeAttribute("src")),elem.innerHTML='<source src="'+val+'" type="'+options.mimeType+'">';else{if(window.Windows&&options.mediaSource&&options.mediaSource.IsLocal)return playUwp(options,elem);elem.src=val}return currentSrc=val,currentPlayOptions=options,playWithPromise(elem)},self.currentTime=function(val){if(mediaElement)return null!=val?void(mediaElement.currentTime=val/1e3):_currentTime?1e3*_currentTime:1e3*(mediaElement.currentTime||0)},self.duration=function(val){if(mediaElement){var duration=mediaElement.duration;if(duration&&!isNaN(duration)&&duration!==Number.POSITIVE_INFINITY&&duration!==Number.NEGATIVE_INFINITY)return 1e3*duration}return null},self.stop=function(destroyPlayer){cancelFadeTimeout();var elem=mediaElement,src=currentSrc;if(elem&&src){if(!destroyPlayer||!supportsFade())return elem.paused||elem.pause(),elem.src="",elem.innerHTML="",elem.removeAttribute("src"),onEnded(),Promise.resolve();var originalVolume=elem.volume;return fade(elem,elem.volume).then(function(){elem.paused||elem.pause(),elem.src="",elem.innerHTML="",elem.removeAttribute("src"),elem.volume=originalVolume,onEnded()})}return Promise.resolve()},self.destroy=function(){};var fadeTimeout;self.pause=function(){mediaElement&&mediaElement.pause()},self.resume=function(){mediaElement&&mediaElement.play()},self.unpause=function(){mediaElement&&mediaElement.play()},self.paused=function(){return!!mediaElement&&mediaElement.paused},self.setVolume=function(val){mediaElement&&(mediaElement.volume=val/100)},self.getVolume=function(){if(mediaElement)return 100*mediaElement.volume},self.volumeUp=function(){self.setVolume(Math.min(self.getVolume()+2,100))},self.volumeDown=function(){self.setVolume(Math.max(self.getVolume()-2,0))},self.setMute=function(mute){mediaElement&&(mediaElement.muted=mute)},self.isMuted=function(){return!!mediaElement&&mediaElement.muted},appHost.supports("htmlaudioautoplay")||document.addEventListener("click",onDocumentClick)}});