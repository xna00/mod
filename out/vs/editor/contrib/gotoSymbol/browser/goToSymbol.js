/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/editor/browser/editorExtensions", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/gotoSymbol/browser/referencesModel"], function (require, exports, arrays_1, cancellation_1, errors_1, editorExtensions_1, languageFeatures_1, referencesModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getDefinitionsAtPosition = getDefinitionsAtPosition;
    exports.getDeclarationsAtPosition = getDeclarationsAtPosition;
    exports.getImplementationsAtPosition = getImplementationsAtPosition;
    exports.getTypeDefinitionsAtPosition = getTypeDefinitionsAtPosition;
    exports.getReferencesAtPosition = getReferencesAtPosition;
    async function getLocationLinks(model, position, registry, provide) {
        const provider = registry.ordered(model);
        // get results
        const promises = provider.map((provider) => {
            return Promise.resolve(provide(provider, model, position)).then(undefined, err => {
                (0, errors_1.onUnexpectedExternalError)(err);
                return undefined;
            });
        });
        const values = await Promise.all(promises);
        return (0, arrays_1.coalesce)(values.flat());
    }
    function getDefinitionsAtPosition(registry, model, position, token) {
        return getLocationLinks(model, position, registry, (provider, model, position) => {
            return provider.provideDefinition(model, position, token);
        });
    }
    function getDeclarationsAtPosition(registry, model, position, token) {
        return getLocationLinks(model, position, registry, (provider, model, position) => {
            return provider.provideDeclaration(model, position, token);
        });
    }
    function getImplementationsAtPosition(registry, model, position, token) {
        return getLocationLinks(model, position, registry, (provider, model, position) => {
            return provider.provideImplementation(model, position, token);
        });
    }
    function getTypeDefinitionsAtPosition(registry, model, position, token) {
        return getLocationLinks(model, position, registry, (provider, model, position) => {
            return provider.provideTypeDefinition(model, position, token);
        });
    }
    function getReferencesAtPosition(registry, model, position, compact, token) {
        return getLocationLinks(model, position, registry, async (provider, model, position) => {
            const result = await provider.provideReferences(model, position, { includeDeclaration: true }, token);
            if (!compact || !result || result.length !== 2) {
                return result;
            }
            const resultWithoutDeclaration = await provider.provideReferences(model, position, { includeDeclaration: false }, token);
            if (resultWithoutDeclaration && resultWithoutDeclaration.length === 1) {
                return resultWithoutDeclaration;
            }
            return result;
        });
    }
    // -- API commands ----
    async function _sortedAndDeduped(callback) {
        const rawLinks = await callback();
        const model = new referencesModel_1.ReferencesModel(rawLinks, '');
        const modelLinks = model.references.map(ref => ref.link);
        model.dispose();
        return modelLinks;
    }
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeDefinitionProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const promise = getDefinitionsAtPosition(languageFeaturesService.definitionProvider, model, position, cancellation_1.CancellationToken.None);
        return _sortedAndDeduped(() => promise);
    });
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeTypeDefinitionProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const promise = getTypeDefinitionsAtPosition(languageFeaturesService.typeDefinitionProvider, model, position, cancellation_1.CancellationToken.None);
        return _sortedAndDeduped(() => promise);
    });
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeDeclarationProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const promise = getDeclarationsAtPosition(languageFeaturesService.declarationProvider, model, position, cancellation_1.CancellationToken.None);
        return _sortedAndDeduped(() => promise);
    });
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeReferenceProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const promise = getReferencesAtPosition(languageFeaturesService.referenceProvider, model, position, false, cancellation_1.CancellationToken.None);
        return _sortedAndDeduped(() => promise);
    });
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeImplementationProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const promise = getImplementationsAtPosition(languageFeaturesService.implementationProvider, model, position, cancellation_1.CancellationToken.None);
        return _sortedAndDeduped(() => promise);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29Ub1N5bWJvbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZ290b1N5bWJvbC9icm93c2VyL2dvVG9TeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFpQ2hHLDREQUlDO0lBRUQsOERBSUM7SUFFRCxvRUFJQztJQUVELG9FQUlDO0lBRUQsMERBWUM7SUF4REQsS0FBSyxVQUFVLGdCQUFnQixDQUM5QixLQUFpQixFQUNqQixRQUFrQixFQUNsQixRQUFvQyxFQUNwQyxPQUE4RztRQUU5RyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXpDLGNBQWM7UUFDZCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFzRCxFQUFFO1lBQzlGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLEVBQUU7Z0JBQ2hGLElBQUEsa0NBQXlCLEVBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQy9CLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsT0FBTyxJQUFBLGlCQUFRLEVBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELFNBQWdCLHdCQUF3QixDQUFDLFFBQXFELEVBQUUsS0FBaUIsRUFBRSxRQUFrQixFQUFFLEtBQXdCO1FBQzlKLE9BQU8sZ0JBQWdCLENBQUMs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