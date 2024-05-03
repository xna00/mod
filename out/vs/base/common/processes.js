/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminateResponseCode = exports.Source = void 0;
    exports.sanitizeProcessEnvironment = sanitizeProcessEnvironment;
    exports.removeDangerousEnvVariables = removeDangerousEnvVariables;
    var Source;
    (function (Source) {
        Source[Source["stdout"] = 0] = "stdout";
        Source[Source["stderr"] = 1] = "stderr";
    })(Source || (exports.Source = Source = {}));
    var TerminateResponseCode;
    (function (TerminateResponseCode) {
        TerminateResponseCode[TerminateResponseCode["Success"] = 0] = "Success";
        TerminateResponseCode[TerminateResponseCode["Unknown"] = 1] = "Unknown";
        TerminateResponseCode[TerminateResponseCode["AccessDenied"] = 2] = "AccessDenied";
        TerminateResponseCode[TerminateResponseCode["ProcessNotFound"] = 3] = "ProcessNotFound";
    })(TerminateResponseCode || (exports.TerminateResponseCode = TerminateResponseCode = {}));
    /**
     * Sanitizes a VS Code process environment by removing all Electron/VS Code-related values.
     */
    function sanitizeProcessEnvironment(env, ...preserve) {
        const set = preserve.reduce((set, key) => {
            set[key] = true;
            return set;
        }, {});
        const keysToRemove = [
            /^ELECTRON_.+$/,
            /^VSCODE_(?!(PORTABLE|SHELL_LOGIN|ENV_REPLACE|ENV_APPEND|ENV_PREPEND)).+$/,
            /^SNAP(|_.*)$/,
            /^GDK_PIXBUF_.+$/,
        ];
        const envKeys = Object.keys(env);
        envKeys
            .filter(key => !set[key])
            .forEach(envKey => {
            for (let i = 0; i < keysToRemove.length; i++) {
                if (envKey.search(keysToRemove[i]) !== -1) {
                    delete env[envKey];
                    break;
                }
            }
        });
    }
    /**
     * Remove dangerous environment variables that have caused crashes
     * in forked processes (i.e. in ELECTRON_RUN_AS_NODE processes)
     *
     * @param env The env object to change
     */
    function removeDangerousEnvVariables(env) {
        if (!env) {
            return;
        }
        // Unset `DEBUG`, as an invalid value might lead to process crashes
        // See https://github.com/microsoft/vscode/issues/130072
        delete env['DEBUG'];
        if (platform_1.isMacintosh) {
            // Unset `DYLD_LIBRARY_PATH`, as it leads to process crashes
            // See https://github.com/microsoft/vscode/issues/104525
            // See https://github.com/microsoft/vscode/issues/105848
            delete env['DYLD_LIBRARY_PATH'];
        }
        if (platform_1.isLinux) {
            // Unset `LD_PRELOAD`, as it might lead to process crashes
            // See https://github.com/microsoft/vscode/issues/134177
            delete env['LD_PRELOAD'];
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzc2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9wcm9jZXNzZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0doRyxnRUFzQkM7SUFRRCxrRUFxQkM7SUF0R0QsSUFBa0IsTUFHakI7SUFIRCxXQUFrQixNQUFNO1FBQ3ZCLHVDQUFNLENBQUE7UUFDTix1Q0FBTSxDQUFBO0lBQ1AsQ0FBQyxFQUhpQixNQUFNLHNCQUFOLE1BQU0sUUFHdkI7SUEyQkQsSUFBa0IscUJBS2pCO0lBTEQsV0FBa0IscUJBQXFCO1FBQ3RDLHVFQUFXLENBQUE7UUFDWCx1RUFBVyxDQUFBO1FBQ1gsaUZBQWdCLENBQUE7UUFDaEIsdUZBQW1CLENBQUE7SUFDcEIsQ0FBQyxFQUxpQixxQkFBcUIscUNBQXJCLHFCQUFxQixRQUt0QztJQWFEOztPQUVHO0lBQ0gsU0FBZ0IsMEJBQTBCLENBQUMsR0FBd0IsRUFBRSxHQUFHLFFBQWtCO1FBQ3pGLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDeEMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNoQixPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUMsRUFBRSxFQUE2QixDQUFDLENBQUM7UUFDbEMsTUFBTSxZQUFZLEdBQUc7WUFDcEIsZUFBZTtZQUNmLDBFQUEwRTtZQUMxRSxjQUFjO1lBQ2QsaUJBQWlCO1NBQ2pCLENBQUM7UUFDRixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLE9BQU87YUFDTCxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN4QixPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDakIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzNDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNuQixNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxTQUFnQiwyQkFBMkIsQ0FBQyxHQUFvQztRQUMvRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDVixPQUFPO1FBQ1IsQ0FBQztRQUVELG1FQUFtRTtRQUNuRSx3REFBd0Q7UUFDeEQsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFcEIsSUFBSSxzQkFBVyxFQUFFLENBQUM7WUFDakIsNERBQTREO1lBQzVELHdEQUF3RDtZQUN4RCx3REFBd0Q7WUFDeEQsT0FBTyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsSUFBSSxrQkFBTyxFQUFFLENBQUM7WUFDYiwwREFBMEQ7WUFDMUQsd0RBQXdEO1lBQ3hELE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzFCLENBQUM7SUFDRixDQUFDIn0=