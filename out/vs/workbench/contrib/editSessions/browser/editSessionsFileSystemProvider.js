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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/files/common/files", "vs/workbench/contrib/editSessions/common/editSessions", "vs/base/common/errors"], function (require, exports, lifecycle_1, event_1, files_1, editSessions_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditSessionsFileSystemProvider = void 0;
    let EditSessionsFileSystemProvider = class EditSessionsFileSystemProvider {
        static { this.SCHEMA = editSessions_1.EDIT_SESSIONS_SCHEME; }
        constructor(editSessionsStorageService) {
            this.editSessionsStorageService = editSessionsStorageService;
            this.capabilities = 2048 /* FileSystemProviderCapabilities.Readonly */ + 2 /* FileSystemProviderCapabilities.FileReadWrite */;
            //#region Unsupported file operations
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
        }
        async readFile(resource) {
            const match = /(?<ref>[^/]+)\/(?<folderName>[^/]+)\/(?<filePath>.*)/.exec(resource.path.substring(1));
            if (!match?.groups) {
                throw files_1.FileSystemProviderErrorCode.FileNotFound;
            }
            const { ref, folderName, filePath } = match.groups;
            const data = await this.editSessionsStorageService.read('editSessions', ref);
            if (!data) {
                throw files_1.FileSystemProviderErrorCode.FileNotFound;
            }
            const content = JSON.parse(data.content);
            const change = content.folders.find((f) => f.name === folderName)?.workingChanges.find((change) => change.relativeFilePath === filePath);
            if (!change || change.type === editSessions_1.ChangeType.Deletion) {
                throw files_1.FileSystemProviderErrorCode.FileNotFound;
            }
            return (0, editSessions_1.decodeEditSessionFileContent)(content.version, change.contents).buffer;
        }
        async stat(resource) {
            const content = await this.readFile(resource);
            const currentTime = Date.now();
            return {
                type: files_1.FileType.File,
                permissions: files_1.FilePermission.Readonly,
                mtime: currentTime,
                ctime: currentTime,
                size: content.byteLength
            };
        }
        watch(resource, opts) { return lifecycle_1.Disposable.None; }
        async mkdir(resource) { }
        async readdir(resource) { return []; }
        async rename(from, to, opts) { }
        async delete(resource, opts) { }
        async writeFile() {
            throw new errors_1.NotSupportedError();
        }
    };
    exports.EditSessionsFileSystemProvider = EditSessionsFileSystemProvider;
    exports.EditSessionsFileSystemProvider = EditSessionsFileSystemProvider = __decorate([
        __param(0, editSessions_1.IEditSessionsStorageService)
    ], EditSessionsFileSystemProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zRmlsZVN5c3RlbVByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9lZGl0U2Vzc2lvbnMvYnJvd3Nlci9lZGl0U2Vzc2lvbnNGaWxlU3lzdGVtUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQThCO2lCQUUxQixXQUFNLEdBQUcsbUNBQW9CLEFBQXZCLENBQXdCO1FBRTlDLFlBQzhCLDBCQUErRDtZQUF2RCwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBR3BGLGlCQUFZLEdBQW1DLHlHQUFzRixDQUFDO1lBZ0MvSSxxQ0FBcUM7WUFDNUIsNEJBQXVCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNyQyxvQkFBZSxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7UUFwQ2xDLENBQUM7UUFJTCxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQWE7WUFDM0IsTUFBTSxLQUFLLEdBQUcsc0RBQXNELENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEcsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxtQ0FBMkIsQ0FBQyxZQUFZLENBQUM7WUFDaEQsQ0FBQztZQUNELE1BQU0sRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDbkQsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3RSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsTUFBTSxtQ0FBMkIsQ0FBQyxZQUFZLENBQUM7WUFDaEQsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0RCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEtBQUssUUFBUSxDQUFDLENBQUM7WUFDekksSUFBSSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLHlCQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3BELE1BQU0sbUNBQTJCLENBQUMsWUFBWSxDQUFDO1lBQ2hELENBQUM7WUFDRCxPQUFPLElBQUEsMkNBQTRCLEVBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQzlFLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQWE7WUFDdkIsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixPQUFPO2dCQUNOLElBQUksRUFBRSxnQkFBUSxDQUFDLElBQUk7Z0JBQ25CLFdBQVcsRUFBRSxzQkFBYyxDQUFDLFFBQVE7Z0JBQ3BDLEtBQUssRUFBRSxXQUFXO2dCQUNsQixLQUFLLEVBQUUsV0FBVztnQkFDbEIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxVQUFVO2FBQ3hCLENBQUM7UUFDSCxDQUFDO1FBTUQsS0FBSyxDQUFDLFFBQWEsRUFBRSxJQUFtQixJQUFpQixPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUVsRixLQUFLLENBQUMsS0FBSyxDQUFDLFFBQWEsSUFBbUIsQ0FBQztRQUM3QyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQWEsSUFBbUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRTFFLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBUyxFQUFFLEVBQU8sRUFBRSxJQUEyQixJQUFtQixDQUFDO1FBQ2hGLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBYSxFQUFFLElBQXdCLElBQW1CLENBQUM7UUFFeEUsS0FBSyxDQUFDLFNBQVM7WUFDZCxNQUFNLElBQUksMEJBQWlCLEVBQUUsQ0FBQztRQUMvQixDQUFDOztJQXREVyx3RUFBOEI7NkNBQTlCLDhCQUE4QjtRQUt4QyxXQUFBLDBDQUEyQixDQUFBO09BTGpCLDhCQUE4QixDQXdEMUMifQ==