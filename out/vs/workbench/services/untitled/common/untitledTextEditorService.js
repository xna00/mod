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
define(["require", "exports", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/untitled/common/untitledTextEditorModel", "vs/platform/configuration/common/configuration", "vs/base/common/event", "vs/base/common/map", "vs/base/common/network", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions"], function (require, exports, uri_1, instantiation_1, untitledTextEditorModel_1, configuration_1, event_1, map_1, network_1, lifecycle_1, extensions_1) {
    "use strict";
    var UntitledTextEditorService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorService = exports.IUntitledTextEditorService = void 0;
    exports.IUntitledTextEditorService = (0, instantiation_1.createDecorator)('untitledTextEditorService');
    let UntitledTextEditorService = class UntitledTextEditorService extends lifecycle_1.Disposable {
        static { UntitledTextEditorService_1 = this; }
        static { this.UNTITLED_WITHOUT_ASSOCIATED_RESOURCE_REGEX = /Untitled-\d+/; }
        constructor(instantiationService, configurationService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this._onDidCreate = this._register(new event_1.Emitter());
            this.onDidCreate = this._onDidCreate.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this._onDidChangeLabel = this._register(new event_1.Emitter());
            this.onDidChangeLabel = this._onDidChangeLabel.event;
            this.mapResourceToModel = new map_1.ResourceMap();
        }
        get(resource) {
            return this.mapResourceToModel.get(resource);
        }
        getValue(resource) {
            return this.get(resource)?.textEditorModel?.getValue();
        }
        async resolve(options) {
            const model = this.doCreateOrGet(options);
            await model.resolve();
            return model;
        }
        create(options) {
            return this.doCreateOrGet(options);
        }
        doCreateOrGet(options = Object.create(null)) {
            const massagedOptions = this.massageOptions(options);
            // Return existing instance if asked for it
            if (massagedOptions.untitledResource && this.mapResourceToModel.has(massagedOptions.untitledResource)) {
                return this.mapResourceToModel.get(massagedOptions.untitledResource);
            }
            // Create new instance otherwise
            return this.doCreate(massagedOptions);
        }
        massageOptions(options) {
            const massagedOptions = Object.create(null);
            // Figure out associated and untitled resource
            if (options.associatedResource) {
                massagedOptions.untitledResource = uri_1.URI.from({
                    scheme: network_1.Schemas.untitled,
                    authority: options.associatedResource.authority,
                    fragment: options.associatedResource.fragment,
                    path: options.associatedResource.path,
                    query: options.associatedResource.query
                });
                massagedOptions.associatedResource = options.associatedResource;
            }
            else {
                if (options.untitledResource?.scheme === network_1.Schemas.untitled) {
                    massagedOptions.untitledResource = options.untitledResource;
                }
            }
            // Language id
            if (options.languageId) {
                massagedOptions.languageId = options.languageId;
            }
            else if (!massagedOptions.associatedResource) {
                const configuration = this.configurationService.getValue();
                if (configuration.files?.defaultLanguage) {
                    massagedOptions.languageId = configuration.files.defaultLanguage;
                }
            }
            // Take over encoding and initial value
            massagedOptions.encoding = options.encoding;
            massagedOptions.initialValue = options.initialValue;
            return massagedOptions;
        }
        doCreate(options) {
            // Create a new untitled resource if none is provided
            let untitledResource = options.untitledResource;
            if (!untitledResource) {
                let counter = 1;
                do {
                    untitledResource = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: `Untitled-${counter}` });
                    counter++;
                } while (this.mapResourceToModel.has(untitledResource));
            }
            // Create new model with provided options
            const model = this._register(this.instantiationService.createInstance(untitledTextEditorModel_1.UntitledTextEditorModel, untitledResource, !!options.associatedResource, options.initialValue, options.languageId, options.encoding));
            this.registerModel(model);
            return model;
        }
        registerModel(model) {
            // Install model listeners
            const modelListeners = new lifecycle_1.DisposableStore();
            modelListeners.add(model.onDidChangeDirty(() => this._onDidChangeDirty.fire(model)));
            modelListeners.add(model.onDidChangeName(() => this._onDidChangeLabel.fire(model)));
            modelListeners.add(model.onDidChangeEncoding(() => this._onDidChangeEncoding.fire(model)));
            modelListeners.add(model.onWillDispose(() => this._onWillDispose.fire(model)));
            // Remove from cache on dispose
            event_1.Event.once(model.onWillDispose)(() => {
                // Registry
                this.mapResourceToModel.delete(model.resource);
                // Listeners
                modelListeners.dispose();
            });
            // Add to cache
            this.mapResourceToModel.set(model.resource, model);
            // Emit as event
            this._onDidCreate.fire(model);
            // If the model is dirty right from the beginning,
            // make sure to emit this as an event
            if (model.isDirty()) {
                this._onDidChangeDirty.fire(model);
            }
        }
        isUntitledWithAssociatedResource(resource) {
            return resource.scheme === network_1.Schemas.untitled && resource.path.length > 1 && !UntitledTextEditorService_1.UNTITLED_WITHOUT_ASSOCIATED_RESOURCE_REGEX.test(resource.path);
        }
        canDispose(model) {
            if (model.isDisposed()) {
                return true; // quick return if model already disposed
            }
            // promise based return in all other cases
            return this.doCanDispose(model);
        }
        async doCanDispose(model) {
            // dirty model: we do not allow to dispose dirty models to prevent
            // data loss cases. dirty models can only be disposed when they are
            // either saved or reverted
            if (model.isDirty()) {
                await event_1.Event.toPromise(model.onDidChangeDirty);
                return this.canDispose(model);
            }
            return true;
        }
    };
    exports.UntitledTextEditorService = UntitledTextEditorService;
    exports.UntitledTextEditorService = UntitledTextEditorService = UntitledTextEditorService_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService)
    ], UntitledTextEditorService);
    (0, extensions_1.registerSingleton)(exports.IUntitledTextEditorService, UntitledTextEditorService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRUZXh0RWRpdG9yU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VudGl0bGVkL2NvbW1vbi91bnRpdGxlZFRleHRFZGl0b3JTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFhbkYsUUFBQSwwQkFBMEIsR0FBRyxJQUFBLCtCQUFlLEVBQTZCLDJCQUEyQixDQUFDLENBQUM7SUEwSDVHLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQVU7O2lCQUloQywrQ0FBMEMsR0FBRyxjQUFjLEFBQWpCLENBQWtCO1FBbUJwRixZQUN3QixvQkFBNEQsRUFDNUQsb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBSGdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQW5CbkUsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBNEIsQ0FBQyxDQUFDO1lBQ3BGLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFFeEMseUJBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBNEIsQ0FBQyxDQUFDO1lBQ3ZGLHdCQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFFOUMsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE0QixDQUFDLENBQUM7WUFDL0UsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUU5QixtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFP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