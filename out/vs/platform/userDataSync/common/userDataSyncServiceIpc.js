/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, event_1, lifecycle_1, uri_1, userDataProfile_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncServiceChannelClient = exports.UserDataSyncServiceChannel = void 0;
    function reviewSyncResource(syncResource, userDataProfilesService) {
        return { ...syncResource, profile: (0, userDataProfile_1.reviveProfile)(syncResource.profile, userDataProfilesService.profilesHome.scheme) };
    }
    function reviewSyncResourceHandle(syncResourceHandle) {
        return { created: syncResourceHandle.created, uri: uri_1.URI.revive(syncResourceHandle.uri) };
    }
    class UserDataSyncServiceChannel {
        constructor(service, userDataProfilesService, logService) {
            this.service = service;
            this.userDataProfilesService = userDataProfilesService;
            this.logService = logService;
            this.manualSyncTasks = new Map();
            this.onManualSynchronizeResources = new event_1.Emitter();
        }
        listen(_, event) {
            switch (event) {
                // sync
                case 'onDidChangeStatus': return this.service.onDidChangeStatus;
                case 'onDidChangeConflicts': return this.service.onDidChangeConflicts;
                case 'onDidChangeLocal': return this.service.onDidChangeLocal;
                case 'onDidChangeLastSyncTime': return this.service.onDidChangeLastSyncTime;
                case 'onSyncErrors': return this.service.onSyncErrors;
                case 'onDidResetLocal': return this.service.onDidResetLocal;
                case 'onDidResetRemote': return this.service.onDidResetRemote;
                // manual sync
                case 'manualSync/onSynchronizeResources': return this.onManualSynchronizeResources.event;
            }
            throw new Error(`[UserDataSyncServiceChannel] Event not found: ${event}`);
        }
        async call(context, command, args) {
            try {
                const result = await this._call(context, command, args);
                return result;
            }
            catch (e) {
                this.logService.error(e);
                throw e;
            }
        }
        async _call(context, command, args) {
            switch (command) {
                // sync
                case '_getInitialData': return Promise.resolve([this.service.status, this.service.conflicts, this.service.lastSyncTime]);
                case 'reset': return this.service.reset();
                case 'resetRemote': return this.service.resetRemote();
                case 'resetLocal': return this.service.resetLocal();
                case 'hasPreviouslySynced': return this.service.hasPreviouslySynced();
                case 'hasLocalData': return this.service.hasLocalData();
                case 'resolveContent': return this.service.resolveContent(uri_1.URI.revive(args[0]));
                case 'accept': return this.service.accept(reviewSyncResource(args[0], this.userDataProfilesService), uri_1.URI.revive(args[1]), args[2], args[3]);
                case 'replace': return this.service.replace(reviewSyncResourceHandle(args[0]));
                case 'cleanUpRemoteData': return this.service.cleanUpRemoteData();
                case 'getRemoteActivityData': return this.service.saveRemoteActivityData(uri_1.URI.revive(args[0]));
                case 'extractActivityData': return this.service.extractActivityData(uri_1.URI.revive(args[0]), uri_1.URI.revive(args[1]));
                case 'createManualSyncTask': return this.createManualSyncTask();
            }
            // manual sync
            if (command.startsWith('manualSync/')) {
                const manualSyncTaskCommand = command.substring('manualSync/'.length);
                const manualSyncTaskId = args[0];
                const manualSyncTask = this.getManualSyncTask(manualSyncTaskId);
                args = args.slice(1);
                switch (manualSyncTaskCommand) {
                    case 'merge': return manualSyncTask.merge();
                    case 'apply': return manualSyncTask.apply().then(() => this.manualSyncTasks.delete(this.createKey(manualSyncTask.id)));
                    case 'stop': return manualSyncTask.stop().finally(() => this.manualSyncTasks.delete(this.createKey(manualSyncTask.id)));
                }
            }
            throw new Error('Invalid call');
        }
        getManualSyncTask(manualSyncTaskId) {
            const manualSyncTask = this.manualSyncTasks.get(this.createKey(manualSyncTaskId));
            if (!manualSyncTask) {
                throw new Error(`Manual sync taks not found: ${manualSyncTaskId}`);
            }
            return manualSyncTask;
        }
        async createManualSyncTask() {
            const manualSyncTask = await this.service.createManualSyncTask();
            this.manualSyncTasks.set(this.createKey(manualSyncTask.id), manualSyncTask);
            return manualSyncTask.id;
        }
        createKey(manualSyncTaskId) { return `manualSyncTask-${manualSyncTaskId}`; }
    }
    exports.UserDataSyncServiceChannel = UserDataSyncServiceChannel;
    let UserDataSyncServiceChannelClient = class UserDataSyncServiceChannelClient extends lifecycle_1.Disposable {
        get status() { return this._status; }
        get onDidChangeLocal() { return this.channel.listen('onDidChangeLocal'); }
        get conflicts() { return this._conflicts; }
        get lastSyncTime() { return this._lastSyncTime; }
        get onDidResetLocal() { return this.channel.listen('onDidResetLocal'); }
        get onDidResetRemote() { return this.channel.listen('onDidResetRemote'); }
        constructor(userDataSyncChannel, userDataProfilesService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            this._status = "uninitialized" /* SyncStatus.Uninitialized */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this._lastSyncTime = undefined;
            this._onDidChangeLastSyncTime = this._register(new event_1.Emitter());
            this.onDidChangeLastSyncTime = this._onDidChangeLastSyncTime.event;
            this._onSyncErrors = this._register(new event_1.Emitter());
            this.onSyncErrors = this._onSyncErrors.event;
            this.channel = {
                call(command, arg, cancellationToken) {
                    return userDataSyncChannel.call(command, arg, cancellationToken)
                        .then(null, error => { throw userDataSync_1.UserDataSyncError.toUserDataSyncError(error); });
                },
                listen(event, arg) {
                    return userDataSyncChannel.listen(event, arg);
                }
            };
            this.channel.call('_getInitialData').then(([status, conflicts, lastSyncTime]) => {
                this.updateStatus(status);
                this.updateConflicts(conflicts);
                if (lastSyncTime) {
                    this.updateLastSyncTime(lastSyncTime);
                }
                this._register(this.channel.listen('onDidChangeStatus')(status => this.updateStatus(status)));
                this._register(this.channel.listen('onDidChangeLastSyncTime')(lastSyncTime => this.updateLastSyncTime(lastSyncTime)));
            });
            this._register(this.channel.listen('onDidChangeConflicts')(conflicts => this.updateConflicts(conflicts)));
            this._register(this.channel.listen('onSyncErrors')(errors => this._onSyncErrors.fire(errors.map(syncError => ({ ...syncError, error: userDataSync_1.UserDataSyncError.toUserDataSyncError(syncError.error) })))));
        }
        createSyncTask() {
            throw new Error('not supported');
        }
        async createManualSyncTask() {
            const id = await this.channel.call('createManualSyncTask');
            const that = this;
            const manualSyncTaskChannelClient = new ManualSyncTaskChannelClient(id, {
                async call(command, arg, cancellationToken) {
                    return that.channel.call(`manualSync/${command}`, [id, ...(Array.isArray(arg) ? arg : [arg])], cancellationToken);
                },
                listen() {
                    throw new Error('not supported');
                }
            });
            return manualSyncTaskChannelClient;
        }
        reset() {
            return this.channel.call('reset');
        }
        resetRemote() {
            return this.channel.call('resetRemote');
        }
        resetLocal() {
            return this.channel.call('resetLocal');
        }
        hasPreviouslySynced() {
            return this.channel.call('hasPreviouslySynced');
        }
        hasLocalData() {
            return this.channel.call('hasLocalData');
        }
        accept(syncResource, resource, content, apply) {
            return this.channel.call('accept', [syncResource, resource, content, apply]);
        }
        resolveContent(resource) {
            return this.channel.call('resolveContent', [resource]);
        }
        cleanUpRemoteData() {
            return this.channel.call('cleanUpRemoteData');
        }
        replace(syncResourceHandle) {
            return this.channel.call('replace', [syncResourceHandle]);
        }
        saveRemoteActivityData(location) {
            return this.channel.call('getRemoteActivityData', [location]);
        }
        extractActivityData(activityDataResource, location) {
            return this.channel.call('extractActivityData', [activityDataResource, location]);
        }
        async updateStatus(status) {
            this._status = status;
            this._onDidChangeStatus.fire(status);
        }
        async updateConflicts(conflicts) {
            // Revive URIs
            this._conflicts = conflicts.map(syncConflict => ({
                syncResource: syncConflict.syncResource,
                profile: (0, userDataProfile_1.reviveProfile)(syncConflict.profile, this.userDataProfilesService.profilesHome.scheme),
                conflicts: syncConflict.conflicts.map(r => ({
                    ...r,
                    baseResource: uri_1.URI.revive(r.baseResource),
                    localResource: uri_1.URI.revive(r.localResource),
                    remoteResource: uri_1.URI.revive(r.remoteResource),
                    previewResource: uri_1.URI.revive(r.previewResource),
                }))
            }));
            this._onDidChangeConflicts.fire(this._conflicts);
        }
        updateLastSyncTime(lastSyncTime) {
            if (this._lastSyncTime !== lastSyncTime) {
                this._lastSyncTime = lastSyncTime;
                this._onDidChangeLastSyncTime.fire(lastSyncTime);
            }
        }
    };
    exports.UserDataSyncServiceChannelClient = UserDataSyncServiceChannelClient;
    exports.UserDataSyncServiceChannelClient = UserDataSyncServiceChannelClient = __decorate([
        __param(1, userDataProfile_1.IUserDataProfilesService)
    ], UserDataSyncServiceChannelClient);
    class ManualSyncTaskChannelClient extends lifecycle_1.Disposable {
        constructor(id, channel) {
            super();
            this.id = id;
            this.channel = channel;
        }
        async merge() {
            return this.channel.call('merge');
        }
        async apply() {
            return this.channel.call('apply');
        }
        stop() {
            return this.channel.call('stop');
        }
        dispose() {
            this.channel.call('dispose');
            super.dispose();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jU2VydmljZUlwYy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi91c2VyRGF0YVN5bmNTZXJ2aWNlSXBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCaEcsU0FBUyxrQkFBa0IsQ0FBQyxZQUFtQyxFQUFFLHVCQUFpRDtRQUNqSCxPQUFPLEVBQUUsR0FBRyxZQUFZLEVBQUUsT0FBTyxFQUFFLElBQUEsK0JBQWEsRUFBQyxZQUFZLENBQUMsT0FBTyxFQUFFLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ3ZILENBQUM7SUFFRCxTQUFTLHdCQUF3QixDQUFDLGtCQUF1QztRQUN4RSxPQUFPLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsU0FBRyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO0lBQ3pGLENBQUM7SUFFRCxNQUFhLDBCQUEwQjtRQUt0QyxZQUNrQixPQUE2QixFQUM3Qix1QkFBaUQsRUFDakQsVUFBdUI7WUFGdkIsWUFBTyxHQUFQLE9BQU8sQ0FBc0I7WUFDN0IsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUNqRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBTnhCLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQW1DLENBQUM7WUFDN0QsaUNBQTRCLEdBQUcsSUFBSSxlQUFPLEVBQWdELENBQUM7UUFNeEcsQ0FBQztRQUVMLE1BQU0sQ0FBQyxDQUFVLEVBQUUsS0FBYTtZQUMvQixRQUFRLEtBQUssRUFBRSxDQUFDO2dCQUNmLE9BQU87Z0JBQ1AsS0FBSyxtQkFBbUIsQ0FBQyxDQUFDLE9BQU8sSUFB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