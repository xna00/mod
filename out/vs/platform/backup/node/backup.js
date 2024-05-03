/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isEmptyWindowBackupInfo = isEmptyWindowBackupInfo;
    exports.deserializeWorkspaceInfos = deserializeWorkspaceInfos;
    exports.deserializeFolderInfos = deserializeFolderInfos;
    function isEmptyWindowBackupInfo(obj) {
        const candidate = obj;
        return typeof candidate?.backupFolder === 'string';
    }
    function deserializeWorkspaceInfos(serializedBackupWorkspaces) {
        let workspaceBackupInfos = [];
        try {
            if (Array.isArray(serializedBackupWorkspaces.workspaces)) {
                workspaceBackupInfos = serializedBackupWorkspaces.workspaces.map(workspace => ({
                    workspace: {
                        id: workspace.id,
                        configPath: uri_1.URI.parse(workspace.configURIPath)
                    },
                    remoteAuthority: workspace.remoteAuthority
                }));
            }
        }
        catch (e) {
            // ignore URI parsing exceptions
        }
        return workspaceBackupInfos;
    }
    function deserializeFolderInfos(serializedBackupWorkspaces) {
        let folderBackupInfos = [];
        try {
            if (Array.isArray(serializedBackupWorkspaces.folders)) {
                folderBackupInfos = serializedBackupWorkspaces.folders.map(folder => ({
                    folderUri: uri_1.URI.parse(folder.folderUri),
                    remoteAuthority: folder.remoteAuthority
                }));
            }
        }
        catch (e) {
            // ignore URI parsing exceptions
        }
        return folderBackupInfos;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja3VwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9iYWNrdXAvbm9kZS9iYWNrdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsMERBSUM7SUFRRCw4REFtQkM7SUFPRCx3REFnQkM7SUF0REQsU0FBZ0IsdUJBQXVCLENBQUMsR0FBWTtRQUNuRCxNQUFNLFNBQVMsR0FBRyxHQUF5QyxDQUFDO1FBRTVELE9BQU8sT0FBTyxTQUFTLEVBQUUsWUFBWSxLQUFLLFFBQVEsQ0FBQztJQUNwRCxDQUFDO0lBUUQsU0FBZ0IseUJBQXlCLENBQUMsMEJBQXVEO1FBQ2hHLElBQUksb0JBQW9CLEdBQTJCLEVBQUUsQ0FBQztRQUN0RCxJQUFJLENBQUM7WUFDSixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDMUQsb0JBQW9CLEdBQUcsMEJBQTBCLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQzdFO29CQUNDLFNBQVMsRUFBRTt3QkFDVixFQUFFLEVBQUUsU0FBUyxDQUFDLEVBQUU7d0JBQ2hCLFVBQVUsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7cUJBQzlDO29CQUNELGVBQWUsRUFBRSxTQUFTLENBQUMsZUFBZTtpQkFDMUMsQ0FDRCxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWixnQ0FBZ0M7UUFDakMsQ0FBQztRQUVELE9BQU8sb0JBQW9CLENBQUM7SUFDN0IsQ0FBQztJQU9ELFNBQWdCLHNCQUFzQixDQUFDLDBCQUF1RDtRQUM3RixJQUFJLGlCQUFpQixHQUF3QixFQUFFLENBQUM7UUFDaEQsSUFBSSxDQUFDO1lBQ0osSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELGlCQUFpQixHQUFHLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUNwRTtvQkFDQyxTQUFTLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDO29CQUN0QyxlQUFlLEVBQUUsTUFBTSxDQUFDLGVBQWU7aUJBQ3ZDLENBQ0QsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1osZ0NBQWdDO1FBQ2pDLENBQUM7UUFFRCxPQUFPLGlCQUFpQixDQUFDO0lBQzFCLENBQUMifQ==