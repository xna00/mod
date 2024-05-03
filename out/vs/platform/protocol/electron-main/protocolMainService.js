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
define(["require", "exports", "electron", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/ternarySearchTree", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/parts/ipc/electron-main/ipcMain", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, electron_1, lifecycle_1, network_1, path_1, platform_1, ternarySearchTree_1, uri_1, uuid_1, ipcMain_1, environment_1, log_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProtocolMainService = void 0;
    let ProtocolMainService = class ProtocolMainService extends lifecycle_1.Disposable {
        constructor(environmentService, userDataProfilesService, logService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.validRoots = ternarySearchTree_1.TernarySearchTree.forPaths(!platform_1.isLinux);
            this.validExtensions = new Set(['.svg', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']); // https://github.com/microsoft/vscode/issues/119384
            // Define an initial set of roots we allow loading from
            // - appRoot	: all files installed as part of the app
            // - extensions : all files shipped from extensions
            // - storage    : all files in global and workspace storage (https://github.com/microsoft/vscode/issues/116735)
            this.addValidFileRoot(environmentService.appRoot);
            this.addValidFileRoot(environmentService.extensionsPath);
            this.addValidFileRoot(userDataProfilesService.defaultProfile.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath);
            this.addValidFileRoot(environmentService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath);
            // Handle protocols
            this.handleProtocols();
        }
        handleProtocols() {
            const { defaultSession } = electron_1.session;
            // Register vscode-file:// handler
            defaultSession.protocol.registerFileProtocol(network_1.Schemas.vscodeFileResource, (request, callback) => this.handleResourceRequest(request, callback));
            // Block any file:// access
            defaultSession.protocol.interceptFileProtocol(network_1.Schemas.file, (request, callback) => this.handleFileRequest(request, callback));
            // Cleanup
            this._register((0, lifecycle_1.toDisposable)(() => {
                defaultSession.protocol.unregisterProtocol(network_1.Schemas.vscodeFileResource);
                defaultSession.protocol.uninterceptProtocol(network_1.Schemas.file);
            }));
        }
        addValidFileRoot(root) {
            // Pass to `normalize` because we later also do the
            // same for all paths to check against.
            const normalizedRoot = (0, path_1.normalize)(root);
            if (!this.validRoots.get(normalizedRoot)) {
                this.validRoots.set(normalizedRoot, true);
                return (0, lifecycle_1.toDisposable)(() => this.validRoots.delete(normalizedRoot));
            }
            return lifecycle_1.Disposable.None;
        }
        //#region file://
        handleFileRequest(request, callback) {
            const uri = uri_1.URI.parse(request.url);
            this.logService.error(`Refused to load resource ${uri.fsPath} from ${network_1.Schemas.file}: protocol (original URL: ${request.url})`);
            return callback({ error: -3 /* ABORTED */ });
        }
        //#endregion
        //#region vscode-file://
        handleResourceRequest(request, callback) {
            const path = this.requestToNormalizedFilePath(request);
            let headers;
            if (this.environmentService.crossOriginIsolated) {
                if ((0, path_1.basename)(path) === 'workbench.html' || (0, path_1.basename)(path) === 'workbench-dev.html') {
                    headers = network_1.COI.CoopAndCoep;
                }
                else {
                    headers = network_1.COI.getHeadersFromQuery(request.url);
                }
            }
            // first check by validRoots
            if (this.validRoots.findSubstr(path)) {
                return callback({ path, headers });
            }
            // then check by validExtensions
            if (this.validExtensions.has((0, path_1.extname)(path).toLowerCase())) {
                return callback({ path });
            }
            // finally block to load the resource
            this.logService.error(`${network_1.Schemas.vscodeFileResource}: Refused to load resource ${path} from ${network_1.Schemas.vscodeFileResource}: protocol (original URL: ${request.url})`);
            return callback({ error: -3 /* ABORTED */ });
        }
        requestToNormalizedFilePath(request) {
            // 1.) Use `URI.parse()` util from us to convert the raw
            //     URL into our URI.
            const requestUri = uri_1.URI.parse(request.url);
            // 2.) Use `FileAccess.asFileUri` to convert back from a
            //     `vscode-file:` URI to a `file:` URI.
            const unnormalizedFileUri = network_1.FileAccess.uriToFileUri(requestUri);
            // 3.) Strip anything from the URI that could result in
            //     relative paths (such as "..") by using `normalize`
            return (0, path_1.normalize)(unnormalizedFileUri.fsPath);
        }
        //#endregion
        //#region IPC Object URLs
        createIPCObjectUrl() {
            let obj = undefined;
            // Create unique URI
            const resource = uri_1.URI.from({
                scheme: 'vscode', // used for all our IPC communication (vscode:<channel>)
                path: (0, uuid_1.generateUuid)()
            });
            // Install IPC handler
            const channel = resource.toString();
            const handler = async () => obj;
            ipcMain_1.validatedIpcMain.handle(channel, handler);
            this.logService.trace(`IPC Object URL: Registered new channel ${channel}.`);
            return {
                resource,
                update: updatedObj => obj = updatedObj,
                dispose: () => {
                    this.logService.trace(`IPC Object URL: Removed channel ${channel}.`);
                    ipcMain_1.validatedIpcMain.removeHandler(channel);
                }
            };
        }
    };
    exports.ProtocolMainService = ProtocolMainService;
    exports.ProtocolMainService = ProtocolMainService = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, log_1.ILogService)
    ], ProtocolMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdG9jb2xNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcHJvdG9jb2wvZWxlY3Ryb24tbWFpbi9wcm90b2NvbE1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTtRQU9sRCxZQUM0QixrQkFBOEQsRUFDL0QsdUJBQWlELEVBQzlELFVBQXdDO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBSm9DLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBMkI7WUFFM0QsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQU5yQyxlQUFVLEdBQUcscUNBQWlCLENBQUMsUUFBUSxDQUFVLENBQUMsa0JBQU8sQ0FBQyxDQUFDO1lBQzNELG9CQUFlLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsb0RBQW9EO1lBUzNKLHVEQUF1RDtZQUN2RCxxREFBcUQ7WUFDckQsbURBQW1EO1lBQ25ELCtHQUErRztZQUMvRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3pELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0SCxJ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