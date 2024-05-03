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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostInitDataService", "vs/platform/log/common/log", "vs/workbench/api/common/extHostFileSystemConsumer", "vs/base/common/uri"], function (require, exports, instantiation_1, extHostInitDataService_1, log_1, extHostFileSystemConsumer_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionStoragePaths = exports.IExtensionStoragePaths = void 0;
    exports.IExtensionStoragePaths = (0, instantiation_1.createDecorator)('IExtensionStoragePaths');
    let ExtensionStoragePaths = class ExtensionStoragePaths {
        constructor(initData, _logService, _extHostFileSystem) {
            this._logService = _logService;
            this._extHostFileSystem = _extHostFileSystem;
            this._workspace = initData.workspace ?? undefined;
            this._environment = initData.environment;
            this.whenReady = this._getOrCreateWorkspaceStoragePath().then(value => this._value = value);
        }
        async _getWorkspaceStorageURI(storageName) {
            return uri_1.URI.joinPath(this._environment.workspaceStorageHome, storageName);
        }
        async _getOrCreateWorkspaceStoragePath() {
            if (!this._workspace) {
                return Promise.resolve(undefined);
            }
            const storageName = this._workspace.id;
            const storageUri = await this._getWorkspaceStorageURI(storageName);
            try {
                await this._extHostFileSystem.value.stat(storageUri);
                this._logService.trace('[ExtHostStorage] storage dir already exists', storageUri);
                return storageUri;
            }
            catch {
                // doesn't exist, that's OK
            }
            try {
                this._logService.trace('[ExtHostStorage] creating dir and metadata-file', storageUri);
                await this._extHostFileSystem.value.createDirectory(storageUri);
                await this._extHostFileSystem.value.writeFile(uri_1.URI.joinPath(storageUri, 'meta.json'), new TextEncoder().encode(JSON.stringify({
                    id: this._workspace.id,
                    configuration: uri_1.URI.revive(this._workspace.configuration)?.toString(),
                    name: this._workspace.name
                }, undefined, 2)));
                return storageUri;
            }
            catch (e) {
                this._logService.error('[ExtHostStorage]', e);
                return undefined;
            }
        }
        workspaceValue(extension) {
            if (this._value) {
                return uri_1.URI.joinPath(this._value, extension.identifier.value);
            }
            return undefined;
        }
        globalValue(extension) {
            return uri_1.URI.joinPath(this._environment.globalStorageHome, extension.identifier.value.toLowerCase());
        }
        onWillDeactivateAll() {
        }
    };
    exports.ExtensionStoragePaths = ExtensionStoragePaths;
    exports.ExtensionStoragePaths = ExtensionStoragePaths = __decorate([
        __param(0, extHostInitDataService_1.IExtHostInitDataService),
        __param(1, log_1.ILogService),
        __param(2, extHostFileSystemConsumer_1.IExtHostConsumerFileSystem)
    ], ExtensionStoragePaths);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFN0b3JhZ2VQYXRocy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFN0b3JhZ2VQYXRocy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVbkYsUUFBQSxzQkFBc0IsR0FBRyxJQUFBLCtCQUFlLEVBQXlCLHdCQUF3QixDQUFDLENBQUM7SUFVakcsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBcUI7UUFVakMsWUFDMEIsUUFBaUMsRUFDMUIsV0FBd0IsRUFDWCxrQkFBOEM7WUFEM0QsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDWCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQTRCO1lBRTNGLElBQUksQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUM7WUFDbEQsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQztRQUM3RixDQUFDO1FBRVMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLFdBQW1CO1lBQzFELE9BQU8sU0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLG9CQUFvQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFFTyxLQUFLLENBQUMsZ0NBQWdDO1lBQzdDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBQ0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDdkMsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFbkUsSUFBSSxDQUFDO2dCQUNKLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLDZDQUE2QyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNsRixPQUFPLFVBQVUsQ0FBQztZQUNuQixDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNSLDJCQUEyQjtZQUM1QixDQUFDO1lBRUQsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGlEQUFpRCxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN0RixNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUM1QyxTQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsRUFDckMsSUFBSSxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztvQkFDdkMsRUFBRSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDdEIsYUFBYSxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsRUFBRSxRQUFRLEVBQUU7b0JBQ3BFLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUk7aUJBQzFCLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQ2pCLENBQUM7Z0JBQ0YsT0FBTyxVQUFVLENBQUM7WUFFbkIsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO1FBRUQsY0FBYyxDQUFDLFNBQWdDO1lBQzlDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNqQixPQUFPLFNBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlELENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsV0FBVyxDQUFDLFNBQWdDO1lBQzNDLE9BQU8sU0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDcEcsQ0FBQztRQUVELG1CQUFtQjtRQUNuQixDQUFDO0tBQ0QsQ0FBQTtJQXZFWSxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQVcvQixXQUFBLGdEQUF1QixDQUFBO1FBQ3ZCLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsc0RBQTBCLENBQUE7T0FiaEIscUJBQXFCLENBdUVqQyJ9