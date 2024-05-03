/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/editor/browser/editorExtensions", "vs/editor/common/services/languageFeatures"], function (require, exports, async_1, cancellation_1, errors_1, editorExtensions_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverProviderResult = void 0;
    exports.getHover = getHover;
    exports.getHoverPromise = getHoverPromise;
    class HoverProviderResult {
        constructor(provider, hover, ordinal) {
            this.provider = provider;
            this.hover = hover;
            this.ordinal = ordinal;
        }
    }
    exports.HoverProviderResult = HoverProviderResult;
    async function executeProvider(provider, ordinal, model, position, token) {
        try {
            const result = await Promise.resolve(provider.provideHover(model, position, token));
            if (result && isValid(result)) {
                return new HoverProviderResult(provider, result, ordinal);
            }
        }
        catch (err) {
            (0, errors_1.onUnexpectedExternalError)(err);
        }
        return undefined;
    }
    function getHover(registry, model, position, token) {
        const providers = registry.ordered(model);
        const promises = providers.map((provider, index) => executeProvider(provider, index, model, position, token));
        return async_1.AsyncIterableObject.fromPromises(promises).coalesce();
    }
    function getHoverPromise(registry, model, position, token) {
        return getHover(registry, model, position, token).map(item => item.hover).toPromise();
    }
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeHoverProvider', (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        return getHoverPromise(languageFeaturesService.hoverProvider, model, position, cancellation_1.CancellationToken.None);
    });
    function isValid(result) {
        const hasRange = (typeof result.range !== 'undefined');
        const hasHtmlContent = typeof result.contents !== 'undefined' && result.contents && result.contents.length > 0;
        return hasRange && hasHtmlContent;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SG92ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2hvdmVyL2Jyb3dzZXIvZ2V0SG92ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0NoRyw0QkFJQztJQUVELDBDQUVDO0lBNUJELE1BQWEsbUJBQW1CO1FBQy9CLFlBQ2lCLFFBQXVCLEVBQ3ZCLEtBQVksRUFDWixPQUFlO1lBRmYsYUFBUSxHQUFSLFFBQVEsQ0FBZTtZQUN2QixVQUFLLEdBQUwsS0FBSyxDQUFPO1lBQ1osWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUM1QixDQUFDO0tBQ0w7SUFORCxrREFNQztJQUVELEtBQUssVUFBVSxlQUFlLENBQUMsUUFBdUIsRUFBRSxPQUFlLEVBQUUsS0FBaUIsRUFBRSxRQUFrQixFQUFFLEtBQXdCO1FBQ3ZJLElBQUksQ0FBQztZQUNKLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNwRixJQUFJLE1BQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxJQUFJLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDM0QsQ0FBQztRQUNGLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2QsSUFBQSxrQ0FBeUIsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVELFNBQWdCLFFBQVEsQ0FBQyxRQUFnRCxFQUFFLEtBQWlCLEVBQUUsUUFBa0IsRUFBRSxLQUF3QjtRQUN6SSxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDOUcsT0FBTywyQkFBbUIsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDOUQsQ0FBQztJQUVELFNBQWdCLGVBQWUsQ0FBQyxRQUFnRCxFQUFFLEtBQWlCLEVBQUUsUUFBa0IsRUFBRSxLQUF3QjtRQUNoSixPQUFPLFFBQVEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDdkYsQ0FBQztJQUVELElBQUEsa0RBQStCLEVBQUMsdUJBQXVCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO1FBQ3RGLE1BQU0sdUJBQXVCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQ0FBd0IsQ0FBQyxDQUFDO1FBQ3ZFLE9BQU8sZUFBZSxDQUFDLHVCQUF1QixDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hHLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxPQUFPLENBQUMsTUFBYTtRQUM3QixNQUFNLFFBQVEsR0FBRyxDQUFDLE9BQU8sTUFBTSxDQUFDLEtBQUssS0FBSyxXQUFXLENBQUMsQ0FBQztRQUN2RCxNQUFNLGNBQWMsR0FBRyxPQUFPLE1BQU0sQ0FBQyxRQUFRLEtBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQy9HLE9BQU8sUUFBUSxJQUFJLGNBQWMsQ0FBQztJQUNuQyxDQUFDIn0=