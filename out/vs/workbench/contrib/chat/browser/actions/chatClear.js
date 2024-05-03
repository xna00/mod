/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, chatEditorInput_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.clearChatEditor = clearChatEditor;
    async function clearChatEditor(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const chatEditorInput = editorService.activeEditor;
        if (chatEditorInput instanceof chatEditorInput_1.ChatEditorInput && chatEditorInput.providerId) {
            await editorService.replaceEditors([{
                    editor: chatEditorInput,
                    replacement: { resource: chatEditorInput_1.ChatEditorInput.getNewEditorUri(), options: { target: { providerId: chatEditorInput.providerId, pinned: true } } }
                }], editorGroupsService.activeGroup);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdENsZWFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvYWN0aW9ucy9jaGF0Q2xlYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsMENBV0M7SUFYTSxLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQTBCO1FBQy9ELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQ0FBb0IsQ0FBQyxDQUFDO1FBRS9ELE1BQU0sZUFBZSxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUM7UUFDbkQsSUFBSSxlQUFlLFlBQVksaUNBQWUsSUFBSSxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDOUUsTUFBTSxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQ25DLE1BQU0sRUFBRSxlQUFlO29CQUN2QixXQUFXLEVBQUUsRUFBRSxRQUFRLEVBQUUsaUNBQWUsQ0FBQyxlQUFlLEVBQUUsRUFBRSxPQUFPLEVBQXNCLEVBQUUsTUFBTSxFQUFFLEVBQUUsVUFBVSxFQUFFLGVBQWUsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUU7aUJBQy9KLENBQUMsRUFBRSxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN0QyxDQUFDO0lBQ0YsQ0FBQyJ9