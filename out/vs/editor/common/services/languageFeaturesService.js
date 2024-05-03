/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languageFeatureRegistry", "vs/editor/common/services/languageFeatures", "vs/platform/instantiation/common/extensions"], function (require, exports, languageFeatureRegistry_1, languageFeatures_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageFeaturesService = void 0;
    class LanguageFeaturesService {
        constructor() {
            this.referenceProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.renameProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.newSymbolNamesProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.codeActionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.definitionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.typeDefinitionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.declarationProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.implementationProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentSymbolProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.inlayHintsProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.colorProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.codeLensProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentFormattingEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentRangeFormattingEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.onTypeFormattingEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.signatureHelpProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.hoverProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentHighlightProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.multiDocumentHighlightProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.selectionRangeProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.foldingRangeProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.linkProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.inlineCompletionsProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.inlineEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.completionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.linkedEditingRangeProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.inlineValuesProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.evaluatableExpressionProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentRangeSemanticTokensProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentSemanticTokensProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentOnDropEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.documentPasteEditProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
            this.mappedEditsProvider = new languageFeatureRegistry_1.LanguageFeatureRegistry(this._score.bind(this));
        }
        setNotebookTypeResolver(resolver) {
            this._notebookTypeResolver = resolver;
        }
        _score(uri) {
            return this._notebookTypeResolver?.(uri);
        }
    }
    exports.LanguageFeaturesService = LanguageFeaturesService;
    (0, extensions_1.registerSingleton)(languageFeatures_1.ILanguageFeaturesService, LanguageFeaturesService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VGZWF0dXJlc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vc2VydmljZXMvbGFuZ3VhZ2VGZWF0dXJlc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsdUJBQXVCO1FBQXBDO1lBSVUsc0JBQWlCLEdBQUcsSUFBSSxpREFBdUIsQ0FBb0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMzRixtQkFBYyxHQUFHLElBQUksaURBQXVCLENBQWlCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckYsMkJBQXNCLEdBQUcsSUFBSSxpREFBdUIsQ0FBeUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNyRyx1QkFBa0IsR0FBRyxJQUFJLGlEQUF1QixDQUFxQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzdGLHVCQUFrQixHQUFHLElBQUksaURBQXVCLENBQXFCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDN0YsMkJBQXNCLEdBQUcsSUFBSSxpREFBdUIsQ0FBeUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNyRyx3QkFBbUIsR0FBRyxJQUFJLGlEQUF1QixDQUFzQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQy9GLDJCQUFzQixHQUFHLElBQUksaURBQXVCLENBQXlCLElBQUksQ0FBQyxN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