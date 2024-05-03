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
define(["require", "exports", "vs/base/common/network", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/jsonFormatter", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/browser/services/notebookServiceImpl", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/editor/common/editorService", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/workbench/contrib/notebook/common/notebookDiffEditorInput", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditor", "vs/workbench/contrib/notebook/common/services/notebookWorkerService", "vs/workbench/contrib/notebook/browser/services/notebookWorkerServiceImpl", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/browser/services/notebookCellStatusBarServiceImpl", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/browser/services/notebookEditorServiceImpl", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/base/common/event", "vs/workbench/contrib/notebook/browser/diff/diffElementViewModel", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverServiceImpl", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/browser/services/notebookKernelServiceImpl", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/platform/configuration/common/configuration", "vs/platform/label/common/label", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/notebook/browser/services/notebookRendererMessagingServiceImpl", "vs/workbench/contrib/notebook/common/notebookRendererMessagingService", "vs/editor/common/config/editorOptions", "vs/workbench/contrib/notebook/browser/services/notebookExecutionStateServiceImpl", "vs/workbench/contrib/notebook/browser/services/notebookExecutionServiceImpl", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookKeymapService", "vs/workbench/contrib/notebook/browser/services/notebookKeymapServiceImpl", "vs/editor/common/languages/modesRegistry", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/editor/common/services/languageFeatures", "vs/workbench/contrib/comments/browser/commentReply", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/notebook/browser/services/notebookKernelHistoryServiceImpl", "vs/workbench/contrib/notebook/common/notebookLoggingService", "vs/workbench/contrib/notebook/browser/services/notebookLoggingServiceImpl", "vs/platform/product/common/product", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookAccessibility", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/notebook/browser/contrib/notebookVariables/notebookVariables", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/controller/insertCellActions", "vs/workbench/contrib/notebook/browser/controller/executeActions", "vs/workbench/contrib/notebook/browser/controller/sectionActions", "vs/workbench/contrib/notebook/browser/controller/layoutActions", "vs/workbench/contrib/notebook/browser/controller/editActions", "vs/workbench/contrib/notebook/browser/controller/cellOutputActions", "vs/workbench/contrib/notebook/browser/controller/apiActions", "vs/workbench/contrib/notebook/browser/controller/foldingController", "vs/workbench/contrib/notebook/browser/controller/chat/notebook.chat.contribution", "vs/workbench/contrib/notebook/browser/contrib/editorHint/emptyCellEditorHint", "vs/workbench/contrib/notebook/browser/contrib/clipboard/notebookClipboard", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFind", "vs/workbench/contrib/notebook/browser/contrib/format/formatting", "vs/workbench/contrib/notebook/browser/contrib/saveParticipants/saveParticipants", "vs/workbench/contrib/notebook/browser/contrib/gettingStarted/notebookGettingStarted", "vs/workbench/contrib/notebook/browser/contrib/layout/layoutActions", "vs/workbench/contrib/notebook/browser/contrib/marker/markerProvider", "vs/workbench/contrib/notebook/browser/contrib/navigation/arrow", "vs/workbench/contrib/notebook/browser/contrib/outline/notebookOutline", "vs/workbench/contrib/notebook/browser/contrib/profile/notebookProfile", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/statusBarProviders", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/contributedStatusBarItemController", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/executionStatusBarItemController", "vs/workbench/contrib/notebook/browser/contrib/editorStatusBar/editorStatusBar", "vs/workbench/contrib/notebook/browser/contrib/undoRedo/notebookUndoRedo", "vs/workbench/contrib/notebook/browser/contrib/cellCommands/cellCommands", "vs/workbench/contrib/notebook/browser/contrib/viewportWarmup/viewportWarmup", "vs/workbench/contrib/notebook/browser/contrib/troubleshoot/layout", "vs/workbench/contrib/notebook/browser/contrib/debug/notebookBreakpoints", "vs/workbench/contrib/notebook/browser/contrib/debug/notebookCellPausing", "vs/workbench/contrib/notebook/browser/contrib/debug/notebookDebugDecorations", "vs/workbench/contrib/notebook/browser/contrib/execute/executionEditorProgress", "vs/workbench/contrib/notebook/browser/contrib/kernelDetection/notebookKernelDetection", "vs/workbench/contrib/notebook/browser/diff/notebookDiffActions"], function (require, exports, network_1, lifecycle_1, marshalling_1, resources_1, types_1, uri_1, jsonFormatter_1, model_1, language_1, resolverService_1, nls, configurationRegistry_1, descriptors_1, extensions_1, instantiation_1, platform_1, editor_1, contributions_1, editor_2, notebookEditor_1, notebookEditorInput_1, notebookService_1, notebookServiceImpl_1, notebookCommon_1, editorService_1, undoRedo_1, notebookEditorModelResolverService_1, notebookDiffEditorInput_1, notebookDiffEditor_1, notebookWorkerService_1, notebookWorkerServiceImpl_1, notebookCellStatusBarService_1, notebookCellStatusBarServiceImpl_1, notebookEditorService_1, notebookEditorServiceImpl_1, jsonContributionRegistry_1, event_1, diffElementViewModel_1, notebookEditorModelResolverServiceImpl_1, notebookKernelService_1, notebookKernelServiceImpl_1, extensions_2, workingCopyEditorService_1, configuration_1, label_1, editorGroupsService_1, notebookRendererMessagingServiceImpl_1, notebookRendererMessagingService_1, editorOptions_1, notebookExecutionStateServiceImpl_1, notebookExecutionServiceImpl_1, notebookExecutionService_1, notebookKeymapService_1, notebookKeymapServiceImpl_1, modesRegistry_1, notebookExecutionStateService_1, languageFeatures_1, commentReply_1, codeEditorService_1, notebookKernelHistoryServiceImpl_1, notebookLoggingService_1, notebookLoggingServiceImpl_1, product_1, notebookContextKeys_1, notebookAccessibility_1, accessibleView_1, contextkey_1, accessibleViewActions_1, notebookVariables_1) {
    "use strict";
    var NotebookContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookContribution = void 0;
    /*--------------------------------------------------------------------------------------------- */
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(notebookEditor_1.NotebookEditor, notebookEditor_1.NotebookEditor.ID, 'Notebook Editor'), [
        new descriptors_1.SyncDescriptor(notebookEditorInput_1.NotebookEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(notebookDiffEditor_1.NotebookTextDiffEditor, notebookDiffEditor_1.NotebookTextDiffEditor.ID, 'Notebook Diff Editor'), [
        new descriptors_1.SyncDescriptor(notebookDiffEditorInput_1.NotebookDiffEditorInput)
    ]);
    class NotebookDiffEditorSerializer {
        canSerialize() {
            return true;
        }
        serialize(input) {
            (0, types_1.assertType)(input instanceof notebookDiffEditorInput_1.NotebookDiffEditorInput);
            return JSON.stringify({
                resource: input.resource,
                originalResource: input.original.resource,
                name: input.getName(),
                originalName: input.original.getName(),
                textDiffName: input.getName(),
                viewType: input.viewType,
            });
        }
        deserialize(instantiationService, raw) {
            const data = (0, marshalling_1.parse)(raw);
            if (!data) {
                return undefined;
            }
            const { resource, originalResource, name, viewType } = data;
            if (!data || !uri_1.URI.isUri(resource) || !uri_1.URI.isUri(originalResource) || typeof name !== 'string' || typeof viewType !== 'string') {
                return undefined;
            }
            const input = notebookDiffEditorInput_1.NotebookDiffEditorInput.create(instantiationService, resource, name, undefined, originalResource, viewType);
            return input;
        }
        static canResolveBackup(editorInput, backupResource) {
            return false;
        }
    }
    class NotebookEditorSerializer {
        canSerialize() {
            return true;
        }
        serialize(input) {
            (0, types_1.assertType)(input instanceof notebookEditorInput_1.NotebookEditorInput);
            const data = {
                resource: input.resource,
                preferredResource: input.preferredResource,
                viewType: input.viewType,
                options: input.options
            };
            return JSON.stringify(data);
        }
        deserialize(instantiationService, raw) {
            const data = (0, marshalling_1.parse)(raw);
            if (!data) {
                return undefined;
            }
            const { resource, preferredResource, viewType, options } = data;
            if (!data || !uri_1.URI.isUri(resource) || typeof viewType !== 'string') {
                return undefined;
            }
            const input = notebookEditorInput_1.NotebookEditorInput.getOrCreate(instantiationService, resource, preferredResource, viewType, options);
            return input;
        }
    }
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(notebookEditorInput_1.NotebookEditorInput.ID, NotebookEditorSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(notebookDiffEditorInput_1.NotebookDiffEditorInput.ID, NotebookDiffEditorSerializer);
    let NotebookContribution = class NotebookContribution extends lifecycle_1.Disposable {
        static { NotebookContribution_1 = this; }
        static { this.ID = 'workbench.contrib.notebook'; }
        constructor(undoRedoService, configurationService, codeEditorService) {
            super();
            this.codeEditorService = codeEditorService;
            this.updateCellUndoRedoComparisonKey(configurationService, undoRedoService);
            // Watch for changes to undoRedoPerCell setting
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.undoRedoPerCell)) {
                    this.updateCellUndoRedoComparisonKey(configurationService, undoRedoService);
                }
            }));
            // register comment decoration
            this.codeEditorService.registerDecorationType('comment-controller', commentReply_1.COMMENTEDITOR_DECORATION_KEY, {});
        }
        // Add or remove the cell undo redo comparison key based on the user setting
        updateCellUndoRedoComparisonKey(configurationService, undoRedoService) {
            const undoRedoPerCell = configurationService.getValue(notebookCommon_1.NotebookSetting.undoRedoPerCell);
            if (!undoRedoPerCell) {
                // Add comparison key to map cell => main document
                if (!this._uriComparisonKeyComputer) {
                    this._uriComparisonKeyComputer = undoRedoService.registerUriComparisonKeyComputer(notebookCommon_1.CellUri.scheme, {
                        getComparisonKey: (uri) => {
                            if (undoRedoPerCell) {
                                return uri.toString();
                            }
                            return NotebookContribution_1._getCellUndoRedoComparisonKey(uri);
                        }
                    });
                }
            }
            else {
                // Dispose comparison key
                this._uriComparisonKeyComputer?.dispose();
                this._uriComparisonKeyComputer = undefined;
            }
        }
        static _getCellUndoRedoComparisonKey(uri) {
            const data = notebookCommon_1.CellUri.parse(uri);
            if (!data) {
                return uri.toString();
            }
            return data.notebook.toString();
        }
        dispose() {
            super.dispose();
            this._uriComparisonKeyComputer?.dispose();
        }
    };
    exports.NotebookContribution = NotebookContribution;
    exports.NotebookContribution = NotebookContribution = NotebookContribution_1 = __decorate([
        __param(0, undoRedo_1.IUndoRedoService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, codeEditorService_1.ICodeEditorService)
    ], NotebookContribution);
    let CellContentProvider = class CellContentProvider {
        static { this.ID = 'workbench.contrib.cellContentProvider'; }
        constructor(textModelService, _modelService, _languageService, _notebookModelResolverService) {
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._notebookModelResolverService = _notebookModelResolverService;
            this._registration = textModelService.registerTextModelContentProvider(notebookCommon_1.CellUri.scheme, this);
        }
        dispose() {
            this._registration.dispose();
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const data = notebookCommon_1.CellUri.parse(resource);
            // const data = parseCellUri(resource);
            if (!data) {
                return null;
            }
            const ref = await this._notebookModelResolverService.resolve(data.notebook);
            let result = null;
            if (!ref.object.isResolved()) {
                return null;
            }
            for (const cell of ref.object.notebook.cells) {
                if (cell.uri.toString() === resource.toString()) {
                    const bufferFactory = {
                        create: (defaultEOL) => {
                            const newEOL = (defaultEOL === 2 /* DefaultEndOfLine.CRLF */ ? '\r\n' : '\n');
                            cell.textBuffer.setEOL(newEOL);
                            return { textBuffer: cell.textBuffer, disposable: lifecycle_1.Disposable.None };
                        },
                        getFirstLineText: (limit) => {
                            return cell.textBuffer.getLineContent(1).substring(0, limit);
                        }
                    };
                    const languageId = this._languageService.getLanguageIdByLanguageName(cell.language);
                    const languageSelection = languageId ? this._languageService.createById(languageId) : (cell.cellKind === notebookCommon_1.CellKind.Markup ? this._languageService.createById('markdown') : this._languageService.createByFilepathOrFirstLine(resource, cell.textBuffer.getLineContent(1)));
                    result = this._modelService.createModel(bufferFactory, languageSelection, resource);
                    break;
                }
            }
            if (!result) {
                ref.dispose();
                return null;
            }
            const once = event_1.Event.any(result.onWillDispose, ref.object.notebook.onWillDispose)(() => {
                once.dispose();
                ref.dispose();
            });
            return result;
        }
    };
    CellContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService),
        __param(3, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], CellContentProvider);
    let CellInfoContentProvider = class CellInfoContentProvider {
        static { this.ID = 'workbench.contrib.cellInfoContentProvider'; }
        constructor(textModelService, _modelService, _languageService, _labelService, _notebookModelResolverService) {
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._labelService = _labelService;
            this._notebookModelResolverService = _notebookModelResolverService;
            this._disposables = [];
            this._disposables.push(textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeNotebookCellMetadata, {
                provideTextContent: this.provideMetadataTextContent.bind(this)
            }));
            this._disposables.push(textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeNotebookCellOutput, {
                provideTextContent: this.provideOutputTextContent.bind(this)
            }));
            this._disposables.push(this._labelService.registerFormatter({
                scheme: network_1.Schemas.vscodeNotebookCellMetadata,
                formatting: {
                    label: '${path} (metadata)',
                    separator: '/'
                }
            }));
            this._disposables.push(this._labelService.registerFormatter({
                scheme: network_1.Schemas.vscodeNotebookCellOutput,
                formatting: {
                    label: '${path} (output)',
                    separator: '/'
                }
            }));
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._disposables);
        }
        async provideMetadataTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const data = notebookCommon_1.CellUri.parseCellPropertyUri(resource, network_1.Schemas.vscodeNotebookCellMetadata);
            if (!data) {
                return null;
            }
            const ref = await this._notebookModelResolverService.resolve(data.notebook);
            let result = null;
            const mode = this._languageService.createById('json');
            for (const cell of ref.object.notebook.cells) {
                if (cell.handle === data.handle) {
                    const metadataSource = (0, diffElementViewModel_1.getFormattedMetadataJSON)(ref.object.notebook, cell.metadata, cell.language);
                    result = this._modelService.createModel(metadataSource, mode, resource);
                    break;
                }
            }
            if (!result) {
                ref.dispose();
                return null;
            }
            const once = result.onWillDispose(() => {
                once.dispose();
                ref.dispose();
            });
            return result;
        }
        parseStreamOutput(op) {
            if (!op) {
                return;
            }
            const streamOutputData = (0, diffElementViewModel_1.getStreamOutputData)(op.outputs);
            if (streamOutputData) {
                return {
                    content: streamOutputData,
                    mode: this._languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID)
                };
            }
            return;
        }
        _getResult(data, cell) {
            let result = undefined;
            const mode = this._languageService.createById('json');
            const op = cell.outputs.find(op => op.outputId === data.outputId || op.alternativeOutputId === data.outputId);
            const streamOutputData = this.parseStreamOutput(op);
            if (streamOutputData) {
                result = streamOutputData;
                return result;
            }
            const obj = cell.outputs.map(output => ({
                metadata: output.metadata,
                outputItems: output.outputs.map(opit => ({
                    mimeType: opit.mime,
                    data: opit.data.toString()
                }))
            }));
            const outputSource = (0, jsonFormatter_1.toFormattedString)(obj, {});
            result = {
                content: outputSource,
                mode
            };
            return result;
        }
        async provideOutputTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const data = notebookCommon_1.CellUri.parseCellOutputUri(resource);
            if (!data) {
                return null;
            }
            const ref = await this._notebookModelResolverService.resolve(data.notebook);
            const cell = ref.object.notebook.cells.find(cell => !!cell.outputs.find(op => op.outputId === data.outputId || op.alternativeOutputId === data.outputId));
            if (!cell) {
                ref.dispose();
                return null;
            }
            const result = this._getResult(data, cell);
            if (!result) {
                ref.dispose();
                return null;
            }
            const model = this._modelService.createModel(result.content, result.mode, resource);
            const cellModelListener = event_1.Event.any(cell.onDidChangeOutputs ?? event_1.Event.None, cell.onDidChangeOutputItems ?? event_1.Event.None)(() => {
                const newResult = this._getResult(data, cell);
                if (!newResult) {
                    return;
                }
                model.setValue(newResult.content);
                model.setLanguage(newResult.mode.languageId);
            });
            const once = model.onWillDispose(() => {
                once.dispose();
                cellModelListener.dispose();
                ref.dispose();
            });
            return model;
        }
    };
    CellInfoContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService),
        __param(3, label_1.ILabelService),
        __param(4, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], CellInfoContentProvider);
    class RegisterSchemasContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.registerCellSchemas'; }
        constructor() {
            super();
            this.registerMetadataSchemas();
        }
        registerMetadataSchemas() {
            const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
            const metadataSchema = {
                properties: {
                    ['language']: {
                        type: 'string',
                        description: 'The language for the cell'
                    }
                },
                // patternProperties: allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            jsonRegistry.registerSchema('vscode://schemas/notebook/cellmetadata', metadataSchema);
        }
    }
    let NotebookEditorManager = class NotebookEditorManager {
        static { this.ID = 'workbench.contrib.notebookEditorManager'; }
        constructor(_editorService, _notebookEditorModelService, editorGroups) {
            this._editorService = _editorService;
            this._notebookEditorModelService = _notebookEditorModelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._disposables.add(event_1.Event.debounce(this._notebookEditorModelService.onDidChangeDirty, (last, current) => !last ? [current] : [...last, current], 100)(this._openMissingDirtyNotebookEditors, this));
            // CLOSE editors when we are about to open conflicting notebooks
            this._disposables.add(_notebookEditorModelService.onWillFailWithConflict(e => {
                for (const group of editorGroups.groups) {
                    const conflictInputs = group.editors.filter(input => input instanceof notebookEditorInput_1.NotebookEditorInput && input.viewType !== e.viewType && (0, resources_1.isEqual)(input.resource, e.resource));
                    const p = group.closeEditors(conflictInputs);
                    e.waitUntil(p);
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
        }
        _openMissingDirtyNotebookEditors(models) {
            const result = [];
            for (const model of models) {
                if (model.isDirty() && !this._editorService.isOpened({ resource: model.resource, typeId: notebookEditorInput_1.NotebookEditorInput.ID, editorId: model.viewType }) && (0, resources_1.extname)(model.resource) !== '.interactive') {
                    result.push({
                        resource: model.resource,
                        options: { inactive: true, preserveFocus: true, pinned: true, override: model.viewType }
                    });
                }
            }
            if (result.length > 0) {
                this._editorService.openEditors(result);
            }
        }
    };
    NotebookEditorManager = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, notebookEditorModelResolverService_1.INotebookEditorModelResolverService),
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NotebookEditorManager);
    let SimpleNotebookWorkingCopyEditorHandler = class SimpleNotebookWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.simpleNotebookWorkingCopyEditorHandler'; }
        constructor(_instantiationService, _workingCopyEditorService, _extensionService, _notebookService) {
            super();
            this._instantiationService = _instantiationService;
            this._workingCopyEditorService = _workingCopyEditorService;
            this._extensionService = _extensionService;
            this._notebookService = _notebookService;
            this._installHandler();
        }
        async handles(workingCopy) {
            const viewType = this.handlesSync(workingCopy);
            if (!viewType) {
                return false;
            }
            return this._notebookService.canResolve(viewType);
        }
        handlesSync(workingCopy) {
            const viewType = this._getViewType(workingCopy);
            if (!viewType || viewType === 'interactive') {
                return undefined;
            }
            return viewType;
        }
        isOpen(workingCopy, editor) {
            if (!this.handlesSync(workingCopy)) {
                return false;
            }
            return editor instanceof notebookEditorInput_1.NotebookEditorInput && editor.viewType === this._getViewType(workingCopy) && (0, resources_1.isEqual)(workingCopy.resource, editor.resource);
        }
        createEditor(workingCopy) {
            return notebookEditorInput_1.NotebookEditorInput.getOrCreate(this._instantiationService, workingCopy.resource, undefined, this._getViewType(workingCopy));
        }
        async _installHandler() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            this._register(this._workingCopyEditorService.registerHandler(this));
        }
        _getViewType(workingCopy) {
            return notebookCommon_1.NotebookWorkingCopyTypeIdentifier.parse(workingCopy.typeId);
        }
    };
    SimpleNotebookWorkingCopyEditorHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(2, extensions_2.IExtensionService),
        __param(3, notebookService_1.INotebookService)
    ], SimpleNotebookWorkingCopyEditorHandler);
    let NotebookLanguageSelectorScoreRefine = class NotebookLanguageSelectorScoreRefine {
        static { this.ID = 'workbench.contrib.notebookLanguageSelectorScoreRefine'; }
        constructor(_notebookService, languageFeaturesService) {
            this._notebookService = _notebookService;
            languageFeaturesService.setNotebookTypeResolver(this._getNotebookInfo.bind(this));
        }
        _getNotebookInfo(uri) {
            const cellUri = notebookCommon_1.CellUri.parse(uri);
            if (!cellUri) {
                return undefined;
            }
            const notebook = this._notebookService.getNotebookTextModel(cellUri.notebook);
            if (!notebook) {
                return undefined;
            }
            return {
                uri: notebook.uri,
                type: notebook.viewType
            };
        }
    };
    NotebookLanguageSelectorScoreRefine = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, languageFeatures_1.ILanguageFeaturesService)
    ], NotebookLanguageSelectorScoreRefine);
    class NotebookAccessibilityHelpContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(105, 'notebook', async (accessor) => {
                const activeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getActiveCodeEditor()
                    || accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor()
                    || accessor.get(editorService_1.IEditorService).activeEditorPane;
                if (activeEditor) {
                    (0, notebookAccessibility_1.runAccessibilityHelpAction)(accessor, activeEditor);
                }
            }, notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR));
        }
    }
    class NotebookAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(100, 'notebook', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const editorService = accessor.get(editorService_1.IEditorService);
                return (0, notebookAccessibility_1.showAccessibleOutput)(accessibleViewService, editorService);
            }, contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED, contextkey_1.ContextKeyExpr.equals('resourceExtname', '.ipynb'))));
        }
    }
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    (0, contributions_1.registerWorkbenchContribution2)(NotebookContribution.ID, NotebookContribution, 1 /* WorkbenchPhase.BlockStartup */);
    (0, contributions_1.registerWorkbenchContribution2)(CellContentProvider.ID, CellContentProvider, 1 /* WorkbenchPhase.BlockStartup */);
    (0, contributions_1.registerWorkbenchContribution2)(CellInfoContentProvider.ID, CellInfoContentProvider, 1 /* WorkbenchPhase.BlockStartup */);
    (0, contributions_1.registerWorkbenchContribution2)(RegisterSchemasContribution.ID, RegisterSchemasContribution, 1 /* WorkbenchPhase.BlockStartup */);
    (0, contributions_1.registerWorkbenchContribution2)(NotebookEditorManager.ID, NotebookEditorManager, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(NotebookLanguageSelectorScoreRefine.ID, NotebookLanguageSelectorScoreRefine, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(SimpleNotebookWorkingCopyEditorHandler.ID, SimpleNotebookWorkingCopyEditorHandler, 2 /* WorkbenchPhase.BlockRestore */);
    workbenchContributionsRegistry.registerWorkbenchContribution(NotebookAccessibilityHelpContribution, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(NotebookAccessibleViewContribution, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(notebookVariables_1.NotebookVariables, 4 /* LifecyclePhase.Eventually */);
    (0, extensions_1.registerSingleton)(notebookService_1.INotebookService, notebookServiceImpl_1.NotebookService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookWorkerService_1.INotebookEditorWorkerService, notebookWorkerServiceImpl_1.NotebookEditorWorkerServiceImpl, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookEditorModelResolverService_1.INotebookEditorModelResolverService, notebookEditorModelResolverServiceImpl_1.NotebookModelResolverServiceImpl, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookCellStatusBarService_1.INotebookCellStatusBarService, notebookCellStatusBarServiceImpl_1.NotebookCellStatusBarService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookEditorService_1.INotebookEditorService, notebookEditorServiceImpl_1.NotebookEditorWidgetService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookKernelService_1.INotebookKernelService, notebookKernelServiceImpl_1.NotebookKernelService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookKernelService_1.INotebookKernelHistoryService, notebookKernelHistoryServiceImpl_1.NotebookKernelHistoryService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookExecutionService_1.INotebookExecutionService, notebookExecutionServiceImpl_1.NotebookExecutionService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookExecutionStateService_1.INotebookExecutionStateService, notebookExecutionStateServiceImpl_1.NotebookExecutionStateService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookRendererMessagingService_1.INotebookRendererMessagingService, notebookRendererMessagingServiceImpl_1.NotebookRendererMessagingService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookKeymapService_1.INotebookKeymapService, notebookKeymapServiceImpl_1.NotebookKeymapService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookLoggingService_1.INotebookLoggingService, notebookLoggingServiceImpl_1.NotebookLoggingService, 1 /* InstantiationType.Delayed */);
    const schemas = {};
    function isConfigurationPropertySchema(x) {
        return (typeof x.type !== 'undefined' || typeof x.anyOf !== 'undefined');
    }
    for (const editorOption of editorOptions_1.editorOptionsRegistry) {
        const schema = editorOption.schema;
        if (schema) {
            if (isConfigurationPropertySchema(schema)) {
                schemas[`editor.${editorOption.name}`] = schema;
            }
            else {
                for (const key in schema) {
                    if (Object.hasOwnProperty.call(schema, key)) {
                        schemas[key] = schema[key];
                    }
                }
            }
        }
    }
    const editorOptionsCustomizationSchema = {
        description: nls.localize('notebook.editorOptions.experimentalCustomization', 'Settings for code editors used in notebooks. This can be used to customize most editor.* settings.'),
        default: {},
        allOf: [
            {
                properties: schemas,
            }
            // , {
            // 	patternProperties: {
            // 		'^\\[.*\\]$': {
            // 			type: 'object',
            // 			default: {},
            // 			properties: schemas
            // 		}
            // 	}
            // }
        ],
        tags: ['notebookLayout']
    };
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'notebook',
        order: 100,
        title: nls.localize('notebookConfigurationTitle', "Notebook"),
        type: 'object',
        properties: {
            [notebookCommon_1.NotebookSetting.displayOrder]: {
                description: nls.localize('notebook.displayOrder.description', "Priority list for output mime types"),
                type: 'array',
                items: {
                    type: 'string'
                },
                default: []
            },
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: {
                description: nls.localize('notebook.cellToolbarLocation.description', "Where the cell toolbar should be shown, or whether it should be hidden."),
                type: 'object',
                additionalProperties: {
                    markdownDescription: nls.localize('notebook.cellToolbarLocation.viewType', "Configure the cell toolbar position for for specific file types"),
                    type: 'string',
                    enum: ['left', 'right', 'hidden']
                },
                default: {
                    'default': 'right'
                },
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: {
                description: nls.localize('notebook.showCellStatusbar.description', "Whether the cell status bar should be shown."),
                type: 'string',
                enum: ['hidden', 'visible', 'visibleAfterExecute'],
                enumDescriptions: [
                    nls.localize('notebook.showCellStatusbar.hidden.description', "The cell Status bar is always hidden."),
                    nls.localize('notebook.showCellStatusbar.visible.description', "The cell Status bar is always visible."),
                    nls.localize('notebook.showCellStatusbar.visibleAfterExecute.description', "The cell Status bar is hidden until the cell has executed. Then it becomes visible to show the execution status.")
                ],
                default: 'visible',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.textDiffEditorPreview]: {
                description: nls.localize('notebook.diff.enablePreview.description', "Whether to use the enhanced text diff editor for notebook."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.diffOverviewRuler]: {
                description: nls.localize('notebook.diff.enableOverviewRuler.description', "Whether to render the overview ruler in the diff editor for notebook."),
                type: 'boolean',
                default: false,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.cellToolbarVisibility]: {
                markdownDescription: nls.localize('notebook.cellToolbarVisibility.description', "Whether the cell toolbar should appear on hover or click."),
                type: 'string',
                enum: ['hover', 'click'],
                default: 'click',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: {
                description: nls.localize('notebook.undoRedoPerCell.description', "Whether to use separate undo/redo stack for each cell."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.compactView]: {
                description: nls.localize('notebook.compactView.description', "Control whether the notebook editor should be rendered in a compact form. For example, when turned on, it will decrease the left margin width."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.focusIndicator]: {
                description: nls.localize('notebook.focusIndicator.description', "Controls where the focus indicator is rendered, either along the cell borders or on the left gutter."),
                type: 'string',
                enum: ['border', 'gutter'],
                default: 'gutter',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: {
                description: nls.localize('notebook.insertToolbarPosition.description', "Control where the insert cell actions should appear."),
                type: 'string',
                enum: ['betweenCells', 'notebookToolbar', 'both', 'hidden'],
                enumDescriptions: [
                    nls.localize('insertToolbarLocation.betweenCells', "A toolbar that appears on hover between cells."),
                    nls.localize('insertToolbarLocation.notebookToolbar', "The toolbar at the top of the notebook editor."),
                    nls.localize('insertToolbarLocation.both', "Both toolbars."),
                    nls.localize('insertToolbarLocation.hidden', "The insert actions don't appear anywhere."),
                ],
                default: 'both',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.globalToolbar]: {
                description: nls.localize('notebook.globalToolbar.description', "Control whether to render a global toolbar inside the notebook editor."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.stickyScrollEnabled]: {
                description: nls.localize('notebook.stickyScrollEnabled.description', "Experimental. Control whether to render notebook Sticky Scroll headers in the notebook editor."),
                type: 'boolean',
                default: false,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.stickyScrollMode]: {
                description: nls.localize('notebook.stickyScrollMode.description', "Control whether nested sticky lines appear to stack flat or indented."),
                type: 'string',
                enum: ['flat', 'indented'],
                enumDescriptions: [
                    nls.localize('notebook.stickyScrollMode.flat', "Nested sticky lines appear flat."),
                    nls.localize('notebook.stickyScrollMode.indented', "Nested sticky lines appear indented."),
                ],
                default: 'indented',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.consolidatedOutputButton]: {
                description: nls.localize('notebook.consolidatedOutputButton.description', "Control whether outputs action should be rendered in the output toolbar."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.showFoldingControls]: {
                description: nls.localize('notebook.showFoldingControls.description', "Controls when the Markdown header folding arrow is shown."),
                type: 'string',
                enum: ['always', 'never', 'mouseover'],
                enumDescriptions: [
                    nls.localize('showFoldingControls.always', "The folding controls are always visible."),
                    nls.localize('showFoldingControls.never', "Never show the folding controls and reduce the gutter size."),
                    nls.localize('showFoldingControls.mouseover', "The folding controls are visible only on mouseover."),
                ],
                default: 'mouseover',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.dragAndDropEnabled]: {
                description: nls.localize('notebook.dragAndDrop.description', "Control whether the notebook editor should allow moving cells through drag and drop."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: {
                description: nls.localize('notebook.consolidatedRunButton.description', "Control whether extra actions are shown in a dropdown next to the run button."),
                type: 'boolean',
                default: false,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.globalToolbarShowLabel]: {
                description: nls.localize('notebook.globalToolbarShowLabel', "Control whether the actions on the notebook toolbar should render label or not."),
                type: 'string',
                enum: ['always', 'never', 'dynamic'],
                default: 'always',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.textOutputLineLimit]: {
                markdownDescription: nls.localize('notebook.textOutputLineLimit', "Controls how many lines of text are displayed in a text output. If {0} is enabled, this setting is used to determine the scroll height of the output.", '`#notebook.output.scrolling#`'),
                type: 'number',
                default: 30,
                tags: ['notebookLayout', 'notebookOutputLayout'],
                minimum: 1,
            },
            [notebookCommon_1.NotebookSetting.LinkifyOutputFilePaths]: {
                description: nls.localize('notebook.disableOutputFilePathLinks', "Control whether to disable filepath links in the output of notebook cells."),
                type: 'boolean',
                default: true,
                tags: ['notebookOutputLayout']
            },
            [notebookCommon_1.NotebookSetting.markupFontSize]: {
                markdownDescription: nls.localize('notebook.markup.fontSize', "Controls the font size in pixels of rendered markup in notebooks. When set to {0}, 120% of {1} is used.", '`0`', '`#editor.fontSize#`'),
                type: 'number',
                default: 0,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations]: editorOptionsCustomizationSchema,
            [notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells]: {
                markdownDescription: nls.localize('notebook.interactiveWindow.collapseCodeCells', "Controls whether code cells in the interactive window are collapsed by default."),
                type: 'string',
                enum: ['always', 'never', 'fromEditor'],
                default: 'fromEditor'
            },
            [notebookCommon_1.NotebookSetting.outputLineHeight]: {
                markdownDescription: nls.localize('notebook.outputLineHeight', "Line height of the output text within notebook cells.\n - When set to 0, editor line height is used.\n - Values between 0 and 8 will be used as a multiplier with the font size.\n - Values greater than or equal to 8 will be used as effective values."),
                type: 'number',
                default: 0,
                tags: ['notebookLayout', 'notebookOutputLayout']
            },
            [notebookCommon_1.NotebookSetting.outputFontSize]: {
                markdownDescription: nls.localize('notebook.outputFontSize', "Font size for the output text within notebook cells. When set to 0, {0} is used.", '`#editor.fontSize#`'),
                type: 'number',
                default: 0,
                tags: ['notebookLayout', 'notebookOutputLayout']
            },
            [notebookCommon_1.NotebookSetting.outputFontFamily]: {
                markdownDescription: nls.localize('notebook.outputFontFamily', "The font family of the output text within notebook cells. When set to empty, the {0} is used.", '`#editor.fontFamily#`'),
                type: 'string',
                tags: ['notebookLayout', 'notebookOutputLayout']
            },
            [notebookCommon_1.NotebookSetting.outputScrolling]: {
                markdownDescription: nls.localize('notebook.outputScrolling', "Initially render notebook outputs in a scrollable region when longer than the limit."),
                type: 'boolean',
                tags: ['notebookLayout', 'notebookOutputLayout'],
                default: typeof product_1.default.quality === 'string' && product_1.default.quality !== 'stable' // only enable as default in insiders
            },
            [notebookCommon_1.NotebookSetting.outputWordWrap]: {
                markdownDescription: nls.localize('notebook.outputWordWrap', "Controls whether the lines in output should wrap."),
                type: 'boolean',
                tags: ['notebookLayout', 'notebookOutputLayout'],
                default: false
            },
            [notebookCommon_1.NotebookSetting.formatOnSave]: {
                markdownDescription: nls.localize('notebook.formatOnSave', "Format a notebook on save. A formatter must be available, the file must not be saved after delay, and the editor must not be shutting down."),
                type: 'boolean',
                tags: ['notebookLayout'],
                default: false
            },
            [notebookCommon_1.NotebookSetting.insertFinalNewline]: {
                markdownDescription: nls.localize('notebook.insertFinalNewline', "When enabled, insert a final new line into the end of code cells when saving a notebook."),
                type: 'boolean',
                tags: ['notebookLayout'],
                default: false
            },
            [notebookCommon_1.NotebookSetting.codeActionsOnSave]: {
                markdownDescription: nls.localize('notebook.codeActionsOnSave', 'Run a series of Code Actions for a notebook on save. Code Actions must be specified, the file must not be saved after delay, and the editor must not be shutting down. Example: `"notebook.source.organizeImports": "explicit"`'),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'boolean'],
                    enum: ['explicit', 'never', true, false],
                    // enum: ['explicit', 'always', 'never'], -- autosave support needs to be built first
                    // nls.localize('always', 'Always triggers Code Actions on save, including autosave, focus, and window change events.'),
                    enumDescriptions: [nls.localize('explicit', 'Triggers Code Actions only when explicitly saved.'), nls.localize('never', 'Never triggers Code Actions on save.'), nls.localize('explicitBoolean', 'Triggers Code Actions only when explicitly saved. This value will be deprecated in favor of "explicit".'), nls.localize('neverBoolean', 'Triggers Code Actions only when explicitly saved. This value will be deprecated in favor of "never".')],
                },
                default: {}
            },
            [notebookCommon_1.NotebookSetting.formatOnCellExecution]: {
                markdownDescription: nls.localize('notebook.formatOnCellExecution', "Format a notebook cell upon execution. A formatter must be available."),
                type: 'boolean',
                default: false
            },
            [notebookCommon_1.NotebookSetting.confirmDeleteRunningCell]: {
                markdownDescription: nls.localize('notebook.confirmDeleteRunningCell', "Control whether a confirmation prompt is required to delete a running cell."),
                type: 'boolean',
                default: true
            },
            [notebookCommon_1.NotebookSetting.findScope]: {
                markdownDescription: nls.localize('notebook.findScope', "Customize the Find Widget behavior for searching within notebook cells. When both markup source and markup preview are enabled, the Find Widget will search either the source code or preview based on the current state of the cell."),
                type: 'object',
                properties: {
                    markupSource: {
                        type: 'boolean',
                        default: true
                    },
                    markupPreview: {
                        type: 'boolean',
                        default: true
                    },
                    codeSource: {
                        type: 'boolean',
                        default: true
                    },
                    codeOutput: {
                        type: 'boolean',
                        default: true
                    }
                },
                default: {
                    markupSource: true,
                    markupPreview: true,
                    codeSource: true,
                    codeOutput: true
                },
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.remoteSaving]: {
                markdownDescription: nls.localize('notebook.remoteSaving', "Enables the incremental saving of notebooks in Remote environment. When enabled, only the changes to the notebook are sent to the extension host, improving performance for large notebooks and slow network connections."),
                type: 'boolean',
                default: typeof product_1.default.quality === 'string' && product_1.default.quality !== 'stable' // only enable as default in insiders
            },
            [notebookCommon_1.NotebookSetting.scrollToRevealCell]: {
                markdownDescription: nls.localize('notebook.scrolling.revealNextCellOnExecute.description', "How far to scroll when revealing the next cell upon running {0}.", 'notebook.cell.executeAndSelectBelow'),
                type: 'string',
                enum: ['fullCell', 'firstLine', 'none'],
                markdownEnumDescriptions: [
                    nls.localize('notebook.scrolling.revealNextCellOnExecute.fullCell.description', 'Scroll to fully reveal the next cell.'),
                    nls.localize('notebook.scrolling.revealNextCellOnExecute.firstLine.description', 'Scroll to reveal the first line of the next cell.'),
                    nls.localize('notebook.scrolling.revealNextCellOnExecute.none.description', 'Do not scroll.'),
                ],
                default: 'fullCell'
            },
            [notebookCommon_1.NotebookSetting.anchorToFocusedCell]: {
                markdownDescription: nls.localize('notebook.scrolling.anchorToFocusedCell.description', "Experimental. Keep the focused cell steady while surrounding cells change size."),
                type: 'string',
                enum: ['auto', 'on', 'off'],
                markdownEnumDescriptions: [
                    nls.localize('notebook.scrolling.anchorToFocusedCell.auto.description', "Anchor the viewport to the focused cell depending on context unless {0} is set to {1}.", 'notebook.scrolling.revealCellBehavior', 'none'),
                    nls.localize('notebook.scrolling.anchorToFocusedCell.on.description', "Always anchor the viewport to the focused cell."),
                    nls.localize('notebook.scrolling.anchorToFocusedCell.off.description', "The focused cell may shift around as cells resize.")
                ],
                default: 'auto'
            },
            [notebookCommon_1.NotebookSetting.cellChat]: {
                markdownDescription: nls.localize('notebook.cellChat', "Enable experimental floating chat widget in notebooks."),
                type: 'boolean',
                default: false
            },
            [notebookCommon_1.NotebookSetting.notebookVariablesView]: {
                markdownDescription: nls.localize('notebook.VariablesView.description', "Enable the experimental notebook variables view within the debug panel."),
                type: 'boolean',
                default: false
            },
            [notebookCommon_1.NotebookSetting.cellFailureDiagnostics]: {
                markdownDescription: nls.localize('notebook.cellFailureDiagnostics', "Show available diagnostics for cell failures."),
                type: 'boolean',
                default: true
            },
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2suY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL25vdGVib29rLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBMEhoRyxrR0FBa0c7SUFFbEcsbUJBQVEsQ0FBQyxFQUFFLENBQXNCLHlCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixDQUMvRSw2QkFBb0IsQ0FBQyxNQUFNLENBQzFCLCtCQUFjLEVBQ2QsK0JBQWMsQ0FBQyxFQUFFLEVBQ2pCLGlCQUFpQixDQUNqQixFQUNEO1FBQ0MsSUFBSSw0QkFBYyxDQUFDLHlDQUFtQixDQUFDO0tBQ3ZDLENBQ0QsQ0FBQztJQUVGLG1CQUFRLENBQUMsRUFBRSxDQUFzQix5QkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxrQkFBa0IsQ0FDL0UsNkJBQW9CLENBQUMsTUFBTSxDQUMxQiwyQ0FBc0IsRUFDdEIsMkNBQXNCLENBQUMsRUFBRSxFQUN6QixzQkFBc0IsQ0FDdEIsRUFDRDtRQUNDLElBQUksNEJBQWMsQ0FBQyxpREFBdUIsQ0FBQztLQUMzQyxDQUNELENBQUM7SUFFRixNQUFNLDRCQUE0QjtRQUNqQyxZQUFZO1lBQ1gsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsU0FBUyxDQUFDLEtBQWtCO1lBQzNCLElBQUEsa0JBQVUsRUFBQyxLQUFLLFlBQVksaURBQXVCLENBQUMsQ0FBQztZQUNyRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3JCLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUTtnQkFDeEIsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRO2dCQUN6QyxJQUFJLEVBQUUsS0FB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