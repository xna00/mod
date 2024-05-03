/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchEditorInputTypeId = exports.ToggleSearchEditorContextLinesCommandId = exports.OpenEditorCommandId = exports.OpenNewEditorCommandId = exports.SearchEditorID = exports.SearchEditorFindMatchClass = exports.SearchEditorWorkingCopyTypeId = exports.SearchEditorScheme = exports.InSearchEditor = void 0;
    exports.InSearchEditor = new contextkey_1.RawContextKey('inSearchEditor', false);
    exports.SearchEditorScheme = 'search-editor';
    exports.SearchEditorWorkingCopyTypeId = 'search/editor';
    exports.SearchEditorFindMatchClass = 'searchEditorFindMatch';
    exports.SearchEditorID = 'workbench.editor.searchEditor';
    exports.OpenNewEditorCommandId = 'search.action.openNewEditor';
    exports.OpenEditorCommandId = 'search.action.openEditor';
    exports.ToggleSearchEditorContextLinesCommandId = 'toggleSearchEditorContextLines';
    exports.SearchEditorInputTypeId = 'workbench.editorinputs.searchEditorInput';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2hFZGl0b3IvYnJvd3Nlci9jb25zdGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSW5GLFFBQUEsY0FBYyxHQUFHLElBQUksMEJBQWEsQ0FBVSxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRSxRQUFBLGtCQUFrQixHQUFHLGVBQWUsQ0FBQztJQUVyQyxRQUFBLDZCQUE2QixHQUFHLGVBQWUsQ0FBQztJQUVoRCxRQUFBLDBCQUEwQixHQUFHLHVCQUF1QixDQUFDO0lBRXJELFFBQUEsY0FBYyxHQUFHLCtCQUErQixDQUFDO0lBRWpELFFBQUEsc0JBQXNCLEdBQUcsNkJBQTZCLENBQUM7SUFDdkQsUUFBQSxtQkFBbUIsR0FBRywwQkFBMEIsQ0FBQztJQUNqRCxRQUFBLHVDQUF1QyxHQUFHLGdDQUFnQyxDQUFDO0lBRTNFLFFBQUEsdUJBQXVCLEdBQUcsMENBQTBDLENBQUMifQ==