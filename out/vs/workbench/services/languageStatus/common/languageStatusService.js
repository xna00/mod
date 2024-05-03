/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/languageFeatureRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation"], function (require, exports, strings_1, languageFeatureRegistry_1, extensions_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ILanguageStatusService = void 0;
    exports.ILanguageStatusService = (0, instantiation_1.createDecorator)('ILanguageStatusService');
    class LanguageStatusServiceImpl {
        constructor() {
            this._provider = new languageFeatureRegistry_1.LanguageFeatureRegistry();
            this.onDidChange = this._provider.onDidChange;
        }
        addStatus(status) {
            return this._provider.register(status.selector, status);
        }
        getLanguageStatus(model) {
            return this._provider.ordered(model).sort((a, b) => {
                let res = b.severity - a.severity;
                if (res === 0) {
                    res = (0, strings_1.compare)(a.source, b.source);
                }
                if (res === 0) {
                    res = (0, strings_1.compare)(a.id, b.id);
                }
                return res;
            });
        }
    }
    (0, extensions_1.registerSingleton)(exports.ILanguageStatusService, LanguageStatusServiceImpl, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VTdGF0dXNTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvbGFuZ3VhZ2VTdGF0dXMvY29tbW9uL2xhbmd1YWdlU3RhdHVzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQ25GLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSwrQkFBZSxFQUF5Qix3QkFBd0IsQ0FBQyxDQUFDO0lBY3hHLE1BQU0seUJBQXlCO1FBQS9CO1lBSWtCLGNBQVMsR0FBRyxJQUFJLGlEQUF1QixFQUFtQixDQUFDO1lBRW5FLGdCQUFXLEdBQWUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUM7UUFrQi9ELENBQUM7UUFoQkEsU0FBUyxDQUFDLE1BQXVCO1lBQ2hDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBRUQsaUJBQWlCLENBQUMsS0FBaUI7WUFDbEMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2xELElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQztnQkFDbEMsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2YsR0FBRyxHQUFHLElBQUEsaUJBQU8sRUFBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztnQkFDRCxJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDZixHQUFHLEdBQUcsSUFBQSxpQkFBTyxFQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMzQixDQUFDO2dCQUNELE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDhCQUFzQixFQUFFLHlCQUF5QixvQ0FBNEIsQ0FBQyJ9