/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/services/languagesRegistry", "vs/base/common/arrays", "vs/editor/common/languages", "vs/editor/common/languages/modesRegistry"], function (require, exports, event_1, lifecycle_1, languagesRegistry_1, arrays_1, languages_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageService = void 0;
    class LanguageService extends lifecycle_1.Disposable {
        static { this.instanceCount = 0; }
        constructor(warnOnOverwrite = false) {
            super();
            this._onDidRequestBasicLanguageFeatures = this._register(new event_1.Emitter());
            this.onDidRequestBasicLanguageFeatures = this._onDidRequestBasicLanguageFeatures.event;
            this._onDidRequestRichLanguageFeatures = this._register(new event_1.Emitter());
            this.onDidRequestRichLanguageFeatures = this._onDidRequestRichLanguageFeatures.event;
            this._onDidChange = this._register(new event_1.Emitter({ leakWarningThreshold: 200 /* https://github.com/microsoft/vscode/issues/119968 */ }));
            this.onDidChange = this._onDidChange.event;
            this._requestedBasicLanguages = new Set();
            this._requestedRichLanguages = new Set();
            LanguageService.instanceCount++;
            this._registry = this._register(new languagesRegistry_1.LanguagesRegistry(true, warnOnOverwrite));
            this.languageIdCodec = this._registry.languageIdCodec;
            this._register(this._registry.onDidChange(() => this._onDidChange.fire()));
        }
        dispose() {
            LanguageService.instanceCount--;
            super.dispose();
        }
        registerLanguage(def) {
            return this._registry.registerLanguage(def);
        }
        isRegisteredLanguageId(languageId) {
            return this._registry.isRegisteredLanguageId(languageId);
        }
        getRegisteredLanguageIds() {
            return this._registry.getRegisteredLanguageIds();
        }
        getSortedRegisteredLanguageNames() {
            return this._registry.getSortedRegisteredLanguageNames();
        }
        getLanguageName(languageId) {
            return this._registry.getLanguageName(languageId);
        }
        getMimeType(languageId) {
            return this._registry.getMimeType(languageId);
        }
        getIcon(languageId) {
            return this._registry.getIcon(languageId);
        }
        getExtensions(languageId) {
            return this._registry.getExtensions(languageId);
        }
        getFilenames(languageId) {
            return this._registry.getFilenames(languageId);
        }
        getConfigurationFiles(languageId) {
            return this._registry.getConfigurationFiles(languageId);
        }
        getLanguageIdByLanguageName(languageName) {
            return this._registry.getLanguageIdByLanguageName(languageName);
        }
        getLanguageIdByMimeType(mimeType) {
            return this._registry.getLanguageIdByMimeType(mimeType);
        }
        guessLanguageIdByFilepathOrFirstLine(resource, firstLine) {
            const languageIds = this._registry.guessLanguageIdByFilepathOrFirstLine(resource, firstLine);
            return (0, arrays_1.firstOrDefault)(languageIds, null);
        }
        createById(languageId) {
            return new LanguageSelection(this.onDidChange, () => {
                return this._createAndGetLanguageIdentifier(languageId);
            });
        }
        createByMimeType(mimeType) {
            return new LanguageSelection(this.onDidChange, () => {
                const languageId = this.getLanguageIdByMimeType(mimeType);
                return this._createAndGetLanguageIdentifier(languageId);
            });
        }
        createByFilepathOrFirstLine(resource, firstLine) {
            return new LanguageSelection(this.onDidChange, () => {
                const languageId = this.guessLanguageIdByFilepathOrFirstLine(resource, firstLine);
                return this._createAndGetLanguageIdentifier(languageId);
            });
        }
        _createAndGetLanguageIdentifier(languageId) {
            if (!languageId || !this.isRegisteredLanguageId(languageId)) {
                // Fall back to plain text if language is unknown
                languageId = modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
            }
            return languageId;
        }
        requestBasicLanguageFeatures(languageId) {
            if (!this._requestedBasicLanguages.has(languageId)) {
                this._requestedBasicLanguages.add(languageId);
                this._onDidRequestBasicLanguageFeatures.fire(languageId);
            }
        }
        requestRichLanguageFeatures(languageId) {
            if (!this._requestedRichLanguages.has(languageId)) {
                this._requestedRichLanguages.add(languageId);
                // Ensure basic features are requested
                this.requestBasicLanguageFeatures(languageId);
                // Ensure tokenizers are created
                languages_1.TokenizationRegistry.getOrCreate(languageId);
                this._onDidRequestRichLanguageFeatures.fire(languageId);
            }
        }
    }
    exports.LanguageService = LanguageService;
    class LanguageSelection {
        constructor(_onDidChangeLanguages, _selector) {
            this._onDidChangeLanguages = _onDidChangeLanguages;
            this._selector = _selector;
            this._listener = null;
            this._emitter = null;
            this.languageId = this._selector();
        }
        _dispose() {
            if (this._listener) {
                this._listener.dispose();
                this._listener = null;
            }
            if (this._emitter) {
                this._emitter.dispose();
                this._emitter = null;
            }
        }
        get onDidChange() {
            if (!this._listener) {
                this._listener = this._onDidChangeLanguages(() => this._evaluate());
            }
            if (!this._emitter) {
                this._emitter = new event_1.Emitter({
                    onDidRemoveLastListener: () => {
                        this._dispose();
                    }
                });
            }
            return this._emitter.event;
        }
        _evaluate() {
            const languageId = this._selector();
            if (languageId === this.languageId) {
                // no change
                return;
            }
            this.languageId = languageId;
            this._emitter?.fire(this.languageId);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL2xhbmd1YWdlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxlQUFnQixTQUFRLHNCQUFVO2lCQUd2QyxrQkFBYSxHQUFHLENBQUMsQUFBSixDQUFLO1FBaUJ6QixZQUFZLGVBQWUsR0FBRyxLQUFLO1lBQ2xDLEtBQUssRUFBRSxDQUFDO1lBaEJRLHVDQUFrQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBQzVFLHNDQUFpQyxHQUFHLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxLQUFLLENBQUM7WUFFakYsc0NBQWlDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7WUFDM0UscUNBQWdDLEdBQUcsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLEtBQUssQ0FBQztZQUU3RSxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLENBQU8sRUFBRSxvQkFBb0IsRUFBRSxHQUFHLENBQUMsdURBQXVELEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0ksZ0JBQVcsR0FBZ0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFbEQsNkJBQXdCLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQUM3Qyw0QkFBdUIsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBTzVELGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxxQ0FBaUIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FB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