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
define(["require", "exports", "vs/workbench/common/editor/editorModel", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/base/common/lifecycle", "vs/editor/common/languages/modesRegistry", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/base/common/async", "vs/platform/accessibility/common/accessibility", "vs/nls"], function (require, exports, editorModel_1, language_1, model_1, lifecycle_1, modesRegistry_1, languageDetectionWorkerService_1, async_1, accessibility_1, nls_1) {
    "use strict";
    var BaseTextEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseTextEditorModel = void 0;
    /**
     * The base text editor model leverages the code editor model. This class is only intended to be subclassed and not instantiated.
     */
    let BaseTextEditorModel = class BaseTextEditorModel extends editorModel_1.EditorModel {
        static { BaseTextEditorModel_1 = this; }
        static { this.AUTO_DETECT_LANGUAGE_THROTTLE_DELAY = 600; }
        constructor(modelService, languageService, languageDetectionService, accessibilityService, textEditorModelHandle) {
            super();
            this.modelService = modelService;
            this.languageService = languageService;
            this.languageDetectionService = languageDetectionService;
            this.accessibilityService = accessibilityService;
            this.textEditorModelHandle = undefined;
            this.modelDisposeListener = this._register(new lifecycle_1.MutableDisposable());
            this.autoDetectLanguageThrottler = this._register(new async_1.ThrottledDelayer(BaseTextEditorModel_1.AUTO_DETECT_LANGUAGE_THROTTLE_DELAY));
            this._hasLanguageSetExplicitly = false;
            if (textEditorModelHandle) {
                this.handleExistingModel(textEditorModelHandle);
            }
        }
        handleExistingModel(textEditorModelHandle) {
            // We need the resource to point to an existing model
            const model = this.modelService.getModel(textEditorModelHandle);
            if (!model) {
                throw new Error(`Document with resource ${textEditorModelHandle.toString(true)} does not exist`);
            }
            this.textEditorModelHandle = textEditorModelHandle;
            // Make sure we clean up when this model gets disposed
            this.registerModelDisposeListener(model);
        }
        registerModelDisposeListener(model) {
            this.modelDisposeListener.value = model.onWillDispose(() => {
                this.textEditorModelHandle = undefined; // make sure we do not dispose code editor model again
                this.dispose();
            });
        }
        get textEditorModel() {
            return this.textEditorModelHandle ? this.modelService.getModel(this.textEditorModelHandle) : null;
        }
        isReadonly() {
            return true;
        }
        get hasLanguageSetExplicitly() { return this._hasLanguageSetExplicitly; }
        setLanguageId(languageId, source) {
            // Remember that an explicit language was set
            this._hasLanguageSetExplicitly = true;
            this.setLanguageIdInternal(languageId, source);
        }
        setLanguageIdInternal(languageId, source) {
            if (!this.isResolved()) {
                return;
            }
            if (!languageId || languageId === this.textEditorModel.getLanguageId()) {
                return;
            }
            this.textEditorModel.setLanguage(this.languageService.createById(languageId), source);
        }
        installModelListeners(model) {
            // Setup listener for lower level language changes
            const disposable = this._register(model.onDidChangeLanguage((e) => {
                if (e.source === languageDetectionWorkerService_1.LanguageDetectionLanguageEventSource) {
                    return;
                }
                this._hasLanguageSetExplicitly = true;
                disposable.dispose();
            }));
        }
        getLanguageId() {
            return this.textEditorModel?.getLanguageId();
        }
        autoDetectLanguage() {
            return this.autoDetectLanguageThrottler.trigger(() => this.doAutoDetectLanguage());
        }
        async doAutoDetectLanguage() {
            if (this.hasLanguageSetExplicitly || // skip detection when the user has made an explicit choice on the language
                !this.textEditorModelHandle || // require a URI to run the detection for
                !this.languageDetectionService.isEnabledForLanguage(this.getLanguageId() ?? modesRegistry_1.PLAINTEXT_LANGUAGE_ID) // require a valid language that is enlisted for detection
            ) {
                return;
            }
            const lang = await this.languageDetectionService.detectLanguage(this.textEditorModelHandle);
            const prevLang = this.getLanguageId();
            if (lang && lang !== prevLang && !this.isDisposed()) {
                this.setLanguageIdInternal(lang, languageDetectionWorkerService_1.LanguageDetectionLanguageEventSource);
                const languageName = this.languageService.getLanguageName(lang);
                this.accessibilityService.alert((0, nls_1.localize)('languageAutoDetected', "Language {0} was automatically detected and set as the language mode.", languageName ?? lang));
            }
        }
        /**
         * Creates the text editor model with the provided value, optional preferred language
         * (can be comma separated for multiple values) and optional resource URL.
         */
        createTextEditorModel(value, resource, preferredLanguageId) {
            const firstLineText = this.getFirstLineText(value);
            const languageSelection = this.getOrCreateLanguage(resource, this.languageService, preferredLanguageId, firstLineText);
            return this.doCreateTextEditorModel(value, languageSelection, resource);
        }
        doCreateTextEditorModel(value, languageSelection, resource) {
            let model = resource && this.modelService.getModel(resource);
            if (!model) {
                model = this.modelService.createModel(value, languageSelection, resource);
                this.createdEditorModel = true;
                // Make sure we clean up when this model gets disposed
                this.registerModelDisposeListener(model);
            }
            else {
                this.updateTextEditorModel(value, languageSelection.languageId);
            }
            this.textEditorModelHandle = model.uri;
            return model;
        }
        getFirstLineText(value) {
            // text buffer factory
            const textBufferFactory = value;
            if (typeof textBufferFactory.getFirstLineText === 'function') {
                return textBufferFactory.getFirstLineText(1000 /* ModelConstants.FIRST_LINE_DETECTION_LENGTH_LIMIT */);
            }
            // text model
            const textSnapshot = value;
            return textSnapshot.getLineContent(1).substr(0, 1000 /* ModelConstants.FIRST_LINE_DETECTION_LENGTH_LIMIT */);
        }
        /**
         * Gets the language for the given identifier. Subclasses can override to provide their own implementation of this lookup.
         *
         * @param firstLineText optional first line of the text buffer to set the language on. This can be used to guess a language from content.
         */
        getOrCreateLanguage(resource, languageService, preferredLanguage, firstLineText) {
            // lookup language via resource path if the provided language is unspecific
            if (!preferredLanguage || preferredLanguage === modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                return languageService.createByFilepathOrFirstLine(resource ?? null, firstLineText);
            }
            // otherwise take the preferred language for granted
            return languageService.createById(preferredLanguage);
        }
        /**
         * Updates the text editor model with the provided value. If the value is the same as the model has, this is a no-op.
         */
        updateTextEditorModel(newValue, preferredLanguageId) {
            if (!this.isResolved()) {
                return;
            }
            // contents
            if (newValue) {
                this.modelService.updateModel(this.textEditorModel, newValue);
            }
            // language (only if specific and changed)
            if (preferredLanguageId && preferredLanguageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID && this.textEditorModel.getLanguageId() !== preferredLanguageId) {
                this.textEditorModel.setLanguage(this.languageService.createById(preferredLanguageId));
            }
        }
        createSnapshot() {
            if (!this.textEditorModel) {
                return null;
            }
            return this.textEditorModel.createSnapshot(true /* preserve BOM */);
        }
        isResolved() {
            return !!this.textEditorModelHandle;
        }
        dispose() {
            this.modelDisposeListener.dispose(); // dispose this first because it will trigger another dispose() otherwise
            if (this.textEditorModelHandle && this.createdEditorModel) {
                this.modelService.destroyModel(this.textEditorModelHandle);
            }
            this.textEditorModelHandle = undefined;
            this.createdEditorModel = false;
            super.dispose();
        }
    };
    exports.BaseTextEditorModel = BaseTextEditorModel;
    exports.BaseTextEditorModel = BaseTextEditorModel = BaseTextEditorModel_1 = __decorate([
        __param(0, model_1.IModelService),
        __param(1, language_1.ILanguageService),
        __param(2, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(3, accessibility_1.IAccessibilityService)
    ], BaseTextEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEVkaXRvck1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29tbW9uL2VkaXRvci90ZXh0RWRpdG9yTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWlCaEc7O09BRUc7SUFDSSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHlCQUFXOztpQkFFM0Isd0NBQW1DLEdBQUcsR0FBRyxBQUFOLENBQU87UUFTbEUsWUFDZ0IsWUFBcUMsRUFDbEMsZUFBMkMsRUFDbEMsd0JBQW9FLEVBQ3hFLG9CQUE0RCxFQUNuRixxQkFBMkI7WUFFM0IsS0FBSyxFQUFFLENBQUM7WUFOaUIsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDeEIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ2pCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMkI7WUFDdkQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQVgxRSwwQkFBcUIsR0FBb0IsU0FBUyxDQUFDO1lBSTVDLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFDL0QsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFPLHFCQUFtQixDQUFDLG1DQUFtQyxDQUFDLENBQUMsQ0FBQztZQTZDM0ksOEJBQXlCLEdBQVksS0FBSyxDQUFDO1lBbENsRCxJQUFJLHFCQUFxQixFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ2pELENBQUM7UUFDRixDQUFDO1FBRU8sbUJBQW1CLENBQUMscUJBQTBCO1lBRXJELHFEQUFxRDtZQUNyRCxNQUFNLEtBQUssR0FBRyxJQUFJLENB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