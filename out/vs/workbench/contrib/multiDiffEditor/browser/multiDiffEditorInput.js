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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/observable", "vs/base/common/observableInternal/utils", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/widget/multiDiffEditor/model", "vs/editor/browser/widget/multiDiffEditor/multiDiffEditorViewModel", "vs/editor/common/services/resolverService", "vs/editor/common/services/textResourceConfiguration", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/contrib/multiDiffEditor/browser/icons.contribution", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, async_1, errors_1, event_1, lifecycle_1, marshalling_1, network_1, objects_1, observable_1, utils_1, types_1, uri_1, model_1, multiDiffEditorViewModel_1, resolverService_1, textResourceConfiguration_1, nls_1, instantiation_1, editor_1, editorInput_1, icons_contribution_1, multiDiffSourceResolverService_1, editorResolverService_1, textfiles_1) {
    "use strict";
    var MultiDiffEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiDiffEditorSerializer = exports.MultiDiffEditorResolverContribution = exports.MultiDiffEditorInput = void 0;
    let MultiDiffEditorInput = class MultiDiffEditorInput extends editorInput_1.EditorInput {
        static { MultiDiffEditorInput_1 = this; }
        static fromResourceMultiDiffEditorInput(input, instantiationService) {
            if (!input.multiDiffSource && !input.resources) {
                throw new errors_1.BugIndicatingError('MultiDiffEditorInput requires either multiDiffSource or resources');
            }
            const multiDiffSource = input.multiDiffSource ?? uri_1.URI.parse(`multi-diff-editor:${new Date().getMilliseconds().toString() + Math.random().toString()}`);
            return instantiationService.createInstance(MultiDiffEditorInput_1, multiDiffSource, input.label, input.resources?.map(resource => {
                return new multiDiffSourceResolverService_1.MultiDiffEditorItem(resource.original.resource, resource.modified.resource);
            }), input.isTransient ?? false);
        }
        static fromSerialized(data, instantiationService) {
            return instantiationService.createInstance(MultiDiffEditorInput_1, uri_1.URI.parse(data.multiDiffSourceUri), data.label, data.resources?.map(resource => new multiDiffSourceResolverService_1.MultiDiffEditorItem(resource.originalUri ? uri_1.URI.parse(resource.originalUri) : undefined, resource.modifiedUri ? uri_1.URI.parse(resource.modifiedUri) : undefined)), false);
        }
        static { this.ID = 'workbench.input.multiDiffEditor'; }
        get resource() { return this.multiDiffSource; }
        get capabilities() { return 2 /* EditorInputCapabilities.Readonly */; }
        get typeId() { return MultiDiffEditorInput_1.ID; }
        getName() { return this._name; }
        get editorId() { return editor_1.DEFAULT_EDITOR_ASSOCIATION.id; }
        getIcon() { return icons_contribution_1.MultiDiffEditorIcon; }
        constructor(multiDiffSource, label, initialResources, isTransient = false, _textModelService, _textResourceConfigurationService, _instantiationService, _multiDiffSourceResolverService, _textFileService) {
            super();
            this.multiDiffSource = multiDiffSource;
            this.label = label;
            this.initialResources = initialResources;
            this.isTransient = isTransient;
            this._textModelService = _textModelService;
            this._textResourceConfigurationService = _textResourceConfigurationService;
            this._instantiationService = _instantiationService;
            this._multiDiffSourceResolverService = _multiDiffSourceResolverService;
            this._textFileService = _textFileService;
            this._name = '';
            this._viewModel = new async_1.LazyStatefulPromise(async () => {
                const model = await this._createModel();
                this._register(model);
                const vm = new multiDiffEditorViewModel_1.MultiDiffEditorViewModel(model, this._instantiationService);
                this._register(vm);
                await (0, async_1.raceTimeout)(vm.waitForDiffs(), 1000);
                return vm;
            });
            this._resolvedSource = new observable_1.ObservableLazyPromise(async () => {
                const source = this.initialResources
                    ? new multiDiffSourceResolverService_1.ConstResolvedMultiDiffSource(this.initialResources)
                    : await this._multiDiffSourceResolverService.resolve(this.multiDiffSource);
                return {
                    source,
                    resources: source ? (0, observable_1.observableFromEvent)(source.onDidChange, () => source.resources) : (0, utils_1.constObservable)([]),
                };
            });
            this._resources = (0, observable_1.derived)(this, reader => this._resolvedSource.cachedPromiseResult.read(reader)?.data?.resources.read(reader));
            this._isDirtyObservables = (0, utils_1.mapObservableArrayCached)(this, this._resources.map(r => r || []), res => {
                const isModifiedDirty = res.modified ? isUriDirty(this._textFileService, res.modified) : (0, utils_1.constObservable)(false);
                const isOriginalDirty = res.original ? isUriDirty(this._textFileService, res.original) : (0, utils_1.constObservable)(false);
                return (0, observable_1.derived)(reader => /** @description modifiedDirty||originalDirty */ isModifiedDirty.read(reader) || isOriginalDirty.read(reader));
            }, i => JSON.stringify([i.modified?.toString(), i.original?.toString()]));
            this._isDirtyObservable = (0, observable_1.derived)(this, reader => this._isDirtyObservables.read(reader).some(isDirty => isDirty.read(reader)))
                .keepObserved(this._store);
            this.onDidChangeDirty = event_1.Event.fromObservableLight(this._isDirtyObservable);
            this.closeHandler = {
                // TODO@bpasero TODO@hediet this is a workaround for
                // not having a better way to figure out if the
                // editors this input wraps around are opened or not
                async confirm() {
                    return 1 /* ConfirmResult.DONT_SAVE */;
                },
                showConfirm() {
                    return false;
                }
            };
            this._register((0, observable_1.autorun)((reader) => {
                /** @description Updates name */
                const resources = this._resources.read(reader) ?? [];
                const label = this.label ?? (0, nls_1.localize)('name', "Multi Diff Editor");
                this._name = label + (0, nls_1.localize)({
                    key: 'files',
                    comment: ['the number of files being shown']
                }, " ({0} files)", resources?.length ?? 0);
                this._onDidChangeLabel.fire();
            }));
        }
        serialize() {
            return {
                label: this.label,
                multiDiffSourceUri: this.multiDiffSource.toString(),
                resources: this.initialResources?.map(resource => ({
                    originalUri: resource.original?.toString(),
                    modifiedUri: resource.modified?.toString(),
                })),
            };
        }
        setLanguageId(languageId, source) {
            const activeDiffItem = this._viewModel.requireValue().activeDiffItem.get();
            const value = activeDiffItem?.entry?.value;
            if (!value) {
                return;
            }
            const target = value.modified ?? value.original;
            if (!target) {
                return;
            }
            target.setLanguage(languageId, source);
        }
        async getViewModel() {
            return this._viewModel.getPromise();
        }
        async _createModel() {
            const source = await this._resolvedSource.getPromise();
            const textResourceConfigurationService = this._textResourceConfigurationService;
            // Enables delayed disposing
            const garbage = new lifecycle_1.DisposableStore();
            const documentsWithPromises = (0, utils_1.mapObservableArrayCached)(undefined, source.resources, async (r, store) => {
                /** @description documentsWithPromises */
                let original;
                let modified;
                const store2 = new lifecycle_1.DisposableStore();
                store.add((0, lifecycle_1.toDisposable)(() => {
                    // Mark the text model references as garbage when they get stale (don't dispose them yet)
                    garbage.add(store2);
                }));
                try {
                    [original, modified] = await Promise.all([
                        r.original ? this._textModelService.createModelReference(r.original) : undefined,
                        r.modified ? this._textModelService.createModelReference(r.modified) : undefined,
                    ]);
                    if (original) {
                        store.add(original);
                    }
                    if (modified) {
                        store.add(modified);
                    }
                }
                catch (e) {
                    // e.g. "File seems to be binary and cannot be opened as text"
                    console.error(e);
                    (0, errors_1.onUnexpectedError)(e);
                    return undefined;
                }
                const uri = (r.modified ?? r.original);
                return new model_1.ConstLazyPromise({
                    original: original?.object.textEditorModel,
                    modified: modified?.object.textEditorModel,
                    get options() {
                        return {
                            ...getReadonlyConfiguration(modified?.object.isReadonly() ?? true),
                            ...computeOptions(textResourceConfigurationService.getValue(uri)),
                        };
                    },
                    onOptionsDidChange: h => this._textResourceConfigurationService.onDidChangeConfiguration(e => {
                        if (e.affectsConfiguration(uri, 'editor') || e.affectsConfiguration(uri, 'diffEditor')) {
                            h();
                        }
                    }),
                });
            }, i => JSON.stringify([i.modified?.toString(), i.original?.toString()]));
            let documents = [];
            const documentChangeEmitter = new event_1.Emitter();
            const p = event_1.Event.toPromise(documentChangeEmitter.event);
            const a = (0, observable_1.autorun)(async (reader) => {
                /** @description Update documents */
                const docsPromises = documentsWithPromises.read(reader);
                const docs = await Promise.all(docsPromises);
                documents = docs.filter(types_1.isDefined);
                documentChangeEmitter.fire();
                garbage.clear(); // Only dispose text models after the documents have been updated
            });
            await p;
            return {
                dispose: () => {
                    a.dispose();
                    garbage.dispose();
                },
                onDidChange: documentChangeEmitter.event,
                get documents() { return documents; },
                contextKeys: source.source?.contextKeys,
            };
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof MultiDiffEditorInput_1) {
                return this.multiDiffSource.toString() === otherInput.multiDiffSource.toString();
            }
            return false;
        }
        isDirty() { return this._isDirtyObservable.get(); }
        async save(group, options) {
            await this.doSaveOrRevert('save', group, options);
            return this;
        }
        revert(group, options) {
            return this.doSaveOrRevert('revert', group, options);
        }
        async doSaveOrRevert(mode, group, options) {
            const items = this._viewModel.currentValue?.items.get();
            if (items) {
                await Promise.all(items.map(async (item) => {
                    const model = item.diffEditorViewModel.model;
                    const handleOriginal = model.original.uri.scheme !== network_1.Schemas.untitled && this._textFileService.isDirty(model.original.uri); // match diff editor behaviour
                    await Promise.all([
                        handleOriginal ? mode === 'save' ? this._textFileService.save(model.original.uri, options) : this._textFileService.revert(model.original.uri, options) : Promise.resolve(),
                        mode === 'save' ? this._textFileService.save(model.modified.uri, options) : this._textFileService.revert(model.modified.uri, options),
                    ]);
                }));
            }
            return undefined;
        }
    };
    exports.MultiDiffEditorInput = MultiDiffEditorInput;
    exports.MultiDiffEditorInput = MultiDiffEditorInput = MultiDiffEditorInput_1 = __decorate([
        __param(4, resolverService_1.ITextModelService),
        __param(5, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, multiDiffSourceResolverService_1.IMultiDiffSourceResolverService),
        __param(8, textfiles_1.ITextFileService)
    ], MultiDiffEditorInput);
    function isUriDirty(textFileService, uri) {
        return (0, observable_1.observableFromEvent)(event_1.Event.filter(textFileService.files.onDidChangeDirty, e => e.resource.toString() === uri.toString()), () => textFileService.isDirty(uri));
    }
    function getReadonlyConfiguration(isReadonly) {
        return {
            readOnly: !!isReadonly,
            readOnlyMessage: typeof isReadonly !== 'boolean' ? isReadonly : undefined
        };
    }
    function computeOptions(configuration) {
        const editorConfiguration = (0, objects_1.deepClone)(configuration.editor);
        // Handle diff editor specially by merging in diffEditor configuration
        if ((0, types_1.isObject)(configuration.diffEditor)) {
            const diffEditorConfiguration = (0, objects_1.deepClone)(configuration.diffEditor);
            // User settings defines `diffEditor.codeLens`, but here we rename that to `diffEditor.diffCodeLens` to avoid collisions with `editor.codeLens`.
            diffEditorConfiguration.diffCodeLens = diffEditorConfiguration.codeLens;
            delete diffEditorConfiguration.codeLens;
            // User settings defines `diffEditor.wordWrap`, but here we rename that to `diffEditor.diffWordWrap` to avoid collisions with `editor.wordWrap`.
            diffEditorConfiguration.diffWordWrap = diffEditorConfiguration.wordWrap;
            delete diffEditorConfiguration.wordWrap;
            Object.assign(editorConfiguration, diffEditorConfiguration);
        }
        return editorConfiguration;
    }
    let MultiDiffEditorResolverContribution = class MultiDiffEditorResolverContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.multiDiffEditorResolver'; }
        constructor(editorResolverService, instantiationService) {
            super();
            this._register(editorResolverService.registerEditor(`*`, {
                id: editor_1.DEFAULT_EDITOR_ASSOCIATION.id,
                label: editor_1.DEFAULT_EDITOR_ASSOCIATION.displayName,
                detail: editor_1.DEFAULT_EDITOR_ASSOCIATION.providerDisplayName,
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createMultiDiffEditorInput: (multiDiffEditor) => {
                    return {
                        editor: MultiDiffEditorInput.fromResourceMultiDiffEditorInput(multiDiffEditor, instantiationService),
                    };
                },
            }));
        }
    };
    exports.MultiDiffEditorResolverContribution = MultiDiffEditorResolverContribution;
    exports.MultiDiffEditorResolverContribution = MultiDiffEditorResolverContribution = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, instantiation_1.IInstantiationService)
    ], MultiDiffEditorResolverContribution);
    class MultiDiffEditorSerializer {
        canSerialize(editor) {
            return editor instanceof MultiDiffEditorInput && !editor.isTransient;
        }
        serialize(editor) {
            if (!this.canSerialize(editor)) {
                return undefined;
            }
            return JSON.stringify(editor.serialize());
        }
        deserialize(instantiationService, serializedEditor) {
            try {
                const data = (0, marshalling_1.parse)(serializedEditor);
                return MultiDiffEditorInput.fromSerialized(data, instantiationService);
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
                return undefined;
            }
        }
    }
    exports.MultiDiffEditorSerializer = MultiDiffEditorSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9ySW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL211bHRpRGlmZkVkaXRvci9icm93c2VyL211bHRpRGlmZkVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUErQnpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEseUJBQVc7O1FBQzdDLE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFvQyxFQUFFLG9CQUEyQztZQUMvSCxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxJQUFJLDJCQUFrQixDQUFDLG1FQUFtRSxDQUFDLENBQUM7WUFDbkcsQ0FBQztZQUNELE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsSUFBSSxJQUFJLEVBQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RKLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUN6QyxzQkFBb0IsRUFDcEIsZUFBZSxFQUNmLEtBQUssQ0FBQyxLQUFLLEVBQ1gsS0FBSyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sSUFBSSxvREFBbUIsQ0FDN0IsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQzFCLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUMxQixDQUFDO1lBQ0gsQ0FBQyxDQUFDLEVBQ0YsS0FBSyxDQUFDLFdBQVcsSUFBSSxLQUFL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