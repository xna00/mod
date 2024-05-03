/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/welcomeWalkthrough/browser/walkThroughPart", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey"], function (require, exports, editorService_1, walkThroughPart_1, editorContextKeys_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalkThroughPageDown = exports.WalkThroughPageUp = exports.WalkThroughArrowDown = exports.WalkThroughArrowUp = void 0;
    exports.WalkThroughArrowUp = {
        id: 'workbench.action.interactivePlayground.arrowUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 16 /* KeyCode.UpArrow */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.arrowUp();
            }
        }
    };
    exports.WalkThroughArrowDown = {
        id: 'workbench.action.interactivePlayground.arrowDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 18 /* KeyCode.DownArrow */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.arrowDown();
            }
        }
    };
    exports.WalkThroughPageUp = {
        id: 'workbench.action.interactivePlayground.pageUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 11 /* KeyCode.PageUp */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.pageUp();
            }
        }
    };
    exports.WalkThroughPageDown = {
        id: 'workbench.action.interactivePlayground.pageDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 12 /* KeyCode.PageDown */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.pageDown();
            }
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Fsa1Rocm91Z2hBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lV2Fsa3Rocm91Z2gvYnJvd3Nlci93YWxrVGhyb3VnaEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU25GLFFBQUEsa0JBQWtCLEdBQThCO1FBQzVELEVBQUUsRUFBRSxnREFBZ0Q7UUFDcEQsTUFBTSw2Q0FBbUM7UUFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLG9DQUFrQixFQUFFLHFDQUFpQixDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUMzRixPQUFPLDBCQUFpQjtRQUN4QixPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUU7WUFDbkIsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxnQkFBZ0IsR0FBRyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7WUFDeEQsSUFBSSxnQkFBZ0IsWUFBWSxpQ0FBZSxFQUFFLENBQUM7Z0JBQ2pELGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQztJQUVXLFFBQUEsb0JBQW9CLEdBQThCO1FBQzlELEVBQUUsRUFBRSxrREFBa0Q7UUFDdEQsTUFBTSw2Q0FBbUM7UUFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLG9DQUFrQixFQUFFLHFDQUFpQixDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUMzRixPQUFPLDRCQUFtQjtRQUMxQixPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUU7WUFDbkIsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxnQkFBZ0IsR0FBRyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7WUFDeEQsSUFBSSxnQkFBZ0IsWUFBWSxpQ0FBZSxFQUFFLENBQUM7Z0JBQ2pELGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQztJQUVXLFFBQUEsaUJBQWlCLEdBQThCO1FBQzNELEVBQUUsRUFBRSwrQ0FBK0M7UUFDbkQsTUFBTSw2Q0FBbUM7UUFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLG9DQUFrQixFQUFFLHFDQUFpQixDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUMzRixPQUFPLHlCQUFnQjtRQUN2QixPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUU7WUFDbkIsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxnQkFBZ0IsR0FBRyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7WUFDeEQsSUFBSSxnQkFBZ0IsWUFBWSxpQ0FBZSxFQUFFLENBQUM7Z0JBQ2pELGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzNCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQztJQUVXLFFBQUEsbUJBQW1CLEdBQThCO1FBQzdELEVBQUUsRUFBRSxpREFBaUQ7UUFDckQsTUFBTSw2Q0FBbUM7UUFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLG9DQUFrQixFQUFFLHFDQUFpQixDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUMzRixPQUFPLDJCQUFrQjtRQUN6QixPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUU7WUFDbkIsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxnQkFBZ0IsR0FBRyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7WUFDeEQsSUFBSSxnQkFBZ0IsWUFBWSxpQ0FBZSxFQUFFLENBQUM7Z0JBQ2pELGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzdCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQyJ9