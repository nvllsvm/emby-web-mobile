define(["appSettings","paper-icon-button-light"],function(appSettings){"use strict";function updatePageStyle(page){"1"==getParameterByName("showuser")?(page.classList.add("libraryPage"),page.classList.add("noSecondaryNavPage"),page.classList.remove("standalonePage")):(page.classList.add("standalonePage"),page.classList.remove("noSecondaryNavPage"),page.classList.remove("libraryPage"))}function showServerConnectionFailure(){alertText(Globalize.translate("MessageUnableToConnectToServer"),Globalize.translate("HeaderConnectionFailure"))}function getServerHtml(server){var html="";return html+='<div class="listItem serverItem" data-id="'+server.Id+'">',html+='<button type="button" is="emby-button" class="fab mini autoSize blue lnkServer" item-icon><i class="md-icon">wifi</i></button>',html+='<div class="listItemBody lnkServer">',html+='<a class="clearLink" href="#">',html+="<div>",html+=server.Name,html+="</div>",html+="</a>",html+="</div>",server.Id&&(html+='<button is="paper-icon-button-light" class="btnServerMenu autoSize"><i class="md-icon">more_vert</i></button>'),html+="</div>"}function renderServers(page,servers){servers.length?(page.querySelector(".noServersMessage").classList.add("hide"),page.querySelector(".serverList").classList.remove("hide")):(page.querySelector(".serverList").classList.add("hide"),page.querySelector(".noServersMessage").classList.remove("hide"));var html="";html+=servers.map(getServerHtml).join(""),page.querySelector(".serverList").innerHTML=html}function alertText(text,title){alertTextWithOptions({title:title,text:text})}function alertTextWithOptions(options){require(["alert"],function(alert){alert(options)})}function showGeneralError(){Dashboard.hideLoadingMsg(),alertText(Globalize.translate("DefaultErrorMessage"))}function parentWithClass(elem,className){for(;!elem.classList||!elem.classList.contains(className);)if(elem=elem.parentNode,!elem)return null;return elem}return function(view,params){function connectToServer(page,server){Dashboard.showLoadingMsg(),ConnectionManager.connectToServer(server,{enableAutoLogin:appSettings.enableAutoLogin()}).then(function(result){Dashboard.hideLoadingMsg();var apiClient=result.ApiClient;switch(result.State){case MediaBrowser.ConnectionState.SignedIn:Dashboard.onServerChanged(apiClient.getCurrentUserId(),apiClient.accessToken(),apiClient),Dashboard.navigate("home.html");break;case MediaBrowser.ConnectionState.ServerSignIn:Dashboard.onServerChanged(null,null,apiClient),Dashboard.navigate("login.html?serverid="+result.Servers[0].Id);break;case MediaBrowser.ConnectionState.ServerUpdateNeeded:alertTextWithOptions({text:Globalize.translate("core#ServerUpdateNeeded","https://emby.media"),html:Globalize.translate("core#ServerUpdateNeeded",'<a href="https://emby.media">https://emby.media</a>')});break;default:showServerConnectionFailure()}})}function acceptInvitation(page,id){Dashboard.showLoadingMsg(),ConnectionManager.acceptServer(id).then(function(){Dashboard.hideLoadingMsg(),loadPage(page)},function(){showGeneralError()})}function deleteServer(page,serverId){Dashboard.showLoadingMsg(),ConnectionManager.deleteServer(serverId).then(function(){Dashboard.hideLoadingMsg(),loadPage(page)},function(){showGeneralError()})}function rejectInvitation(page,id){Dashboard.showLoadingMsg(),ConnectionManager.rejectServer(id).then(function(){Dashboard.hideLoadingMsg(),loadPage(page)},function(){showGeneralError()})}function showServerMenu(elem){var card=parentWithClass(elem,"serverItem"),page=parentWithClass(elem,"page"),serverId=card.getAttribute("data-id"),menuItems=[];menuItems.push({name:Globalize.translate("ButtonDelete"),id:"delete"}),require(["actionsheet"],function(actionsheet){actionsheet.show({items:menuItems,positionTo:elem,callback:function(id){switch(id){case"delete":deleteServer(page,serverId)}}})})}function showPendingInviteMenu(elem){var card=parentWithClass(elem,"inviteItem"),page=parentWithClass(elem,"page"),invitationId=card.getAttribute("data-id"),menuItems=[];menuItems.push({name:Globalize.translate("ButtonAccept"),id:"accept"}),menuItems.push({name:Globalize.translate("ButtonReject"),id:"reject"}),require(["actionsheet"],function(actionsheet){actionsheet.show({items:menuItems,positionTo:elem,callback:function(id){switch(id){case"accept":acceptInvitation(page,invitationId);break;case"reject":rejectInvitation(page,invitationId)}}})})}function getPendingInviteHtml(invite){var html="";return html+='<div class="listItem inviteItem" data-id="'+invite.Id+'">',html+='<button type="button" is="emby-button" class="fab mini autoSize blue lnkServer" item-icon><i class="md-icon">wifi</i></button>',html+='<div class="listItemBody">',html+="<div>",html+=invite.Name,html+="</div>",html+="</div>",html+='<button is="paper-icon-button-light" class="btnInviteMenu autoSize"><i class="md-icon">more_vert</i></button>',html+="</div>"}function renderInvitations(page,list){list.length?page.querySelector(".invitationSection").classList.remove("hide"):page.querySelector(".invitationSection").classList.add("hide");var html=list.map(getPendingInviteHtml).join("");page.querySelector(".invitationList").innerHTML=html}function loadInvitations(page){ConnectionManager.isLoggedIntoConnect()?ConnectionManager.getUserInvitations().then(function(list){renderInvitations(page,list)}):renderInvitations(page,[])}function loadPage(page){Dashboard.showLoadingMsg(),ConnectionManager.getAvailableServers().then(function(servers){servers=servers.slice(0),cachedServers=servers,renderServers(page,servers),Dashboard.hideLoadingMsg()}),loadInvitations(page),ConnectionManager.isLoggedIntoConnect()?page.querySelector(".connectLogin").classList.add("hide"):page.querySelector(".connectLogin").classList.remove("hide")}var cachedServers;view.querySelector(".invitationList").addEventListener("click",function(e){var btnInviteMenu=parentWithClass(e.target,"btnInviteMenu");btnInviteMenu&&showPendingInviteMenu(btnInviteMenu)}),view.querySelector(".serverList").addEventListener("click",function(e){var lnkServer=parentWithClass(e.target,"lnkServer");if(lnkServer){var item=parentWithClass(lnkServer,"serverItem"),id=item.getAttribute("data-id"),server=cachedServers.filter(function(s){return s.Id==id})[0];connectToServer(view,server)}var btnServerMenu=parentWithClass(e.target,"btnServerMenu");btnServerMenu&&showServerMenu(btnServerMenu)}),view.addEventListener("viewbeforeshow",function(){updatePageStyle(this)}),view.addEventListener("viewshow",function(){loadPage(this)})}});