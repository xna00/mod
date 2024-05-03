/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/common/services/model", "vs/platform/commands/common/commands", "vs/base/common/types", "vs/editor/common/services/semanticTokensDto", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatures"], function (require, exports, cancellation_1, errors_1, uri_1, model_1, commands_1, types_1, semanticTokensDto_1, range_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocumentSemanticTokensResult = void 0;
    exports.isSemanticTokens = isSemanticTokens;
    exports.isSemanticTokensEdits = isSemanticTokensEdits;
    exports.hasDocumentSemanticTokensProvider = hasDocumentSemanticTokensProvider;
    exports.getDocumentSemanticTokens = getDocumentSemanticTokens;
    exports.hasDocumentRangeSemanticTokensProvider = hasDocumentRangeSemanticTokensProvider;
    exports.getDocumentRangeSemanticTokens = getDocumentRangeSemanticTokens;
    function isSemanticTokens(v) {
        return v && !!(v.data);
    }
    function isSemanticTokensEdits(v) {
        return v && Array.isArray(v.edits);
    }
    class DocumentSemanticTokensResult {
        constructor(provider, tokens, error) {
            this.provider = provider;
            this.tokens = tokens;
            this.error = error;
        }
    }
    exports.DocumentSemanticTokensResult = DocumentSemanticTokensResult;
    function hasDocumentSemanticTokensProvider(registry, model) {
        return registry.has(model);
    }
    function getDocumentSemanticTokensProviders(registry, model) {
        const groups = registry.orderedGroups(model);
        return (groups.length > 0 ? groups[0] : []);
    }
    async function getDocumentSemanticTokens(registry, model, lastProvider, lastResultId, token) {
        const providers = getDocumentSemanticTokensProviders(registry, model);
        // Get tokens from all providers at the same time.
        const results = await Promise.all(providers.map(async (provider) => {
            let result;
            let error = null;
            try {
                result = await provider.provideDocumentSemanticTokens(model, (provider === lastProvider ? lastResultId : null), token);
            }
            catch (err) {
                error = err;
                result = null;
            }
            if (!result || (!isSemanticTokens(result) && !isSemanticTokensEdits(result))) {
                result = null;
            }
            return new DocumentSemanticTokensResult(provider, result, error);
        }));
        // Try to return the first result with actual tokens or
        // the first result which threw an error (!!)
        for (const result of results) {
            if (result.error) {
                throw result.error;
            }
            if (result.tokens) {
                return result;
            }
        }
        // Return the first result, even if it doesn't have tokens
        if (results.length > 0) {
            return results[0];
        }
        return null;
    }
    function _getDocumentSemanticTokensProviderHighestGroup(registry, model) {
        const result = registry.orderedGroups(model);
        return (result.length > 0 ? result[0] : null);
    }
    class DocumentRangeSemanticTokensResult {
        constructor(provider, tokens) {
            this.provider = provider;
            this.tokens = tokens;
        }
    }
    function hasDocumentRangeSemanticTokensProvider(providers, model) {
        return providers.has(model);
    }
    function getDocumentRangeSemanticTokensProviders(providers, model) {
        const groups = providers.orderedGroups(model);
        return (groups.length > 0 ? groups[0] : []);
    }
    async function getDocumentRangeSemanticTokens(registry, model, range, token) {
        const providers = getDocumentRangeSemanticTokensProviders(registry, model);
        // Get tokens from all providers at the same time.
        const results = await Promise.all(providers.map(async (provider) => {
            let result;
            try {
                result = await provider.provideDocumentRangeSemanticTokens(model, range, token);
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
                result = null;
            }
            if (!result || !isSemanticTokens(result)) {
                result = null;
            }
            return new DocumentRangeSemanticTokensResult(provider, result);
        }));
        // Try to return the first result with actual tokens
        for (const result of results) {
            if (result.tokens) {
                return result;
            }
        }
        // Return the first result, even if it doesn't have tokens
        if (results.length > 0) {
            return results[0];
        }
        return null;
    }
    commands_1.CommandsRegistry.registerCommand('_provideDocumentSemanticTokensLegend', async (accessor, ...args) => {
        const [uri] = args;
        (0, types_1.assertType)(uri instanceof uri_1.URI);
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            return undefined;
        }
        const { documentSemanticTokensProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const providers = _getDocumentSemanticTokensProviderHighestGroup(documentSemanticTokensProvider, model);
        if (!providers) {
            // there is no provider => fall back to a document range semantic tokens provider
            return accessor.get(commands_1.ICommandService).executeCommand('_provideDocumentRangeSemanticTokensLegend', uri);
        }
        return providers[0].getLegend();
    });
    commands_1.CommandsRegistry.registerCommand('_provideDocumentSemanticTokens', async (accessor, ...args) => {
        const [uri] = args;
        (0, types_1.assertType)(uri instanceof uri_1.URI);
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            return undefined;
        }
        const { documentSemanticTokensProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        if (!hasDocumentSemanticTokensProvider(documentSemanticTokensProvider, model)) {
            // there is no provider => fall back to a document range semantic tokens provider
            return accessor.get(commands_1.ICommandService).executeCommand('_provideDocumentRangeSemanticTokens', uri, model.getFullModelRange());
        }
        const r = await getDocumentSemanticTokens(documentSemanticTokensProvider, model, null, null, cancellation_1.CancellationToken.None);
        if (!r) {
            return undefined;
        }
        const { provider, tokens } = r;
        if (!tokens || !isSemanticTokens(tokens)) {
            return undefined;
        }
        const buff = (0, semanticTokensDto_1.encodeSemanticTokensDto)({
            id: 0,
            type: 'full',
            data: tokens.data
        });
        if (tokens.resultId) {
            provider.releaseDocumentSemanticTokens(tokens.resultId);
        }
        return buff;
    });
    commands_1.CommandsRegistry.registerCommand('_provideDocumentRangeSemanticTokensLegend', async (accessor, ...args) => {
        const [uri, range] = args;
        (0, types_1.assertType)(uri instanceof uri_1.URI);
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            return undefined;
        }
        const { documentRangeSemanticTokensProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const providers = getDocumentRangeSemanticTokensProviders(documentRangeSemanticTokensProvider, model);
        if (providers.length === 0) {
            // no providers
            return undefined;
        }
        if (providers.length === 1) {
            // straight forward case, just a single provider
            return providers[0].getLegend();
        }
        if (!range || !range_1.Range.isIRange(range)) {
            // if no range is provided, we cannot support multiple providers
            // as we cannot fall back to the one which would give results
            // => return the first legend for backwards compatibility and print a warning
            console.warn(`provideDocumentRangeSemanticTokensLegend might be out-of-sync with provideDocumentRangeSemanticTokens unless a range argument is passed in`);
            return providers[0].getLegend();
        }
        const result = await getDocumentRangeSemanticTokens(documentRangeSemanticTokensProvider, model, range_1.Range.lift(range), cancellation_1.CancellationToken.None);
        if (!result) {
            return undefined;
        }
        return result.provider.getLegend();
    });
    commands_1.CommandsRegistry.registerCommand('_provideDocumentRangeSemanticTokens', async (accessor, ...args) => {
        const [uri, range] = args;
        (0, types_1.assertType)(uri instanceof uri_1.URI);
        (0, types_1.assertType)(range_1.Range.isIRange(range));
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            return undefined;
        }
        const { documentRangeSemanticTokensProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const result = await getDocumentRangeSemanticTokens(documentRangeSemanticTokensProvider, model, range_1.Range.lift(range), cancellation_1.CancellationToken.None);
        if (!result || !result.tokens) {
            // there is no provider or it didn't return tokens
            return undefined;
        }
        return (0, semanticTokensDto_1.encodeSemanticTokensDto)({
            id: 0,
            type: 'full',
            data: result.tokens.data
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0U2VtYW50aWNUb2tlbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3NlbWFudGljVG9rZW5zL2NvbW1vbi9nZXRTZW1hbnRpY1Rva2Vucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLDRDQUVDO0lBRUQsc0RBRUM7SUFVRCw4RUFFQztJQU9ELDhEQXNDQztJQWNELHdGQUVDO0lBT0Qsd0VBaUNDO0lBdkhELFNBQWdCLGdCQUFnQixDQUFDLENBQXVDO1FBQ3ZFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFrQixDQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELFNBQWdCLHFCQUFxQixDQUFDLENBQXVDO1FBQzVFLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQXVCLENBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsTUFBYSw0QkFBNEI7UUFDeEMsWUFDaUIsUUFBd0MsRUFDeEMsTUFBbUQsRUFDbkQsS0FBVTtZQUZWLGFBQVEsR0FBUixRQUFRLENBQWdDO1lBQ3hDLFdBQU0sR0FBTixNQUFNLENBQTZDO1lBQ25ELFVBQUssR0FBTCxLQUFLLENBQUs7UUFDdkIsQ0FBQztLQUNMO0lBTkQsb0VBTUM7SUFFRCxTQUFnQixpQ0FBaUMsQ0FBQyxRQUFpRSxFQUFFLEtBQWlCO1FBQ3JJLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQsU0FBUyxrQ0FBa0MsQ0FBQyxRQUFpRSxFQUFFLEtBQWlCO1FBQy9ILE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0MsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdB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