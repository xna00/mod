/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/parts/ipc/common/ipc", "vs/platform/window/common/window"], function (require, exports, platform_1, ipc_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowIgnoreMenuShortcutsManager = void 0;
    class WindowIgnoreMenuShortcutsManager {
        constructor(configurationService, mainProcessService, _nativeHostService) {
            this._nativeHostService = _nativeHostService;
            this._isUsingNativeTitleBars = (0, window_1.hasNativeTitlebar)(configurationService);
            this._webviewMainService = ipc_1.ProxyChannel.toService(mainProcessService.getChannel('webview'));
        }
        didFocus() {
            this.setIgnoreMenuShortcuts(true);
        }
        didBlur() {
            this.setIgnoreMenuShortcuts(false);
        }
        get _shouldToggleMenuShortcutsEnablement() {
            return platform_1.isMacintosh || this._isUsingNativeTitleBars;
        }
        setIgnoreMenuShortcuts(value) {
            if (this._shouldToggleMenuShortcutsEnablement) {
                this._webviewMainService.setIgnoreMenuShortcuts({ windowId: this._nativeHostService.windowId }, value);
            }
        }
    }
    exports.WindowIgnoreMenuShortcutsManager = WindowIgnoreMenuShortcutsManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93SWdub3JlTWVudVNob3J0Y3V0c01hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvZWxlY3Ryb24tc2FuZGJveC93aW5kb3dJZ25vcmVNZW51U2hvcnRjdXRzTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxnQ0FBZ0M7UUFNNUMsWUFDQyxvQkFBMkMsRUFDM0Msa0JBQXVDLEVBQ3RCLGtCQUFzQztZQUF0Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBRXZELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFBLDBCQUFpQixFQUFDLG9CQUFvQixDQUFDLENBQUM7WUFFdkUsSUFBSSxDQUFDLG1CQUFtQixHQUFHLGtCQUFZLENBQUMsU0FBUyxDQUF5QixrQkFBa0IsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNySCxDQUFDO1FBRU0sUUFBUTtZQUNkLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRU0sT0FBTztZQUNiLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsSUFBWSxvQ0FBb0M7WUFDL0MsT0FBTyxzQkFBVyxJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQztRQUNwRCxDQUFDO1FBRVMsc0JBQXNCLENBQUMsS0FBYztZQUM5QyxJQUFJLElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsc0JBQXNCLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hHLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFqQ0QsNEVBaUNDIn0=