/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INotebookExecutionService = exports.CellExecutionUpdateType = void 0;
    var CellExecutionUpdateType;
    (function (CellExecutionUpdateType) {
        CellExecutionUpdateType[CellExecutionUpdateType["Output"] = 1] = "Output";
        CellExecutionUpdateType[CellExecutionUpdateType["OutputItems"] = 2] = "OutputItems";
        CellExecutionUpdateType[CellExecutionUpdateType["ExecutionState"] = 3] = "ExecutionState";
    })(CellExecutionUpdateType || (exports.CellExecutionUpdateType = CellExecutionUpdateType = {}));
    exports.INotebookExecutionService = (0, instantiation_1.createDecorator)('INotebookExecutionService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFeGVjdXRpb25TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9jb21tb24vbm90ZWJvb2tFeGVjdXRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxJQUFZLHVCQUlYO0lBSkQsV0FBWSx1QkFBdUI7UUFDbEMseUVBQVUsQ0FBQTtRQUNWLG1GQUFlLENBQUE7UUFDZix5RkFBa0IsQ0FBQTtJQUNuQixDQUFDLEVBSlcsdUJBQXVCLHVDQUF2Qix1QkFBdUIsUUFJbEM7SUFnQlksUUFBQSx5QkFBeUIsR0FBRyxJQUFBLCtCQUFlLEVBQTRCLDJCQUEyQixDQUFDLENBQUMifQ==