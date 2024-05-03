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
define(["require", "exports", "vs/base/common/event", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/common/services/model", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/workbench/common/editor", "vs/workbench/common/memento", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/searchEditor/browser/searchEditorModel", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/path/common/pathService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/configuration/common/configuration", "vs/base/common/buffer", "vs/workbench/common/editor/editorInput", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/css!./media/searchEditor"], function (require, exports, event_1, path_1, resources_1, uri_1, model_1, nls_1, dialogs_1, instantiation_1, storage_1, telemetry_1, editor_1, memento_1, constants_1, searchEditorModel_1, searchEditorSerialization_1, pathService_1, textfiles_1, workingCopyService_1, configuration_1, buffer_1, editorInput_1, codicons_1, iconRegistry_1) {
    "use strict";
    var SearchEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getOrMakeSearchEditorInput = exports.SearchEditorInput = exports.SEARCH_EDITOR_EXT = void 0;
    exports.SEARCH_EDITOR_EXT = '.code-search';
    const SearchEditorIcon = (0, iconRegistry_1.registerIcon)('search-editor-label-icon', codicons_1.Codicon.search, (0, nls_1.localize)('searchEditorLabelIcon', 'Icon of the search editor label.'));
    let SearchEditorInput = class SearchEditorInput extends editorInput_1.EditorInput {
        static { SearchEditorInput_1 = this; }
        static { this.ID = constants_1.SearchEditorInputTypeId; }
        get typeId() {
            return SearchEditorInput_1.ID;
        }
        get editorId() {
            return this.typeId;
        }
        getIcon() {
            return SearchEditorIcon;
        }
        get capabilities() {
            let capabilities = 8 /* EditorInputCapabilities.Singleton */;
            if (!this.backingUri) {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            return capabilities;
        }
        get resource() {
            return this.backingUri || this.modelUri;
        }
        constructor(modelUri, backingUri, modelService, textFileService, fileDialogService, instantiationService, workingCopyService, telemetryService, pathService, storageService) {
            super();
            this.modelUri = modelUri;
            this.backingUri = backingUri;
            this.modelService = modelService;
            this.textFileService = textFileService;
            this.fileDialogService = fileDialogService;
            this.instantiationService = instantiationService;
            this.workingCopyService = workingCopyService;
            this.telemetryService = telemetryService;
            this.pathService = pathService;
            this.dirty = false;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this.oldDecorationsIDs = [];
            this.model = instantiationService.createInstance(searchEditorModel_1.SearchEditorModel, modelUri);
            if (this.modelUri.scheme !== constants_1.SearchEditorScheme) {
                throw Error('SearchEditorInput must be invoked with a SearchEditorScheme uri');
            }
            this.memento = new memento_1.Memento(SearchEditorInput_1.ID, storageService);
            storageService.onWillSaveState(() => this.memento.saveMemento());
            const input = this;
            const workingCopyAdapter = new class {
                constructor() {
                    this.typeId = constants_1.SearchEditorWorkingCopyTypeId;
                    this.resource = input.modelUri;
                    this.capabilities = input.hasCapability(4 /* EditorInputCapabilities.Untitled */) ? 2 /* WorkingCopyCapabilities.Untitled */ : 0 /* WorkingCopyCapabilities.None */;
                    this.onDidChangeDirty = input.onDidChangeDirty;
                    this.onDidChangeContent = input.onDidChangeContent;
                    this.onDidSave = input.onDidSave;
                }
                get name() { return input.getName(); }
                isDirty() { return input.isDirty(); }
                isModified() { return input.isDirty(); }
                backup(token) { return input.backup(token); }
                save(options) { return input.save(0, options).then(editor => !!editor); }
                revert(options) { return input.revert(0, options); }
            };
            this._register(this.workingCopyService.registerWorkingCopy(workingCopyAdapter));
        }
        async save(group, options) {
            if (((await this.resolveModels()).resultsModel).isDisposed()) {
                return;
            }
            if (this.backingUri) {
                await this.textFileService.write(this.backingUri, await this.serializeForDisk(), options);
                this.setDirty(false);
                this._onDidSave.fire({ reason: options?.reason, source: options?.source });
                return this;
            }
            else {
                return this.saveAs(group, options);
            }
        }
        tryReadConfigSync() {
            return this._cachedConfigurationModel?.config;
        }
        async serializeForDisk() {
            const { configurationModel, resultsModel } = await this.resolveModels();
            return (0, searchEditorSerialization_1.serializeSearchConfiguration)(configurationModel.config) + '\n' + resultsModel.getValue();
        }
        registerConfigChangeListeners(model) {
            this.configChangeListenerDisposable?.dispose();
            if (!this.isDisposed()) {
                this.configChangeListenerDisposable = model.onConfigDidUpdate(() => {
                    if (this.lastLabel !== this.getName()) {
                        this._onDidChangeLabel.fire();
                        this.lastLabel = this.getName();
                    }
                    this.memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */).searchConfig = model.config;
                });
                this._register(this.configChangeListenerDisposable);
            }
        }
        async resolveModels() {
            return this.model.resolve().then(data => {
                this._cachedResultsModel = data.resultsModel;
                this._cachedConfigurationModel = data.configurationModel;
                if (this.lastLabel !== this.getName()) {
                    this._onDidChangeLabel.fire();
                    this.lastLabel = this.getName();
                }
                this.registerConfigChangeListeners(data.configurationModel);
                return data;
            });
        }
        async saveAs(group, options) {
            const path = await this.fileDialogService.pickFileToSave(await this.suggestFileName(), options?.availableFileSystems);
            if (path) {
                this.telemetryService.publicLog2('searchEditor/saveSearchResults');
                const toWrite = await this.serializeForDisk();
                if (await this.textFileService.create([{ resource: path, value: toWrite, options: { overwrite: true } }])) {
                    this.setDirty(false);
                    if (!(0, resources_1.isEqual)(path, this.modelUri)) {
                        const input = this.instantiationService.invokeFunction(exports.getOrMakeSearchEditorInput, { fileUri: path, from: 'existingFile' });
                        input.setMatchRanges(this.getMatchRanges());
                        return input;
                    }
                    return this;
                }
            }
            return undefined;
        }
        getName(maxLength = 12) {
            const trimToMax = (label) => (label.length < maxLength ? label : `${label.slice(0, maxLength - 3)}...`);
            if (this.backingUri) {
                const originalURI = editor_1.EditorResourceAccessor.getOriginalUri(this);
                return (0, nls_1.localize)('searchTitle.withQuery', "Search: {0}", (0, path_1.basename)((originalURI ?? this.backingUri).path, exports.SEARCH_EDITOR_EXT));
            }
            const query = this._cachedConfigurationModel?.config?.query?.trim();
            if (query) {
                return (0, nls_1.localize)('searchTitle.withQuery', "Search: {0}", trimToMax(query));
            }
            return (0, nls_1.localize)('searchTitle', "Search");
        }
        setDirty(dirty) {
            const wasDirty = this.dirty;
            this.dirty = dirty;
            if (wasDirty !== dirty) {
                this._onDidChangeDirty.fire();
            }
        }
        isDirty() {
            return this.dirty;
        }
        async rename(group, target) {
            if ((0, resources_1.extname)(target) === exports.SEARCH_EDITOR_EXT) {
                return {
                    editor: this.instantiationService.invokeFunction(exports.getOrMakeSearchEditorInput, { from: 'existingFile', fileUri: target })
                };
            }
            // Ignore move if editor was renamed to a different file extension
            return undefined;
        }
        dispose() {
            this.modelService.destroyModel(this.modelUri);
            super.dispose();
        }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            if (other instanceof SearchEditorInput_1) {
                return !!(other.modelUri.fragment && other.modelUri.fragment === this.modelUri.fragment) || !!(other.backingUri && (0, resources_1.isEqual)(other.backingUri, this.backingUri));
            }
            return false;
        }
        getMatchRanges() {
            return (this._cachedResultsModel?.getAllDecorations() ?? [])
                .filter(decoration => decoration.options.className === constants_1.SearchEditorFindMatchClass)
                .filter(({ range }) => !(range.startColumn === 1 && range.endColumn === 1))
                .map(({ range }) => range);
        }
        async setMatchRanges(ranges) {
            this.oldDecorationsIDs = (await this.resolveModels()).resultsModel.deltaDecorations(this.oldDecorationsIDs, ranges.map(range => ({ range, options: { description: 'search-editor-find-match', className: constants_1.SearchEditorFindMatchClass, stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */ } })));
        }
        async revert(group, options) {
            if (options?.soft) {
                this.setDirty(false);
                return;
            }
            if (this.backingUri) {
                const { config, text } = await this.instantiationService.invokeFunction(searchEditorSerialization_1.parseSavedSearchEditor, this.backingUri);
                const { resultsModel, configurationModel } = await this.resolveModels();
                resultsModel.setValue(text);
                configurationModel.updateConfig(config);
            }
            else {
                (await this.resolveModels()).resultsModel.setValue('');
            }
            super.revert(group, options);
            this.setDirty(false);
        }
        async backup(token) {
            const contents = await this.serializeForDisk();
            if (token.isCancellationRequested) {
                return {};
            }
            return {
                content: (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents))
            };
        }
        async suggestFileName() {
            const query = (await this.resolveModels()).configurationModel.config.query;
            const searchFileName = (query.replace(/[^\w \-_]+/g, '_') || 'Search') + exports.SEARCH_EDITOR_EXT;
            return (0, resources_1.joinPath)(await this.fileDialogService.defaultFilePath(this.pathService.defaultUriScheme), searchFileName);
        }
        toUntyped() {
            if (this.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                return undefined;
            }
            return {
                resource: this.resource,
                options: {
                    override: SearchEditorInput_1.ID
                }
            };
        }
    };
    exports.SearchEditorInput = SearchEditorInput;
    exports.SearchEditorInput = SearchEditorInput = SearchEditorInput_1 = __decorate([
        __param(2, model_1.IModelService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, dialogs_1.IFileDialogService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, workingCopyService_1.IWorkingCopyService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, pathService_1.IPathService),
        __param(9, storage_1.IStorageService)
    ], SearchEditorInput);
    const getOrMakeSearchEditorInput = (accessor, existingData) => {
        const storageService = accessor.get(storage_1.IStorageService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const modelUri = existingData.from === 'model' ? existingData.modelUri : uri_1.URI.from({ scheme: constants_1.SearchEditorScheme, fragment: `${Math.random()}` });
        if (!searchEditorModel_1.searchEditorModelFactory.models.has(modelUri)) {
            if (existingData.from === 'existingFile') {
                instantiationService.invokeFunction(accessor => searchEditorModel_1.searchEditorModelFactory.initializeModelFromExistingFile(accessor, modelUri, existingData.fileUri));
            }
            else {
                const searchEditorSettings = configurationService.getValue('search').searchEditor;
                const reuseOldSettings = searchEditorSettings.reusePriorSearchConfiguration;
                const defaultNumberOfContextLines = searchEditorSettings.defaultNumberOfContextLines;
                const priorConfig = reuseOldSettings ? new memento_1.Memento(SearchEditorInput.ID, storageService).getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */).searchConfig : {};
                const defaultConfig = (0, searchEditorSerialization_1.defaultSearchConfig)();
                const config = { ...defaultConfig, ...priorConfig, ...existingData.config };
                if (defaultNumberOfContextLines !== null && defaultNumberOfContextLines !== undefined) {
                    config.contextLines = existingData?.config?.contextLines ?? defaultNumberOfContextLines;
                }
                if (existingData.from === 'rawData') {
                    if (existingData.resultsContents) {
                        config.contextLines = 0;
                    }
                    instantiationService.invokeFunction(accessor => searchEditorModel_1.searchEditorModelFactory.initializeModelFromRawData(accessor, modelUri, config, existingData.resultsContents));
                }
                else {
                    instantiationService.invokeFunction(accessor => searchEditorModel_1.searchEditorModelFactory.initializeModelFromExistingModel(accessor, modelUri, config));
                }
            }
        }
        return instantiationService.createInstance(SearchEditorInput, modelUri, existingData.from === 'existingFile'
            ? existingData.fileUri
            : existingData.from === 'model'
                ? existingData.backupOf
                : undefined);
    };
    exports.getOrMakeSearchEditorInput = getOrMakeSearchEditorInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRWRpdG9ySW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaEVkaXRvci9icm93c2VyL3NlYXJjaEVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFzRG5GLFFBQUEsaUJBQWlCLEdBQUcsY0FBYyxDQUFDO0lBRWhELE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLDBCQUEwQixFQUFFLGtCQUFPLENBQUMsTUFBTSxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLGtDQUFrQyxDQUFDLENBQUMsQ0FBQztJQUVsSixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHlCQUFXOztpQkFDakMsT0FBRSxHQUFXLG1DQUF1QixBQUFsQyxDQUFtQztRQUVyRCxJQUFhLE1BQU07WUFDbEIsT0FBTyxtQkFBaUIsQ0FBQyxFQUFFLENBQUM7UUFDN0IsQ0FBQztRQUVELElBQWEsUUFBUTtZQUNwQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVRLE9BQU87WUFDZixPQUFPLGdCQUFnQixDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFhLFlBQVk7WUFDeEIsSUFBSSxZQUFZLDRDQUFvQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RCLFlBQVksNENBQW9DLENBQUM7WUFDbEQsQ0FBQztZQUVELE9BQU8sWUFBWSxDQUFDO1FBQ3JCLENBQUM7UUFnQkQsSUFBSSxRQUFRO1lBQ1gsT0FBTyxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDekMsQ0FBQztRQVFELFlBQ2lCLFFBQWEsRUFDYixVQUEyQixFQUM1QixZQUE0QyxFQUN6QyxlQUFvRCxFQUNsRCxpQkFBc0QsRUFDbkQsb0JBQTRELEVBQzlELGtCQUF3RCxFQUMxRCxnQkFBb0QsRUFDekQsV0FBMEMsRUFDdkMsY0FBK0I7WUFFaEQsS0FBSyxFQUFFLENBQUM7WUFYUSxhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQ2IsZUFBVSxHQUFWLFVBQVUsQ0FBaUI7WUFDWCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUN0QixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDakMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNsQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzdDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDekMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN4QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQS9CakQsVUFBSyxHQUFZLEtBQUssQ0FBQztZQUlkLHdCQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2xFLHVCQUFrQixHQUFnQixJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO1lBRXpELGVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF5QixDQUFDLENBQUM7WUFDMUUsY0FBUyxHQUFpQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUVqRSxzQkFBaUIsR0FBYSxFQUFFLENBQUM7WUEwQnhDLElBQUksQ0FBQyxLQUFLLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHFDQUFpQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRTlFLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssOEJBQWtCLEVBQUUsQ0FBQztnQkFDakQsTUFBTSxLQUFLLENBQUMsaUVBQWlFLENBQUMsQ0FBQztZQUNoRixDQUFDO1lBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLGlCQUFPLENBQUMsbUJBQWlCLENBQUMsRUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ2pFLGNBQWMsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBRWpFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQztZQUNuQixNQUFNLGtCQUFrQixHQUFHLElBQUk7Z0JBQUE7b0JBQ3JCLFdBQU0sR0FBRyx5Q0FBNkIsQ0FBQztvQkFDdkMsYUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7b0JBRTFCLGlCQUFZLEdBQUcsS0FBSyxDQUFDLGFBQWEsMENBQWtDLENBQUMsQ0FBQywwQ0FBa0MsQ0FBQyxxQ0FBNkIsQ0FBQztvQkFDdkkscUJBQWdCLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDO29CQUMxQyx1QkFBa0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUM7b0JBQzlDLGNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO2dCQU10QyxDQUFDO2dCQVZBLElBQUksSUFBSSxLQUFLLE9BQU8sS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFLdEMsT0FBTyxLQUFjLE9BQU8sS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsVUFBVSxLQUFjLE9BQU8sS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDakQsTUFBTSxDQUFDLEtBQXdCLElBQWlDLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdGLElBQUksQ0FBQyxPQUFzQixJQUFzQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFHLE1BQU0sQ0FBQyxPQUF3QixJQUFtQixPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNwRixDQUFDO1lBRUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLENBQUM7UUFFUSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQXNCLEVBQUUsT0FBOEI7WUFDekUsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUFDLE9BQU87WUFBQyxDQUFDO1lBRXpFLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDMUYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDckIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQzNFLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEMsQ0FBQztRQUNGLENBQUM7UUFFTSxpQkFBaUI7WUFDdkIsT0FBTyxJQUFJLENBQUMseUJBQXlCLEVBQUUsTUFBTSxDQUFDO1FBQy9DLENBQUM7UUFFTyxLQUFLLENBQUMsZ0JBQWdCO1lBQzdCLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN4RSxPQUFPLElBQUEsd0RBQTRCLEVBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxHQUFHLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqRyxDQUFDO1FBR08sNkJBQTZCLENBQUMsS0FBK0I7WUFDcEUsSUFBSSxDQUFDLDhCQUE4QixFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQy9DLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLDhCQUE4QixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7b0JBQ2xFLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQzt3QkFDdkMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO3dCQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDakMsQ0FBQztvQkFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsK0RBQStDLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7Z0JBQ3BHLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFDckQsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYTtZQUNsQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztnQkFDN0MsSUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztnQkFDekQsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO29CQUN2QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQzlCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNqQyxDQUFDO2dCQUNELElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFDNUQsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQXNCLEVBQUUsT0FBOEI7WUFDM0UsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxFQUFFLE9BQU8sRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3RILElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FNOUIsZ0NBQWdDLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzNHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxJQUFBLG1CQUFPLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO3dCQUNuQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGtDQUEwQixFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQzt3QkFDNUgsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQzt3QkFDNUMsT0FBTyxLQUFLLENBQUM7b0JBQ2QsQ0FBQztvQkFDRCxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFUSxPQUFPLENBQUMsU0FBUyxHQUFHLEVBQUU7WUFDOUIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxLQUFhLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxTQUFTLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRWhILElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixNQUFNLFdBQVcsR0FBRywrQkFBc0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hFLE9BQU8sSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsYUFBYSxFQUFFLElBQUEsZUFBUSxFQUFDLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLEVBQUUseUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQzdILENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUNwRSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLE9BQU8sSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsYUFBYSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzNFLENBQUM7WUFDRCxPQUFPLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRUQsUUFBUSxDQUFDLEtBQWM7WUFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLFFBQVEsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO1lBQy9CLENBQUM7UUFDRixDQUFDO1FBRVEsT0FBTztZQUNmLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixDQUFDO1FBRVEsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFzQixFQUFFLE1BQVc7WUFDeEQsSUFBSSxJQUFBLG1CQUFPLEVBQUMsTUFBTSxDQUFDLEtBQUsseUJBQWlCLEVBQUUsQ0FBQztnQkFDM0MsT0FBTztvQkFDTixNQUFNLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxrQ0FBMEIsRUFBRSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDO2lCQUN2SCxDQUFDO1lBQ0gsQ0FBQztZQUNELGtFQUFrRTtZQUNsRSxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRVEsT0FBTztZQUNmLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5QyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVRLE9BQU8sQ0FBQyxLQUF3QztZQUN4RCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsSUFBSSxLQUFLLFlBQVksbUJBQWlCLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksSUFBQSxtQkFBTyxFQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDaEssQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELGNBQWM7WUFDYixPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxDQUFDO2lCQUMxRCxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsS0FBSyxzQ0FBMEIsQ0FBQztpQkFDakYsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxTQUFTLEtBQUssQ0FBQyxDQUFDLENBQUM7aUJBQzFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQWU7WUFDbkMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDOUgsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxXQUFXLEVBQUUsMEJBQTBCLEVBQUUsU0FBUyxFQUFFLHNDQUEwQixFQUFFLFVBQVUsNERBQW9ELEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdLLENBQUM7UUFFUSxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQXNCLEVBQUUsT0FBd0I7WUFDckUsSUFBSSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3JCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JCLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGtEQUFzQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDakgsTUFBTSxFQUFFLFlBQVksRUFBRSxrQkFBa0IsRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4RSxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QixrQkFBa0IsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLENBQUMsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFDRCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RCLENBQUM7UUFFTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQXdCO1lBQzVDLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDL0MsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsT0FBTztnQkFDTixPQUFPLEVBQUUsSUFBQSx5QkFBZ0IsRUFBQyxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN4RCxDQUFDO1FBQ0gsQ0FBQztRQUVPLEtBQUssQ0FBQyxlQUFlO1lBQzVCLE1BQU0sS0FBSyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQzNFLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDLElBQUksUUFBUSxDQUFDLEdBQUcseUJBQWlCLENBQUM7WUFDM0YsT0FBTyxJQUFBLG9CQUFRLEVBQUMsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNsSCxDQUFDO1FBRVEsU0FBUztZQUNqQixJQUFJLElBQUksQ0FBQyxhQUFhLDBDQUFrQyxFQUFFLENBQUM7Z0JBQzFELE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxPQUFPO2dCQUNOLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtnQkFDdkIsT0FBTyxFQUFFO29CQUNSLFFBQVEsRUFBRSxtQkFBaUIsQ0FBQyxFQUFFO2lCQUM5QjthQUNELENBQUM7UUFDSCxDQUFDOztJQW5SVyw4Q0FBaUI7Z0NBQWpCLGlCQUFpQjtRQW1EM0IsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSw0QkFBZ0IsQ0FBQTtRQUNoQixXQUFBLDRCQUFrQixDQUFBO1FBQ2xCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSx3Q0FBbUIsQ0FBQTtRQUNuQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsMEJBQVksQ0FBQTtRQUNaLFdBQUEseUJBQWUsQ0FBQTtPQTFETCxpQkFBaUIsQ0FvUjdCO0lBRU0sTUFBTSwwQkFBMEIsR0FBRyxDQUN6QyxRQUEwQixFQUMxQixZQUcwQyxFQUN0QixFQUFFO1FBRXRCLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1FBRWpFLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLDhCQUFrQixFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVoSixJQUFJLENBQUMsNENBQXdCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQ3BELElBQUksWUFBWSxDQUFDLElBQUksS0FBSyxjQUFjLEVBQUUsQ0FBQztnQkFDMUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsNENBQXdCLENBQUMsK0JBQStCLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNySixDQUFDO2lCQUFNLENBQUM7Z0JBRVAsTUFBTSxvQkFBb0IsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQWlDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQztnQkFFbEgsTUFBTSxnQkFBZ0IsR0FBRyxvQkFBb0IsQ0FBQyw2QkFBNkIsQ0FBQztnQkFDNUUsTUFBTSwyQkFBMkIsR0FBRyxvQkFBb0IsQ0FBQywyQkFBMkIsQ0FBQztnQkFFckYsTUFBTSxXQUFXLEdBQXdCLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLGlCQUFPLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDLFVBQVUsK0RBQStDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzFMLE1BQU0sYUFBYSxHQUFHLElBQUEsK0NBQW1CLEdBQUUsQ0FBQztnQkFFNUMsTUFBTSxNQUFNLEdBQUcsRUFBRSxHQUFHLGFBQWEsRUFBRSxHQUFHLFdBQVcsRUFBRSxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFFNUUsSUFBSSwyQkFBMkIsS0FBSyxJQUFJLElBQUksMkJBQTJCLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ3ZGLE1BQU0sQ0FBQyxZQUFZLEdBQUcsWUFBWSxFQUFFLE1BQU0sRUFBRSxZQUFZLElBQUksMkJBQTJCLENBQUM7Z0JBQ3pGLENBQUM7Z0JBQ0QsSUFBSSxZQUFZLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUNyQyxJQUFJLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQzt3QkFDbEMsTUFBTSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7b0JBQ3pCLENBQUM7b0JBQ0Qsb0JBQW9CLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsNENBQXdCLENBQUMsMEJBQTBCLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hLLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyw0Q0FBd0IsQ0FBQyxnQ0FBZ0MsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3hJLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUN6QyxpQkFBaUIsRUFDakIsUUFBUSxFQUNSLFlBQVksQ0FBQyxJQUFJLEtBQUssY0FBYztZQUNuQyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU87WUFDdEIsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssT0FBTztnQkFDOUIsQ0FBQyxDQUFDLFlBQVksQ0FBQyxRQUFRO2dCQUN2QixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDakIsQ0FBQyxDQUFDO0lBbERXLFFBQUEsMEJBQTBCLDhCQWtEckMifQ==