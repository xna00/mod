/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/platform/commands/common/commands", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/colorPicker/browser/defaultDocumentColorProvider", "vs/platform/configuration/common/configuration"], function (require, exports, cancellation_1, errors_1, uri_1, range_1, model_1, commands_1, languageFeatures_1, defaultDocumentColorProvider_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getColors = getColors;
    exports.getColorPresentations = getColorPresentations;
    async function getColors(colorProviderRegistry, model, token, isDefaultColorDecoratorsEnabled = true) {
        return _findColorData(new ColorDataCollector(), colorProviderRegistry, model, token, isDefaultColorDecoratorsEnabled);
    }
    function getColorPresentations(model, colorInfo, provider, token) {
        return Promise.resolve(provider.provideColorPresentations(model, colorInfo, token));
    }
    class ColorDataCollector {
        constructor() { }
        async compute(provider, model, token, colors) {
            const documentColors = await provider.provideDocumentColors(model, token);
            if (Array.isArray(documentColors)) {
                for (const colorInfo of documentColors) {
                    colors.push({ colorInfo, provider });
                }
            }
            return Array.isArray(documentColors);
        }
    }
    class ExtColorDataCollector {
        constructor() { }
        async compute(provider, model, token, colors) {
            const documentColors = await provider.provideDocumentColors(model, token);
            if (Array.isArray(documentColors)) {
                for (const colorInfo of documentColors) {
                    colors.push({ range: colorInfo.range, color: [colorInfo.color.red, colorInfo.color.green, colorInfo.color.blue, colorInfo.color.alpha] });
                }
            }
            return Array.isArray(documentColors);
        }
    }
    class ColorPresentationsCollector {
        constructor(colorInfo) {
            this.colorInfo = colorInfo;
        }
        async compute(provider, model, _token, colors) {
            const documentColors = await provider.provideColorPresentations(model, this.colorInfo, cancellation_1.CancellationToken.None);
            if (Array.isArray(documentColors)) {
                colors.push(...documentColors);
            }
            return Array.isArray(documentColors);
        }
    }
    async function _findColorData(collector, colorProviderRegistry, model, token, isDefaultColorDecoratorsEnabled) {
        let validDocumentColorProviderFound = false;
        let defaultProvider;
        const colorData = [];
        const documentColorProviders = colorProviderRegistry.ordered(model);
        for (let i = documentColorProviders.length - 1; i >= 0; i--) {
            const provider = documentColorProviders[i];
            if (provider instanceof defaultDocumentColorProvider_1.DefaultDocumentColorProvider) {
                defaultProvider = provider;
            }
            else {
                try {
                    if (await collector.compute(provider, model, token, colorData)) {
                        validDocumentColorProviderFound = true;
                    }
                }
                catch (e) {
                    (0, errors_1.onUnexpectedExternalError)(e);
                }
            }
        }
        if (validDocumentColorProviderFound) {
            return colorData;
        }
        if (defaultProvider && isDefaultColorDecoratorsEnabled) {
            await collector.compute(defaultProvider, model, token, colorData);
            return colorData;
        }
        return [];
    }
    function _setupColorCommand(accessor, resource) {
        const { colorProvider: colorProviderRegistry } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = accessor.get(model_1.IModelService).getModel(resource);
        if (!model) {
            throw (0, errors_1.illegalArgument)();
        }
        const isDefaultColorDecoratorsEnabled = accessor.get(configuration_1.IConfigurationService).getValue('editor.defaultColorDecorators', { resource });
        return { model, colorProviderRegistry, isDefaultColorDecoratorsEnabled };
    }
    commands_1.CommandsRegistry.registerCommand('_executeDocumentColorProvider', function (accessor, ...args) {
        const [resource] = args;
        if (!(resource instanceof uri_1.URI)) {
            throw (0, errors_1.illegalArgument)();
        }
        const { model, colorProviderRegistry, isDefaultColorDecoratorsEnabled } = _setupColorCommand(accessor, resource);
        return _findColorData(new ExtColorDataCollector(), colorProviderRegistry, model, cancellation_1.CancellationToken.None, isDefaultColorDecoratorsEnabled);
    });
    commands_1.CommandsRegistry.registerCommand('_executeColorPresentationProvider', function (accessor, ...args) {
        const [color, context] = args;
        const { uri, range } = context;
        if (!(uri instanceof uri_1.URI) || !Array.isArray(color) || color.length !== 4 || !range_1.Range.isIRange(range)) {
            throw (0, errors_1.illegalArgument)();
        }
        const { model, colorProviderRegistry, isDefaultColorDecoratorsEnabled } = _setupColorCommand(accessor, uri);
        const [red, green, blue, alpha] = color;
        return _findColorData(new ColorPresentationsCollector({ range: range, color: { red, green, blue, alpha } }), colorProviderRegistry, model, cancellation_1.CancellationToken.None, isDefaultColorDecoratorsEnabled);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvbG9yUGlja2VyL2Jyb3dzZXIvY29sb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQmhHLDhCQUVDO0lBRUQsc0RBRUM7SUFOTSxLQUFLLFVBQVUsU0FBUyxDQUFDLHFCQUFxRSxFQUFFLEtBQWlCLEVBQUUsS0FBd0IsRUFBRSxrQ0FBMkMsSUFBSTtRQUNsTSxPQUFPLGNBQWMsQ0FBYSxJQUFJLGtCQUFrQixFQUFFLEVBQUUscUJBQXFCLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO0lBQ25JLENBQUM7SUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxLQUFpQixFQUFFLFNBQTRCLEVBQUUsUUFBK0IsRUFBRSxLQUF3QjtRQUMvSSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLHlCQUF5QixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNyRixDQUFDO0lBYUQsTUFBTSxrQkFBa0I7UUFDdkIsZ0JBQWdCLENBQUM7UUFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUErQixFQUFFLEtBQWlCLEVBQUUsS0FBd0IsRUFBRSxNQUFvQjtZQUMvRyxNQUFNLGNBQWMsR0FBRyxNQUFNLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLEtBQUssTUFBTSxTQUFTLElBQUksY0FBYyxFQUFFLENBQUM7b0JBQ3hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFD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