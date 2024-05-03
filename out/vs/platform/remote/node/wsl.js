/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "child_process", "vs/base/node/pfs", "path"], function (require, exports, os, cp, pfs_1, path) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasWSLFeatureInstalled = hasWSLFeatureInstalled;
    let hasWSLFeaturePromise;
    async function hasWSLFeatureInstalled(refresh = false) {
        if (hasWSLFeaturePromise === undefined || refresh) {
            hasWSLFeaturePromise = testWSLFeatureInstalled();
        }
        return hasWSLFeaturePromise;
    }
    async function testWSLFeatureInstalled() {
        const windowsBuildNumber = getWindowsBuildNumber();
        if (windowsBuildNumber === undefined) {
            return false;
        }
        if (windowsBuildNumber >= 22000) {
            const wslExePath = getWSLExecutablePath();
            if (wslExePath) {
                return new Promise(s => {
                    cp.execFile(wslExePath, ['--status'], err => s(!err));
                });
            }
        }
        else {
            const dllPath = getLxssManagerDllPath();
            if (dllPath) {
                try {
                    if ((await pfs_1.Promises.stat(dllPath)).isFile()) {
                        return true;
                    }
                }
                catch (e) {
                }
            }
        }
        return false;
    }
    function getWindowsBuildNumber() {
        const osVersion = (/(\d+)\.(\d+)\.(\d+)/g).exec(os.release());
        if (osVersion) {
            return parseInt(osVersion[3]);
        }
        return undefined;
    }
    function getSystem32Path(subPath) {
        const systemRoot = process.env['SystemRoot'];
        if (systemRoot) {
            const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
            return path.join(systemRoot, is32ProcessOn64Windows ? 'Sysnative' : 'System32', subPath);
        }
        return undefined;
    }
    function getWSLExecutablePath() {
        return getSystem32Path('wsl.exe');
    }
    /**
     * In builds < 22000 this dll inidcates that WSL is installed
     */
    function getLxssManagerDllPath() {
        return getSystem32Path('lxss\\LxssManager.dll');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3NsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZW1vdGUvbm9kZS93c2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsd0RBS0M7SUFQRCxJQUFJLG9CQUFrRCxDQUFDO0lBRWhELEtBQUssVUFBVSxzQkFBc0IsQ0FBQyxPQUFPLEdBQUcsS0FBSztRQUMzRCxJQUFJLG9CQUFvQixLQUFLLFNBQVMsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNuRCxvQkFBb0IsR0FBRyx1QkFBdUIsRUFBRSxDQUFDO1FBQ2xELENBQUM7UUFDRCxPQUFPLG9CQUFvQixDQUFDO0lBQzdCLENBQUM7SUFFRCxLQUFLLFVBQVUsdUJBQXVCO1FBQ3JDLE1BQU0sa0JBQWtCLEdBQUcscUJBQXFCLEVBQUUsQ0FBQztRQUNuRCxJQUFJLGtCQUFrQixLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3RDLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNELElBQUksa0JBQWtCLElBQUksS0FBSyxFQUFFLENBQUM7WUFDakMsTUFBTSxVQUFVLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztZQUMxQyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixPQUFPLElBQUksT0FBTyxDQUFVLENBQUMsQ0FBQyxFQUFFO29CQUMvQixFQUFFLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDdkQsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQzthQUFNLENBQUM7WUFDUCxNQUFNLE9BQU8sR0FBRyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3hDLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxDQUFDO29CQUNKLElBQUksQ0FBQyxNQUFNLGNBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO3dCQUM3QyxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO2dCQUNGLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFTLHFCQUFxQjtRQUM3QixNQUFNLFNBQVMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzlELElBQUksU0FBUyxFQUFFLENBQUM7WUFDZixPQUFPLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFDLE9BQWU7UUFDdkMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM3QyxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sc0JBQXNCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUNwRixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxRixDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVELFNBQVMsb0JBQW9CO1FBQzVCLE9BQU8sZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVMscUJBQXFCO1FBQzdCLE9BQU8sZUFBZSxDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFDakQsQ0FBQyJ9