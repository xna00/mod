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
define(["require", "exports", "child_process", "fs", "vs/base/common/async", "vs/base/common/event", "vs/base/common/path", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/platform/update/common/update"], function (require, exports, child_process_1, fs_1, async_1, event_1, path, environmentMainService_1, lifecycleMainService_1, log_1, telemetry_1, update_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnapUpdateService = void 0;
    let AbstractUpdateService = class AbstractUpdateService {
        get state() {
            return this._state;
        }
        setState(state) {
            this.logService.info('update#setState', state.type);
            this._state = state;
            this._onStateChange.fire(state);
        }
        constructor(lifecycleMainService, environmentMainService, logService) {
            this.lifecycleMainService = lifecycleMainService;
            this.logService = logService;
            this._state = update_1.State.Uninitialized;
            this._onStateChange = new event_1.Emitter();
            this.onStateChange = this._onStateChange.event;
            if (environmentMainService.disableUpdates) {
                this.logService.info('update#ctor - updates are disabled');
                return;
            }
            this.setState(update_1.State.Idle(this.getUpdateType()));
            // Start checking for updates after 30 seconds
            this.scheduleCheckForUpdates(30 * 1000).then(undefined, err => this.logService.error(err));
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
        doDownloadUpdate(state) {
            return Promise.resolve(undefined);
        }
        async applyUpdate() {
            this.logService.trace('update#applyUpdate, state = ', this.state.type);
            if (this.state.type !== "downloaded" /* StateType.Downloaded */) {
                return;
            }
            await this.doApplyUpdate();
        }
        doApplyUpdate() {
            return Promise.resolve(undefined);
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
        getUpdateType() {
            return 2 /* UpdateType.Snap */;
        }
        doQuitAndInstall() {
            // noop
        }
        async _applySpecificUpdate(packagePath) {
            // noop
        }
    };
    AbstractUpdateService = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, environmentMainService_1.IEnvironmentMainService),
        __param(2, log_1.ILogService)
    ], AbstractUpdateService);
    let SnapUpdateService = class SnapUpdateService extends AbstractUpdateService {
        constructor(snap, snapRevision, lifecycleMainService, environmentMainService, logService, telemetryService) {
            super(lifecycleMainService, environmentMainService, logService);
            this.snap = snap;
            this.snapRevision = snapRevision;
            this.telemetryService = telemetryService;
            const watcher = (0, fs_1.watch)(path.dirname(this.snap));
            const onChange = event_1.Event.fromNodeEventEmitter(watcher, 'change', (_, fileName) => fileName);
            const onCurrentChange = event_1.Event.filter(onChange, n => n === 'current');
            const onDebouncedCurrentChange = event_1.Event.debounce(onCurrentChange, (_, e) => e, 2000);
            const listener = onDebouncedCurrentChange(() => this.checkForUpdates(false));
            lifecycleMainService.onWillShutdown(() => {
                listener.dispose();
                watcher.close();
            });
        }
        doCheckForUpdates() {
            this.setState(update_1.State.CheckingForUpdates(false));
            this.isUpdateAvailable().then(result => {
                if (result) {
                    this.setState(update_1.State.Ready({ version: 'something' }));
                }
                else {
                    this.telemetryService.publicLog2('update:notAvailable', { explicit: false });
                    this.setState(update_1.State.Idle(2 /* UpdateType.Snap */));
                }
            }, err => {
                this.logService.error(err);
                this.telemetryService.publicLog2('update:notAvailable', { explicit: false });
                this.setState(update_1.State.Idle(2 /* UpdateType.Snap */, err.message || err));
            });
        }
        doQuitAndInstall() {
            this.logService.trace('update#quitAndInstall(): running raw#quitAndInstall()');
            // Allow 3 seconds for VS Code to close
            (0, child_process_1.spawn)('sleep 3 && ' + path.basename(process.argv[0]), {
                shell: true,
                detached: true,
                stdio: 'ignore',
            });
        }
        async isUpdateAvailable() {
            const resolvedCurrentSnapPath = await new Promise((c, e) => (0, fs_1.realpath)(`${path.dirname(this.snap)}/current`, (err, r) => err ? e(err) : c(r)));
            const currentRevision = path.basename(resolvedCurrentSnapPath);
            return this.snapRevision !== currentRevision;
        }
        isLatestVersion() {
            return this.isUpdateAvailable().then(undefined, err => {
                this.logService.error('update#checkForSnapUpdate(): Could not get realpath of application.');
                return undefined;
            });
        }
    };
    exports.SnapUpdateService = SnapUpdateService;
    exports.SnapUpdateService = SnapUpdateService = __decorate([
        __param(2, lifecycleMainService_1.ILifecycleMainService),
        __param(3, environmentMainService_1.IEnvironmentMainService),
        __param(4, log_1.ILogService),
        __param(5, telemetry_1.ITelemetryService)
    ], SnapUpdateService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlU2VydmljZS5zbmFwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91cGRhdGUvZWxlY3Ryb24tbWFpbi91cGRhdGVTZXJ2aWNlLnNuYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY2hHLElBQWUscUJBQXFCLEdBQXBDLE1BQWUscUJBQXFCO1FBU25DLElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRVMsUUFBUSxDQUFDLEtBQVk7WUFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxZQUN3QixvQkFBNEQsRUFDMUQsc0JBQStDLEVBQzNELFVBQWlDO1lBRk4seUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUU1RCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBbEJ2QyxXQUFNLEdBQVUsY0FBSyxDQUFDLGFBQWEsQ0FBQztZQUUzQixtQkFBYyxHQUFHLElBQUksZUFBTyxFQUFTLENBQUM7WUFDOUMsa0JBQWEsR0FBaUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7WUFpQmhFLElBQUksc0JBQXNCLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLENBQUM7Z0JBQzNELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFD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