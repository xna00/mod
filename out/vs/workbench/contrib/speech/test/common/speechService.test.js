/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/speech/common/speechService"], function (require, exports, assert, utils_1, speechService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SpeechService', () => {
        test('resolve language', async () => {
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)(undefined), 'en-US');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)(3), 'en-US');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('foo'), 'en-US');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('foo-bar'), 'en-US');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('tr-TR'), 'tr-TR');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('zh-TW'), 'zh-TW');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('auto', 'en'), 'en-US');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('auto', 'tr'), 'tr-TR');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('auto', 'zh-tw'), 'zh-TW');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlZWNoU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zcGVlY2gvdGVzdC9jb21tb24vc3BlZWNoU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBRTNCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNuQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsOENBQThCLEVBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDhDQUE4QixFQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw4Q0FBOEIsRUFBQyxLQUFLLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsOENBQThCLEVBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFdkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDhDQUE4QixFQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw4Q0FBOEIsRUFBQyxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVyRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsOENBQThCLEVBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw4Q0FBOEIsRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDhDQUE4QixFQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM5RSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9