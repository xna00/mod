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
define(["require", "exports", "child_process", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, child_process_1, async_1, errorMessage_1, event_1, lifecycle_1, network_1, path_1, pfs_1, log_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsLifecycle = void 0;
    let ExtensionsLifecycle = class ExtensionsLifecycle extends lifecycle_1.Disposable {
        constructor(userDataProfilesService, logService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            this.logService = logService;
            this.processesLimiter = new async_1.Limiter(5); // Run max 5 processes in parallel
        }
        async postUninstall(extension) {
            const script = this.parseScript(extension, 'uninstall');
            if (script) {
                this.logService.info(extension.identifier.id, extension.manifest.version, `Running post uninstall script`);
                await this.processesLimiter.queue(async () => {
                    try {
                        await this.runLifecycleHook(script.script, 'uninstall', script.args, true, extension);
                        this.logService.info(`Finished running post uninstall script`, extension.identifier.id, extension.manifest.version);
                    }
                    catch (error) {
                        this.logService.error('Failed to run post uninstall script', extension.identifier.id, extension.manifest.version);
                        this.logService.error(error);
                    }
                });
            }
            try {
                await pfs_1.Promises.rm(this.getExtensionStoragePath(extension));
            }
            catch (error) {
                this.logService.error('Error while removing extension storage path', extension.identifier.id);
                this.logService.error(error);
            }
        }
        parseScript(extension, type) {
            const scriptKey = `vscode:${type}`;
            if (extension.location.scheme === network_1.Schemas.file && extension.manifest && extension.manifest['scripts'] && typeof extension.manifest['scripts'][scriptKey] === 'string') {
                const script = extension.manifest['scripts'][scriptKey].split(' ');
                if (script.length < 2 || script[0] !== 'node' || !script[1]) {
                    this.logService.warn(extension.identifier.id, extension.manifest.version, `${scriptKey} should be a node script`);
                    return null;
                }
                return { script: (0, path_1.join)(extension.location.fsPath, script[1]), args: script.slice(2) || [] };
            }
            return null;
        }
        runLifecycleHook(lifecycleHook, lifecycleType, args, timeout, extension) {
            return new Promise((c, e) => {
                const extensionLifecycleProcess = this.start(lifecycleHook, lifecycleType, args, extension);
                let timeoutHandler;
                const onexit = (error) => {
                    if (timeoutHandler) {
                        clearTimeout(timeoutHandler);
                        timeoutHandler = null;
                    }
                    if (error) {
                        e(error);
                    }
                    else {
                        c(undefined);
                    }
                };
                // on error
                extensionLifecycleProcess.on('error', (err) => {
                    onexit((0, errorMessage_1.toErrorMessage)(err) || 'Unknown');
                });
                // on exit
                extensionLifecycleProcess.on('exit', (code, signal) => {
                    onexit(code ? `post-${lifecycleType} process exited with code ${code}` : undefined);
                });
                if (timeout) {
                    // timeout: kill process after waiting for 5s
                    timeoutHandler = setTimeout(() => {
                        timeoutHandler = null;
                        extensionLifecycleProcess.kill();
                        e('timed out');
                    }, 5000);
                }
            });
        }
        start(uninstallHook, lifecycleType, args, extension) {
            const opts = {
                silent: true,
                execArgv: undefined
            };
            const extensionUninstallProcess = (0, child_process_1.fork)(uninstallHook, [`--type=extension-post-${lifecycleType}`, ...args], opts);
            extensionUninstallProcess.stdout.setEncoding('utf8');
            extensionUninstallProcess.stderr.setEncoding('utf8');
            const onStdout = event_1.Event.fromNodeEventEmitter(extensionUninstallProcess.stdout, 'data');
            const onStderr = event_1.Event.fromNodeEventEmitter(extensionUninstallProcess.stderr, 'data');
            // Log output
            onStdout(data => this.logService.info(extension.identifier.id, extension.manifest.version, `post-${lifecycleType}`, data));
            onStderr(data => this.logService.error(extension.identifier.id, extension.manifest.version, `post-${lifecycleType}`, data));
            const onOutput = event_1.Event.any(event_1.Event.map(onStdout, o => ({ data: `%c${o}`, format: [''] })), event_1.Event.map(onStderr, o => ({ data: `%c${o}`, format: ['color: red'] })));
            // Debounce all output, so we can render it in the Chrome console as a group
            const onDebouncedOutput = event_1.Event.debounce(onOutput, (r, o) => {
                return r
                    ? { data: r.data + o.data, format: [...r.format, ...o.format] }
                    : { data: o.data, format: o.format };
            }, 100);
            // Print out output
            onDebouncedOutput(data => {
                console.group(extension.identifier.id);
                console.log(data.data, ...data.format);
                console.groupEnd();
            });
            return extensionUninstallProcess;
        }
        getExtensionStoragePath(extension) {
            return (0, path_1.join)(this.userDataProfilesService.defaultProfile.globalStorageHome.fsPath, extension.identifier.id.toLowerCase());
        }
    };
    exports.ExtensionsLifecycle = ExtensionsLifecycle;
    exports.ExtensionsLifecycle = ExtensionsLifecycle = __decorate([
        __param(0, userDataProfile_1.IUserDataProfilesService),
        __param(1, log_1.ILogService)
    ], ExtensionsLifecycle);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTGlmZWN5Y2xlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25NYW5hZ2VtZW50L25vZGUvZXh0ZW5zaW9uTGlmZWN5Y2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBSWxELFlBQzJCLHVCQUF5RCxFQUN0RSxVQUF3QztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQUgwQiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ3JELGVBQVUsR0FBVixVQUFVLENBQWE7WUFKOUMscUJBQWdCLEdBQWtCLElBQUksZUFBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsa0NBQWtDO1FBTzVGLENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLFNBQTBCO1lBQzdDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3hELElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsK0JBQStCLENBQUMsQ0FBQztnQkFDM0csTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO29CQUM1QyxJQUFJLENBQUM7d0JBQ0osTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ3RGLElBQUks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