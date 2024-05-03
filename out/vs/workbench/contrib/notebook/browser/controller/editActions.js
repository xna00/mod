/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/mime", "vs/base/common/uri", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/language", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/controller/notebookIndentationActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/workbench/contrib/notebook/browser/notebookIcons"], function (require, exports, mime_1, uri_1, editorContextKeys_1, language_1, getIconClasses_1, model_1, nls_1, actions_1, configuration_1, contextkey_1, contextkeys_1, dialogs_1, instantiation_1, notification_1, quickInput_1, inlineChatController_1, inlineChat_1, cellOperations_1, coreActions_1, notebookIndentationActions_1, notebookBrowser_1, notebookCommon_1, notebookContextKeys_1, notebookExecutionStateService_1, notebookKernelService_1, editorService_1, languageDetectionWorkerService_1, icons) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SELECT_NOTEBOOK_INDENTATION_ID = exports.CLEAR_CELL_OUTPUTS_COMMAND_ID = void 0;
    const CLEAR_ALL_CELLS_OUTPUTS_COMMAND_ID = 'notebook.clearAllCellsOutputs';
    const EDIT_CELL_COMMAND_ID = 'notebook.cell.edit';
    const DELETE_CELL_COMMAND_ID = 'notebook.cell.delete';
    exports.CLEAR_CELL_OUTPUTS_COMMAND_ID = 'notebook.cell.clearOutputs';
    exports.SELECT_NOTEBOOK_INDENTATION_ID = 'notebook.selectIndentation';
    (0, actions_1.registerAction2)(class EditCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: EDIT_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.editCell', "Edit Cell"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), editorContextKeys_1.EditorContextKeys.hoverFocused.toNegated()),
                    primary: 3 /* KeyCode.Enter */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup'), notebookContextKeys_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE.toNegated(), notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    order: 0 /* CellToolbarOrder.EditCell */,
                    group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                },
                icon: icons.editIcon,
            });
        }
        async runWithContext(accessor, context) {
            if (!context.notebookEditor.hasModel() || context.notebookEditor.isReadOnly) {
                return;
            }
            await context.notebookEditor.focusNotebookCell(context.cell, 'editor');
            const foundEditor = context.cell ? (0, coreActions_1.findTargetCellEditor)(context, context.cell) : undefined;
            if (foundEditor && foundEditor.hasTextFocus() && inlineChatController_1.InlineChatController.get(foundEditor)?.getWidgetPosition()?.lineNumber === foundEditor.getPosition()?.lineNumber) {
                inlineChatController_1.InlineChatController.get(foundEditor)?.focus();
            }
        }
    });
    const quitEditCondition = contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext, inlineChat_1.CTX_INLINE_CHAT_FOCUSED.toNegated());
    (0, actions_1.registerAction2)(class QuitEditCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.QUIT_EDIT_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.quitEdit', "Stop Editing Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup'), notebookContextKeys_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    order: 3 /* CellToolbarOrder.SaveCell */,
                    group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                },
                icon: icons.stopEditIcon,
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(quitEditCondition, editorContextKeys_1.EditorContextKeys.hoverVisible.toNegated(), editorContextKeys_1.EditorContextKeys.hasNonEmptySelection.toNegated(), editorContextKeys_1.EditorContextKeys.hasMultipleSelections.toNegated()),
                        primary: 9 /* KeyCode.Escape */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT - 5
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED),
                        primary: 9 /* KeyCode.Escape */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 5
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(quitEditCondition, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                        primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */,
                        win: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */
                        },
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT - 5
                    },
                ]
            });
        }
        async runWithContext(accessor, context) {
            if (context.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                context.cell.updateEditState(notebookBrowser_1.CellEditState.Preview, notebookBrowser_1.QUIT_EDIT_CELL_COMMAND_ID);
            }
            await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
        }
    });
    (0, actions_1.registerAction2)(class DeleteCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: DELETE_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.deleteCell', "Delete Cell"),
                keybinding: {
                    primary: 20 /* KeyCode.Delete */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */
                    },
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellDelete,
                        when: notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE,
                        group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                    },
                    {
                        id: actions_1.MenuId.InteractiveCellDelete,
                        group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                    }
                ],
                icon: icons.deleteCellIcon
            });
        }
        async runWithContext(accessor, context) {
            if (!context.notebookEditor.hasModel()) {
                return;
            }
            let confirmation;
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const runState = notebookExecutionStateService.getCellExecution(context.cell.uri)?.state;
            const configService = accessor.get(configuration_1.IConfigurationService);
            if (runState === notebookCommon_1.NotebookCellExecutionState.Executing && configService.getValue(notebookCommon_1.NotebookSetting.confirmDeleteRunningCell)) {
                const dialogService = accessor.get(dialogs_1.IDialogService);
                const primaryButton = (0, nls_1.localize)('confirmDeleteButton', "Delete");
                confirmation = await dialogService.confirm({
                    type: 'question',
                    message: (0, nls_1.localize)('confirmDeleteButtonMessage', "This cell is running, are you sure you want to delete it?"),
                    primaryButton: primaryButton,
                    checkbox: {
                        label: (0, nls_1.localize)('doNotAskAgain', "Do not ask me again")
                    }
                });
            }
            else {
                confirmation = { confirmed: true };
            }
            if (!confirmation.confirmed) {
                return;
            }
            if (confirmation.checkboxChecked === true) {
                await configService.updateValue(notebookCommon_1.NotebookSetting.confirmDeleteRunningCell, false);
            }
            (0, cellOperations_1.runDeleteAction)(context.notebookEditor, context.cell);
        }
    });
    (0, actions_1.registerAction2)(class ClearCellOutputsAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: exports.CLEAR_CELL_OUTPUTS_COMMAND_ID,
                title: (0, nls_1.localize)('clearCellOutputs', 'Clear Cell Outputs'),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('code'), coreActions_1.executeNotebookCondition, notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE, notebookContextKeys_1.NOTEBOOK_USE_CONSOLIDATED_OUTPUT_BUTTON.toNegated()),
                        order: 5 /* CellToolbarOrder.ClearCellOutput */,
                        group: coreActions_1.CELL_TITLE_OUTPUT_GROUP_ID
                    },
                    {
                        id: actions_1.MenuId.NotebookOutputToolbar,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE)
                    },
                ],
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    primary: 512 /* KeyMod.Alt */ | 20 /* KeyCode.Delete */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                icon: icons.clearIcon
            });
        }
        async runWithContext(accessor, context) {
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const editor = context.notebookEditor;
            if (!editor.hasModel() || !editor.textModel.length) {
                return;
            }
            const cell = context.cell;
            const index = editor.textModel.cells.indexOf(cell.model);
            if (index < 0) {
                return;
            }
            const computeUndoRedo = !editor.isReadOnly;
            editor.textModel.applyEdits([{ editType: 2 /* CellEditType.Output */, index, outputs: [] }], true, undefined, () => undefined, undefined, computeUndoRedo);
            const runState = notebookExecutionStateService.getCellExecution(context.cell.uri)?.state;
            if (runState !== notebookCommon_1.NotebookCellExecutionState.Executing) {
                context.notebookEditor.textModel.applyEdits([{
                        editType: 9 /* CellEditType.PartialInternalMetadata */, index, internalMetadata: {
                            runStartTime: null,
                            runStartTimeAdjustment: null,
                            runEndTime: null,
                            executionOrder: null,
                            lastRunSuccess: null
                        }
                    }], true, undefined, () => undefined, undefined, computeUndoRedo);
            }
        }
    });
    (0, actions_1.registerAction2)(class ClearAllCellOutputsAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: CLEAR_ALL_CELLS_OUTPUTS_COMMAND_ID,
                title: (0, nls_1.localize)('clearAllCellsOutputs', 'Clear All Outputs'),
                precondition: notebookContextKeys_1.NOTEBOOK_HAS_OUTPUTS,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true)),
                        group: 'navigation',
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        when: contextkey_1.ContextKeyExpr.and(coreActions_1.executeNotebookCondition, contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)),
                        group: 'navigation/execute',
                        order: 10
                    }
                ],
                icon: icons.clearIcon
            });
        }
        async runWithContext(accessor, context) {
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const editor = context.notebookEditor;
            if (!editor.hasModel() || !editor.textModel.length) {
                return;
            }
            const computeUndoRedo = !editor.isReadOnly;
            editor.textModel.applyEdits(editor.textModel.cells.map((cell, index) => ({
                editType: 2 /* CellEditType.Output */, index, outputs: []
            })), true, undefined, () => undefined, undefined, computeUndoRedo);
            const clearExecutionMetadataEdits = editor.textModel.cells.map((cell, index) => {
                const runState = notebookExecutionStateService.getCellExecution(cell.uri)?.state;
                if (runState !== notebookCommon_1.NotebookCellExecutionState.Executing) {
                    return {
                        editType: 9 /* CellEditType.PartialInternalMetadata */, index, internalMetadata: {
                            runStartTime: null,
                            runStartTimeAdjustment: null,
                            runEndTime: null,
                            executionOrder: null,
                            lastRunSuccess: null
                        }
                    };
                }
                else {
                    return undefined;
                }
            }).filter(edit => !!edit);
            if (clearExecutionMetadataEdits.length) {
                context.notebookEditor.textModel.applyEdits(clearExecutionMetadataEdits, true, undefined, () => undefined, undefined, computeUndoRedo);
            }
        }
    });
    (0, actions_1.registerAction2)(class ChangeCellLanguageAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.CHANGE_CELL_LANGUAGE,
                title: (0, nls_1.localize)('changeLanguage', 'Change Cell Language'),
                metadata: {
                    description: (0, nls_1.localize)('changeLanguage', 'Change Cell Language'),
                    args: [
                        {
                            name: 'range',
                            description: 'The cell range',
                            schema: {
                                'type': 'object',
                                'required': ['start', 'end'],
                                'properties': {
                                    'start': {
                                        'type': 'number'
                                    },
                                    'end': {
                                        'type': 'number'
                                    }
                                }
                            }
                        },
                        {
                            name: 'language',
                            description: 'The target cell language',
                            schema: {
                                'type': 'string'
                            }
                        }
                    ]
                }
            });
        }
        getCellContextFromArgs(accessor, context, ...additionalArgs) {
            if (!context || typeof context.start !== 'number' || typeof context.end !== 'number' || context.start >= context.end) {
                return;
            }
            const language = additionalArgs.length && typeof additionalArgs[0] === 'string' ? additionalArgs[0] : undefined;
            const activeEditorContext = this.getEditorContextFromArgsOrActive(accessor);
            if (!activeEditorContext || !activeEditorContext.notebookEditor.hasModel() || context.start >= activeEditorContext.notebookEditor.getLength()) {
                return;
            }
            // TODO@rebornix, support multiple cells
            return {
                notebookEditor: activeEditorContext.notebookEditor,
                cell: activeEditorContext.notebookEditor.cellAt(context.start),
                language
            };
        }
        async runWithContext(accessor, context) {
            if (context.language) {
                await this.setLanguage(context, context.language);
            }
            else {
                await this.showLanguagePicker(accessor, context);
            }
        }
        async showLanguagePicker(accessor, context) {
            const topItems = [];
            const mainItems = [];
            const languageService = accessor.get(language_1.ILanguageService);
            const modelService = accessor.get(model_1.IModelService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const languageDetectionService = accessor.get(languageDetectionWorkerService_1.ILanguageDetectionService);
            const kernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            let languages = context.notebookEditor.activeKernel?.supportedLanguages;
            if (!languages) {
                const matchResult = kernelService.getMatchingKernel(context.notebookEditor.textModel);
                const allSupportedLanguages = matchResult.all.flatMap(kernel => kernel.supportedLanguages);
                languages = allSupportedLanguages.length > 0 ? allSupportedLanguages : languageService.getRegisteredLanguageIds();
            }
            const providerLanguages = new Set([
                ...languages,
                'markdown'
            ]);
            providerLanguages.forEach(languageId => {
                let description;
                if (context.cell.cellKind === notebookCommon_1.CellKind.Markup ? (languageId === 'markdown') : (languageId === context.cell.language)) {
                    description = (0, nls_1.localize)('languageDescription', "({0}) - Current Language", languageId);
                }
                else {
                    description = (0, nls_1.localize)('languageDescriptionConfigured', "({0})", languageId);
                }
                const languageName = languageService.getLanguageName(languageId);
                if (!languageName) {
                    // Notebook has unrecognized language
                    return;
                }
                const item = {
                    label: languageName,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, this.getFakeResource(languageName, languageService)),
                    description,
                    languageId
                };
                if (languageId === 'markdown' || languageId === context.cell.language) {
                    topItems.push(item);
                }
                else {
                    mainItems.push(item);
                }
            });
            mainItems.sort((a, b) => {
                return a.description.localeCompare(b.description);
            });
            // Offer to "Auto Detect"
            const autoDetectMode = {
                label: (0, nls_1.localize)('autoDetect', "Auto Detect")
            };
            const picks = [
                autoDetectMode,
                { type: 'separator', label: (0, nls_1.localize)('languagesPicks', "languages (identifier)") },
                ...topItems,
                { type: 'separator' },
                ...mainItems
            ];
            const selection = await quickInputService.pick(picks, { placeHolder: (0, nls_1.localize)('pickLanguageToConfigure', "Select Language Mode") });
            const languageId = selection === autoDetectMode
                ? await languageDetectionService.detectLanguage(context.cell.uri)
                : selection?.languageId;
            if (languageId) {
                await this.setLanguage(context, languageId);
            }
        }
        async setLanguage(context, languageId) {
            await setCellToLanguage(languageId, context);
        }
        /**
         * Copied from editorStatus.ts
         */
        getFakeResource(lang, languageService) {
            let fakeResource;
            const languageId = languageService.getLanguageIdByLanguageName(lang);
            if (languageId) {
                const extensions = languageService.getExtensions(languageId);
                if (extensions.length) {
                    fakeResource = uri_1.URI.file(extensions[0]);
                }
                else {
                    const filenames = languageService.getFilenames(languageId);
                    if (filenames.length) {
                        fakeResource = uri_1.URI.file(filenames[0]);
                    }
                }
            }
            return fakeResource;
        }
    });
    (0, actions_1.registerAction2)(class DetectCellLanguageAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.DETECT_CELL_LANGUAGE,
                title: (0, nls_1.localize2)('detectLanguage', "Accept Detected Language for Cell"),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                keybinding: { primary: 34 /* KeyCode.KeyD */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */, weight: 200 /* KeybindingWeight.WorkbenchContrib */ }
            });
        }
        async runWithContext(accessor, context) {
            const languageDetectionService = accessor.get(languageDetectionWorkerService_1.ILanguageDetectionService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const kernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            const kernel = kernelService.getSelectedOrSuggestedKernel(context.notebookEditor.textModel);
            const providerLanguages = [...kernel?.supportedLanguages ?? []];
            providerLanguages.push('markdown');
            const detection = await languageDetectionService.detectLanguage(context.cell.uri, providerLanguages);
            if (detection) {
                setCellToLanguage(detection, context);
            }
            else {
                notificationService.warn((0, nls_1.localize)('noDetection', "Unable to detect cell language"));
            }
        }
    });
    async function setCellToLanguage(languageId, context) {
        if (languageId === 'markdown' && context.cell?.language !== 'markdown') {
            const idx = context.notebookEditor.getCellIndex(context.cell);
            await (0, cellOperations_1.changeCellToKind)(notebookCommon_1.CellKind.Markup, { cell: context.cell, notebookEditor: context.notebookEditor, ui: true }, 'markdown', mime_1.Mimes.markdown);
            const newCell = context.notebookEditor.cellAt(idx);
            if (newCell) {
                await context.notebookEditor.focusNotebookCell(newCell, 'editor');
            }
        }
        else if (languageId !== 'markdown' && context.cell?.cellKind === notebookCommon_1.CellKind.Markup) {
            await (0, cellOperations_1.changeCellToKind)(notebookCommon_1.CellKind.Code, { cell: context.cell, notebookEditor: context.notebookEditor, ui: true }, languageId);
        }
        else {
            const index = context.notebookEditor.textModel.cells.indexOf(context.cell.model);
            context.notebookEditor.textModel.applyEdits([{ editType: 4 /* CellEditType.CellLanguage */, index, language: languageId }], true, undefined, () => undefined, undefined, !context.notebookEditor.isReadOnly);
        }
    }
    (0, actions_1.registerAction2)(class SelectNotebookIndentation extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: exports.SELECT_NOTEBOOK_INDENTATION_ID,
                title: (0, nls_1.localize2)('selectNotebookIndentation', 'Select Indentation'),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
            });
        }
        async runWithContext(accessor, context) {
            await this.showNotebookIndentationPicker(accessor, context);
        }
        async showNotebookIndentationPicker(accessor, context) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const activeNotebook = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!activeNotebook || activeNotebook.isDisposed) {
                return quickInputService.pick([{ label: (0, nls_1.localize)('noNotebookEditor', "No notebook editor active at this time") }]);
            }
            if (activeNotebook.isReadOnly) {
                return quickInputService.pick([{ label: (0, nls_1.localize)('noWritableCodeEditor', "The active notebook editor is read-only.") }]);
            }
            const picks = [
                new notebookIndentationActions_1.NotebookIndentUsingTabs(), // indent using tabs
                new notebookIndentationActions_1.NotebookIndentUsingSpaces(), // indent using spaces
                new notebookIndentationActions_1.NotebookChangeTabDisplaySize(), // change tab size
                new notebookIndentationActions_1.NotebookIndentationToTabsAction(), // convert indentation to tabs
                new notebookIndentationActions_1.NotebookIndentationToSpacesAction() // convert indentation to spaces
            ].map(item => {
                return {
                    id: item.desc.id,
                    label: item.desc.title.toString(),
                    run: () => {
                        instantiationService.invokeFunction(item.run);
                    }
                };
            });
            picks.splice(3, 0, { type: 'separator', label: (0, nls_1.localize)('indentConvert', "convert file") });
            picks.unshift({ type: 'separator', label: (0, nls_1.localize)('indentView', "change view") });
            const action = await quickInputService.pick(picks, { placeHolder: (0, nls_1.localize)('pickAction', "Select Action"), matchOnDetail: true });
            if (!action) {
                return;
            }
            action.run();
            context.notebookEditor.focus();
            return;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJvbGxlci9lZGl0QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQ2hHLE1BQU0sa0NBQWtDLEdBQUcsK0JBQStCLENBQUM7SUFDM0UsTUFBTSxvQkFBb0IsR0FBRyxvQkFBb0IsQ0FBQztJQUNsRCxNQUFNLHNCQUFzQixHQUFHLHNCQUFzQixDQUFDO0lBQ3pDLFFBQUEsNkJBQTZCLEdBQUcsNEJBQTRCLENBQUM7SUFDN0QsUUFBQSw4QkFBOEIsR0FBRyw0QkFBNEIsQ0FBQztJQUUzRSxJQUFBLHlCQUFlLEVBQUMsTUFBTSxjQUFlLFNBQVEsZ0NBQWtCO1FBQzlEO1lBQ0MsS0FBSyxDQUNKO2dCQUNDLEVBQUUsRUFBRSxvQkFBb0I7Z0JBQ3hCLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSxXQUFXLENBQUM7Z0JBQ3hELFVBQVUsRUFBRTtvQkFDWCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQ3ZCLGdEQUEwQixFQUMxQiwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvQ0FBc0IsQ0FBQyxFQUMxQyw4Q0FBd0IsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQ3hDLHFDQUFpQixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FDMUM7b0JBQ0QsT0FBTyx1QkFBZTtvQkFDdEIsTUFBTSw2Q0FBbUM7aUJBQ3pDO2dCQUNELElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxpQkFBaUI7b0JBQzVCLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FDdkIsOENBQXdCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUN4Qyx3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