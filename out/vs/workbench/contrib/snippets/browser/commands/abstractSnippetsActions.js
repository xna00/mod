/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/nls", "vs/platform/actions/common/actions"], function (require, exports, editorExtensions_1, nls_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetEditorAction = exports.SnippetsAction = void 0;
    const defaultOptions = {
        category: (0, nls_1.localize2)('snippets', "Snippets"),
    };
    class SnippetsAction extends actions_1.Action2 {
        constructor(desc) {
            super({ ...defaultOptions, ...desc });
        }
    }
    exports.SnippetsAction = SnippetsAction;
    class SnippetEditorAction extends editorExtensions_1.EditorAction2 {
        constructor(desc) {
            super({ ...defaultOptions, ...desc });
        }
    }
    exports.SnippetEditorAction = SnippetEditorAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RTbmlwcGV0c0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NuaXBwZXRzL2Jyb3dzZXIvY29tbWFuZHMvYWJzdHJhY3RTbmlwcGV0c0FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQU0sY0FBYyxHQUFHO1FBQ3RCLFFBQVEsRUFBRSxJQUFBLGVBQVMsRUFBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO0tBQ2xDLENBQUM7SUFFWCxNQUFzQixjQUFlLFNBQVEsaUJBQU87UUFFbkQsWUFBWSxJQUErQjtZQUMxQyxLQUFLLENBQUMsRUFBRSxHQUFHLGNBQWMsRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdkMsQ0FBQztLQUNEO0lBTEQsd0NBS0M7SUFFRCxNQUFzQixtQkFBb0IsU0FBUSxnQ0FBYTtRQUU5RCxZQUFZLElBQStCO1lBQzFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsY0FBYyxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN2QyxDQUFDO0tBQ0Q7SUFMRCxrREFLQyJ9