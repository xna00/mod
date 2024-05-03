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
define(["require", "exports", "vs/editor/common/services/resolverService", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/base/common/marked/marked", "vs/base/common/network", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/base/common/types", "vs/platform/instantiation/common/instantiation"], function (require, exports, resolverService_1, model_1, language_1, marked_1, network_1, range_1, textModel_1, types_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalkThroughSnippetContentProvider = void 0;
    exports.requireToContent = requireToContent;
    function requireToContent(instantiationService, resource) {
        if (!resource.query) {
            throw new Error('Welcome: invalid resource');
        }
        const query = JSON.parse(resource.query);
        if (!query.moduleId) {
            throw new Error('Welcome: invalid resource');
        }
        const content = new Promise((resolve, reject) => {
            require([query.moduleId], content => {
                try {
                    resolve(instantiationService.invokeFunction(content.default));
                }
                catch (err) {
                    reject(err);
                }
            });
        });
        return content;
    }
    let WalkThroughSnippetContentProvider = class WalkThroughSnippetContentProvider {
        static { this.ID = 'workbench.contrib.walkThroughSnippetContentProvider'; }
        constructor(textModelResolverService, languageService, modelService, instantiationService) {
            this.textModelResolverService = textModelResolverService;
            this.languageService = languageService;
            this.modelService = modelService;
            this.instantiationService = instantiationService;
            this.loads = new Map();
            this.textModelResolverService.registerTextModelContentProvider(network_1.Schemas.walkThroughSnippet, this);
        }
        async textBufferFactoryFromResource(resource) {
            let ongoing = this.loads.get(resource.toString());
            if (!ongoing) {
                ongoing = requireToContent(this.instantiationService, resource)
                    .then(content => (0, textModel_1.createTextBufferFactory)(content))
                    .finally(() => this.loads.delete(resource.toString()));
                this.loads.set(resource.toString(), ongoing);
            }
            return ongoing;
        }
        async provideTextContent(resource) {
            const factory = await this.textBufferFactoryFromResource(resource.with({ fragment: '' }));
            let codeEditorModel = this.modelService.getModel(resource);
            if (!codeEditorModel) {
                const j = parseInt(resource.fragment);
                let i = 0;
                const renderer = new marked_1.marked.Renderer();
                renderer.code = (code, lang) => {
                    i++;
                    const languageId = typeof lang === 'string' ? this.languageService.getLanguageIdByLanguageName(lang) || '' : '';
                    const languageSelection = this.languageService.createById(languageId);
                    // Create all models for this resource in one go... we'll need them all and we don't want to re-parse markdown each time
                    const model = this.modelService.createModel(code, languageSelection, resource.with({ fragment: `${i}.${lang}` }));
                    if (i === j) {
                        codeEditorModel = model;
                    }
                    return '';
                };
                const textBuffer = factory.create(1 /* DefaultEndOfLine.LF */).textBuffer;
                const lineCount = textBuffer.getLineCount();
                const range = new range_1.Range(1, 1, lineCount, textBuffer.getLineLength(lineCount) + 1);
                const markdown = textBuffer.getValueInRange(range, 0 /* EndOfLinePreference.TextDefined */);
                (0, marked_1.marked)(markdown, { renderer });
            }
            return (0, types_1.assertIsDefined)(codeEditorModel);
        }
    };
    exports.WalkThroughSnippetContentProvider = WalkThroughSnippetContentProvider;
    exports.WalkThroughSnippetContentProvider = WalkThroughSnippetContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService),
        __param(3, instantiation_1.IInstantiationService)
    ], WalkThroughSnippetContentProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Fsa1Rocm91Z2hDb250ZW50UHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlbGNvbWVXYWxrdGhyb3VnaC9jb21tb24vd2Fsa1Rocm91Z2hDb250ZW50UHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZWhHLDRDQXFCQztJQXJCRCxTQUFnQixnQkFBZ0IsQ0FBQyxvQkFBMkMsRUFBRSxRQUFhO1FBQzFGLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsTUFBTSxPQUFPLEdBQW9CLElBQUksT0FBTyxDQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3hFLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBRTtnQkFDbkMsSUFBSSxDQUFDO29CQUNKLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQy9ELENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFD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