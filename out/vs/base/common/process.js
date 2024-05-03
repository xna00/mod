/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.arch = exports.platform = exports.env = exports.cwd = void 0;
    let safeProcess;
    // Native sandbox environment
    const vscodeGlobal = globalThis.vscode;
    if (typeof vscodeGlobal !== 'undefined' && typeof vscodeGlobal.process !== 'undefined') {
        const sandboxProcess = vscodeGlobal.process;
        safeProcess = {
            get platform() { return sandboxProcess.platform; },
            get arch() { return sandboxProcess.arch; },
            get env() { return sandboxProcess.env; },
            cwd() { return sandboxProcess.cwd(); }
        };
    }
    // Native node.js environment
    else if (typeof process !== 'undefined') {
        safeProcess = {
            get platform() { return process.platform; },
            get arch() { return process.arch; },
            get env() { return process.env; },
            cwd() { return process.env['VSCODE_CWD'] || process.cwd(); }
        };
    }
    // Web environment
    else {
        safeProcess = {
            // Supported
            get platform() { return platform_1.isWindows ? 'win32' : platform_1.isMacintosh ? 'darwin' : 'linux'; },
            get arch() { return undefined; /* arch is undefined in web */ },
            // Unsupported
            get env() { return {}; },
            cwd() { return '/'; }
        };
    }
    /**
     * Provides safe access to the `cwd` property in node.js, sandboxed or web
     * environments.
     *
     * Note: in web, this property is hardcoded to be `/`.
     *
     * @skipMangle
     */
    exports.cwd = safeProcess.cwd;
    /**
     * Provides safe access to the `env` property in node.js, sandboxed or web
     * environments.
     *
     * Note: in web, this property is hardcoded to be `{}`.
     */
    exports.env = safeProcess.env;
    /**
     * Provides safe access to the `platform` property in node.js, sandboxed or web
     * environments.
     */
    exports.platform = safeProcess.platform;
    /**
     * Provides safe access to the `arch` method in node.js, sandboxed or web
     * environments.
     * Note: `arch` is `undefined` in web
     */
    exports.arch = safeProcess.arch;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vcHJvY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsSUFBSSxXQUFzRSxDQUFDO0lBRzNFLDZCQUE2QjtJQUM3QixNQUFNLFlBQVksR0FBSSxVQUFrQixDQUFDLE1BQU0sQ0FBQztJQUNoRCxJQUFJLE9BQU8sWUFBWSxLQUFLLFdBQVcsSUFBSSxPQUFPLFlBQVksQ0FBQyxPQUFPLEtBQUssV0FBVyxFQUFFLENBQUM7UUFDeEYsTUFBTSxjQUFjLEdBQWlCLFlBQVksQ0FBQyxPQUFPLENBQUM7UUFDMUQsV0FBVyxHQUFHO1lBQ2IsSUFBSSxRQUFRLEtBQUssT0FBTyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNsRCxJQUFJLElBQUksS0FBSyxPQUFPLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzFDLElBQUksR0FBRyxLQUFLLE9BQU8sY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDeEMsR0FBRyxLQUFLLE9BQU8sY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN0QyxDQUFDO0lBQ0gsQ0FBQztJQUVELDZCQUE2QjtTQUN4QixJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRSxDQUFDO1FBQ3pDLFdBQVcsR0FBRztZQUNiLElBQUksUUFBUSxLQUFLLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDM0MsSUFBSSxJQUFJLEtBQUssT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNuQyxJQUFJLEdBQUcsS0FBSyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsS0FBSyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUM1RCxDQUFDO0lBQ0gsQ0FBQztJQUVELGtCQUFrQjtTQUNiLENBQUM7UUFDTCxXQUFXLEdBQUc7WUFFYixZQUFZO1lBQ1osSUFBSSxRQUFRLEtBQUssT0FBTyxvQkFBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHNCQUFXLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNqRixJQUFJLElBQUksS0FBSyxPQUFPLFNBQVMsQ0FBQyxDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFFL0QsY0FBYztZQUNkLElBQUksR0FBRyxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixHQUFHLEtBQUssT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3JCLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNVLFFBQUEsR0FBRyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUM7SUFFbkM7Ozs7O09BS0c7SUFDVSxRQUFBLEdBQUcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDO0lBRW5DOzs7T0FHRztJQUNVLFFBQUEsUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUM7SUFFN0M7Ozs7T0FJRztJQUNVLFFBQUEsSUFBSSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMifQ==