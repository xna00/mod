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
define(["require", "exports", "electron", "vs/base/common/arrays", "vs/base/common/platform", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/configuration/common/configuration", "vs/platform/environment/node/argvHelper", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/url/common/url", "vs/platform/windows/electron-main/windows"], function (require, exports, electron_1, arrays_1, platform_1, uri_1, pfs_1, configuration_1, argvHelper_1, instantiation_1, log_1, url_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LaunchMainService = exports.ILaunchMainService = exports.ID = void 0;
    exports.ID = 'launchMainService';
    exports.ILaunchMainService = (0, instantiation_1.createDecorator)(exports.ID);
    let LaunchMainService = class LaunchMainService {
        constructor(logService, windowsMainService, urlService, configurationService) {
            this.logService = logService;
            this.windowsMainService = windowsMainService;
            this.urlService = urlService;
            this.configurationService = configurationService;
        }
        async start(args, userEnv) {
            this.logService.trace('Received data from other instance: ', args, userEnv);
            // macOS: Electron > 7.x changed its behaviour to not
            // bring the application to the foreground when a window
            // is focused programmatically. Only via `app.focus` and
            // the option `steal: true` can you get the previous
            // behaviour back. The only reason to use this option is
            // when a window is getting focused while the application
            // is not in the foreground and since we got instructed
            // to open a new window from another instance, we ensure
            // that the app has focus.
            if (platform_1.isMacintosh) {
                electron_1.app.focus({ steal: true });
            }
            // Check early for open-url which is handled in URL service
            const urlsToOpen = this.parseOpenUrl(args);
            if (urlsToOpen.length) {
                let whenWindowReady = Promise.resolve();
                // Create a window if there is none
                if (this.windowsMainService.getWindowCount() === 0) {
                    const window = (0, arrays_1.firstOrDefault)(await this.windowsMainService.openEmptyWindow({ context: 4 /* OpenContext.DESKTOP */ }));
                    if (window) {
                        whenWindowReady = window.ready();
                    }
                }
                // Make sure a window is open, ready to receive the url event
                whenWindowReady.then(() => {
                    for (const { uri, originalUrl } of urlsToOpen) {
                        this.urlService.open(uri, { originalUrl });
                    }
                });
            }
            // Otherwise handle in windows service
            else {
                return this.startOpenWindow(args, userEnv);
            }
        }
        parseOpenUrl(args) {
            if (args['open-url'] && args._urls && args._urls.length > 0) {
                // --open-url must contain -- followed by the url(s)
                // process.argv is used over args._ as args._ are resolved to file paths at this point
                return (0, arrays_1.coalesce)(args._urls
                    .map(url => {
                    try {
                        return { uri: uri_1.URI.parse(url), originalUrl: url };
                    }
                    catch (err) {
                        return null;
                    }
                }));
            }
            return [];
        }
        async startOpenWindow(args, userEnv) {
            const context = (0, argvHelper_1.isLaunchedFromCli)(userEnv) ? 0 /* OpenContext.CLI */ : 4 /* OpenContext.DESKTOP */;
            let usedWindows = [];
            const waitMarkerFileURI = args.wait && args.waitMarkerFilePath ? uri_1.URI.file(args.waitMarkerFilePath) : undefined;
            const remoteAuthority = args.remote || undefined;
            const baseConfig = {
                context,
                cli: args,
                /**
                 * When opening a new window from a second instance that sent args and env
                 * over to this instance, we want to preserve the environment only if that second
                 * instance was spawned from the CLI or used the `--preserve-env` flag (example:
                 * when using `open -n "VSCode.app" --args --preserve-env WORKSPACE_FOLDER`).
                 *
                 * This is done to ensure that the second window gets treated exactly the same
                 * as the first window, for example, it gets the same resolved user shell environment.
                 *
                 * https://github.com/microsoft/vscode/issues/194736
                 */
                userEnv: (args['preserve-env'] || context === 0 /* OpenContext.CLI */) ? userEnv : undefined,
                waitMarkerFileURI,
                remoteAuthority,
                forceProfile: args.profile,
                forceTempProfile: args['profile-temp']
            };
            // Special case extension development
            if (!!args.extensionDevelopmentPath) {
                await this.windowsMainService.openExtensionDevelopmentHostWindow(args.extensionDevelopmentPath, baseConfig);
            }
            // Start without file/folder arguments
            else if (!args._.length && !args['folder-uri'] && !args['file-uri']) {
                let openNewWindow = false;
                // Force new window
                if (args['new-window'] || args['unity-launch'] || baseConfig.forceProfile || baseConfig.forceTempProfile) {
                    openNewWindow = true;
                }
                // Force reuse window
                else if (args['reuse-window']) {
                    openNewWindow = false;
                }
                // Otherwise check for settings
                else {
                    const windowConfig = this.configurationService.getValue('window');
                    const openWithoutArgumentsInNewWindowConfig = windowConfig?.openWithoutArgumentsInNewWindow || 'default' /* default */;
                    switch (openWithoutArgumentsInNewWindowConfig) {
                        case 'on':
                            openNewWindow = true;
                            break;
                        case 'off':
                            openNewWindow = false;
                            break;
                        default:
                            openNewWindow = !platform_1.isMacintosh; // prefer to restore running instance on macOS
                    }
                }
                // Open new Window
                if (openNewWindow) {
                    usedWindows = await this.windowsMainService.open({
                        ...baseConfig,
                        forceNewWindow: true,
                        forceEmpty: true
                    });
                }
                // Focus existing window or open if none opened
                else {
                    const lastActive = this.windowsMainService.getLastActiveWindow();
                    if (lastActive) {
                        this.windowsMainService.openExistingWindow(lastActive, baseConfig);
                        usedWindows = [lastActive];
                    }
                    else {
                        usedWindows = await this.windowsMainService.open({
                            ...baseConfig,
                            forceEmpty: true
                        });
                    }
                }
            }
            // Start with file/folder arguments
            else {
                usedWindows = await this.windowsMainService.open({
                    ...baseConfig,
                    forceNewWindow: args['new-window'],
                    preferNewWindow: !args['reuse-window'] && !args.wait,
                    forceReuseWindow: args['reuse-window'],
                    diffMode: args.diff,
                    mergeMode: args.merge,
                    addMode: args.add,
                    noRecentEntry: !!args['skip-add-to-recently-opened'],
                    gotoLineMode: args.goto
                });
            }
            // If the other instance is waiting to be killed, we hook up a window listener if one window
            // is being used and only then resolve the startup promise which will kill this second instance.
            // In addition, we poll for the wait marker file to be deleted to return.
            if (waitMarkerFileURI && usedWindows.length === 1 && usedWindows[0]) {
                return Promise.race([
                    usedWindows[0].whenClosedOrLoaded,
                    (0, pfs_1.whenDeleted)(waitMarkerFileURI.fsPath)
                ]).then(() => undefined, () => undefined);
            }
        }
        async getMainProcessId() {
            this.logService.trace('Received request for process ID from other instance.');
            return process.pid;
        }
    };
    exports.LaunchMainService = LaunchMainService;
    exports.LaunchMainService = LaunchMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, url_1.IURLService),
        __param(3, configuration_1.IConfigurationService)
    ], LaunchMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF1bmNoTWFpblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2xhdW5jaC9lbGVjdHJvbi1tYWluL2xhdW5jaE1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCbkYsUUFBQSxFQUFFLEdBQUcsbUJBQW1CLENBQUM7SUFDekIsUUFBQSxrQkFBa0IsR0FBRyxJQUFBLCtCQUFlLEVBQXFCLFVBQUUsQ0FBQyxDQUFDO0lBZ0JuRSxJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFpQjtRQUk3QixZQUMrQixVQUF1QixFQUNmLGtCQUF1QyxFQUMvQyxVQUF1QixFQUNiLG9CQUEyQztZQUhyRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2YsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMvQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2IseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtRQUNoRixDQUFDO1FBRUwsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFzQixFQUFFLE9BQTRCO1lBQy9ELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU1RSxxREFBcUQ7WUFDckQsd0RBQXdEO1lBQ3hELHdEQUF3RDtZQUN4RCxvREFBb0Q7WUFDcEQsd0RBQXdEO1lBQ3hELHlEQUF5RDtZQUN6RCx1REFBdUQ7WUFDdkQsd0RBQXdEO1lBQ3hELDBCQUEwQjtZQUMxQixJQUFJLHNCQUFXLEVBQUUsQ0FBQztnQkFDakIsY0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFFRCwyREFBMkQ7WUFDM0QsTUFBTSxVQUFVLEdB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