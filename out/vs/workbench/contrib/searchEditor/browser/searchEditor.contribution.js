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
define(["require", "exports", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/contrib/find/browser/findModel", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/searchEditor/browser/searchEditor", "vs/workbench/contrib/searchEditor/browser/searchEditorActions", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/search/common/search", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/base/common/lifecycle", "vs/base/browser/dom"], function (require, exports, resources_1, uri_1, findModel_1, nls_1, actions_1, commands_1, contextkey_1, descriptors_1, instantiation_1, platform_1, editor_1, contributions_1, editor_2, contextkeys_1, viewsService_1, searchActionsBase_1, searchIcons_1, SearchConstants, SearchEditorConstants, searchEditor_1, searchEditorActions_1, searchEditorInput_1, editorService_1, search_1, editorResolverService_1, workingCopyEditorService_1, lifecycle_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const OpenInEditorCommandId = 'search.action.openInEditor';
    const OpenNewEditorToSideCommandId = 'search.action.openNewEditorToSide';
    const FocusQueryEditorWidgetCommandId = 'search.action.focusQueryEditorWidget';
    const FocusQueryEditorFilesToIncludeCommandId = 'search.action.focusFilesToInclude';
    const FocusQueryEditorFilesToExcludeCommandId = 'search.action.focusFilesToExclude';
    const ToggleSearchEditorCaseSensitiveCommandId = 'toggleSearchEditorCaseSensitive';
    const ToggleSearchEditorWholeWordCommandId = 'toggleSearchEditorWholeWord';
    const ToggleSearchEditorRegexCommandId = 'toggleSearchEditorRegex';
    const IncreaseSearchEditorContextLinesCommandId = 'increaseSearchEditorContextLines';
    const DecreaseSearchEditorContextLinesCommandId = 'decreaseSearchEditorContextLines';
    const RerunSearchEditorSearchCommandId = 'rerunSearchEditorSearch';
    const CleanSearchEditorStateCommandId = 'cleanSearchEditorState';
    const SelectAllSearchEditorMatchesCommandId = 'selectAllSearchEditorMatches';
    //#region Editor Descriptior
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(searchEditor_1.SearchEditor, searchEditor_1.SearchEditor.ID, (0, nls_1.localize)('searchEditor', "Search Editor")), [
        new descriptors_1.SyncDescriptor(searchEditorInput_1.SearchEditorInput)
    ]);
    //#endregion
    //#region Startup Contribution
    let SearchEditorContribution = class SearchEditorContribution {
        static { this.ID = 'workbench.contrib.searchEditor'; }
        constructor(editorResolverService, instantiationService) {
            editorResolverService.registerEditor('*' + searchEditorInput_1.SEARCH_EDITOR_EXT, {
                id: searchEditorInput_1.SearchEditorInput.ID,
                label: (0, nls_1.localize)('promptOpenWith.searchEditor.displayName', "Search Editor"),
                detail: editor_2.DEFAULT_EDITOR_ASSOCIATION.providerDisplayName,
                priority: editorResolverService_1.RegisteredEditorPriority.default,
            }, {
                singlePerResource: true,
                canSupportResource: resource => ((0, resources_1.extname)(resource) === searchEditorInput_1.SEARCH_EDITOR_EXT)
            }, {
                createEditorInput: ({ resource }) => {
                    return { editor: instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'existingFile', fileUri: resource }) };
                }
            });
        }
    };
    SearchEditorContribution = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, instantiation_1.IInstantiationService)
    ], SearchEditorContribution);
    (0, contributions_1.registerWorkbenchContribution2)(SearchEditorContribution.ID, SearchEditorContribution, 1 /* WorkbenchPhase.BlockStartup */);
    class SearchEditorInputSerializer {
        canSerialize(input) {
            return !!input.tryReadConfigSync();
        }
        serialize(input) {
            if (!this.canSerialize(input)) {
                return undefined;
            }
            if (input.isDisposed()) {
                return JSON.stringify({ modelUri: undefined, dirty: false, config: input.tryReadConfigSync(), name: input.getName(), matchRanges: [], backingUri: input.backingUri?.toString() });
            }
            let modelUri = undefined;
            if (input.modelUri.path || input.modelUri.fragment && input.isDirty()) {
                modelUri = input.modelUri.toString();
            }
            const config = input.tryReadConfigSync();
            const dirty = input.isDirty();
            const matchRanges = dirty ? input.getMatchRanges() : [];
            const backingUri = input.backingUri;
            return JSON.stringify({ modelUri, dirty, config, name: input.getName(), matchRanges, backingUri: backingUri?.toString() });
        }
        deserialize(instantiationService, serializedEditorInput) {
            const { modelUri, dirty, config, matchRanges, backingUri } = JSON.parse(serializedEditorInput);
            if (config && (config.query !== undefined)) {
                if (modelUri) {
                    const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'model', modelUri: uri_1.URI.parse(modelUri), config, backupOf: backingUri ? uri_1.URI.parse(backingUri) : undefined });
                    input.setDirty(dirty);
                    input.setMatchRanges(matchRanges);
                    return input;
                }
                else {
                    if (backingUri) {
                        return instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'existingFile', fileUri: uri_1.URI.parse(backingUri) });
                    }
                    else {
                        return instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'rawData', resultsContents: '', config });
                    }
                }
            }
            return undefined;
        }
    }
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(searchEditorInput_1.SearchEditorInput.ID, SearchEditorInputSerializer);
    //#endregion
    //#region Commands
    commands_1.CommandsRegistry.registerCommand(CleanSearchEditorStateCommandId, (accessor) => {
        const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
        if (activeEditorPane instanceof searchEditor_1.SearchEditor) {
            activeEditorPane.cleanState();
        }
    });
    //#endregion
    //#region Actions
    const category = (0, nls_1.localize2)('search', 'Search Editor');
    const translateLegacyConfig = (legacyConfig = {}) => {
        const config = {};
        const overrides = {
            includes: 'filesToInclude',
            excludes: 'filesToExclude',
            wholeWord: 'matchWholeWord',
            caseSensitive: 'isCaseSensitive',
            regexp: 'isRegexp',
            useIgnores: 'useExcludeSettingsAndIgnoreFiles',
        };
        Object.entries(legacyConfig).forEach(([key, value]) => {
            config[overrides[key] ?? key] = value;
        });
        return config;
    };
    const openArgMetadata = {
        description: 'Open a new search editor. Arguments passed can include variables like ${relativeFileDirname}.',
        args: [{
                name: 'Open new Search Editor args',
                schema: {
                    properties: {
                        query: { type: 'string' },
                        filesToInclude: { type: 'string' },
                        filesToExclude: { type: 'string' },
                        contextLines: { type: 'number' },
                        matchWholeWord: { type: 'boolean' },
                        isCaseSensitive: { type: 'boolean' },
                        isRegexp: { type: 'boolean' },
                        useExcludeSettingsAndIgnoreFiles: { type: 'boolean' },
                        showIncludesExcludes: { type: 'boolean' },
                        triggerSearch: { type: 'boolean' },
                        focusResults: { type: 'boolean' },
                        onlyOpenEditors: { type: 'boolean' },
                    }
                }
            }]
    };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'search.searchEditor.action.deleteFileResults',
                title: (0, nls_1.localize2)('searchEditor.deleteResultBlock', 'Delete File Results'),
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 1 /* KeyCode.Backspace */,
                },
                precondition: SearchEditorConstants.InSearchEditor,
                category,
                f1: true,
            });
        }
        async run(accessor) {
            const contextService = accessor.get(contextkey_1.IContextKeyService).getContext((0, dom_1.getActiveElement)());
            if (contextService.getValue(SearchEditorConstants.InSearchEditor.serialize())) {
                accessor.get(editorService_1.IEditorService).activeEditorPane.deleteResultBlock();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SearchEditorConstants.OpenNewEditorCommandId,
                title: (0, nls_1.localize2)('search.openNewSearchEditor', 'New Search Editor'),
                category,
                f1: true,
                metadata: openArgMetadata
            });
        }
        async run(accessor, args) {
            await accessor.get(instantiation_1.IInstantiationService).invokeFunction(searchEditorActions_1.openNewSearchEditor, translateLegacyConfig({ location: 'new', ...args }));
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SearchEditorConstants.OpenEditorCommandId,
                title: (0, nls_1.localize2)('search.openSearchEditor', 'Open Search Editor'),
                category,
                f1: true,
                metadata: openArgMetadata
            });
        }
        async run(accessor, args) {
            await accessor.get(instantiation_1.IInstantiationService).invokeFunction(searchEditorActions_1.openNewSearchEditor, translateLegacyConfig({ location: 'reuse', ...args }));
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenNewEditorToSideCommandId,
                title: (0, nls_1.localize2)('search.openNewEditorToSide', 'Open New Search Editor to the Side'),
                category,
                f1: true,
                metadata: openArgMetadata
            });
        }
        async run(accessor, args) {
            await accessor.get(instantiation_1.IInstantiationService).invokeFunction(searchEditorActions_1.openNewSearchEditor, translateLegacyConfig(args), true);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenInEditorCommandId,
                title: (0, nls_1.localize2)('search.openResultsInEditor', 'Open Results in Editor'),
                category,
                f1: true,
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */,
                    when: contextkey_1.ContextKeyExpr.and(SearchConstants.SearchContext.HasSearchResults, SearchConstants.SearchContext.SearchViewFocusedKey),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */
                    }
                },
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
            if (searchView) {
                await instantiationService.invokeFunction(searchEditorActions_1.createEditorFromSearchResult, searchView.searchResult, searchView.searchIncludePattern.getValue(), searchView.searchExcludePattern.getValue(), searchView.searchIncludePattern.onlySearchInOpenEditors());
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: RerunSearchEditorSearchCommandId,
                title: (0, nls_1.localize2)('search.rerunSearchInEditor', 'Search Again'),
                category,
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */,
                    when: SearchEditorConstants.InSearchEditor,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                icon: searchIcons_1.searchRefreshIcon,
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        group: 'navigation',
                        when: contextkeys_1.ActiveEditorContext.isEqualTo(SearchEditorConstants.SearchEditorID)
                    },
                    {
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkeys_1.ActiveEditorContext.isEqualTo(SearchEditorConstants.SearchEditorID)
                    }]
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                editorService.activeEditorPane.triggerSearch({ resetCursor: false });
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: FocusQueryEditorWidgetCommandId,
                title: (0, nls_1.localize2)('search.action.focusQueryEditorWidget', 'Focus Search Editor Input'),
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: {
                    primary: 9 /* KeyCode.Escape */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                editorService.activeEditorPane.focusSearchInput();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: FocusQueryEditorFilesToIncludeCommandId,
                title: (0, nls_1.localize2)('search.action.focusFilesToInclude', 'Focus Search Editor Files to Include'),
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                editorService.activeEditorPane.focusFilesToIncludeInput();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: FocusQueryEditorFilesToExcludeCommandId,
                title: (0, nls_1.localize2)('search.action.focusFilesToExclude', 'Focus Search Editor Files to Exclude'),
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                editorService.activeEditorPane.focusFilesToExcludeInput();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleSearchEditorCaseSensitiveCommandId,
                title: (0, nls_1.localize2)('searchEditor.action.toggleSearchEditorCaseSensitive', 'Toggle Match Case'),
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: SearchConstants.SearchContext.SearchInputBoxFocusedKey,
                }, findModel_1.ToggleCaseSensitiveKeybinding)
            });
        }
        run(accessor) {
            (0, searchEditorActions_1.toggleSearchEditorCaseSensitiveCommand)(accessor);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleSearchEditorWholeWordCommandId,
                title: (0, nls_1.localize2)('searchEditor.action.toggleSearchEditorWholeWord', 'Toggle Match Whole Word'),
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: SearchConstants.SearchContext.SearchInputBoxFocusedKey,
                }, findModel_1.ToggleWholeWordKeybinding)
            });
        }
        run(accessor) {
            (0, searchEditorActions_1.toggleSearchEditorWholeWordCommand)(accessor);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleSearchEditorRegexCommandId,
                title: (0, nls_1.localize2)('searchEditor.action.toggleSearchEditorRegex', "Toggle Use Regular Expression"),
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: SearchConstants.SearchContext.SearchInputBoxFocusedKey,
                }, findModel_1.ToggleRegexKeybinding)
            });
        }
        run(accessor) {
            (0, searchEditorActions_1.toggleSearchEditorRegexCommand)(accessor);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SearchEditorConstants.ToggleSearchEditorContextLinesCommandId,
                title: (0, nls_1.localize2)('searchEditor.action.toggleSearchEditorContextLines', "Toggle Context Lines"),
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 512 /* KeyMod.Alt */ | 42 /* KeyCode.KeyL */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 42 /* KeyCode.KeyL */ }
                }
            });
        }
        run(accessor) {
            (0, searchEditorActions_1.toggleSearchEditorContextLinesCommand)(accessor);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: IncreaseSearchEditorContextLinesCommandId,
                title: (0, nls_1.localize2)('searchEditor.action.increaseSearchEditorContextLines', "Increase Context Lines"),
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 512 /* KeyMod.Alt */ | 86 /* KeyCode.Equal */
                }
            });
        }
        run(accessor) { (0, searchEditorActions_1.modifySearchEditorContextLinesCommand)(accessor, true); }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: DecreaseSearchEditorContextLinesCommandId,
                title: (0, nls_1.localize2)('searchEditor.action.decreaseSearchEditorContextLines', "Decrease Context Lines"),
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 512 /* KeyMod.Alt */ | 88 /* KeyCode.Minus */
                }
            });
        }
        run(accessor) { (0, searchEditorActions_1.modifySearchEditorContextLinesCommand)(accessor, false); }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SelectAllSearchEditorMatchesCommandId,
                title: (0, nls_1.localize2)('searchEditor.action.selectAllSearchEditorMatches', "Select All Matches"),
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 42 /* KeyCode.KeyL */,
                }
            });
        }
        run(accessor) {
            (0, searchEditorActions_1.selectAllSearchEditorMatchesCommand)(accessor);
        }
    });
    (0, actions_1.registerAction2)(class OpenSearchEditorAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'search.action.openNewEditorFromView',
                title: (0, nls_1.localize)('search.openNewEditor', "Open New Search Editor"),
                category,
                icon: searchIcons_1.searchNewEditorIcon,
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID),
                    }]
            });
        }
        run(accessor, ...args) {
            return (0, searchEditorActions_1.openSearchEditor)(accessor);
        }
    });
    //#endregion
    //#region Search Editor Working Copy Editor Handler
    let SearchEditorWorkingCopyEditorHandler = class SearchEditorWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.searchEditorWorkingCopyEditorHandler'; }
        constructor(instantiationService, workingCopyEditorService) {
            super();
            this.instantiationService = instantiationService;
            this._register(workingCopyEditorService.registerHandler(this));
        }
        handles(workingCopy) {
            return workingCopy.resource.scheme === SearchEditorConstants.SearchEditorScheme;
        }
        isOpen(workingCopy, editor) {
            if (!this.handles(workingCopy)) {
                return false;
            }
            return editor instanceof searchEditorInput_1.SearchEditorInput && (0, resources_1.isEqual)(workingCopy.resource, editor.modelUri);
        }
        createEditor(workingCopy) {
            const input = this.instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'model', modelUri: workingCopy.resource });
            input.setDirty(true);
            return input;
        }
    };
    SearchEditorWorkingCopyEditorHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyEditorService_1.IWorkingCopyEditorService)
    ], SearchEditorWorkingCopyEditorHandler);
    (0, contributions_1.registerWorkbenchContribution2)(SearchEditorWorkingCopyEditorHandler.ID, SearchEditorWorkingCopyEditorHandler, 2 /* WorkbenchPhase.BlockRestore */);
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRWRpdG9yLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoRWRpdG9yL2Jyb3dzZXIvc2VhcmNoRWRpdG9yLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQXNDaEcsTUFBTSxxQkFBcUIsR0FBRyw0QkFBNEIsQ0FBQztJQUMzRCxNQUFNLDRCQUE0QixHQUFHLG1DQUFtQyxDQUFDO0lBQ3pFLE1BQU0sK0JBQStCLEdBQUcsc0NBQXNDLENBQUM7SUFDL0UsTUFBTSx1Q0FBdUMsR0FBRyxtQ0FBbUMsQ0FBQztJQUNwRixNQUFNLHVDQUF1QyxHQUFHLG1DQUFtQyxDQUFDO0lBRXBGLE1BQU0sd0NBQXdDLEdBQUcsaUNBQWlDLENBQUM7SUFDbkYsTUFBTSxvQ0FBb0MsR0FBRyw2QkFBNkIsQ0FBQztJQUMzRSxNQUFNLGdDQUFnQyxHQUFHLHlCQUF5QixDQUFDO0lBQ25FLE1BQU0seUNBQXlDLEdBQUcsa0NBQWtDLENBQUM7SUFDckYsTUFBTSx5Q0FBeUMsR0FBRyxrQ0FBa0MsQ0FBQztJQUVyRixNQUFNLGdDQUFnQyxHQUFHLHlCQUF5QixDQUFDO0lBQ25FLE1BQU0sK0JBQStCLEdBQUcsd0JBQXdCLENBQUM7SUFDakUsTUFBTSxxQ0FBcUMsR0FBRyw4QkFBOEIsQ0FBQztJQUk3RSw0QkFBNEI7SUFDNUIsbUJBQVEsQ0FBQyxFQUFFLENBQXNCLHlCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixDQUMvRSw2QkFBb0IsQ0FBQyxNQUFNLENBQzFCLDJCQUFZLEVBQ1osMkJBQVksQ0FBQyxFQUFFLEVBQ2YsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxDQUN6QyxFQUNEO1FBQ0MsSUFBSSw0QkFBYyxDQUFDLHFDQUFpQixDQUFDO0tBQ3JDLENBQ0QsQ0FBQztJQUNGLFlBQVk7SUFFWiw4QkFBOEI7SUFDOUIsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBd0I7aUJBRWIsT0FBRSxHQUFHLGdDQUFnQyxBQUFuQyxDQUFvQztRQUV0RCxZQUN5QixxQkFBNkMsRUFDOUMsb0JBQTJDO1lBRWxFLHFCQUFxQixDQUFDLGNBQWMsQ0FDbkMsR0FBRyxHQUFHLHFDQUFpQixFQUN2QjtnQkFDQyxFQUFFLEVBQUUscUNBQWlCLENBQUMsRUFBRTtnQkFDeEIsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHlDQUF5QyxFQUFFLGVBQWUsQ0FBQztnQkFDM0UsTUFBTSxFQUFFLG1DQUEwQixDQUFDLG1CQUFtQjtnQkFDdEQsUUFBUSxFQUFFLGdEQUF3QixDQUFDLE9BQU87YUFDMUMsRUFDRDtnQkFDQyxpQkFBaUIsRUFBRSxJQUFJO2dCQUN2QixrQkFBa0IsRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBQSxtQkFBTyxFQUFDLFFBQVEsQ0FBQyxLQUFLLHFDQUFpQixDQUFDO2FBQ3pFLEVBQ0Q7Z0JBQ0MsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUU7b0JBQ25DLE9BQU8sRUFBRSxNQUFNLEVBQUUsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDhDQUEwQixFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNqSSxDQUFDO2FBQ0QsQ0FDRCxDQUFDO1FBQ0gsQ0FBQzs7SUExQkksd0JBQXdCO1FBSzNCLFdBQUEsOENBQXNCLENBQUE7UUFDdEIsV0FBQSxxQ0FBcUIsQ0FBQTtPQU5sQix3QkFBd0IsQ0EyQjdCO0lBRUQsSUFBQSw4Q0FBOEIsRUFBQyx3QkFBd0IsQ0FBQyxFQUFFLEVBQUUsd0JBQXdCLHNDQUE4QixDQUFDO0lBTW5ILE1BQU0sMkJBQTJCO1FBRWhDLFlBQVksQ0FBQyxLQUF3QjtZQUNwQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRUQsU0FBUyxDQUFDLEtBQXdCO1lBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsRUFBNEIsQ0FBQyxDQUFDO1lBQzdNLENBQUM7WUFFRCxJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUM7WUFDekIsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztnQkFDdkUsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdEMsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM5QixNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3hELE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7WUFFcEMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsRUFBNEIsQ0FBQyxDQUFDO1FBQ3RKLENBQUM7UUFFRCxXQUFXLENBQUMsb0JBQTJDLEVBQUUscUJBQTZCO1lBQ3JGLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBMkIsQ0FBQztZQUN6SCxJQUFJLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDZCxNQUFNLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsOENBQTBCLEVBQzNFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztvQkFDckgsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdEIsS0FBSyxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDbEMsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksVUFBVSxFQUFFLENBQUM7d0JBQ2hCLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLDhDQUEwQixFQUNwRSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUM1RCxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsOENBQTBCLEVBQ3BFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7b0JBQ3BELENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUFFRCxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIseUJBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsd0JBQXdCLENBQzNGLHFDQUFpQixDQUFDLEVBQUUsRUFDcEIsMkJBQTJCLENBQUMsQ0FBQztJQUM5QixZQUFZO0lBRVosa0JBQWtCO0lBQ2xCLDJCQUFnQixDQUFDLGVBQWUsQ0FDL0IsK0JBQStCLEVBQy9CLENBQUMsUUFBMEIsRUFBRSxFQUFFO1FBQzlCLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUMsZ0JBQWdCLENBQUM7UUFDdkUsSUFBSSxnQkFBZ0IsWUFBWSwyQkFBWSxFQUFFLENBQUM7WUFDOUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDL0IsQ0FBQztJQUNGLENBQUMsQ0FBQyxDQUFDO0lBQ0osWUFBWTtJQUVaLGlCQUFpQjtJQUNqQixNQUFNLFFBQVEsR0FBRyxJQUFBLGVBQVMsRUFBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFpQnRELE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxlQUE4RCxFQUFFLEVBQXdCLEVBQUU7UUFDeEgsTUFBTSxNQUFNLEdBQXlCLEVBQUUsQ0FBQztRQUN4QyxNQUFNLFNBQVMsR0FBd0U7WUFDdEYsUUFBUSxFQUFFLGdCQUFnQjtZQUMxQixRQUFRLEVBQUUsZ0JBQWdCO1lBQzFCLFNBQVMsRUFBRSxnQkFBZ0I7WUFDM0IsYUFBYSxFQUFFLGlCQUFpQjtZQUNoQyxNQUFNLEVBQUUsVUFBVTtZQUNsQixVQUFVLEVBQUUsa0NBQWtDO1NBQzlDLENBQUM7UUFDRixNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUU7WUFDcEQsTUFBYyxDQUFFLFNBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3pELENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDLENBQUM7SUFHRixNQUFNLGVBQWUsR0FBRztRQUN2QixXQUFXLEVBQUUsK0ZBQStGO1FBQzVHLElBQUksRUFBRSxDQUFDO2dCQUNOLElBQUksRUFBRSw2QkFBNkI7Z0JBQ25DLE1BQU0sRUFBRTtvQkFDUCxVQUFVLEVBQUU7d0JBQ1gsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTt3QkFDekIsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTt3QkFDbEMsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTt3QkFDbEMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTt3QkFDaEMsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTt3QkFDbkMsZUFBZSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTt3QkFDcEMsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTt3QkFDN0IsZ0NBQWdDLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO3dCQUNyRCxvQkFBb0IsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7d0JBQ3pDLGFBQWEsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7d0JBQ2xDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7d0JBQ2pDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7cUJBQ3BDO2lCQUNEO2FBQ0QsQ0FBQztLQUNPLENBQUM7SUFFWCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw4Q0FBOEM7Z0JBQ2xELEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxnQ0FBZ0MsRUFBRSxxQkFBcUIsQ0FBQztnQkFDekUsVUFBVSxFQUFFO29CQUNYLE1BQU0sMENBQWdDO29CQUN0QyxPQUFPLEVBQUUsbURBQTZCLDRCQUFvQjtpQkFDMUQ7Z0JBQ0QsWUFBWSxFQUFFLHFCQUFxQixDQUFDLGNBQWM7Z0JBQ2xELFFBQVE7Z0JBQ1IsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUNuQyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUMsVUFBVSxDQUFDLElBQUEsc0JBQWdCLEdBQUUsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUM5RSxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQyxnQkFBaUMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3JGLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUscUJBQXFCLENBQUMsc0JBQXNCO2dCQUNoRCxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsNEJBQTRCLEVBQUUsbUJBQW1CLENBQUM7Z0JBQ25FLFFBQVE7Z0JBQ1IsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsUUFBUSxFQUFFLGVBQWU7YUFDekIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxJQUFtRDtZQUN4RixNQUFNLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQyxjQUFjLENBQUMseUNBQW1CLEVBQUUscUJBQXFCLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BJLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQyxtQkFBbUI7Z0JBQzdDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyx5QkFBeUIsRUFBRSxvQkFBb0IsQ0FBQztnQkFDakUsUUFBUTtnQkFDUixFQUFFLEVBQUUsSUFBSTtnQkFDUixRQUFRLEVBQUUsZUFBZTthQUN6QixDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLElBQW1EO1lBQ3hGLE1BQU0sUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDLGNBQWMsQ0FBQyx5Q0FBbUIsRUFBRSxxQkFBcUIsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEksQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFDcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDRCQUE0QjtnQkFDaEMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDRCQUE0QixFQUFFLG9DQUFvQyxDQUFDO2dCQUNwRixRQUFRO2dCQUNSLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFFBQVEsRUFBRSxlQUFlO2FBQ3pCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsSUFBbUQ7WUFDeEYsTUFBTSxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUMsY0FBYyxDQUFDLHlDQUFtQixFQUFFLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xILENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxxQkFBcUI7Z0JBQ3pCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyw0QkFBNEIsRUFBRSx3QkFBd0IsQ0FBQztnQkFDeEUsUUFBUTtnQkFDUixFQUFFLEVBQUUsSUFBSTtnQkFDUixVQUFVLEVBQUU7b0JBQ1gsT0FBTyxFQUFFLDRDQUEwQjtvQkFDbkMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQztvQkFDNUgsTUFBTSw2Q0FBbUM7b0JBQ3pDLEdBQUcsRUFBRTt3QkFDSixPQUFPLEVBQUUsaURBQThCO3FCQUN2QztpQkFDRDthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQ25DLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQWEsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sVUFBVSxHQUFHLElBQUEsaUNBQWEsRUFBQyxZQUFZLENBQUMsQ0FBQztZQUMvQyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixNQUFNLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxrREFBNEIsRUFBRSxVQUFVLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxVQUFVLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFFLEVBQUUsVUFBVSxDQUFDLG9CQUFvQixDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQztZQUNyUCxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFDcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGdDQUFnQztnQkFDcEMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDRCQUE0QixFQUFFLGNBQWMsQ0FBQztnQkFDOUQsUUFBUTtnQkFDUixVQUFVLEVBQUU7b0JBQ1gsT0FBTyxFQUFFLG1EQUE2Qix3QkFBZTtvQkFDckQsSUFBSSxFQUFFLHFCQUFxQixDQUFDLGNBQWM7b0JBQzFDLE1BQU0sMENBQWdDO2lCQUN0QztnQkFDRCxJQUFJLEVBQUUsK0JBQWlCO2dCQUN2QixJQUFJLEVBQUUsQ0FBQzt3QkFDTixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxXQUFXO3dCQUN0QixLQUFLLEVBQUUsWUFBWTt3QkFDbkIsSUFBSSxFQUFFLGlDQUFtQixDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUM7cUJBQ3pFO29CQUNEO3dCQUNDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGNBQWM7d0JBQ3pCLElBQUksRUFBRSxpQ0FBbUIsQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDO3FCQUN6RSxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxLQUFLLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQztZQUN6QyxJQUFJLEtBQUssWUFBWSxxQ0FBaUIsRUFBRSxDQUFDO2dCQUN2QyxhQUFhLENBQUMsZ0JBQWlDLENBQUMsYUFBYSxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDeEYsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwrQkFBK0I7Z0JBQ25DLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxzQ0FBc0MsRUFBRSwyQkFBMkIsQ0FBQztnQkFDckYsUUFBUTtnQkFDUixFQUFFLEVBQUUsSUFBSTtnQkFDUixZQUFZLEVBQUUscUJBQXFCLENBQUMsY0FBYztnQkFDbEQsVUFBVSxFQUFFO29CQUNYLE9BQU8sd0JBQWdCO29CQUN2QixNQUFNLDBDQUFnQztpQkFDdEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUNuQyxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztZQUNuRCxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDO1lBQ3pDLElBQUksS0FBSyxZQUFZLHFDQUFpQixFQUFFLENBQUM7Z0JBQ3ZDLGFBQWEsQ0FBQyxnQkFBaUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3JFLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsdUNBQXVDO2dCQUMzQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsbUNBQW1DLEVBQUUsc0NBQXNDLENBQUM7Z0JBQzdGLFFBQVE7Z0JBQ1IsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsWUFBWSxFQUFFLHFCQUFxQixDQUFDLGNBQWM7YUFDbEQsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxLQUFLLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQztZQUN6QyxJQUFJLEtBQUssWUFBWSxxQ0FBaUIsRUFBRSxDQUFDO2dCQUN2QyxhQUFhLENBQUMsZ0JBQWlDLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUM3RSxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFDcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHVDQUF1QztnQkFDM0MsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLG1DQUFtQyxFQUFFLHNDQUFzQyxDQUFDO2dCQUM3RixRQUFRO2dCQUNSLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFlBQVksRUFBRSxxQkFBcUIsQ0FBQyxjQUFjO2FBQ2xELENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQ25DLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUM7WUFDekMsSUFBSSxLQUFLLFlBQVkscUNBQWlCLEVBQUUsQ0FBQztnQkFDdkMsYUFBYSxDQUFDLGdCQUFpQyxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDN0UsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSx3Q0FBd0M7Z0JBQzVDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxxREFBcUQsRUFBRSxtQkFBbUIsQ0FBQztnQkFDNUYsUUFBUTtnQkFDUixFQUFFLEVBQUUsSUFBSTtnQkFDUixZQUFZLEVBQUUscUJBQXFCLENBQUMsY0FBYztnQkFDbEQsVUFBVSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUM7b0JBQ3pCLE1BQU0sNkNBQW1DO29CQUN6QyxJQUFJLEVBQUUsZUFBZSxDQUFDLGFBQWEsQ0FBQyx3QkFBd0I7aUJBQzVELEVBQUUseUNBQTZCLENBQUM7YUFDakMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixJQUFBLDREQUFzQyxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xELENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxvQ0FBb0M7Z0JBQ3hDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxpREFBaUQsRUFBRSx5QkFBeUIsQ0FBQztnQkFDOUYsUUFBUTtnQkFDUixFQUFFLEVBQUUsSUFBSTtnQkFDUixZQUFZLEVBQUUscUJBQXFCLENBQUMsY0FBYztnQkFDbEQsVUFBVSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUM7b0JBQ3pCLE1BQU0sNkNBQW1DO29CQUN6QyxJQUFJLEVBQUUsZUFBZSxDQUFDLGFBQWEsQ0FBQyx3QkFBd0I7aUJBQzVELEVBQUUscUNBQXlCLENBQUM7YUFDN0IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixJQUFBLHdEQUFrQyxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxnQ0FBZ0M7Z0JBQ3BDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyw2Q0FBNkMsRUFBRSwrQkFBK0IsQ0FBQztnQkFDaEcsUUFBUTtnQkFDUixFQUFFLEVBQUUsSUFBSTtnQkFDUixZQUFZLEVBQUUscUJBQXFCLENBQUMsY0FBYztnQkFDbEQsVUFBVSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUM7b0JBQ3pCLE1BQU0sNkNBQW1DO29CQUN6QyxJQUFJLEVBQUUsZUFBZSxDQUFDLGFBQWEsQ0FBQyx3QkFBd0I7aUJBQzVELEVBQUUsaUNBQXFCLENBQUM7YUFDekIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixJQUFBLG9EQUE4QixFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQyx1Q0FBdUM7Z0JBQ2pFLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxvREFBb0QsRUFBRSxzQkFBc0IsQ0FBQztnQkFDOUYsUUFBUTtnQkFDUixFQUFFLEVBQUUsSUFBSTtnQkFDUixZQUFZLEVBQUUscUJBQXFCLENBQUMsY0FBYztnQkFDbEQsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxPQUFPLEVBQUUsNENBQXlCO29CQUNsQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsZ0RBQTJCLHdCQUFlLEVBQUU7aUJBQzVEO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixJQUFBLDJEQUFxQyxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSx5Q0FBeUM7Z0JBQzdDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxzREFBc0QsRUFBRSx3QkFBd0IsQ0FBQztnQkFDbEcsUUFBUTtnQkFDUixFQUFFLEVBQUUsSUFBSTtnQkFDUixZQUFZLEVBQUUscUJBQXFCLENBQUMsY0FBYztnQkFDbEQsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxPQUFPLEVBQUUsNkNBQTBCO2lCQUNuQzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxHQUFHLENBQUMsUUFBMEIsSUFBSSxJQUFBLDJEQUFxQyxFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDMUYsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUseUNBQXlDO2dCQUM3QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsc0RBQXNELEVBQUUsd0JBQXdCLENBQUM7Z0JBQ2xHLFFBQVE7Z0JBQ1IsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsWUFBWSxFQUFFLHFCQUFxQixDQUFDLGNBQWM7Z0JBQ2xELFVBQVUsRUFBRTtvQkFDWCxNQUFNLDZDQUFtQztvQkFDekMsT0FBTyxFQUFFLDZDQUEwQjtpQkFDbkM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsR0FBRyxDQUFDLFFBQTBCLElBQUksSUFBQSwyREFBcUMsRUFBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzNGLENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFDcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHFDQUFxQztnQkFDekMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLGtEQUFrRCxFQUFFLG9CQUFvQixDQUFDO2dCQUMxRixRQUFRO2dCQUNSLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFlBQVksRUFBRSxxQkFBcUIsQ0FBQyxjQUFjO2dCQUNsRCxVQUFVLEVBQUU7b0JBQ1gsTUFBTSw2Q0FBbUM7b0JBQ3pDLE9BQU8sRUFBRSxtREFBNkIsd0JBQWU7aUJBQ3JEO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixJQUFBLHlEQUFtQyxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsTUFBTSxzQkFBdUIsU0FBUSxpQkFBTztRQUMzRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUscUNBQXFDO2dCQUN6QyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsd0JBQXdCLENBQUM7Z0JBQ2pFLFFBQVE7Z0JBQ1IsSUFBSSxFQUFFLGlDQUFtQjtnQkFDekIsSUFBSSxFQUFFLENBQUM7d0JBQ04sRUFBRSxFQUFFLGdCQUFNLENBQUMsU0FBUzt3QkFDcEIsS0FBSyxFQUFFLFlBQVk7d0JBQ25CLEtBQUssRUFBRSxDQUFDO3dCQUNSLElBQUksRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsZ0JBQU8sQ0FBQztxQkFDNUMsQ0FBQzthQUNGLENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7WUFDN0MsT0FBTyxJQUFBLHNDQUFnQixFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLENBQUM7S0FDRCxDQUFDLENBQUM7SUFDSCxZQUFZO0lBRVosbURBQW1EO0lBQ25ELElBQU0sb0NBQW9DLEdBQTFDLE1BQU0sb0NBQXFDLFNBQVEsc0JBQVU7aUJBRTVDLE9BQUUsR0FBRyx3REFBd0QsQUFBM0QsQ0FBNEQ7UUFFOUUsWUFDeUMsb0JBQTJDLEVBQ3hELHdCQUFtRDtZQUU5RSxLQUFLLEVBQUUsQ0FBQztZQUhnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBS25GLElBQUksQ0FBQyxTQUFTLENBQUMsd0JBQXdCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELE9BQU8sQ0FBQyxXQUFtQztZQUMxQyxPQUFPLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLHFCQUFxQixDQUFDLGtCQUFrQixDQUFDO1FBQ2pGLENBQUM7UUFFRCxNQUFNLENBQUMsV0FBbUMsRUFBRSxNQUFtQjtZQUM5RCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLE1BQU0sWUFBWSxxQ0FBaUIsSUFBSSxJQUFBLG1CQUFPLEVBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUVELFlBQVksQ0FBQyxXQUFtQztZQUMvQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDhDQUEwQixFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDdEksS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVyQixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7O0lBOUJJLG9DQUFvQztRQUt2QyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsb0RBQXlCLENBQUE7T0FOdEIsb0NBQW9DLENBK0J6QztJQUVELElBQUEsOENBQThCLEVBQUMsb0NBQW9DLENBQUMsRUFBRSxFQUFFLG9DQUFvQyxzQ0FBOEIsQ0FBQzs7QUFDM0ksWUFBWSJ9