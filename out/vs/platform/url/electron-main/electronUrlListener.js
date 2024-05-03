/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uri"], function (require, exports, electron_1, async_1, event_1, lifecycle_1, platform_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronURLListener = void 0;
    /**
     * A listener for URLs that are opened from the OS and handled by VSCode.
     * Depending on the platform, this works differently:
     * - Windows: we use `app.setAsDefaultProtocolClient()` to register VSCode with the OS
     *            and additionally add the `open-url` command line argument to identify.
     * - macOS:   we rely on `app.on('open-url')` to be called by the OS
     * - Linux:   we have a special shortcut installed (`resources/linux/code-url-handler.desktop`)
     *            that calls VSCode with the `open-url` command line argument
     *            (https://github.com/microsoft/vscode/pull/56727)
     */
    class ElectronURLListener extends lifecycle_1.Disposable {
        constructor(initialProtocolUrls, urlService, windowsMainService, environmentMainService, productService, logService) {
            super();
            this.urlService = urlService;
            this.logService = logService;
            this.uris = [];
            this.retryCount = 0;
            if (initialProtocolUrls) {
                logService.trace('ElectronURLListener initialUrisToHandle:', initialProtocolUrls.map(url => url.originalUrl));
                // the initial set of URIs we need to handle once the window is ready
                this.uris = initialProtocolUrls;
            }
            // Windows: install as protocol handler
            if (platform_1.isWindows) {
                const windowsParameters = environmentMainService.isBuilt ? [] : [`"${environmentMainService.appRoot}"`];
                windowsParameters.push('--open-url', '--');
                electron_1.app.setAsDefaultProtocolClient(productService.urlProtocol, process.execPath, windowsParameters);
            }
            // macOS: listen to `open-url` events from here on to handle
            const onOpenElectronUrl = event_1.Event.map(event_1.Event.fromNodeEventEmitter(electron_1.app, 'open-url', (event, url) => ({ event, url })), ({ event, url }) => {
                event.preventDefault(); // always prevent default and return the url as string
                return url;
            });
            this._register(onOpenElectronUrl(url => {
                const uri = this.uriFromRawUrl(url);
                if (!uri) {
                    return;
                }
                this.urlService.open(uri, { originalUrl: url });
            }));
            // Send initial links to the window once it has loaded
            const isWindowReady = windowsMainService.getWindows()
                .filter(window => window.isReady)
                .length > 0;
            if (isWindowReady) {
                logService.trace('ElectronURLListener: window is ready to handle URLs');
                this.flush();
            }
            else {
                logService.trace('ElectronURLListener: waiting for window to be ready to handle URLs...');
                this._register(event_1.Event.once(windowsMainService.onDidSignalReadyWindow)(() => this.flush()));
            }
        }
        uriFromRawUrl(url) {
            try {
                return uri_1.URI.parse(url);
            }
            catch (e) {
                return undefined;
            }
        }
        async flush() {
            if (this.retryCount++ > 10) {
                this.logService.trace('ElectronURLListener#flush(): giving up after 10 retries');
                return;
            }
            this.logService.trace('ElectronURLListener#flush(): flushing URLs');
            const uris = [];
            for (const obj of this.uris) {
                const handled = await this.urlService.open(obj.uri, { originalUrl: obj.originalUrl });
                if (handled) {
                    this.logService.trace('ElectronURLListener#flush(): URL was handled', obj.originalUrl);
                }
                else {
                    this.logService.trace('ElectronURLListener#flush(): URL was not yet handled', obj.originalUrl);
                    uris.push(obj);
                }
            }
            if (uris.length === 0) {
                return;
            }
            this.uris = uris;
            (0, async_1.disposableTimeout)(() => this.flush(), 500, this._store);
        }
    }
    exports.ElectronURLListener = ElectronURLListener;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb25VcmxMaXN0ZW5lci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXJsL2VsZWN0cm9uLW1haW4vZWxlY3Ryb25VcmxMaXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEc7Ozs7Ozs7OztPQVNHO0lBQ0gsTUFBYSxtQkFBb0IsU0FBUSxzQkFBVTtRQUtsRCxZQUNDLG1CQUErQyxFQUM5QixVQUF1QixFQUN4QyxrQkFBdUMsRUFDdkMsc0JBQStDLEVBQy9DLGNBQStCLEVBQ2QsVUFBdUI7WUFFeEMsS0FBSyxFQUFFLENBQUM7WUFOUyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBSXZCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFUakMsU0FBSSxHQUFtQixFQUFFLENBQUM7WUFDMUIsZUFBVSxHQUFHLENBQUMsQ0FBQztZQVl0QixJQUFJLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3pCLFVBQVUsQ0FBQyxLQUFLLENBQUMsMENBQTBDLEVBQUUsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBRTlHLHFFQUFxRTtnQkFDckUsSUFBSSxDQUFDLElBQUksR0FBRyxtQkFBbUIsQ0FBQztZQUNqQyxDQUFDO1lBRUQsdUNBQXVDO1lBQ3ZDLElBQUksb0JBQVMsRUFBRSxDQUFDO2dCQUNmLE1BQU0saUJBQWlCLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxzQkFBc0IsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO2dCQUN4RyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzQyxjQUFHLENBQUMsMEJBQTBCLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDakcsQ0FBQztZQUVELDREQUE0RDtZQUM1RCxNQUFNLGlCQUFpQixHQUFHLGFBQUssQ0FBQyxHQUFHLENBQ2xDLGFBQUssQ0FBQyxvQkFBb0IsQ0FBQyxjQUFHLEVBQUUsVUFBVSxFQUFFLENBQUMsS0FBb0IsRUFBRSxHQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUNwRyxDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUU7Z0JBQ2xCLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLHNEQUFzRDtnQkFFOUUsT0FBTyxHQUFHLENBQUM7WUFDWixDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3RDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDVixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLHNEQUFzRDtZQUN0RCxNQUFNLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUU7aUJBQ25ELE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7aUJBQ2hDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFFYixJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNuQixVQUFVLENBQUMsS0FBSyxDQUFDLHFEQUFxRCxDQUFDLENBQUM7Z0JBRXhFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNkLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxVQUFVLENBQUMsS0FBSyxDQUFDLHVFQUF1RSxDQUFDLENBQUM7Z0JBRTFGLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0YsQ0FBQztRQUNGLENBQUM7UUFFTyxhQUFhLENBQUMsR0FBVztZQUNoQyxJQUFJLENBQUM7Z0JBQ0osT0FBTyxTQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLEtBQUs7WUFDbEIsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7Z0JBRWpGLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztZQUVwRSxNQUFNLElBQUksR0FBbUIsRUFBRSxDQUFDO1lBRWhDLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUM3QixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7Z0JBQ3RGLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsOENBQThDLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN4RixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsc0RBQXNELEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUUvRixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNoQixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdkIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNqQixJQUFBLHlCQUFpQixFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pELENBQUM7S0FDRDtJQXBHRCxrREFvR0MifQ==