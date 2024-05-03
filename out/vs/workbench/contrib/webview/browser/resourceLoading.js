/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/webview/common/mimeTypes"], function (require, exports, extpath_1, network_1, path_1, uri_1, files_1, mimeTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewResourceResponse = void 0;
    exports.loadLocalResource = loadLocalResource;
    var WebviewResourceResponse;
    (function (WebviewResourceResponse) {
        let Type;
        (function (Type) {
            Type[Type["Success"] = 0] = "Success";
            Type[Type["Failed"] = 1] = "Failed";
            Type[Type["AccessDenied"] = 2] = "AccessDenied";
            Type[Type["NotModified"] = 3] = "NotModified";
        })(Type = WebviewResourceResponse.Type || (WebviewResourceResponse.Type = {}));
        class StreamSuccess {
            constructor(stream, etag, mtime, mimeType) {
                this.stream = stream;
                this.etag = etag;
                this.mtime = mtime;
                this.mimeType = mimeType;
                this.type = Type.Success;
            }
        }
        WebviewResourceResponse.StreamSuccess = StreamSuccess;
        WebviewResourceResponse.Failed = { type: Type.Failed };
        WebviewResourceResponse.AccessDenied = { type: Type.AccessDenied };
        class NotModified {
            constructor(mimeType, mtime) {
                this.mimeType = mimeType;
                this.mtime = mtime;
                this.type = Type.NotModified;
            }
        }
        WebviewResourceResponse.NotModified = NotModified;
    })(WebviewResourceResponse || (exports.WebviewResourceResponse = WebviewResourceResponse = {}));
    async function loadLocalResource(requestUri, options, fileService, logService, token) {
        logService.debug(`loadLocalResource - begin. requestUri=${requestUri}`);
        const resourceToLoad = getResourceToLoad(requestUri, options.roots);
        logService.debug(`loadLocalResource - found resource to load. requestUri=${requestUri}, resourceToLoad=${resourceToLoad}`);
        if (!resourceToLoad) {
            return WebviewResourceResponse.AccessDenied;
        }
        const mime = (0, mimeTypes_1.getWebviewContentMimeType)(requestUri); // Use the original path for the mime
        try {
            const result = await fileService.readFileStream(resourceToLoad, { etag: options.ifNoneMatch }, token);
            return new WebviewResourceResponse.StreamSuccess(result.value, result.etag, result.mtime, mime);
        }
        catch (err) {
            if (err instanceof files_1.FileOperationError) {
                const result = err.fileOperationResult;
                // NotModified status is expected and can be handled gracefully
                if (result === 2 /* FileOperationResult.FILE_NOT_MODIFIED_SINCE */) {
                    return new WebviewResourceResponse.NotModified(mime, err.options?.mtime);
                }
            }
            // Otherwise the error is unexpected.
            logService.debug(`loadLocalResource - Error using fileReader. requestUri=${requestUri}`);
            console.log(err);
            return WebviewResourceResponse.Failed;
        }
    }
    function getResourceToLoad(requestUri, roots) {
        for (const root of roots) {
            if (containsResource(root, requestUri)) {
                return normalizeResourcePath(requestUri);
            }
        }
        return undefined;
    }
    function containsResource(root, resource) {
        if (root.scheme !== resource.scheme) {
            return false;
        }
        let resourceFsPath = (0, path_1.normalize)(resource.fsPath);
        let rootPath = (0, path_1.normalize)(root.fsPath + (root.fsPath.endsWith(path_1.sep) ? '' : path_1.sep));
        if ((0, extpath_1.isUNC)(root.fsPath) && (0, extpath_1.isUNC)(resource.fsPath)) {
            rootPath = rootPath.toLowerCase();
            resourceFsPath = resourceFsPath.toLowerCase();
        }
        return resourceFsPath.startsWith(rootPath);
    }
    function normalizeResourcePath(resource) {
        // Rewrite remote uris to a path that the remote file system can understand
        if (resource.scheme === network_1.Schemas.vscodeRemote) {
            return uri_1.URI.from({
                scheme: network_1.Schemas.vscodeRemote,
                authority: resource.authority,
                path: '/vscode-resource',
                query: JSON.stringify({
                    requestResourcePath: resource.path
                })
            });
        }
        return resource;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VMb2FkaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3L2Jyb3dzZXIvcmVzb3VyY2VMb2FkaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlDaEcsOENBeUNDO0lBdEVELElBQWlCLHVCQUF1QixDQTJCdkM7SUEzQkQsV0FBaUIsdUJBQXVCO1FBQ3ZDLElBQVksSUFBbUQ7UUFBL0QsV0FBWSxJQUFJO1lBQUcscUNBQU8sQ0FBQTtZQUFFLG1DQUFNLENBQUE7WUFBRSwrQ0FBWSxDQUFBO1lBQUUsNkNBQVcsQ0FBQTtRQUFDLENBQUMsRUFBbkQsSUFBSSxHQUFKLDRCQUFJLEtBQUosNEJBQUksUUFBK0M7UUFFL0QsTUFBYSxhQUFhO1lBR3pCLFlBQ2lCLE1BQThCLEVBQzlCLElBQXdCLEVBQ3hCLEtBQXlCLEVBQ3pCLFFBQWdCO2dCQUhoQixXQUFNLEdBQU4sTUFBTSxDQUF3QjtnQkFDOUIsU0FBSSxHQUFKLElBQUksQ0FBb0I7Z0JBQ3hCLFVBQUssR0FBTCxLQUFLLENBQW9CO2dCQUN6QixhQUFRLEdBQVIsUUFBUSxDQUFRO2dCQU54QixTQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQU96QixDQUFDO1NBQ0w7UUFUWSxxQ0FBYSxnQkFTekIsQ0FBQTtRQUVZLDhCQUFNLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBVyxDQUFDO1FBQ3hDLG9DQUFZLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBVyxDQUFDO1FBRWpFLE1BQWEsV0FBVztZQUd2QixZQUNpQixRQUFnQixFQUNoQixLQUF5QjtnQkFEekIsYUFBUSxHQUFSLFFBQVEsQ0FBUTtnQkFDaEIsVUFBSyxHQUFMLEtBQUssQ0FBb0I7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