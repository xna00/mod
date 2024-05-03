/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JSONEditingError = exports.JSONEditingErrorCode = exports.IJSONEditingService = void 0;
    exports.IJSONEditingService = (0, instantiation_1.createDecorator)('jsonEditingService');
    var JSONEditingErrorCode;
    (function (JSONEditingErrorCode) {
        /**
         * Error when trying to write to a file that contains JSON errors.
         */
        JSONEditingErrorCode[JSONEditingErrorCode["ERROR_INVALID_FILE"] = 0] = "ERROR_INVALID_FILE";
    })(JSONEditingErrorCode || (exports.JSONEditingErrorCode = JSONEditingErrorCode = {}));
    class JSONEditingError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.JSONEditingError = JSONEditingError;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbkVkaXRpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9jb25maWd1cmF0aW9uL2NvbW1vbi9qc29uRWRpdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNbkYsUUFBQSxtQkFBbUIsR0FBRyxJQUFBLCtCQUFlLEVBQXNCLG9CQUFvQixDQUFDLENBQUM7SUFFOUYsSUFBa0Isb0JBTWpCO0lBTkQsV0FBa0Isb0JBQW9CO1FBRXJDOztXQUVHO1FBQ0gsMkZBQWtCLENBQUE7SUFDbkIsQ0FBQyxFQU5pQixvQkFBb0Isb0NBQXBCLG9CQUFvQixRQU1yQztJQUVELE1BQWEsZ0JBQWlCLFNBQVEsS0FBSztRQUMxQyxZQUFZLE9BQWUsRUFBUyxJQUEwQjtZQUM3RCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFEb0IsU0FBSSxHQUFKLElBQUksQ0FBc0I7UUFFOUQsQ0FBQztLQUNEO0lBSkQsNENBSUMifQ==