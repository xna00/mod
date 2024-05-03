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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/core/textModelDefaults", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/language", "vs/editor/common/services/textResourceConfiguration", "vs/platform/configuration/common/configuration", "vs/platform/undoRedo/common/undoRedo", "vs/base/common/hash", "vs/editor/common/model/editStack", "vs/base/common/network", "vs/base/common/objects", "vs/editor/common/languages/languageConfigurationRegistry"], function (require, exports, event_1, lifecycle_1, platform, editOperation_1, range_1, textModel_1, textModelDefaults_1, modesRegistry_1, language_1, textResourceConfiguration_1, configuration_1, undoRedo_1, hash_1, editStack_1, network_1, objects_1, languageConfigurationRegistry_1) {
    "use strict";
    var ModelService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultModelSHA1Computer = exports.ModelService = void 0;
    function MODEL_ID(resource) {
        return resource.toString();
    }
    class ModelData {
        constructor(model, onWillDispose, onDidChangeLanguage) {
            this.model = model;
            this._modelEventListeners = new lifecycle_1.DisposableStore();
            this.model = model;
            this._modelEventListeners.add(model.onWillDispose(() => onWillDispose(model)));
            this._modelEventListeners.add(model.onDidChangeLanguage((e) => onDidChangeLanguage(model, e)));
        }
        dispose() {
            this._modelEventListeners.dispose();
        }
    }
    const DEFAULT_EOL = (platform.isLinux || platform.isMacintosh) ? 1 /* DefaultEndOfLine.LF */ : 2 /* DefaultEndOfLine.CRLF */;
    class DisposedModelInfo {
        constructor(uri, initialUndoRedoSnapshot, time, sharesUndoRedoStack, heapSize, sha1, versionId, alternativeVersionId) {
            this.uri = uri;
            this.initialUndoRedoSnapshot = initialUndoRedoSnapshot;
            this.time = time;
            this.sharesUndoRedoStack = sharesUndoRedoStack;
            this.heapSize = heapSize;
            this.sha1 = sha1;
            this.versionId = versionId;
            this.alternativeVersionId = alternativeVersionId;
        }
    }
    let ModelService = class ModelService extends lifecycle_1.Disposable {
        static { ModelService_1 = this; }
        static { this.MAX_MEMORY_FOR_CLOSED_FILES_UNDO_STACK = 20 * 1024 * 1024; }
        constructor(_configurationService, _resourcePropertiesService, _undoRedoService, _languageService, _languageConfigurationService) {
            super();
            this._configurationService = _configurationService;
            this._resourcePropertiesService = _resourcePropertiesService;
            this._undoRedoService = _undoRedoService;
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            this._onModelAdded = this._register(new event_1.Emitter());
            this.onModelAdded = this._onModelAdded.event;
            this._onModelRemoved = this._register(new event_1.Emitter());
            this.onModelRemoved = this._onModelRemoved.event;
            this._onModelModeChanged = this._register(new event_1.Emitter());
            this.onModelLanguageChanged = this._onModelModeChanged.event;
            this._modelCreationOptionsByLanguageAndResource = Object.create(null);
            this._models = {};
            this._disposedModels = new Map();
            this._disposedModelsHeapSize = 0;
            this._register(this._configurationService.onDidChangeConfiguration(e => this._updateModelOptions(e)));
            this._updateModelOptions(undefined);
        }
        static _readModelOptions(config, isForSimpleWidget) {
            let tabSize = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.tabSize;
            if (config.editor && typeof config.editor.tabSize !== 'undefined') {
                const parsedTabSize = parseInt(config.editor.tabSize, 10);
                if (!isNaN(parsedTabSize)) {
                    tabSize = parsedTabSize;
                }
                if (tabSize < 1) {
                    tabSize = 1;
                }
            }
            let indentSize = 'tabSize';
            if (config.editor && typeof config.editor.indentSize !== 'undefined' && config.editor.indentSize !== 'tabSize') {
                const parsedIndentSize = parseInt(config.editor.indentSize, 10);
                if (!isNaN(parsedIndentSize)) {
                    indentSize = Math.max(parsedIndentSize, 1);
                }
            }
            let insertSpaces = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.insertSpaces;
            if (config.editor && typeof config.editor.insertSpaces !== 'undefined') {
                insertSpaces = (config.editor.insertSpaces === 'false' ? false : Boolean(config.editor.insertSpaces));
            }
            let newDefaultEOL = DEFAULT_EOL;
            const eol = config.eol;
            if (eol === '\r\n') {
                newDefaultEOL = 2 /* DefaultEndOfLine.CRLF */;
            }
            else if (eol === '\n') {
                newDefaultEOL = 1 /* DefaultEndOfLine.LF */;
            }
            let trimAutoWhitespace = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.trimAutoWhitespace;
            if (config.editor && typeof config.editor.trimAutoWhitespace !== 'undefined') {
                trimAutoWhitespace = (config.editor.trimAutoWhitespace === 'false' ? false : Boolean(config.editor.trimAutoWhitespace));
            }
            let detectIndentation = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.detectIndentation;
            if (config.editor && typeof config.editor.detectIndentation !== 'undefined') {
                detectIndentation = (config.editor.detectIndentation === 'false' ? false : Boolean(config.editor.detectIndentation));
            }
            let largeFileOptimizations = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.largeFileOptimizations;
            if (config.editor && typeof config.editor.largeFileOptimizations !== 'undefined') {
                largeFileOptimizations = (config.editor.largeFileOptimizations === 'false' ? false : Boolean(config.editor.largeFileOptimizations));
            }
            let bracketPairColorizationOptions = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.bracketPairColorizationOptions;
            if (config.editor?.bracketPairColorization && typeof config.editor.bracketPairColorization === 'object') {
                bracketPairColorizationOptions = {
                    enabled: !!config.editor.bracketPairColorization.enabled,
                    independentColorPoolPerBracketType: !!config.editor.bracketPairColorization.independentColorPoolPerBracketType
                };
            }
            return {
                isForSimpleWidget: isForSimpleWidget,
                tabSize: tabSize,
                indentSize: indentSize,
                insertSpaces: insertSpaces,
                detectIndentation: detectIndentation,
                defaultEOL: newDefaultEOL,
                trimAutoWhitespace: trimAutoWhitespace,
                largeFileOptimizations: largeFileOptimizations,
                bracketPairColorizationOptions
            };
        }
        _getEOL(resource, language) {
            if (resource) {
                return this._resourcePropertiesService.getEOL(resource, language);
            }
            const eol = this._configurationService.getValue('files.eol', { overrideIdentifier: language });
            if (eol && typeof eol === 'string' && eol !== 'auto') {
                return eol;
            }
            return platform.OS === 3 /* platform.OperatingSystem.Linux */ || platform.OS === 2 /* platform.OperatingSystem.Macintosh */ ? '\n' : '\r\n';
        }
        _shouldRestoreUndoStack() {
            const result = this._configurationService.getValue('files.restoreUndoStack');
            if (typeof result === 'boolean') {
                return result;
            }
            return true;
        }
        getCreationOptions(languageIdOrSelection, resource, isForSimpleWidget) {
            const language = (typeof languageIdOrSelection === 'string' ? languageIdOrSelection : languageIdOrSelection.languageId);
            let creationOptions = this._modelCreationOptionsByLanguageAndResource[language + resource];
            if (!creationOptions) {
                const editor = this._configurationService.getValue('editor', { overrideIdentifier: language, resource });
                const eol = this._getEOL(resource, language);
                creationOptions = ModelService_1._readModelOptions({ editor, eol }, isForSimpleWidget);
                this._modelCreationOptionsByLanguageAndResource[language + resource] = creationOptions;
            }
            return creationOptions;
        }
        _updateModelOptions(e) {
            const oldOptionsByLanguageAndResource = this._modelCreationOptionsByLanguageAndResource;
            this._modelCreationOptionsByLanguageAndResource = Object.create(null);
            // Update options on all models
            const keys = Object.keys(this._models);
            for (let i = 0, len = keys.length; i < len; i++) {
                const modelId = keys[i];
                const modelData = this._models[modelId];
                const language = modelData.model.getLanguageId();
                const uri = modelData.model.uri;
                if (e && !e.affectsConfiguration('editor', { overrideIdentifier: language, resource: uri }) && !e.affectsConfiguration('files.eol', { overrideIdentifier: language, resource: uri })) {
                    continue; // perf: skip if this model is not affected by configuration change
                }
                const oldOptions = oldOptionsByLanguageAndResource[language + uri];
                const newOptions = this.getCreationOptions(language, uri, modelData.model.isForSimpleWidget);
                ModelService_1._setModelOptionsForModel(modelData.model, newOptions, oldOptions);
            }
        }
        static _setModelOptionsForModel(model, newOptions, currentOptions) {
            if (currentOptions && currentOptions.defaultEOL !== newOptions.defaultEOL && model.getLineCount() === 1) {
                model.setEOL(newOptions.defaultEOL === 1 /* DefaultEndOfLine.LF */ ? 0 /* EndOfLineSequence.LF */ : 1 /* EndOfLineSequence.CRLF */);
            }
            if (currentOptions
                && (currentOptions.detectIndentation === newOptions.detectIndentation)
                && (currentOptions.insertSpaces === newOptions.insertSpaces)
                && (currentOptions.tabSize === newOptions.tabSize)
                && (currentOptions.indentSize === newOptions.indentSize)
                && (currentOptions.trimAutoWhitespace === newOptions.trimAutoWhitespace)
                && (0, objects_1.equals)(currentOptions.bracketPairColorizationOptions, newOptions.bracketPairColorizationOptions)) {
                // Same indent opts, no need to touch the model
                return;
            }
            if (newOptions.detectIndentation) {
                model.detectIndentation(newOptions.insertSpaces, newOptions.tabSize);
                model.updateOptions({
                    trimAutoWhitespace: newOptions.trimAutoWhitespace,
                    bracketColorizationOptions: newOptions.bracketPairColorizationOptions
                });
            }
            else {
                model.updateOptions({
                    insertSpaces: newOptions.insertSpaces,
                    tabSize: newOptions.tabSize,
                    indentSize: newOptions.indentSize,
                    trimAutoWhitespace: newOptions.trimAutoWhitespace,
                    bracketColorizationOptions: newOptions.bracketPairColorizationOptions
                });
            }
        }
        // --- begin IModelService
        _insertDisposedModel(disposedModelData) {
            this._disposedModels.set(MODEL_ID(disposedModelData.uri), disposedModelData);
            this._disposedModelsHeapSize += disposedModelData.heapSize;
        }
        _removeDisposedModel(resource) {
            const disposedModelData = this._disposedModels.get(MODEL_ID(resource));
            if (disposedModelData) {
                this._disposedModelsHeapSize -= disposedModelData.heapSize;
            }
            this._disposedModels.delete(MODEL_ID(resource));
            return disposedModelData;
        }
        _ensureDisposedModelsHeapSize(maxModelsHeapSize) {
            if (this._disposedModelsHeapSize > maxModelsHeapSize) {
                // we must remove some old undo stack elements to free up some memory
                const disposedModels = [];
                this._disposedModels.forEach(entry => {
                    if (!entry.sharesUndoRedoStack) {
                        disposedModels.push(entry);
                    }
                });
                disposedModels.sort((a, b) => a.time - b.time);
                while (disposedModels.length > 0 && this._disposedModelsHeapSize > maxModelsHeapSize) {
                    const disposedModel = disposedModels.shift();
                    this._removeDisposedModel(disposedModel.uri);
                    if (disposedModel.initialUndoRedoSnapshot !== null) {
                        this._undoRedoService.restoreSnapshot(disposedModel.initialUndoRedoSnapshot);
                    }
                }
            }
        }
        _createModelData(value, languageIdOrSelection, resource, isForSimpleWidget) {
            // create & save the model
            const options = this.getCreationOptions(languageIdOrSelection, resource, isForSimpleWidget);
            const model = new textModel_1.TextModel(value, languageIdOrSelection, options, resource, this._undoRedoService, this._languageService, this._languageConfigurationService);
            if (resource && this._disposedModels.has(MODEL_ID(resource))) {
                const disposedModelData = this._removeDisposedModel(resource);
                const elements = this._undoRedoService.getElements(resource);
                const sha1Computer = this._getSHA1Computer();
                const sha1IsEqual = (sha1Computer.canComputeSHA1(model)
                    ? sha1Computer.computeSHA1(model) === disposedModelData.sha1
                    : false);
                if (sha1IsEqual || disposedModelData.sharesUndoRedoStack) {
                    for (const element of elements.past) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(resource)) {
                            element.setModel(model);
                        }
                    }
                    for (const element of elements.future) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(resource)) {
                            element.setModel(model);
                        }
                    }
                    this._undoRedoService.setElementsValidFlag(resource, true, (element) => ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(resource)));
                    if (sha1IsEqual) {
                        model._overwriteVersionId(disposedModelData.versionId);
                        model._overwriteAlternativeVersionId(disposedModelData.alternativeVersionId);
                        model._overwriteInitialUndoRedoSnapshot(disposedModelData.initialUndoRedoSnapshot);
                    }
                }
                else {
                    if (disposedModelData.initialUndoRedoSnapshot !== null) {
                        this._undoRedoService.restoreSnapshot(disposedModelData.initialUndoRedoSnapshot);
                    }
                }
            }
            const modelId = MODEL_ID(model.uri);
            if (this._models[modelId]) {
                // There already exists a model with this id => this is a programmer error
                throw new Error('ModelService: Cannot add model because it already exists!');
            }
            const modelData = new ModelData(model, (model) => this._onWillDispose(model), (model, e) => this._onDidChangeLanguage(model, e));
            this._models[modelId] = modelData;
            return modelData;
        }
        updateModel(model, value) {
            const options = this.getCreationOptions(model.getLanguageId(), model.uri, model.isForSimpleWidget);
            const { textBuffer, disposable } = (0, textModel_1.createTextBuffer)(value, options.defaultEOL);
            // Return early if the text is already set in that form
            if (model.equalsTextBuffer(textBuffer)) {
                disposable.dispose();
                return;
            }
            // Otherwise find a diff between the values and update model
            model.pushStackElement();
            model.pushEOL(textBuffer.getEOL() === '\r\n' ? 1 /* EndOfLineSequence.CRLF */ : 0 /* EndOfLineSequence.LF */);
            model.pushEditOperations([], ModelService_1._computeEdits(model, textBuffer), () => []);
            model.pushStackElement();
            disposable.dispose();
        }
        static _commonPrefix(a, aLen, aDelta, b, bLen, bDelta) {
            const maxResult = Math.min(aLen, bLen);
            let result = 0;
            for (let i = 0; i < maxResult && a.getLineContent(aDelta + i) === b.getLineContent(bDelta + i); i++) {
                result++;
            }
            return result;
        }
        static _commonSuffix(a, aLen, aDelta, b, bLen, bDelta) {
            const maxResult = Math.min(aLen, bLen);
            let result = 0;
            for (let i = 0; i < maxResult && a.getLineContent(aDelta + aLen - i) === b.getLineContent(bDelta + bLen - i); i++) {
                result++;
            }
            return result;
        }
        /**
         * Compute edits to bring `model` to the state of `textSource`.
         */
        static _computeEdits(model, textBuffer) {
            const modelLineCount = model.getLineCount();
            const textBufferLineCount = textBuffer.getLineCount();
            const commonPrefix = this._commonPrefix(model, modelLineCount, 1, textBuffer, textBufferLineCount, 1);
            if (modelLineCount === textBufferLineCount && commonPrefix === modelLineCount) {
                // equality case
                return [];
            }
            const commonSuffix = this._commonSuffix(model, modelLineCount - commonPrefix, commonPrefix, textBuffer, textBufferLineCount - commonPrefix, commonPrefix);
            let oldRange;
            let newRange;
            if (commonSuffix > 0) {
                oldRange = new range_1.Range(commonPrefix + 1, 1, modelLineCount - commonSuffix + 1, 1);
                newRange = new range_1.Range(commonPrefix + 1, 1, textBufferLineCount - commonSuffix + 1, 1);
            }
            else if (commonPrefix > 0) {
                oldRange = new range_1.Range(commonPrefix, model.getLineMaxColumn(commonPrefix), modelLineCount, model.getLineMaxColumn(modelLineCount));
                newRange = new range_1.Range(commonPrefix, 1 + textBuffer.getLineLength(commonPrefix), textBufferLineCount, 1 + textBuffer.getLineLength(textBufferLineCount));
            }
            else {
                oldRange = new range_1.Range(1, 1, modelLineCount, model.getLineMaxColumn(modelLineCount));
                newRange = new range_1.Range(1, 1, textBufferLineCount, 1 + textBuffer.getLineLength(textBufferLineCount));
            }
            return [editOperation_1.EditOperation.replaceMove(oldRange, textBuffer.getValueInRange(newRange, 0 /* EndOfLinePreference.TextDefined */))];
        }
        createModel(value, languageSelection, resource, isForSimpleWidget = false) {
            let modelData;
            if (languageSelection) {
                modelData = this._createModelData(value, languageSelection, resource, isForSimpleWidget);
            }
            else {
                modelData = this._createModelData(value, modesRegistry_1.PLAINTEXT_LANGUAGE_ID, resource, isForSimpleWidget);
            }
            this._onModelAdded.fire(modelData.model);
            return modelData.model;
        }
        destroyModel(resource) {
            // We need to support that not all models get disposed through this service (i.e. model.dispose() should work!)
            const modelData = this._models[MODEL_ID(resource)];
            if (!modelData) {
                return;
            }
            modelData.model.dispose();
        }
        getModels() {
            const ret = [];
            const keys = Object.keys(this._models);
            for (let i = 0, len = keys.length; i < len; i++) {
                const modelId = keys[i];
                ret.push(this._models[modelId].model);
            }
            return ret;
        }
        getModel(resource) {
            const modelId = MODEL_ID(resource);
            const modelData = this._models[modelId];
            if (!modelData) {
                return null;
            }
            return modelData.model;
        }
        // --- end IModelService
        _schemaShouldMaintainUndoRedoElements(resource) {
            return (resource.scheme === network_1.Schemas.file
                || resource.scheme === network_1.Schemas.vscodeRemote
                || resource.scheme === network_1.Schemas.vscodeUserData
                || resource.scheme === network_1.Schemas.vscodeNotebookCell
                || resource.scheme === 'fake-fs' // for tests
            );
        }
        _onWillDispose(model) {
            const modelId = MODEL_ID(model.uri);
            const modelData = this._models[modelId];
            const sharesUndoRedoStack = (this._undoRedoService.getUriComparisonKey(model.uri) !== model.uri.toString());
            let maintainUndoRedoStack = false;
            let heapSize = 0;
            if (sharesUndoRedoStack || (this._shouldRestoreUndoStack() && this._schemaShouldMaintainUndoRedoElements(model.uri))) {
                const elements = this._undoRedoService.getElements(model.uri);
                if (elements.past.length > 0 || elements.future.length > 0) {
                    for (const element of elements.past) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(model.uri)) {
                            maintainUndoRedoStack = true;
                            heapSize += element.heapSize(model.uri);
                            element.setModel(model.uri); // remove reference from text buffer instance
                        }
                    }
                    for (const element of elements.future) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(model.uri)) {
                            maintainUndoRedoStack = true;
                            heapSize += element.heapSize(model.uri);
                            element.setModel(model.uri); // remove reference from text buffer instance
                        }
                    }
                }
            }
            const maxMemory = ModelService_1.MAX_MEMORY_FOR_CLOSED_FILES_UNDO_STACK;
            const sha1Computer = this._getSHA1Computer();
            if (!maintainUndoRedoStack) {
                if (!sharesUndoRedoStack) {
                    const initialUndoRedoSnapshot = modelData.model.getInitialUndoRedoSnapshot();
                    if (initialUndoRedoSnapshot !== null) {
                        this._undoRedoService.restoreSnapshot(initialUndoRedoSnapshot);
                    }
                }
            }
            else if (!sharesUndoRedoStack && (heapSize > maxMemory || !sha1Computer.canComputeSHA1(model))) {
                // the undo stack for this file would never fit in the configured memory or the file is very large, so don't bother with it.
                const initialUndoRedoSnapshot = modelData.model.getInitialUndoRedoSnapshot();
                if (initialUndoRedoSnapshot !== null) {
                    this._undoRedoService.restoreSnapshot(initialUndoRedoSnapshot);
                }
            }
            else {
                this._ensureDisposedModelsHeapSize(maxMemory - heapSize);
                // We only invalidate the elements, but they remain in the undo-redo service.
                this._undoRedoService.setElementsValidFlag(model.uri, false, (element) => ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(model.uri)));
                this._insertDisposedModel(new DisposedModelInfo(model.uri, modelData.model.getInitialUndoRedoSnapshot(), Date.now(), sharesUndoRedoStack, heapSize, sha1Computer.computeSHA1(model), model.getVersionId(), model.getAlternativeVersionId()));
            }
            delete this._models[modelId];
            modelData.dispose();
            // clean up cache
            delete this._modelCreationOptionsByLanguageAndResource[model.getLanguageId() + model.uri];
            this._onModelRemoved.fire(model);
        }
        _onDidChangeLanguage(model, e) {
            const oldLanguageId = e.oldLanguage;
            const newLanguageId = model.getLanguageId();
            const oldOptions = this.getCreationOptions(oldLanguageId, model.uri, model.isForSimpleWidget);
            const newOptions = this.getCreationOptions(newLanguageId, model.uri, model.isForSimpleWidget);
            ModelService_1._setModelOptionsForModel(model, newOptions, oldOptions);
            this._onModelModeChanged.fire({ model, oldLanguageId: oldLanguageId });
        }
        _getSHA1Computer() {
            return new DefaultModelSHA1Computer();
        }
    };
    exports.ModelService = ModelService;
    exports.ModelService = ModelService = ModelService_1 = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, textResourceConfiguration_1.ITextResourcePropertiesService),
        __param(2, undoRedo_1.IUndoRedoService),
        __param(3, language_1.ILanguageService),
        __param(4, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], ModelService);
    class DefaultModelSHA1Computer {
        static { this.MAX_MODEL_SIZE = 10 * 1024 * 1024; } // takes 200ms to compute a sha1 on a 10MB model on a new machine
        canComputeSHA1(model) {
            return (model.getValueLength() <= DefaultModelSHA1Computer.MAX_MODEL_SIZE);
        }
        computeSHA1(model) {
            // compute the sha1
            const shaComputer = new hash_1.StringSHA1();
            const snapshot = model.createSnapshot();
            let text;
            while ((text = snapshot.read())) {
                shaComputer.update(text);
            }
            return shaComputer.digest();
        }
    }
    exports.DefaultModelSHA1Computer = DefaultModelSHA1Computer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL21vZGVsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBd0JoRyxTQUFTLFFBQVEsQ0FBQyxRQUFhO1FBQzlCLE9BQU8sUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRCxNQUFNLFNBQVM7UUFJZCxZQUNpQixLQUFnQixFQUNoQyxhQUEwQyxFQUMxQyxtQkFBK0U7WUFGL0QsVUFBSyxHQUFMLEtBQUssQ0FBVztZQUhoQix5QkFBb0IsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQU83RCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRyxDQUFDO1FBRU0sT0FBTztZQUNiLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQyxDQUFDO0tBQ0Q7SUFrQkQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLDZCQUFxQixDQUFDLDhCQUFzQixDQUFDO0lBRTdHLE1BQU0saUJBQWlCO1FBQ3RCLFlBQ2lCLEdB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