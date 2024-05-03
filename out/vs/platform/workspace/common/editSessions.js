/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditSessionIdentityMatch = exports.IEditSessionIdentityService = void 0;
    exports.IEditSessionIdentityService = (0, instantiation_1.createDecorator)('editSessionIdentityService');
    var EditSessionIdentityMatch;
    (function (EditSessionIdentityMatch) {
        EditSessionIdentityMatch[EditSessionIdentityMatch["Complete"] = 100] = "Complete";
        EditSessionIdentityMatch[EditSessionIdentityMatch["Partial"] = 50] = "Partial";
        EditSessionIdentityMatch[EditSessionIdentityMatch["None"] = 0] = "None";
    })(EditSessionIdentityMatch || (exports.EditSessionIdentityMatch = EditSessionIdentityMatch = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93b3Jrc3BhY2UvY29tbW9uL2VkaXRTZXNzaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhbkYsUUFBQSwyQkFBMkIsR0FBRyxJQUFBLCtCQUFlLEVBQThCLDRCQUE0QixDQUFDLENBQUM7SUFnQnRILElBQVksd0JBSVg7SUFKRCxXQUFZLHdCQUF3QjtRQUNuQyxpRkFBYyxDQUFBO1FBQ2QsOEVBQVksQ0FBQTtRQUNaLHVFQUFRLENBQUE7SUFDVCxDQUFDLEVBSlcsd0JBQXdCLHdDQUF4Qix3QkFBd0IsUUFJbkMifQ==