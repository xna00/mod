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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/network", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/ipc/common/mainProcessService", "vs/platform/remote/common/electronRemoteResources"], function (require, exports, buffer_1, lifecycle_1, mime_1, network_1, uri_1, files_1, mainProcessService_1, electronRemoteResources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronRemoteResourceLoader = void 0;
    let ElectronRemoteResourceLoader = class ElectronRemoteResourceLoader extends lifecycle_1.Disposable {
        constructor(windowId, mainProcessService, fileService) {
            super();
            this.windowId = windowId;
            this.fileService = fileService;
            const channel = {
                listen(_, event) {
                    throw new Error(`Event not found: ${event}`);
                },
                call: (_, command, arg) => {
                    switch (command) {
                        case electronRemoteResources_1.NODE_REMOTE_RESOURCE_IPC_METHOD_NAME: return this.doRequest(uri_1.URI.revive(arg[0]));
                    }
                    throw new Error(`Call not found: ${command}`);
                }
            };
            mainProcessService.registerChannel(electronRemoteResources_1.NODE_REMOTE_RESOURCE_CHANNEL_NAME, channel);
        }
        async doRequest(uri) {
            let content;
            try {
                const params = new URLSearchParams(uri.query);
                const actual = uri.with({
                    scheme: params.get('scheme'),
                    authority: params.get('authority'),
                    query: '',
                });
                content = await this.fileService.readFile(actual);
            }
            catch (e) {
                const str = (0, buffer_1.encodeBase64)(buffer_1.VSBuffer.fromString(e.message));
                if (e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    return { statusCode: 404, body: str };
                }
                else {
                    return { statusCode: 500, body: str };
                }
            }
            const mimeType = uri.path && (0, mime_1.getMediaOrTextMime)(uri.path);
            return { statusCode: 200, body: (0, buffer_1.encodeBase64)(content.value), mimeType };
        }
        getResourceUriProvider() {
            return (uri) => uri.with({
                scheme: network_1.Schemas.vscodeManagedRemoteResource,
                authority: `window:${this.windowId}`,
                query: new URLSearchParams({ authority: uri.authority, scheme: uri.scheme }).toString(),
            });
        }
    };
    exports.ElectronRemoteResourceLoader = ElectronRemoteResourceLoader;
    exports.ElectronRemoteResourceLoader = ElectronRemoteResourceLoader = __decorate([
        __param(1, mainProcessService_1.IMainProcessService),
        __param(2, files_1.IFileService)
    ], ElectronRemoteResourceLoader);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb25SZW1vdGVSZXNvdXJjZUxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcmVtb3RlL2VsZWN0cm9uLXNhbmRib3gvZWxlY3Ryb25SZW1vdGVSZXNvdXJjZUxvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBNkIsU0FBUSxzQkFBVTtRQUMzRCxZQUNrQixRQUFnQixFQUNaLGtCQUF1QyxFQUM3QixXQUF5QjtZQUV4RCxLQUFLLEVBQUUsQ0FBQztZQUpTLGFBQVEsR0FBUixRQUFRLENBQVE7WUFFRixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUl4RCxNQUFNLE9BQU8sR0FBbUI7Z0JBQy9CLE1BQU0sQ0FBSSxDQUFVLEVBQUUsS0FBYTtvQkFDbEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDOUMsQ0FBQztnQkFFRCxJQUFJLEVBQUUsQ0FBQyxDQUFVLEVBQUUsT0FBZSxFQUFFLEdBQVMsRUFBZ0IsRUFBRTtvQkFDOUQsUUFBUSxPQUFPLEVBQUUsQ0FBQzt3QkFDakIsS0FBSyw4REFBb0MsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3RGLENBQUM7b0JBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDL0MsQ0FBQzthQUNELENBQUM7WUFFRixrQkFBa0IsQ0FBQyxlQUFlLENBQUMsMkRBQWlDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVPLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBUTtZQUMvQixJQUFJLE9BQXFCLENBQUM7WUFDMUIsSUFBSSxDQUFDO2dCQUNKLE1BQU0sTUFBTSxHQUFHLElBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztvQkFDdkIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFFO29CQUM3QixTQUFTLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUU7b0JBQ25DLEtBQUssRUFBRSxFQUFFO2lCQUNULENBQUMsQ0FBQztnQkFDSCxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixNQUFNLEdBQUcsR0FBRyxJQUFBLHFCQUFZLEVBQUMsaUJBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxZQUFZLDBCQUFrQixJQUFJLENBQUMsQ0FBQyxtQkFBbUIsK0NBQXVDLEVBQUUsQ0FBQztvQkFDckcsT0FBTyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO2dCQUN2QyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO2dCQUN2QyxDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBQSx5QkFBa0IsRUFBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUQsT0FBTyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUEscUJBQVksRUFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUM7UUFDekUsQ0FBQztRQUVNLHNCQUFzQjtZQUM1QixPQUFPLENBQUMsR0FBUSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUM3QixNQUFNLEVBQUUsaUJBQU8sQ0FBQywyQkFBMkI7Z0JBQzNDLFNBQVMsRUFBRSxVQUFVLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ3BDLEtBQUssRUFBRSxJQUFJLGVBQWUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUU7YUFDdkYsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7SUF2RFksb0VBQTRCOzJDQUE1Qiw0QkFBNEI7UUFHdEMsV0FBQSx3Q0FBbUIsQ0FBQTtRQUNuQixXQUFBLG9CQUFZLENBQUE7T0FKRiw0QkFBNEIsQ0F1RHhDIn0=