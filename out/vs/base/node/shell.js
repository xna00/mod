/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/platform", "vs/base/node/powershell", "vs/base/node/processes"], function (require, exports, os_1, platform, powershell_1, processes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSystemShell = getSystemShell;
    /**
     * Gets the detected default shell for the _system_, not to be confused with VS Code's _default_
     * shell that the terminal uses by default.
     * @param os The platform to detect the shell of.
     */
    async function getSystemShell(os, env) {
        if (os === 1 /* platform.OperatingSystem.Windows */) {
            if (platform.isWindows) {
                return getSystemShellWindows();
            }
            // Don't detect Windows shell when not on Windows
            return processes.getWindowsShell(env);
        }
        return getSystemShellUnixLike(os, env);
    }
    let _TERMINAL_DEFAULT_SHELL_UNIX_LIKE = null;
    function getSystemShellUnixLike(os, env) {
        // Only use $SHELL for the current OS
        if (platform.isLinux && os === 2 /* platform.OperatingSystem.Macintosh */ || platform.isMacintosh && os === 3 /* platform.OperatingSystem.Linux */) {
            return '/bin/bash';
        }
        if (!_TERMINAL_DEFAULT_SHELL_UNIX_LIKE) {
            let unixLikeTerminal;
            if (platform.isWindows) {
                unixLikeTerminal = '/bin/bash'; // for WSL
            }
            else {
                unixLikeTerminal = env['SHELL'];
                if (!unixLikeTerminal) {
                    try {
                        // It's possible for $SHELL to be unset, this API reads /etc/passwd. See https://github.com/github/codespaces/issues/1639
                        // Node docs: "Throws a SystemError if a user has no username or homedir."
                        unixLikeTerminal = (0, os_1.userInfo)().shell;
                    }
                    catch (err) { }
                }
                if (!unixLikeTerminal) {
                    unixLikeTerminal = 'sh';
                }
                // Some systems have $SHELL set to /bin/false which breaks the terminal
                if (unixLikeTerminal === '/bin/false') {
                    unixLikeTerminal = '/bin/bash';
                }
            }
            _TERMINAL_DEFAULT_SHELL_UNIX_LIKE = unixLikeTerminal;
        }
        return _TERMINAL_DEFAULT_SHELL_UNIX_LIKE;
    }
    let _TERMINAL_DEFAULT_SHELL_WINDOWS = null;
    async function getSystemShellWindows() {
        if (!_TERMINAL_DEFAULT_SHELL_WINDOWS) {
            _TERMINAL_DEFAULT_SHELL_WINDOWS = (await (0, powershell_1.getFirstAvailablePowerShellInstallation)()).exePath;
        }
        return _TERMINAL_DEFAULT_SHELL_WINDOWS;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2Uvbm9kZS9zaGVsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyx3Q0FVQztJQWZEOzs7O09BSUc7SUFDSSxLQUFLLFVBQVUsY0FBYyxDQUFDLEVBQTRCLEVBQUUsR0FBaUM7UUFDbkcsSUFBSSxFQUFFLDZDQUFxQyxFQUFFLENBQUM7WUFDN0MsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8scUJBQXFCLEVBQUUsQ0FBQztZQUNoQyxDQUFDO1lBQ0QsaURBQWlEO1lBQ2pELE9BQU8sU0FBUyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQsT0FBTyxzQkFBc0IsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELElBQUksaUNBQWlDLEdBQWtCLElBQUksQ0FBQztJQUM1RCxTQUFTLHNCQUFzQixDQUFDLEVBQTRCLEVBQUUsR0FBaUM7UUFDOUYscUNBQXFDO1FBQ3JDLElBQUksUUFBUSxDQUFDLE9BQU8sSUFBSSxFQUFFLCtDQUF1QyxJQUFJLFFBQVEsQ0FBQyxXQUFXLElBQUksRUFBRSwyQ0FBbUMsRUFBRSxDQUFDO1lBQ3BJLE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFFRCxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQztZQUN4QyxJQUFJLGdCQUFvQyxDQUFDO1lBQ3pDLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4QixnQkFBZ0IsR0FBRyxXQUFXLENBQUMsQ0FBQyxVQUFVO1lBQzNDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRWhDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUN2QixJQUFJLENBQUM7d0JBQ0oseUhBQXlIO3dCQUN6SCwwRUFBMEU7d0JBQzFFLGdCQUFnQixHQUFHLElBQUEsYUFBUSxHQUFFLENBQUMsS0FBSyxDQUFDO29CQUNyQyxDQUFDO29CQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsQixDQUFDO2dCQUVELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUN2QixnQkFBZ0IsR0FBRyxJQUFJLENBQUM7Z0JBQ3pCLENBQUM7Z0JBRUQsdUVBQXVFO2dCQUN2RSxJQUFJLGdCQUFnQixLQUFLLFlBQVksRUFBRSxDQUFDO29CQUN2QyxnQkFBZ0IsR0FBRyxXQUFXLENBQUM7Z0JBQ2hDLENBQUM7WUFDRixDQUFDO1lBQ0QsaUNBQWlDLEdBQUcsZ0JBQWdCLENBQUM7UUFDdEQsQ0FBQztRQUNELE9BQU8saUNBQWlDLENBQUM7SUFDMUMsQ0FBQztJQUVELElBQUksK0JBQStCLEdBQWtCLElBQUksQ0FBQztJQUMxRCxLQUFLLFVBQVUscUJBQXFCO1FBQ25DLElBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDO1lBQ3RDLCtCQUErQixHQUFHLENBQUMsTUFBTSxJQUFBLG9EQUF1QyxHQUFFLENBQUUsQ0FBQyxPQUFPLENBQUM7UUFDOUYsQ0FBQztRQUNELE9BQU8sK0JBQStCLENBQUM7SUFDeEMsQ0FBQyJ9