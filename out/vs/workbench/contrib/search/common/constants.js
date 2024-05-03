/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchContext = exports.SearchCommandIds = void 0;
    var SearchCommandIds;
    (function (SearchCommandIds) {
        SearchCommandIds["FindInFilesActionId"] = "workbench.action.findInFiles";
        SearchCommandIds["FocusActiveEditorCommandId"] = "search.action.focusActiveEditor";
        SearchCommandIds["FocusSearchFromResults"] = "search.action.focusSearchFromResults";
        SearchCommandIds["OpenMatch"] = "search.action.openResult";
        SearchCommandIds["OpenMatchToSide"] = "search.action.openResultToSide";
        SearchCommandIds["RemoveActionId"] = "search.action.remove";
        SearchCommandIds["CopyPathCommandId"] = "search.action.copyPath";
        SearchCommandIds["CopyMatchCommandId"] = "search.action.copyMatch";
        SearchCommandIds["CopyAllCommandId"] = "search.action.copyAll";
        SearchCommandIds["OpenInEditorCommandId"] = "search.action.openInEditor";
        SearchCommandIds["ClearSearchHistoryCommandId"] = "search.action.clearHistory";
        SearchCommandIds["FocusSearchListCommandID"] = "search.action.focusSearchList";
        SearchCommandIds["ReplaceActionId"] = "search.action.replace";
        SearchCommandIds["ReplaceAllInFileActionId"] = "search.action.replaceAllInFile";
        SearchCommandIds["ReplaceAllInFolderActionId"] = "search.action.replaceAllInFolder";
        SearchCommandIds["CloseReplaceWidgetActionId"] = "closeReplaceInFilesWidget";
        SearchCommandIds["ToggleCaseSensitiveCommandId"] = "toggleSearchCaseSensitive";
        SearchCommandIds["ToggleWholeWordCommandId"] = "toggleSearchWholeWord";
        SearchCommandIds["ToggleRegexCommandId"] = "toggleSearchRegex";
        SearchCommandIds["TogglePreserveCaseId"] = "toggleSearchPreserveCase";
        SearchCommandIds["AddCursorsAtSearchResults"] = "addCursorsAtSearchResults";
        SearchCommandIds["RevealInSideBarForSearchResults"] = "search.action.revealInSideBar";
        SearchCommandIds["ReplaceInFilesActionId"] = "workbench.action.replaceInFiles";
        SearchCommandIds["ShowAllSymbolsActionId"] = "workbench.action.showAllSymbols";
        SearchCommandIds["QuickTextSearchActionId"] = "workbench.action.experimental.quickTextSearch";
        SearchCommandIds["CancelSearchActionId"] = "search.action.cancel";
        SearchCommandIds["RefreshSearchResultsActionId"] = "search.action.refreshSearchResults";
        SearchCommandIds["FocusNextSearchResultActionId"] = "search.action.focusNextSearchResult";
        SearchCommandIds["FocusPreviousSearchResultActionId"] = "search.action.focusPreviousSearchResult";
        SearchCommandIds["ToggleSearchOnTypeActionId"] = "workbench.action.toggleSearchOnType";
        SearchCommandIds["CollapseSearchResultsActionId"] = "search.action.collapseSearchResults";
        SearchCommandIds["ExpandSearchResultsActionId"] = "search.action.expandSearchResults";
        SearchCommandIds["ClearSearchResultsActionId"] = "search.action.clearSearchResults";
        SearchCommandIds["ViewAsTreeActionId"] = "search.action.viewAsTree";
        SearchCommandIds["ViewAsListActionId"] = "search.action.viewAsList";
        SearchCommandIds["ShowAIResultsActionId"] = "search.action.showAIResults";
        SearchCommandIds["HideAIResultsActionId"] = "search.action.hideAIResults";
        SearchCommandIds["ToggleQueryDetailsActionId"] = "workbench.action.search.toggleQueryDetails";
        SearchCommandIds["ExcludeFolderFromSearchId"] = "search.action.excludeFromSearch";
        SearchCommandIds["FocusNextInputActionId"] = "search.focus.nextInputBox";
        SearchCommandIds["FocusPreviousInputActionId"] = "search.focus.previousInputBox";
        SearchCommandIds["RestrictSearchToFolderId"] = "search.action.restrictSearchToFolder";
        SearchCommandIds["FindInFolderId"] = "filesExplorer.findInFolder";
        SearchCommandIds["FindInWorkspaceId"] = "filesExplorer.findInWorkspace";
    })(SearchCommandIds || (exports.SearchCommandIds = SearchCommandIds = {}));
    exports.SearchContext = {
        SearchViewVisibleKey: new contextkey_1.RawContextKey('searchViewletVisible', true),
        SearchViewFocusedKey: new contextkey_1.RawContextKey('searchViewletFocus', false),
        InputBoxFocusedKey: new contextkey_1.RawContextKey('inputBoxFocus', false),
        SearchInputBoxFocusedKey: new contextkey_1.RawContextKey('searchInputBoxFocus', false),
        ReplaceInputBoxFocusedKey: new contextkey_1.RawContextKey('replaceInputBoxFocus', false),
        PatternIncludesFocusedKey: new contextkey_1.RawContextKey('patternIncludesInputBoxFocus', false),
        PatternExcludesFocusedKey: new contextkey_1.RawContextKey('patternExcludesInputBoxFocus', false),
        ReplaceActiveKey: new contextkey_1.RawContextKey('replaceActive', false),
        HasSearchResults: new contextkey_1.RawContextKey('hasSearchResult', false),
        FirstMatchFocusKey: new contextkey_1.RawContextKey('firstMatchFocus', false),
        FileMatchOrMatchFocusKey: new contextkey_1.RawContextKey('fileMatchOrMatchFocus', false), // This is actually, Match or File or Folder
        FileMatchOrFolderMatchFocusKey: new contextkey_1.RawContextKey('fileMatchOrFolderMatchFocus', false),
        FileMatchOrFolderMatchWithResourceFocusKey: new contextkey_1.RawContextKey('fileMatchOrFolderMatchWithResourceFocus', false), // Excludes "Other files"
        FileFocusKey: new contextkey_1.RawContextKey('fileMatchFocus', false),
        FolderFocusKey: new contextkey_1.RawContextKey('folderMatchFocus', false),
        ResourceFolderFocusKey: new contextkey_1.RawContextKey('folderMatchWithResourceFocus', false),
        IsEditableItemKey: new contextkey_1.RawContextKey('isEditableItem', true),
        MatchFocusKey: new contextkey_1.RawContextKey('matchFocus', false),
        ViewHasSearchPatternKey: new contextkey_1.RawContextKey('viewHasSearchPattern', false),
        ViewHasReplacePatternKey: new contextkey_1.RawContextKey('viewHasReplacePattern', false),
        ViewHasFilePatternKey: new contextkey_1.RawContextKey('viewHasFilePattern', false),
        ViewHasSomeCollapsibleKey: new contextkey_1.RawContextKey('viewHasSomeCollapsibleResult', false),
        InTreeViewKey: new contextkey_1.RawContextKey('inTreeView', false),
        AIResultsVisibleKey: new contextkey_1.RawContextKey('AIResultsVisibleKey', false),
        hasAIResultProvider: new contextkey_1.RawContextKey('hasAIResultProviderKey', false),
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvY29tbW9uL2NvbnN0YW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsSUFBa0IsZ0JBNkNqQjtJQTdDRCxXQUFrQixnQkFBZ0I7UUFDakMsd0VBQW9ELENBQUE7UUFDcEQsa0ZBQThELENBQUE7UUFDOUQsbUZBQStELENBQUE7UUFDL0QsMERBQXNDLENBQUE7UUFDdEMsc0VBQWtELENBQUE7UUFDbEQsMkRBQXVDLENBQUE7UUFDdkMsZ0VBQTRDLENBQUE7UUFDNUMsa0VBQThDLENBQUE7UUFDOUMsOERBQTBDLENBQUE7UUFDMUMsd0VBQW9ELENBQUE7UUFDcEQsOEVBQTBELENBQUE7UUFDMUQsOEVBQTBELENBQUE7UUFDMUQsNkRBQXlDLENBQUE7UUFDekMsK0VBQTJELENBQUE7UUFDM0QsbUZBQStELENBQUE7UUFDL0QsNEVBQXdELENBQUE7UUFDeEQsOEVBQTBELENBQUE7UUFDMUQsc0VBQWtELENBQUE7UUFDbEQsOERBQTBDLENBQUE7UUFDMUMscUVBQWlELENBQUE7UUFDakQsMkVBQXVELENBQUE7UUFDdkQscUZBQWlFLENBQUE7UUFDakUsOEVBQTBELENBQUE7UUFDMUQsOEVBQTBELENBQUE7UUFDMUQsNkZBQXlFLENBQUE7UUFDekUsaUVBQTZDLENBQUE7UUFDN0MsdUZBQW1FLENBQUE7UUFDbkUseUZBQXFFLENBQUE7UUFDckUsaUdBQTZFLENBQUE7UUFDN0Usc0ZBQWtFLENBQUE7UUFDbEUseUZBQXFFLENBQUE7UUFDckUscUZBQWlFLENBQUE7UUFDakUsbUZBQStELENBQUE7UUFDL0QsbUVBQStDLENBQUE7UUFDL0MsbUVBQStDLENBQUE7UUFDL0MseUVBQXFELENBQUE7UUFD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