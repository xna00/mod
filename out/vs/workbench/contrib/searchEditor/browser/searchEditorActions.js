/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/editor/browser/editorBrowser", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/history/common/history", "vs/css!./media/searchEditor"], function (require, exports, network_1, editorBrowser_1, configuration_1, instantiation_1, label_1, telemetry_1, workspace_1, viewsService_1, searchActionsBase_1, searchEditorInput_1, searchEditorSerialization_1, configurationResolver_1, editorGroupsService_1, editorService_1, history_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createEditorFromSearchResult = exports.openNewSearchEditor = exports.selectAllSearchEditorMatchesCommand = exports.modifySearchEditorContextLinesCommand = exports.toggleSearchEditorContextLinesCommand = exports.toggleSearchEditorRegexCommand = exports.toggleSearchEditorWholeWordCommand = exports.toggleSearchEditorCaseSensitiveCommand = void 0;
    exports.openSearchEditor = openSearchEditor;
    const toggleSearchEditorCaseSensitiveCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleCaseSensitive();
        }
    };
    exports.toggleSearchEditorCaseSensitiveCommand = toggleSearchEditorCaseSensitiveCommand;
    const toggleSearchEditorWholeWordCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleWholeWords();
        }
    };
    exports.toggleSearchEditorWholeWordCommand = toggleSearchEditorWholeWordCommand;
    const toggleSearchEditorRegexCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleRegex();
        }
    };
    exports.toggleSearchEditorRegexCommand = toggleSearchEditorRegexCommand;
    const toggleSearchEditorContextLinesCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleContextLines();
        }
    };
    exports.toggleSearchEditorContextLinesCommand = toggleSearchEditorContextLinesCommand;
    const modifySearchEditorContextLinesCommand = (accessor, increase) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.modifyContextLines(increase);
        }
    };
    exports.modifySearchEditorContextLinesCommand = modifySearchEditorContextLinesCommand;
    const selectAllSearchEditorMatchesCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.focusAllResults();
        }
    };
    exports.selectAllSearchEditorMatchesCommand = selectAllSearchEditorMatchesCommand;
    async function openSearchEditor(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        if (searchView) {
            await instantiationService.invokeFunction(exports.openNewSearchEditor, {
                filesToInclude: searchView.searchIncludePattern.getValue(),
                onlyOpenEditors: searchView.searchIncludePattern.onlySearchInOpenEditors(),
                filesToExclude: searchView.searchExcludePattern.getValue(),
                isRegexp: searchView.searchAndReplaceWidget.searchInput?.getRegex(),
                isCaseSensitive: searchView.searchAndReplaceWidget.searchInput?.getCaseSensitive(),
                matchWholeWord: searchView.searchAndReplaceWidget.searchInput?.getWholeWords(),
                useExcludeSettingsAndIgnoreFiles: searchView.searchExcludePattern.useExcludesAndIgnoreFiles(),
                showIncludesExcludes: !!(searchView.searchIncludePattern.getValue() || searchView.searchExcludePattern.getValue() || !searchView.searchExcludePattern.useExcludesAndIgnoreFiles())
            });
        }
        else {
            await instantiationService.invokeFunction(exports.openNewSearchEditor);
        }
    }
    const openNewSearchEditor = async (accessor, _args = {}, toSide = false) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
        const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
        const historyService = accessor.get(history_1.IHistoryService);
        const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
        const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
        const activeEditorControl = editorService.activeTextEditorControl;
        let activeModel;
        let selected = '';
        if (activeEditorControl) {
            if ((0, editorBrowser_1.isDiffEditor)(activeEditorControl)) {
                if (activeEditorControl.getOriginalEditor().hasTextFocus()) {
                    activeModel = activeEditorControl.getOriginalEditor();
                }
                else {
                    activeModel = activeEditorControl.getModifiedEditor();
                }
            }
            else {
                activeModel = activeEditorControl;
            }
            const selection = activeModel?.getSelection();
            selected = (selection && activeModel?.getModel()?.getValueInRange(selection)) ?? '';
            if (selection?.isEmpty() && configurationService.getValue('search').seedWithNearestWord) {
                const wordAtPosition = activeModel.getModel()?.getWordAtPosition(selection.getStartPosition());
                if (wordAtPosition) {
                    selected = wordAtPosition.word;
                }
            }
        }
        else {
            if (editorService.activeEditor instanceof searchEditorInput_1.SearchEditorInput) {
                const active = editorService.activeEditorPane;
                selected = active.getSelected();
            }
        }
        telemetryService.publicLog2('searchEditor/openNewSearchEditor');
        const seedSearchStringFromSelection = _args.location === 'new' || configurationService.getValue('editor').find.seedSearchStringFromSelection;
        const args = { query: seedSearchStringFromSelection ? selected : undefined };
        for (const entry of Object.entries(_args)) {
            const name = entry[0];
            const value = entry[1];
            if (value !== undefined) {
                args[name] = (typeof value === 'string') ? await configurationResolverService.resolveAsync(lastActiveWorkspaceRoot, value) : value;
            }
        }
        const existing = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).find(id => id.editor.typeId === searchEditorInput_1.SearchEditorInput.ID);
        let editor;
        if (existing && args.location === 'reuse') {
            const group = editorGroupsService.getGroup(existing.groupId);
            if (!group) {
                throw new Error('Invalid group id for search editor');
            }
            const input = existing.editor;
            editor = (await group.openEditor(input));
            if (selected) {
                editor.setQuery(selected);
            }
            else {
                editor.selectQuery();
            }
            editor.setSearchConfig(args);
        }
        else {
            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { config: args, resultsContents: '', from: 'rawData' });
            // TODO @roblourens make this use the editor resolver service if possible
            editor = await editorService.openEditor(input, { pinned: true }, toSide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
        }
        const searchOnType = configurationService.getValue('search').searchOnType;
        if (args.triggerSearch === true ||
            args.triggerSearch !== false && searchOnType && args.query) {
            editor.triggerSearch({ focusResults: args.focusResults });
        }
        if (!args.focusResults) {
            editor.focusSearchInput();
        }
    };
    exports.openNewSearchEditor = openNewSearchEditor;
    const createEditorFromSearchResult = async (accessor, searchResult, rawIncludePattern, rawExcludePattern, onlySearchInOpenEditors) => {
        if (!searchResult.query) {
            console.error('Expected searchResult.query to be defined. Got', searchResult);
            return;
        }
        const editorService = accessor.get(editorService_1.IEditorService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const labelService = accessor.get(label_1.ILabelService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const sortOrder = configurationService.getValue('search').sortOrder;
        telemetryService.publicLog2('searchEditor/createEditorFromSearchResult');
        const labelFormatter = (uri) => labelService.getUriLabel(uri, { relative: true });
        const { text, matchRanges, config } = (0, searchEditorSerialization_1.serializeSearchResultForEditor)(searchResult, rawIncludePattern, rawExcludePattern, 0, labelFormatter, sortOrder);
        config.onlyOpenEditors = onlySearchInOpenEditors;
        const contextLines = configurationService.getValue('search').searchEditor.defaultNumberOfContextLines;
        if (searchResult.isDirty || contextLines === 0 || contextLines === null) {
            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { resultsContents: text, config, from: 'rawData' });
            await editorService.openEditor(input, { pinned: true });
            input.setMatchRanges(matchRanges);
        }
        else {
            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'rawData', resultsContents: '', config: { ...config, contextLines } });
            const editor = await editorService.openEditor(input, { pinned: true });
            editor.triggerSearch({ focusResults: true });
        }
    };
    exports.createEditorFromSearchResult = createEditorFromSearchResult;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRWRpdG9yQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoRWRpdG9yL2Jyb3dzZXIvc2VhcmNoRWRpdG9yQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwRWhHLDRDQWtCQztJQWxFTSxNQUFNLHNDQUFzQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxFQUFFO1FBQ3BGLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUM7UUFDekMsSUFBSSxLQUFLLFlBQVkscUNBQWlCLEVBQUUsQ0FBQztZQUN2QyxhQUFhLENBQUMsZ0JBQWlDLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUN4RSxDQUFDO0lBQ0YsQ0FBQyxDQUFDO0lBTlcsUUFBQSxzQ0FBc0MsMENBTWpEO0lBRUssTUFBTSxrQ0FBa0MsR0FBRyxDQUFDLFFBQTBCLEVBQUUsRUFBRTtRQUNoRixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztRQUNuRCxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDO1FBQ3pDLElBQUksS0FBSyxZQUFZLHFDQUFpQixFQUFFLENBQUM7WUFDdkMsYUFBYSxDQUFDLGdCQUFpQyxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDckUsQ0FBQztJQUNGLENBQUMsQ0FBQztJQU5XLFFBQUEsa0NBQWtDLHNDQU03QztJQUVLLE1BQU0sOEJBQThCLEdBQUcsQ0FBQyxRQUEwQixFQUFFLEVBQUU7UUFDNUUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7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