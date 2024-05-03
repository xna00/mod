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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/platform/layout/browser/layoutService", "vs/platform/registry/common/platform", "vs/workbench/common/contributions"], function (require, exports, lifecycle_1, contextView_1, layoutService_1, platform_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ContextMenuContribution = class ContextMenuContribution {
        constructor(layoutService, contextMenuService) {
            this.disposables = new lifecycle_1.DisposableStore();
            const update = (visible) => layoutService.activeContainer.classList.toggle('context-menu-visible', visible);
            contextMenuService.onDidShowContextMenu(() => update(true), null, this.disposables);
            contextMenuService.onDidHideContextMenu(() => update(false), null, this.disposables);
        }
    };
    ContextMenuContribution = __decorate([
        __param(0, layoutService_1.ILayoutService),
        __param(1, contextView_1.IContextMenuService)
    ], ContextMenuContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(ContextMenuContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dG1lbnUuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb250ZXh0bWVudS9icm93c2VyL2NvbnRleHRtZW51LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQVNoRyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQUk1QixZQUNpQixhQUE2QixFQUN4QixrQkFBdUM7WUFKNUMsZ0JBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQU1wRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE9BQWdCLEVBQUUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNySCxrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNwRixrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN0RixDQUFDO0tBQ0QsQ0FBQTtJQVpLLHVCQUF1QjtRQUsxQixXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLGlDQUFtQixDQUFBO09BTmhCLHVCQUF1QixDQVk1QjtJQUVELG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxTQUFTLENBQUM7U0FDekUsNkJBQTZCLENBQUMsdUJBQXVCLG9DQUE0QixDQUFDIn0=