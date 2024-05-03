/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/workbench/contrib/comments/browser/commentFormActions", "vs/platform/keybinding/common/keybinding"], function (require, exports, dom, lifecycle_1, commentFormActions_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentThreadAdditionalActions = void 0;
    let CommentThreadAdditionalActions = class CommentThreadAdditionalActions extends lifecycle_1.Disposable {
        constructor(container, _commentThread, _contextKeyService, _commentMenus, _actionRunDelegate, _keybindingService) {
            super();
            this._commentThread = _commentThread;
            this._contextKeyService = _contextKeyService;
            this._commentMenus = _commentMenus;
            this._actionRunDelegate = _actionRunDelegate;
            this._keybindingService = _keybindingService;
            this._container = dom.append(container, dom.$('.comment-additional-actions'));
            dom.append(this._container, dom.$('.section-separator'));
            this._buttonBar = dom.append(this._container, dom.$('.button-bar'));
            this._createAdditionalActions(this._buttonBar);
        }
        _showMenu() {
            this._container?.classList.remove('hidden');
        }
        _hideMenu() {
            this._container?.classList.add('hidden');
        }
        _enableDisableMenu(menu) {
            const groups = menu.getActions({ shouldForwardArgs: true });
            // Show the menu if at least one action is enabled.
            for (const group of groups) {
                const [, actions] = group;
                for (const action of actions) {
                    if (action.enabled) {
                        this._showMenu();
                        return;
                    }
                    for (const subAction of action.actions ?? []) {
                        if (subAction.enabled) {
                            this._showMenu();
                            return;
                        }
                    }
                }
            }
            this._hideMenu();
        }
        _createAdditionalActions(container) {
            const menu = this._commentMenus.getCommentThreadAdditionalActions(this._contextKeyService);
            this._register(menu);
            this._register(menu.onDidChange(() => {
                this._commentFormActions.setActions(menu, /*hasOnlySecondaryActions*/ true);
                this._enableDisableMenu(menu);
            }));
            this._commentFormActions = new commentFormActions_1.CommentFormActions(this._keybindingService, this._contextKeyService, container, async (action) => {
                this._actionRunDelegate?.();
                action.run({
                    thread: this._commentThread,
                    $mid: 8 /* MarshalledId.CommentThreadInstance */
                });
            }, 4);
            this._register(this._commentFormActions);
            this._commentFormActions.setActions(menu, /*hasOnlySecondaryActions*/ true);
            this._enableDisableMenu(menu);
        }
    };
    exports.CommentThreadAdditionalActions = CommentThreadAdditionalActions;
    exports.CommentThreadAdditionalActions = CommentThreadAdditionalActions = __decorate([
        __param(5, keybinding_1.IKeybindingService)
    ], CommentThreadAdditionalActions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudFRocmVhZEFkZGl0aW9uYWxBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRUaHJlYWRBZGRpdGlvbmFsQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQnpGLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQThELFNBQVEsc0JBQVU7UUFLNUYsWUFDQyxTQUFzQixFQUNkLGNBQTBDLEVBQzFDLGtCQUFzQyxFQUN0QyxhQUEyQixFQUMzQixrQkFBdUMsRUFDbkIsa0JBQXNDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBTkEsbUJBQWMsR0FBZCxjQUFjLENBQTRCO1lBQzFDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDdEMsa0JBQWEsR0FBYixhQUFhLENBQWM7WUFDM0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUNuQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBSWxFLElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUM7WUFDOUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBRXpELElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FB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