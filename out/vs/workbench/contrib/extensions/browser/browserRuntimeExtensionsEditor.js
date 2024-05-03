/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/extensions/browser/abstractRuntimeExtensionsEditor", "vs/workbench/contrib/extensions/common/reportExtensionIssueAction"], function (require, exports, abstractRuntimeExtensionsEditor_1, reportExtensionIssueAction_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RuntimeExtensionsEditor = void 0;
    class RuntimeExtensionsEditor extends abstractRuntimeExtensionsEditor_1.AbstractRuntimeExtensionsEditor {
        _getProfileInfo() {
            return null;
        }
        _getUnresponsiveProfile(extensionId) {
            return undefined;
        }
        _createSlowExtensionAction(element) {
            return null;
        }
        _createReportExtensionIssueAction(element) {
            if (element.marketplaceInfo) {
                return this._instantiationService.createInstance(reportExtensionIssueAction_1.ReportExtensionIssueAction, element.description);
            }
            return null;
        }
        _createSaveExtensionHostProfileAction() {
            return null;
        }
        _createProfileAction() {
            return null;
        }
    }
    exports.RuntimeExtensionsEditor = RuntimeExtensionsEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlclJ1bnRpbWVFeHRlbnNpb25zRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvYnJvd3NlclJ1bnRpbWVFeHRlbnNpb25zRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxNQUFhLHVCQUF3QixTQUFRLGlFQUErQjtRQUVqRSxlQUFlO1lBQ3hCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVTLHVCQUF1QixDQUFDLFdBQWdDO1lBQ2pFLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFUywwQkFBMEIsQ0FBQyxPQUEwQjtZQUM5RCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFUyxpQ0FBaUMsQ0FBQyxPQUEwQjtZQUNyRSxJQUFJLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLHVEQUEwQixFQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNuRyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRVMscUNBQXFDO1lBQzlDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVTLG9CQUFvQjtZQUM3QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7S0FDRDtJQTVCRCwwREE0QkMifQ==