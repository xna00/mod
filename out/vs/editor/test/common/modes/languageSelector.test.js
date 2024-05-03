/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/editor/common/languageSelector"], function (require, exports, assert, uri_1, utils_1, languageSelector_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('LanguageSelector', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const model = {
            language: 'farboo',
            uri: uri_1.URI.parse('file:///testbed/file.fb')
        };
        test('score, invalid selector', function () {
            assert.strictEqual((0, languageSelector_1.score)({}, model.uri, model.language, true, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)(undefined, model.uri, model.language, true, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)(null, model.uri, model.language, true, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)('', model.uri, model.language, true, undefined, undefined), 0);
        });
        test('score, any language', function () {
            assert.strictEqual((0, languageSelector_1.score)({ language: '*' }, model.uri, model.language, true, undefined, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)('*', model.uri, model.language, true, undefined, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)('*', uri_1.URI.parse('foo:bar'), model.language, true, undefined, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)('farboo', uri_1.URI.parse('foo:bar'), model.language, true, undefined, undefined), 10);
        });
        test('score, default schemes', function () {
            const uri = uri_1.URI.parse('git:foo/file.txt');
            const language = 'farboo';
            assert.strictEqual((0, languageSelector_1.score)('*', uri, language, true, undefined, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)('farboo', uri, language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo', scheme: '' }, uri, language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo', scheme: 'git' }, uri, language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo', scheme: '*' }, uri, language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo' }, uri, language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: '*' }, uri, language, true, undefined, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)({ scheme: '*' }, uri, language, true, undefined, undefined), 5);
            assert.strictEqual((0, languageSelector_1.score)({ scheme: 'git' }, uri, language, true, undefined, undefined), 10);
        });
        test('score, filter', function () {
            assert.strictEqual((0, languageSelector_1.score)('farboo', model.uri, model.language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo' }, model.uri, model.language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo', scheme: 'file' }, model.uri, model.language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'farboo', scheme: 'http' }, model.uri, model.language, true, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)({ pattern: '**/*.fb' }, model.uri, model.language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ pattern: '**/*.fb', scheme: 'file' }, model.uri, model.language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)({ pattern: '**/*.fb' }, uri_1.URI.parse('foo:bar'), model.language, true, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)({ pattern: '**/*.fb', scheme: 'foo' }, uri_1.URI.parse('foo:bar'), model.language, true, undefined, undefined), 0);
            const doc = {
                uri: uri_1.URI.parse('git:/my/file.js'),
                langId: 'javascript'
            };
            assert.strictEqual((0, languageSelector_1.score)('javascript', doc.uri, doc.langId, true, undefined, undefined), 10); // 0;
            assert.strictEqual((0, languageSelector_1.score)({ language: 'javascript', scheme: 'git' }, doc.uri, doc.langId, true, undefined, undefined), 10); // 10;
            assert.strictEqual((0, languageSelector_1.score)('*', doc.uri, doc.langId, true, undefined, undefined), 5); // 5
            assert.strictEqual((0, languageSelector_1.score)('fooLang', doc.uri, doc.langId, true, undefined, undefined), 0); // 0
            assert.strictEqual((0, languageSelector_1.score)(['fooLang', '*'], doc.uri, doc.langId, true, undefined, undefined), 5); // 5
        });
        test('score, max(filters)', function () {
            const match = { language: 'farboo', scheme: 'file' };
            const fail = { language: 'farboo', scheme: 'http' };
            assert.strictEqual((0, languageSelector_1.score)(match, model.uri, model.language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)(fail, model.uri, model.language, true, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)([match, fail], model.uri, model.language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)([fail, fail], model.uri, model.language, true, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)(['farboo', '*'], model.uri, model.language, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)(['*', 'farboo'], model.uri, model.language, true, undefined, undefined), 10);
        });
        test('score hasAccessToAllModels', function () {
            const doc = {
                uri: uri_1.URI.parse('file:/my/file.js'),
                langId: 'javascript'
            };
            assert.strictEqual((0, languageSelector_1.score)('javascript', doc.uri, doc.langId, false, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'javascript', scheme: 'file' }, doc.uri, doc.langId, false, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)('*', doc.uri, doc.langId, false, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)('fooLang', doc.uri, doc.langId, false, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)(['fooLang', '*'], doc.uri, doc.langId, false, undefined, undefined), 0);
            assert.strictEqual((0, languageSelector_1.score)({ language: 'javascript', scheme: 'file', hasAccessToAllModels: true }, doc.uri, doc.langId, false, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)(['fooLang', '*', { language: '*', hasAccessToAllModels: true }], doc.uri, doc.langId, false, undefined, undefined), 5);
        });
        test('score, notebookType', function () {
            const obj = {
                uri: uri_1.URI.parse('vscode-notebook-cell:///my/file.js#blabla'),
                langId: 'javascript',
                notebookType: 'fooBook',
                notebookUri: uri_1.URI.parse('file:///my/file.js')
            };
            assert.strictEqual((0, languageSelector_1.score)('javascript', obj.uri, obj.langId, true, undefined, undefined), 10);
            assert.strictEqual((0, languageSelector_1.score)('javascript', obj.uri, obj.langId, true, obj.notebookUri, obj.notebookType), 10);
            assert.strictEqual((0, languageSelector_1.score)({ notebookType: 'fooBook' }, obj.uri, obj.langId, true, obj.notebookUri, obj.notebookType), 10);
            assert.strictEqual((0, languageSelector_1.score)({ notebookType: 'fooBook', language: 'javascript', scheme: 'file' }, obj.uri, obj.langId, true, obj.notebookUri, obj.notebookType), 10);
            assert.strictEqual((0, languageSelector_1.score)({ notebookType: 'fooBook', language: '*' }, obj.uri, obj.langId, true, obj.notebookUri, obj.notebookType), 10);
            assert.strictEqual((0, languageSelector_1.score)({ notebookType: '*', language: '*' }, obj.uri, obj.langId, true, obj.notebookUri, obj.notebookType), 5);
            assert.strictEqual((0, languageSelector_1.score)({ notebookType: '*', language: 'javascript' }, obj.uri, obj.langId, true, obj.notebookUri, obj.notebookType), 10);
        });
        test('Snippet choices lost #149363', function () {
            const selector = {
                scheme: 'vscode-notebook-cell',
                pattern: '/some/path/file.py',
                language: 'python'
            };
            const modelUri = uri_1.URI.parse('vscode-notebook-cell:///some/path/file.py');
            const nbUri = uri_1.URI.parse('file:///some/path/file.py');
            assert.strictEqual((0, languageSelector_1.score)(selector, modelUri, 'python', true, nbUri, 'jupyter'), 10);
            const selector2 = {
                ...selector,
                notebookType: 'jupyter'
            };
            assert.strictEqual((0, languageSelector_1.score)(selector2, modelUri, 'python', true, nbUri, 'jupyter'), 0);
        });
        test('Document selector match - unexpected result value #60232', function () {
            const selector = {
                language: 'json',
                scheme: 'file',
                pattern: '**/*.interface.json'
            };
            const value = (0, languageSelector_1.score)(selector, uri_1.URI.parse('file:///C:/Users/zlhe/Desktop/test.interface.json'), 'json', true, undefined, undefined);
            assert.strictEqual(value, 10);
        });
        test('Document selector match - platform paths #99938', function () {
            const selector = {
                pattern: {
                    base: '/home/user/Desktop',
                    pattern: '*.json'
                }
            };
            const value = (0, languageSelector_1.score)(selector, uri_1.URI.file('/home/user/Desktop/test.json'), 'json', true, undefined, undefined);
            assert.strictEqual(value, 10);
        });
        test('NotebookType without notebook', function () {
            const obj = {
                uri: uri_1.URI.parse('file:///my/file.bat'),
                langId: 'bat',
            };
            let value = (0, languageSelector_1.score)({
                language: 'bat',
                notebookType: 'xxx'
            }, obj.uri, obj.langId, true, undefined, undefined);
            assert.strictEqual(value, 0);
            value = (0, languageSelector_1.score)({
                language: 'bat',
                notebookType: '*'
            }, obj.uri, obj.langId, true, undefined, undefined);
            assert.strictEqual(value, 0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VTZWxlY3Rvci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZXMvbGFuZ3VhZ2VTZWxlY3Rvci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRTtRQUV6QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsTUFBTSxLQUFLLEdBQUc7WUFDYixRQUFRLEVBQUUsUUFBUTtZQUNsQixHQUFHLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQztTQUN6QyxDQUFDO1FBRUYsSUFBSSxDQUFDLHlCQUF5QixFQUFFO1lBQy9CLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4RixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFLLEVBQUMsSUFBSyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6RixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQkFBcUIsRUFBRTtZQUMzQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFekYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFLLEVBQUMsR0FBRyxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BHLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLFFBQVEsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzRyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3QkFBd0IsRUFBRTtZQUU5QixNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDMUMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBRTFCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFLLEVBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3RyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNoSCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM5RyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDakcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFLLEVBQUMsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTNGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6RixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQ3JCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMvRixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3RyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzdILE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFNUgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFLLEVBQUMsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDN0csTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFLLEVBQUMsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3SCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2SCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRJLE1BQU0sR0FBRyxHQUFHO2dCQUNYLEdBQUcsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDO2dCQUNqQyxNQUFNLEVBQUUsWUFBWTthQUNwQixDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFLLEVBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSztZQUNuRyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtZQUNqSSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO1lBQ3hGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7WUFDOUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFLLEVBQUMsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBQ3RHLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFCQUFxQixFQUFFO1lBQzNCLE1BQU0sS0FBSyxHQUFHLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDckQsTUFBTSxJQUFJLEdBQUcsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUVwRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDNUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFLLEVBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BHLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFF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YUFDNUMsQ0FBQztZQUVGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3RixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMxRyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQUssRUFBQyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pILE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2pLLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBSyxFQUFDLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMs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