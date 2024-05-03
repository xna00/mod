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
define(["require", "exports", "vs/base/common/color", "vs/editor/browser/services/editorWorkerService", "vs/editor/common/services/model", "vs/editor/common/languages/languageConfigurationRegistry", "vs/base/common/lifecycle", "vs/editor/common/services/languageFeatures", "vs/editor/common/editorFeatures"], function (require, exports, color_1, editorWorkerService_1, model_1, languageConfigurationRegistry_1, lifecycle_1, languageFeatures_1, editorFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultDocumentColorProvider = void 0;
    class DefaultDocumentColorProvider {
        constructor(modelService, languageConfigurationService) {
            this._editorWorkerClient = new editorWorkerService_1.EditorWorkerClient(modelService, false, 'editorWorkerService', languageConfigurationService);
        }
        async provideDocumentColors(model, _token) {
            return this._editorWorkerClient.computeDefaultDocumentColors(model.uri);
        }
        provideColorPresentations(_model, colorInfo, _token) {
            const range = colorInfo.range;
            const colorFromInfo = colorInfo.color;
            const alpha = colorFromInfo.alpha;
            const color = new color_1.Color(new color_1.RGBA(Math.round(255 * colorFromInfo.red), Math.round(255 * colorFromInfo.green), Math.round(255 * colorFromInfo.blue), alpha));
            const rgb = alpha ? color_1.Color.Format.CSS.formatRGB(color) : color_1.Color.Format.CSS.formatRGBA(color);
            const hsl = alpha ? color_1.Color.Format.CSS.formatHSL(color) : color_1.Color.Format.CSS.formatHSLA(color);
            const hex = alpha ? color_1.Color.Format.CSS.formatHex(color) : color_1.Color.Format.CSS.formatHexA(color);
            const colorPresentations = [];
            colorPresentations.push({ label: rgb, textEdit: { range: range, text: rgb } });
            colorPresentations.push({ label: hsl, textEdit: { range: range, text: hsl } });
            colorPresentations.push({ label: hex, textEdit: { range: range, text: hex } });
            return colorPresentations;
        }
    }
    exports.DefaultDocumentColorProvider = DefaultDocumentColorProvider;
    let DefaultDocumentColorProviderFeature = class DefaultDocumentColorProviderFeature extends lifecycle_1.Disposable {
        constructor(_modelService, _languageConfigurationService, _languageFeaturesService) {
            super();
            this._register(_languageFeaturesService.colorProvider.register('*', new DefaultDocumentColorProvider(_modelService, _languageConfigurationService)));
        }
    };
    DefaultDocumentColorProviderFeature = __decorate([
        __param(0, model_1.IModelService),
        __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(2, languageFeatures_1.ILanguageFeaturesService)
    ], DefaultDocumentColorProviderFeature);
    (0, editorFeatures_1.registerEditorFeature)(DefaultDocumentColorProviderFeature);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdERvY3VtZW50Q29sb3JQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29sb3JQaWNrZXIvYnJvd3Nlci9kZWZhdWx0RG9jdW1lbnRDb2xvclByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWFoRyxNQUFhLDRCQUE0QjtRQUl4QyxZQUNDLFlBQTJCLEVBQzNCLDRCQUEyRDtZQUUzRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSx3Q0FBa0IsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLHFCQUFxQixFQUFFLDRCQUE0QixDQUFDLENBQUM7UUFDN0gsQ0FBQztRQUVELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxLQUFpQixFQUFFLE1BQXlCO1lBQ3ZFLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLDRCQUE0QixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRUQseUJBQXlCLENBQUMsTUFBa0IsRUFBRSxTQUE0QixFQUFFLE1BQXlCO1lBQ3BHLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUM7WUFDOUIsTUFBTSxhQUFhLEdBQVcsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUM5QyxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDO1lBQ2xDLE1BQU0sS0FBSyxHQUFHLElBQUksYUFBSyxDQUFDLElBQUksWUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFM0osTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzRixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNGLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFM0YsTUFBTSxrQkFBa0IsR0FBeUIsRUFBRSxDQUFDO1lBQ3BELGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQy9FLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQy9FLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQy9FLE9BQU8sa0JBQWtCLENBQUM7UUFDM0IsQ0FBQztLQUNEO0lBL0JELG9FQStCQztJQUVELElBQU0sbUNBQW1DLEdBQXpDLE1BQU0sbUNBQW9DLFNBQVEsc0JBQVU7UUFDM0QsWUFDZ0IsYUFBNEIsRUFDWiw2QkFBNEQsRUFDakUsd0JBQWtEO1lBRTVFLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLDRCQUE0QixDQUFDLGFBQWEsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0SixDQUFDO0tBQ0QsQ0FBQTtJQVRLLG1DQUFtQztRQUV0QyxXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLDZEQUE2QixDQUFBO1FBQzdCLFdBQUEsMkNBQXdCLENBQUE7T0FKckIsbUNBQW1DLENBU3hDO0lBRUQsSUFBQSxzQ0FBcUIsRUFBQyxtQ0FBbUMsQ0FBQyxDQUFDIn0=