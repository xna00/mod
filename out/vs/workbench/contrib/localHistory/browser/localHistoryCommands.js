/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/network", "vs/base/common/errorMessage", "vs/base/common/cancellation", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/contrib/localHistory/browser/localHistoryFileSystemProvider", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/base/common/resources", "vs/platform/commands/common/commands", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/contextkeys", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/label/common/label", "vs/base/common/arrays", "vs/workbench/contrib/localHistory/browser/localHistory", "vs/workbench/services/path/common/pathService"], function (require, exports, nls_1, uri_1, event_1, network_1, errorMessage_1, cancellation_1, workingCopyHistory_1, editorCommands_1, localHistoryFileSystemProvider_1, contextkey_1, actions_1, resources_1, commands_1, editor_1, files_1, workingCopyService_1, dialogs_1, editorService_1, contextkeys_1, quickInput_1, getIconClasses_1, model_1, language_1, label_1, arrays_1, localHistory_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COMPARE_WITH_FILE_LABEL = void 0;
    exports.toDiffEditorArguments = toDiffEditorArguments;
    exports.findLocalHistoryEntry = findLocalHistoryEntry;
    const LOCAL_HISTORY_CATEGORY = (0, nls_1.localize2)('localHistory.category', 'Local History');
    //#region Compare with File
    exports.COMPARE_WITH_FILE_LABEL = (0, nls_1.localize2)('localHistory.compareWithFile', 'Compare with File');
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.compareWithFile',
                title: exports.COMPARE_WITH_FILE_LABEL,
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '1_compare',
                    order: 1,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const commandService = accessor.get(commands_1.ICommandService);
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(entry, entry.workingCopy.resource));
            }
        }
    });
    //#endregion
    //#region Compare with Previous
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.compareWithPrevious',
                title: (0, nls_1.localize2)('localHistory.compareWithPrevious', 'Compare with Previous'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '1_compare',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const commandService = accessor.get(commands_1.ICommandService);
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const { entry, previous } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                // Without a previous entry, just show the entry directly
                if (!previous) {
                    return openEntry(entry, editorService);
                }
                // Open real diff editor
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(previous, entry));
            }
        }
    });
    //#endregion
    //#region Select for Compare / Compare with Selected
    let itemSelectedForCompare = undefined;
    const LocalHistoryItemSelectedForCompare = new contextkey_1.RawContextKey('localHistoryItemSelectedForCompare', false, true);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.selectForCompare',
                title: (0, nls_1.localize2)('localHistory.selectForCompare', 'Select for Compare'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '2_compare_with',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                itemSelectedForCompare = item;
                LocalHistoryItemSelectedForCompare.bindTo(contextKeyService).set(true);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.compareWithSelected',
                title: (0, nls_1.localize2)('localHistory.compareWithSelected', 'Compare with Selected'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '2_compare_with',
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.and(localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY, LocalHistoryItemSelectedForCompare)
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const commandService = accessor.get(commands_1.ICommandService);
            if (!itemSelectedForCompare) {
                return;
            }
            const selectedEntry = (await findLocalHistoryEntry(workingCopyHistoryService, itemSelectedForCompare)).entry;
            if (!selectedEntry) {
                return;
            }
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(selectedEntry, entry));
            }
        }
    });
    //#endregion
    //#region Show Contents
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.open',
                title: (0, nls_1.localize2)('localHistory.open', 'Show Contents'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '3_contents',
                    order: 1,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                return openEntry(entry, editorService);
            }
        }
    });
    //#region Restore Contents
    const RESTORE_CONTENTS_LABEL = (0, nls_1.localize2)('localHistory.restore', 'Restore Contents');
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.restoreViaEditor',
                title: RESTORE_CONTENTS_LABEL,
                menu: {
                    id: actions_1.MenuId.EditorTitle,
                    group: 'navigation',
                    order: -10,
                    when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.SCHEMA)
                },
                icon: localHistory_1.LOCAL_HISTORY_ICON_RESTORE
            });
        }
        async run(accessor, uri) {
            const { associatedResource, location } = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(uri);
            return restore(accessor, { uri: associatedResource, handle: (0, resources_1.basenameOrAuthority)(location) });
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.restore',
                title: RESTORE_CONTENTS_LABEL,
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '3_contents',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            return restore(accessor, item);
        }
    });
    const restoreSaveSource = editor_1.SaveSourceRegistry.registerSource('localHistoryRestore.source', (0, nls_1.localize)('localHistoryRestore.source', "File Restored"));
    async function restore(accessor, item) {
        const fileService = accessor.get(files_1.IFileService);
        const dialogService = accessor.get(dialogs_1.IDialogService);
        const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
        const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
        if (entry) {
            // Ask for confirmation
            const { confirmed } = await dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmRestoreMessage', "Do you want to restore the contents of '{0}'?", (0, resources_1.basename)(entry.workingCopy.resource)),
                detail: (0, nls_1.localize)('confirmRestoreDetail', "Restoring will discard any unsaved changes."),
                primaryButton: (0, nls_1.localize)({ key: 'restoreButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Restore")
            });
            if (!confirmed) {
                return;
            }
            // Revert all dirty working copies for target
            const workingCopies = workingCopyService.getAll(entry.workingCopy.resource);
            if (workingCopies) {
                for (const workingCopy of workingCopies) {
                    if (workingCopy.isDirty()) {
                        await workingCopy.revert({ soft: true });
                    }
                }
            }
            // Replace target with contents of history entry
            try {
                await fileService.cloneFile(entry.location, entry.workingCopy.resource);
            }
            catch (error) {
                // It is possible that we fail to copy the history entry to the
                // destination, for example when the destination is write protected.
                // In that case tell the user and return, it is still possible for
                // the user to manually copy the changes over from the diff editor.
                await dialogService.error((0, nls_1.localize)('unableToRestore', "Unable to restore '{0}'.", (0, resources_1.basename)(entry.workingCopy.resource)), (0, errorMessage_1.toErrorMessage)(error));
                return;
            }
            // Restore all working copies for target
            if (workingCopies) {
                for (const workingCopy of workingCopies) {
                    await workingCopy.revert({ force: true });
                }
            }
            // Open target
            await editorService.openEditor({ resource: entry.workingCopy.resource });
            // Add new entry
            await workingCopyHistoryService.addEntry({
                resource: entry.workingCopy.resource,
                source: restoreSaveSource
            }, cancellation_1.CancellationToken.None);
            // Close source
            await closeEntry(entry, editorService);
        }
    }
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.restoreViaPicker',
                title: (0, nls_1.localize2)('localHistory.restoreViaPicker', 'Find Entry to Restore'),
                f1: true,
                category: LOCAL_HISTORY_CATEGORY
            });
        }
        async run(accessor) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const modelService = accessor.get(model_1.IModelService);
            const languageService = accessor.get(language_1.ILanguageService);
            const labelService = accessor.get(label_1.ILabelService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_1.IFileService);
            const commandService = accessor.get(commands_1.ICommandService);
            // Show all resources with associated history entries in picker
            // with progress because this operation will take longer the more
            // files have been saved overall.
            const resourcePicker = quickInputService.createQuickPick();
            let cts = new cancellation_1.CancellationTokenSource();
            resourcePicker.onDidHide(() => cts.dispose(true));
            resourcePicker.busy = true;
            resourcePicker.show();
            const resources = await workingCopyHistoryService.getAll(cts.token);
            resourcePicker.busy = false;
            resourcePicker.placeholder = (0, nls_1.localize)('restoreViaPicker.filePlaceholder', "Select the file to show local history for");
            resourcePicker.matchOnLabel = true;
            resourcePicker.matchOnDescription = true;
            resourcePicker.items = resources.map(resource => ({
                resource,
                label: (0, resources_1.basenameOrAuthority)(resource),
                description: labelService.getUriLabel((0, resources_1.dirname)(resource), { relative: true }),
                iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource)
            })).sort((r1, r2) => r1.resource.fsPath < r2.resource.fsPath ? -1 : 1);
            await event_1.Event.toPromise(resourcePicker.onDidAccept);
            resourcePicker.dispose();
            const resource = (0, arrays_1.firstOrDefault)(resourcePicker.selectedItems)?.resource;
            if (!resource) {
                return;
            }
            // Show all entries for the picked resource in another picker
            // and open the entry in the end that was selected by the user
            const entryPicker = quickInputService.createQuickPick();
            cts = new cancellation_1.CancellationTokenSource();
            entryPicker.onDidHide(() => cts.dispose(true));
            entryPicker.busy = true;
            entryPicker.show();
            const entries = await workingCopyHistoryService.getEntries(resource, cts.token);
            entryPicker.busy = false;
            entryPicker.placeholder = (0, nls_1.localize)('restoreViaPicker.entryPlaceholder', "Select the local history entry to open");
            entryPicker.matchOnLabel = true;
            entryPicker.matchOnDescription = true;
            entryPicker.items = Array.from(entries).reverse().map(entry => ({
                entry,
                label: `$(circle-outline) ${editor_1.SaveSourceRegistry.getSourceLabel(entry.source)}`,
                description: toLocalHistoryEntryDateLabel(entry.timestamp)
            }));
            await event_1.Event.toPromise(entryPicker.onDidAccept);
            entryPicker.dispose();
            const selectedItem = (0, arrays_1.firstOrDefault)(entryPicker.selectedItems);
            if (!selectedItem) {
                return;
            }
            const resourceExists = await fileService.exists(selectedItem.entry.workingCopy.resource);
            if (resourceExists) {
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(selectedItem.entry, selectedItem.entry.workingCopy.resource));
            }
            return openEntry(selectedItem.entry, editorService);
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.TimelineTitle, { command: { id: 'workbench.action.localHistory.restoreViaPicker', title: (0, nls_1.localize2)('localHistory.restoreViaPickerMenu', 'Local History: Find Entry to Restore...') }, group: 'submenu', order: 1 });
    //#endregion
    //#region Rename
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.rename',
                title: (0, nls_1.localize2)('localHistory.rename', 'Rename'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '5_edit',
                    order: 1,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                const inputBox = quickInputService.createInputBox();
                inputBox.title = (0, nls_1.localize)('renameLocalHistoryEntryTitle', "Rename Local History Entry");
                inputBox.ignoreFocusOut = true;
                inputBox.placeholder = (0, nls_1.localize)('renameLocalHistoryPlaceholder', "Enter the new name of the local history entry");
                inputBox.value = editor_1.SaveSourceRegistry.getSourceLabel(entry.source);
                inputBox.show();
                inputBox.onDidAccept(() => {
                    if (inputBox.value) {
                        workingCopyHistoryService.updateEntry(entry, { source: inputBox.value }, cancellation_1.CancellationToken.None);
                    }
                    inputBox.dispose();
                });
            }
        }
    });
    //#endregion
    //#region Delete
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.delete',
                title: (0, nls_1.localize2)('localHistory.delete', 'Delete'),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '5_edit',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                // Ask for confirmation
                const { confirmed } = await dialogService.confirm({
                    type: 'warning',
                    message: (0, nls_1.localize)('confirmDeleteMessage', "Do you want to delete the local history entry of '{0}' from {1}?", entry.workingCopy.name, toLocalHistoryEntryDateLabel(entry.timestamp)),
                    detail: (0, nls_1.localize)('confirmDeleteDetail', "This action is irreversible!"),
                    primaryButton: (0, nls_1.localize)({ key: 'deleteButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete"),
                });
                if (!confirmed) {
                    return;
                }
                // Remove via service
                await workingCopyHistoryService.removeEntry(entry, cancellation_1.CancellationToken.None);
                // Close any opened editors
                await closeEntry(entry, editorService);
            }
        }
    });
    //#endregion
    //#region Delete All
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.deleteAll',
                title: (0, nls_1.localize2)('localHistory.deleteAll', 'Delete All'),
                f1: true,
                category: LOCAL_HISTORY_CATEGORY
            });
        }
        async run(accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            // Ask for confirmation
            const { confirmed } = await dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmDeleteAllMessage', "Do you want to delete all entries of all files in local history?"),
                detail: (0, nls_1.localize)('confirmDeleteAllDetail', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'deleteAllButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete All"),
            });
            if (!confirmed) {
                return;
            }
            // Remove via service
            await workingCopyHistoryService.removeAll(cancellation_1.CancellationToken.None);
        }
    });
    //#endregion
    //#region Create
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.create',
                title: (0, nls_1.localize2)('localHistory.create', 'Create Entry'),
                f1: true,
                category: LOCAL_HISTORY_CATEGORY,
                precondition: contextkeys_1.ActiveEditorContext
            });
        }
        async run(accessor) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const labelService = accessor.get(label_1.ILabelService);
            const pathService = accessor.get(pathService_1.IPathService);
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (resource?.scheme !== pathService.defaultUriScheme && resource?.scheme !== network_1.Schemas.vscodeUserData) {
                return; // only enable for selected schemes
            }
            const inputBox = quickInputService.createInputBox();
            inputBox.title = (0, nls_1.localize)('createLocalHistoryEntryTitle', "Create Local History Entry");
            inputBox.ignoreFocusOut = true;
            inputBox.placeholder = (0, nls_1.localize)('createLocalHistoryPlaceholder', "Enter the new name of the local history entry for '{0}'", labelService.getUriBasenameLabel(resource));
            inputBox.show();
            inputBox.onDidAccept(async () => {
                const entrySource = inputBox.value;
                inputBox.dispose();
                if (entrySource) {
                    await workingCopyHistoryService.addEntry({ resource, source: inputBox.value }, cancellation_1.CancellationToken.None);
                }
            });
        }
    });
    //#endregion
    //#region Helpers
    async function openEntry(entry, editorService) {
        const resource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: entry.location, associatedResource: entry.workingCopy.resource });
        await editorService.openEditor({
            resource,
            label: (0, nls_1.localize)('localHistoryEditorLabel', "{0} ({1} • {2})", entry.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(entry.source), toLocalHistoryEntryDateLabel(entry.timestamp))
        });
    }
    async function closeEntry(entry, editorService) {
        const resource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: entry.location, associatedResource: entry.workingCopy.resource });
        const editors = editorService.findEditors(resource, { supportSideBySide: editor_1.SideBySideEditor.ANY });
        await editorService.closeEditors(editors, { preserveFocus: true });
    }
    function toDiffEditorArguments(arg1, arg2) {
        // Left hand side is always a working copy history entry
        const originalResource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: arg1.location, associatedResource: arg1.workingCopy.resource });
        let label;
        // Right hand side depends on how the method was called
        // and is either another working copy history entry
        // or the file on disk.
        let modifiedResource;
        // Compare with file on disk
        if (uri_1.URI.isUri(arg2)) {
            const resource = arg2;
            modifiedResource = resource;
            label = (0, nls_1.localize)('localHistoryCompareToFileEditorLabel', "{0} ({1} • {2}) ↔ {3}", arg1.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(arg1.source), toLocalHistoryEntryDateLabel(arg1.timestamp), arg1.workingCopy.name);
        }
        // Compare with another entry
        else {
            const modified = arg2;
            modifiedResource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: modified.location, associatedResource: modified.workingCopy.resource });
            label = (0, nls_1.localize)('localHistoryCompareToPreviousEditorLabel', "{0} ({1} • {2}) ↔ {3} ({4} • {5})", arg1.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(arg1.source), toLocalHistoryEntryDateLabel(arg1.timestamp), modified.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(modified.source), toLocalHistoryEntryDateLabel(modified.timestamp));
        }
        return [
            originalResource,
            modifiedResource,
            label,
            undefined // important to keep order of arguments in command proper
        ];
    }
    async function findLocalHistoryEntry(workingCopyHistoryService, descriptor) {
        const entries = await workingCopyHistoryService.getEntries(descriptor.uri, cancellation_1.CancellationToken.None);
        let currentEntry = undefined;
        let previousEntry = undefined;
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.id === descriptor.handle) {
                currentEntry = entry;
                previousEntry = entries[i - 1];
                break;
            }
        }
        return {
            entry: currentEntry,
            previous: previousEntry
        };
    }
    const SEP = /\//g;
    function toLocalHistoryEntryDateLabel(timestamp) {
        return `${(0, localHistory_1.getLocalHistoryDateFormatter)().format(timestamp).replace(SEP, '-')}`; // preserving `/` will break editor labels, so replace it with a non-path symbol
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxIaXN0b3J5Q29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvY2FsSGlzdG9yeS9icm93c2VyL2xvY2FsSGlzdG9yeUNvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTBrQmhHLHNEQW1DQztJQUVELHNEQW1CQztJQW5tQkQsTUFBTSxzQkFBc0IsR0FBRyxJQUFBLGVBQVMsRUFBQyx1QkFBdUIsRUFBRSxlQUFlLENBQUMsQ0FBQztJQU9uRiwyQkFBMkI7SUFFZCxRQUFBLHVCQUF1QixHQUFHLElBQUEsZUFBUyxFQUFDLDhCQUE4QixFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFFdEcsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsK0NBQStDO2dCQUNuRCxLQUFLLEVBQUUsK0JBQXVCO2dCQUM5QixJQUFJLEVBQUU7b0JBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsbUJBQW1CO29CQUM5QixLQUFLLEVBQUUsV0FBVztvQkFDbEIsS0FBSyxFQUFFLENBQUM7b0JBQ1IsSUFBSSxFQUFFLDZDQUE4QjtpQkFDcEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLElBQThCO1lBQ25FLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMEJBQWUsQ0FBQyxDQUFDO1lBQ3JELE1BQU0seUJBQXlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQ0FBMEIsQ0FBQyxDQUFDO1lBRTNFLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxNQUFNLHFCQUFxQixDQUFDLHlCQUF5QixFQUFFLElBQUksQ0FBQyxDQUFD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