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
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/contrib/gotoSymbol/browser/peek/referencesController", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage"], function (require, exports, editorExtensions_1, codeEditorService_1, referencesController_1, configuration_1, contextkey_1, instantiation_1, notification_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchReferencesController = void 0;
    let WorkbenchReferencesController = class WorkbenchReferencesController extends referencesController_1.ReferencesController {
        constructor(editor, contextKeyService, editorService, notificationService, instantiationService, storageService, configurationService) {
            super(false, editor, contextKeyService, editorService, notificationService, instantiationService, storageService, configurationService);
        }
    };
    exports.WorkbenchReferencesController = WorkbenchReferencesController;
    exports.WorkbenchReferencesController = WorkbenchReferencesController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, notification_1.INotificationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, storage_1.IStorageService),
        __param(6, configuration_1.IConfigurationService)
    ], WorkbenchReferencesController);
    (0, editorExtensions_1.registerEditorContribution)(referencesController_1.ReferencesController.ID, WorkbenchReferencesController, 4 /* EditorContributionInstantiation.Lazy */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoUmVmZXJlbmNlU2VhcmNoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlRWRpdG9yL2Jyb3dzZXIvd29ya2JlbmNoUmVmZXJlbmNlU2VhcmNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVl6RixJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE4QixTQUFRLDJDQUFvQjtRQUV0RSxZQUNDLE1BQW1CLEVBQ0MsaUJBQXFDLEVBQ3JDLGFBQWlDLEVBQy9CLG1CQUF5QyxFQUN4QyxvQkFBMkMsRUFDakQsY0FBK0IsRUFDekIsb0JBQTJDO1lBRWxFLEtBQUssQ0FDSixLQUFLLEVBQ0wsTUFBTSxFQUNOLGlCQUFpQixFQUNqQixhQUFhLEVBQ2IsbUJBQW1CLEVBQ25CLG9CQUFvQixFQUNwQixjQUFjLEVBQ2Qsb0JBQW9CLENBQ3BCLENBQUM7UUFDSCxDQUFDO0tBQ0QsQ0FBQTtJQXRCWSxzRUFBNkI7NENBQTdCLDZCQUE2QjtRQUl2QyxXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEscUNBQXFCLENBQUE7T0FUWCw2QkFBNkIsQ0FzQnpDO0lBRUQsSUFBQSw2Q0FBMEIsRUFBQywyQ0FBb0IsQ0FBQyxFQUFFLEVBQUUsNkJBQTZCLCtDQUF1QyxDQUFDIn0=