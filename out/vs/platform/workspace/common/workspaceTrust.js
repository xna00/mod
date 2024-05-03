/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWorkspaceTrustRequestService = exports.WorkspaceTrustUriResponse = exports.IWorkspaceTrustManagementService = exports.IWorkspaceTrustEnablementService = exports.WorkspaceTrustScope = void 0;
    exports.workspaceTrustToString = workspaceTrustToString;
    var WorkspaceTrustScope;
    (function (WorkspaceTrustScope) {
        WorkspaceTrustScope[WorkspaceTrustScope["Local"] = 0] = "Local";
        WorkspaceTrustScope[WorkspaceTrustScope["Remote"] = 1] = "Remote";
    })(WorkspaceTrustScope || (exports.WorkspaceTrustScope = WorkspaceTrustScope = {}));
    function workspaceTrustToString(trustState) {
        if (trustState) {
            return (0, nls_1.localize)('trusted', "Trusted");
        }
        else {
            return (0, nls_1.localize)('untrusted', "Restricted Mode");
        }
    }
    exports.IWorkspaceTrustEnablementService = (0, instantiation_1.createDecorator)('workspaceTrustEnablementService');
    exports.IWorkspaceTrustManagementService = (0, instantiation_1.createDecorator)('workspaceTrustManagementService');
    var WorkspaceTrustUriResponse;
    (function (WorkspaceTrustUriResponse) {
        WorkspaceTrustUriResponse[WorkspaceTrustUriResponse["Open"] = 1] = "Open";
        WorkspaceTrustUriResponse[WorkspaceTrustUriResponse["OpenInNewWindow"] = 2] = "OpenInNewWindow";
        WorkspaceTrustUriResponse[WorkspaceTrustUriResponse["Cancel"] = 3] = "Cancel";
    })(WorkspaceTrustUriResponse || (exports.WorkspaceTrustUriResponse = WorkspaceTrustUriResponse = {}));
    exports.IWorkspaceTrustRequestService = (0, instantiation_1.createDecorator)('workspaceTrustRequestService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVHJ1c3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3dvcmtzcGFjZS9jb21tb24vd29ya3NwYWNlVHJ1c3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLHdEQU1DO0lBWEQsSUFBWSxtQkFHWDtJQUhELFdBQVksbUJBQW1CO1FBQzlCLCtEQUFTLENBQUE7UUFDVCxpRUFBVSxDQUFBO0lBQ1gsQ0FBQyxFQUhXLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBRzlCO0lBRUQsU0FBZ0Isc0JBQXNCLENBQUMsVUFBbUI7UUFDekQsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNoQixPQUFPLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN2QyxDQUFDO2FBQU0sQ0FBQztZQUNQLE9BQU8sSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDakQsQ0FBQztJQUNGLENBQUM7SUFZWSxRQUFBLGdDQUFnQyxHQUFHLElBQUEsK0JBQWUsRUFBbUMsaUNBQWlDLENBQUMsQ0FBQztJQVF4SCxRQUFBLGdDQUFnQyxHQUFHLElBQUEsK0JBQWUsRUFBbUMsaUNBQWlDLENBQUMsQ0FBQztJQThCckksSUFBa0IseUJBSWpCO0lBSkQsV0FBa0IseUJBQXlCO1FBQzFDLHlFQUFRLENBQUE7UUFDUiwrRkFBbUIsQ0FBQTtRQUNuQiw2RUFBVSxDQUFBO0lBQ1gsQ0FBQyxFQUppQix5QkFBeUIseUNBQXpCLHlCQUF5QixRQUkxQztJQUVZLFFBQUEsNkJBQTZCLEdBQUcsSUFBQSwrQkFBZSxFQUFnQyw4QkFBOEIsQ0FBQyxDQUFDIn0=