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
define(["require", "exports", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/editor/common/languages/language", "vs/editor/common/services/textResourceConfiguration", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/services/path/common/pathService"], function (require, exports, languageConfigurationRegistry_1, model_1, modelService_1, language_1, textResourceConfiguration_1, configuration_1, extensions_1, undoRedo_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchModelService = void 0;
    let WorkbenchModelService = class WorkbenchModelService extends modelService_1.ModelService {
        constructor(configurationService, resourcePropertiesService, undoRedoService, languageConfigurationService, languageService, _pathService) {
            super(configurationService, resourcePropertiesService, undoRedoService, languageService, languageConfigurationService);
            this._pathService = _pathService;
        }
        _schemaShouldMaintainUndoRedoElements(resource) {
            return (super._schemaShouldMaintainUndoRedoElements(resource)
                || resource.scheme === this._pathService.defaultUriScheme);
        }
    };
    exports.WorkbenchModelService = WorkbenchModelService;
    exports.WorkbenchModelService = WorkbenchModelService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, textResourceConfiguration_1.ITextResourcePropertiesService),
        __param(2, undoRedo_1.IUndoRedoService),
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(4, language_1.ILanguageService),
        __param(5, pathService_1.IPathService)
    ], WorkbenchModelService);
    (0, extensions_1.registerSingleton)(model_1.IModelService, WorkbenchModelService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvbW9kZWwvY29tbW9uL21vZGVsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSwyQkFBWTtRQUN0RCxZQUN3QixvQkFBMkMsRUFDbEMseUJBQXlELEVBQ3ZFLGVBQWlDLEVBQ3BCLDRCQUEyRCxFQUN4RSxlQUFpQyxFQUNwQixZQUEwQjtZQUV6RCxLQUFLLENBQUMsb0JBQW9CLEVBQUUseUJBQXlCLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1lBRnhGLGlCQUFZLEdBQVosWUFBWSxDQUFjO1FBRzFELENBQUM7UUFFa0IscUNBQXFDLENBQUMsUUFBYTtZQUNyRSxPQUFPLENBQ04sS0FBSyxDQUFDLHFDQUFxQyxDQUFDLFFBQVEsQ0FBQzttQkFDbEQsUUFBUSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUN6RCxDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUE7SUFsQlksc0RBQXFCO29DQUFyQixxQkFBcUI7UUFFL0IsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDBEQUE4QixDQUFBO1FBQzlCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSw2REFBNkIsQ0FBQTtRQUM3QixXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEsMEJBQVksQ0FBQTtPQVBGLHFCQUFxQixDQWtCakM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLHFCQUFhLEVBQUUscUJBQXFCLG9DQUE0QixDQUFDIn0=