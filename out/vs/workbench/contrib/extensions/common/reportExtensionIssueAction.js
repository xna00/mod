/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/workbench/services/issue/common/issue"], function (require, exports, nls, actions_1, issue_1) {
    "use strict";
    var ReportExtensionIssueAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReportExtensionIssueAction = void 0;
    let ReportExtensionIssueAction = class ReportExtensionIssueAction extends actions_1.Action {
        static { ReportExtensionIssueAction_1 = this; }
        static { this._id = 'workbench.extensions.action.reportExtensionIssue'; }
        static { this._label = nls.localize('reportExtensionIssue', "Report Issue"); }
        // TODO: Consider passing in IExtensionStatus or IExtensionHostProfile for additional data
        constructor(extension, issueService) {
            super(ReportExtensionIssueAction_1._id, ReportExtensionIssueAction_1._label, 'extension-action report-issue');
            this.extension = extension;
            this.issueService = issueService;
            this.enabled = extension.isBuiltin || (!!extension.repository && !!extension.repository.url);
        }
        async run() {
            await this.issueService.openReporter({
                extensionId: this.extension.identifier.value,
            });
        }
    };
    exports.ReportExtensionIssueAction = ReportExtensionIssueAction;
    exports.ReportExtensionIssueAction = ReportExtensionIssueAction = ReportExtensionIssueAction_1 = __decorate([
        __param(1, issue_1.IWorkbenchIssueService)
    ], ReportExtensionIssueAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwb3J0RXh0ZW5zaW9uSXNzdWVBY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvY29tbW9uL3JlcG9ydEV4dGVuc2lvbklzc3VlQWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFPekYsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMkIsU0FBUSxnQkFBTTs7aUJBRTdCLFFBQUcsR0FBRyxrREFBa0QsQUFBckQsQ0FBc0Q7aUJBQ3pELFdBQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLGNBQWMsQ0FBQyxBQUF2RCxDQUF3RDtRQUV0RiwwRkFBMEY7UUFDMUYsWUFDUyxTQUFnQyxFQUNDLFlBQW9DO1lBRTdFLEtBQUssQ0FBQyw0QkFBMEIsQ0FBQyxHQUFHLEVBQUUsNEJBQTBCLENBQUMsTUFBTSxFQUFFLCtCQUErQixDQUFDLENBQUM7WUFIbEcsY0FBUyxHQUFULFNBQVMsQ0FBdUI7WUFDQyxpQkFBWSxHQUFaLFlBQVksQ0FBd0I7WUFJN0UsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUM7Z0JBQ3BDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLO2FBQzVDLENBQUMsQ0FBQztRQUNKLENBQUM7O0lBbkJXLGdFQUEwQjt5Q0FBMUIsMEJBQTBCO1FBUXBDLFdBQUEsOEJBQXNCLENBQUE7T0FSWiwwQkFBMEIsQ0FvQnRDIn0=