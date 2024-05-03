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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/path", "vs/base/common/platform", "vs/base/parts/ipc/node/ipc.net", "vs/platform/environment/common/environment", "vs/platform/environment/node/environmentService", "vs/platform/instantiation/common/instantiation"], function (require, exports, decorators_1, path_1, platform_1, ipc_net_1, environment_1, environmentService_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnvironmentMainService = exports.IEnvironmentMainService = void 0;
    exports.IEnvironmentMainService = (0, instantiation_1.refineServiceDecorator)(environment_1.IEnvironmentService);
    class EnvironmentMainService extends environmentService_1.NativeEnvironmentService {
        constructor() {
            super(...arguments);
            this._snapEnv = {};
        }
        get cachedLanguagesPath() { return (0, path_1.join)(this.userDataPath, 'clp'); }
        get backupHome() { return (0, path_1.join)(this.userDataPath, 'Backups'); }
        get mainIPCHandle() { return (0, ipc_net_1.createStaticIPCHandle)(this.userDataPath, 'main', this.productService.version); }
        get mainLockfile() { return (0, path_1.join)(this.userDataPath, 'code.lock'); }
        get disableUpdates() { return !!this.args['disable-updates']; }
        get crossOriginIsolated() { return !!this.args['enable-coi']; }
        get codeCachePath() { return process.env['VSCODE_CODE_CACHE_PATH'] || undefined; }
        get useCodeCache() { return !!this.codeCachePath; }
        unsetSnapExportedVariables() {
            if (!platform_1.isLinux) {
                return;
            }
            for (const key in process.env) {
                if (key.endsWith('_VSCODE_SNAP_ORIG')) {
                    const originalKey = key.slice(0, -17); // Remove the _VSCODE_SNAP_ORIG suffix
                    if (this._snapEnv[originalKey]) {
                        continue;
                    }
                    // Preserve the original value in case the snap env is re-entered
                    if (process.env[originalKey]) {
                        this._snapEnv[originalKey] = process.env[originalKey];
                    }
                    // Copy the original value from before entering the snap env if available,
                    // if not delete the env variable.
                    if (process.env[key]) {
                        process.env[originalKey] = process.env[key];
                    }
                    else {
                        delete process.env[originalKey];
                    }
                }
            }
        }
        restoreSnapExportedVariables() {
            if (!platform_1.isLinux) {
                return;
            }
            for (const key in this._snapEnv) {
                process.env[key] = this._snapEnv[key];
                delete this._snapEnv[key];
            }
        }
    }
    exports.EnvironmentMainService = EnvironmentMainService;
    __decorate([
        decorators_1.memoize
    ], EnvironmentMainService.prototype, "cachedLanguagesPath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentMainService.prototype, "backupHome", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentMainService.prototype, "mainIPCHandle", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentMainService.prototype, "mainLockfile", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentMainService.prototype, "disableUpdates", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentMainService.prototype, "crossOriginIsolated", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentMainService.prototype, "codeCachePath", null);
    __decorate([
        decorators_1.memoize
    ], EnvironmentMainService.prototype, "useCodeCache", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZW52aXJvbm1lbnQvZWxlY3Ryb24tbWFpbi9lbnZpcm9ubWVudE1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQVVuRixRQUFBLHVCQUF1QixHQUFHLElBQUEsc0NBQXNCLEVBQStDLGlDQUFtQixDQUFDLENBQUM7SUE2QmpJLE1BQWEsc0JBQXVCLFNBQVEsNkNBQXdCO1FBQXBFOztZQUVTLGFBQVEsR0FBMkIsRUFBRSxDQUFDO1FBNEQvQyxDQUFDO1FBekRBLElBQUksbUJBQW1CLEtBQWEsT0FBTyxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUc1RSxJQUFJLFVBQVUsS0FBYSxPQUFPLElBQUEsV0FBSSxFQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBR3ZFLElBQUksYUFBYSxLQUFhLE9BQU8sSUFBQSwrQkFBcUIsRUFBQyxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUdySCxJQUFJLFlBQVksS0FBYSxPQUFPLElBQUEsV0FBSSxFQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRzNFLElBQUksY0FBYyxLQUFjLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFHeEUsSUFBSSxtQkFBbUIsS0FBYyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUd4RSxJQUFJLGFBQWEsS0FBeUIsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQztRQUd0RyxJQUFJLFlBQVksS0FBYyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUU1RCwwQkFBMEI7WUFDekIsSUFBSSxDQUFDLGtCQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPO1lBQ1IsQ0FBQztZQUNELEtBQUssTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUMvQixJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDO29CQUN2QyxNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsc0NBQXNDO29CQUM3RSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQzt3QkFDaEMsU0FBUztvQkFDVixDQUFDO29CQUNELGlFQUFpRTtvQkFDakUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7d0JBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUUsQ0FBQztvQkFDeEQsQ0FBQztvQkFDRCwwRUFBMEU7b0JBQzFFLGtDQUFrQztvQkFDbEMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3RCLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDN0MsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDakMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCw0QkFBNEI7WUFDM0IsSUFBSSxDQUFDLGtCQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPO1lBQ1IsQ0FBQztZQUNELEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBOURELHdEQThEQztJQXpEQTtRQURDLG9CQUFPO3FFQUNvRTtJQUc1RTtRQURDLG9CQUFPOzREQUMrRDtJQUd2RTtRQURDLG9CQUFPOytEQUM2RztJQUdySDtRQURDLG9CQUFPOzhEQUNtRTtJQUczRTtRQURDLG9CQUFPO2dFQUNnRTtJQUd4RTtRQURDLG9CQUFPO3FFQUNnRTtJQUd4RTtRQURDLG9CQUFPOytEQUM4RjtJQUd0RztRQURDLG9CQUFPOzhEQUNvRCJ9