/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/platform/window/common/window", "vs/workbench/services/host/browser/host", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/files/common/files", "vs/platform/clipboard/common/clipboardService", "vs/base/common/errorMessage", "vs/platform/list/browser/listService", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/editor/common/services/resolverService", "vs/workbench/contrib/files/browser/files", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/network", "vs/platform/notification/common/notification", "vs/editor/common/editorContextKeys", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/label/common/label", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/base/common/arrays", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/workbench/services/textfile/common/textfiles", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/errors", "vs/base/common/actions", "vs/platform/editor/common/editor", "vs/base/common/hash", "vs/platform/configuration/common/configuration", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/views/common/viewsService", "./fileConstants", "vs/platform/dialogs/common/dialogs", "vs/workbench/browser/actions/workspaceActions", "vs/workbench/contrib/files/browser/views/openEditorsView"], function (require, exports, nls, editor_1, sideBySideEditorInput_1, window_1, host_1, instantiation_1, workspace_1, files_1, clipboardService_1, errorMessage_1, listService_1, commands_1, contextkey_1, files_2, keybindingsRegistry_1, keyCodes_1, platform_1, resolverService_1, files_3, workspaceEditing_1, editorCommands_1, network_1, notification_1, editorContextKeys_1, editorService_1, editorGroupsService_1, label_1, resources_1, lifecycle_1, environment_1, arrays_1, codeEditorService_1, embeddedCodeEditorWidget_1, textfiles_1, uriIdentity_1, errors_1, actions_1, editor_2, hash_1, configuration_1, panecomposite_1, viewsService_1, fileConstants_1, dialogs_1, workspaceActions_1, openEditorsView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.newWindowCommand = exports.openWindowCommand = void 0;
    const openWindowCommand = (accessor, toOpen, options) => {
        if (Array.isArray(toOpen)) {
            const hostService = accessor.get(host_1.IHostService);
            const environmentService = accessor.get(environment_1.IEnvironmentService);
            // rewrite untitled: workspace URIs to the absolute path on disk
            toOpen = toOpen.map(openable => {
                if ((0, window_1.isWorkspaceToOpen)(openable) && openable.workspaceUri.scheme === network_1.Schemas.untitled) {
                    return {
                        workspaceUri: (0, resources_1.joinPath)(environmentService.untitledWorkspacesHome, openable.workspaceUri.path, workspace_1.UNTITLED_WORKSPACE_NAME)
                    };
                }
                return openable;
            });
            hostService.openWindow(toOpen, options);
        }
    };
    exports.openWindowCommand = openWindowCommand;
    const newWindowCommand = (accessor, options) => {
        const hostService = accessor.get(host_1.IHostService);
        hostService.openWindow(options);
    };
    exports.newWindowCommand = newWindowCommand;
    // Command registration
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: files_1.ExplorerFocusCondition,
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        mac: {
            primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */
        },
        id: fileConstants_1.OPEN_TO_SIDE_COMMAND_ID, handler: async (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const listService = accessor.get(listService_1.IListService);
            const fileService = accessor.get(files_2.IFileService);
            const explorerService = accessor.get(files_3.IExplorerService);
            const resources = (0, files_3.getMultiSelectedResources)(resource, listService, editorService, explorerService);
            // Set side input
            if (resources.length) {
                const untitledResources = resources.filter(resource => resource.scheme === network_1.Schemas.untitled);
                const fileResources = resources.filter(resource => resource.scheme !== network_1.Schemas.untitled);
                const items = await Promise.all(fileResources.map(async (resource) => {
                    const item = explorerService.findClosest(resource);
                    if (item) {
                        // Explorer already resolved the item, no need to go to the file service #109780
                        return item;
                    }
                    return await fileService.stat(resource);
                }));
                const files = items.filter(i => !i.isDirectory);
                const editors = files.map(f => ({
                    resource: f.resource,
                    options: { pinned: true }
                })).concat(...untitledResources.map(untitledResource => ({ resource: untitledResource, options: { pinned: true } })));
                await editorService.openEditors(editors, editorService_1.SIDE_GROUP);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerFolderContext.toNegated()),
        primary: 3 /* KeyCode.Enter */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */
        },
        id: 'explorer.openAndPassFocus', handler: async (accessor, _resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const explorerService = accessor.get(files_3.IExplorerService);
            const resources = explorerService.getContext(true);
            if (resources.length) {
                await editorService.openEditors(resources.map(r => ({ resource: r.resource, options: { preserveFocus: false, pinned: true } })));
            }
        }
    });
    const COMPARE_WITH_SAVED_SCHEMA = 'showModifications';
    let providerDisposables = [];
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: fileConstants_1.COMPARE_WITH_SAVED_COMMAND_ID,
        when: undefined,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 34 /* KeyCode.KeyD */),
        handler: async (accessor, resource) => {
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_2.IFileService);
            // Register provider at first as needed
            let registerEditorListener = false;
            if (providerDisposables.length === 0) {
                registerEditorListener = true;
                const provider = instantiationService.createInstance(files_1.TextFileContentProvider);
                providerDisposables.push(provider);
                providerDisposables.push(textModelService.registerTextModelContentProvider(COMPARE_WITH_SAVED_SCHEMA, provider));
            }
            // Open editor (only resources that can be handled by file service are supported)
            const uri = (0, files_3.getResourceForCommand)(resource, accessor.get(listService_1.IListService), editorService);
            if (uri && fileService.hasProvider(uri)) {
                const name = (0, resources_1.basename)(uri);
                const editorLabel = nls.localize('modifiedLabel', "{0} (in file) ↔ {1}", name, name);
                try {
                    await files_1.TextFileContentProvider.open(uri, COMPARE_WITH_SAVED_SCHEMA, editorLabel, editorService, { pinned: true });
                    // Dispose once no more diff editor is opened with the scheme
                    if (registerEditorListener) {
                        providerDisposables.push(editorService.onDidVisibleEditorsChange(() => {
                            if (!editorService.editors.some(editor => !!editor_1.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY, filterByScheme: COMPARE_WITH_SAVED_SCHEMA }))) {
                                providerDisposables = (0, lifecycle_1.dispose)(providerDisposables);
                            }
                        }));
                    }
                }
                catch {
                    providerDisposables = (0, lifecycle_1.dispose)(providerDisposables);
                }
            }
        }
    });
    let globalResourceToCompare;
    let resourceSelectedForCompareContext;
    commands_1.CommandsRegistry.registerCommand({
        id: fileConstants_1.SELECT_FOR_COMPARE_COMMAND_ID,
        handler: (accessor, resource) => {
            const listService = accessor.get(listService_1.IListService);
            globalResourceToCompare = (0, files_3.getResourceForCommand)(resource, listService, accessor.get(editorService_1.IEditorService));
            if (!resourceSelectedForCompareContext) {
                resourceSelectedForCompareContext = fileConstants_1.ResourceSelectedForCompareContext.bindTo(accessor.get(contextkey_1.IContextKeyService));
            }
            resourceSelectedForCompareContext.set(true);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: fileConstants_1.COMPARE_SELECTED_COMMAND_ID,
        handler: async (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const explorerService = accessor.get(files_3.IExplorerService);
            const resources = (0, files_3.getMultiSelectedResources)(resource, accessor.get(listService_1.IListService), editorService, explorerService);
            if (resources.length === 2) {
                return editorService.openEditor({
                    original: { resource: resources[0] },
                    modified: { resource: resources[1] },
                    options: { pinned: true }
                });
            }
            return true;
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: fileConstants_1.COMPARE_RESOURCE_COMMAND_ID,
        handler: (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const listService = accessor.get(listService_1.IListService);
            const rightResource = (0, files_3.getResourceForCommand)(resource, listService, editorService);
            if (globalResourceToCompare && rightResource) {
                editorService.openEditor({
                    original: { resource: globalResourceToCompare },
                    modified: { resource: rightResource },
                    options: { pinned: true }
                });
            }
        }
    });
    async function resourcesToClipboard(resources, relative, clipboardService, labelService, configurationService) {
        if (resources.length) {
            const lineDelimiter = platform_1.isWindows ? '\r\n' : '\n';
            let separator = undefined;
            if (relative) {
                const relativeSeparator = configurationService.getValue('explorer.copyRelativePathSeparator');
                if (relativeSeparator === '/' || relativeSeparator === '\\') {
                    separator = relativeSeparator;
                }
            }
            const text = resources.map(resource => labelService.getUriLabel(resource, { relative, noPrefix: true, separator })).join(lineDelimiter);
            await clipboardService.writeText(text);
        }
    }
    const copyPathCommandHandler = async (accessor, resource) => {
        const resources = (0, files_3.getMultiSelectedResources)(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService), accessor.get(files_3.IExplorerService));
        await resourcesToClipboard(resources, false, accessor.get(clipboardService_1.IClipboardService), accessor.get(label_1.ILabelService), accessor.get(configuration_1.IConfigurationService));
    };
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: editorContextKeys_1.EditorContextKeys.focus.toNegated(),
        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */,
        win: {
            primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */
        },
        id: fileConstants_1.COPY_PATH_COMMAND_ID,
        handler: copyPathCommandHandler
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: editorContextKeys_1.EditorContextKeys.focus,
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */),
        win: {
            primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */
        },
        id: fileConstants_1.COPY_PATH_COMMAND_ID,
        handler: copyPathCommandHandler
    });
    const copyRelativePathCommandHandler = async (accessor, resource) => {
        const resources = (0, files_3.getMultiSelectedResources)(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService), accessor.get(files_3.IExplorerService));
        await resourcesToClipboard(resources, true, accessor.get(clipboardService_1.IClipboardService), accessor.get(label_1.ILabelService), accessor.get(configuration_1.IConfigurationService));
    };
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: editorContextKeys_1.EditorContextKeys.focus.toNegated(),
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */,
        win: {
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */)
        },
        id: fileConstants_1.COPY_RELATIVE_PATH_COMMAND_ID,
        handler: copyRelativePathCommandHandler
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: editorContextKeys_1.EditorContextKeys.focus,
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */),
        win: {
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */)
        },
        id: fileConstants_1.COPY_RELATIVE_PATH_COMMAND_ID,
        handler: copyRelativePathCommandHandler
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: undefined,
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 46 /* KeyCode.KeyP */),
        id: 'workbench.action.files.copyPathOfActiveFile',
        handler: async (accessor) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeInput = editorService.activeEditor;
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(activeInput, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            const resources = resource ? [resource] : [];
            await resourcesToClipboard(resources, false, accessor.get(clipboardService_1.IClipboardService), accessor.get(label_1.ILabelService), accessor.get(configuration_1.IConfigurationService));
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: fileConstants_1.REVEAL_IN_EXPLORER_COMMAND_ID,
        handler: async (accessor, resource) => {
            const viewService = accessor.get(viewsService_1.IViewsService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const explorerService = accessor.get(files_3.IExplorerService);
            const uri = (0, files_3.getResourceForCommand)(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService));
            if (uri && contextService.isInsideWorkspace(uri)) {
                const explorerView = await viewService.openView(files_1.VIEW_ID, false);
                if (explorerView) {
                    const oldAutoReveal = explorerView.autoReveal;
                    // Disable autoreveal before revealing the explorer to prevent a race betwene auto reveal + selection
                    // Fixes #197268
                    explorerView.autoReveal = false;
                    explorerView.setExpanded(true);
                    await explorerService.select(uri, 'force');
                    explorerView.focus();
                    explorerView.autoReveal = oldAutoReveal;
                }
            }
            else {
                const openEditorsView = await viewService.openView(openEditorsView_1.OpenEditorsView.ID, false);
                if (openEditorsView) {
                    openEditorsView.setExpanded(true);
                    openEditorsView.focus();
                }
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: fileConstants_1.OPEN_WITH_EXPLORER_COMMAND_ID,
        handler: async (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const uri = (0, files_3.getResourceForCommand)(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService));
            if (uri) {
                return editorService.openEditor({ resource: uri, options: { override: editor_2.EditorResolution.PICK, source: editor_2.EditorOpenSource.USER } });
            }
            return undefined;
        }
    });
    // Save / Save As / Save All / Revert
    async function saveSelectedEditors(accessor, options) {
        const listService = accessor.get(listService_1.IListService);
        const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        // Retrieve selected or active editor
        let editors = (0, files_3.getOpenEditorsViewMultiSelection)(listService, editorGroupService);
        if (!editors) {
            const activeGroup = editorGroupService.activeGroup;
            if (activeGroup.activeEditor) {
                editors = [];
                // Special treatment for side by side editors: if the active editor
                // has 2 sides, we consider both, to support saving both sides.
                // We only allow this when saving, not for "Save As" and not if any
                // editor is untitled which would bring up a "Save As" dialog too.
                // In addition, we require the secondary side to be modified to not
                // trigger a touch operation unexpectedly.
                //
                // See also https://github.com/microsoft/vscode/issues/4180
                // See also https://github.com/microsoft/vscode/issues/106330
                // See also https://github.com/microsoft/vscode/issues/190210
                if (activeGroup.activeEditor instanceof sideBySideEditorInput_1.SideBySideEditorInput &&
                    !options?.saveAs && !(activeGroup.activeEditor.primary.hasCapability(4 /* EditorInputCapabilities.Untitled */) || activeGroup.activeEditor.secondary.hasCapability(4 /* EditorInputCapabilities.Untitled */)) &&
                    activeGroup.activeEditor.secondary.isModified()) {
                    editors.push({ groupId: activeGroup.id, editor: activeGroup.activeEditor.primary });
                    editors.push({ groupId: activeGroup.id, editor: activeGroup.activeEditor.secondary });
                }
                else {
                    editors.push({ groupId: activeGroup.id, editor: activeGroup.activeEditor });
                }
            }
        }
        if (!editors || editors.length === 0) {
            return; // nothing to save
        }
        // Save editors
        await doSaveEditors(accessor, editors, options);
        // Special treatment for embedded editors: if we detect that focus is
        // inside an embedded code editor, we save that model as well if we
        // find it in our text file models. Currently, only textual editors
        // support embedded editors.
        const focusedCodeEditor = codeEditorService.getFocusedCodeEditor();
        if (focusedCodeEditor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget && !focusedCodeEditor.isSimpleWidget) {
            const resource = focusedCodeEditor.getModel()?.uri;
            // Check that the resource of the model was not saved already
            if (resource && !editors.some(({ editor }) => (0, resources_1.isEqual)(editor_1.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }), resource))) {
                const model = textFileService.files.get(resource);
                if (!model?.isReadonly()) {
                    await textFileService.save(resource, options);
                }
            }
        }
    }
    function saveDirtyEditorsOfGroups(accessor, groups, options) {
        const dirtyEditors = [];
        for (const group of groups) {
            for (const editor of group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)) {
                if (editor.isDirty()) {
                    dirtyEditors.push({ groupId: group.id, editor });
                }
            }
        }
        return doSaveEditors(accessor, dirtyEditors, options);
    }
    async function doSaveEditors(accessor, editors, options) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const notificationService = accessor.get(notification_1.INotificationService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        try {
            await editorService.save(editors, options);
        }
        catch (error) {
            if (!(0, errors_1.isCancellationError)(error)) {
                notificationService.notify({
                    id: editors.map(({ editor }) => (0, hash_1.hash)(editor.resource?.toString())).join(), // ensure unique notification ID per set of editor
                    severity: notification_1.Severity.Error,
                    message: nls.localize({ key: 'genericSaveError', comment: ['{0} is the resource that failed to save and {1} the error message'] }, "Failed to save '{0}': {1}", editors.map(({ editor }) => editor.getName()).join(', '), (0, errorMessage_1.toErrorMessage)(error, false)),
                    actions: {
                        primary: [
                            (0, actions_1.toAction)({ id: 'workbench.action.files.saveEditors', label: nls.localize('retry', "Retry"), run: () => instantiationService.invokeFunction(accessor => doSaveEditors(accessor, editors, options)) }),
                            (0, actions_1.toAction)({ id: 'workbench.action.files.revertEditors', label: nls.localize('discard', "Discard"), run: () => editorService.revert(editors) })
                        ]
                    }
                });
            }
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        when: undefined,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 49 /* KeyCode.KeyS */,
        id: fileConstants_1.SAVE_FILE_COMMAND_ID,
        handler: accessor => {
            return saveSelectedEditors(accessor, { reason: 1 /* SaveReason.EXPLICIT */, force: true /* force save even when non-dirty */ });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        when: undefined,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 49 /* KeyCode.KeyS */),
        win: { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 49 /* KeyCode.KeyS */) },
        id: fileConstants_1.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID,
        handler: accessor => {
            return saveSelectedEditors(accessor, { reason: 1 /* SaveReason.EXPLICIT */, force: true /* force save even when non-dirty */, skipSaveParticipants: true });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: fileConstants_1.SAVE_FILE_AS_COMMAND_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: undefined,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 49 /* KeyCode.KeyS */,
        handler: accessor => {
            return saveSelectedEditors(accessor, { reason: 1 /* SaveReason.EXPLICIT */, saveAs: true });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        when: undefined,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: undefined,
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 49 /* KeyCode.KeyS */ },
        win: { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 49 /* KeyCode.KeyS */) },
        id: fileConstants_1.SAVE_ALL_COMMAND_ID,
        handler: accessor => {
            return saveDirtyEditorsOfGroups(accessor, accessor.get(editorGroupsService_1.IEditorGroupsService).getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */), { reason: 1 /* SaveReason.EXPLICIT */ });
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: fileConstants_1.SAVE_ALL_IN_GROUP_COMMAND_ID,
        handler: (accessor, _, editorContext) => {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const contexts = (0, editorCommands_1.getMultiSelectedEditorContexts)(editorContext, accessor.get(listService_1.IListService), accessor.get(editorGroupsService_1.IEditorGroupsService));
            let groups = undefined;
            if (!contexts.length) {
                groups = editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            }
            else {
                groups = (0, arrays_1.coalesce)(contexts.map(context => editorGroupService.getGroup(context.groupId)));
            }
            return saveDirtyEditorsOfGroups(accessor, groups, { reason: 1 /* SaveReason.EXPLICIT */ });
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: fileConstants_1.SAVE_FILES_COMMAND_ID,
        handler: async (accessor) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const res = await editorService.saveAll({ includeUntitled: false, reason: 1 /* SaveReason.EXPLICIT */ });
            return res.success;
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: fileConstants_1.REVERT_FILE_COMMAND_ID,
        handler: async (accessor) => {
            const notificationService = accessor.get(notification_1.INotificationService);
            const listService = accessor.get(listService_1.IListService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const editorService = accessor.get(editorService_1.IEditorService);
            // Retrieve selected or active editor
            let editors = (0, files_3.getOpenEditorsViewMultiSelection)(listService, editorGroupService);
            if (!editors) {
                const activeGroup = editorGroupService.activeGroup;
                if (activeGroup.activeEditor) {
                    editors = [{ groupId: activeGroup.id, editor: activeGroup.activeEditor }];
                }
            }
            if (!editors || editors.length === 0) {
                return; // nothing to revert
            }
            try {
                await editorService.revert(editors.filter(({ editor }) => !editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) /* all except untitled */), { force: true });
            }
            catch (error) {
                notificationService.error(nls.localize('genericRevertError', "Failed to revert '{0}': {1}", editors.map(({ editor }) => editor.getName()).join(', '), (0, errorMessage_1.toErrorMessage)(error, false)));
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: fileConstants_1.REMOVE_ROOT_FOLDER_COMMAND_ID,
        handler: (accessor, resource) => {
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            const workspace = contextService.getWorkspace();
            const resources = (0, files_3.getMultiSelectedResources)(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService), accessor.get(files_3.IExplorerService)).filter(resource => workspace.folders.some(folder => uriIdentityService.extUri.isEqual(folder.uri, resource)) // Need to verify resources are workspaces since multi selection can trigger this command on some non workspace resources
            );
            if (resources.length === 0) {
                const commandService = accessor.get(commands_1.ICommandService);
                // Show a picker for the user to choose which folder to remove
                return commandService.executeCommand(workspaceActions_1.RemoveRootFolderAction.ID);
            }
            return workspaceEditingService.removeFolders(resources);
        }
    });
    // Compressed item navigation
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerCompressedFocusContext, files_1.ExplorerCompressedFirstFocusContext.negate()),
        primary: 15 /* KeyCode.LeftArrow */,
        id: fileConstants_1.PREVIOUS_COMPRESSED_FOLDER,
        handler: accessor => {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (viewlet?.getId() !== files_1.VIEWLET_ID) {
                return;
            }
            const explorer = viewlet.getViewPaneContainer();
            const view = explorer.getExplorerView();
            view.previousCompressedStat();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerCompressedFocusContext, files_1.ExplorerCompressedLastFocusContext.negate()),
        primary: 17 /* KeyCode.RightArrow */,
        id: fileConstants_1.NEXT_COMPRESSED_FOLDER,
        handler: accessor => {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (viewlet?.getId() !== files_1.VIEWLET_ID) {
                return;
            }
            const explorer = viewlet.getViewPaneContainer();
            const view = explorer.getExplorerView();
            view.nextCompressedStat();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerCompressedFocusContext, files_1.ExplorerCompressedFirstFocusContext.negate()),
        primary: 14 /* KeyCode.Home */,
        id: fileConstants_1.FIRST_COMPRESSED_FOLDER,
        handler: accessor => {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (viewlet?.getId() !== files_1.VIEWLET_ID) {
                return;
            }
            const explorer = viewlet.getViewPaneContainer();
            const view = explorer.getExplorerView();
            view.firstCompressedStat();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerCompressedFocusContext, files_1.ExplorerCompressedLastFocusContext.negate()),
        primary: 13 /* KeyCode.End */,
        id: fileConstants_1.LAST_COMPRESSED_FOLDER,
        handler: accessor => {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (viewlet?.getId() !== files_1.VIEWLET_ID) {
                return;
            }
            const explorer = viewlet.getViewPaneContainer();
            const view = explorer.getExplorerView();
            view.lastCompressedStat();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: null,
        primary: platform_1.isWeb ? (platform_1.isWindows ? (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 44 /* KeyCode.KeyN */) : 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 44 /* KeyCode.KeyN */) : 2048 /* KeyMod.CtrlCmd */ | 44 /* KeyCode.KeyN */,
        secondary: platform_1.isWeb ? [2048 /* KeyMod.CtrlCmd */ | 44 /* KeyCode.KeyN */] : undefined,
        id: fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID,
        metadata: {
            description: fileConstants_1.NEW_UNTITLED_FILE_LABEL,
            args: [
                {
                    isOptional: true,
                    name: 'New Untitled Text File arguments',
                    description: 'The editor view type or language ID if known',
                    schema: {
                        'type': 'object',
                        'properties': {
                            'viewType': {
                                'type': 'string'
                            },
                            'languageId': {
                                'type': 'string'
                            }
                        }
                    }
                }
            ]
        },
        handler: async (accessor, args) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            await editorService.openEditor({
                resource: undefined,
                options: {
                    override: args?.viewType,
                    pinned: true
                },
                languageId: args?.languageId,
            });
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: fileConstants_1.NEW_FILE_COMMAND_ID,
        handler: async (accessor, args) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const dialogService = accessor.get(dialogs_1.IFileDialogService);
            const fileService = accessor.get(files_2.IFileService);
            const createFileLocalized = nls.localize('newFileCommand.saveLabel', "Create File");
            const defaultFileUri = (0, resources_1.joinPath)(await dialogService.defaultFilePath(), args?.fileName ?? 'Untitled.txt');
            const saveUri = await dialogService.showSaveDialog({ saveLabel: createFileLocalized, title: createFileLocalized, defaultUri: defaultFileUri });
            if (!saveUri) {
                return;
            }
            await fileService.createFile(saveUri, undefined, { overwrite: true });
            await editorService.openEditor({
                resource: saveUri,
                options: {
                    override: args?.viewType,
                    pinned: true
                },
                languageId: args?.languageId,
            });
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL2ZpbGVDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxRHpGLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQXlCLEVBQUUsT0FBNEIsRUFBRSxFQUFFO1FBQ3hILElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQzNCLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUJBQVksQ0FBQyxDQUFDO1lBQy9DLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQ0FBbUIsQ0FBQyxDQUFDO1lBRTdELGdFQUFnRTtZQUNoRSxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDOUIsSUFBSSxJQUFBLDBCQUFpQixFQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3RGLE9BQU87d0JBQ04sWUFBWSxFQUFFLElBQUEsb0JBQVEsRUFBQyxrQkFBa0IsQ0FBQyxzQkFBc0IsRUFBRSxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxtQ0FBdUIsQ0FBQztxQkFDdEgsQ0FBQztnQkFDSCxDQUFDO2dCQUVELE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxDQUFDO1lBRUgsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDekMsQ0FBQztJQUNGLENBQUMsQ0FBQztJQWxCVyxRQUFBLGlCQUFpQixxQkFrQjVCO0lBRUssTUFB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