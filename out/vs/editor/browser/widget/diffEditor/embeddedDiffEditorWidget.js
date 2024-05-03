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
define(["require", "exports", "vs/base/common/objects", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress"], function (require, exports, objects, codeEditorService_1, diffEditorWidget_1, accessibilitySignalService_1, contextkey_1, instantiation_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmbeddedDiffEditorWidget = void 0;
    let EmbeddedDiffEditorWidget = class EmbeddedDiffEditorWidget extends diffEditorWidget_1.DiffEditorWidget {
        constructor(domElement, options, codeEditorWidgetOptions, parentEditor, contextKeyService, instantiationService, codeEditorService, accessibilitySignalService, editorProgressService) {
            super(domElement, parentEditor.getRawOptions(), codeEditorWidgetOptions, contextKeyService, instantiationService, codeEditorService, accessibilitySignalService, editorProgressService);
            this._parentEditor = parentEditor;
            this._overwriteOptions = options;
            // Overwrite parent's options
            super.updateOptions(this._overwriteOptions);
            this._register(parentEditor.onDidChangeConfiguration(e => this._onParentConfigurationChanged(e)));
        }
        getParentEditor() {
            return this._parentEditor;
        }
        _onParentConfigurationChanged(e) {
            super.updateOptions(this._parentEditor.getRawOptions());
            super.updateOptions(this._overwriteOptions);
        }
        updateOptions(newOptions) {
            objects.mixin(this._overwriteOptions, newOptions, true);
            super.updateOptions(this._overwriteOptions);
        }
    };
    exports.EmbeddedDiffEditorWidget = EmbeddedDiffEditorWidget;
    exports.EmbeddedDiffEditorWidget = EmbeddedDiffEditorWidget = __decorate([
        __param(4, contextkey_1.IContextKeyService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, codeEditorService_1.ICodeEditorService),
        __param(7, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(8, progress_1.IEditorProgressService)
    ], EmbeddedDiffEditorWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1iZWRkZWREaWZmRWRpdG9yV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9lbWJlZGRlZERpZmZFZGl0b3JXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsbUNBQWdCO1FBSzdELFlBQ0MsVUFBdUIsRUFDdkIsT0FBaUQsRUFDakQsdUJBQXFELEVBQ3JELFlBQXlCLEVBQ0wsaUJBQXFDLEVBQ2xDLG9CQUEyQyxFQUM5QyxpQkFBcUMsRUFDNUIsMEJBQXVELEVBQzVELHFCQUE2QztZQUVyRSxLQUFLLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxhQUFhLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxpQkFBaUIsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSwwQkFBMEIsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBRXhMLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxPQUFPLENBQUM7WUFFakMsNkJBQTZCO1lBQzdCLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25HLENBQUM7UUFFRCxlQUFlO1lBQ2QsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7UUFFTyw2QkFBNkIsQ0FBQyxDQUE0QjtZQUNqRSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUN4RCxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFUSxhQUFhLENBQUMsVUFBMEI7WUFDaEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hELEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDN0MsQ0FBQztLQUNELENBQUE7SUF4Q1ksNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFVbEMsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSx3REFBMkIsQ0FBQTtRQUMzQixXQUFBLGlDQUFzQixDQUFBO09BZFosd0JBQXdCLENBd0NwQyJ9