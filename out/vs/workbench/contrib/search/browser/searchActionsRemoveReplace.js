/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/list/browser/listService", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/search/browser/replace", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/services/editor/common/editorService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/base/common/arrays"], function (require, exports, nls, configuration_1, listService_1, viewsService_1, searchIcons_1, Constants, replace_1, searchModel_1, editorService_1, uriIdentity_1, contextkey_1, actions_1, searchActionsBase_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getElementToFocusAfterRemoved = getElementToFocusAfterRemoved;
    exports.getLastNodeFromSameType = getLastNodeFromSameType;
    //#endregion
    //#region Actions
    (0, actions_1.registerAction2)(class RemoveAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.remove" /* Constants.SearchCommandIds.RemoveActionId */,
                title: nls.localize2('RemoveAction.label', "Dismiss"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchRemoveIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.FileMatchOrMatchFocusKey),
                    primary: 20 /* KeyCode.Delete */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
                    },
                },
                menu: [
                    {
                        id: actions_1.MenuId.SearchContext,
                        group: 'search',
                        order: 2,
                    },
                    {
                        id: actions_1.MenuId.SearchActionMenu,
                        group: 'inline',
                        order: 2,
                    },
                ]
            });
        }
        run(accessor, context) {
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
            if (!searchView) {
                return;
            }
            let element = context?.element;
            let viewer = context?.viewer;
            if (!viewer) {
                viewer = searchView.getControl();
            }
            if (!element) {
                element = viewer.getFocus()[0] ?? undefined;
            }
            const elementsToRemove = (0, searchActionsBase_1.getElementsToOperateOn)(viewer, element, configurationService.getValue('search'));
            let focusElement = viewer.getFocus()[0] ?? undefined;
            if (elementsToRemove.length === 0) {
                return;
            }
            if (!focusElement || (focusElement instanceof searchModel_1.SearchResult)) {
                focusElement = element;
            }
            let nextFocusElement;
            const shouldRefocusMatch = (0, searchActionsBase_1.shouldRefocus)(elementsToRemove, focusElement);
            if (focusElement && shouldRefocusMatch) {
                nextFocusElement = getElementToFocusAfterRemoved(viewer, focusElement, elementsToRemove);
            }
            const searchResult = searchView.searchResult;
            if (searchResult) {
                searchResult.batchRemove(elementsToRemove);
            }
            if (focusElement && shouldRefocusMatch) {
                if (!nextFocusElement) {
                    nextFocusElement = getLastNodeFromSameType(viewer, focusElement);
                }
                if (nextFocusElement && !(0, searchModel_1.arrayContainsElementOrParent)(nextFocusElement, elementsToRemove)) {
                    viewer.reveal(nextFocusElement);
                    viewer.setFocus([nextFocusElement], (0, listService_1.getSelectionKeyboardEvent)());
                    viewer.setSelection([nextFocusElement], (0, listService_1.getSelectionKeyboardEvent)());
                }
            }
            else if (!(0, arrays_1.equals)(viewer.getFocus(), viewer.getSelection())) {
                viewer.setSelection(viewer.getFocus());
            }
            viewer.domFocus();
            return;
        }
    });
    (0, actions_1.registerAction2)(class ReplaceAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.replace" /* Constants.SearchCommandIds.ReplaceActionId */,
                title: nls.localize2('match.replace.label', "Replace"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.MatchFocusKey, Constants.SearchContext.IsEditableItemKey),
                    primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 22 /* KeyCode.Digit1 */,
                },
                icon: searchIcons_1.searchReplaceIcon,
                menu: [
                    {
                        id: actions_1.MenuId.SearchContext,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.MatchFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'search',
                        order: 1
                    },
                    {
                        id: actions_1.MenuId.SearchActionMenu,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.MatchFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'inline',
                        order: 1
                    }
                ]
            });
        }
        async run(accessor, context) {
            return performReplace(accessor, context);
        }
    });
    (0, actions_1.registerAction2)(class ReplaceAllAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.replaceAllInFile" /* Constants.SearchCommandIds.ReplaceAllInFileActionId */,
                title: nls.localize2('file.replaceAll.label', "Replace All"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FileFocusKey, Constants.SearchContext.IsEditableItemKey),
                    primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 22 /* KeyCode.Digit1 */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */],
                },
                icon: searchIcons_1.searchReplaceIcon,
                menu: [
                    {
                        id: actions_1.MenuId.SearchContext,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FileFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'search',
                        order: 1
                    },
                    {
                        id: actions_1.MenuId.SearchActionMenu,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FileFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'inline',
                        order: 1
                    }
                ]
            });
        }
        async run(accessor, context) {
            return performReplace(accessor, context);
        }
    });
    (0, actions_1.registerAction2)(class ReplaceAllInFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.replaceAllInFolder" /* Constants.SearchCommandIds.ReplaceAllInFolderActionId */,
                title: nls.localize2('file.replaceAll.label', "Replace All"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FolderFocusKey, Constants.SearchContext.IsEditableItemKey),
                    primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 22 /* KeyCode.Digit1 */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */],
                },
                icon: searchIcons_1.searchReplaceIcon,
                menu: [
                    {
                        id: actions_1.MenuId.SearchContext,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FolderFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'search',
                        order: 1
                    },
                    {
                        id: actions_1.MenuId.SearchActionMenu,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FolderFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'inline',
                        order: 1
                    }
                ]
            });
        }
        async run(accessor, context) {
            return performReplace(accessor, context);
        }
    });
    //#endregion
    //#region Helpers
    function performReplace(accessor, context) {
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const viewlet = (0, searchActionsBase_1.getSearchView)(viewsService);
        const viewer = context?.viewer ?? viewlet?.getControl();
        if (!viewer) {
            return;
        }
        const element = context?.element ?? viewer.getFocus()[0];
        // since multiple elements can be selected, we need to check the type of the FolderMatch/FileMatch/Match before we perform the replace.
        const elementsToReplace = (0, searchActionsBase_1.getElementsToOperateOn)(viewer, element ?? undefined, configurationService.getValue('search'));
        let focusElement = viewer.getFocus()[0];
        if (!focusElement || (focusElement && !(0, searchModel_1.arrayContainsElementOrParent)(focusElement, elementsToReplace)) || (focusElement instanceof searchModel_1.SearchResult)) {
            focusElement = element;
        }
        if (elementsToReplace.length === 0) {
            return;
        }
        let nextFocusElement;
        if (focusElement) {
            nextFocusElement = getElementToFocusAfterRemoved(viewer, focusElement, elementsToReplace);
        }
        const searchResult = viewlet?.searchResult;
        if (searchResult) {
            searchResult.batchReplace(elementsToReplace);
        }
        if (focusElement) {
            if (!nextFocusElement) {
                nextFocusElement = getLastNodeFromSameType(viewer, focusElement);
            }
            if (nextFocusElement) {
                viewer.reveal(nextFocusElement);
                viewer.setFocus([nextFocusElement], (0, listService_1.getSelectionKeyboardEvent)());
                viewer.setSelection([nextFocusElement], (0, listService_1.getSelectionKeyboardEvent)());
                if (nextFocusElement instanceof searchModel_1.Match) {
                    const useReplacePreview = configurationService.getValue().search.useReplacePreview;
                    if (!useReplacePreview || hasToOpenFile(accessor, nextFocusElement) || nextFocusElement instanceof searchModel_1.MatchInNotebook) {
                        viewlet?.open(nextFocusElement, true);
                    }
                    else {
                        accessor.get(replace_1.IReplaceService).openReplacePreview(nextFocusElement, true);
                    }
                }
                else if (nextFocusElement instanceof searchModel_1.FileMatch) {
                    viewlet?.open(nextFocusElement, true);
                }
            }
        }
        viewer.domFocus();
    }
    function hasToOpenFile(accessor, currBottomElem) {
        if (!(currBottomElem instanceof searchModel_1.Match)) {
            return false;
        }
        const activeEditor = accessor.get(editorService_1.IEditorService).activeEditor;
        const file = activeEditor?.resource;
        if (file) {
            return accessor.get(uriIdentity_1.IUriIdentityService).extUri.isEqual(file, currBottomElem.parent().resource);
        }
        return false;
    }
    function compareLevels(elem1, elem2) {
        if (elem1 instanceof searchModel_1.Match) {
            if (elem2 instanceof searchModel_1.Match) {
                return 0;
            }
            else {
                return -1;
            }
        }
        else if (elem1 instanceof searchModel_1.FileMatch) {
            if (elem2 instanceof searchModel_1.Match) {
                return 1;
            }
            else if (elem2 instanceof searchModel_1.FileMatch) {
                return 0;
            }
            else {
                return -1;
            }
        }
        else {
            // FolderMatch
            if (elem2 instanceof searchModel_1.FolderMatch) {
                return 0;
            }
            else {
                return 1;
            }
        }
    }
    /**
     * Returns element to focus after removing the given element
     */
    function getElementToFocusAfterRemoved(viewer, element, elementsToRemove) {
        const navigator = viewer.navigate(element);
        if (element instanceof searchModel_1.FolderMatch) {
            while (!!navigator.next() && (!(navigator.current() instanceof searchModel_1.FolderMatch) || (0, searchModel_1.arrayContainsElementOrParent)(navigator.current(), elementsToRemove))) { }
        }
        else if (element instanceof searchModel_1.FileMatch) {
            while (!!navigator.next() && (!(navigator.current() instanceof searchModel_1.FileMatch) || (0, searchModel_1.arrayContainsElementOrParent)(navigator.current(), elementsToRemove))) {
                viewer.expand(navigator.current());
            }
        }
        else {
            while (navigator.next() && (!(navigator.current() instanceof searchModel_1.Match) || (0, searchModel_1.arrayContainsElementOrParent)(navigator.current(), elementsToRemove))) {
                viewer.expand(navigator.current());
            }
        }
        return navigator.current();
    }
    /***
     * Finds the last element in the tree with the same type as `element`
     */
    function getLastNodeFromSameType(viewer, element) {
        let lastElem = viewer.lastVisibleElement ?? null;
        while (lastElem) {
            const compareVal = compareLevels(element, lastElem);
            if (compareVal === -1) {
                viewer.expand(lastElem);
                lastElem = viewer.lastVisibleElement;
            }
            else if (compareVal === 1) {
                lastElem = viewer.getParentElement(lastElem);
            }
            else {
                return lastElem;
            }
        }
        return undefined;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc1JlbW92ZVJlcGxhY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9icm93c2VyL3NlYXJjaEFjdGlvbnNSZW1vdmVSZXBsYWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBb1doRyxzRUFjQztJQUtELDBEQWdCQztJQTFWRCxZQUFZO0lBRVosaUJBQWlCO0lBQ2pCLElBQUEseUJBQWUsRUFBQyxNQUFNLFlBQWEsU0FBUSxpQkFBTztRQUVqRDtZQUVDLEtBQUssQ0FBQztnQkFDTCxFQUFFLHdFQUEyQztnQkFDN0MsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDO2dCQUNyRCxRQUFRLEVBQVIsNEJBQVE7Z0JBQ1IsSUFBSSxFQUFFLDhCQUFnQjtnQkFDdEIsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDO29CQUN4SCxPQUFPLHlCQUFnQjtvQkFDdkIsR0FBRyxFQUFFO3dCQUNKLE9BQU8sRUFBRSxxREFBa0M7cUJBQzNDO2lCQUNEO2dCQUNELElBQUksRUFBRTtvQkFDTDt3QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxhQUFhO3dCQUN4QixLQUFLLEVBQUUsUUFBUTt3QkFDZixLQUFLLEVBQUUsQ0FBQztxQkFDUjtvQkFDRDt3QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxnQkFBZ0I7d0JBQzNCLEtBQUssRUFBRSxRQUFRO3dCQUNmLEtBQUssRUFBRSxDQUFDO3FCQUNSO2lCQUNEO2FBQ0QsQ0FBQyxDQUFD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