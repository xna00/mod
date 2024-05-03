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
define(["require", "exports", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/platform/terminal/common/terminal", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminalInstance", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/base/common/event", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/registry/common/platform", "vs/workbench/services/environment/common/environmentService", "vs/base/common/async"], function (require, exports, terminal_1, extensions_1, lifecycle_1, terminal_2, instantiation_1, terminalInstance_1, contextkey_1, terminalConfigHelper_1, event_1, terminalContextKey_1, platform_1, environmentService_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalInstanceService = void 0;
    let TerminalInstanceService = class TerminalInstanceService extends lifecycle_1.Disposable {
        get onDidCreateInstance() { return this._onDidCreateInstance.event; }
        constructor(_instantiationService, _contextKeyService, _environmentService) {
            super();
            this._instantiationService = _instantiationService;
            this._contextKeyService = _contextKeyService;
            this._environmentService = _environmentService;
            this._backendRegistration = new Map();
            this._onDidCreateInstance = this._register(new event_1.Emitter());
            this._terminalShellTypeContextKey = terminalContextKey_1.TerminalContextKeys.shellType.bindTo(this._contextKeyService);
            this._terminalInRunCommandPicker = terminalContextKey_1.TerminalContextKeys.inTerminalRunCommandPicker.bindTo(this._contextKeyService);
            this._configHelper = _instantiationService.createInstance(terminalConfigHelper_1.TerminalConfigHelper);
            for (const remoteAuthority of [undefined, _environmentService.remoteAuthority]) {
                const { promise, resolve } = (0, async_1.promiseWithResolvers)();
                this._backendRegistration.set(remoteAuthority, { promise, resolve });
            }
        }
        createInstance(config, target) {
            const shellLaunchConfig = this.convertProfileToShellLaunchConfig(config);
            const instance = this._instantiationService.createInstance(terminalInstance_1.TerminalInstance, this._terminalShellTypeContextKey, this._terminalInRunCommandPicker, this._configHelper, shellLaunchConfig);
            instance.target = target;
            this._onDidCreateInstance.fire(instance);
            return instance;
        }
        convertProfileToShellLaunchConfig(shellLaunchConfigOrProfile, cwd) {
            // Profile was provided
            if (shellLaunchConfigOrProfile && 'profileName' in shellLaunchConfigOrProfile) {
                const profile = shellLaunchConfigOrProfile;
                if (!profile.path) {
                    return shellLaunchConfigOrProfile;
                }
                return {
                    executable: profile.path,
                    args: profile.args,
                    env: profile.env,
                    icon: profile.icon,
                    color: profile.color,
                    name: profile.overrideName ? profile.profileName : undefined,
                    cwd
                };
            }
            // A shell launch config was provided
            if (shellLaunchConfigOrProfile) {
                if (cwd) {
                    shellLaunchConfigOrProfile.cwd = cwd;
                }
                return shellLaunchConfigOrProfile;
            }
            // Return empty shell launch config
            return {};
        }
        async getBackend(remoteAuthority) {
            let backend = platform_1.Registry.as(terminal_2.TerminalExtensions.Backend).getTerminalBackend(remoteAuthority);
            if (!backend) {
                // Ensure backend is initialized and try again
                await this._backendRegistration.get(remoteAuthority)?.promise;
                backend = platform_1.Registry.as(terminal_2.TerminalExtensions.Backend).getTerminalBackend(remoteAuthority);
            }
            return backend;
        }
        getRegisteredBackends() {
            return platform_1.Registry.as(terminal_2.TerminalExtensions.Backend).backends.values();
        }
        didRegisterBackend(remoteAuthority) {
            this._backendRegistration.get(remoteAuthority)?.resolve();
        }
    };
    exports.TerminalInstanceService = TerminalInstanceService;
    exports.TerminalInstanceService = TerminalInstanceService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], TerminalInstanceService);
    (0, extensions_1.registerSingleton)(terminal_1.ITerminalInstanceService, TerminalInstanceService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxJbnN0YW5jZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxJbnN0YW5jZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJ6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVO1FBUXRELElBQUksbUJBQW1CLEtBQStCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFL0YsWUFDd0IscUJBQTZELEVBQ2hFLGtCQUF1RCxFQUM3QyxtQkFBMEQ7WUFFeEYsS0FBSyxFQUFFLENBQUM7WUFKZ0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3BDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBOEI7WUFSakYseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQXVFLENBQUM7WUFFN0YseUJBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBcUIsQ0FBQyxDQUFDO1lBU3hGLElBQUksQ0FBQyw0QkFBNEIsR0FBRyx3Q0FBbUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2xHLElBQUksQ0FBQywyQkFBMkIsR0FBRyx3Q0FBbUIsQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDbEgsSUFBSSxDQUFDLGFBQWEsR0FBRyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsMkNBQW9CLENBQUMsQ0FBQztZQUVoRixLQUFLLE1BQU0sZUFBZSxJQUFJ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