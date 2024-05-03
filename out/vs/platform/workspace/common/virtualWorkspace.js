/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isVirtualResource = isVirtualResource;
    exports.getVirtualWorkspaceLocation = getVirtualWorkspaceLocation;
    exports.getVirtualWorkspaceScheme = getVirtualWorkspaceScheme;
    exports.getVirtualWorkspaceAuthority = getVirtualWorkspaceAuthority;
    exports.isVirtualWorkspace = isVirtualWorkspace;
    function isVirtualResource(resource) {
        return resource.scheme !== network_1.Schemas.file && resource.scheme !== network_1.Schemas.vscodeRemote;
    }
    function getVirtualWorkspaceLocation(workspace) {
        if (workspace.folders.length) {
            return workspace.folders.every(f => isVirtualResource(f.uri)) ? workspace.folders[0].uri : undefined;
        }
        else if (workspace.configuration && isVirtualResource(workspace.configuration)) {
            return workspace.configuration;
        }
        return undefined;
    }
    function getVirtualWorkspaceScheme(workspace) {
        return getVirtualWorkspaceLocation(workspace)?.scheme;
    }
    function getVirtualWorkspaceAuthority(workspace) {
        return getVirtualWorkspaceLocation(workspace)?.authority;
    }
    function isVirtualWorkspace(workspace) {
        return getVirtualWorkspaceLocation(workspace) !== undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbFdvcmtzcGFjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd29ya3NwYWNlL2NvbW1vbi92aXJ0dWFsV29ya3NwYWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLDhDQUVDO0lBRUQsa0VBT0M7SUFFRCw4REFFQztJQUVELG9FQUVDO0lBRUQsZ0RBRUM7SUF2QkQsU0FBZ0IsaUJBQWlCLENBQUMsUUFBYTtRQUM5QyxPQUFPLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFlBQVksQ0FBQztJQUNyRixDQUFDO0lBRUQsU0FBZ0IsMkJBQTJCLENBQUMsU0FBcUI7UUFDaEUsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzlCLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUN0RyxDQUFDO2FBQU0sSUFBSSxTQUFTLENBQUMsYUFBYSxJQUFJLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO1lBQ2xGLE9BQU8sU0FBUyxDQUFDLGFBQWEsQ0FBQztRQUNoQyxDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVELFNBQWdCLHlCQUF5QixDQUFDLFNBQXFCO1FBQzlELE9BQU8sMkJBQTJCLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxDQUFDO0lBQ3ZELENBQUM7SUFFRCxTQUFnQiw0QkFBNEIsQ0FBQyxTQUFxQjtRQUNqRSxPQUFPLDJCQUEyQixDQUFDLFNBQVMsQ0FBQyxFQUFFLFNBQVMsQ0FBQztJQUMxRCxDQUFDO0lBRUQsU0FBZ0Isa0JBQWtCLENBQUMsU0FBcUI7UUFDdkQsT0FBTywyQkFBMkIsQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLENBQUM7SUFDN0QsQ0FBQyJ9