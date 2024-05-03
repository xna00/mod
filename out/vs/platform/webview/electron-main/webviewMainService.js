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
define(["require", "exports", "electron", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/webview/electron-main/webviewProtocolProvider", "vs/platform/windows/electron-main/windows"], function (require, exports, electron_1, event_1, lifecycle_1, webviewProtocolProvider_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewMainService = void 0;
    let WebviewMainService = class WebviewMainService extends lifecycle_1.Disposable {
        constructor(windowsMainService) {
            super();
            this.windowsMainService = windowsMainService;
            this._onFoundInFrame = this._register(new event_1.Emitter());
            this.onFoundInFrame = this._onFoundInFrame.event;
            this._register(new webviewProtocolProvider_1.WebviewProtocolProvider());
        }
        async setIgnoreMenuShortcuts(id, enabled) {
            let contents;
            if (typeof id.windowId === 'number') {
                const { windowId } = id;
                const window = this.windowsMainService.getWindowById(windowId);
                if (!window?.win) {
                    throw new Error(`Invalid windowId: ${windowId}`);
                }
                contents = window.win.webContents;
            }
            else {
                const { webContentsId } = id;
                contents = electron_1.webContents.fromId(webContentsId);
                if (!contents) {
                    throw new Error(`Invalid webContentsId: ${webContentsId}`);
                }
            }
            if (!contents.isDestroyed()) {
                contents.setIgnoreMenuShortcuts(enabled);
            }
        }
        async findInFrame(windowId, frameName, text, options) {
            const initialFrame = this.getFrameByName(windowId, frameName);
            const frame = initialFrame;
            if (typeof frame.findInFrame === 'function') {
                frame.findInFrame(text, {
                    findNext: options.findNext,
                    forward: options.forward,
                });
                const foundInFrameHandler = (_, result) => {
                    if (result.finalUpdate) {
                        this._onFoundInFrame.fire(result);
                        frame.removeListener('found-in-frame', foundInFrameHandler);
                    }
                };
                frame.on('found-in-frame', foundInFrameHandler);
            }
        }
        async stopFindInFrame(windowId, frameName, options) {
            const initialFrame = this.getFrameByName(windowId, frameName);
            const frame = initialFrame;
            if (typeof frame.stopFindInFrame === 'function') {
                frame.stopFindInFrame(options.keepSelection ? 'keepSelection' : 'clearSelection');
            }
        }
        getFrameByName(windowId, frameName) {
            const window = this.windowsMainService.getWindowById(windowId.windowId);
            if (!window?.win) {
                throw new Error(`Invalid windowId: ${windowId}`);
            }
            const frame = window.win.webContents.mainFrame.framesInSubtree.find(frame => {
                return frame.name === frameName;
            });
            if (!frame) {
                throw new Error(`Unknown frame: ${frameName}`);
            }
            return frame;
        }
    };
    exports.WebviewMainService = WebviewMainService;
    exports.WebviewMainService = WebviewMainService = __decorate([
        __param(0, windows_1.IWindowsMainService)
    ], WebviewMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld01haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93ZWJ2aWV3L2VsZWN0cm9uLW1haW4vd2Vidmlld01haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLHNCQUFVO1FBT2pELFlBQ3NCLGtCQUF3RDtZQUU3RSxLQUFLLEVBQUUsQ0FBQztZQUY4Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBSjdELG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBc0IsQ0FBQyxDQUFDO1lBQzlFLG1CQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7WUFNbEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGlEQUF1QixFQUFFLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRU0sS0FBSyxDQUFDLHNCQUFzQixDQUFDLEVBQTBDLEVBQUUsT0FBZ0I7WUFDL0YsSUFBSSxRQUFpQyxDQUFDO1lBRXRDLElBQUksT0FBUSxFQUFzQixDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDMUQsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFJLEVBQXNCLENBQUM7Z0JBQzdDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQy9ELElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUM7b0JBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQ2xELENBQUM7Z0JBQ0QsUUFBUSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENB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