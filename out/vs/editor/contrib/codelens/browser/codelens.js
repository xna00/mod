/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/services/model", "vs/platform/commands/common/commands", "vs/editor/common/services/languageFeatures"], function (require, exports, cancellation_1, errors_1, lifecycle_1, types_1, uri_1, model_1, commands_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeLensModel = void 0;
    exports.getCodeLensModel = getCodeLensModel;
    class CodeLensModel {
        constructor() {
            this.lenses = [];
            this._disposables = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this._disposables.dispose();
        }
        get isDisposed() {
            return this._disposables.isDisposed;
        }
        add(list, provider) {
            this._disposables.add(list);
            for (const symbol of list.lenses) {
                this.lenses.push({ symbol, provider });
            }
        }
    }
    exports.CodeLensModel = CodeLensModel;
    async function getCodeLensModel(registry, model, token) {
        const provider = registry.ordered(model);
        const providerRanks = new Map();
        const result = new CodeLensModel();
        const promises = provider.map(async (provider, i) => {
            providerRanks.set(provider, i);
            try {
                const list = await Promise.resolve(provider.provideCodeLenses(model, token));
                if (list) {
                    result.add(list, provider);
                }
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
            }
        });
        await Promise.all(promises);
        result.lenses = result.lenses.sort((a, b) => {
            // sort by lineNumber, provider-rank, and column
            if (a.symbol.range.startLineNumber < b.symbol.range.startLineNumber) {
                return -1;
            }
            else if (a.symbol.range.startLineNumber > b.symbol.range.startLineNumber) {
                return 1;
            }
            else if ((providerRanks.get(a.provider)) < (providerRanks.get(b.provider))) {
                return -1;
            }
            else if ((providerRanks.get(a.provider)) > (providerRanks.get(b.provider))) {
                return 1;
            }
            else if (a.symbol.range.startColumn < b.symbol.range.startColumn) {
                return -1;
            }
            else if (a.symbol.range.startColumn > b.symbol.range.startColumn) {
                return 1;
            }
            else {
                return 0;
            }
        });
        return result;
    }
    commands_1.CommandsRegistry.registerCommand('_executeCodeLensProvider', function (accessor, ...args) {
        let [uri, itemResolveCount] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(uri));
        (0, types_1.assertType)(typeof itemResolveCount === 'number' || !itemResolveCount);
        const { codeLensProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            throw (0, errors_1.illegalArgument)();
        }
        const result = [];
        const disposables = new lifecycle_1.DisposableStore();
        return getCodeLensModel(codeLensProvider, model, cancellation_1.CancellationToken.None).then(value => {
            disposables.add(value);
            const resolve = [];
            for (const item of value.lenses) {
                if (itemResolveCount === undefined || itemResolveCount === null || Boolean(item.symbol.command)) {
                    result.push(item.symbol);
                }
                else if (itemResolveCount-- > 0 && item.provider.resolveCodeLens) {
                    resolve.push(Promise.resolve(item.provider.resolveCodeLens(model, item.symbol, cancellation_1.CancellationToken.None)).then(symbol => result.push(symbol || item.symbol)));
                }
            }
            return Promise.all(resolve);
        }).then(() => {
            return result;
        }).finally(() => {
            // make sure to return results, then (on next tick)
            // dispose the results
            setTimeout(() => disposables.dispose(), 100);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZWxlbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvZGVsZW5zL2Jyb3dzZXIvY29kZWxlbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBeUNoRyw0Q0F5Q0M7SUEvREQsTUFBYSxhQUFhO1FBQTFCO1lBRUMsV0FBTSxHQUFtQixFQUFFLENBQUM7WUFFWCxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBZ0J2RCxDQUFDO1FBZEEsT0FBTztZQUNOLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDN0IsQ0FBQztRQUVELElBQUksVUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7UUFDckMsQ0FBQztRQUVELEdBQUcsQ0FBQyxJQUFrQixFQUFFLFFBQTBCO1lBQ2pELElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVCLEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFwQkQsc0NBb0JDO0lBRU0sS0FBSyxVQUFVLGdCQUFnQixDQUFDLFFBQW1ELEVBQUUsS0FBaUIsRUFBRSxLQUF3QjtRQUV0SSxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxFQUE0QixDQUFDO1FBQzFELE1BQU0sTUFBTSxHQUFHLElBQUksYUFBYSxFQUFFLENBQUM7UUFFbkMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBRW5ELGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRS9CLElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLElBQUksRUFBRSxDQUFDO29CQUNWLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QixDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2QsSUFBQSxrQ0FBeUIsRUFBQyxHQUFHLENBQUMsQ0FBQztZQUNoQyxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFNUIsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMzQyxnREFBZ0Q7WUFDaEQsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3JFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO2lCQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUM1RSxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7aUJBQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hGLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO2lCQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNoRixPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7aUJBQU0sSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO2lCQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNwRSxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVELDJCQUFnQixDQUFDLGVBQWUsQ0FBQywwQkFBMEIsRUFBRSxVQUFVLFFBQVEsRUFBRSxHQUFHLElBQXNDO1FBQ3pILElBQUksQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDbkMsSUFBQSxrQkFBVSxFQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMzQixJQUFBLGtCQUFVLEVBQUMsT0FBTyxnQkFBZ0IsS0FBSyxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRXRFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkNBQXdCLENBQUMsQ0FBQztRQUVwRSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFCQUFhLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1osTUFBTSxJQUFBLHdCQUFlLEdBQUUsQ0FBQztRQUN6QixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQWUsRUFBRSxDQUFDO1FBQzlCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBQzFDLE9BQU8sZ0JBQWdCLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUVyRixXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLE1BQU0sT0FBTyxHQUFtQixFQUFFLENBQUM7WUFFbkMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pDLElBQUksZ0JBQWdCLEtBQUssU0FBUyxJQUFJLGdCQUFnQixLQUFLLElBQUksSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNqRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUIsQ0FBQztxQkFBTSxJQUFJLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3BFLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdKLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDWixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDZixtREFBbUQ7WUFDbkQsc0JBQXNCO1lBQ3RCLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9