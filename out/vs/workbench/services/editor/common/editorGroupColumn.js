/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.columnToEditorGroup = columnToEditorGroup;
    exports.editorGroupToColumn = editorGroupToColumn;
    function columnToEditorGroup(editorGroupService, configurationService, column = editorService_1.ACTIVE_GROUP) {
        if (column === editorService_1.ACTIVE_GROUP || column === editorService_1.SIDE_GROUP) {
            return column; // return early for when column is well known
        }
        let groupInColumn = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[column];
        // If a column is asked for that does not exist, we create up to 9 columns in accordance
        // to what `ViewColumn` provides and otherwise fallback to `SIDE_GROUP`.
        if (!groupInColumn && column < 9) {
            for (let i = 0; i <= column; i++) {
                const editorGroups = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
                if (!editorGroups[i]) {
                    editorGroupService.addGroup(editorGroups[i - 1], (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService));
                }
            }
            groupInColumn = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[column];
        }
        return groupInColumn?.id ?? editorService_1.SIDE_GROUP; // finally open to the side when group not found
    }
    function editorGroupToColumn(editorGroupService, editorGroup) {
        const group = (typeof editorGroup === 'number') ? editorGroupService.getGroup(editorGroup) : editorGroup;
        return editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */).indexOf(group ?? editorGroupService.activeGroup);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBDb2x1bW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9lZGl0b3IvY29tbW9uL2VkaXRvckdyb3VwQ29sdW1uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLGtEQXNCQztJQUVELGtEQUlDO0lBNUJELFNBQWdCLG1CQUFtQixDQUFDLGtCQUF3QyxFQUFFLG9CQUEyQyxFQUFFLE1BQU0sR0FBRyw0QkFBWTtRQUMvSSxJQUFJLE1BQU0sS0FBSyw0QkFBWSxJQUFJLE1BQU0sS0FBSywwQkFBVSxFQUFFLENBQUM7WUFDdEQsT0FBTyxNQUFNLENBQUMsQ0FBQyw2Q0FBNkM7UUFDN0QsQ0FBQztRQUVELElBQUksYUFBYSxHQUFHLGtCQUFrQixDQUFDLFNBQVMscUNBQTZCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFdEYsd0ZBQXdGO1FBQ3hGLHdFQUF3RTtRQUV4RSxJQUFJLENBQUMsYUFBYSxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sWUFBWSxHQUFHLGtCQUFrQixDQUFDLFNBQVMscUNBQTZCLENBQUM7Z0JBQy9FLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDdEIsa0JBQWtCLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBQSx1REFBaUMsRUFBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzNHLENBQUM7WUFDRixDQUFDO1lBRUQsYUFBYSxHQUFHLGtCQUFrQixDQUFDLFNBQVMscUNBQTZCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUVELE9BQU8sYUFBYSxFQUFFLEVBQUUsSUFBSSwwQkFBVSxDQUFDLENBQUMsZ0RBQWdEO0lBQ3pGLENBQUM7SUFFRCxTQUFnQixtQkFBbUIsQ0FBQyxrQkFBd0MsRUFBRSxXQUEyQztRQUN4SCxNQUFNLEtBQUssR0FBRyxDQUFDLE9BQU8sV0FBVyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztRQUV6RyxPQUFPLGtCQUFrQixDQUFDLFNBQVMscUNBQTZCLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNuSCxDQUFDIn0=