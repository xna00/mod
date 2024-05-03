/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INotebookExecutionStateService = exports.NotebookExecutionType = void 0;
    var NotebookExecutionType;
    (function (NotebookExecutionType) {
        NotebookExecutionType[NotebookExecutionType["cell"] = 0] = "cell";
        NotebookExecutionType[NotebookExecutionType["notebook"] = 1] = "notebook";
    })(NotebookExecutionType || (exports.NotebookExecutionType = NotebookExecutionType = {}));
    exports.INotebookExecutionStateService = (0, instantiation_1.createDecorator)('INotebookExecutionStateService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFeGVjdXRpb25TdGF0ZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2NvbW1vbi9ub3RlYm9va0V4ZWN1dGlvblN0YXRlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErQmhHLElBQVkscUJBR1g7SUFIRCxXQUFZLHFCQUFxQjtRQUNoQyxpRUFBSSxDQUFBO1FBQ0oseUVBQVEsQ0FBQTtJQUNULENBQUMsRUFIVyxxQkFBcUIscUNBQXJCLHFCQUFxQixRQUdoQztJQTBCWSxRQUFBLDhCQUE4QixHQUFHLElBQUEsK0JBQWUsRUFBaUMsZ0NBQWdDLENBQUMsQ0FBQyJ9