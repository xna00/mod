/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/editor/common/editorPaneService", "vs/workbench/browser/editor", "vs/platform/instantiation/common/extensions"], function (require, exports, editorPaneService_1, editor_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorPaneService = void 0;
    class EditorPaneService {
        constructor() {
            this.onWillInstantiateEditorPane = editor_1.EditorPaneDescriptor.onWillInstantiateEditorPane;
        }
        didInstantiateEditorPane(typeId) {
            return editor_1.EditorPaneDescriptor.didInstantiateEditorPane(typeId);
        }
    }
    exports.EditorPaneService = EditorPaneService;
    (0, extensions_1.registerSingleton)(editorPaneService_1.IEditorPaneService, EditorPaneService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUGFuZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9lZGl0b3IvYnJvd3Nlci9lZGl0b3JQYW5lU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxpQkFBaUI7UUFBOUI7WUFJVSxnQ0FBMkIsR0FBRyw2QkFBb0IsQ0FBQywyQkFBMkIsQ0FBQztRQUt6RixDQUFDO1FBSEEsd0JBQXdCLENBQUMsTUFBYztZQUN0QyxPQUFPLDZCQUFvQixDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlELENBQUM7S0FDRDtJQVRELDhDQVNDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxzQ0FBa0IsRUFBRSxpQkFBaUIsb0NBQTRCLENBQUMifQ==