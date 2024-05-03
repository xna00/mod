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
define(["require", "exports", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/editor/common/services/model", "vs/workbench/common/editor/textResourceEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/network", "vs/editor/common/services/resolverService", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/undoRedo/common/undoRedo", "vs/editor/common/services/modelUndoRedoParticipant", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/untitled/common/untitledTextEditorModel"], function (require, exports, uri_1, instantiation_1, lifecycle_1, model_1, textResourceEditorModel_1, textfiles_1, network_1, resolverService_1, textFileEditorModel_1, files_1, extensions_1, undoRedo_1, modelUndoRedoParticipant_1, uriIdentity_1, untitledTextEditorModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextModelResolverService = void 0;
    let ResourceModelCollection = class ResourceModelCollection extends lifecycle_1.ReferenceCollection {
        constructor(instantiationService, textFileService, fileService, modelService) {
            super();
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.fileService = fileService;
            this.modelService = modelService;
            this.providers = new Map();
            this.modelsToDispose = new Set();
        }
        createReferencedObject(key) {
            return this.doCreateReferencedObject(key);
        }
        async doCreateReferencedObject(key, skipActivateProvider) {
            // Untrack as being disposed
            this.modelsToDispose.delete(key);
            // inMemory Schema: go through model service cache
            const resource = uri_1.URI.parse(key);
            if (resource.scheme === network_1.Schemas.inMemory) {
                const cachedModel = this.modelService.getModel(resource);
                if (!cachedModel) {
                    throw new Error(`Unable to resolve inMemory resource ${key}`);
                }
                const model = this.instantiationService.createInstance(textResourceEditorModel_1.TextResourceEditorModel, resource);
                if (this.ensureResolvedModel(model, key)) {
                    return model;
                }
            }
            // Untitled Schema: go through untitled text service
            if (resource.scheme === network_1.Schemas.untitled) {
                const model = await this.textFileService.untitled.resolve({ untitledResource: resource });
                if (this.ensureResolvedModel(model, key)) {
                    return model;
                }
            }
            // File or remote file: go through text file service
            if (this.fileService.hasProvider(resource)) {
                const model = await this.textFileService.files.resolve(resource, { reason: 2 /* TextFileResolveReason.REFERENCE */ });
                if (this.ensureResolvedModel(model, key)) {
                    return model;
                }
            }
            // Virtual documents
            if (this.providers.has(resource.scheme)) {
                await this.resolveTextModelContent(key);
                const model = this.instantiationService.createInstance(textResourceEditorModel_1.TextResourceEditorModel, resource);
                if (this.ensureResolvedModel(model, key)) {
                    return model;
                }
            }
            // Either unknown schema, or not yet registered, try to activate
            if (!skipActivateProvider) {
                await this.fileService.activateProvider(resource.scheme);
                return this.doCreateReferencedObject(key, true);
            }
            throw new Error(`Unable to resolve resource ${key}`);
        }
        ensureResolvedModel(model, key) {
            if ((0, resolverService_1.isResolvedTextEditorModel)(model)) {
                return true;
            }
            throw new Error(`Unable to resolve resource ${key}`);
        }
        destroyReferencedObject(key, modelPromise) {
            // inMemory is bound to a different lifecycle
            const resource = uri_1.URI.parse(key);
            if (resource.scheme === network_1.Schemas.inMemory) {
                return;
            }
            // Track as being disposed before waiting for model to load
            // to handle the case that the reference is acquired again
            this.modelsToDispose.add(key);
            (async () => {
                try {
                    const model = await modelPromise;
                    if (!this.modelsToDispose.has(key)) {
                        // return if model has been acquired again meanwhile
                        return;
                    }
                    if (model instanceof textFileEditorModel_1.TextFileEditorModel) {
                        // text file models have conditions that prevent them
                        // from dispose, so we have to wait until we can dispose
                        await this.textFileService.files.canDispose(model);
                    }
                    else if (model instanceof untitledTextEditorModel_1.UntitledTextEditorModel) {
                        // untitled file models have conditions that prevent them
                        // from dispose, so we have to wait until we can dispose
                        await this.textFileService.untitled.canDispose(model);
                    }
                    if (!this.modelsToDispose.has(key)) {
                        // return if model has been acquired again meanwhile
                        return;
                    }
                    // Finally we can dispose the model
                    model.dispose();
                }
                catch (error) {
                    // ignore
                }
                finally {
                    this.modelsToDispose.delete(key); // Untrack as being disposed
                }
            })();
        }
        registerTextModelContentProvider(scheme, provider) {
            let providers = this.providers.get(scheme);
            if (!providers) {
                providers = [];
                this.providers.set(scheme, providers);
            }
            providers.unshift(provider);
            return (0, lifecycle_1.toDisposable)(() => {
                const providersForScheme = this.providers.get(scheme);
                if (!providersForScheme) {
                    return;
                }
                const index = providersForScheme.indexOf(provider);
                if (index === -1) {
                    return;
                }
                providersForScheme.splice(index, 1);
                if (providersForScheme.length === 0) {
                    this.providers.delete(scheme);
                }
            });
        }
        hasTextModelContentProvider(scheme) {
            return this.providers.get(scheme) !== undefined;
        }
        async resolveTextModelContent(key) {
            const resource = uri_1.URI.parse(key);
            const providersForScheme = this.providers.get(resource.scheme) || [];
            for (const provider of providersForScheme) {
                const value = await provider.provideTextContent(resource);
                if (value) {
                    return value;
                }
            }
            throw new Error(`Unable to resolve text model content for resource ${key}`);
        }
    };
    ResourceModelCollection = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, files_1.IFileService),
        __param(3, model_1.IModelService)
    ], ResourceModelCollection);
    let TextModelResolverService = class TextModelResolverService extends lifecycle_1.Disposable {
        get resourceModelCollection() {
            if (!this._resourceModelCollection) {
                this._resourceModelCollection = this.instantiationService.createInstance(ResourceModelCollection);
            }
            return this._resourceModelCollection;
        }
        get asyncModelCollection() {
            if (!this._asyncModelCollection) {
                this._asyncModelCollection = new lifecycle_1.AsyncReferenceCollection(this.resourceModelCollection);
            }
            return this._asyncModelCollection;
        }
        constructor(instantiationService, fileService, undoRedoService, modelService, uriIdentityService) {
            super();
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.undoRedoService = undoRedoService;
            this.modelService = modelService;
            this.uriIdentityService = uriIdentityService;
            this._resourceModelCollection = undefined;
            this._asyncModelCollection = undefined;
            this._register(new modelUndoRedoParticipant_1.ModelUndoRedoParticipant(this.modelService, this, this.undoRedoService));
        }
        async createModelReference(resource) {
            // From this moment on, only operate on the canonical resource
            // to ensure we reduce the chance of resolving the same resource
            // with different resource forms (e.g. path casing on Windows)
            resource = this.uriIdentityService.asCanonicalUri(resource);
            return await this.asyncModelCollection.acquire(resource.toString());
        }
        registerTextModelContentProvider(scheme, provider) {
            return this.resourceModelCollection.registerTextModelContentProvider(scheme, provider);
        }
        canHandleResource(resource) {
            if (this.fileService.hasProvider(resource) || resource.scheme === network_1.Schemas.untitled || resource.scheme === network_1.Schemas.inMemory) {
                return true; // we handle file://, untitled:// and inMemory:// automatically
            }
            return this.resourceModelCollection.hasTextModelContentProvider(resource.scheme);
        }
    };
    exports.TextModelResolverService = TextModelResolverService;
    exports.TextModelResolverService = TextModelResolverService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, files_1.IFileService),
        __param(2, undoRedo_1.IUndoRedoService),
        __param(3, model_1.IModelService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], TextModelResolverService);
    (0, extensions_1.registerSingleton)(resolverService_1.ITextModelService, TextModelResolverService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dG1vZGVsUmVzb2x2ZXIvY29tbW9uL3RleHRNb2RlbFJlc29sdmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsK0JBQXNEO1FBSzNGLFlBQ3dCLG9CQUE0RCxFQUNqRSxlQUFrRCxFQUN0RCxXQUEwQyxFQUN6QyxZQUE0QztZQUUzRCxLQUFLLEVBQUUsQ0FBQztZQUxnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2hELG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNyQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN4QixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQVAzQyxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQXVDLENBQUM7WUFDM0Qsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBU3JELENBQUM7UUFFUyxzQkFBc0IsQ0FBQyxHQUFXO1lBQzNDLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFTyxLQUFLLENBQUMsd0JBQXdCLENBQUMsR0FBVyxFQUFFLG9CQUE4QjtZQUVqRiw0QkFBNEI7WUFDNUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFakMsa0RBQWtEO1lBQ2xELE1BQU0sUUFBUSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEMsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7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