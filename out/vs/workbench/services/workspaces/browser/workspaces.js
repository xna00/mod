/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/hash"], function (require, exports, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getWorkspaceIdentifier = getWorkspaceIdentifier;
    exports.getSingleFolderWorkspaceIdentifier = getSingleFolderWorkspaceIdentifier;
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // NOTE: DO NOT CHANGE. IDENTIFIERS HAVE TO REMAIN STABLE
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    function getWorkspaceIdentifier(workspaceUri) {
        return {
            id: getWorkspaceId(workspaceUri),
            configPath: workspaceUri
        };
    }
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // NOTE: DO NOT CHANGE. IDENTIFIERS HAVE TO REMAIN STABLE
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    function getSingleFolderWorkspaceIdentifier(folderUri) {
        return {
            id: getWorkspaceId(folderUri),
            uri: folderUri
        };
    }
    function getWorkspaceId(uri) {
        return (0, hash_1.hash)(uri.toString()).toString(16);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtzcGFjZXMvYnJvd3Nlci93b3Jrc3BhY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLHdEQUtDO0lBTUQsZ0ZBS0M7SUFwQkQseURBQXlEO0lBQ3pELHlEQUF5RDtJQUN6RCx5REFBeUQ7SUFFekQsU0FBZ0Isc0JBQXNCLENBQUMsWUFBaUI7UUFDdkQsT0FBTztZQUNOLEVBQUUsRUFBRSxjQUFjLENBQUMsWUFBWSxDQUFDO1lBQ2hDLFVBQVUsRUFBRSxZQUFZO1NBQ3hCLENBQUM7SUFDSCxDQUFDO0lBRUQseURBQXlEO0lBQ3pELHlEQUF5RDtJQUN6RCx5REFBeUQ7SUFFekQsU0FBZ0Isa0NBQWtDLENBQUMsU0FBYztRQUNoRSxPQUFPO1lBQ04sRUFBRSxFQUFFLGNBQWMsQ0FBQyxTQUFTLENBQUM7WUFDN0IsR0FBRyxFQUFFLFNBQVM7U0FDZCxDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFDLEdBQVE7UUFDL0IsT0FBTyxJQUFBLFdBQUksRUFBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDMUMsQ0FBQyJ9