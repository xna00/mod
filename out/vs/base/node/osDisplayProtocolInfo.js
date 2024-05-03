/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "fs/promises", "vs/base/common/path", "vs/base/common/process"], function (require, exports, fs_1, promises_1, path_1, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getDisplayProtocol = getDisplayProtocol;
    exports.getCodeDisplayProtocol = getCodeDisplayProtocol;
    const XDG_SESSION_TYPE = 'XDG_SESSION_TYPE';
    const WAYLAND_DISPLAY = 'WAYLAND_DISPLAY';
    const XDG_RUNTIME_DIR = 'XDG_RUNTIME_DIR';
    var DisplayProtocolType;
    (function (DisplayProtocolType) {
        DisplayProtocolType["Wayland"] = "wayland";
        DisplayProtocolType["XWayland"] = "xwayland";
        DisplayProtocolType["X11"] = "x11";
        DisplayProtocolType["Unknown"] = "unknown";
    })(DisplayProtocolType || (DisplayProtocolType = {}));
    async function getDisplayProtocol(errorLogger) {
        const xdgSessionType = process_1.env[XDG_SESSION_TYPE];
        if (xdgSessionType) {
            // If XDG_SESSION_TYPE is set, return its value if it's either 'wayland' or 'x11'.
            // We assume that any value other than 'wayland' or 'x11' is an error or unexpected,
            // hence 'unknown' is returned.
            return xdgSessionType === "wayland" /* DisplayProtocolType.Wayland */ || xdgSessionType === "x11" /* DisplayProtocolType.X11 */ ? xdgSessionType : "unknown" /* DisplayProtocolType.Unknown */;
        }
        else {
            const waylandDisplay = process_1.env[WAYLAND_DISPLAY];
            if (!waylandDisplay) {
                // If WAYLAND_DISPLAY is empty, then the session is x11.
                return "x11" /* DisplayProtocolType.X11 */;
            }
            else {
                const xdgRuntimeDir = process_1.env[XDG_RUNTIME_DIR];
                if (!xdgRuntimeDir) {
                    // If XDG_RUNTIME_DIR is empty, then the session can only be guessed.
                    return "unknown" /* DisplayProtocolType.Unknown */;
                }
                else {
                    // Check for the presence of the file $XDG_RUNTIME_DIR/wayland-0.
                    const waylandServerPipe = (0, path_1.join)(xdgRuntimeDir, 'wayland-0');
                    try {
                        await (0, promises_1.access)(waylandServerPipe, fs_1.constants.R_OK);
                        // If the file exists, then the session is wayland.
                        return "wayland" /* DisplayProtocolType.Wayland */;
                    }
                    catch (err) {
                        // If the file does not exist or an error occurs, we guess 'unknown'
                        // since WAYLAND_DISPLAY was set but no wayland-0 pipe could be confirmed.
                        errorLogger(err);
                        return "unknown" /* DisplayProtocolType.Unknown */;
                    }
                }
            }
        }
    }
    function getCodeDisplayProtocol(displayProtocol, ozonePlatform) {
        if (!ozonePlatform) {
            return displayProtocol === "wayland" /* DisplayProtocolType.Wayland */ ? "xwayland" /* DisplayProtocolType.XWayland */ : "x11" /* DisplayProtocolType.X11 */;
        }
        else {
            switch (ozonePlatform) {
                case 'auto':
                    return displayProtocol;
                case 'x11':
                    return displayProtocol === "wayland" /* DisplayProtocolType.Wayland */ ? "xwayland" /* DisplayProtocolType.XWayland */ : "x11" /* DisplayProtocolType.X11 */;
                case 'wayland':
                    return "wayland" /* DisplayProtocolType.Wayland */;
                default:
                    return "unknown" /* DisplayProtocolType.Unknown */;
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3NEaXNwbGF5UHJvdG9jb2xJbmZvLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL25vZGUvb3NEaXNwbGF5UHJvdG9jb2xJbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRyxnREFzQ0M7SUFHRCx3REFlQztJQW5FRCxNQUFNLGdCQUFnQixHQUFHLGtCQUFrQixDQUFDO0lBQzVDLE1BQU0sZUFBZSxHQUFHLGlCQUFpQixDQUFDO0lBQzFDLE1BQU0sZUFBZSxHQUFHLGlCQUFpQixDQUFDO0lBRTFDLElBQVcsbUJBS1Y7SUFMRCxXQUFXLG1CQUFtQjtRQUM3QiwwQ0FBbUIsQ0FBQTtRQUNuQiw0Q0FBcUIsQ0FBQTtRQUNyQixrQ0FBVyxDQUFBO1FBQ1gsMENBQW1CLENBQUE7SUFDcEIsQ0FBQyxFQUxVLG1CQUFtQixLQUFuQixtQkFBbUIsUUFLN0I7SUFFTSxLQUFLLFVBQVUsa0JBQWtCLENBQUMsV0FBaUM7UUFDekUsTUFBTSxjQUFjLEdBQUcsYUFBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFFN0MsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNwQixrRkFBa0Y7WUFDbEYsb0ZBQW9GO1lBQ3BGLCtCQUErQjtZQUMvQixPQUFPLGNBQWMsZ0RBQWdDLElBQUksY0FBYyx3Q0FBNEIsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsNENBQTRCLENBQUM7UUFDcEosQ0FBQzthQUFNLENBQUM7WUFDUCxNQUFNLGNBQWMsR0FBRyxhQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFNUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNyQix3REFBd0Q7Z0JBQ3hELDJDQUErQjtZQUNoQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxhQUFhLEdBQUcsYUFBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUUzQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3BCLHFFQUFxRTtvQkFDckUsbURBQW1DO2dCQUNwQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsaUVBQWlFO29CQUNqRSxNQUFNLGlCQUFpQixHQUFHLElBQUEsV0FBSSxFQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFFM0QsSUFBSSxDQUFDO3dCQUNKLE1BQU0sSUFBQSxpQkFBTSxFQUFDLGlCQUFpQixFQUFFLGNBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFFbEQsbURBQW1EO3dCQUNuRCxtREFBbUM7b0JBQ3BDLENBQUM7b0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzt3QkFDZCxvRUFBb0U7d0JBQ3BFLDBFQUEwRTt3QkFDMUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNqQixtREFBbUM7b0JBQ3BDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO0lBQ0YsQ0FBQztJQUdELFNBQWdCLHNCQUFzQixDQUFDLGVBQW9DLEVBQUUsYUFBaUM7UUFDN0csSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3BCLE9BQU8sZUFBZSxnREFBZ0MsQ0FBQyxDQUFDLCtDQUE4QixDQUFDLG9DQUF3QixDQUFDO1FBQ2pILENBQUM7YUFBTSxDQUFDO1lBQ1AsUUFBUSxhQUFhLEVBQUUsQ0FBQztnQkFDdkIsS0FBSyxNQUFNO29CQUNWLE9BQU8sZUFBZSxDQUFDO2dCQUN4QixLQUFLLEtBQUs7b0JBQ1QsT0FBTyxlQUFlLGdEQUFnQyxDQUFDLENBQUMsK0NBQThCLENBQUMsb0NBQXdCLENBQUM7Z0JBQ2pILEtBQUssU0FBUztvQkFDYixtREFBbUM7Z0JBQ3BDO29CQUNDLG1EQUFtQztZQUNyQyxDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUMifQ==