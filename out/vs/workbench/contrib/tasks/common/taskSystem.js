/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskExecuteKind = exports.Triggers = exports.TaskError = exports.TaskErrors = void 0;
    var TaskErrors;
    (function (TaskErrors) {
        TaskErrors[TaskErrors["NotConfigured"] = 0] = "NotConfigured";
        TaskErrors[TaskErrors["RunningTask"] = 1] = "RunningTask";
        TaskErrors[TaskErrors["NoBuildTask"] = 2] = "NoBuildTask";
        TaskErrors[TaskErrors["NoTestTask"] = 3] = "NoTestTask";
        TaskErrors[TaskErrors["ConfigValidationError"] = 4] = "ConfigValidationError";
        TaskErrors[TaskErrors["TaskNotFound"] = 5] = "TaskNotFound";
        TaskErrors[TaskErrors["NoValidTaskRunner"] = 6] = "NoValidTaskRunner";
        TaskErrors[TaskErrors["UnknownError"] = 7] = "UnknownError";
    })(TaskErrors || (exports.TaskErrors = TaskErrors = {}));
    class TaskError {
        constructor(severity, message, code) {
            this.severity = severity;
            this.message = message;
            this.code = code;
        }
    }
    exports.TaskError = TaskError;
    var Triggers;
    (function (Triggers) {
        Triggers.shortcut = 'shortcut';
        Triggers.command = 'command';
        Triggers.reconnect = 'reconnect';
    })(Triggers || (exports.Triggers = Triggers = {}));
    var TaskExecuteKind;
    (function (TaskExecuteKind) {
        TaskExecuteKind[TaskExecuteKind["Started"] = 1] = "Started";
        TaskExecuteKind[TaskExecuteKind["Active"] = 2] = "Active";
    })(TaskExecuteKind || (exports.TaskExecuteKind = TaskExecuteKind = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza1N5c3RlbS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvY29tbW9uL3Rhc2tTeXN0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLElBQWtCLFVBU2pCO0lBVEQsV0FBa0IsVUFBVTtRQUMzQiw2REFBYSxDQUFBO1FBQ2IseURBQVcsQ0FBQTtRQUNYLHlEQUFXLENBQUE7UUFDWCx1REFBVSxDQUFBO1FBQ1YsNkVBQXFCLENBQUE7UUFDckIsMkRBQVksQ0FBQTtRQUNaLHFFQUFpQixDQUFBO1FBQ2pCLDJEQUFZLENBQUE7SUFDYixDQUFDLEVBVGlCLFVBQVUsMEJBQVYsVUFBVSxRQVMzQjtJQUVELE1BQWEsU0FBUztRQUtyQixZQUFZLFFBQWtCLEVBQUUsT0FBZSxFQUFFLElBQWdCO1lBQ2hFLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLENBQUM7S0FDRDtJQVZELDhCQVVDO0lBRUQsSUFBaUIsUUFBUSxDQUl4QjtJQUpELFdBQWlCLFFBQVE7UUFDWCxpQkFBUSxHQUFXLFVBQVUsQ0FBQztRQUM5QixnQkFBTyxHQUFXLFNBQVMsQ0FBQztRQUM1QixrQkFBUyxHQUFXLFdBQVcsQ0FBQztJQUM5QyxDQUFDLEVBSmdCLFFBQVEsd0JBQVIsUUFBUSxRQUl4QjtJQVNELElBQWtCLGVBR2pCO0lBSEQsV0FBa0IsZUFBZTtRQUNoQywyREFBVyxDQUFBO1FBQ1gseURBQVUsQ0FBQTtJQUNYLENBQUMsRUFIaUIsZUFBZSwrQkFBZixlQUFlLFFBR2hDIn0=