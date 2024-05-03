/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleNotebookProviderInfo = exports.INotebookService = void 0;
    exports.INotebookService = (0, instantiation_1.createDecorator)('notebookService');
    class SimpleNotebookProviderInfo {
        constructor(viewType, serializer, extensionData) {
            this.viewType = viewType;
            this.serializer = serializer;
            this.extensionData = extensionData;
        }
    }
    exports.SimpleNotebookProviderInfo = SimpleNotebookProviderInfo;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9jb21tb24vbm90ZWJvb2tTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1CbkYsUUFBQSxnQkFBZ0IsR0FBRyxJQUFBLCtCQUFlLEVBQW1CLGlCQUFpQixDQUFDLENBQUM7SUFzQnJGLE1BQWEsMEJBQTBCO1FBQ3RDLFlBQ1UsUUFBZ0IsRUFDaEIsVUFBK0IsRUFDL0IsYUFBMkM7WUFGM0MsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUNoQixlQUFVLEdBQVYsVUFBVSxDQUFxQjtZQUMvQixrQkFBYSxHQUFiLGFBQWEsQ0FBOEI7UUFDakQsQ0FBQztLQUNMO0lBTkQsZ0VBTUMifQ==