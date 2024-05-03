/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/languageFeatureRegistry", "vs/editor/contrib/semanticTokens/common/getSemanticTokens", "vs/editor/test/common/testTextModel"], function (require, exports, assert, cancellation_1, errors_1, lifecycle_1, utils_1, languageFeatureRegistry_1, getSemanticTokens_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('getSemanticTokens', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #136540: semantic highlighting flickers', async () => {
            const disposables = new lifecycle_1.DisposableStore();
            const registry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
            const provider = new class {
                getLegend() {
                    return { tokenTypes: ['test'], tokenModifiers: [] };
                }
                provideDocumentSemanticTokens(model, lastResultId, token) {
                    throw (0, errors_1.canceled)();
                }
                releaseDocumentSemanticTokens(resultId) {
                }
            };
            disposables.add(registry.register('testLang', provider));
            const textModel = disposables.add((0, testTextModel_1.createTextModel)('example', 'testLang'));
            await (0, getSemanticTokens_1.getDocumentSemanticTokens)(registry, textModel, null, null, cancellation_1.CancellationToken.None).then((res) => {
                assert.fail();
            }, (err) => {
                assert.ok(!!err);
            });
            disposables.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0U2VtYW50aWNUb2tlbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc2VtYW50aWNUb2tlbnMvdGVzdC9icm93c2VyL2dldFNlbWFudGljVG9rZW5zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUUvQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLCtDQUErQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hFLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLE1BQU0sUUFBUSxHQUFHLElBQUksaURBQXVCLEVBQWtDLENBQUM7WUFDL0UsTUFBTSxRQUFRLEdBQUcsSUFBSTtnQkFDcEIsU0FBUztvQkFDUixPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsY0FBYyxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNyRCxDQUFDO2dCQUNELDZCQUE2QixDQUFDLEtBQWlCLEVBQUUsWUFBMkIsRUFBRSxLQUF3QjtvQkFDckcsTUFBTSxJQUFBLGlCQUFRLEdBQUUsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCw2QkFBNkIsQ0FBQyxRQUE0QjtnQkFDMUQsQ0FBQzthQUNELENBQUM7WUFFRixXQUFXLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFekQsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLCtCQUFlLEVBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFFMUUsTUFBTSxJQUFBLDZDQUF5QixFQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDckcsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2YsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ1YsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUM7WUFFSCxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFFSixDQUFDLENBQUMsQ0FBQyJ9