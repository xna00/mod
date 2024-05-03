/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, electron_1, lifecycle_1, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewProtocolProvider = void 0;
    class WebviewProtocolProvider extends lifecycle_1.Disposable {
        static { this.validWebviewFilePaths = new Map([
            ['/index.html', 'index.html'],
            ['/fake.html', 'fake.html'],
            ['/service-worker.js', 'service-worker.js'],
        ]); }
        constructor() {
            super();
            // Register the protocol for loading webview html
            const webviewHandler = this.handleWebviewRequest.bind(this);
            electron_1.protocol.registerFileProtocol(network_1.Schemas.vscodeWebview, webviewHandler);
        }
        handleWebviewRequest(request, callback) {
            try {
                const uri = uri_1.URI.parse(request.url);
                const entry = WebviewProtocolProvider.validWebviewFilePaths.get(uri.path);
                if (typeof entry === 'string') {
                    const relativeResourcePath = `vs/workbench/contrib/webview/browser/pre/${entry}`;
                    const url = network_1.FileAccess.asFileUri(relativeResourcePath);
                    return callback({
                        path: url.fsPath,
                        headers: {
                            ...network_1.COI.getHeadersFromQuery(request.url),
                            'Cross-Origin-Resource-Policy': 'cross-origin'
                        }
                    });
                }
                else {
                    return callback({ error: -10 /* ACCESS_DENIED - https://cs.chromium.org/chromium/src/net/base/net_error_list.h?l=32 */ });
                }
            }
            catch {
                // noop
            }
            return callback({ error: -2 /* FAILED - https://cs.chromium.org/chromium/src/net/base/net_error_list.h?l=32 */ });
        }
    }
    exports.WebviewProtocolProvider = WebviewProtocolProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1Byb3RvY29sUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3dlYnZpZXcvZWxlY3Ryb24tbWFpbi93ZWJ2aWV3UHJvdG9jb2xQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSx1QkFBd0IsU0FBUSxzQkFBVTtpQkFFdkMsMEJBQXFCLEdBQUcsSUFBSSxHQUFHLENBQUM7WUFDOUMsQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDO1lBQzdCLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQztZQUMzQixDQUFDLG9CQUFvQixFQUFFLG1CQUFtQixDQUFDO1NBQzNDLENBQUMsQ0FBQztRQUVIO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFFUixpREFBaUQ7WUFDakQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1RCxtQkFBUSxDQUFDLG9CQUFvQixDQUFDLGlCQUFPLENBQUMsYUFBYSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFTyxvQkFBb0IsQ0FDM0IsT0FBaUMsRUFDakMsUUFBZ0U7WUFFaEUsSUFBSSxDQUFDO2dCQUNKLE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQyxNQUFNLEtBQUssR0FBRyx1QkFBdUIsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxRSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUMvQixNQUFNLG9CQUFvQixHQUFvQiw0Q0FBNEMsS0FBSyxFQUFFLENBQUM7b0JBQ2xHLE1BQU0sR0FBRyxHQUFHLG9CQUFVLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLENBQUM7b0JBQ3ZELE9BQU8sUUFBUSxDQUFDO3dCQUNmLElBQUksRUFBRSxHQUFHLENBQUMsTUFBTTt3QkFDaEIsT0FBTyxFQUFFOzRCQUNSLEdBQUcsYUFBRyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7NEJBQ3ZDLDhCQUE4QixFQUFFLGNBQWM7eUJBQzlDO3FCQUNELENBQUMsQ0FBQztnQkFDSixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMseUZBQXlGLEVBQUUsQ0FBQyxDQUFDO2dCQUMzSCxDQUFDO1lBQ0YsQ0FBQztZQUFDLE1BQU0sQ0FBQztnQkFDUixPQUFPO1lBQ1IsQ0FBQztZQUNELE9BQU8sUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLGtGQUFrRixFQUFFLENBQUMsQ0FBQztRQUNuSCxDQUFDOztJQXhDRiwwREF5Q0MifQ==