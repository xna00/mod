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
define(["require", "exports", "vs/nls", "vs/base/common/errorMessage", "vs/base/common/resources", "vs/base/common/actions", "vs/base/common/uri", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/editor/common/services/resolverService", "vs/base/common/map", "vs/workbench/common/editor/diffEditorInput", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/contrib/files/browser/fileConstants", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/base/common/event", "vs/workbench/services/editor/common/editorService", "vs/base/common/platform", "vs/base/common/network", "vs/workbench/services/preferences/common/preferences", "vs/workbench/common/editor", "vs/base/common/hash"], function (require, exports, nls_1, errorMessage_1, resources_1, actions_1, uri_1, textfiles_1, instantiation_1, lifecycle_1, resolverService_1, map_1, diffEditorInput_1, contextkey_1, files_1, fileEditorInput_1, fileConstants_1, notification_1, opener_1, storage_1, productService_1, event_1, editorService_1, platform_1, network_1, preferences_1, editor_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.revertLocalChangesCommand = exports.acceptLocalChangesCommand = exports.TextFileSaveErrorHandler = exports.CONFLICT_RESOLUTION_SCHEME = exports.CONFLICT_RESOLUTION_CONTEXT = void 0;
    exports.CONFLICT_RESOLUTION_CONTEXT = 'saveConflictResolutionContext';
    exports.CONFLICT_RESOLUTION_SCHEME = 'conflictResolution';
    const LEARN_MORE_DIRTY_WRITE_IGNORE_KEY = 'learnMoreDirtyWriteError';
    const conflictEditorHelp = (0, nls_1.localize)('userGuide', "Use the actions in the editor tool bar to either undo your changes or overwrite the content of the file with your changes.");
    // A handler for text file save error happening with conflict resolution actions
    let TextFileSaveErrorHandler = class TextFileSaveErrorHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.textFileSaveErrorHandler'; }
        constructor(notificationService, textFileService, contextKeyService, editorService, textModelService, instantiationService, storageService) {
            super();
            this.notificationService = notificationService;
            this.textFileService = textFileService;
            this.contextKeyService = contextKeyService;
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.messages = new map_1.ResourceMap();
            this.conflictResolutionContext = new contextkey_1.RawContextKey(exports.CONFLICT_RESOLUTION_CONTEXT, false, true).bindTo(this.contextKeyService);
            this.activeConflictResolutionResource = undefined;
            const provider = this._register(instantiationService.createInstance(files_1.TextFileContentProvider));
            this._register(textModelService.registerTextModelContentProvider(exports.CONFLICT_RESOLUTION_SCHEME, provider));
            // Set as save error handler to service for text files
            this.textFileService.files.saveErrorHandler = this;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.textFileService.files.onDidSave(e => this.onFileSavedOrReverted(e.model.resource)));
            this._register(this.textFileService.files.onDidRevert(model => this.onFileSavedOrReverted(model.resource)));
            this._register(this.editorService.onDidActiveEditorChange(() => this.onActiveEditorChanged()));
        }
        onActiveEditorChanged() {
            let isActiveEditorSaveConflictResolution = false;
            let activeConflictResolutionResource;
            const activeInput = this.editorService.activeEditor;
            if (activeInput instanceof diffEditorInput_1.DiffEditorInput) {
                const resource = activeInput.original.resource;
                if (resource?.scheme === exports.CONFLICT_RESOLUTION_SCHEME) {
                    isActiveEditorSaveConflictResolution = true;
                    activeConflictResolutionResource = activeInput.modified.resource;
                }
            }
            this.conflictResolutionContext.set(isActiveEditorSaveConflictResolution);
            this.activeConflictResolutionResource = activeConflictResolutionResource;
        }
        onFileSavedOrReverted(resource) {
            const messageHandle = this.messages.get(resource);
            if (messageHandle) {
                messageHandle.close();
                this.messages.delete(resource);
            }
        }
        onSaveError(error, model, options) {
            const fileOperationError = error;
            const resource = model.resource;
            let message;
            const primaryActions = [];
            const secondaryActions = [];
            // Dirty write prevention
            if (fileOperationError.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                // If the user tried to save from the opened conflict editor, show its message again
                if (this.activeConflictResolutionResource && (0, resources_1.isEqual)(this.activeConflictResolutionResource, model.resource)) {
                    if (this.storageService.getBoolean(LEARN_MORE_DIRTY_WRITE_IGNORE_KEY, -1 /* StorageScope.APPLICATION */)) {
                        return; // return if this message is ignored
                    }
                    message = conflictEditorHelp;
                    primaryActions.push(this.instantiationService.createInstance(ResolveConflictLearnMoreAction));
                    secondaryActions.push(this.instantiationService.createInstance(DoNotShowResolveConflictLearnMoreAction));
                }
                // Otherwise show the message that will lead the user into the save conflict editor.
                else {
                    message = (0, nls_1.localize)('staleSaveError', "Failed to save '{0}': The content of the file is newer. Please compare your version with the file contents or overwrite the content of the file with your changes.", (0, resources_1.basename)(resource));
                    primaryActions.push(this.instantiationService.createInstance(ResolveSaveConflictAction, model));
                    primaryActions.push(this.instantiationService.createInstance(SaveModelIgnoreModifiedSinceAction, model, options));
                    secondaryActions.push(this.instantiationService.createInstance(ConfigureSaveConflictAction));
                }
            }
            // Any other save error
            else {
                const isWriteLocked = fileOperationError.fileOperationResult === 5 /* FileOperationResult.FILE_WRITE_LOCKED */;
                const triedToUnlock = isWriteLocked && fileOperationError.options?.unlock;
                const isPermissionDenied = fileOperationError.fileOperationResult === 6 /* FileOperationResult.FILE_PERMISSION_DENIED */;
                const canSaveElevated = resource.scheme === network_1.Schemas.file; // currently only supported for local schemes (https://github.com/microsoft/vscode/issues/48659)
                // Save Elevated
                if (canSaveElevated && (isPermissionDenied || triedToUnlock)) {
                    primaryActions.push(this.instantiationService.createInstance(SaveModelElevatedAction, model, options, !!triedToUnlock));
                }
                // Unlock
                else if (isWriteLocked) {
                    primaryActions.push(this.instantiationService.createInstance(UnlockModelAction, model, options));
                }
                // Retry
                else {
                    primaryActions.push(this.instantiationService.createInstance(RetrySaveModelAction, model, options));
                }
                // Save As
                primaryActions.push(this.instantiationService.createInstance(SaveModelAsAction, model));
                // Discard
                primaryActions.push(this.instantiationService.createInstance(DiscardModelAction, model));
                // Message
                if (isWriteLocked) {
                    if (triedToUnlock && canSaveElevated) {
                        message = platform_1.isWindows ? (0, nls_1.localize)('readonlySaveErrorAdmin', "Failed to save '{0}': File is read-only. Select 'Overwrite as Admin' to retry as administrator.", (0, resources_1.basename)(resource)) : (0, nls_1.localize)('readonlySaveErrorSudo', "Failed to save '{0}': File is read-only. Select 'Overwrite as Sudo' to retry as superuser.", (0, resources_1.basename)(resource));
                    }
                    else {
                        message = (0, nls_1.localize)('readonlySaveError', "Failed to save '{0}': File is read-only. Select 'Overwrite' to attempt to make it writeable.", (0, resources_1.basename)(resource));
                    }
                }
                else if (canSaveElevated && isPermissionDenied) {
                    message = platform_1.isWindows ? (0, nls_1.localize)('permissionDeniedSaveError', "Failed to save '{0}': Insufficient permissions. Select 'Retry as Admin' to retry as administrator.", (0, resources_1.basename)(resource)) : (0, nls_1.localize)('permissionDeniedSaveErrorSudo', "Failed to save '{0}': Insufficient permissions. Select 'Retry as Sudo' to retry as superuser.", (0, resources_1.basename)(resource));
                }
                else {
                    message = (0, nls_1.localize)({ key: 'genericSaveError', comment: ['{0} is the resource that failed to save and {1} the error message'] }, "Failed to save '{0}': {1}", (0, resources_1.basename)(resource), (0, errorMessage_1.toErrorMessage)(error, false));
                }
            }
            // Show message and keep function to hide in case the file gets saved/reverted
            const actions = { primary: primaryActions, secondary: secondaryActions };
            const handle = this.notificationService.notify({
                id: `${(0, hash_1.hash)(model.resource.toString())}`, // unique per model (https://github.com/microsoft/vscode/issues/121539)
                severity: notification_1.Severity.Error,
                message,
                actions
            });
            event_1.Event.once(handle.onDidClose)(() => { (0, lifecycle_1.dispose)(primaryActions); (0, lifecycle_1.dispose)(secondaryActions); });
            this.messages.set(model.resource, handle);
        }
        dispose() {
            super.dispose();
            this.messages.clear();
        }
    };
    exports.TextFileSaveErrorHandler = TextFileSaveErrorHandler;
    exports.TextFileSaveErrorHandler = TextFileSaveErrorHandler = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, editorService_1.IEditorService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, storage_1.IStorageService)
    ], TextFileSaveErrorHandler);
    const pendingResolveSaveConflictMessages = [];
    function clearPendingResolveSaveConflictMessages() {
        while (pendingResolveSaveConflictMessages.length > 0) {
            const item = pendingResolveSaveConflictMessages.pop();
            item?.close();
        }
    }
    let ResolveConflictLearnMoreAction = class ResolveConflictLearnMoreAction extends actions_1.Action {
        constructor(openerService) {
            super('workbench.files.action.resolveConflictLearnMore', (0, nls_1.localize)('learnMore', "Learn More"));
            this.openerService = openerService;
        }
        async run() {
            await this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?linkid=868264'));
        }
    };
    ResolveConflictLearnMoreAction = __decorate([
        __param(0, opener_1.IOpenerService)
    ], ResolveConflictLearnMoreAction);
    let DoNotShowResolveConflictLearnMoreAction = class DoNotShowResolveConflictLearnMoreAction extends actions_1.Action {
        constructor(storageService) {
            super('workbench.files.action.resolveConflictLearnMoreDoNotShowAgain', (0, nls_1.localize)('dontShowAgain', "Don't Show Again"));
            this.storageService = storageService;
        }
        async run(notification) {
            // Remember this as application state
            this.storageService.store(LEARN_MORE_DIRTY_WRITE_IGNORE_KEY, true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            // Hide notification
            notification.dispose();
        }
    };
    DoNotShowResolveConflictLearnMoreAction = __decorate([
        __param(0, storage_1.IStorageService)
    ], DoNotShowResolveConflictLearnMoreAction);
    let ResolveSaveConflictAction = class ResolveSaveConflictAction extends actions_1.Action {
        constructor(model, editorService, notificationService, instantiationService, productService) {
            super('workbench.files.action.resolveConflict', (0, nls_1.localize)('compareChanges', "Compare"));
            this.model = model;
            this.editorService = editorService;
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
            this.productService = productService;
        }
        async run() {
            if (!this.model.isDisposed()) {
                const resource = this.model.resource;
                const name = (0, resources_1.basename)(resource);
                const editorLabel = (0, nls_1.localize)('saveConflictDiffLabel', "{0} (in file) ↔ {1} (in {2}) - Resolve save conflict", name, name, this.productService.nameLong);
                await files_1.TextFileContentProvider.open(resource, exports.CONFLICT_RESOLUTION_SCHEME, editorLabel, this.editorService, { pinned: true });
                // Show additional help how to resolve the save conflict
                const actions = { primary: [this.instantiationService.createInstance(ResolveConflictLearnMoreAction)] };
                const handle = this.notificationService.notify({
                    id: `${(0, hash_1.hash)(resource.toString())}`, // unique per model
                    severity: notification_1.Severity.Info,
                    message: conflictEditorHelp,
                    actions,
                    neverShowAgain: { id: LEARN_MORE_DIRTY_WRITE_IGNORE_KEY, isSecondary: true }
                });
                event_1.Event.once(handle.onDidClose)(() => (0, lifecycle_1.dispose)(actions.primary));
                pendingResolveSaveConflictMessages.push(handle);
            }
        }
    };
    ResolveSaveConflictAction = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, notification_1.INotificationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, productService_1.IProductService)
    ], ResolveSaveConflictAction);
    class SaveModelElevatedAction extends actions_1.Action {
        constructor(model, options, triedToUnlock) {
            super('workbench.files.action.saveModelElevated', triedToUnlock ? platform_1.isWindows ? (0, nls_1.localize)('overwriteElevated', "Overwrite as Admin...") : (0, nls_1.localize)('overwriteElevatedSudo', "Overwrite as Sudo...") : platform_1.isWindows ? (0, nls_1.localize)('saveElevated', "Retry as Admin...") : (0, nls_1.localize)('saveElevatedSudo', "Retry as Sudo..."));
            this.model = model;
            this.options = options;
            this.triedToUnlock = triedToUnlock;
        }
        async run() {
            if (!this.model.isDisposed()) {
                await this.model.save({
                    ...this.options,
                    writeElevated: true,
                    writeUnlock: this.triedToUnlock,
                    reason: 1 /* SaveReason.EXPLICIT */
                });
            }
        }
    }
    class RetrySaveModelAction extends actions_1.Action {
        constructor(model, options) {
            super('workbench.files.action.saveModel', (0, nls_1.localize)('retry', "Retry"));
            this.model = model;
            this.options = options;
        }
        async run() {
            if (!this.model.isDisposed()) {
                await this.model.save({ ...this.options, reason: 1 /* SaveReason.EXPLICIT */ });
            }
        }
    }
    class DiscardModelAction extends actions_1.Action {
        constructor(model) {
            super('workbench.files.action.discardModel', (0, nls_1.localize)('discard', "Discard"));
            this.model = model;
        }
        async run() {
            if (!this.model.isDisposed()) {
                await this.model.revert();
            }
        }
    }
    let SaveModelAsAction = class SaveModelAsAction extends actions_1.Action {
        constructor(model, editorService) {
            super('workbench.files.action.saveModelAs', fileConstants_1.SAVE_FILE_AS_LABEL.value);
            this.model = model;
            this.editorService = editorService;
        }
        async run() {
            if (!this.model.isDisposed()) {
                const editor = this.findEditor();
                if (editor) {
                    await this.editorService.save(editor, { saveAs: true, reason: 1 /* SaveReason.EXPLICIT */ });
                }
            }
        }
        findEditor() {
            let preferredMatchingEditor;
            const editors = this.editorService.findEditors(this.model.resource, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            for (const identifier of editors) {
                if (identifier.editor instanceof fileEditorInput_1.FileEditorInput) {
                    // We prefer a `FileEditorInput` for "Save As", but it is possible
                    // that a custom editor is leveraging the text file model and as
                    // such we need to fallback to any other editor having the resource
                    // opened for running the save.
                    preferredMatchingEditor = identifier;
                    break;
                }
                else if (!preferredMatchingEditor) {
                    preferredMatchingEditor = identifier;
                }
            }
            return preferredMatchingEditor;
        }
    };
    SaveModelAsAction = __decorate([
        __param(1, editorService_1.IEditorService)
    ], SaveModelAsAction);
    class UnlockModelAction extends actions_1.Action {
        constructor(model, options) {
            super('workbench.files.action.unlock', (0, nls_1.localize)('overwrite', "Overwrite"));
            this.model = model;
            this.options = options;
        }
        async run() {
            if (!this.model.isDisposed()) {
                await this.model.save({ ...this.options, writeUnlock: true, reason: 1 /* SaveReason.EXPLICIT */ });
            }
        }
    }
    class SaveModelIgnoreModifiedSinceAction extends actions_1.Action {
        constructor(model, options) {
            super('workbench.files.action.saveIgnoreModifiedSince', (0, nls_1.localize)('overwrite', "Overwrite"));
            this.model = model;
            this.options = options;
        }
        async run() {
            if (!this.model.isDisposed()) {
                await this.model.save({ ...this.options, ignoreModifiedSince: true, reason: 1 /* SaveReason.EXPLICIT */ });
            }
        }
    }
    let ConfigureSaveConflictAction = class ConfigureSaveConflictAction extends actions_1.Action {
        constructor(preferencesService) {
            super('workbench.files.action.configureSaveConflict', (0, nls_1.localize)('configure', "Configure"));
            this.preferencesService = preferencesService;
        }
        async run() {
            this.preferencesService.openSettings({ query: 'files.saveConflictResolution' });
        }
    };
    ConfigureSaveConflictAction = __decorate([
        __param(0, preferences_1.IPreferencesService)
    ], ConfigureSaveConflictAction);
    const acceptLocalChangesCommand = (accessor, resource) => {
        return acceptOrRevertLocalChangesCommand(accessor, resource, true);
    };
    exports.acceptLocalChangesCommand = acceptLocalChangesCommand;
    const revertLocalChangesCommand = (accessor, resource) => {
        return acceptOrRevertLocalChangesCommand(accessor, resource, false);
    };
    exports.revertLocalChangesCommand = revertLocalChangesCommand;
    async function acceptOrRevertLocalChangesCommand(accessor, resource, accept) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editorPane = editorService.activeEditorPane;
        if (!editorPane) {
            return;
        }
        const editor = editorPane.input;
        const group = editorPane.group;
        // Hide any previously shown message about how to use these actions
        clearPendingResolveSaveConflictMessages();
        // Accept or revert
        if (accept) {
            const options = { ignoreModifiedSince: true, reason: 1 /* SaveReason.EXPLICIT */ };
            await editorService.save({ editor, groupId: group.id }, options);
        }
        else {
            await editorService.revert({ editor, groupId: group.id });
        }
        // Reopen original editor
        await editorService.openEditor({ resource }, group);
        // Clean up
        return group.closeEditor(editor);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVTYXZlRXJyb3JIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL2VkaXRvcnMvdGV4dEZpbGVTYXZlRXJyb3JIYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQStCbkYsUUFBQSwyQkFBMkIsR0FBRywrQkFBK0IsQ0FBQztJQUM5RCxRQUFBLDBCQUEwQixHQUFHLG9CQUFvQixDQUFDO0lBRS9ELE1BQU0saUNBQWlDLEdBQUcsMEJBQTBCLENBQUM7SUFFckUsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsNEhBQTRILENBQUMsQ0FBQztJQUUvSyxnRkFBZ0Y7SUFDekUsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTtpQkFFdkMsT0FBRSxHQUFHLDRDQUE0QyxBQUEvQyxDQUFnRDtRQU1sRSxZQUN1QixtQkFBMEQsRUFDOUQsZUFBa0QsRUFDaEQsaUJBQTZDLEVBQ2pELGFBQThDLEVBQzNDLGdCQUFtQyxFQUMvQixvQkFBNEQsRUFDbEUsY0FBZ0Q7WUFFakUsS0FBSyxFQUFFLENBQUM7WUFSK0Isd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUM3QyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDeEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNoQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFFdEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFYakQsYUFBUSxHQUFHLElBQUksaUJBQVcsRUFBdUIsQ0FBQztZQUNsRCw4QkFBeUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsbUNBQTJCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUN6SSxxQ0FBZ0MsR0FBb0IsU0FBUyxDQUFDO1lBYXJFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLCtCQUF1QixDQUFDLENBQUMsQ0FBQztZQUM5RixJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLGdDQUFnQyxDQUFDLGtDQUEwQixFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFeEcsc0RBQXNEO1lBQ3RELElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztZQUVuRCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNoRyxDQUFDO1FBRU8scUJBQXFCO1lBQzVCLElBQUksb0NBQW9DLEdBQUcsS0FBSyxDQUFDO1lBQ2pELElBQUksZ0NBQWlELENBQUM7WUFFdEQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUM7WUFDcEQsSUFBSSxXQUFXLFlBQVksaUNBQWUsRUFBRSxDQUFDO2dCQUM1QyxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztnQkFDL0MsSUFBSSxRQUFRLEVBQUUsTUFBTSxLQUFLLGtDQUEwQixFQUFFLENBQUM7b0JBQ3JELG9DQUFvQyxHQUFHLElBQUksQ0FBQztvQkFDNUMsZ0NBQWdDLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7Z0JBQ2xFLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxnQ0FBZ0MsQ0FBQztRQUMxRSxDQUFDO1FBRU8scUJBQXFCLENBQUMsUUFBYTtZQUMxQyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRCxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNuQixhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hDLENBQUM7UUFDRixDQUFDO1FBRUQsV0FBVyxDQUFDLEtBQWMsRUFBRSxLQUEyQixFQUFFLE9BQTZCO1lBQ3JGLE1BQU0sa0JBQWtCLEdBQUcsS0FBMkIsQ0FBQztZQUN2RCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1lBRWhDLElBQUksT0FBZSxDQUFDO1lBQ3BCLE1BQU0sY0FBYyxHQUFhLEVBQUUsQ0FBQztZQUNwQyxNQUFNLGdCQUFnQixHQUFhLEVBQUUsQ0FBQztZQUV0Qyx5QkFBeUI7WUFDekIsSUFBSSxrQkFBa0IsQ0FBQyxtQkFBbUIsb0RBQTRDLEVBQUUsQ0FBQztnQkFFeEYsb0ZBQW9GO2dCQUNwRixJQUFJLElBQUksQ0FBQyxnQ0FBZ0MsSUFBSSxJQUFBLG1CQUFPLEVBQUMsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUM3RyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLGlDQUFpQyxvQ0FBMkIsRUFBRSxDQUFDO3dCQUNqRyxPQUFPLENBQUMsb0NBQW9DO29CQUM3QyxDQUFDO29CQUVELE9BQU8sR0FBRyxrQkFBa0IsQ0FBQztvQkFFN0IsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQztvQkFDOUYsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsdUNBQXVDLENBQUMsQ0FBQyxDQUFDO2dCQUMxRyxDQUFDO2dCQUVELG9GQUFvRjtxQkFDL0UsQ0FBQztvQkFDTCxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsb0tBQW9LLEVBQUUsSUFBQSxvQkFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBRS9OLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUNoRyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsa0NBQWtDLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBRWxILGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQztnQkFDOUYsQ0FBQztZQUNGLENBQUM7WUFFRCx1QkFBdUI7aUJBQ2xCLENBQUM7Z0JBQ0wsTUFBTSxhQUFhLEdBQUcsa0JBQWtCLENBQUMsbUJBQW1CLGtEQUEwQyxDQUFDO2dCQUN2RyxNQUFNLGFBQWEsR0FBRyxhQUFhLElBQUssa0JBQWtCLENBQUMsT0FBeUMsRUFBRSxNQUFNLENBQUM7Z0JBQzdHLE1BQU0sa0JBQWtCLEdBQUcsa0JBQWtCLENBQUMsbUJBQW1CLHVEQUErQyxDQUFDO2dCQUNqSCxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsZ0dBQWdHO2dCQUUxSixnQkFBZ0I7Z0JBQ2hCLElBQUksZUFBZSxJQUFJLENBQUMsa0JBQWtCLElBQUksYUFBYSxDQUFDLEVBQUUsQ0FBQztvQkFDOUQsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVCQUF1QixFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pILENBQUM7Z0JBRUQsU0FBUztxQkFDSixJQUFJLGFBQWEsRUFBRSxDQUFDO29CQUN4QixjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ2xHLENBQUM7Z0JBRUQsUUFBUTtxQkFDSCxDQUFDO29CQUNMLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDckcsQ0FBQztnQkFFRCxVQUFVO2dCQUNWLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUV4RixVQUFVO2dCQUNWLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUV6RixVQUFVO2dCQUNWLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ25CLElBQUksYUFBYSxJQUFJLGVBQWUsRUFBRSxDQUFDO3dCQUN0QyxPQUFPLEdBQUcsb0JBQVMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsaUdBQWlHLEVBQUUsSUFBQSxvQkFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLDRGQUE0RixFQUFFLElBQUEsb0JBQVEsRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUN2VSxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsT0FBTyxHQUFHLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLDhGQUE4RixFQUFFLElBQUEsb0JBQVEsRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUM3SixDQUFDO2dCQUNGLENBQUM7cUJBQU0sSUFBSSxlQUFlLElBQUksa0JBQWtCLEVBQUUsQ0FBQztvQkFDbEQsT0FBTyxHQUFHLG9CQUFTLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLG9HQUFvRyxFQUFFLElBQUEsb0JBQVEsRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSwrRkFBK0YsRUFBRSxJQUFBLG9CQUFRLEVBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDeFYsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxrQkFBa0IsRUFBRSxPQUFPLEVBQUUsQ0FBQyxtRUFBbUUsQ0FBQyxFQUFFLEVBQUUsMkJBQTJCLEVBQUUsSUFBQSxvQkFBUSxFQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUEsNkJBQWMsRUFBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDaE4sQ0FBQztZQUNGLENBQUM7WUFFRCw4RUFBOEU7WUFDOUUsTUFBTSxPQUFPLEdBQXlCLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztZQUMvRixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDO2dCQUM5QyxFQUFFLEVBQUUsR0FBRyxJQUFBLFdBQUksRUFBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSx1RUFBdUU7Z0JBQ2pILFFBQVEsRUFBRSx1QkFBUSxDQUFDLEtBQUs7Z0JBQ3hCLE9BQU87Z0JBQ1AsT0FBTzthQUNQLENBQUMsQ0FBQztZQUNILGFBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUEsbUJBQU8sRUFBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUEsbUJBQU8sRUFBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRVEsT0FBTztZQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVoQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZCLENBQUM7O0lBdkpXLDREQUF3Qjt1Q0FBeEIsd0JBQXdCO1FBU2xDLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSw0QkFBZ0IsQ0FBQTtRQUNoQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsbUNBQWlCLENBQUE7UUFDakIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHlCQUFlLENBQUE7T0FmTCx3QkFBd0IsQ0F3SnBDO0lBRUQsTUFBTSxrQ0FBa0MsR0FBMEIsRUFBRSxDQUFDO0lBQ3JFLFNBQVMsdUNBQXVDO1FBQy9DLE9BQU8sa0NBQWtDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3RELE1BQU0sSUFBSSxHQUFHLGtDQUFrQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3RELElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNmLENBQUM7SUFDRixDQUFDO0lBRUQsSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBK0IsU0FBUSxnQkFBTTtRQUVsRCxZQUNrQyxhQUE2QjtZQUU5RCxLQUFLLENBQUMsaURBQWlELEVBQUUsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFGN0Qsa0JBQWEsR0FBYixhQUFhLENBQWdCO1FBRy9ELENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQyxDQUFDO1FBQzVGLENBQUM7S0FDRCxDQUFBO0lBWEssOEJBQThCO1FBR2pDLFdBQUEsdUJBQWMsQ0FBQTtPQUhYLDhCQUE4QixDQVduQztJQUVELElBQU0sdUNBQXVDLEdBQTdDLE1BQU0sdUNBQXdDLFNBQVEsZ0JBQU07UUFFM0QsWUFDbUMsY0FBK0I7WUFFakUsS0FBSyxDQUFDLCtEQUErRCxFQUFFLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFGcEYsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1FBR2xFLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFlBQXlCO1lBRTNDLHFDQUFxQztZQUNyQyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxJQUFJLGdFQUErQyxDQUFDO1lBRWpILG9CQUFvQjtZQUNwQixZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDeEIsQ0FBQztLQUNELENBQUE7SUFoQkssdUNBQXVDO1FBRzFDLFdBQUEseUJBQWUsQ0FBQTtPQUhaLHVDQUF1QyxDQWdCNUM7SUFFRCxJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUEwQixTQUFRLGdCQUFNO1FBRTdDLFlBQ1MsS0FBMkIsRUFDRixhQUE2QixFQUN2QixtQkFBeUMsRUFDeEMsb0JBQTJDLEVBQ2pELGNBQStCO1lBRWpFLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBTi9FLFVBQUssR0FBTCxLQUFLLENBQXNCO1lBQ0Ysa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3ZCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDeEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7UUFHbEUsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDO2dCQUNyQyxNQUFNLElBQUksR0FBRyxJQUFBLG9CQUFRLEVBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sV0FBVyxHQUFHLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLHNEQUFzRCxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFeEosTUFBTSwrQkFBdUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLGtDQUEwQixFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBRTVILHdEQUF3RDtnQkFDeEQsTUFBTSxPQUFPLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDhCQUE4QixDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN4RyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDO29CQUM5QyxFQUFFLEVBQUUsR0FBRyxJQUFBLFdBQUksRUFBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLG1CQUFtQjtvQkFDdkQsUUFBUSxFQUFFLHVCQUFRLENBQUMsSUFBSTtvQkFDdkIsT0FBTyxFQUFFLGtCQUFrQjtvQkFDM0IsT0FBTztvQkFDUCxjQUFjLEVBQUUsRUFBRSxFQUFFLEVBQUUsaUNBQWlDLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRTtpQkFDNUUsQ0FBQyxDQUFDO2dCQUNILGFBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsbUJBQU8sRUFBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDOUQsa0NBQWtDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQWpDSyx5QkFBeUI7UUFJNUIsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsZ0NBQWUsQ0FBQTtPQVBaLHlCQUF5QixDQWlDOUI7SUFFRCxNQUFNLHVCQUF3QixTQUFRLGdCQUFNO1FBRTNDLFlBQ1MsS0FBMkIsRUFDM0IsT0FBNkIsRUFDN0IsYUFBc0I7WUFFOUIsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsb0JBQVMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQVMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUp6UyxVQUFLLEdBQUwsS0FBSyxDQUFzQjtZQUMzQixZQUFPLEdBQVAsT0FBTyxDQUFzQjtZQUM3QixrQkFBYSxHQUFiLGFBQWEsQ0FBUztRQUcvQixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDckIsR0FBRyxJQUFJLENBQUMsT0FBTztvQkFDZixhQUFhLEVBQUUsSUFBSTtvQkFDbkIsV0FBVyxFQUFFLElBQUksQ0FBQyxhQUFhO29CQUMvQixNQUFNLDZCQUFxQjtpQkFDM0IsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUM7S0FDRDtJQUVELE1BQU0sb0JBQXFCLFNBQVEsZ0JBQU07UUFFeEMsWUFDUyxLQUEyQixFQUMzQixPQUE2QjtZQUVyQyxLQUFLLENBQUMsa0NBQWtDLEVBQUUsSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFIOUQsVUFBSyxHQUFMLEtBQUssQ0FBc0I7WUFDM0IsWUFBTyxHQUFQLE9BQU8sQ0FBc0I7UUFHdEMsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSw2QkFBcUIsRUFBRSxDQUFDLENBQUM7WUFDekUsQ0FBQztRQUNGLENBQUM7S0FDRDtJQUVELE1BQU0sa0JBQW1CLFNBQVEsZ0JBQU07UUFFdEMsWUFDUyxLQUEyQjtZQUVuQyxLQUFLLENBQUMscUNBQXFDLEVBQUUsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFGckUsVUFBSyxHQUFMLEtBQUssQ0FBc0I7UUFHcEMsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBRUQsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSxnQkFBTTtRQUVyQyxZQUNTLEtBQTJCLEVBQ1gsYUFBNkI7WUFFckQsS0FBSyxDQUFDLG9DQUFvQyxFQUFFLGtDQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBSDlELFVBQUssR0FBTCxLQUFLLENBQXNCO1lBQ1gsa0JBQWEsR0FBYixhQUFhLENBQWdCO1FBR3RELENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUM5QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pDLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sNkJBQXFCLEVBQUUsQ0FBQyxDQUFDO2dCQUN0RixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxVQUFVO1lBQ2pCLElBQUksdUJBQXNELENBQUM7WUFFM0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSx5QkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3JILEtBQUssTUFBTSxVQUFVLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksVUFBVSxDQUFDLE1BQU0sWUFBWSxpQ0FBZSxFQUFFLENBQUM7b0JBQ2xELGtFQUFrRTtvQkFDbEUsZ0VBQWdFO29CQUNoRSxtRUFBbUU7b0JBQ25FLCtCQUErQjtvQkFDL0IsdUJBQXVCLEdBQUcsVUFBVSxDQUFDO29CQUNyQyxNQUFNO2dCQUNQLENBQUM7cUJBQU0sSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7b0JBQ3JDLHVCQUF1QixHQUFHLFVBQVUsQ0FBQztnQkFDdEMsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLHVCQUF1QixDQUFDO1FBQ2hDLENBQUM7S0FDRCxDQUFBO0lBckNLLGlCQUFpQjtRQUlwQixXQUFBLDhCQUFjLENBQUE7T0FKWCxpQkFBaUIsQ0FxQ3RCO0lBRUQsTUFBTSxpQkFBa0IsU0FBUSxnQkFBTTtRQUVyQyxZQUNTLEtBQTJCLEVBQzNCLE9BQTZCO1lBRXJDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUhuRSxVQUFLLEdBQUwsS0FBSyxDQUFzQjtZQUMzQixZQUFPLEdBQVAsT0FBTyxDQUFzQjtRQUd0QyxDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLE1BQU0sNkJBQXFCLEVBQUUsQ0FBQyxDQUFDO1lBQzVGLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFFRCxNQUFNLGtDQUFtQyxTQUFRLGdCQUFNO1FBRXRELFlBQ1MsS0FBMkIsRUFDM0IsT0FBNkI7WUFFckMsS0FBSyxDQUFDLGdEQUFnRCxFQUFFLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBSHBGLFVBQUssR0FBTCxLQUFLLENBQXNCO1lBQzNCLFlBQU8sR0FBUCxPQUFPLENBQXNCO1FBR3RDLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUM5QixNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxNQUFNLDZCQUFxQixFQUFFLENBQUMsQ0FBQztZQUNwRyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBRUQsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxnQkFBTTtRQUUvQyxZQUN1QyxrQkFBdUM7WUFFN0UsS0FBSyxDQUFDLDhDQUE4QyxFQUFFLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBRnBELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7UUFHOUUsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLEVBQUUsOEJBQThCLEVBQUUsQ0FBQyxDQUFDO1FBQ2pGLENBQUM7S0FDRCxDQUFBO0lBWEssMkJBQTJCO1FBRzlCLFdBQUEsaUNBQW1CLENBQUE7T0FIaEIsMkJBQTJCLENBV2hDO0lBRU0sTUFBTSx5QkFBeUIsR0FBRyxDQUFDLFFBQTBCLEVBQUUsUUFBYSxFQUFFLEVBQUU7UUFDdEYsT0FBTyxpQ0FBaUMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BFLENBQUMsQ0FBQztJQUZXLFFBQUEseUJBQXlCLDZCQUVwQztJQUVLLE1BQU0seUJBQXlCLEdBQUcsQ0FBQyxRQUEwQixFQUFFLFFBQWEsRUFBRSxFQUFFO1FBQ3RGLE9BQU8saUNBQWlDLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyRSxDQUFDLENBQUM7SUFGVyxRQUFBLHlCQUF5Qiw2QkFFcEM7SUFFRixLQUFLLFVBQVUsaUNBQWlDLENBQUMsUUFBMEIsRUFBRSxRQUFhLEVBQUUsTUFBZTtRQUMxRyxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztRQUVuRCxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7UUFDbEQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2pCLE9BQU87UUFDUixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztRQUNoQyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBRS9CLG1FQUFtRTtRQUNuRSx1Q0FBdUMsRUFBRSxDQUFDO1FBRTFDLG1CQUFtQjtRQUNuQixJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1osTUFBTSxPQUFPLEdBQTJCLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLE1BQU0sNkJBQXFCLEVBQUUsQ0FBQztZQUNuRyxNQUFNLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNsRSxDQUFDO2FBQU0sQ0FBQztZQUNQLE1BQU0sYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELHlCQUF5QjtRQUN6QixNQUFNLGFBQWEsQ0FBQyxVQUFVLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVwRCxXQUFXO1FBQ1gsT0FBTyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xDLENBQUMifQ==