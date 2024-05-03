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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/async", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/platform/layout/browser/layoutService", "vs/platform/log/common/log"], function (require, exports, browser_1, dom_1, window_1, async_1, event_1, hash_1, lifecycle_1, layoutService_1, log_1) {
    "use strict";
    var BrowserClipboardService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserClipboardService = void 0;
    let BrowserClipboardService = class BrowserClipboardService extends lifecycle_1.Disposable {
        static { BrowserClipboardService_1 = this; }
        constructor(layoutService, logService) {
            super();
            this.layoutService = layoutService;
            this.logService = logService;
            this.mapTextToType = new Map(); // unsupported in web (only in-memory)
            this.findText = ''; // unsupported in web (only in-memory)
            this.resources = []; // unsupported in web (only in-memory)
            this.resourcesStateHash = undefined;
            if (browser_1.isSafari || browser_1.isWebkitWebView) {
                this.installWebKitWriteTextWorkaround();
            }
            // Keep track of copy operations to reset our set of
            // copied resources: since we keep resources in memory
            // and not in the clipboard, we have to invalidate
            // that state when the user copies other data.
            this._register(event_1.Event.runAndSubscribe(dom_1.onDidRegisterWindow, ({ window, disposables }) => {
                disposables.add((0, dom_1.addDisposableListener)(window.document, 'copy', () => this.clearResources()));
            }, { window: window_1.mainWindow, disposables: this._store }));
        }
        // In Safari, it has the following note:
        //
        // "The request to write to the clipboard must be triggered during a user gesture.
        // A call to clipboard.write or clipboard.writeText outside the scope of a user
        // gesture(such as "click" or "touch" event handlers) will result in the immediate
        // rejection of the promise returned by the API call."
        // From: https://webkit.org/blog/10855/async-clipboard-api/
        //
        // Since extensions run in a web worker, and handle gestures in an asynchronous way,
        // they are not classified by Safari as "in response to a user gesture" and will reject.
        //
        // This function sets up some handlers to work around that behavior.
        installWebKitWriteTextWorkaround() {
            const handler = () => {
                const currentWritePromise = new async_1.DeferredPromise();
                // Cancel the previous promise since we just created a new one in response to this new event
                if (this.webKitPendingClipboardWritePromise && !this.webKitPendingClipboardWritePromise.isSettled) {
                    this.webKitPendingClipboardWritePromise.cancel();
                }
                this.webKitPendingClipboardWritePromise = currentWritePromise;
                // The ctor of ClipboardItem allows you to pass in a promise that will resolve to a string.
                // This allows us to pass in a Promise that will either be cancelled by another event or
                // resolved with the contents of the first call to this.writeText.
                // see https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem/ClipboardItem#parameters
                navigator.clipboard.write([new ClipboardItem({
                        'text/plain': currentWritePromise.p,
                    })]).catch(async (err) => {
                    if (!(err instanceof Error) || err.name !== 'NotAllowedError' || !currentWritePromise.isRejected) {
                        this.logService.error(err);
                    }
                });
            };
            this._register(event_1.Event.runAndSubscribe(this.layoutService.onDidAddContainer, ({ container, disposables }) => {
                disposables.add((0, dom_1.addDisposableListener)(container, 'click', handler));
                disposables.add((0, dom_1.addDisposableListener)(container, 'keydown', handler));
            }, { container: this.layoutService.mainContainer, disposables: this._store }));
        }
        async writeText(text, type) {
            // Clear resources given we are writing text
            this.writeResources([]);
            // With type: only in-memory is supported
            if (type) {
                this.mapTextToType.set(type, text);
                return;
            }
            if (this.webKitPendingClipboardWritePromise) {
                // For Safari, we complete this Promise which allows the call to `navigator.clipboard.write()`
                // above to resolve and successfully copy to the clipboard. If we let this continue, Safari
                // would throw an error because this call stack doesn't appear to originate from a user gesture.
                return this.webKitPendingClipboardWritePromise.complete(text);
            }
            // Guard access to navigator.clipboard with try/catch
            // as we have seen DOMExceptions in certain browsers
            // due to security policies.
            try {
                return await navigator.clipboard.writeText(text);
            }
            catch (error) {
                console.error(error);
            }
            // Fallback to textarea and execCommand solution
            this.fallbackWriteText(text);
        }
        fallbackWriteText(text) {
            const activeDocument = (0, dom_1.getActiveDocument)();
            const activeElement = activeDocument.activeElement;
            const textArea = activeDocument.body.appendChild((0, dom_1.$)('textarea', { 'aria-hidden': true }));
            textArea.style.height = '1px';
            textArea.style.width = '1px';
            textArea.style.position = 'absolute';
            textArea.value = text;
            textArea.focus();
            textArea.select();
            activeDocument.execCommand('copy');
            if (activeElement instanceof HTMLElement) {
                activeElement.focus();
            }
            activeDocument.body.removeChild(textArea);
        }
        async readText(type) {
            // With type: only in-memory is supported
            if (type) {
                return this.mapTextToType.get(type) || '';
            }
            // Guard access to navigator.clipboard with try/catch
            // as we have seen DOMExceptions in certain browsers
            // due to security policies.
            try {
                return await navigator.clipboard.readText();
            }
            catch (error) {
                console.error(error);
            }
            return '';
        }
        async readFindText() {
            return this.findText;
        }
        async writeFindText(text) {
            this.findText = text;
        }
        static { this.MAX_RESOURCE_STATE_SOURCE_LENGTH = 1000; }
        async writeResources(resources) {
            if (resources.length === 0) {
                this.clearResources();
            }
            else {
                this.resources = resources;
                this.resourcesStateHash = await this.computeResourcesStateHash();
            }
        }
        async readResources() {
            const resourcesStateHash = await this.computeResourcesStateHash();
            if (this.resourcesStateHash !== resourcesStateHash) {
                this.clearResources(); // state mismatch, resources no longer valid
            }
            return this.resources;
        }
        async computeResourcesStateHash() {
            if (this.resources.length === 0) {
                return undefined; // no resources, no hash needed
            }
            // Resources clipboard is managed in-memory only and thus
            // fails to invalidate when clipboard data is changing.
            // As such, we compute the hash of the current clipboard
            // and use that to later validate the resources clipboard.
            const clipboardText = await this.readText();
            return (0, hash_1.hash)(clipboardText.substring(0, BrowserClipboardService_1.MAX_RESOURCE_STATE_SOURCE_LENGTH));
        }
        async hasResources() {
            return this.resources.length > 0;
        }
        clearResources() {
            this.resources = [];
            this.resourcesStateHash = undefined;
        }
    };
    exports.BrowserClipboardService = BrowserClipboardService;
    exports.BrowserClipboardService = BrowserClipboardService = BrowserClipboardService_1 = __decorate([
        __param(0, layoutService_1.ILayoutService),
        __param(1, log_1.ILogService)
    ], BrowserClipboardService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpcGJvYXJkU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY2xpcGJvYXJkL2Jyb3dzZXIvY2xpcGJvYXJkU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsc0JBQVU7O1FBSXRELFlBQ2lCLGFBQThDLEVBQ2pELFVBQXdDO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBSHlCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUNoQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBNERyQyxrQkFBYSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDLENBQUMsc0NBQXNDO1lBMkUxRixhQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsc0NBQXNDO1lBVXJELGNBQVMsR0FBVSxFQUFFLENBQUMsQ0FBQyxzQ0FBc0M7WUFDN0QsdUJBQWtCLEdBQXVCLFNBQVMsQ0FBQztZQTlJMUQsSUFBSSxrQkFBUSxJQUFJLHlCQUFlLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLENBQUM7WUFDekMsQ0FBQztZQUVELG9EQUFvRDtZQUNwRCxzREFBc0Q7WUFDdEQsa0RBQWtEO1lBQ2xELDhDQUE4QztZQUM5QyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxlQUFlLENBQUMseUJBQW1CLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO2dCQUNyRixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsMkJBQXFCLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RixDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsbUJBQVUsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBSUQsd0NBQXdDO1FBQ3hDLEVBQUU7UUFDRixrRkFBa0Y7UUFDbEYsK0VBQStFO1FBQy9FLGtGQUFrRjtRQUNsRixzREFBc0Q7UUFDdEQsMkRBQTJEO1FBQzNELEVBQUU7UUFDRixvRkFBb0Y7UUFDcEYsd0ZBQXdGO1FBQ3hGLEVBQUU7UUFDRixvRUFBb0U7UUFDNUQsZ0NBQWdDO1lBQ3ZDLE1BQU0sT0FBTyxHQUFHLEdBQUcsRUFBRTtnQkFDcEIsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLHVCQUFlLEVBQVUsQ0FBQztnQkFFMUQsNEZBQTRGO2dCQUM1RixJQUFJLElBQUksQ0FBQyxrQ0FBa0MsSUFBSSxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDbkcsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsRCxDQUFDO2dCQUNELElBQUksQ0FBQyxrQ0FBa0MsR0FBRyxtQkFBbUIsQ0FBQztnQkFFOUQsMkZBQTJGO2dCQUMzRix3RkFBd0Y7Z0JBQ3hGLGtFQUFrRTtnQkFDbEUsOEZBQThGO2dCQUM5RixTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksYUFBYSxDQUFDO3dCQUM1QyxZQUFZLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztxQkFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFDLEdBQUcsRUFBQyxFQUFFO29CQUN0QixJQUFJLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxpQkFBaUIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxDQUFDO3dCQUNsRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDNUIsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQztZQUVGLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRTtnQkFDekcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDcEUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN2RSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUlELEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBWSxFQUFFLElBQWE7WUFFMUMsNENBQTRDO1lBQzVDLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFeEIseUNBQXlDO1lBQ3pDLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVuQyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLGtDQUFrQyxFQUFFLENBQUM7Z0JBQzdDLDhGQUE4RjtnQkFDOUYsMkZBQTJGO2dCQUMzRixnR0FBZ0c7Z0JBQ2hHLE9BQU8sSUFBSSxDQUFDLGtDQUFrQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvRCxDQUFDO1lBRUQscURBQXFEO1lBQ3JELG9EQUFvRDtZQUNwRCw0QkFBNEI7WUFDNUIsSUFBSSxDQUFDO2dCQUNKLE9BQU8sTUFBTSxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QixDQUFDO1lBRUQsZ0RBQWdEO1lBQ2hELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRU8saUJBQWlCLENBQUMsSUFBWTtZQUNyQyxNQUFNLGNBQWMsR0FBRyxJQUFBLHVCQUFpQixHQUFFLENBQUM7WUFDM0MsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQztZQUVuRCxNQUFNLFFBQVEsR0FBd0IsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBQSxPQUFDLEVBQUMsVUFBVSxFQUFFLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDOUIsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQzdCLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztZQUVyQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUN0QixRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDakIsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRWxCLGNBQWMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFbkMsSUFBSSxhQUFhLFlBQVksV0FBVyxFQUFFLENBQUM7Z0JBQzFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN2QixDQUFDO1lBRUQsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBYTtZQUUzQix5Q0FBeUM7WUFDekMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMzQyxDQUFDO1lBRUQscURBQXFEO1lBQ3JELG9EQUFvRDtZQUNwRCw0QkFBNEI7WUFDNUIsSUFBSSxDQUFDO2dCQUNKLE9BQU8sTUFBTSxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzdDLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RCLENBQUM7WUFFRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFJRCxLQUFLLENBQUMsWUFBWTtZQUNqQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBWTtZQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUN0QixDQUFDO2lCQUt1QixxQ0FBZ0MsR0FBRyxJQUFJLEFBQVAsQ0FBUTtRQUVoRSxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQWdCO1lBQ3BDLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3ZCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDbEUsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYTtZQUNsQixNQUFNLGtCQUFrQixHQUFHLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDbEUsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEtBQUssa0JBQWtCLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsNENBQTRDO1lBQ3BFLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDdkIsQ0FBQztRQUVPLEtBQUssQ0FBQyx5QkFBeUI7WUFDdEMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxTQUFTLENBQUMsQ0FBQywrQkFBK0I7WUFDbEQsQ0FBQztZQUVELHlEQUF5RDtZQUN6RCx1REFBdUQ7WUFDdkQsd0RBQXdEO1lBQ3hELDBEQUEwRDtZQUUxRCxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM1QyxPQUFPLElBQUEsV0FBSSxFQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLHlCQUF1QixDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztRQUNuRyxDQUFDO1FBRUQsS0FBSyxDQUFDLFlBQVk7WUFDakIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVPLGNBQWM7WUFDckIsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQztRQUNyQyxDQUFDOztJQW5NVywwREFBdUI7c0NBQXZCLHVCQUF1QjtRQUtqQyxXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLGlCQUFXLENBQUE7T0FORCx1QkFBdUIsQ0FvTW5DIn0=