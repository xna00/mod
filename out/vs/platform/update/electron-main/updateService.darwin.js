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
define(["require", "exports", "electron", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/telemetry/common/telemetry", "vs/platform/update/common/update", "vs/platform/update/electron-main/abstractUpdateService"], function (require, exports, electron, decorators_1, event_1, hash_1, lifecycle_1, configuration_1, environmentMainService_1, lifecycleMainService_1, log_1, productService_1, request_1, telemetry_1, update_1, abstractUpdateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DarwinUpdateService = void 0;
    let DarwinUpdateService = class DarwinUpdateService extends abstractUpdateService_1.AbstractUpdateService {
        get onRawError() { return event_1.Event.fromNodeEventEmitter(electron.autoUpdater, 'error', (_, message) => message); }
        get onRawUpdateNotAvailable() { return event_1.Event.fromNodeEventEmitter(electron.autoUpdater, 'update-not-available'); }
        get onRawUpdateAvailable() { return event_1.Event.fromNodeEventEmitter(electron.autoUpdater, 'update-available'); }
        get onRawUpdateDownloaded() { return event_1.Event.fromNodeEventEmitter(electron.autoUpdater, 'update-downloaded', (_, releaseNotes, version, timestamp) => ({ version, productVersion: version, timestamp })); }
        constructor(lifecycleMainService, configurationService, telemetryService, environmentMainService, requestService, logService, productService) {
            super(lifecycleMainService, configurationService, environmentMainService, requestService, logService, productService);
            this.telemetryService = telemetryService;
            this.disposables = new lifecycle_1.DisposableStore();
            lifecycleMainService.setRelaunchHandler(this);
        }
        handleRelaunch(options) {
            if (options?.addArgs || options?.removeArgs) {
                return false; // we cannot apply an update and restart with different args
            }
            if (this.state.type !== "ready" /* StateType.Ready */) {
                return false; // we only handle the relaunch when we have a pending update
            }
            this.logService.trace('update#handleRelaunch(): running raw#quitAndInstall()');
            this.doQuitAndInstall();
            return true;
        }
        async initialize() {
            await super.initialize();
            this.onRawError(this.onError, this, this.disposables);
            this.onRawUpdateAvailable(this.onUpdateAvailable, this, this.disposables);
            this.onRawUpdateDownloaded(this.onUpdateDownloaded, this, this.disposables);
            this.onRawUpdateNotAvailable(this.onUpdateNotAvailable, this, this.disposables);
        }
        onError(err) {
            this.telemetryService.publicLog2('update:error', { messageHash: String((0, hash_1.hash)(String(err))) });
            this.logService.error('UpdateService error:', err);
            // only show message when explicitly checking for updates
            const message = (this.state.type === "checking for updates" /* StateType.CheckingForUpdates */ && this.state.explicit) ? err : undefined;
            this.setState(update_1.State.Idle(1 /* UpdateType.Archive */, message));
        }
        buildUpdateFeedUrl(quality) {
            let assetID;
            if (!this.productService.darwinUniversalAssetId) {
                assetID = process.arch === 'x64' ? 'darwin' : 'darwin-arm64';
            }
            else {
                assetID = this.productService.darwinUniversalAssetId;
            }
            const url = (0, abstractUpdateService_1.createUpdateURL)(assetID, quality, this.productService);
            try {
                electron.autoUpdater.setFeedURL({ url });
            }
            catch (e) {
                // application is very likely not signed
                this.logService.error('Failed to set update feed URL', e);
                return undefined;
            }
            return url;
        }
        doCheckForUpdates(context) {
            this.setState(update_1.State.CheckingForUpdates(context));
            electron.autoUpdater.checkForUpdates();
        }
        onUpdateAvailable() {
            if (this.state.type !== "checking for updates" /* StateType.CheckingForUpdates */) {
                return;
            }
            this.setState(update_1.State.Downloading);
        }
        onUpdateDownloaded(update) {
            if (this.state.type !== "downloading" /* StateType.Downloading */) {
                return;
            }
            this.setState(update_1.State.Downloaded(update));
            this.telemetryService.publicLog2('update:downloaded', { version: update.version });
            this.setState(update_1.State.Ready(update));
        }
        onUpdateNotAvailable() {
            if (this.state.type !== "checking for updates" /* StateType.CheckingForUpdates */) {
                return;
            }
            this.telemetryService.publicLog2('update:notAvailable', { explicit: this.state.explicit });
            this.setState(update_1.State.Idle(1 /* UpdateType.Archive */));
        }
        doQuitAndInstall() {
            this.logService.trace('update#quitAndInstall(): running raw#quitAndInstall()');
            electron.autoUpdater.quitAndInstall();
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    exports.DarwinUpdateService = DarwinUpdateService;
    __decorate([
        decorators_1.memoize
    ], DarwinUpdateService.prototype, "onRawError", null);
    __decorate([
        decorators_1.memoize
    ], DarwinUpdateService.prototype, "onRawUpdateNotAvailable", null);
    __decorate([
        decorators_1.memoize
    ], DarwinUpdateService.prototype, "onRawUpdateAvailable", null);
    __decorate([
        decorators_1.memoize
    ], DarwinUpdateService.prototype, "onRawUpdateDownloaded", null);
    exports.DarwinUpdateService = DarwinUpdateService = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, environmentMainService_1.IEnvironmentMainService),
        __param(4, request_1.IRequestService),
        __param(5, log_1.ILogService),
        __param(6, productService_1.IProductService)
    ], DarwinUpdateService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlU2VydmljZS5kYXJ3aW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VwZGF0ZS9lbGVjdHJvbi1tYWluL3VwZGF0ZVNlcnZpY2UuZGFyd2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSw2Q0FBcUI7UUFJcEQsSUFBWSxVQUFVLEtBQW9CLE9BQU8sYUFBSyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RJLElBQVksdUJBQXVCLEtBQWtCLE9BQU8sYUFBSyxDQUFDLG9CQUFvQixDQUFPLFFBQVEsQ0FBQyxXQUFXLEVBQUUsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0ksSUFBWSxvQkFBb0IsS0FBa0IsT0FBTyxhQUFLLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoSSxJQUFZLHFCQUFxQixLQUFxQixPQUFPLGFBQUssQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUUxTyxZQUN3QixvQkFBMkMsRUFDM0Msb0JBQTJDLEVBQy9DLGdCQUFvRCxFQUM5QyxzQkFBK0MsRUFDdkQs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