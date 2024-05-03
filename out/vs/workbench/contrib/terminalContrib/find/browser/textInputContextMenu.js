/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/common/actions", "vs/base/common/platform", "vs/nls"], function (require, exports, dom_1, mouseEvent_1, actions_1, platform_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.openContextMenu = openContextMenu;
    function openContextMenu(targetWindow, event, clipboardService, contextMenuService) {
        const standardEvent = new mouseEvent_1.StandardMouseEvent(targetWindow, event);
        // Actions from workbench/browser/actions/textInputActions
        const actions = [];
        actions.push(
        // Undo/Redo
        new actions_1.Action('undo', (0, nls_1.localize)('undo', "Undo"), undefined, true, async () => (0, dom_1.getActiveWindow)().document.execCommand('undo')), new actions_1.Action('redo', (0, nls_1.localize)('redo', "Redo"), undefined, true, async () => (0, dom_1.getActiveWindow)().document.execCommand('redo')), new actions_1.Separator(), 
        // Cut / Copy / Paste
        new actions_1.Action('editor.action.clipboardCutAction', (0, nls_1.localize)('cut', "Cut"), undefined, true, async () => (0, dom_1.getActiveWindow)().document.execCommand('cut')), new actions_1.Action('editor.action.clipboardCopyAction', (0, nls_1.localize)('copy', "Copy"), undefined, true, async () => (0, dom_1.getActiveWindow)().document.execCommand('copy')), new actions_1.Action('editor.action.clipboardPasteAction', (0, nls_1.localize)('paste', "Paste"), undefined, true, async (element) => {
            // Native: paste is supported
            if (platform_1.isNative) {
                (0, dom_1.getActiveWindow)().document.execCommand('paste');
            }
            // Web: paste is not supported due to security reasons
            else {
                const clipboardText = await clipboardService.readText();
                if (element instanceof HTMLTextAreaElement ||
                    element instanceof HTMLInputElement) {
                    const selectionStart = element.selectionStart || 0;
                    const selectionEnd = element.selectionEnd || 0;
                    element.value = `${element.value.substring(0, selectionStart)}${clipboardText}${element.value.substring(selectionEnd, element.value.length)}`;
                    element.selectionStart = selectionStart + clipboardText.length;
                    element.selectionEnd = element.selectionStart;
                }
            }
        }), new actions_1.Separator(), 
        // Select All
        new actions_1.Action('editor.action.selectAll', (0, nls_1.localize)('selectAll', "Select All"), undefined, true, async () => (0, dom_1.getActiveWindow)().document.execCommand('selectAll')));
        contextMenuService.showContextMenu({
            getAnchor: () => standardEvent,
            getActions: () => actions,
            getActionsContext: () => event.target,
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dElucHV0Q29udGV4dE1lbnUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9maW5kL2Jyb3dzZXIvdGV4dElucHV0Q29udGV4dE1lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsMENBaURDO0lBakRELFNBQWdCLGVBQWUsQ0FBQyxZQUFvQixFQUFFLEtBQWlCLEVBQUUsZ0JBQW1DLEVBQUUsa0JBQXVDO1FBQ3BKLE1BQU0sYUFBYSxHQUFHLElBQUksK0JBQWtCLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWxFLDBEQUEwRDtRQUMxRCxNQUFNLE9BQU8sR0FBYyxFQUFFLENBQUM7UUFDOUIsT0FBTyxDQUFDLElBQUk7UUFFWCxZQUFZO1FBQ1osSUFBSSxnQkFBTSxDQUFDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLElBQUEscUJBQWUsR0FBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsRUFDekgsSUFBSSxnQkFBTSxDQUFDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLElBQUEscUJBQWUsR0FBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsRUFDekgsSUFBSSxtQkFBUyxFQUFFO1FBRWYscUJBQXFCO1FBQ3JCLElBQUksZ0JBQU0sQ0FBQyxrQ0FBa0MsRUFBRSxJQUFBLGNBQVEsRUFBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLElBQUEscUJBQWUsR0FBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsRUFDbEosSUFBSSxnQkFBTSxDQUFDLG1DQUFtQyxFQUFFLElBQUEsY0FBUSxFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsSUFBQSxxQkFBZSxHQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUN0SixJQUFJLGdCQUFNLENBQUMsb0NBQW9DLEVBQUUsSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDLE9BQU8sRUFBQyxFQUFFO1lBRTdHLDZCQUE2QjtZQUM3QixJQUFJLG1CQUFRLEVBQUUsQ0FBQztnQkFDZCxJQUFBLHFCQUFlLEdBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFFRCxzREFBc0Q7aUJBQ2pELENBQUM7Z0JBQ0wsTUFBTSxhQUFhLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDeEQsSUFDQyxPQUFPLFlBQVksbUJBQW1CO29CQUN0QyxPQUFPLFlBQVksZ0JBQWdCLEVBQ2xDLENBQUM7b0JBQ0YsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLGNBQWMsSUFBSSxDQUFDLENBQUM7b0JBQ25ELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLElBQUksQ0FBQyxDQUFDO29CQUUvQyxPQUFPLENBQUMsS0FBSyxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxHQUFHLGFBQWEsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUM5SSxPQUFPLENBQUMsY0FBYyxHQUFHLGNBQWMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDO29CQUMvRCxPQUFPLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7Z0JBQy9DLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQyxDQUFDLEVBQ0YsSUFBSSxtQkFBUyxFQUFFO1FBRWYsYUFBYTtRQUNiLElBQUksZ0JBQU0sQ0FBQyx5QkFBeUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLElBQUEscUJBQWUsR0FBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FDNUosQ0FBQztRQUVGLGtCQUFrQixDQUFDLGVBQWUsQ0FBQztZQUNsQyxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsYUFBYTtZQUM5QixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTztZQUN6QixpQkFBaUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTTtTQUNyQyxDQUFDLENBQUM7SUFDSixDQUFDIn0=