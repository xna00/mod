/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/languages/languageConfiguration", "vs/editor/test/common/modes/testLanguageConfigurationService"], function (require, exports, assert, utils_1, languageConfiguration_1, testLanguageConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('StandardAutoClosingPairConditional', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Missing notIn', () => {
            const v = new languageConfiguration_1.StandardAutoClosingPairConditional({ open: '{', close: '}' });
            assert.strictEqual(v.isOK(0 /* StandardTokenType.Other */), true);
            assert.strictEqual(v.isOK(1 /* StandardTokenType.Comment */), true);
            assert.strictEqual(v.isOK(2 /* StandardTokenType.String */), true);
            assert.strictEqual(v.isOK(3 /* StandardTokenType.RegEx */), true);
        });
        test('Empty notIn', () => {
            const v = new languageConfiguration_1.StandardAutoClosingPairConditional({ open: '{', close: '}', notIn: [] });
            assert.strictEqual(v.isOK(0 /* StandardTokenType.Other */), true);
            assert.strictEqual(v.isOK(1 /* StandardTokenType.Comment */), true);
            assert.strictEqual(v.isOK(2 /* StandardTokenType.String */), true);
            assert.strictEqual(v.isOK(3 /* StandardTokenType.RegEx */), true);
        });
        test('Invalid notIn', () => {
            const v = new languageConfiguration_1.StandardAutoClosingPairConditional({ open: '{', close: '}', notIn: ['bla'] });
            assert.strictEqual(v.isOK(0 /* StandardTokenType.Other */), true);
            assert.strictEqual(v.isOK(1 /* StandardTokenType.Comment */), true);
            assert.strictEqual(v.isOK(2 /* StandardTokenType.String */), true);
            assert.strictEqual(v.isOK(3 /* StandardTokenType.RegEx */), true);
        });
        test('notIn in strings', () => {
            const v = new languageConfiguration_1.StandardAutoClosingPairConditional({ open: '{', close: '}', notIn: ['string'] });
            assert.strictEqual(v.isOK(0 /* StandardTokenType.Other */), true);
            assert.strictEqual(v.isOK(1 /* StandardTokenType.Comment */), true);
            assert.strictEqual(v.isOK(2 /* StandardTokenType.String */), false);
            assert.strictEqual(v.isOK(3 /* StandardTokenType.RegEx */), true);
        });
        test('notIn in comments', () => {
            const v = new languageConfiguration_1.StandardAutoClosingPairConditional({ open: '{', close: '}', notIn: ['comment'] });
            assert.strictEqual(v.isOK(0 /* StandardTokenType.Other */), true);
            assert.strictEqual(v.isOK(1 /* StandardTokenType.Comment */), false);
            assert.strictEqual(v.isOK(2 /* StandardTokenType.String */), true);
            assert.strictEqual(v.isOK(3 /* StandardTokenType.RegEx */), true);
        });
        test('notIn in regex', () => {
            const v = new languageConfiguration_1.StandardAutoClosingPairConditional({ open: '{', close: '}', notIn: ['regex'] });
            assert.strictEqual(v.isOK(0 /* StandardTokenType.Other */), true);
            assert.strictEqual(v.isOK(1 /* StandardTokenType.Comment */), true);
            assert.strictEqual(v.isOK(2 /* StandardTokenType.String */), true);
            assert.strictEqual(v.isOK(3 /* StandardTokenType.RegEx */), false);
        });
        test('notIn in strings nor comments', () => {
            const v = new languageConfiguration_1.StandardAutoClosingPairConditional({ open: '{', close: '}', notIn: ['string', 'comment'] });
            assert.strictEqual(v.isOK(0 /* StandardTokenType.Other */), true);
            assert.strictEqual(v.isOK(1 /* StandardTokenType.Comment */), false);
            assert.strictEqual(v.isOK(2 /* StandardTokenType.String */), false);
            assert.strictEqual(v.isOK(3 /* StandardTokenType.RegEx */), true);
        });
        test('notIn in strings nor regex', () => {
            const v = new languageConfiguration_1.StandardAutoClosingPairConditional({ open: '{', close: '}', notIn: ['string', 'regex'] });
            assert.strictEqual(v.isOK(0 /* StandardTokenType.Other */), true);
            assert.strictEqual(v.isOK(1 /* StandardTokenType.Comment */), true);
            assert.strictEqual(v.isOK(2 /* StandardTokenType.String */), false);
            assert.strictEqual(v.isOK(3 /* StandardTokenType.RegEx */), false);
        });
        test('notIn in comments nor regex', () => {
            const v = new languageConfiguration_1.StandardAutoClosingPairConditional({ open: '{', close: '}', notIn: ['comment', 'regex'] });
            assert.strictEqual(v.isOK(0 /* StandardTokenType.Other */), true);
            assert.strictEqual(v.isOK(1 /* StandardTokenType.Comment */), false);
            assert.strictEqual(v.isOK(2 /* StandardTokenType.String */), true);
            assert.strictEqual(v.isOK(3 /* StandardTokenType.RegEx */), false);
        });
        test('notIn in strings, comments nor regex', () => {
            const v = new languageConfiguration_1.StandardAutoClosingPairConditional({ open: '{', close: '}', notIn: ['string', 'comment', 'regex'] });
            assert.strictEqual(v.isOK(0 /* StandardTokenType.Other */), true);
            assert.strictEqual(v.isOK(1 /* StandardTokenType.Comment */), false);
            assert.strictEqual(v.isOK(2 /* StandardTokenType.String */), false);
            assert.strictEqual(v.isOK(3 /* StandardTokenType.RegEx */), false);
        });
        test('language configurations priorities', () => {
            const languageConfigurationService = new testLanguageConfigurationService_1.TestLanguageConfigurationService();
            const id = 'testLang1';
            const d1 = languageConfigurationService.register(id, { comments: { lineComment: '1' } }, 100);
            const d2 = languageConfigurationService.register(id, { comments: { lineComment: '2' } }, 10);
            assert.strictEqual(languageConfigurationService.getLanguageConfiguration(id).comments?.lineCommentToken, '1');
            d1.dispose();
            d2.dispose();
            languageConfigurationService.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VDb25maWd1cmF0aW9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2Rlcy9sYW5ndWFnZUNvbmZpZ3VyYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxFQUFFO1FBRWhELElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtZQUMxQixNQUFNLENBQUMsR0FBRyxJQUFJLDBEQUFrQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLGlDQUF5QixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksbUNBQTJCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxrQ0FBMEIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLGlDQUF5QixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzNELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7WUFDeEIsTUFBTSxDQUFDLEdBQUcsSUFBSSwwREFBa0MsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN2RixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLGlDQUF5QixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksbUNBQTJCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxrQ0FBMEIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLGlDQUF5QixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzNELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7WUFDMUIsTUFBTSxDQUFDLEdBQUcsSUFBSSwwREFBa0MsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDNUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLG1DQUEyQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksa0NBQTBCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDN0IsTUFBTSxDQUFDLEdBQUcsSUFBSSwwREFBa0MsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDL0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLG1DQUEyQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksa0NBQTBCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7WUFDOUIsTUFBTSxDQUFDLEdBQUcsSUFBSSwwREFBa0MsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDaEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLG1DQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksa0NBQTBCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7WUFDM0IsTUFBTSxDQUFDLEdBQUcsSUFBSSwwREFBa0MsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLG1DQUEyQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksa0NBQTBCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7WUFDMUMsTUFBTSxDQUFDLEdBQUcsSUFBSSwwREFBa0MsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksaUNBQXlCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxtQ0FBMkIsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLGtDQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksaUNBQXlCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1lBQ3ZDLE1BQU0sQ0FBQyxHQUFHLElBQUksMERBQWtDLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN4RyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLGlDQUF5QixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksbUNBQTJCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxrQ0FBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLGlDQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtZQUN4QyxNQUFNLENBQUMsR0FBRyxJQUFJLDBEQUFrQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDekcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLG1DQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksa0NBQTBCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxpQ0FBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLEVBQUU7WUFDakQsTUFBTSxDQUFDLEdBQUcsSUFBSSwwREFBa0MsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNuSCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLGlDQUF5QixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksbUNBQTJCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxrQ0FBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLGlDQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUMvQyxNQUFNLDRCQUE0QixHQUFHLElBQUksbUVBQWdDLEVBQUUsQ0FBQztZQUM1RSxNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUM7WUFDdkIsTUFBTSxFQUFFLEdBQUcsNEJBQTRCLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzlGLE1BQU0sRUFBRSxHQUFHLDRCQUE0QixDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3RixNQUFNLENBQUMsV0FBVyxDQUFDLDRCQUE0QixDQUFDLHdCQUF3QixDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM5RyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDYixFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDYiw0QkFBNEIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4QyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=