/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCM_CHANGES_EDITOR_ID = exports.ISCMViewService = exports.ISCMRepositorySortKey = exports.SCMInputChangeReason = exports.InputValidationType = exports.ISCMService = exports.REPOSITORIES_VIEW_PANE_ID = exports.VIEW_PANE_ID = exports.VIEWLET_ID = void 0;
    exports.VIEWLET_ID = 'workbench.view.scm';
    exports.VIEW_PANE_ID = 'workbench.scm';
    exports.REPOSITORIES_VIEW_PANE_ID = 'workbench.scm.repositories';
    exports.ISCMService = (0, instantiation_1.createDecorator)('scm');
    var InputValidationType;
    (function (InputValidationType) {
        InputValidationType[InputValidationType["Error"] = 0] = "Error";
        InputValidationType[InputValidationType["Warning"] = 1] = "Warning";
        InputValidationType[InputValidationType["Information"] = 2] = "Information";
    })(InputValidationType || (exports.InputValidationType = InputValidationType = {}));
    var SCMInputChangeReason;
    (function (SCMInputChangeReason) {
        SCMInputChangeReason[SCMInputChangeReason["HistoryPrevious"] = 0] = "HistoryPrevious";
        SCMInputChangeReason[SCMInputChangeReason["HistoryNext"] = 1] = "HistoryNext";
    })(SCMInputChangeReason || (exports.SCMInputChangeReason = SCMInputChangeReason = {}));
    var ISCMRepositorySortKey;
    (function (ISCMRepositorySortKey) {
        ISCMRepositorySortKey["DiscoveryTime"] = "discoveryTime";
        ISCMRepositorySortKey["Name"] = "name";
        ISCMRepositorySortKey["Path"] = "path";
    })(ISCMRepositorySortKey || (exports.ISCMRepositorySortKey = ISCMRepositorySortKey = {}));
    exports.ISCMViewService = (0, instantiation_1.createDecorator)('scmView');
    exports.SCM_CHANGES_EDITOR_ID = 'workbench.editor.scmChangesEditor';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zY20vY29tbW9uL3NjbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjbkYsUUFBQSxVQUFVLEdBQUcsb0JBQW9CLENBQUM7SUFDbEMsUUFBQSxZQUFZLEdBQUcsZUFBZSxDQUFDO0lBQy9CLFFBQUEseUJBQXlCLEdBQUcsNEJBQTRCLENBQUM7SUFNekQsUUFBQSxXQUFXLEdBQUcsSUFBQSwrQkFBZSxFQUFjLEtBQUssQ0FBQyxDQUFDO0lBbUUvRCxJQUFrQixtQkFJakI7SUFKRCxXQUFrQixtQkFBbUI7UUFDcEMsK0RBQVMsQ0FBQTtRQUNULG1FQUFXLENBQUE7UUFDWCwyRUFBZSxDQUFBO0lBQ2hCLENBQUMsRUFKaUIsbUJBQW1CLG1DQUFuQixtQkFBbUIsUUFJcEM7SUFXRCxJQUFZLG9CQUdYO0lBSEQsV0FBWSxvQkFBb0I7UUFDL0IscUZBQWUsQ0FBQTtRQUNmLDZFQUFXLENBQUE7SUFDWixDQUFDLEVBSFcsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFHL0I7SUF3RkQsSUFBa0IscUJBSWpCO0lBSkQsV0FBa0IscUJBQXFCO1FBQ3RDLHdEQUErQixDQUFBO1FBQy9CLHNDQUFhLENBQUE7UUFDYixzQ0FBYSxDQUFBO0lBQ2QsQ0FBQyxFQUppQixxQkFBcUIscUNBQXJCLHFCQUFxQixRQUl0QztJQUVZLFFBQUEsZUFBZSxHQUFHLElBQUEsK0JBQWUsRUFBa0IsU0FBUyxDQUFDLENBQUM7SUE0QjlELFFBQUEscUJBQXFCLEdBQUcsbUNBQW1DLENBQUMifQ==