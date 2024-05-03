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
define(["require", "exports", "vs/nls", "vs/base/common/network", "vs/base/common/lifecycle", "vs/workbench/contrib/search/browser/replace", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/workbench/contrib/search/browser/searchModel", "vs/editor/common/services/resolverService", "vs/platform/instantiation/common/instantiation", "vs/editor/common/model/textModel", "vs/workbench/services/textfile/common/textfiles", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/range", "vs/editor/common/core/editOperation", "vs/platform/label/common/label", "vs/base/common/resources", "vs/base/common/async", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService"], function (require, exports, nls, network, lifecycle_1, replace_1, editorService_1, model_1, language_1, searchModel_1, resolverService_1, instantiation_1, textModel_1, textfiles_1, bulkEditService_1, range_1, editOperation_1, label_1, resources_1, async_1, editor_1, notebookCommon_1, notebookEditorModelResolverService_1) {
    "use strict";
    var ReplaceService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplaceService = exports.ReplacePreviewContentProvider = void 0;
    const REPLACE_PREVIEW = 'replacePreview';
    const toReplaceResource = (fileResource) => {
        return fileResource.with({ scheme: network.Schemas.internal, fragment: REPLACE_PREVIEW, query: JSON.stringify({ scheme: fileResource.scheme }) });
    };
    const toFileResource = (replaceResource) => {
        return replaceResource.with({ scheme: JSON.parse(replaceResource.query)['scheme'], fragment: '', query: '' });
    };
    let ReplacePreviewContentProvider = class ReplacePreviewContentProvider {
        static { this.ID = 'workbench.contrib.replacePreviewContentProvider'; }
        constructor(instantiationService, textModelResolverService) {
            this.instantiationService = instantiationService;
            this.textModelResolverService = textModelResolverService;
            this.textModelResolverService.registerTextModelContentProvider(network.Schemas.internal, this);
        }
        provideTextContent(uri) {
            if (uri.fragment === REPLACE_PREVIEW) {
                return this.instantiationService.createInstance(ReplacePreviewModel).resolve(uri);
            }
            return null;
        }
    };
    exports.ReplacePreviewContentProvider = ReplacePreviewContentProvider;
    exports.ReplacePreviewContentProvider = ReplacePreviewContentProvider = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, resolverService_1.ITextModelService)
    ], ReplacePreviewContentProvider);
    let ReplacePreviewModel = class ReplacePreviewModel extends lifecycle_1.Disposable {
        constructor(modelService, languageService, textModelResolverService, replaceService, searchWorkbenchService) {
            super();
            this.modelService = modelService;
            this.languageService = languageService;
            this.textModelResolverService = textModelResolverService;
            this.replaceService = replaceService;
            this.searchWorkbenchService = searchWorkbenchService;
        }
        async resolve(replacePreviewUri) {
            const fileResource = toFileResource(replacePreviewUri);
            const fileMatch = this.searchWorkbenchService.searchModel.searchResult.matches().filter(match => match.resource.toString() === fileResource.toString())[0];
            const ref = this._register(await this.textModelResolverService.createModelReference(fileResource));
            const sourceModel = ref.object.textEditorModel;
            const sourceModelLanguageId = sourceModel.getLanguageId();
            const replacePreviewModel = this.modelService.createModel((0, textModel_1.createTextBufferFactoryFromSnapshot)(sourceModel.createSnapshot()), this.languageService.createById(sourceModelLanguageId), replacePreviewUri);
            this._register(fileMatch.onChange(({ forceUpdateModel }) => this.update(sourceModel, replacePreviewModel, fileMatch, forceUpdateModel)));
            this._register(this.searchWorkbenchService.searchModel.onReplaceTermChanged(() => this.update(sourceModel, replacePreviewModel, fileMatch)));
            this._register(fileMatch.onDispose(() => replacePreviewModel.dispose())); // TODO@Sandeep we should not dispose a model directly but rather the reference (depends on https://github.com/microsoft/vscode/issues/17073)
            this._register(replacePreviewModel.onWillDispose(() => this.dispose()));
            this._register(sourceModel.onWillDispose(() => this.dispose()));
            return replacePreviewModel;
        }
        update(sourceModel, replacePreviewModel, fileMatch, override = false) {
            if (!sourceModel.isDisposed() && !replacePreviewModel.isDisposed()) {
                this.replaceService.updateReplacePreview(fileMatch, override);
            }
        }
    };
    ReplacePreviewModel = __decorate([
        __param(0, model_1.IModelService),
        __param(1, language_1.ILanguageService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, replace_1.IReplaceService),
        __param(4, searchModel_1.ISearchViewModelWorkbenchService)
    ], ReplacePreviewModel);
    let ReplaceService = class ReplaceService {
        static { ReplaceService_1 = this; }
        static { this.REPLACE_SAVE_SOURCE = editor_1.SaveSourceRegistry.registerSource('searchReplace.source', nls.localize('searchReplace.source', "Search and Replace")); }
        constructor(textFileService, editorService, textModelResolverService, bulkEditorService, labelService, notebookEditorModelResolverService) {
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.textModelResolverService = textModelResolverService;
            this.bulkEditorService = bulkEditorService;
            this.labelService = labelService;
            this.notebookEditorModelResolverService = notebookEditorModelResolverService;
        }
        async replace(arg, progress = undefined, resource = null) {
            const edits = this.createEdits(arg, resource);
            await this.bulkEditorService.apply(edits, { progress });
            const rawTextPromises = edits.map(async (e) => {
                if (e.resource.scheme === network.Schemas.vscodeNotebookCell) {
                    const notebookResource = notebookCommon_1.CellUri.parse(e.resource)?.notebook;
                    if (notebookResource) {
                        let ref;
                        try {
                            ref = await this.notebookEditorModelResolverService.resolve(notebookResource);
                            await ref.object.save({ source: ReplaceService_1.REPLACE_SAVE_SOURCE });
                        }
                        finally {
                            ref?.dispose();
                        }
                    }
                    return;
                }
                else {
                    return this.textFileService.files.get(e.resource)?.save({ source: ReplaceService_1.REPLACE_SAVE_SOURCE });
                }
            });
            return async_1.Promises.settled(rawTextPromises);
        }
        async openReplacePreview(element, preserveFocus, sideBySide, pinned) {
            const fileMatch = element instanceof searchModel_1.Match ? element.parent() : element;
            const editor = await this.editorService.openEditor({
                original: { resource: fileMatch.resource },
                modified: { resource: toReplaceResource(fileMatch.resource) },
                label: nls.localize('fileReplaceChanges', "{0} ↔ {1} (Replace Preview)", fileMatch.name(), fileMatch.name()),
                description: this.labelService.getUriLabel((0, resources_1.dirname)(fileMatch.resource), { relative: true }),
                options: {
                    preserveFocus,
                    pinned,
                    revealIfVisible: true
                }
            });
            const input = editor?.input;
            const disposable = fileMatch.onDispose(() => {
                input?.dispose();
                disposable.dispose();
            });
            await this.updateReplacePreview(fileMatch);
            if (editor) {
                const editorControl = editor.getControl();
                if (element instanceof searchModel_1.Match && editorControl) {
                    editorControl.revealLineInCenter(element.range().startLineNumber, 1 /* ScrollType.Immediate */);
                }
            }
        }
        async updateReplacePreview(fileMatch, override = false) {
            const replacePreviewUri = toReplaceResource(fileMatch.resource);
            const [sourceModelRef, replaceModelRef] = await Promise.all([this.textModelResolverService.createModelReference(fileMatch.resource), this.textModelResolverService.createModelReference(replacePreviewUri)]);
            const sourceModel = sourceModelRef.object.textEditorModel;
            const replaceModel = replaceModelRef.object.textEditorModel;
            // If model is disposed do not update
            try {
                if (sourceModel && replaceModel) {
                    if (override) {
                        replaceModel.setValue(sourceModel.getValue());
                    }
                    else {
                        replaceModel.undo();
                    }
                    this.applyEditsToPreview(fileMatch, replaceModel);
                }
            }
            finally {
                sourceModelRef.dispose();
                replaceModelRef.dispose();
            }
        }
        applyEditsToPreview(fileMatch, replaceModel) {
            const resourceEdits = this.createEdits(fileMatch, replaceModel.uri);
            const modelEdits = [];
            for (const resourceEdit of resourceEdits) {
                modelEdits.push(editOperation_1.EditOperation.replaceMove(range_1.Range.lift(resourceEdit.textEdit.range), resourceEdit.textEdit.text));
            }
            replaceModel.pushEditOperations([], modelEdits.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range)), () => []);
        }
        createEdits(arg, resource = null) {
            const edits = [];
            if (arg instanceof searchModel_1.Match) {
                if (arg instanceof searchModel_1.MatchInNotebook) {
                    if (!arg.isReadonly()) {
                        // only apply edits if it's not a webview match, since webview matches are read-only
                        const match = arg;
                        edits.push(this.createEdit(match, match.replaceString, match.cell?.uri));
                    }
                }
                else {
                    const match = arg;
                    edits.push(this.createEdit(match, match.replaceString, resource));
                }
            }
            if (arg instanceof searchModel_1.FileMatch) {
                arg = [arg];
            }
            if (arg instanceof Array) {
                arg.forEach(element => {
                    const fileMatch = element;
                    if (fileMatch.count() > 0) {
                        edits.push(...fileMatch.matches().flatMap(match => this.createEdits(match, resource)));
                    }
                });
            }
            return edits;
        }
        createEdit(match, text, resource = null) {
            const fileMatch = match.parent();
            return new bulkEditService_1.ResourceTextEdit(resource ?? fileMatch.resource, { range: match.range(), text }, undefined, undefined);
        }
    };
    exports.ReplaceService = ReplaceService;
    exports.ReplaceService = ReplaceService = ReplaceService_1 = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, editorService_1.IEditorService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, bulkEditService_1.IBulkEditService),
        __param(4, label_1.ILabelService),
        __param(5, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], ReplaceService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9icm93c2VyL3JlcGxhY2VTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE2QmhHLE1BQU0sZUFBZSxHQUFHLGdCQUFnQixDQUFDO0lBRXpDLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxZQUFpQixFQUFPLEVBQUU7UUFDcEQsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25KLENBQUMsQ0FBQztJQUVGLE1BQU0sY0FBYyxHQUFHLENBQUMsZUFBb0IsRUFBTyxFQUFFO1FBQ3BELE9BQU8sZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQy9HLENBQUMsQ0FBQztJQUVLLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQTZCO2lCQUV6QixPQUFFLEdBQUcsaURBQWlELEFBQXBELENBQXFEO1FBRXZFLFlBQ3lDLG9CQUEyQyxFQUMvQyx3QkFBMkM7WUFEdkMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMvQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQW1CO1lBRS9FLElBQUksQ0FB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