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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/buffer", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/types", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/common/editor", "vs/workbench/services/editor/common/customEditorLabelService", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/untitled/common/untitledTextEditorService"], function (require, exports, dom_1, actions_1, buffer_1, network_1, path_1, resources_1, types_1, nls_1, dialogs_1, files_1, instantiation_1, label_1, undoRedo_1, editor_1, customEditorLabelService_1, customEditor_1, webview_1, webviewWorkbenchService_1, editorGroupsService_1, filesConfigurationService_1, layoutService_1, untitledTextEditorService_1) {
    "use strict";
    var CustomEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorInput = void 0;
    let CustomEditorInput = class CustomEditorInput extends webviewWorkbenchService_1.LazilyResolvedWebviewEditorInput {
        static { CustomEditorInput_1 = this; }
        static create(instantiationService, resource, viewType, group, options) {
            return instantiationService.invokeFunction(accessor => {
                // If it's an untitled file we must populate the untitledDocumentData
                const untitledString = accessor.get(untitledTextEditorService_1.IUntitledTextEditorService).getValue(resource);
                const untitledDocumentData = untitledString ? buffer_1.VSBuffer.fromString(untitledString) : undefined;
                const webview = accessor.get(webview_1.IWebviewService).createWebviewOverlay({
                    providedViewType: viewType,
                    title: undefined,
                    options: { customClasses: options?.customClasses },
                    contentOptions: {},
                    extension: undefined,
                });
                const input = instantiationService.createInstance(CustomEditorInput_1, { resource, viewType }, webview, { untitledDocumentData: untitledDocumentData, oldResource: options?.oldResource });
                if (typeof group !== 'undefined') {
                    input.updateGroup(group);
                }
                return input;
            });
        }
        static { this.typeId = 'workbench.editors.webviewEditor'; }
        get resource() { return this._editorResource; }
        constructor(init, webview, options, webviewWorkbenchService, instantiationService, labelService, customEditorService, fileDialogService, undoRedoService, fileService, filesConfigurationService, editorGroupsService, layoutService, customEditorLabelService) {
            super({ providedId: init.viewType, viewType: init.viewType, name: '' }, webview, webviewWorkbenchService);
            this.instantiationService = instantiationService;
            this.labelService = labelService;
            this.customEditorService = customEditorService;
            this.fileDialogService = fileDialogService;
            this.undoRedoService = undoRedoService;
            this.fileService = fileService;
            this.filesConfigurationService = filesConfigurationService;
            this.editorGroupsService = editorGroupsService;
            this.layoutService = layoutService;
            this.customEditorLabelService = customEditorLabelService;
            this._editorName = undefined;
            this._shortDescription = undefined;
            this._mediumDescription = undefined;
            this._longDescription = undefined;
            this._shortTitle = undefined;
            this._mediumTitle = undefined;
            this._longTitle = undefined;
            this._editorResource = init.resource;
            this.oldResource = options.oldResource;
            this._defaultDirtyState = options.startsDirty;
            this._backupId = options.backupId;
            this._untitledDocumentData = options.untitledDocumentData;
            this.registerListeners();
        }
        registerListeners() {
            // Clear our labels on certain label related events
            this._register(this.labelService.onDidChangeFormatters(e => this.onLabelEvent(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onLabelEvent(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onLabelEvent(e.scheme)));
            this._register(this.customEditorLabelService.onDidChange(() => this.updateLabel()));
        }
        onLabelEvent(scheme) {
            if (scheme === this.resource.scheme) {
                this.updateLabel();
            }
        }
        updateLabel() {
            // Clear any cached labels from before
            this._editorName = undefined;
            this._shortDescription = undefined;
            this._mediumDescription = undefined;
            this._longDescription = undefined;
            this._shortTitle = undefined;
            this._mediumTitle = undefined;
            this._longTitle = undefined;
            // Trigger recompute of label
            this._onDidChangeLabel.fire();
        }
        get typeId() {
            return CustomEditorInput_1.typeId;
        }
        get editorId() {
            return this.viewType;
        }
        get capabilities() {
            let capabilities = 0 /* EditorInputCapabilities.None */;
            capabilities |= 128 /* EditorInputCapabilities.CanDropIntoEditor */;
            if (!this.customEditorService.getCustomEditorCapabilities(this.viewType)?.supportsMultipleEditorsPerDocument) {
                capabilities |= 8 /* EditorInputCapabilities.Singleton */;
            }
            if (this._modelRef) {
                if (this._modelRef.object.isReadonly()) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            else {
                if (this.filesConfigurationService.isReadonly(this.resource)) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            if (this.resource.scheme === network_1.Schemas.untitled) {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            return capabilities;
        }
        getName() {
            if (typeof this._editorName !== 'string') {
                this._editorName = this.customEditorLabelService.getName(this.resource) ?? (0, path_1.basename)(this.labelService.getUriLabel(this.resource));
            }
            return this._editorName;
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.shortDescription;
                case 2 /* Verbosity.LONG */:
                    return this.longDescription;
                case 1 /* Verbosity.MEDIUM */:
                default:
                    return this.mediumDescription;
            }
        }
        get shortDescription() {
            if (typeof this._shortDescription !== 'string') {
                this._shortDescription = this.labelService.getUriBasenameLabel((0, resources_1.dirname)(this.resource));
            }
            return this._shortDescription;
        }
        get mediumDescription() {
            if (typeof this._mediumDescription !== 'string') {
                this._mediumDescription = this.labelService.getUriLabel((0, resources_1.dirname)(this.resource), { relative: true });
            }
            return this._mediumDescription;
        }
        get longDescription() {
            if (typeof this._longDescription !== 'string') {
                this._longDescription = this.labelService.getUriLabel((0, resources_1.dirname)(this.resource));
            }
            return this._longDescription;
        }
        get shortTitle() {
            if (typeof this._shortTitle !== 'string') {
                this._shortTitle = this.getName();
            }
            return this._shortTitle;
        }
        get mediumTitle() {
            if (typeof this._mediumTitle !== 'string') {
                this._mediumTitle = this.labelService.getUriLabel(this.resource, { relative: true });
            }
            return this._mediumTitle;
        }
        get longTitle() {
            if (typeof this._longTitle !== 'string') {
                this._longTitle = this.labelService.getUriLabel(this.resource);
            }
            return this._longTitle;
        }
        getTitle(verbosity) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.shortTitle;
                case 2 /* Verbosity.LONG */:
                    return this.longTitle;
                default:
                case 1 /* Verbosity.MEDIUM */:
                    return this.mediumTitle;
            }
        }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            return this === other || (other instanceof CustomEditorInput_1
                && this.viewType === other.viewType
                && (0, resources_1.isEqual)(this.resource, other.resource));
        }
        copy() {
            return CustomEditorInput_1.create(this.instantiationService, this.resource, this.viewType, this.group, this.webview.options);
        }
        isReadonly() {
            if (!this._modelRef) {
                return this.filesConfigurationService.isReadonly(this.resource);
            }
            return this._modelRef.object.isReadonly();
        }
        isDirty() {
            if (!this._modelRef) {
                return !!this._defaultDirtyState;
            }
            return this._modelRef.object.isDirty();
        }
        async save(groupId, options) {
            if (!this._modelRef) {
                return undefined;
            }
            const target = await this._modelRef.object.saveCustomEditor(options);
            if (!target) {
                return undefined; // save cancelled
            }
            // Different URIs == untyped input returned to allow resolver to possibly resolve to a different editor type
            if (!(0, resources_1.isEqual)(target, this.resource)) {
                return { resource: target };
            }
            return this;
        }
        async saveAs(groupId, options) {
            if (!this._modelRef) {
                return undefined;
            }
            const dialogPath = this._editorResource;
            const target = await this.fileDialogService.pickFileToSave(dialogPath, options?.availableFileSystems);
            if (!target) {
                return undefined; // save cancelled
            }
            if (!await this._modelRef.object.saveCustomEditorAs(this._editorResource, target, options)) {
                return undefined;
            }
            return (await this.rename(groupId, target))?.editor;
        }
        async revert(group, options) {
            if (this._modelRef) {
                return this._modelRef.object.revert(options);
            }
            this._defaultDirtyState = false;
            this._onDidChangeDirty.fire();
        }
        async resolve() {
            await super.resolve();
            if (this.isDisposed()) {
                return null;
            }
            if (!this._modelRef) {
                const oldCapabilities = this.capabilities;
                this._modelRef = this._register((0, types_1.assertIsDefined)(await this.customEditorService.models.tryRetain(this.resource, this.viewType)));
                this._register(this._modelRef.object.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
                this._register(this._modelRef.object.onDidChangeReadonly(() => this._onDidChangeCapabilities.fire()));
                // If we're loading untitled file data we should ensure it's dirty
                if (this._untitledDocumentData) {
                    this._defaultDirtyState = true;
                }
                if (this.isDirty()) {
                    this._onDidChangeDirty.fire();
                }
                if (this.capabilities !== oldCapabilities) {
                    this._onDidChangeCapabilities.fire();
                }
            }
            return null;
        }
        async rename(group, newResource) {
            // We return an untyped editor input which can then be resolved in the editor service
            return { editor: { resource: newResource } };
        }
        undo() {
            (0, types_1.assertIsDefined)(this._modelRef);
            return this.undoRedoService.undo(this.resource);
        }
        redo() {
            (0, types_1.assertIsDefined)(this._modelRef);
            return this.undoRedoService.redo(this.resource);
        }
        onMove(handler) {
            // TODO: Move this to the service
            this._moveHandler = handler;
        }
        transfer(other) {
            if (!super.transfer(other)) {
                return;
            }
            other._moveHandler = this._moveHandler;
            this._moveHandler = undefined;
            return other;
        }
        get backupId() {
            if (this._modelRef) {
                return this._modelRef.object.backupId;
            }
            return this._backupId;
        }
        get untitledDocumentData() {
            return this._untitledDocumentData;
        }
        toUntyped() {
            return {
                resource: this.resource,
                options: {
                    override: this.viewType
                }
            };
        }
        claim(claimant, targetWindow, scopedContextKeyService) {
            if (this.doCanMove(targetWindow.vscodeWindowId) !== true) {
                throw (0, editor_1.createEditorOpenError)((0, nls_1.localize)('editorUnsupportedInWindow', "Unable to open the editor in this window, it contains modifications that can only be saved in the original window."), [
                    (0, actions_1.toAction)({
                        id: 'openInOriginalWindow',
                        label: (0, nls_1.localize)('reopenInOriginalWindow', "Open in Original Window"),
                        run: async () => {
                            const originalPart = this.editorGroupsService.getPart(this.layoutService.getContainer((0, dom_1.getWindow)(this.webview.container).window));
                            const currentPart = this.editorGroupsService.getPart(this.layoutService.getContainer(targetWindow.window));
                            currentPart.activeGroup.moveEditor(this, originalPart.activeGroup);
                        }
                    })
                ], { forceMessage: true });
            }
            return super.claim(claimant, targetWindow, scopedContextKeyService);
        }
        canMove(sourceGroup, targetGroup) {
            const resolvedTargetGroup = this.editorGroupsService.getGroup(targetGroup);
            if (resolvedTargetGroup) {
                const canMove = this.doCanMove(resolvedTargetGroup.windowId);
                if (typeof canMove === 'string') {
                    return canMove;
                }
            }
            return super.canMove(sourceGroup, targetGroup);
        }
        doCanMove(targetWindowId) {
            if (this.isModified() && this._modelRef?.object.canHotExit === false) {
                const sourceWindowId = (0, dom_1.getWindow)(this.webview.container).vscodeWindowId;
                if (sourceWindowId !== targetWindowId) {
                    // The custom editor is modified, not backed by a file and without a backup.
                    // We have to assume that the modified state is enclosed into the webview
                    // managed by an extension. As such, we cannot just move the webview
                    // into another window because that means, we potentally loose the modified
                    // state and thus trigger data loss.
                    return (0, nls_1.localize)('editorCannotMove', "Unable to move '{0}': The editor contains changes that can only be saved in its current window.", this.getName());
                }
            }
            return true;
        }
    };
    exports.CustomEditorInput = CustomEditorInput;
    exports.CustomEditorInput = CustomEditorInput = CustomEditorInput_1 = __decorate([
        __param(3, webviewWorkbenchService_1.IWebviewWorkbenchService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, label_1.ILabelService),
        __param(6, customEditor_1.ICustomEditorService),
        __param(7, dialogs_1.IFileDialogService),
        __param(8, undoRedo_1.IUndoRedoService),
        __param(9, files_1.IFileService),
        __param(10, filesConfigurationService_1.IFilesConfigurationService),
        __param(11, editorGroupsService_1.IEditorGroupsService),
        __param(12, layoutService_1.IWorkbenchLayoutService),
        __param(13, customEditorLabelService_1.ICustomEditorLabelService)
    ], CustomEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRWRpdG9ySW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2N1c3RvbUVkaXRvci9icm93c2VyL2N1c3RvbUVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxQ3pGLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsMERBQWdDOztRQUV0RSxNQUFNLENBQUMsTUFBTSxDQUNaLG9CQUEyQyxFQUMzQyxRQUFhLEVBQ2IsUUFBZ0IsRUFDaEIsS0FBa0MsRUFDbEMsT0FBeUU7WUFFekUsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3JELHFFQUFxRTtnQkFDckUsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxzREFBMEIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkYsTUFBTSxvQkFBb0IsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLGlCQUFRLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7Z0JBQzlGLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDLG9CQUFvQixDQUFDO29CQUNsRSxnQkFBZ0IsRUFBRSxRQUFRO29CQUMxQixLQUFLLEVBQUUsU0FBUztvQkFDaEIsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUU7b0JBQ2xELGNBQWMsRUFBRSxFQUFFO29CQUNsQixTQUFTLEVBQUUsU0FBUztpQkFDcEIsQ0FBQyxDQUFDO2dCQUNILE1BQU0sS0FBSyxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtQkFBaUIsRUFB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