﻿define(['apiclientcore', 'localassetmanager', 'events'], function (apiclientcorefactory, localassetmanager, events) {
    'use strict';

    var localPrefix = 'local:';
    var localViewPrefix = 'localview:';

    /**
     * Creates a new api client instance
     * @param {String} serverAddress
     * @param {String} clientName s
     * @param {String} applicationVersion 
     */
    return function (serverAddress, clientName, applicationVersion, deviceName, deviceId, devicePixelRatio) {

        var apiclientcore = new apiclientcorefactory(serverAddress, clientName, applicationVersion, deviceName, deviceId, devicePixelRatio);

        var self = Object.assign(this, apiclientcore);

        events.on(apiclientcore, 'websocketmessage', onWebSocketMessage);

        Object.defineProperty(self, 'onAuthenticated', {
            get: function () { return apiclientcore.onAuthenticated; },
            set: function (newValue) { apiclientcore.onAuthenticated = newValue; }
        });

        Object.defineProperty(self, 'enableAutomaticBitrateDetection', {
            get: function () { return apiclientcore.enableAutomaticBitrateDetection; },
            set: function (newValue) { apiclientcore.enableAutomaticBitrateDetection = newValue; }
        });

        function getCurrentUser() {

            if (apiclientcore.isLoggedIn()) {
                return apiclientcore.getCurrentUser();
            }

            // TODO: Need to select a user some way if we don't have a user id
            var id = apiclientcore.getCurrentUserId();
            var user = localassetmanager.loadOfflineUser(id);

            return Promise.resolve(user);
        };

        function getUserViews(userId) {

            return apiclientcore.getUserViews(userId).then(function (result) {

                var serverInfo = apiclientcore.serverInfo();

                if (serverInfo) {

                    return getLocalView(serverInfo.Id, userId).then(function (localView) {

                        if (localView) {

                            result.Items.push(localView);
                            result.TotalRecordCount++;
                        }

                        return Promise.resolve(result);
                    });
                }

                return Promise.resolve(result);
            });
        }

        function getLocalView(serverId, userId) {

            return localassetmanager.getViews(serverId, userId).then(function (views) {

                var localView = null;

                if (views.length > 0) {

                    localView = {
                        Name: 'Offline Items',
                        ServerId: serverId,
                        Id: 'localview',
                        Type: 'localview'
                    };
                }

                return Promise.resolve(localView);
            });
        }

        function getItems(userId, options) {

            var serverInfo = apiclientcore.serverInfo();
            var i;

            if (serverInfo && options.ParentId === 'localview') {

                return localassetmanager.getViews(serverInfo.Id, userId).then(function (items) {
                    var result = {
                        Items: items,
                        TotalRecordCount: items.length
                    };

                    return Promise.resolve(result);
                });

            } else if (serverInfo && options && (isLocalId(options.ParentId) || isLocalViewId(options.ParentId))) {

                return localassetmanager.getViewItems(serverInfo.Id, userId, options).then(function (items) {

                    items.forEach(function (item) {
                        adjustGuidProperties(item);
                    });

                    items.sort(function (a, b) { return a.SortName.toLowerCase().localeCompare(b.SortName.toLowerCase()); });

                    var result = {
                        Items: items,
                        TotalRecordCount: items.length
                    };

                    return Promise.resolve(result);
                });
            } else if (options && options.ExcludeItemIds && options.ExcludeItemIds.length) {

                var exItems = options.ExcludeItemIds.split(',');

                for (i = 0; i < exItems.length; i++) {
                    if (isLocalId(exItems[i])) {
                        return Promise.resolve(createEmptyList());
                    }
                }
            } else if (options && options.Ids && options.Ids.length) {

                var ids = options.Ids.split(',');
                var hasLocal = false;

                for (i = 0; i < ids.length; i++) {
                    if (isLocalId(ids[i])) {
                        hasLocal = true;
                    }
                }

                if (hasLocal) {
                    return localassetmanager.getItemsFromIds(serverInfo.Id, ids).then(function (items) {

                        items.forEach(function (item) {
                            adjustGuidProperties(item);
                        });

                        var result = {
                            Items: items,
                            TotalRecordCount: items.length
                        };

                        return Promise.resolve(result);
                    });
                }
            }

            return apiclientcore.getItems(userId, options);
        }

        function getItem(userId, itemId) {

            if (itemId) {
                itemId = itemId.toString();
            }

            var serverInfo;

            if (isLocalViewId(itemId)) {

                serverInfo = apiclientcore.serverInfo();

                if (serverInfo) {
                    return localassetmanager.getViews(serverInfo.Id, userId).then(function (items) {

                        var views = items.filter(function (item) {
                            return item.Id === itemId;
                        });

                        if (views.length > 0) {
                            return Promise.resolve(views[0]);
                        }

                        // TODO: Test consequence of this
                        return Promise.reject();
                    });
                }
            }

            if (isLocalId(itemId)) {

                serverInfo = apiclientcore.serverInfo();

                if (serverInfo) {
                    return localassetmanager.getLocalItem(serverInfo.Id, stripLocalPrefix(itemId)).then(function (item) {

                        adjustGuidProperties(item.Item);

                        return Promise.resolve(item.Item);
                    });
                }
            }

            return apiclientcore.getItem(userId, itemId);
        }

        function adjustGuidProperties(downloadedItem) {

            downloadedItem.Id = convertGuidToLocal(downloadedItem.Id);
            downloadedItem.SeriesId = convertGuidToLocal(downloadedItem.SeriesId);
            downloadedItem.SeasonId = convertGuidToLocal(downloadedItem.SeasonId);

            downloadedItem.AlbumId = convertGuidToLocal(downloadedItem.AlbumId);
            downloadedItem.ParentId = convertGuidToLocal(downloadedItem.ParentId);
            downloadedItem.ParentThumbItemId = convertGuidToLocal(downloadedItem.ParentThumbItemId);
            downloadedItem.ParentPrimaryImageItemId = convertGuidToLocal(downloadedItem.ParentPrimaryImageItemId);
            downloadedItem.PrimaryImageItemId = convertGuidToLocal(downloadedItem.PrimaryImageItemId);
            downloadedItem.ParentLogoItemId = convertGuidToLocal(downloadedItem.ParentLogoItemId);
            downloadedItem.ParentBackdropItemID = convertGuidToLocal(downloadedItem.ParentBackdropItemID);

            downloadedItem.ParentBackdropImageTags = null;
        }

        function convertGuidToLocal(guid) {

            if (!guid) {
                return null;
            }

            if (isLocalId(guid)) {
                return guid;
            }

            return 'local:' + guid;
        }

        function getNextUpEpisodes(options) {

            if (options.SeriesId) {
                if (isLocalId(options.SeriesId)) {
                    return Promise.resolve(createEmptyList());
                }
            }

            return apiclientcore.getNextUpEpisodes(options);
        }

        function getSeasons(itemId, options) {

            if (isLocalId(itemId)) {
                options.ParentId = itemId;
                return getItems(apiclientcore.getCurrentUserId(), options);
            }

            return apiclientcore.getSeasons(itemId, options);
        }

        function getEpisodes(itemId, options) {

            if (isLocalId(options.SeasonId)) {
                options.ParentId = options.SeasonId;
                return getItems(apiclientcore.getCurrentUserId(), options);
            }

            return apiclientcore.getEpisodes(itemId, options);
        }

        function getThemeMedia(userId, itemId, inherit) {

            if (isLocalViewId(itemId) || isLocalId(itemId)) {
                return Promise.reject();
            }

            return apiclientcore.getThemeMedia(userId, itemId, inherit);
        }

        function getSimilarItems(itemId, options) {

            if (isLocalId(itemId)) {
                return Promise.resolve(createEmptyList());
            }

            return apiclientcore.getSimilarItems(itemId, options);
        }

        function updateFavoriteStatus(userId, itemId, isFavorite) {

            if (isLocalId(itemId)) {
                return Promise.resolve();
            }

            return apiclientcore.updateFavoriteStatus(userId, itemId, isFavorite);
        }

        function getScaledImageUrl(itemId, options) {

            if (isLocalId(itemId)
                || (options && options.itemid && isLocalId(options.itemid))) {

                var serverInfo = apiclientcore.serverInfo();
                var id = stripLocalPrefix(itemId);

                return localassetmanager.getImageUrl(serverInfo.Id, id, options.type, 0);
            }

            return apiclientcore.getScaledImageUrl(itemId, options);
        }

        function onWebSocketMessage(e, msg) {

            events.trigger(self, 'websocketmessage', [msg]);
        }


        function getPlaybackInfo(itemId, options, deviceProfile) {

            if (isLocalId(itemId)) {
                return localassetmanager.getLocalItem(apiclientcore.serverId(), stripLocalPrefix(itemId)).then(function (item) {

                    // TODO: This was already done during the sync process, right? If so, remove it
                    var mediaSources = item.Item.MediaSources.map(function (m) {
                        m.SupportsDirectPlay = true;
                        m.SupportsDirectStream = false;
                        m.SupportsTranscoding = false;
                        return m;
                    });

                    return {
                        MediaSources: mediaSources
                    };
                });
            }

            return apiclientcore.getPlaybackInfo(itemId, options, deviceProfile);
        }

        function reportPlaybackStart(options) {

            if (!options) {
                throw new Error("null options");
            }

            if (isLocalId(options.ItemId)) {
                return Promise.resolve();
            }

            return apiclientcore.reportPlaybackStart(options);
        }

        function reportPlaybackProgress(options) {

            if (!options) {
                throw new Error("null options");
            }

            if (isLocalId(options.ItemId)) {
                return Promise.resolve();
            }

            return apiclientcore.reportPlaybackProgress(options);
        }

        function reportPlaybackStopped(options) {

            if (!options) {
                throw new Error("null options");
            }

            if (isLocalId(options.ItemId)) {
                return Promise.resolve();
            }

            return apiclientcore.reportPlaybackStopped(options);
        }

        function getIntros(itemId) {

            if (isLocalId(itemId)) {
                return Promise.resolve({
                    Items: [],
                    TotalRecordCount: 0
                });
            }

            return apiclientcore.getIntros(itemId);
        }

        // **************** Helper functions

        function isLocalId(str) {
            return startsWith(str, localPrefix);
        }

        function isLocalViewId(str) {
            return startsWith(str, localViewPrefix);
        }

        function stripLocalPrefix(str) {
            var res = stripStart(str, localPrefix);
            res = stripStart(res, localViewPrefix);

            return res;
        }

        function startsWith(str, find) {

            if (str && find && str.length > find.length) {
                if (str.indexOf(find) === 0) {
                    return true;
                }
            }

            return false;
        }

        function stripStart(str, find) {
            if (startsWith(str, find)) {
                return str.substr(find.length);
            }

            return str;
        }

        function createEmptyList() {
            var result = {
                Items: [],
                TotalRecordCount: 0
            };

            return result;
        }

        // What to do with detectBitrate? When the app calls into apiclientex, this doesn't
        // mean that we're offline. We could be online or offline...
        self.detectBitrate = function () {
            return Promise.reject();
        };

        self.getCurrentUser = getCurrentUser;
        self.getUserViews = getUserViews;
        self.getItems = getItems;
        self.getItem = getItem;
        self.getSeasons = getSeasons;
        self.getEpisodes = getEpisodes;
        self.getThemeMedia = getThemeMedia;
        self.getNextUpEpisodes = getNextUpEpisodes;
        self.getSimilarItems = getSimilarItems;
        self.updateFavoriteStatus = updateFavoriteStatus;
        self.getScaledImageUrl = getScaledImageUrl;
        self.getPlaybackInfo = getPlaybackInfo;
        self.reportPlaybackStart = reportPlaybackStart;
        self.reportPlaybackProgress = reportPlaybackProgress;
        self.reportPlaybackStopped = reportPlaybackStopped;
        self.getIntros = getIntros;
    };

});