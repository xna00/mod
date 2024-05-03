/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/languageService"], function (require, exports, assert, utils_1, modesRegistry_1, languageService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('LanguageService', () => {
        test('LanguageSelection does not leak a disposable', () => {
            const languageService = new languageService_1.LanguageService();
            (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                const languageSelection = languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
                assert.strictEqual(languageSelection.languageId, modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            });
            (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                const languageSelection = languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
                const listener = languageSelection.onDidChange(() => { });
                assert.strictEqual(languageSelection.languageId, modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
                listener.dispose();
            });
            languageService.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9zZXJ2aWNlcy9sYW5ndWFnZVNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBRTdCLElBQUksQ0FBQyw4Q0FBOEMsRUFBRSxHQUFHLEVBQUU7WUFDekQsTUFBTSxlQUFlLEdBQUcsSUFBSSxpQ0FBZSxFQUFFLENBQUM7WUFDOUMsSUFBQSxtQ0FBMkIsRUFBQyxHQUFHLEVBQUU7Z0JBQ2hDLE1BQU0saUJBQWlCLEdBQUcsZUFBZSxDQUFDLFVBQVUsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO2dCQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxxQ0FBcUIsQ0FBQyxDQUFDO1lBQ3pFLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBQSxtQ0FBMkIsRUFBQyxHQUFHLEVBQUU7Z0JBQ2hDLE1BQU0saUJBQWlCLEdBQUcsZUFBZSxDQUFDLFVBQVUsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO2dCQUM1RSxNQUFNLFFBQVEsR0FBRyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLHFDQUFxQixDQUFDLENBQUM7Z0JBQ3hFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixDQUFDLENBQUMsQ0FBQztZQUNILGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUUzQixDQUFDLENBQUMsQ0FBQztJQUVKLENBQUMsQ0FBQyxDQUFDIn0=