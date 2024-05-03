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
    exports.StandaloneReferencesController = void 0;
    let StandaloneReferencesController = class StandaloneReferencesController extends referencesController_1.ReferencesController {
        constructor(editor, contextKeyService, editorService, notificationService, instantiationService, storageService, configurationService) {
            super(true, editor, contextKeyService, editorService, notificationService, instantiationService, storageService, configurationService);
        }
    };
    exports.StandaloneReferencesController = StandaloneReferencesController;
    exports.StandaloneReferencesController = StandaloneReferencesController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, notification_1.INotificationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, storage_1.IStorageService),
        __param(6, configuration_1.IConfigurationService)
    ], StandaloneReferencesController);
    (0, editorExtensions_1.registerEditorContribution)(referencesController_1.ReferencesController.ID, StandaloneReferencesController, 4 /* EditorContributionInstantiation.Lazy */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZVJlZmVyZW5jZVNlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvYnJvd3Nlci9yZWZlcmVuY2VTZWFyY2gvc3RhbmRhbG9uZVJlZmVyZW5jZVNlYXJjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBK0IsU0FBUSwyQ0FBb0I7UUFFdkUsWUFDQyxNQUFtQixFQUNDLGlCQUFxQyxFQUNyQyxhQUFpQyxFQUMvQixtQkFBeUMsRUFDeEMsb0JBQTJDLEVBQ2pELGNBQStCLEVBQ3pCLG9CQUEyQztZQUVsRSxLQUFLLENBQ0osSUFBSSxFQUNKLE1BQU0sRUFDTixpQkFBaUIsRUFDakIsYUFBYSxFQUNiLG1CQUFtQixFQUNuQixvQkFBb0IsRUFDcEIsY0FBYyxFQUNkLG9CQUFvQixDQUNwQixDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUE7SUF0Qlksd0VBQThCOzZDQUE5Qiw4QkFBOEI7UUFJeEMsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLHFDQUFxQixDQUFBO09BVFgsOEJBQThCLENBc0IxQztJQUVELElBQUEsNkNBQTBCLEVBQUMsMkNBQW9CLENBQUMsRUFBRSxFQUFFLDhCQUE4QiwrQ0FBdUMsQ0FBQyJ9