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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/common/editorFeatures", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/contributions"], function (require, exports, errors_1, lifecycle_1, codeEditorService_1, editorFeatures_1, instantiation_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let EditorFeaturesInstantiator = class EditorFeaturesInstantiator extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.editorFeaturesInstantiator'; }
        constructor(codeEditorService, _instantiationService) {
            super();
            this._instantiationService = _instantiationService;
            this._instantiated = false;
            this._register(codeEditorService.onWillCreateCodeEditor(() => this._instantiate()));
            this._register(codeEditorService.onWillCreateDiffEditor(() => this._instantiate()));
            if (codeEditorService.listCodeEditors().length > 0 || codeEditorService.listDiffEditors().length > 0) {
                this._instantiate();
            }
        }
        _instantiate() {
            if (this._instantiated) {
                return;
            }
            this._instantiated = true;
            // Instantiate all editor features
            const editorFeatures = (0, editorFeatures_1.getEditorFeatures)();
            for (const feature of editorFeatures) {
                try {
                    const instance = this._instantiationService.createInstance(feature);
                    if (typeof instance.dispose === 'function') {
                        this._register(instance);
                    }
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
            }
        }
    };
    EditorFeaturesInstantiator = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, instantiation_1.IInstantiationService)
    ], EditorFeaturesInstantiator);
    (0, contributions_1.registerWorkbenchContribution2)(EditorFeaturesInstantiator.ID, EditorFeaturesInstantiator, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRmVhdHVyZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvYnJvd3Nlci9lZGl0b3JGZWF0dXJlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQVNoRyxJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLHNCQUFVO2lCQUVsQyxPQUFFLEdBQUcsOENBQThDLEFBQWpELENBQWtEO1FBSXBFLFlBQ3FCLGlCQUFxQyxFQUNsQyxxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFGZ0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUo3RSxrQkFBYSxHQUFHLEtBQUssQ0FBQztZQVE3QixJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLElBQUksaUJBQWlCLENBQUMsZUFBZSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNyQixDQUFDO1FBQ0YsQ0FBQztRQUVPLFlBQVk7WUFDbkIsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFFMUIsa0NBQWtDO1lBQ2xDLE1BQU0sY0FBYyxHQUFHLElBQUEsa0NBQWlCLEdBQUUsQ0FBQztZQUMzQyxLQUFLLE1BQU0sT0FBTyxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUM7b0JBQ0osTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDcEUsSUFBSSxPQUFxQixRQUFTLENBQUMsT0FBTyxLQUFLLFVBQVUsRUFBRSxDQUFDO3dCQUMzRCxJQUFJLENBQUMsU0FBUyxDQUFlLFFBQVMsQ0FBQyxDQUFDO29CQUN6QyxDQUFDO2dCQUNGLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxJQUFBLDBCQUFpQixFQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7O0lBckNJLDBCQUEwQjtRQU83QixXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEscUNBQXFCLENBQUE7T0FSbEIsMEJBQTBCLENBc0MvQjtJQUVELElBQUEsOENBQThCLEVBQUMsMEJBQTBCLENBQUMsRUFBRSxFQUFFLDBCQUEwQixzQ0FBOEIsQ0FBQyJ9