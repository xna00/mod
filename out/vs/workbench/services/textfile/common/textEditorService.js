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
define(["require", "exports", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/base/common/map", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/base/common/network", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorResolverService", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions"], function (require, exports, event_1, platform_1, map_1, instantiation_1, editor_1, untitledTextEditorService_1, network_1, diffEditorInput_1, sideBySideEditorInput_1, textResourceEditorInput_1, untitledTextEditorInput_1, resources_1, uri_1, uriIdentity_1, files_1, editorResolverService_1, lifecycle_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextEditorService = exports.ITextEditorService = void 0;
    exports.ITextEditorService = (0, instantiation_1.createDecorator)('textEditorService');
    let TextEditorService = class TextEditorService extends lifecycle_1.Disposable {
        constructor(untitledTextEditorService, instantiationService, uriIdentityService, fileService, editorResolverService) {
            super();
            this.untitledTextEditorService = untitledTextEditorService;
            this.instantiationService = instantiationService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.editorResolverService = editorResolverService;
            this.editorInputCache = new map_1.ResourceMap();
            this.fileEditorFactory = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).getFileEditorFactory();
            // Register the default editor to the editor resolver
            // service so that it shows up in the editors picker
            this.registerDefaultEditor();
        }
        registerDefaultEditor() {
            this._register(this.editorResolverService.registerEditor('*', {
                id: editor_1.DEFAULT_EDITOR_ASSOCIATION.id,
                label: editor_1.DEFAULT_EDITOR_ASSOCIATION.displayName,
                detail: editor_1.DEFAULT_EDITOR_ASSOCIATION.providerDisplayName,
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createEditorInput: editor => ({ editor: this.createTextEditor(editor) }),
                createUntitledEditorInput: untitledEditor => ({ editor: this.createTextEditor(untitledEditor) }),
                createDiffEditorInput: diffEditor => ({ editor: this.createTextEditor(diffEditor) })
            }));
        }
        async resolveTextEditor(input) {
            return this.createTextEditor(input);
        }
        createTextEditor(input) {
            // Merge Editor Not Supported (we fallback to showing the result only)
            if ((0, editor_1.isResourceMergeEditorInput)(input)) {
                return this.createTextEditor(input.result);
            }
            // Diff Editor Support
            if ((0, editor_1.isResourceDiffEditorInput)(input)) {
                const original = this.createTextEditor(input.original);
                const modified = this.createTextEditor(input.modified);
                return this.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, input.label, input.description, original, modified, undefined);
            }
            // Side by Side Editor Support
            if ((0, editor_1.isResourceSideBySideEditorInput)(input)) {
                const primary = this.createTextEditor(input.primary);
                const secondary = this.createTextEditor(input.secondary);
                return this.instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, input.label, input.description, secondary, primary);
            }
            // Untitled text file support
            const untitledInput = input;
            if (untitledInput.forceUntitled || !untitledInput.resource || (untitledInput.resource.scheme === network_1.Schemas.untitled)) {
                const untitledOptions = {
                    languageId: untitledInput.languageId,
                    initialValue: untitledInput.contents,
                    encoding: untitledInput.encoding
                };
                // Untitled resource: use as hint for an existing untitled editor
                let untitledModel;
                if (untitledInput.resource?.scheme === network_1.Schemas.untitled) {
                    untitledModel = this.untitledTextEditorService.create({ untitledResource: untitledInput.resource, ...untitledOptions });
                }
                // Other resource: use as hint for associated filepath
                else {
                    untitledModel = this.untitledTextEditorService.create({ associatedResource: untitledInput.resource, ...untitledOptions });
                }
                return this.createOrGetCached(untitledModel.resource, () => this.instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, untitledModel));
            }
            // Text File/Resource Editor Support
            const textResourceEditorInput = input;
            if (textResourceEditorInput.resource instanceof uri_1.URI) {
                // Derive the label from the path if not provided explicitly
                const label = textResourceEditorInput.label || (0, resources_1.basename)(textResourceEditorInput.resource);
                // We keep track of the preferred resource this input is to be created
                // with but it may be different from the canonical resource (see below)
                const preferredResource = textResourceEditorInput.resource;
                // From this moment on, only operate on the canonical resource
                // to ensure we reduce the chance of opening the same resource
                // with different resource forms (e.g. path casing on Windows)
                const canonicalResource = this.uriIdentityService.asCanonicalUri(preferredResource);
                return this.createOrGetCached(canonicalResource, () => {
                    // File
                    if (textResourceEditorInput.forceFile || this.fileService.hasProvider(canonicalResource)) {
                        return this.fileEditorFactory.createFileEditor(canonicalResource, preferredResource, textResourceEditorInput.label, textResourceEditorInput.description, textResourceEditorInput.encoding, textResourceEditorInput.languageId, textResourceEditorInput.contents, this.instantiationService);
                    }
                    // Resource
                    return this.instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, canonicalResource, textResourceEditorInput.label, textResourceEditorInput.description, textResourceEditorInput.languageId, textResourceEditorInput.contents);
                }, cachedInput => {
                    // Untitled
                    if (cachedInput instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
                        return;
                    }
                    // Files
                    else if (!(cachedInput instanceof textResourceEditorInput_1.TextResourceEditorInput)) {
                        cachedInput.setPreferredResource(preferredResource);
                        if (textResourceEditorInput.label) {
                            cachedInput.setPreferredName(textResourceEditorInput.label);
                        }
                        if (textResourceEditorInput.description) {
                            cachedInput.setPreferredDescription(textResourceEditorInput.description);
                        }
                        if (textResourceEditorInput.encoding) {
                            cachedInput.setPreferredEncoding(textResourceEditorInput.encoding);
                        }
                        if (textResourceEditorInput.languageId) {
                            cachedInput.setPreferredLanguageId(textResourceEditorInput.languageId);
                        }
                        if (typeof textResourceEditorInput.contents === 'string') {
                            cachedInput.setPreferredContents(textResourceEditorInput.contents);
                        }
                    }
                    // Resources
                    else {
                        if (label) {
                            cachedInput.setName(label);
                        }
                        if (textResourceEditorInput.description) {
                            cachedInput.setDescription(textResourceEditorInput.description);
                        }
                        if (textResourceEditorInput.languageId) {
                            cachedInput.setPreferredLanguageId(textResourceEditorInput.languageId);
                        }
                        if (typeof textResourceEditorInput.contents === 'string') {
                            cachedInput.setPreferredContents(textResourceEditorInput.contents);
                        }
                    }
                });
            }
            throw new Error(`ITextEditorService: Unable to create texteditor from ${JSON.stringify(input)}`);
        }
        createOrGetCached(resource, factoryFn, cachedFn) {
            // Return early if already cached
            let input = this.editorInputCache.get(resource);
            if (input) {
                cachedFn?.(input);
                return input;
            }
            // Otherwise create and add to cache
            input = factoryFn();
            this.editorInputCache.set(resource, input);
            event_1.Event.once(input.onWillDispose)(() => this.editorInputCache.delete(resource));
            return input;
        }
    };
    exports.TextEditorService = TextEditorService;
    exports.TextEditorService = TextEditorService = __decorate([
        __param(0, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, files_1.IFileService),
        __param(4, editorResolverService_1.IEditorResolverService)
    ], TextEditorService);
    (0, extensions_1.registerSingleton)(exports.ITextEditorService, TextEditorService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEVkaXRvclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0ZmlsZS9jb21tb24vdGV4dEVkaXRvclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJuRixRQUFBLGtCQUFrQixHQUFHLElBQUEsK0JBQWUsRUFBcUIsbUJBQW1CLENBQUMsQ0FBQztJQStCcEYsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSxzQkFBVTtRQVFoRCxZQUM2Qix5QkFBc0UsRUFDM0Usb0JBQTRELEVBQzlELGtCQUF3RCxFQUMvRCxXQUEwQyxFQUNoQyxxQkFBOEQ7WUFFdEYsS0FBSyxFQUFFLENBQUM7WUFOcUMsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUE0QjtZQUMxRCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzdDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDOUMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDZiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBVHRFLHFCQUFnQixHQUFHLElBQUksaUJBQVcsRUFBd0UsQ0FBQztZQUUzRyxzQkFBaUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIseUJBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQVcvSCxxREFBcUQ7WUFDckQsb0RBQW9EO1lBQ3BELElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFTyxxQkFBcUI7WUFDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUN2RCxHQUFHLEVBQ0g7Z0JBQ0MsRUFBRSxFQUFFLG1DQUEwQixDQUFDLEVBQUU7Z0JB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