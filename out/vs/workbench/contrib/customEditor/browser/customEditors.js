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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/customEditor/common/customEditorModelManager", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/editor/common/editorService", "../common/contributedCustomEditors", "./customEditorInput", "vs/css!./media/customEditor"], function (require, exports, arrays_1, event_1, lifecycle_1, network_1, resources_1, types_1, uri_1, editorExtensions_1, contextkey_1, files_1, instantiation_1, platform_1, storage_1, uriIdentity_1, editor_1, diffEditorInput_1, customEditor_1, customEditorModelManager_1, editorGroupsService_1, editorResolverService_1, editorService_1, contributedCustomEditors_1, customEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorService = void 0;
    let CustomEditorService = class CustomEditorService extends lifecycle_1.Disposable {
        constructor(contextKeyService, fileService, storageService, editorService, editorGroupService, instantiationService, uriIdentityService, editorResolverService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.instantiationService = instantiationService;
            this.uriIdentityService = uriIdentityService;
            this.editorResolverService = editorResolverService;
            this._untitledCounter = 0;
            this._editorResolverDisposables = this._register(new lifecycle_1.DisposableStore());
            this._editorCapabilities = new Map();
            this._models = new customEditorModelManager_1.CustomEditorModelManager();
            this._onDidChangeEditorTypes = this._register(new event_1.Emitter());
            this.onDidChangeEditorTypes = this._onDidChangeEditorTypes.event;
            this._fileEditorFactory = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).getFileEditorFactory();
            this._activeCustomEditorId = customEditor_1.CONTEXT_ACTIVE_CUSTOM_EDITOR_ID.bindTo(contextKeyService);
            this._focusedCustomEditorIsEditable = customEditor_1.CONTEXT_FOCUSED_CUSTOM_EDITOR_IS_EDITABLE.bindTo(contextKeyService);
            this._contributedEditors = this._register(new contributedCustomEditors_1.ContributedCustomEditors(storageService));
            // Register the contribution points only emitting one change from the resolver
            this.editorResolverService.bufferChangeEvents(this.registerContributionPoints.bind(this));
            this._register(this._contributedEditors.onChange(() => {
                // Register the contribution points only emitting one change from the resolver
                this.editorResolverService.bufferChangeEvents(this.registerContributionPoints.bind(this));
                this.updateContexts();
                this._onDidChangeEditorTypes.fire();
            }));
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateContexts()));
            this._register(fileService.onDidRunOperation(e => {
                if (e.isOperation(2 /* FileOperation.MOVE */)) {
                    this.handleMovedFileInOpenedFileEditors(e.resource, this.uriIdentityService.asCanonicalUri(e.target.resource));
                }
            }));
            const PRIORITY = 105;
            this._register(editorExtensions_1.UndoCommand.addImplementation(PRIORITY, 'custom-editor', () => {
                return this.withActiveCustomEditor(editor => editor.undo());
            }));
            this._register(editorExtensions_1.RedoCommand.addImplementation(PRIORITY, 'custom-editor', () => {
                return this.withActiveCustomEditor(editor => editor.redo());
            }));
            this.updateContexts();
        }
        getEditorTypes() {
            return [...this._contributedEditors];
        }
        withActiveCustomEditor(f) {
            const activeEditor = this.editorService.activeEditor;
            if (activeEditor instanceof customEditorInput_1.CustomEditorInput) {
                const result = f(activeEditor);
                if (result) {
                    return result;
                }
                return true;
            }
            return false;
        }
        registerContributionPoints() {
            // Clear all previous contributions we know
            this._editorResolverDisposables.clear();
            for (const contributedEditor of this._contributedEditors) {
                for (const globPattern of contributedEditor.selector) {
                    if (!globPattern.filenamePattern) {
                        continue;
                    }
                    this._editorResolverDisposables.add(this.editorResolverService.registerEditor(globPattern.filenamePattern, {
                        id: contributedEditor.id,
                        label: contributedEditor.displayName,
                        detail: contributedEditor.providerDisplayName,
                        priority: contributedEditor.priority,
                    }, {
                        singlePerResource: () => !this.getCustomEditorCapabilities(contributedEditor.id)?.supportsMultipleEditorsPerDocument ?? true
                    }, {
                        createEditorInput: ({ resource }, group) => {
                            return { editor: customEditorInput_1.CustomEditorInput.create(this.instantiationService, resource, contributedEditor.id, group.id) };
                        },
                        createUntitledEditorInput: ({ resource }, group) => {
                            return { editor: customEditorInput_1.CustomEditorInput.create(this.instantiationService, resource ?? uri_1.URI.from({ scheme: network_1.Schemas.untitled, authority: `Untitled-${this._untitledCounter++}` }), contributedEditor.id, group.id) };
                        },
                        createDiffEditorInput: (diffEditorInput, group) => {
                            return { editor: this.createDiffEditorInput(diffEditorInput, contributedEditor.id, group) };
                        },
                    }));
                }
            }
        }
        createDiffEditorInput(editor, editorID, group) {
            const modifiedOverride = customEditorInput_1.CustomEditorInput.create(this.instantiationService, (0, types_1.assertIsDefined)(editor.modified.resource), editorID, group.id, { customClasses: 'modified' });
            const originalOverride = customEditorInput_1.CustomEditorInput.create(this.instantiationService, (0, types_1.assertIsDefined)(editor.original.resource), editorID, group.id, { customClasses: 'original' });
            return this.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, editor.label, editor.description, originalOverride, modifiedOverride, true);
        }
        get models() { return this._models; }
        getCustomEditor(viewType) {
            return this._contributedEditors.get(viewType);
        }
        getContributedCustomEditors(resource) {
            return new customEditor_1.CustomEditorInfoCollection(this._contributedEditors.getContributedEditors(resource));
        }
        getUserConfiguredCustomEditors(resource) {
            const resourceAssocations = this.editorResolverService.getAssociationsForResource(resource);
            return new customEditor_1.CustomEditorInfoCollection((0, arrays_1.coalesce)(resourceAssocations
                .map(association => this._contributedEditors.get(association.viewType))));
        }
        getAllCustomEditors(resource) {
            return new customEditor_1.CustomEditorInfoCollection([
                ...this.getUserConfiguredCustomEditors(resource).allEditors,
                ...this.getContributedCustomEditors(resource).allEditors,
            ]);
        }
        registerCustomEditorCapabilities(viewType, options) {
            if (this._editorCapabilities.has(viewType)) {
                throw new Error(`Capabilities for ${viewType} already set`);
            }
            this._editorCapabilities.set(viewType, options);
            return (0, lifecycle_1.toDisposable)(() => {
                this._editorCapabilities.delete(viewType);
            });
        }
        getCustomEditorCapabilities(viewType) {
            return this._editorCapabilities.get(viewType);
        }
        updateContexts() {
            const activeEditorPane = this.editorService.activeEditorPane;
            const resource = activeEditorPane?.input?.resource;
            if (!resource) {
                this._activeCustomEditorId.reset();
                this._focusedCustomEditorIsEditable.reset();
                return;
            }
            this._activeCustomEditorId.set(activeEditorPane?.input instanceof customEditorInput_1.CustomEditorInput ? activeEditorPane.input.viewType : '');
            this._focusedCustomEditorIsEditable.set(activeEditorPane?.input instanceof customEditorInput_1.CustomEditorInput);
        }
        async handleMovedFileInOpenedFileEditors(oldResource, newResource) {
            if ((0, resources_1.extname)(oldResource).toLowerCase() === (0, resources_1.extname)(newResource).toLowerCase()) {
                return;
            }
            const possibleEditors = this.getAllCustomEditors(newResource);
            // See if we have any non-optional custom editor for this resource
            if (!possibleEditors.allEditors.some(editor => editor.priority !== editorResolverService_1.RegisteredEditorPriority.option)) {
                return;
            }
            // If so, check all editors to see if there are any file editors open for the new resource
            const editorsToReplace = new Map();
            for (const group of this.editorGroupService.groups) {
                for (const editor of group.editors) {
                    if (this._fileEditorFactory.isFileEditor(editor)
                        && !(editor instanceof customEditorInput_1.CustomEditorInput)
                        && (0, resources_1.isEqual)(editor.resource, newResource)) {
                        let entry = editorsToReplace.get(group.id);
                        if (!entry) {
                            entry = [];
                            editorsToReplace.set(group.id, entry);
                        }
                        entry.push(editor);
                    }
                }
            }
            if (!editorsToReplace.size) {
                return;
            }
            for (const [group, entries] of editorsToReplace) {
                this.editorService.replaceEditors(entries.map(editor => {
                    let replacement;
                    if (possibleEditors.defaultEditor) {
                        const viewType = possibleEditors.defaultEditor.id;
                        replacement = customEditorInput_1.CustomEditorInput.create(this.instantiationService, newResource, viewType, group);
                    }
                    else {
                        replacement = { resource: newResource, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
                    }
                    return {
                        editor,
                        replacement,
                        options: {
                            preserveFocus: true,
                        }
                    };
                }), group);
            }
        }
    };
    exports.CustomEditorService = CustomEditorService;
    exports.CustomEditorService = CustomEditorService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, files_1.IFileService),
        __param(2, storage_1.IStorageService),
        __param(3, editorService_1.IEditorService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, editorResolverService_1.IEditorResolverService)
    ], CustomEditorService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRWRpdG9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY3VzdG9tRWRpdG9yL2Jyb3dzZXIvY3VzdG9tRWRpdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE2QnpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFrQmxELFlBQ3FCLGlCQUFxQyxFQUMzQyxXQUF5QixFQUN0QixjQUErQixFQUNoQyxhQUE4QyxFQUN4QyxrQkFBeUQsRUFDeEQsb0JBQTRELEVBQzlELGtCQUF3RCxFQUNyRCxxQkFBOEQ7WUFFdEYsS0FBSyxFQUFFLENBQUM7WUFOeUIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3ZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDdkMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3BDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUF0Qi9FLHFCQUFnQixHQUFHLENBQUMsQ0FBQztZQUNaLCtCQUEwQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUNuRSx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBb0MsQ0FBQztZQUVsRSxZQUFPLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBS3pDLDRCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQy9ELDJCQUFzQixHQUFnQixJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1lBRXhFLHVCQUFrQixHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF5Qix5QkFBZ0IsQ0FB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