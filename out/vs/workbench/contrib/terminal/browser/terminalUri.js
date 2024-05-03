/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseTerminalUri = parseTerminalUri;
    exports.getTerminalUri = getTerminalUri;
    exports.getTerminalResourcesFromDragEvent = getTerminalResourcesFromDragEvent;
    exports.getInstanceFromResource = getInstanceFromResource;
    function parseTerminalUri(resource) {
        const [, workspaceId, instanceId] = resource.path.split('/');
        if (!workspaceId || !Number.parseInt(instanceId)) {
            throw new Error(`Could not parse terminal uri for resource ${resource}`);
        }
        return { workspaceId, instanceId: Number.parseInt(instanceId) };
    }
    function getTerminalUri(workspaceId, instanceId, title) {
        return uri_1.URI.from({
            scheme: network_1.Schemas.vscodeTerminal,
            path: `/${workspaceId}/${instanceId}`,
            fragment: title || undefined,
        });
    }
    function getTerminalResourcesFromDragEvent(event) {
        const resources = event.dataTransfer?.getData("Terminals" /* TerminalDataTransfers.Terminals */);
        if (resources) {
            const json = JSON.parse(resources);
            const result = [];
            for (const entry of json) {
                result.push(uri_1.URI.parse(entry));
            }
            return result.length === 0 ? undefined : result;
        }
        return undefined;
    }
    function getInstanceFromResource(instances, resource) {
        if (resource) {
            for (const instance of instances) {
                // Note that the URI's workspace and instance id might not originally be from this window
                // Don't bother checking the scheme and assume instances only contains terminals
                if (instance.resource.path === resource.path) {
                    return instance;
                }
            }
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxVcmkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxVcmkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsNENBTUM7SUFFRCx3Q0FNQztJQVdELDhFQVdDO0lBRUQsMERBV0M7SUFqREQsU0FBZ0IsZ0JBQWdCLENBQUMsUUFBYTtRQUM3QyxNQUFNLENBQUMsRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFDLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUNsRCxNQUFNLElBQUksS0FBSyxDQUFDLDZDQUE2QyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFDRCxPQUFPLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7SUFDakUsQ0FBQztJQUVELFNBQWdCLGNBQWMsQ0FBQyxXQUFtQixFQUFFLFVBQWtCLEVBQUUsS0FBYztRQUNyRixPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZixNQUFNLEVBQUUsaUJBQU8sQ0FBQyxjQUFjO1lBQzlCLElBQUksRUFBRSxJQUFJLFdBQVcsSUFBSSxVQUFVLEVBQUU7WUFDckMsUUFBUSxFQUFFLEtBQUssSUFBSSxTQUFTO1NBQzVCLENBQUMsQ0FBQztJQUNKLENBQUM7SUFXRCxTQUFnQixpQ0FBaUMsQ0FBQyxLQUF3QjtRQUN6RSxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsWUFBWSxFQUFFLE9BQU8sbURBQWlDLENBQUM7UUFDL0UsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNmLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkMsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNqRCxDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVELFNBQWdCLHVCQUF1QixDQUFnRCxTQUFjLEVBQUUsUUFBeUI7UUFDL0gsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNkLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2xDLHlGQUF5RjtnQkFDekYsZ0ZBQWdGO2dCQUNoRixJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDOUMsT0FBTyxRQUFRLENBQUM7Z0JBQ2pCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUMifQ==