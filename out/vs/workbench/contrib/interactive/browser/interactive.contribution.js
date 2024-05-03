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
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/editOperation", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/editor/contrib/peekView/browser/peekView", "vs/editor/contrib/suggest/browser/suggest", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/common/theme", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/interactive/browser/interactiveCommon", "vs/workbench/contrib/interactive/browser/interactiveDocumentService", "vs/workbench/contrib/interactive/browser/interactiveEditor", "vs/workbench/contrib/interactive/browser/interactiveEditorInput", "vs/workbench/contrib/interactive/browser/interactiveHistoryService", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyEditorService"], function (require, exports, iterator_1, lifecycle_1, marshalling_1, network_1, resources_1, strings_1, uri_1, bulkEditService_1, editOperation_1, modesRegistry_1, model_1, resolverService_1, peekView_1, suggest_1, nls_1, actions_1, configuration_1, configurationRegistry_1, contextkey_1, editor_1, descriptors_1, extensions_1, instantiation_1, log_1, platform_1, colorRegistry_1, editor_2, contributions_1, editor_3, theme_1, bulkCellEdits_1, interactiveCommon_1, interactiveDocumentService_1, interactiveEditor_1, interactiveEditorInput_1, interactiveHistoryService_1, coreActions_1, icons, notebookEditorService_1, notebookCommon_1, notebookContextKeys_1, notebookKernelService_1, notebookService_1, editorGroupColumn_1, editorGroupsService_1, editorResolverService_1, editorService_1, extensions_2, workingCopyEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveEditorSerializer = exports.InteractiveDocumentContribution = void 0;
    const interactiveWindowCategory = (0, nls_1.localize2)('interactiveWindow', "Interactive Window");
    platform_1.Registry.as(editor_3.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(interactiveEditor_1.InteractiveEditor, notebookCommon_1.INTERACTIVE_WINDOW_EDITOR_ID, 'Interactive Window'), [
        new descriptors_1.SyncDescriptor(interactiveEditorInput_1.InteractiveEditorInput)
    ]);
    let InteractiveDocumentContribution = class InteractiveDocumentContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.interactiveDocument'; }
        constructor(notebookService, editorResolverService, editorService, instantiationService) {
            super();
            this.instantiationService = instantiationService;
            const info = notebookService.getContributedNotebookType('interactive');
            // We need to contribute a notebook type for the Interactive Window to provide notebook models.
            if (!info) {
                this._register(notebookService.registerContributedNotebookType('interactive', {
                    providerDisplayName: 'Interactive Notebook',
                    displayName: 'Interactive',
                    filenamePattern: ['*.interactive'],
                    exclusive: true
                }));
            }
            editorResolverService.registerEditor(`${network_1.Schemas.vscodeInteractiveInput}:/**`, {
                id: 'vscode-interactive-input',
                label: 'Interactive Editor',
                priority: editorResolverService_1.RegisteredEditorPriority.exclusive
            }, {
                canSupportResource: uri => uri.scheme === network_1.Schemas.vscodeInteractiveInput,
                singlePerResource: true
            }, {
                createEditorInput: ({ resource }) => {
                    const editorInput = editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */).find(editor => editor.editor instanceof interactiveEditorInput_1.InteractiveEditorInput && editor.editor.inputResource.toString() === resource.toString());
                    return editorInput;
                }
            });
            editorResolverService.registerEditor(`*.interactive`, {
                id: 'interactive',
                label: 'Interactive Editor',
                priority: editorResolverService_1.RegisteredEditorPriority.exclusive
            }, {
                canSupportResource: uri => (uri.scheme === network_1.Schemas.untitled && (0, resources_1.extname)(uri) === '.interactive') ||
                    (uri.scheme === network_1.Schemas.vscodeNotebookCell && (0, resources_1.extname)(uri) === '.interactive'),
                singlePerResource: true
            }, {
                createEditorInput: ({ resource, options }) => {
                    const data = notebookCommon_1.CellUri.parse(resource);
                    let cellOptions;
                    let IwResource = resource;
                    if (data) {
                        cellOptions = { resource, options };
                        IwResource = data.notebook;
                    }
                    const notebookOptions = { ...options, cellOptions };
                    const editorInput = createEditor(IwResource, this.instantiationService);
                    return {
                        editor: editorInput,
                        options: notebookOptions
                    };
                },
                createUntitledEditorInput: ({ resource, options }) => {
                    if (!resource) {
                        throw new Error('Interactive window editors must have a resource name');
                    }
                    const data = notebookCommon_1.CellUri.parse(resource);
                    let cellOptions;
                    if (data) {
                        cellOptions = { resource, options };
                    }
                    const notebookOptions = { ...options, cellOptions };
                    const editorInput = createEditor(resource, this.instantiationService);
                    return {
                        editor: editorInput,
                        options: notebookOptions
                    };
                }
            });
        }
    };
    exports.InteractiveDocumentContribution = InteractiveDocumentContribution;
    exports.InteractiveDocumentContribution = InteractiveDocumentContribution = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, editorResolverService_1.IEditorResolverService),
        __param(2, editorService_1.IEditorService),
        __param(3, instantiation_1.IInstantiationService)
    ], InteractiveDocumentContribution);
    let InteractiveInputContentProvider = class InteractiveInputContentProvider {
        static { this.ID = 'workbench.contrib.interactiveInputContentProvider'; }
        constructor(textModelService, _modelService) {
            this._modelService = _modelService;
            this._registration = textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeInteractiveInput, this);
        }
        dispose() {
            this._registration.dispose();
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const result = this._modelService.createModel('', null, resource, false);
            return result;
        }
    };
    InteractiveInputContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService)
    ], InteractiveInputContentProvider);
    function createEditor(resource, instantiationService) {
        const counter = /\/Interactive-(\d+)/.exec(resource.path);
        const inputBoxPath = counter && counter[1] ? `/InteractiveInput-${counter[1]}` : 'InteractiveInput';
        const inputUri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeInteractiveInput, path: inputBoxPath });
        const editorInput = interactiveEditorInput_1.InteractiveEditorInput.create(instantiationService, resource, inputUri);
        return editorInput;
    }
    let InteractiveWindowWorkingCopyEditorHandler = class InteractiveWindowWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.interactiveWindowWorkingCopyEditorHandler'; }
        constructor(_instantiationService, _workingCopyEditorService, _extensionService) {
            super();
            this._instantiationService = _instantiationService;
            this._workingCopyEditorService = _workingCopyEditorService;
            this._extensionService = _extensionService;
            this._installHandler();
        }
        handles(workingCopy) {
            const viewType = this._getViewType(workingCopy);
            return !!viewType && viewType === 'interactive';
        }
        isOpen(workingCopy, editor) {
            if (!this.handles(workingCopy)) {
                return false;
            }
            return editor instanceof interactiveEditorInput_1.InteractiveEditorInput && (0, resources_1.isEqual)(workingCopy.resource, editor.resource);
        }
        createEditor(workingCopy) {
            return createEditor(workingCopy.resource, this._instantiationService);
        }
        async _installHandler() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            this._register(this._workingCopyEditorService.registerHandler(this));
        }
        _getViewType(workingCopy) {
            return notebookCommon_1.NotebookWorkingCopyTypeIdentifier.parse(workingCopy.typeId);
        }
    };
    InteractiveWindowWorkingCopyEditorHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(2, extensions_2.IExtensionService)
    ], InteractiveWindowWorkingCopyEditorHandler);
    (0, contributions_1.registerWorkbenchContribution2)(InteractiveDocumentContribution.ID, InteractiveDocumentContribution, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(InteractiveInputContentProvider.ID, InteractiveInputContentProvider, {
        editorTypeId: notebookCommon_1.INTERACTIVE_WINDOW_EDITOR_ID
    });
    (0, contributions_1.registerWorkbenchContribution2)(InteractiveWindowWorkingCopyEditorHandler.ID, InteractiveWindowWorkingCopyEditorHandler, {
        editorTypeId: notebookCommon_1.INTERACTIVE_WINDOW_EDITOR_ID
    });
    class InteractiveEditorSerializer {
        static { this.ID = interactiveEditorInput_1.InteractiveEditorInput.ID; }
        canSerialize(editor) {
            if (!(editor instanceof interactiveEditorInput_1.InteractiveEditorInput)) {
                return false;
            }
            return uri_1.URI.isUri(editor.primary.resource) && uri_1.URI.isUri(editor.inputResource);
        }
        serialize(input) {
            if (!this.canSerialize(input)) {
                return undefined;
            }
            return JSON.stringify({
                resource: input.primary.resource,
                inputResource: input.inputResource,
                name: input.getName(),
                language: input.language
            });
        }
        deserialize(instantiationService, raw) {
            const data = (0, marshalling_1.parse)(raw);
            if (!data) {
                return undefined;
            }
            const { resource, inputResource, name, language } = data;
            if (!uri_1.URI.isUri(resource) || !uri_1.URI.isUri(inputResource)) {
                return undefined;
            }
            const input = interactiveEditorInput_1.InteractiveEditorInput.create(instantiationService, resource, inputResource, name, language);
            return input;
        }
    }
    exports.InteractiveEditorSerializer = InteractiveEditorSerializer;
    platform_1.Registry.as(editor_3.EditorExtensions.EditorFactory)
        .registerEditorSerializer(InteractiveEditorSerializer.ID, InteractiveEditorSerializer);
    (0, extensions_1.registerSingleton)(interactiveHistoryService_1.IInteractiveHistoryService, interactiveHistoryService_1.InteractiveHistoryService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(interactiveDocumentService_1.IInteractiveDocumentService, interactiveDocumentService_1.InteractiveDocumentService, 1 /* InstantiationType.Delayed */);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: '_interactive.open',
                title: (0, nls_1.localize2)('interactive.open', 'Open Interactive Window'),
                f1: false,
                category: interactiveWindowCategory,
                metadata: {
                    description: (0, nls_1.localize)('interactive.open', 'Open Interactive Window'),
                    args: [
                        {
                            name: 'showOptions',
                            description: 'Show Options',
                            schema: {
                                type: 'object',
                                properties: {
                                    'viewColumn': {
                                        type: 'number',
                                        default: -1
                                    },
                                    'preserveFocus': {
                                        type: 'boolean',
                                        default: true
                                    }
                                },
                            }
                        },
                        {
                            name: 'resource',
                            description: 'Interactive resource Uri',
                            isOptional: true
                        },
                        {
                            name: 'controllerId',
                            description: 'Notebook controller Id',
                            isOptional: true
                        },
                        {
                            name: 'title',
                            description: 'Notebook editor title',
                            isOptional: true
                        }
                    ]
                }
            });
        }
        async run(accessor, showOptions, resource, id, title) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const kernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            const logService = accessor.get(log_1.ILogService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const group = (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupService, configurationService, typeof showOptions === 'number' ? showOptions : showOptions?.viewColumn);
            const editorOptions = {
                activation: editor_1.EditorActivation.PRESERVE,
                preserveFocus: typeof showOptions !== 'number' ? (showOptions?.preserveFocus ?? false) : false
            };
            if (resource && (0, resources_1.extname)(resource) === '.interactive') {
                logService.debug('Open interactive window from resource:', resource.toString());
                const resourceUri = uri_1.URI.revive(resource);
                const editors = editorService.findEditors(resourceUri).filter(id => id.editor instanceof interactiveEditorInput_1.InteractiveEditorInput && id.editor.resource?.toString() === resourceUri.toString());
                if (editors.length) {
                    logService.debug('Find existing interactive window:', resource.toString());
                    const editorInput = editors[0].editor;
                    const currentGroup = editors[0].groupId;
                    const editor = await editorService.openEditor(editorInput, editorOptions, currentGroup);
                    const editorControl = editor?.getControl();
                    return {
                        notebookUri: editorInput.resource,
                        inputUri: editorInput.inputResource,
                        notebookEditorId: editorControl?.notebookEditor?.getId()
                    };
                }
            }
            const existingNotebookDocument = new Set();
            editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */).forEach(editor => {
                if (editor.editor.resource) {
                    existingNotebookDocument.add(editor.editor.resource.toString());
                }
            });
            let notebookUri = undefined;
            let inputUri = undefined;
            let counter = 1;
            do {
                notebookUri = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: `/Interactive-${counter}.interactive` });
                inputUri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeInteractiveInput, path: `/InteractiveInput-${counter}` });
                counter++;
            } while (existingNotebookDocument.has(notebookUri.toString()));
            interactiveEditorInput_1.InteractiveEditorInput.setName(notebookUri, title);
            logService.debug('Open new interactive window:', notebookUri.toString(), inputUri.toString());
            if (id) {
                const allKernels = kernelService.getMatchingKernel({ uri: notebookUri, viewType: 'interactive' }).all;
                const preferredKernel = allKernels.find(kernel => kernel.id === id);
                if (preferredKernel) {
                    kernelService.preselectKernelForNotebook(preferredKernel, { uri: notebookUri, viewType: 'interactive' });
                }
            }
            historyService.clearHistory(notebookUri);
            const editorInput = { resource: notebookUri, options: editorOptions };
            const editorPane = await editorService.openEditor(editorInput, group);
            const editorControl = editorPane?.getControl();
            // Extensions must retain references to these URIs to manipulate the interactive editor
            logService.debug('New interactive window opened. Notebook editor id', editorControl?.notebookEditor?.getId());
            return { notebookUri, inputUri, notebookEditorId: editorControl?.notebookEditor?.getId() };
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.execute',
                title: (0, nls_1.localize2)('interactive.execute', 'Execute Code'),
                category: interactiveWindowCategory,
                keybinding: {
                    // when: NOTEBOOK_CELL_LIST_FOCUSED,
                    when: contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'),
                    primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */,
                    win: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */
                    },
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
                menu: [
                    {
                        id: actions_1.MenuId.InteractiveInputExecute
                    }
                ],
                icon: icons.executeIcon,
                f1: false,
                metadata: {
                    description: 'Execute the Contents of the Input Box',
                    args: [
                        {
                            name: 'resource',
                            description: 'Interactive resource Uri',
                            isOptional: true
                        }
                    ]
                }
            });
        }
        async run(accessor, context) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const notebookEditorService = accessor.get(notebookEditorService_1.INotebookEditorService);
            let editorControl;
            if (context) {
                const resourceUri = uri_1.URI.revive(context);
                const editors = editorService.findEditors(resourceUri)
                    .filter(id => id.editor instanceof interactiveEditorInput_1.InteractiveEditorInput && id.editor.resource?.toString() === resourceUri.toString());
                if (editors.length) {
                    const editorInput = editors[0].editor;
                    const currentGroup = editors[0].groupId;
                    const editor = await editorService.openEditor(editorInput, currentGroup);
                    editorControl = editor?.getControl();
                }
            }
            else {
                editorControl = editorService.activeEditorPane?.getControl();
            }
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                const activeKernel = editorControl.notebookEditor.activeKernel;
                const language = activeKernel?.supportedLanguages[0] ?? modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
                if (notebookDocument && textModel) {
                    const index = notebookDocument.length;
                    const value = textModel.getValue();
                    if ((0, strings_1.isFalsyOrWhitespace)(value)) {
                        return;
                    }
                    historyService.addToHistory(notebookDocument.uri, '');
                    textModel.setValue('');
                    const collapseState = editorControl.notebookEditor.notebookOptions.getDisplayOptions().interactiveWindowCollapseCodeCells === 'fromEditor' ?
                        {
                            inputCollapsed: false,
                            outputCollapsed: false
                        } :
                        undefined;
                    await bulkEditService.apply([
                        new bulkCellEdits_1.ResourceNotebookCellEdit(notebookDocument.uri, {
                            editType: 1 /* CellEditType.Replace */,
                            index: index,
                            count: 0,
                            cells: [{
                                    cellKind: notebookCommon_1.CellKind.Code,
                                    mime: undefined,
                                    language,
                                    source: value,
                                    outputs: [],
                                    metadata: {},
                                    collapseState
                                }]
                        })
                    ]);
                    // reveal the cell into view first
                    const range = { start: index, end: index + 1 };
                    editorControl.notebookEditor.revealCellRangeInView(range);
                    await editorControl.notebookEditor.executeNotebookCells(editorControl.notebookEditor.getCellsInRange({ start: index, end: index + 1 }));
                    // update the selection and focus in the extension host model
                    const editor = notebookEditorService.getNotebookEditor(editorControl.notebookEditor.getId());
                    if (editor) {
                        editor.setSelections([range]);
                        editor.setFocus(range);
                    }
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.input.clear',
                title: (0, nls_1.localize2)('interactive.input.clear', 'Clear the interactive window input editor contents'),
                category: interactiveWindowCategory,
                f1: false
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                const range = editorControl.codeEditor.getModel()?.getFullModelRange();
                if (notebookDocument && textModel && range) {
                    editorControl.codeEditor.executeEdits('', [editOperation_1.EditOperation.replace(range, null)]);
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.history.previous',
                title: (0, nls_1.localize2)('interactive.history.previous', 'Previous value in history'),
                category: interactiveWindowCategory,
                f1: false,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('bottom'), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('none'), suggest_1.Context.Visible.toNegated()),
                    primary: 16 /* KeyCode.UpArrow */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                if (notebookDocument && textModel) {
                    const previousValue = historyService.getPreviousValue(notebookDocument.uri);
                    if (previousValue) {
                        textModel.setValue(previousValue);
                    }
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.history.next',
                title: (0, nls_1.localize2)('interactive.history.next', 'Next value in history'),
                category: interactiveWindowCategory,
                f1: false,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('top'), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('none'), suggest_1.Context.Visible.toNegated()),
                    primary: 18 /* KeyCode.DownArrow */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                if (notebookDocument && textModel) {
                    const previousValue = historyService.getNextValue(notebookDocument.uri);
                    if (previousValue) {
                        textModel.setValue(previousValue);
                    }
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.scrollToTop',
                title: (0, nls_1.localize)('interactiveScrollToTop', 'Scroll to Top'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                category: interactiveWindowCategory,
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                if (editorControl.notebookEditor.getLength() === 0) {
                    return;
                }
                editorControl.notebookEditor.revealCellRangeInView({ start: 0, end: 1 });
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.scrollToBottom',
                title: (0, nls_1.localize)('interactiveScrollToBottom', 'Scroll to Bottom'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                category: interactiveWindowCategory,
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                if (editorControl.notebookEditor.getLength() === 0) {
                    return;
                }
                const len = editorControl.notebookEditor.getLength();
                editorControl.notebookEditor.revealCellRangeInView({ start: len - 1, end: len });
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.input.focus',
                title: (0, nls_1.localize2)('interactive.input.focus', 'Focus Input Editor'),
                category: interactiveWindowCategory,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: notebookContextKeys_1.InteractiveWindowOpen,
                },
                precondition: notebookContextKeys_1.InteractiveWindowOpen,
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                editorService.activeEditorPane?.focus();
            }
            else {
                // find and open the most recent interactive window
                const openEditors = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
                const interactiveWindow = iterator_1.Iterable.find(openEditors, identifier => { return identifier.editor.typeId === interactiveEditorInput_1.InteractiveEditorInput.ID; });
                if (interactiveWindow) {
                    const editorInput = interactiveWindow.editor;
                    const currentGroup = interactiveWindow.groupId;
                    const editor = await editorService.openEditor(editorInput, currentGroup);
                    const editorControl = editor?.getControl();
                    if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                        editorService.activeEditorPane?.focus();
                    }
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.history.focus',
                title: (0, nls_1.localize2)('interactive.history.focus', 'Focus History'),
                category: interactiveWindowCategory,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'),
                },
                precondition: contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'),
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                editorControl.notebookEditor.focus();
            }
        }
    });
    (0, colorRegistry_1.registerColor)('interactive.activeCodeBorder', {
        dark: (0, colorRegistry_1.ifDefinedThenElse)(peekView_1.peekViewBorder, peekView_1.peekViewBorder, '#007acc'),
        light: (0, colorRegistry_1.ifDefinedThenElse)(peekView_1.peekViewBorder, peekView_1.peekViewBorder, '#007acc'),
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('interactive.activeCodeBorder', 'The border color for the current interactive code cell when the editor has focus.'));
    (0, colorRegistry_1.registerColor)('interactive.inactiveCodeBorder', {
        //dark: theme.getColor(listInactiveSelectionBackground) ?? transparent(listInactiveSelectionBackground, 1),
        dark: (0, colorRegistry_1.ifDefinedThenElse)(colorRegistry_1.listInactiveSelectionBackground, colorRegistry_1.listInactiveSelectionBackground, '#37373D'),
        light: (0, colorRegistry_1.ifDefinedThenElse)(colorRegistry_1.listInactiveSelectionBackground, colorRegistry_1.listInactiveSelectionBackground, '#E4E6F1'),
        hcDark: theme_1.PANEL_BORDER,
        hcLight: theme_1.PANEL_BORDER
    }, (0, nls_1.localize)('interactive.inactiveCodeBorder', 'The border color for the current interactive code cell when the editor does not have focus.'));
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'interactiveWindow',
        order: 100,
        type: 'object',
        'properties': {
            [interactiveCommon_1.InteractiveWindowSetting.interactiveWindowAlwaysScrollOnNewCell]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('interactiveWindow.alwaysScrollOnNewCell', "Automatically scroll the interactive window to show the output of the last statement executed. If this value is false, the window will only scroll if the last cell was already the one scrolled to.")
            }
        }
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'interactiveWindow',
        order: 100,
        type: 'object',
        'properties': {
            [notebookCommon_1.NotebookSetting.InteractiveWindowPromptToSave]: {
                type: 'boolean',
                default: false,
                markdownDescription: (0, nls_1.localize)('interactiveWindow.promptToSaveOnClose', "Prompt to save the interactive window when it is closed. Only new interactive windows will be affected by this setting change.")
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RpdmUuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbnRlcmFjdGl2ZS9icm93c2VyL2ludGVyYWN0aXZlLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE2RGhHLE1BQU0seUJBQXlCLEdBQXFCLElBQUEsZUFBUyxFQUFDLG1CQUFtQixFQUFFLG9CQUFvQixDQUFDLENBQUM7SUFFekcsbUJBQVEsQ0FBQyxFQUFFLENBQXNCLHlCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixDQUMvRSw2QkFBb0IsQ0FBQyxNQUFNLENBQzFCLHFDQUFpQixFQUNqQiw2Q0FBNEIsRUFDNUIsb0JBQW9CLENBQ3BCLEVBQ0Q7UUFDQyxJQUFJLDRCQUFjLENBQUMsK0NBQXNCLENBQUM7S0FDMUMsQ0FDRCxDQUFDO0lBRUssSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBZ0MsU0FBUSxzQkFBVTtpQkFFOUMsT0FBRSxHQUFHLHVDQUF1QyxBQUExQyxDQUEyQztRQUU3RCxZQUNtQixlQUFpQyxFQUMzQixxQkFBNkMsRUFDckQsYUFBNkIsRUFDTCxvQkFBMkM7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFGZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUluRixNQUFNLElBQUksR0FBRyxlQUFlLENBQUMsMEJBQTBCLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFdkUsK0ZBQStGO1lBQy9GLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxhQUFhLEVBQUU7b0JBQzdFLG1CQUFtQixFQUFFLHNCQUFzQjtvQkFDM0MsV0FBVyxFQUFF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