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
define(["require", "exports", "vs/workbench/common/editor/textEditorModel", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/platform/accessibility/common/accessibility"], function (require, exports, textEditorModel_1, language_1, model_1, languageDetectionWorkerService_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourceEditorModel = void 0;
    /**
     * An editor model for in-memory, readonly text content that
     * is backed by an existing editor model.
     */
    let TextResourceEditorModel = class TextResourceEditorModel extends textEditorModel_1.BaseTextEditorModel {
        constructor(resource, languageService, modelService, languageDetectionService, accessibilityService) {
            super(modelService, languageService, languageDetectionService, accessibilityService, resource);
        }
        dispose() {
            // force this class to dispose the underlying model
            if (this.textEditorModelHandle) {
                this.modelService.destroyModel(this.textEditorModelHandle);
            }
            super.dispose();
        }
    };
    exports.TextResourceEditorModel = TextResourceEditorModel;
    exports.TextResourceEditorModel = TextResourceEditorModel = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService),
        __param(3, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(4, accessibility_1.IAccessibilityService)
    ], TextResourceEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFJlc291cmNlRWRpdG9yTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vZWRpdG9yL3RleHRSZXNvdXJjZUVkaXRvck1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVNoRzs7O09BR0c7SUFDSSxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHFDQUFtQjtRQUUvRCxZQUNDLFFBQWEsRUFDSyxlQUFpQyxFQUNwQyxZQUEyQixFQUNmLHdCQUFtRCxFQUN2RCxvQkFBMkM7WUFFbEUsS0FBSyxDQUFDLFlBQVksRUFBRSxlQUFlLEVBQUUsd0JBQXdCLEVBQUUsb0JBQW9CLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDaEcsQ0FBQztRQUVRLE9BQU87WUFFZixtREFBbUQ7WUFDbkQsSUFBSSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDNUQsQ0FBQztZQUVELEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBQ0QsQ0FBQTtJQXJCWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQUlqQyxXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsMERBQXlCLENBQUE7UUFDekIsV0FBQSxxQ0FBcUIsQ0FBQTtPQVBYLHVCQUF1QixDQXFCbkMifQ==