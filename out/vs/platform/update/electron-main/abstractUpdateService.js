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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/update/common/update"], function (require, exports, async_1, cancellation_1, event_1, configuration_1, environmentMainService_1, lifecycleMainService_1, log_1, productService_1, request_1, update_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractUpdateService = void 0;
    exports.createUpdateURL = createUpdateURL;
    function createUpdateURL(platform, quality, productService) {
        return `${productService.updateUrl}/api/update/${platform}/${quality}/${productService.commit}`;
    }
    let AbstractUpdateService = class AbstractUpdateService {
        get state() {
            return this._state;
        }
        setState(state) {
            this.logService.info('update#setState', state.type);
            this._state = state;
            this._onStateChange.fire(state);
        }
        constructor(lifecycleMainService, configurationService, environmentMainService, requestService, logService, productService) {
            this.lifecycleMainService = lifecycleMainService;
            this.configurationService = configurationService;
            this.environmentMainService = environmentMainService;
            this.requestService = requestService;
            this.logService = logService;
            this.productService = productService;
            this._state = update_1.State.Uninitialized;
            this._onStateChange = new event_1.Emitter();
            this.onStateChange = this._onStateChange.event;
            lifecycleMainService.when(3 /* LifecycleMainPhase.AfterWindowOpen */)
                .finally(() => this.initialize());
        }
        /**
         * This must be called before any other call. This is a performance
         * optimization, to avoid using extra CPU cycles before first window open.
         * https://github.com/microsoft/vscode/issues/89784
         */
        async initialize() {
            if (!this.environmentMainService.isBuilt) {
                this.setState(update_1.State.Disabled(0 /* DisablementReason.NotBuilt */));
                return; // updates are never enabled when running out of sources
            }
            if (this.environmentMainService.disableUpdates) {
                this.setState(update_1.State.Disabled(1 /* DisablementReason.DisabledByEnvironment */));
                this.logService.info('update#ctor - updates are disabled by the environment');
                return;
            }
            if (!this.productService.updateUrl || !this.productService.commit) {
                this.setState(update_1.State.Disabled(3 /* DisablementReason.MissingConfiguration */));
                this.logService.info('update#ctor - updates are disabled as there is no update URL');
                return;
            }
            const updateMode = this.configurationService.getValue('update.mode');
            const quality = this.getProductQuality(updateMode);
            if (!quality) {
                this.setState(update_1.State.Disabled(2 /* DisablementReason.ManuallyDisabled */));
                this.logService.info('update#ctor - updates are disabled by user preference');
                return;
            }
            this.url = this.buildUpdateFeedUrl(quality);
            if (!this.url) {
                this.setState(update_1.State.Disabled(4 /* DisablementReason.InvalidConfiguration */));
                this.logService.info('update#ctor - updates are disabled as the update URL is badly formed');
                return;
            }
            // hidden setting
            if (this.configurationService.getValue('_update.prss')) {
                const url = new URL(this.url);
                url.searchParams.set('prss', 'true');
                this.url = url.toString();
            }
            this.setState(update_1.State.Idle(this.getUpdateType()));
            if (updateMode === 'manual') {
                this.logService.info('update#ctor - manual checks only; automatic updates are disabled by user preference');
                return;
            }
            if (updateMode === 'start') {
                this.logService.info('update#ctor - startup checks only; automatic updates are disabled by user preference');
                // Check for updates only once after 30 seconds
                setTimeout(() => this.checkForUpdates(false), 30 * 1000);
            }
            else {
                // Start checking for updates after 30 seconds
                this.scheduleCheckForUpdates(30 * 1000).then(undefined, err => this.logService.error(err));
            }
        }
        getProductQuality(updateMode) {
            return updateMode === 'none' ? undefined : this.productService.quality;
        }
        scheduleCheckForUpdates(delay = 60 * 60 * 1000) {
            return (0, async_1.timeout)(delay)
                .then(() => this.checkForUpdates(false))
                .then(() => {
                // Check again after 1 hour
                return this.scheduleCheckForUpdates(60 * 60 * 1000);
            });
        }
        async checkForUpdates(explicit) {
            this.logService.trace('update#checkForUpdates, state = ', this.state.type);
            if (this.state.type !== "idle" /* StateType.Idle */) {
                return;
            }
            this.doCheckForUpdates(explicit);
        }
        async downloadUpdate() {
            this.logService.trace('update#downloadUpdate, state = ', this.state.type);
            if (this.state.type !== "available for download" /* StateType.AvailableForDownload */) {
                return;
            }
            await this.doDownloadUpdate(this.state);
        }
        async doDownloadUpdate(state) {
            // noop
        }
        async applyUpdate() {
            this.logService.trace('update#applyUpdate, state = ', this.state.type);
            if (this.state.type !== "downloaded" /* StateType.Downloaded */) {
                return;
            }
            await this.doApplyUpdate();
        }
        async doApplyUpdate() {
            // noop
        }
        quitAndInstall() {
            this.logService.trace('update#quitAndInstall, state = ', this.state.type);
            if (this.state.type !== "ready" /* StateType.Ready */) {
                return Promise.resolve(undefined);
            }
            this.logService.trace('update#quitAndInstall(): before lifecycle quit()');
            this.lifecycleMainService.quit(true /* will restart */).then(vetod => {
                this.logService.trace(`update#quitAndInstall(): after lifecycle quit() with veto: ${vetod}`);
                if (vetod) {
                    return;
                }
                this.logService.trace('update#quitAndInstall(): running raw#quitAndInstall()');
                this.doQuitAndInstall();
            });
            return Promise.resolve(undefined);
        }
        async isLatestVersion() {
            if (!this.url) {
                return undefined;
            }
            const mode = this.configurationService.getValue('update.mode');
            if (mode === 'none') {
                return false;
            }
            try {
                const context = await this.requestService.request({ url: this.url }, cancellation_1.CancellationToken.None);
                // The update server replies with 204 (No Content) when no
                // update is available - that's all we want to know.
                return context.res.statusCode === 204;
            }
            catch (error) {
                this.logService.error('update#isLatestVersion(): failed to check for updates');
                this.logService.error(error);
                return undefined;
            }
        }
        async _applySpecificUpdate(packagePath) {
            // noop
        }
        getUpdateType() {
            return 1 /* UpdateType.Archive */;
        }
        doQuitAndInstall() {
            // noop
        }
    };
    exports.AbstractUpdateService = AbstractUpdateService;
    exports.AbstractUpdateService = AbstractUpdateService = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, environmentMainService_1.IEnvironmentMainService),
        __param(3, request_1.IRequestService),
        __param(4, log_1.ILogService),
        __param(5, productService_1.IProductService)
    ], AbstractUpdateService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RVcGRhdGVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91cGRhdGUvZWxlY3Ryb24tbWFpbi9hYnN0cmFjdFVwZGF0ZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLDBDQUVDO0lBRkQsU0FBZ0IsZUFBZSxDQUFDLFFBQWdCLEVBQUUsT0FBZSxFQUFFLGNBQStCO1FBQ2pHLE9BQU8sR0FBRyxjQUFjLENBQUMsU0FBUyxlQUFlLFFBQVEsSUFBSSxPQUFPLElBQUksY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2pHLENBQUM7SUFjTSxJQUFlLHFCQUFxQixHQUFwQyxNQUFlLHFCQUFxQjtRQVcxQyxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVTLFFBQVEsQ0FBQyxLQUFZO1lBQzlCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsWUFDd0Isb0JBQThELEVBQzlELG9CQUFxRCxFQUNuRCxzQkFBZ0UsRUFDeEUsY0FBeUMsRUFDN0MsVUFBaUMsRUFDN0IsY0FBa0Q7WUFMekIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNwRCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2xDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDOUQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ25DLGVBQVUsR0FBVixVQUFV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