/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/list/browser/listService", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/search/common/searchHistoryService", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/services/search/common/search", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/contrib/search/common/search", "vs/workbench/contrib/search/browser/searchActionsBase"], function (require, exports, nls, listService_1, viewsService_1, searchIcons_1, Constants, searchHistoryService_1, searchModel_1, search_1, contextkey_1, actions_1, search_2, searchActionsBase_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Actions
    (0, actions_1.registerAction2)(class ClearSearchHistoryCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.clearHistory" /* Constants.SearchCommandIds.ClearSearchHistoryCommandId */,
                title: nls.localize2('clearSearchHistoryLabel', "Clear Search History"),
                category: searchActionsBase_1.category,
                f1: true
            });
        }
        async run(accessor) {
            clearHistoryCommand(accessor);
        }
    });
    (0, actions_1.registerAction2)(class CancelSearchAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.cancel" /* Constants.SearchCommandIds.CancelSearchActionId */,
                title: nls.localize2('CancelSearchAction.label', "Cancel Search"),
                icon: searchIcons_1.searchStopIcon,
                category: searchActionsBase_1.category,
                f1: true,
                precondition: search_2.SearchStateKey.isEqualTo(search_2.SearchUIState.Idle).negate(),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, listService_1.WorkbenchListFocusContextKey),
                    primary: 9 /* KeyCode.Escape */,
                },
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 0,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), search_2.SearchStateKey.isEqualTo(search_2.SearchUIState.SlowSearch)),
                    }]
            });
        }
        run(accessor) {
            return cancelSearch(accessor);
        }
    });
    (0, actions_1.registerAction2)(class RefreshAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.refreshSearchResults" /* Constants.SearchCommandIds.RefreshSearchResultsActionId */,
                title: nls.localize2('RefreshAction.label', "Refresh"),
                icon: searchIcons_1.searchRefreshIcon,
                precondition: Constants.SearchContext.ViewHasSearchPatternKey,
                category: searchActionsBase_1.category,
                f1: true,
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 0,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), search_2.SearchStateKey.isEqualTo(search_2.SearchUIState.SlowSearch).negate()),
                    }]
            });
        }
        run(accessor, ...args) {
            return refreshSearch(accessor);
        }
    });
    (0, actions_1.registerAction2)(class CollapseDeepestExpandedLevelAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.collapseSearchResults" /* Constants.SearchCommandIds.CollapseSearchResultsActionId */,
                title: nls.localize2('CollapseDeepestExpandedLevelAction.label', "Collapse All"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchCollapseAllIcon,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.HasSearchResults, Constants.SearchContext.ViewHasSomeCollapsibleKey),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 4,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), contextkey_1.ContextKeyExpr.or(Constants.SearchContext.HasSearchResults.negate(), Constants.SearchContext.ViewHasSomeCollapsibleKey)),
                    }]
            });
        }
        run(accessor, ...args) {
            return collapseDeepestExpandedLevel(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ExpandAllAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.expandSearchResults" /* Constants.SearchCommandIds.ExpandSearchResultsActionId */,
                title: nls.localize2('ExpandAllAction.label', "Expand All"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchExpandAllIcon,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.HasSearchResults, Constants.SearchContext.ViewHasSomeCollapsibleKey.toNegated()),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 4,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), Constants.SearchContext.HasSearchResults, Constants.SearchContext.ViewHasSomeCollapsibleKey.toNegated()),
                    }]
            });
        }
        run(accessor, ...args) {
            return expandAll(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ClearSearchResultsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.clearSearchResults" /* Constants.SearchCommandIds.ClearSearchResultsActionId */,
                title: nls.localize2('ClearSearchResultsAction.label', "Clear Search Results"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchClearIcon,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.or(Constants.SearchContext.HasSearchResults, Constants.SearchContext.ViewHasSearchPatternKey, Constants.SearchContext.ViewHasReplacePatternKey, Constants.SearchContext.ViewHasFilePatternKey),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 1,
                        when: contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID),
                    }]
            });
        }
        run(accessor, ...args) {
            return clearSearchResults(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ViewAsTreeAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.viewAsTree" /* Constants.SearchCommandIds.ViewAsTreeActionId */,
                title: nls.localize2('ViewAsTreeAction.label', "View as Tree"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchShowAsList,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.HasSearchResults, Constants.SearchContext.InTreeViewKey.toNegated()),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), Constants.SearchContext.InTreeViewKey.toNegated()),
                    }]
            });
        }
        run(accessor, ...args) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                searchView.setTreeView(true);
            }
        }
    });
    (0, actions_1.registerAction2)(class ViewAsListAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.viewAsList" /* Constants.SearchCommandIds.ViewAsListActionId */,
                title: nls.localize2('ViewAsListAction.label', "View as List"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchShowAsTree,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.HasSearchResults, Constants.SearchContext.InTreeViewKey),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), Constants.SearchContext.InTreeViewKey),
                    }]
            });
        }
        run(accessor, ...args) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                searchView.setTreeView(false);
            }
        }
    });
    //#endregion
    //#region Helpers
    const clearHistoryCommand = accessor => {
        const searchHistoryService = accessor.get(searchHistoryService_1.ISearchHistoryService);
        searchHistoryService.clearHistory();
    };
    function expandAll(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        if (searchView) {
            const viewer = searchView.getControl();
            viewer.expandAll();
        }
    }
    function clearSearchResults(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        searchView?.clearSearchResults();
    }
    function cancelSearch(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        searchView?.cancelSearch();
    }
    function refreshSearch(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        searchView?.triggerQueryChange({ preserveFocus: false });
    }
    function collapseDeepestExpandedLevel(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        if (searchView) {
            const viewer = searchView.getControl();
            /**
             * one level to collapse so collapse everything. If FolderMatch, check if there are visible grandchildren,
             * i.e. if Matches are returned by the navigator, and if so, collapse to them, otherwise collapse all levels.
             */
            const navigator = viewer.navigate();
            let node = navigator.first();
            let canCollapseFileMatchLevel = false;
            let canCollapseFirstLevel = false;
            if (node instanceof searchModel_1.FolderMatchWorkspaceRoot || searchView.isTreeLayoutViewVisible) {
                while (node = navigator.next()) {
                    if (node instanceof searchModel_1.Match) {
                        canCollapseFileMatchLevel = true;
                        break;
                    }
                    if (searchView.isTreeLayoutViewVisible && !canCollapseFirstLevel) {
                        let nodeToTest = node;
                        if (node instanceof searchModel_1.FolderMatch) {
                            const compressionStartNode = viewer.getCompressedTreeNode(node).element?.elements[0];
                            // Match elements should never be compressed, so !(compressionStartNode instanceof Match) should always be true here
                            nodeToTest = (compressionStartNode && !(compressionStartNode instanceof searchModel_1.Match)) ? compressionStartNode : node;
                        }
                        const immediateParent = nodeToTest.parent();
                        if (!(immediateParent instanceof searchModel_1.FolderMatchWorkspaceRoot || immediateParent instanceof searchModel_1.FolderMatchNoRoot || immediateParent instanceof searchModel_1.SearchResult)) {
                            canCollapseFirstLevel = true;
                        }
                    }
                }
            }
            if (canCollapseFileMatchLevel) {
                node = navigator.first();
                do {
                    if (node instanceof searchModel_1.FileMatch) {
                        viewer.collapse(node);
                    }
                } while (node = navigator.next());
            }
            else if (canCollapseFirstLevel) {
                node = navigator.first();
                if (node) {
                    do {
                        let nodeToTest = node;
                        if (node instanceof searchModel_1.FolderMatch) {
                            const compressionStartNode = viewer.getCompressedTreeNode(node).element?.elements[0];
                            // Match elements should never be compressed, so !(compressionStartNode instanceof Match) should always be true here
                            nodeToTest = (compressionStartNode && !(compressionStartNode instanceof searchModel_1.Match)) ? compressionStartNode : node;
                        }
                        const immediateParent = nodeToTest.parent();
                        if (immediateParent instanceof searchModel_1.FolderMatchWorkspaceRoot || immediateParent instanceof searchModel_1.FolderMatchNoRoot) {
                            if (viewer.hasElement(node)) {
                                viewer.collapse(node, true);
                            }
                            else {
                                viewer.collapseAll();
                            }
                        }
                    } while (node = navigator.next());
                }
            }
            else {
                viewer.collapseAll();
            }
            const firstFocusParent = viewer.getFocus()[0]?.parent();
            if (firstFocusParent && (firstFocusParent instanceof searchModel_1.FolderMatch || firstFocusParent instanceof searchModel_1.FileMatch) &&
                viewer.hasElement(firstFocusParent) && viewer.isCollapsed(firstFocusParent)) {
                viewer.domFocus();
                viewer.focusFirst();
                viewer.setSelection(viewer.getFocus());
            }
        }
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc1RvcEJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvc2VhcmNoQWN0aW9uc1RvcEJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW1CaEcsaUJBQWlCO0lBQ2pCLElBQUEseUJBQWUsRUFBQyxNQUFNLCtCQUFnQyxTQUFRLGlCQUFPO1FBRXBFO1lBRUMsS0FBSyxDQUFDO2dCQUNMLEVBQUUsMkZBQXdEO2dCQUMxRCxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyx5QkFBeUIsRUFBRSxzQkFBc0IsQ0FBQztnQkFDdkUsUUFBUSxFQUFSLDRCQUFRO2dCQUNSLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBRUosQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDNUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0IsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxNQUFNLGtCQUFtQixTQUFRLGlCQUFPO1FBQ3ZEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsOEVBQWlEO2dCQUNuRCxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQywwQkFBMEIsRUFBRSxlQUFlLENBQUM7Z0JBQ2pFLElBQUksRUFBRSw0QkFBYztnQkFDcEIsUUFBUSxFQUFSLDRCQUFRO2dCQUNSLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFlBQVksRUFBRSx1QkFBYyxDQUFDLFNBQVMsQ0FBQyxzQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTtnQkFDbkUsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRSwwQ0FBNEIsQ0FBQztvQkFDcEcsT0FBTyx3QkFBZ0I7aUJBQ3ZCO2dCQUNELElBQUksRUFBRSxDQUFDO3dCQUNOLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFNBQVM7d0JBQ3BCLEtBQUssRUFBRSxZQUFZO3dCQUNuQixLQUFLLEVBQUUsQ0FBQzt3QkFDUixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMkJBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSx1QkFBYyxDQUFDLFNBQVMsQ0FBQyxzQkFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3FCQUNwSCxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixPQUFPLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sYUFBYyxTQUFRLGlCQUFPO1FBQ2xEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsb0dBQXlEO2dCQUMzRCxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxTQUFTLENBQUM7Z0JBQ3RELElBQUksRUFBRSwrQkFBaUI7Z0JBQ3ZCLFlBQVksRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLHVCQUF1QjtnQkFDN0QsUUFBUSxFQUFSLDRCQUFRO2dCQUNSLEVBQUUsRUFBRSxJQUFJO2dCQUNSLElBQUksRUFBRSxDQUFDO3dCQUNOLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFNBQVM7d0JBQ3BCLEtBQUssRUFBRSxZQUFZO3dCQUNuQixLQUFLLEVBQUUsQ0FBQzt3QkFDUixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMkJBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSx1QkFBYyxDQUFDLFNBQVMsQ0FBQyxzQkFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO3FCQUM3SCxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEdBQUcsQ0FBQyxRQUEwQixFQUFFLEdBQUcsSUFBVztZQUM3QyxPQUFPLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQyxDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sa0NBQW1DLFNBQVEsaUJBQU87UUFDdkU7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxzR0FBMEQ7Z0JBQzVELEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLDBDQUEwQyxFQUFFLGNBQWMsQ0FBQztnQkFDaEYsUUFBUSxFQUFSLDRCQUFRO2dCQUNSLElBQUksRUFBRSxtQ0FBcUI7Z0JBQzNCLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFlBQVksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMseUJBQXlCLENBQUM7Z0JBQzdILElBQUksRUFBRSxDQUFDO3dCQUNOLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFNBQVM7d0JBQ3BCLEtBQUssRUFBRSxZQUFZO3dCQUNuQixLQUFLLEVBQUUsQ0FBQzt3QkFDUixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMkJBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSwyQkFBYyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMseUJBQXlCLENBQUMsQ0FBQztxQkFDekwsQ0FBQzthQUNGLENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7WUFDN0MsT0FBTyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQyxDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sZUFBZ0IsU0FBUSxpQkFBTztRQUNwRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLGtHQUF3RDtnQkFDMUQsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLEVBQUUsWUFBWSxDQUFDO2dCQUMzRCxRQUFRLEVBQVIsNEJBQVE7Z0JBQ1IsSUFBSSxFQUFFLGlDQUFtQjtnQkFDekIsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDekksSUFBSSxFQUFFLENBQUM7d0JBQ04sRUFBRSxFQUFFLGdCQUFNLENBQUMsU0FBUzt3QkFDcEIsS0FBSyxFQUFFLFlBQVk7d0JBQ25CLEtBQUssRUFBRSxDQUFDO3dCQUNSLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQywyQkFBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztxQkFDekssQ0FBQzthQUNGLENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7WUFDN0MsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUIsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxNQUFNLHdCQUF5QixTQUFRLGlCQUFPO1FBQzdEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsZ0dBQXVEO2dCQUN6RCxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxnQ0FBZ0MsRUFBRSxzQkFBc0IsQ0FBQztnQkFDOUUsUUFBUSxFQUFSLDRCQUFRO2dCQUNSLElBQUksRUFBRSw2QkFBZTtnQkFDckIsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsWUFBWSxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLHdCQUF3QixFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMscUJBQXFCLENBQUM7Z0JBQzNOLElBQUksRUFBRSxDQUFDO3dCQUNOLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFNBQVM7d0JBQ3BCLEtBQUssRUFBRSxZQUFZO3dCQUNuQixLQUFLLEVBQUUsQ0FBQzt3QkFDUixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGdCQUFPLENBQUM7cUJBQzVDLENBQUM7YUFDRixDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO1lBQzdDLE9BQU8sa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsQ0FBQztLQUNELENBQUMsQ0FBQztJQUdILElBQUEseUJBQWUsRUFBQyxNQUFNLGdCQUFpQixTQUFRLGlCQUFPO1FBQ3JEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsZ0ZBQStDO2dCQUNqRCxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsRUFBRSxjQUFjLENBQUM7Z0JBQzlELFFBQVEsRUFBUiw0QkFBUTtnQkFDUixJQUFJLEVBQUUsOEJBQWdCO2dCQUN0QixFQUFFLEVBQUUsSUFBSTtnQkFDUixZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDN0gsSUFBSSxFQUFFLENBQUM7d0JBQ04sRUFBRSxFQUFFLGdCQUFNLENBQUMsU0FBUzt3QkFDcEIsS0FBSyxFQUFFLFlBQVk7d0JBQ25CLEtBQUssRUFBRSxDQUFDO3dCQUNSLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQywyQkFBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxDQUFDO3FCQUNuSCxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEdBQUcsQ0FBQyxRQUEwQixFQUFFLEdBQUcsSUFBVztZQUM3QyxNQUFNLFVBQVUsR0FBRyxJQUFBLGlDQUFhLEVBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBYSxDQUFDLENBQUMsQ0FBQztZQUM5RCxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sZ0JBQWlCLFNBQVEsaUJBQU87UUFDckQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxnRkFBK0M7Z0JBQ2pELEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLHdCQUF3QixFQUFFLGNBQWMsQ0FBQztnQkFDOUQsUUFBUSxFQUFSLDRCQUFRO2dCQUNSLElBQUksRUFBRSw4QkFBZ0I7Z0JBQ3RCLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFlBQVksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDO2dCQUNqSCxJQUFJLEVBQUUsQ0FBQzt3QkFDTixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxTQUFTO3dCQUNwQixLQUFLLEVBQUUsWUFBWTt3QkFDbkIsS0FBSyxFQUFFLENBQUM7d0JBQ1IsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDJCQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUM7cUJBQ3ZHLENBQUM7YUFDRixDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO1lBQzdDLE1BQU0sVUFBVSxHQUFHLElBQUEsaUNBQWEsRUFBQyxRQUFRLENBQUMsR0FBRyxDQUFDLDRCQUFhLENBQUMsQ0FBQyxDQUFDO1lBQzlELElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLFVBQVUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0IsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFHSCxZQUFZO0lBRVosaUJBQWlCO0lBQ2pCLE1BQU0sbUJBQW1CLEdBQW9CLFFBQVEsQ0FBQyxFQUFFO1FBQ3ZELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0Q0FBcUIsQ0FBQyxDQUFDO1FBQ2pFLG9CQUFvQixDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ3JDLENBQUMsQ0FBQztJQUVGLFNBQVMsU0FBUyxDQUFDLFFBQTBCO1FBQzVDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQWEsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sVUFBVSxHQUFHLElBQUEsaUNBQWEsRUFBQyxZQUFZLENBQUMsQ0FBQztRQUMvQyxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN2QyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDcEIsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLGtCQUFrQixDQUFDLFFBQTBCO1FBQ3JELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQWEsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sVUFBVSxHQUFHLElBQUEsaUNBQWEsRUFBQyxZQUFZLENBQUMsQ0FBQztRQUMvQyxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztJQUNsQyxDQUFDO0lBRUQsU0FBUyxZQUFZLENBQUMsUUFBMEI7UUFDL0MsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBYSxDQUFDLENBQUM7UUFDakQsTUFBTSxVQUFVLEdBQUcsSUFBQSxpQ0FBYSxFQUFDLFlBQVksQ0FBQyxDQUFDO1FBQy9DLFVBQVUsRUFBRSxZQUFZLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsU0FBUyxhQUFhLENBQUMsUUFBMEI7UUFDaEQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBYSxDQUFDLENBQUM7UUFDakQsTUFBTSxVQUFVLEdBQUcsSUFBQSxpQ0FBYSxFQUFDLFlBQVksQ0FBQyxDQUFDO1FBQy9DLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFRCxTQUFTLDRCQUE0QixDQUFDLFFBQTBCO1FBRS9ELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQWEsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sVUFBVSxHQUFHLElBQUEsaUNBQWEsRUFBQyxZQUFZLENBQUMsQ0FBQztRQUMvQyxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUV2Qzs7O2VBR0c7WUFDSCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDcEMsSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzdCLElBQUkseUJBQXlCLEdBQUcsS0FBSyxDQUFDO1lBQ3RDLElBQUkscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1lBRWxDLElBQUksSUFBSSxZQUFZLHNDQUF3QixJQUFJLFVBQVUsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNwRixPQUFPLElBQUksR0FBRyxTQUFTLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxJQUFJLFlBQVksbUJBQUssRUFBRSxDQUFDO3dCQUMzQix5QkFBeUIsR0FBRyxJQUFJLENBQUM7d0JBQ2pDLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxJQUFJLFVBQVUsQ0FBQyx1QkFBdUIsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7d0JBQ2xFLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQzt3QkFFdEIsSUFBSSxJQUFJLFlBQVkseUJBQVcsRUFBRSxDQUFDOzRCQUNqQyxNQUFNLG9CQUFvQixHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNyRixvSEFBb0g7NEJBQ3BILFVBQVUsR0FBRyxDQUFDLG9CQUFvQixJQUFJLENBQUMsQ0FBQyxvQkFBb0IsWUFBWSxtQkFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQzt3QkFDL0csQ0FBQzt3QkFFRCxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBRTVDLElBQUksQ0FBQyxDQUFDLGVBQWUsWUFBWSxzQ0FBd0IsSUFBSSxlQUFlLFlBQVksK0JBQWlCLElBQUksZUFBZSxZQUFZLDBCQUFZLENBQUMsRUFBRSxDQUFDOzRCQUN2SixxQkFBcUIsR0FBRyxJQUFJLENBQUM7d0JBQzlCLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUkseUJBQXlCLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDekIsR0FBRyxDQUFDO29CQUNILElBQUksSUFBSSxZQUFZLHVCQUFTLEVBQUUsQ0FBQzt3QkFDL0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdkIsQ0FBQztnQkFDRixDQUFDLFFBQVEsSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNuQyxDQUFDO2lCQUFNLElBQUkscUJBQXFCLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDVixHQUFHLENBQUM7d0JBRUgsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDO3dCQUV0QixJQUFJLElBQUksWUFBWSx5QkFBVyxFQUFFLENBQUM7NEJBQ2pDLE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3JGLG9IQUFvSDs0QkFDcEgsVUFBVSxHQUFHLENBQUMsb0JBQW9CLElBQUksQ0FBQyxDQUFDLG9CQUFvQixZQUFZLG1CQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO3dCQUMvRyxDQUFDO3dCQUNELE1BQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFFNUMsSUFBSSxlQUFlLFlBQVksc0NBQXdCLElBQUksZUFBZSxZQUFZLCtCQUFpQixFQUFFLENBQUM7NEJBQ3pHLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dDQUM3QixNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQzs0QkFDN0IsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQzs0QkFDdEIsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUMsUUFBUSxJQUFJLEdBQUcsU0FBUyxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUNuQyxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN0QixDQUFDO1lBRUQsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFFeEQsSUFBSSxnQkFBZ0IsSUFBSSxDQUFDLGdCQUFnQixZQUFZLHlCQUFXLElBQUksZ0JBQWdCLFlBQVksdUJBQVMsQ0FBQztnQkFDekcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO2dCQUM5RSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2xCLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN4QyxDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7O0FBRUQsWUFBWSJ9