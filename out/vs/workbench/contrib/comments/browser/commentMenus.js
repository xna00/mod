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
define(["require", "exports", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem"], function (require, exports, actions_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentMenus = void 0;
    let CommentMenus = class CommentMenus {
        constructor(menuService) {
            this.menuService = menuService;
        }
        getCommentThreadTitleActions(contextKeyService) {
            return this.getMenu(actions_1.MenuId.CommentThreadTitle, contextKeyService);
        }
        getCommentThreadActions(contextKeyService) {
            return this.getMenu(actions_1.MenuId.CommentThreadActions, contextKeyService);
        }
        getCommentEditorActions(contextKeyService) {
            return this.getMenu(actions_1.MenuId.CommentEditorActions, contextKeyService);
        }
        getCommentThreadAdditionalActions(contextKeyService) {
            return this.getMenu(actions_1.MenuId.CommentThreadAdditionalActions, contextKeyService);
        }
        getCommentTitleActions(comment, contextKeyService) {
            return this.getMenu(actions_1.MenuId.CommentTitle, contextKeyService);
        }
        getCommentActions(comment, contextKeyService) {
            return this.getMenu(actions_1.MenuId.CommentActions, contextKeyService);
        }
        getCommentThreadTitleContextActions(contextKeyService) {
            return this.getMenu(actions_1.MenuId.CommentThreadTitleContext, contextKeyService);
        }
        getMenu(menuId, contextKeyService) {
            const menu = this.menuService.createMenu(menuId, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, result, 'inline');
            return menu;
        }
        dispose() {
        }
    };
    exports.CommentMenus = CommentMenus;
    exports.CommentMenus = CommentMenus = __decorate([
        __param(0, actions_1.IMenuService)
    ], CommentMenus);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudE1lbnVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRNZW51cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTekYsSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBWTtRQUN4QixZQUNnQyxXQUF5QjtZQUF6QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztRQUNyRCxDQUFDO1FBRUwsNEJBQTRCLENBQUMsaUJBQXFDO1lBQ2pFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBTSxDQUFDLGtCQUFrQixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELHVCQUF1QixDQUFDLGlCQUFxQztZQUM1RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQU0sQ0FBQyxvQkFBb0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFFRCx1QkFBdUIsQ0FBQyxpQkFBcUM7WUFDNUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFNLENBQUMsb0JBQW9CLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBRUQsaUNBQWlDLENBQUMsaUJBQXFDO1lBQ3RFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBTSxDQUFDLDhCQUE4QixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUVELHNCQUFzQixDQUFDLE9BQWdCLEVBQUUsaUJBQXFDO1lBQzdFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBTSxDQUFDLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxPQUFnQixFQUFFLGlCQUFxQztZQUN4RSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQU0sQ0FBQyxjQUFjLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQsbUNBQW1DLENBQUMsaUJBQXFDO1lBQ3hFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBTSxDQUFDLHlCQUF5QixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUVPLE9BQU8sQ0FBQyxNQUFjLEVBQUUsaUJBQXFDO1lBQ3BFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBRXBFLE1BQU0sT0FBTyxHQUFjLEVBQUUsQ0FBQztZQUM5QixNQUFNLFNBQVMsR0FBYyxFQUFFLENBQUM7WUFDaEMsTUFBTSxNQUFNLEdBQUcsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLENBQUM7WUFFdEMsSUFBQSwyREFBaUMsRUFBQyxJQUFJLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFdkYsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsT0FBTztRQUVQLENBQUM7S0FDRCxDQUFBO0lBaERZLG9DQUFZOzJCQUFaLFlBQVk7UUFFdEIsV0FBQSxzQkFBWSxDQUFBO09BRkYsWUFBWSxDQWdEeEIifQ==