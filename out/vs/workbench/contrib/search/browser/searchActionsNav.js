/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/nls", "vs/platform/configuration/common/configuration", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/services/editor/common/editorService", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/platform/actions/common/actions", "vs/editor/contrib/find/browser/findModel", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/platform/accessibility/common/accessibility", "vs/base/browser/dom"], function (require, exports, platform_1, nls, configuration_1, viewsService_1, Constants, SearchEditorConstants, searchModel_1, searchEditorInput_1, editorService_1, contextkey_1, types_1, actions_1, findModel_1, searchActionsBase_1, accessibility_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Actions: Changing Search Input Options
    (0, actions_1.registerAction2)(class ToggleQueryDetailsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "workbench.action.search.toggleQueryDetails" /* Constants.SearchCommandIds.ToggleQueryDetailsActionId */,
                title: nls.localize2('ToggleQueryDetailsAction.label', "Toggle Query Details"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.or(Constants.SearchContext.SearchViewFocusedKey, SearchEditorConstants.InSearchEditor),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 40 /* KeyCode.KeyJ */,
                },
            });
        }
        run(accessor, ...args) {
            const contextService = accessor.get(contextkey_1.IContextKeyService).getContext((0, dom_1.getActiveElement)());
            if (contextService.getValue(SearchEditorConstants.InSearchEditor.serialize())) {
                accessor.get(editorService_1.IEditorService).activeEditorPane.toggleQueryDetails(args[0]?.show);
            }
            else if (contextService.getValue(Constants.SearchContext.SearchViewFocusedKey.serialize())) {
                const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
                (0, types_1.assertIsDefined)(searchView).toggleQueryDetails(undefined, args[0]?.show);
            }
        }
    });
    (0, actions_1.registerAction2)(class CloseReplaceAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "closeReplaceInFilesWidget" /* Constants.SearchCommandIds.CloseReplaceWidgetActionId */,
                title: nls.localize2('CloseReplaceWidget.label', "Close Replace Widget"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.ReplaceInputBoxFocusedKey),
                    primary: 9 /* KeyCode.Escape */,
                },
            });
        }
        run(accessor) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                searchView.searchAndReplaceWidget.toggleReplace(false);
                searchView.searchAndReplaceWidget.focus();
            }
            return Promise.resolve(null);
        }
    });
    (0, actions_1.registerAction2)(class ToggleCaseSensitiveCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "toggleSearchCaseSensitive" /* Constants.SearchCommandIds.ToggleCaseSensitiveCommandId */,
                title: nls.localize2('ToggleCaseSensitiveCommandId.label', "Toggle Case Sensitive"),
                category: searchActionsBase_1.category,
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: platform_1.isMacintosh ? contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewFocusedKey, Constants.SearchContext.FileMatchOrFolderMatchFocusKey.toNegated()) : Constants.SearchContext.SearchViewFocusedKey,
                }, findModel_1.ToggleCaseSensitiveKeybinding)
            });
        }
        async run(accessor) {
            toggleCaseSensitiveCommand(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ToggleWholeWordCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "toggleSearchWholeWord" /* Constants.SearchCommandIds.ToggleWholeWordCommandId */,
                title: nls.localize2('ToggleWholeWordCommandId.label', "Toggle Whole Word"),
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: Constants.SearchContext.SearchViewFocusedKey,
                }, findModel_1.ToggleWholeWordKeybinding),
                category: searchActionsBase_1.category,
            });
        }
        async run(accessor) {
            return toggleWholeWordCommand(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ToggleRegexCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "toggleSearchRegex" /* Constants.SearchCommandIds.ToggleRegexCommandId */,
                title: nls.localize2('ToggleRegexCommandId.label', "Toggle Regex"),
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: Constants.SearchContext.SearchViewFocusedKey,
                }, findModel_1.ToggleRegexKeybinding),
                category: searchActionsBase_1.category,
            });
        }
        async run(accessor) {
            return toggleRegexCommand(accessor);
        }
    });
    (0, actions_1.registerAction2)(class TogglePreserveCaseAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "toggleSearchPreserveCase" /* Constants.SearchCommandIds.TogglePreserveCaseId */,
                title: nls.localize2('TogglePreserveCaseId.label', "Toggle Preserve Case"),
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: Constants.SearchContext.SearchViewFocusedKey,
                }, findModel_1.TogglePreserveCaseKeybinding),
                category: searchActionsBase_1.category,
            });
        }
        async run(accessor) {
            return togglePreserveCaseCommand(accessor);
        }
    });
    //#endregion
    //#region Actions: Opening Matches
    (0, actions_1.registerAction2)(class OpenMatchAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.openResult" /* Constants.SearchCommandIds.OpenMatch */,
                title: nls.localize2('OpenMatch.label', "Open Match"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.FileMatchOrMatchFocusKey),
                    primary: 3 /* KeyCode.Enter */,
                    mac: {
                        primary: 3 /* KeyCode.Enter */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
                    },
                },
            });
        }
        run(accessor) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                const viewer = searchView.getControl();
                const focus = tree.getFocus()[0];
                if (focus instanceof searchModel_1.FolderMatch) {
                    viewer.toggleCollapsed(focus);
                }
                else {
                    searchView.open(tree.getFocus()[0], false, false, true);
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class OpenMatchToSideAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.openResultToSide" /* Constants.SearchCommandIds.OpenMatchToSide */,
                title: nls.localize2('OpenMatchToSide.label', "Open Match To Side"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.FileMatchOrMatchFocusKey),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */
                    },
                },
            });
        }
        run(accessor) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                searchView.open(tree.getFocus()[0], false, true, true);
            }
        }
    });
    (0, actions_1.registerAction2)(class AddCursorsAtSearchResultsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "addCursorsAtSearchResults" /* Constants.SearchCommandIds.AddCursorsAtSearchResults */,
                title: nls.localize2('AddCursorsAtSearchResults.label', "Add Cursors at Search Results"),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.FileMatchOrMatchFocusKey),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 42 /* KeyCode.KeyL */,
                },
                category: searchActionsBase_1.category,
            });
        }
        async run(accessor) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                searchView.openEditorWithMultiCursor(tree.getFocus()[0]);
            }
        }
    });
    //#endregion
    //#region Actions: Toggling Focus
    (0, actions_1.registerAction2)(class FocusNextInputAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.focus.nextInputBox" /* Constants.SearchCommandIds.FocusNextInputActionId */,
                title: nls.localize2('FocusNextInputAction.label', "Focus Next Input"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, Constants.SearchContext.InputBoxFocusedKey), contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.InputBoxFocusedKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                },
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
                editorService.activeEditorPane.focusNextInput();
            }
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            searchView?.focusNextInputBox();
        }
    });
    (0, actions_1.registerAction2)(class FocusPreviousInputAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.focus.previousInputBox" /* Constants.SearchCommandIds.FocusPreviousInputActionId */,
                title: nls.localize2('FocusPreviousInputAction.label', "Focus Previous Input"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, Constants.SearchContext.InputBoxFocusedKey), contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.InputBoxFocusedKey, Constants.SearchContext.SearchInputBoxFocusedKey.toNegated())),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                },
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
                editorService.activeEditorPane.focusPrevInput();
            }
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            searchView?.focusPreviousInputBox();
        }
    });
    (0, actions_1.registerAction2)(class FocusSearchFromResultsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.focusSearchFromResults" /* Constants.SearchCommandIds.FocusSearchFromResults */,
                title: nls.localize2('FocusSearchFromResults.label', "Focus Search From Results"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, contextkey_1.ContextKeyExpr.or(Constants.SearchContext.FirstMatchFocusKey, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                },
            });
        }
        run(accessor) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            searchView?.focusPreviousInputBox();
        }
    });
    (0, actions_1.registerAction2)(class ToggleSearchOnTypeAction extends actions_1.Action2 {
        static { this.searchOnTypeKey = 'search.searchOnType'; }
        constructor() {
            super({
                id: "workbench.action.toggleSearchOnType" /* Constants.SearchCommandIds.ToggleSearchOnTypeActionId */,
                title: nls.localize2('toggleTabs', "Toggle Search on Type"),
                category: searchActionsBase_1.category,
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const searchOnType = configurationService.getValue(ToggleSearchOnTypeAction.searchOnTypeKey);
            return configurationService.updateValue(ToggleSearchOnTypeAction.searchOnTypeKey, !searchOnType);
        }
    });
    (0, actions_1.registerAction2)(class FocusSearchListCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.focusSearchList" /* Constants.SearchCommandIds.FocusSearchListCommandID */,
                title: nls.localize2('focusSearchListCommandLabel', "Focus List"),
                category: searchActionsBase_1.category,
                f1: true
            });
        }
        async run(accessor) {
            focusSearchListCommand(accessor);
        }
    });
    (0, actions_1.registerAction2)(class FocusNextSearchResultAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.focusNextSearchResult" /* Constants.SearchCommandIds.FocusNextSearchResultActionId */,
                title: nls.localize2('FocusNextSearchResult.label', "Focus Next Search Result"),
                keybinding: [{
                        primary: 62 /* KeyCode.F4 */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    }],
                category: searchActionsBase_1.category,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.or(Constants.SearchContext.HasSearchResults, SearchEditorConstants.InSearchEditor),
            });
        }
        async run(accessor) {
            return await focusNextSearchResult(accessor);
        }
    });
    (0, actions_1.registerAction2)(class FocusPreviousSearchResultAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.focusPreviousSearchResult" /* Constants.SearchCommandIds.FocusPreviousSearchResultActionId */,
                title: nls.localize2('FocusPreviousSearchResult.label', "Focus Previous Search Result"),
                keybinding: [{
                        primary: 1024 /* KeyMod.Shift */ | 62 /* KeyCode.F4 */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    }],
                category: searchActionsBase_1.category,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.or(Constants.SearchContext.HasSearchResults, SearchEditorConstants.InSearchEditor),
            });
        }
        async run(accessor) {
            return await focusPreviousSearchResult(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ReplaceInFilesAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "workbench.action.replaceInFiles" /* Constants.SearchCommandIds.ReplaceInFilesActionId */,
                title: nls.localize2('replaceInFiles', "Replace in Files"),
                keybinding: [{
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 38 /* KeyCode.KeyH */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    }],
                category: searchActionsBase_1.category,
                f1: true,
                menu: [{
                        id: actions_1.MenuId.MenubarEditMenu,
                        group: '4_find_global',
                        order: 2
                    }],
            });
        }
        async run(accessor) {
            return await findOrReplaceInFiles(accessor, true);
        }
    });
    //#endregion
    //#region Helpers
    function toggleCaseSensitiveCommand(accessor) {
        const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
        searchView?.toggleCaseSensitive();
    }
    function toggleWholeWordCommand(accessor) {
        const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
        searchView?.toggleWholeWords();
    }
    function toggleRegexCommand(accessor) {
        const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
        searchView?.toggleRegex();
    }
    function togglePreserveCaseCommand(accessor) {
        const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
        searchView?.togglePreserveCase();
    }
    const focusSearchListCommand = accessor => {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        (0, searchActionsBase_1.openSearchView)(viewsService).then(searchView => {
            searchView?.moveFocusToResults();
        });
    };
    async function focusNextSearchResult(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
            return editorService.activeEditorPane.focusNextResult();
        }
        return (0, searchActionsBase_1.openSearchView)(accessor.get(viewsService_1.IViewsService)).then(searchView => {
            searchView?.selectNextMatch();
        });
    }
    async function focusPreviousSearchResult(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
            return editorService.activeEditorPane.focusPreviousResult();
        }
        return (0, searchActionsBase_1.openSearchView)(accessor.get(viewsService_1.IViewsService)).then(searchView => {
            searchView?.selectPreviousMatch();
        });
    }
    async function findOrReplaceInFiles(accessor, expandSearchReplaceWidget) {
        return (0, searchActionsBase_1.openSearchView)(accessor.get(viewsService_1.IViewsService), false).then(openedView => {
            if (openedView) {
                const searchAndReplaceWidget = openedView.searchAndReplaceWidget;
                searchAndReplaceWidget.toggleReplace(expandSearchReplaceWidget);
                const updatedText = openedView.updateTextFromFindWidgetOrSelection({ allowUnselectedWord: !expandSearchReplaceWidget });
                openedView.searchAndReplaceWidget.focus(undefined, updatedText, updatedText);
            }
        });
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc05hdi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvc2VhcmNoQWN0aW9uc05hdi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXlCaEcsZ0RBQWdEO0lBQ2hELElBQUEseUJBQWUsRUFBQyxNQUFNLHdCQUF5QixTQUFRLGlCQUFPO1FBQzdEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsMEdBQXVEO2dCQUN6RCxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxnQ0FBZ0MsRUFBRSxzQkFBc0IsQ0FBQztnQkFDOUUsUUFBUSxFQUFSLDRCQUFRO2dCQUNSLFVBQVUsRUFBRTtvQkFDWCxNQUFNLDZDQUFtQztvQkFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLEVBQUUscUJBQXFCLENBQUMsY0FBYyxDQUFDO29CQUMzRyxPQUFPLEVBQUUsbURBQTZCLHdCQUFlO2lCQUNyRDthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7WUFDN0MsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFBLHNCQUFnQixHQUFFLENBQUMsQ0FBQztZQUN2RixJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDOUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUMsZ0JBQWlDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUks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