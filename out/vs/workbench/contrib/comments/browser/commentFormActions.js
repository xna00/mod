/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/button/button", "vs/base/common/lifecycle", "vs/platform/theme/browser/defaultStyles"], function (require, exports, button_1, lifecycle_1, defaultStyles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentFormActions = void 0;
    class CommentFormActions {
        constructor(keybindingService, contextKeyService, container, actionHandler, maxActions) {
            this.keybindingService = keybindingService;
            this.contextKeyService = contextKeyService;
            this.container = container;
            this.actionHandler = actionHandler;
            this.maxActions = maxActions;
            this._buttonElements = [];
            this._toDispose = new lifecycle_1.DisposableStore();
            this._actions = [];
        }
        setActions(menu, hasOnlySecondaryActions = false) {
            this._toDispose.clear();
            this._buttonElements.forEach(b => b.remove());
            this._buttonElements = [];
            const groups = menu.getActions({ shouldForwardArgs: true });
            let isPrimary = !hasOnlySecondaryActions;
            for (const group of groups) {
                const [, actions] = group;
                this._actions = actions;
                for (const action of actions) {
                    let keybinding = this.keybindingService.lookupKeybinding(action.id, this.contextKeyService)?.getLabel();
                    if (!keybinding && isPrimary) {
                        keybinding = this.keybindingService.lookupKeybinding("editor.action.submitComment" /* CommentCommandId.Submit */, this.contextKeyService)?.getLabel();
                    }
                    const title = keybinding ? `${action.label} (${keybinding})` : action.label;
                    const button = new button_1.Button(this.container, { secondary: !isPrimary, title, ...defaultStyles_1.defaultButtonStyles });
                    isPrimary = false;
                    this._buttonElements.push(button.element);
                    this._toDispose.add(button);
                    this._toDispose.add(button.onDidClick(() => this.actionHandler(action)));
                    button.enabled = action.enabled;
                    button.label = action.label;
                    if ((this.maxActions !== undefined) && (this._buttonElements.length >= this.maxActions)) {
                        console.warn(`An extension has contributed more than the allowable number of actions to a comments menu.`);
                        return;
                    }
                }
            }
        }
        triggerDefaultAction() {
            if (this._actions.length) {
                const lastAction = this._actions[0];
                if (lastAction.enabled) {
                    return this.actionHandler(lastAction);
                }
            }
        }
        dispose() {
            this._toDispose.dispose();
        }
    }
    exports.CommentFormActions = CommentFormActions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudEZvcm1BY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRGb3JtQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxrQkFBa0I7UUFLOUIsWUFDa0IsaUJBQXFDLEVBQ3JDLGlCQUFxQyxFQUM5QyxTQUFzQixFQUN0QixhQUF3QyxFQUMvQixVQUFtQjtZQUpuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3JDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDOUMsY0FBUyxHQUFULFNBQVMsQ0FBYTtZQUN0QixrQkFBYSxHQUFiLGFBQWEsQ0FBMkI7WUFDL0IsZUFBVSxHQUFWLFVBQVUsQ0FBUztZQVQ3QixvQkFBZSxHQUFrQixFQUFFLENBQUM7WUFDM0IsZUFBVSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzVDLGFBQVEsR0FBYyxFQUFFLENBQUM7UUFRN0IsQ0FBQztRQUVMLFVBQVUsQ0FBQyxJQUFXLEVBQUUsMEJBQW1DLEtBQUs7WUFDL0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUV4QixJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxlQUFlLEdBQUcsRUFBRSxDQUFDO1lBRTFCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzVELElBQUksU0FBUyxHQUFZLENBQUMsdUJBQXVCLENBQUM7WUFDbEQsS0FBSyxNQUFNLEtBQUss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