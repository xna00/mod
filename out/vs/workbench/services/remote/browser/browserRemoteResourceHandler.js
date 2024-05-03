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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/uri", "vs/platform/files/common/files"], function (require, exports, buffer_1, lifecycle_1, mime_1, uri_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserRemoteResourceLoader = void 0;
    let BrowserRemoteResourceLoader = class BrowserRemoteResourceLoader extends lifecycle_1.Disposable {
        constructor(fileService, provider) {
            super();
            this.provider = provider;
            this._register(provider.onDidReceiveRequest(async (request) => {
                let uri;
                try {
                    uri = JSON.parse(decodeURIComponent(request.uri.query));
                }
                catch {
                    return request.respondWith(404, new Uint8Array(), {});
                }
                let content;
                try {
                    content = await fileService.readFile(uri_1.URI.from(uri, true));
                }
                catch (e) {
                    const str = buffer_1.VSBuffer.fromString(e.message).buffer;
                    if (e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        return request.respondWith(404, str, {});
                    }
                    else {
                        return request.respondWith(500, str, {});
                    }
                }
                const mime = uri.path && (0, mime_1.getMediaOrTextMime)(uri.path);
                request.respondWith(200, content.value.buffer, mime ? { 'content-type': mime } : {});
            }));
        }
        getResourceUriProvider() {
            const baseUri = uri_1.URI.parse(document.location.href);
            return uri => baseUri.with({
                path: this.provider.path,
                query: JSON.stringify(uri),
            });
        }
    };
    exports.BrowserRemoteResourceLoader = BrowserRemoteResourceLoader;
    exports.BrowserRemoteResourceLoader = BrowserRemoteResourceLoader = __decorate([
        __param(0, files_1.IFileService)
    ], BrowserRemoteResourceLoader);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlclJlbW90ZVJlc291cmNlSGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3JlbW90ZS9icm93c2VyL2Jyb3dzZXJSZW1vdGVSZXNvdXJjZUhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFDMUQsWUFDZSxXQUF5QixFQUN0QixRQUFpQztZQUVsRCxLQUFLLEVBQUUsQ0FBQztZQUZTLGFBQVEsR0FBUixRQUFRLENBQXlCO1lBSWxELElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBQyxPQUFPLEVBQUMsRUFBRTtnQkFDM0QsSUFBSSxHQUFrQixDQUFDO2dCQUN2QixJQUFJLENBQUM7b0JBQ0osR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxDQUFDO2dCQUFDLE1BQU0sQ0FBQztvQkFDUixPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLElBQUksVUFBVSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZELENBQUM7Z0JBRUQsSUFBSSxPQUFxQixDQUFDO2dCQUMxQixJQUFJLENBQUM7b0JBQ0osT0FBTyxHQUFHLE1BQU0sV0FBVyxDQUFDLFFBQVEsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMzRCxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1osTUFBTSxHQUFHLEdBQUcsaUJBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQztvQkFDbEQsSUFBSSxDQUFDLFlBQVksMEJBQWtCLElBQUksQ0FBQyxDQUFDLG1CQUFtQiwrQ0FBdUMsRUFBRSxDQUFDO3dCQUNyRyxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDMUMsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUMxQyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksSUFBSSxJQUFBLHlCQUFrQixFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdEQsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdEYsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTSxzQkFBc0I7WUFDNUIsTUFBTSxPQUFPLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xELE9BQU8sR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUMxQixJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJO2dCQUN4QixLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUM7YUFDMUIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7SUF2Q1ksa0VBQTJCOzBDQUEzQiwyQkFBMkI7UUFFckMsV0FBQSxvQkFBWSxDQUFBO09BRkYsMkJBQTJCLENBdUN2QyJ9