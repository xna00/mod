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
define(["require", "exports", "vs/base/common/async", "vs/base/common/network", "vs/base/common/stream", "vs/base/parts/ipc/common/ipc", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/ipc/common/mainProcessService", "vs/platform/log/common/log", "vs/platform/native/common/native", "vs/platform/notification/common/notification", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/telemetry/common/telemetry", "vs/platform/tunnel/common/tunnel", "vs/workbench/contrib/webview/browser/webviewElement", "vs/workbench/contrib/webview/electron-sandbox/windowIgnoreMenuShortcutsManager", "vs/workbench/services/environment/common/environmentService"], function (require, exports, async_1, network_1, stream_1, ipc_1, accessibility_1, configuration_1, contextView_1, files_1, instantiation_1, mainProcessService_1, log_1, native_1, notification_1, remoteAuthorityResolver_1, telemetry_1, tunnel_1, webviewElement_1, windowIgnoreMenuShortcutsManager_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronWebviewElement = void 0;
    /**
     * Webview backed by an iframe but that uses Electron APIs to power the webview.
     */
    let ElectronWebviewElement = class ElectronWebviewElement extends webviewElement_1.WebviewElement {
        get platform() { return 'electron'; }
        constructor(initInfo, webviewThemeDataProvider, contextMenuService, tunnelService, fileService, telemetryService, environmentService, remoteAuthorityResolverService, logService, configurationService, mainProcessService, notificationService, _nativeHostService, instantiationService, accessibilityService) {
            super(initInfo, webviewThemeDataProvider, configurationService, contextMenuService, notificationService, environmentService, fileService, logService, remoteAuthorityResolverService, telemetryService, tunnelService, instantiationService, accessibilityService);
            this._nativeHostService = _nativeHostService;
            this._findStarted = false;
            this._iframeDelayer = this._register(new async_1.Delayer(200));
            this._webviewKeyboardHandler = new windowIgnoreMenuShortcutsManager_1.WindowIgnoreMenuShortcutsManager(configurationService, mainProcessService, _nativeHostService);
            this._webviewMainService = ipc_1.ProxyChannel.toService(mainProcessService.getChannel('webview'));
            if (initInfo.options.enableFindWidget) {
                this._register(this.onDidHtmlChange((newContent) => {
                    if (this._findStarted && this._cachedHtmlContent !== newContent) {
                        this.stopFind(false);
                        this._cachedHtmlContent = newContent;
                    }
                }));
                this._register(this._webviewMainService.onFoundInFrame((result) => {
                    this._hasFindResult.fire(result.matches > 0);
                }));
            }
        }
        dispose() {
            // Make sure keyboard handler knows it closed (#71800)
            this._webviewKeyboardHandler.didBlur();
            super.dispose();
        }
        webviewContentEndpoint(iframeId) {
            return `${network_1.Schemas.vscodeWebview}://${iframeId}`;
        }
        streamToBuffer(stream) {
            // Join buffers from stream without using the Node.js backing pool.
            // This lets us transfer the resulting buffer to the webview.
            return (0, stream_1.consumeStream)(stream, (buffers) => {
                const totalLength = buffers.reduce((prev, curr) => prev + curr.byteLength, 0);
                const ret = new ArrayBuffer(totalLength);
                const view = new Uint8Array(ret);
                let offset = 0;
                for (const element of buffers) {
                    view.set(element.buffer, offset);
                    offset += element.byteLength;
                }
                return ret;
            });
        }
        /**
         * Webviews expose a stateful find API.
         * Successive calls to find will move forward or backward through onFindResults
         * depending on the supplied options.
         *
         * @param value The string to search for. Empty strings are ignored.
         */
        find(value, previous) {
            if (!this.element) {
                return;
            }
            if (!this._findStarted) {
                this.updateFind(value);
            }
            else {
                // continuing the find, so set findNext to false
                const options = { forward: !previous, findNext: false, matchCase: false };
                this._webviewMainService.findInFrame({ windowId: this._nativeHostService.windowId }, this.id, value, options);
            }
        }
        updateFind(value) {
            if (!value || !this.element) {
                return;
            }
            // FindNext must be true for a first request
            const options = {
                forward: true,
                findNext: true,
                matchCase: false
            };
            this._iframeDelayer.trigger(() => {
                this._findStarted = true;
                this._webviewMainService.findInFrame({ windowId: this._nativeHostService.windowId }, this.id, value, options);
            });
        }
        stopFind(keepSelection) {
            if (!this.element) {
                return;
            }
            this._iframeDelayer.cancel();
            this._findStarted = false;
            this._webviewMainService.stopFindInFrame({ windowId: this._nativeHostService.windowId }, this.id, {
                keepSelection
            });
            this._onDidStopFind.fire();
        }
        handleFocusChange(isFocused) {
            super.handleFocusChange(isFocused);
            if (isFocused) {
                this._webviewKeyboardHandler.didFocus();
            }
            else {
                this._webviewKeyboardHandler.didBlur();
            }
        }
    };
    exports.ElectronWebviewElement = ElectronWebviewElement;
    exports.ElectronWebviewElement = ElectronWebviewElement = __decorate([
        __param(2, contextView_1.IContextMenuService),
        __param(3, tunnel_1.ITunnelService),
        __param(4, files_1.IFileService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(8, log_1.ILogService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, mainProcessService_1.IMainProcessService),
        __param(11, notification_1.INotificationService),
        __param(12, native_1.INativeHostService),
        __param(13, instantiation_1.IInstantiationService),
        __param(14, accessibility_1.IAccessibilityService)
    ], ElectronWebviewElement);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0VsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvZWxlY3Ryb24tc2FuZGJveC93ZWJ2aWV3RWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQmhHOztPQUVHO0lBQ0ksSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSwrQkFBYztRQVV6RCxJQUF1QixRQUFRLEtBQUssT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBRXhELFlBQ0MsUUFBeUIsRUFDekIsd0JBQWtELEVBQzdCLGtCQUF1QyxFQUM1QyxhQUE2QixFQUMvQixXQUF5QixFQUNwQixnQkFBbUMsRUFDeEIsa0JBQWdELEVBQzdDLDhCQUErRCxFQUNuRixVQUF1QixFQUNiLG9CQUEyQyxFQUM3QyxrQkFBdUMsRUFDdEMsbUJBQXlDLEVBQzNDLGtCQUF1RCxFQUNwRCxvQkFBMkMsRUFDM0Msb0JBQTJDO1lBRWxFLEtBQUssQ0FBQyxRQUFRLEVBQUUsd0JBQXdCLEVBQ3ZDLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLG1CQUFtQixFQUFFLGtCQUFrQixFQUNqRixXQUFXLEVBQUUsVUFBVSxFQUFFLDhCQUE4QixFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBTmxHLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFyQnBFLGlCQUFZLEdBQVksS0FBSyxDQUFDO1lBSXJCLG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sQ0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBeUJ4RSxJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxtRUFBZ0MsQ0FBQyxvQkFBb0IsRUFB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