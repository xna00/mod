/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/editor/common/editorService", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions"], function (require, exports, nls_1, keybinding_1, editorService_1, actionCommonCategories_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class InspectKeyMap extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.inspectKeyMappings',
                title: (0, nls_1.localize2)('workbench.action.inspectKeyMap', 'Inspect Key Mappings'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor, editor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const editorService = accessor.get(editorService_1.IEditorService);
            editorService.openEditor({ resource: undefined, contents: keybindingService._dumpDebugInfo(), options: { pinned: true } });
        }
    }
    (0, actions_1.registerAction2)(InspectKeyMap);
    class InspectKeyMapJSON extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.inspectKeyMappingsJSON',
                title: (0, nls_1.localize2)('workbench.action.inspectKeyMapJSON', 'Inspect Key Mappings (JSON)'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            await editorService.openEditor({ resource: undefined, contents: keybindingService._dumpDebugInfoJSON(), options: { pinned: true } });
        }
    }
    (0, actions_1.registerAction2)(InspectKeyMapJSON);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdEtleWJpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlRWRpdG9yL2Jyb3dzZXIvaW5zcGVjdEtleWJpbmRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLE1BQU0sYUFBYyxTQUFRLGlCQUFPO1FBRWxDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxxQ0FBcUM7Z0JBQ3pDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxnQ0FBZ0MsRUFBRSxzQkFBc0IsQ0FBQztnQkFDMUUsUUFBUSxFQUFFLG1DQUFVLENBQUMsU0FBUztnQkFDOUIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCLEVBQUUsTUFBbUI7WUFDbEQsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7WUFDM0QsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFFbkQsYUFBYSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUgsQ0FBQztLQUNEO0lBRUQsSUFBQSx5QkFBZSxFQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRS9CLE1BQU0saUJBQWtCLFNBQVEsaUJBQU87UUFFdEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHlDQUF5QztnQkFDN0MsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLG9DQUFvQyxFQUFFLDZCQUE2QixDQUFDO2dCQUNyRixRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO2dCQUM5QixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQzVDLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBRTNELE1BQU0sYUFBYSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixDQUFDLGtCQUFrQixFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0SSxDQUFDO0tBQ0Q7SUFFRCxJQUFBLHlCQUFlLEVBQUMsaUJBQWlCLENBQUMsQ0FBQyJ9