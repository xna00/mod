/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/codicons", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/views/viewPane", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/outline/browser/outline"], function (require, exports, nls_1, codicons_1, actions_1, viewPane_1, contextkey_1, outline_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --- commands
    (0, actions_1.registerAction2)(class CollapseAll extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: outline_1.IOutlinePane.Id,
                id: 'outline.collapse',
                title: (0, nls_1.localize)('collapse', "Collapse All"),
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', outline_1.IOutlinePane.Id), outline_1.ctxAllCollapsed.isEqualTo(false))
                }
            });
        }
        runInView(_accessor, view) {
            view.collapseAll();
        }
    });
    (0, actions_1.registerAction2)(class ExpandAll extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: outline_1.IOutlinePane.Id,
                id: 'outline.expand',
                title: (0, nls_1.localize)('expand', "Expand All"),
                f1: false,
                icon: codicons_1.Codicon.expandAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', outline_1.IOutlinePane.Id), outline_1.ctxAllCollapsed.isEqualTo(true))
                }
            });
        }
        runInView(_accessor, view) {
            view.expandAll();
        }
    });
    (0, actions_1.registerAction2)(class FollowCursor extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: outline_1.IOutlinePane.Id,
                id: 'outline.followCursor',
                title: (0, nls_1.localize)('followCur', "Follow Cursor"),
                f1: false,
                toggled: outline_1.ctxFollowsCursor,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'config',
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.equals('view', outline_1.IOutlinePane.Id)
                }
            });
        }
        runInView(_accessor, view) {
            view.outlineViewState.followCursor = !view.outlineViewState.followCursor;
        }
    });
    (0, actions_1.registerAction2)(class FilterOnType extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: outline_1.IOutlinePane.Id,
                id: 'outline.filterOnType',
                title: (0, nls_1.localize)('filterOnType', "Filter on Type"),
                f1: false,
                toggled: outline_1.ctxFilterOnType,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'config',
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.equals('view', outline_1.IOutlinePane.Id)
                }
            });
        }
        runInView(_accessor, view) {
            view.outlineViewState.filterOnType = !view.outlineViewState.filterOnType;
        }
    });
    (0, actions_1.registerAction2)(class SortByPosition extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: outline_1.IOutlinePane.Id,
                id: 'outline.sortByPosition',
                title: (0, nls_1.localize)('sortByPosition', "Sort By: Position"),
                f1: false,
                toggled: outline_1.ctxSortMode.isEqualTo(0 /* OutlineSortOrder.ByPosition */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'sort',
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.equals('view', outline_1.IOutlinePane.Id)
                }
            });
        }
        runInView(_accessor, view) {
            view.outlineViewState.sortBy = 0 /* OutlineSortOrder.ByPosition */;
        }
    });
    (0, actions_1.registerAction2)(class SortByName extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: outline_1.IOutlinePane.Id,
                id: 'outline.sortByName',
                title: (0, nls_1.localize)('sortByName', "Sort By: Name"),
                f1: false,
                toggled: outline_1.ctxSortMode.isEqualTo(1 /* OutlineSortOrder.ByName */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'sort',
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.equals('view', outline_1.IOutlinePane.Id)
                }
            });
        }
        runInView(_accessor, view) {
            view.outlineViewState.sortBy = 1 /* OutlineSortOrder.ByName */;
        }
    });
    (0, actions_1.registerAction2)(class SortByKind extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: outline_1.IOutlinePane.Id,
                id: 'outline.sortByKind',
                title: (0, nls_1.localize)('sortByKind', "Sort By: Category"),
                f1: false,
                toggled: outline_1.ctxSortMode.isEqualTo(2 /* OutlineSortOrder.ByKind */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'sort',
                    order: 3,
                    when: contextkey_1.ContextKeyExpr.equals('view', outline_1.IOutlinePane.Id)
                }
            });
        }
        runInView(_accessor, view) {
            view.outlineViewState.sortBy = 2 /* OutlineSortOrder.ByKind */;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZUFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL291dGxpbmUvYnJvd3Nlci9vdXRsaW5lQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxlQUFlO0lBRWYsSUFBQSx5QkFBZSxFQUFDLE1BQU0sV0FBWSxTQUFRLHFCQUF3QjtRQUNqRTtZQUNDLEtBQUssQ0FBQztnQkFDTCxNQUFNLEVBQUUsc0JBQVksQ0FBQyxFQUFFO2dCQUN2QixFQUFFLEVBQUUsa0JBQWtCO2dCQUN0QixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQztnQkFDM0MsRUFBRSxFQUFFLEtBQUs7Z0JBQ1QsSUFBSSxFQUFFLGtCQUFPLENBQUMsV0FBVztnQkFDekIsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFNBQVM7b0JBQ3BCLEtBQUssRUFBRSxZQUFZO29CQUNuQixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMkJBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLHNCQUFZLENBQUMsRUFBRSxDQUFDLEVBQUUseUJBQWUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQzFHO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELFNBQVMsQ0FBQyxTQUEyQixFQUFFLElBQWtCO1lBQ3hELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNwQixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sU0FBVSxTQUFRLHFCQUF3QjtRQUMvRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxNQUFNLEVBQUUsc0JBQVksQ0FBQyxFQUFFO2dCQUN2QixFQUFFLEVBQUUsZ0JBQWdC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