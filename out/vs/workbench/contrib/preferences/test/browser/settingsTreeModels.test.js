/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/preferences/browser/settingsTreeModels"], function (require, exports, assert, utils_1, settingsTreeModels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SettingsTree', () => {
        test('settingKeyToDisplayFormat', () => {
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('foo.bar'), {
                category: 'Foo',
                label: 'Bar'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('foo.bar.etc'), {
                category: 'Foo › Bar',
                label: 'Etc'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('fooBar.etcSomething'), {
                category: 'Foo Bar',
                label: 'Etc Something'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('foo'), {
                category: '',
                label: 'Foo'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('foo.1leading.number'), {
                category: 'Foo › 1leading',
                label: 'Number'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('foo.1Leading.number'), {
                category: 'Foo › 1 Leading',
                label: 'Number'
            });
        });
        test('settingKeyToDisplayFormat - with category', () => {
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('foo.bar', 'foo'), {
                category: '',
                label: 'Bar'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('disableligatures.ligatures', 'disableligatures'), {
                category: '',
                label: 'Ligatures'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('foo.bar.etc', 'foo'), {
                category: 'Bar',
                label: 'Etc'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('fooBar.etcSomething', 'foo'), {
                category: 'Foo Bar',
                label: 'Etc Something'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('foo.bar.etc', 'foo/bar'), {
                category: '',
                label: 'Etc'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('foo.bar.etc', 'something/foo'), {
                category: 'Bar',
                label: 'Etc'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('bar.etc', 'something.bar'), {
                category: '',
                label: 'Etc'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('fooBar.etc', 'fooBar'), {
                category: '',
                label: 'Etc'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('fooBar.somethingElse.etc', 'fooBar'), {
                category: 'Something Else',
                label: 'Etc'
            });
        });
        test('settingKeyToDisplayFormat - known acronym/term', () => {
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('css.someCssSetting'), {
                category: 'CSS',
                label: 'Some CSS Setting'
            });
            assert.deepStrictEqual((0, settingsTreeModels_1.settingKeyToDisplayFormat)('powershell.somePowerShellSetting'), {
                category: 'PowerShell',
                label: 'Some PowerShell Setting'
            });
        });
        test('parseQuery', () => {
            function testParseQuery(input, expected) {
                assert.deepStrictEqual((0, settingsTreeModels_1.parseQuery)(input), expected, input);
            }
            testParseQuery('', {
                tags: [],
                extensionFilters: [],
                query: '',
                featureFilters: [],
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('@modified', {
                tags: ['modified'],
                extensionFilters: [],
                query: '',
                featureFilters: [],
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('@tag:foo', {
                tags: ['foo'],
                extensionFilters: [],
                query: '',
                featureFilters: [],
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('@modified foo', {
                tags: ['modified'],
                extensionFilters: [],
                query: 'foo',
                featureFilters: [],
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('@tag:foo @modified', {
                tags: ['foo', 'modified'],
                extensionFilters: [],
                query: '',
                featureFilters: [],
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('@tag:foo @modified my query', {
                tags: ['foo', 'modified'],
                extensionFilters: [],
                query: 'my query',
                featureFilters: [],
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('test @modified query', {
                tags: ['modified'],
                extensionFilters: [],
                query: 'test  query',
                featureFilters: [],
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('test @modified', {
                tags: ['modified'],
                extensionFilters: [],
                query: 'test',
                featureFilters: [],
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('query has @ for some reason', {
                tags: [],
                extensionFilters: [],
                query: 'query has @ for some reason',
                featureFilters: [],
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('@ext:github.vscode-pull-request-github', {
                tags: [],
                extensionFilters: ['github.vscode-pull-request-github'],
                query: '',
                featureFilters: [],
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('@ext:github.vscode-pull-request-github,vscode.git', {
                tags: [],
                extensionFilters: ['github.vscode-pull-request-github', 'vscode.git'],
                query: '',
                featureFilters: [],
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('@feature:scm', {
                tags: [],
                extensionFilters: [],
                featureFilters: ['scm'],
                query: '',
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('@feature:scm,terminal', {
                tags: [],
                extensionFilters: [],
                featureFilters: ['scm', 'terminal'],
                query: '',
                idFilters: [],
                languageFilter: undefined
            });
            testParseQuery('@id:files.autoSave', {
                tags: [],
                extensionFilters: [],
                featureFilters: [],
                query: '',
                idFilters: ['files.autoSave'],
                languageFilter: undefined
            });
            testParseQuery('@id:files.autoSave,terminal.integrated.commandsToSkipShell', {
                tags: [],
                extensionFilters: [],
                featureFilters: [],
                query: '',
                idFilters: ['files.autoSave', 'terminal.integrated.commandsToSkipShell'],
                languageFilter: undefined
            });
            testParseQuery('@lang:cpp', {
                tags: [],
                extensionFilters: [],
                featureFilters: [],
                query: '',
                idFilters: [],
                languageFilter: 'cpp'
            });
            testParseQuery('@lang:cpp,python', {
                tags: [],
                extensionFilters: [],
                featureFilters: [],
                query: '',
                idFilters: [],
                languageFilter: 'cpp'
            });
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NUcmVlTW9kZWxzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL3Rlc3QvYnJvd3Nlci9zZXR0aW5nc1RyZWVNb2RlbHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtRQUMxQixJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLElBQUEsOENBQXlCLEVBQUMsU0FBUyxDQUFDLEVBQ3BDO2dCQUNDLFFBQVEsRUFBRSxLQUFLO2dCQUNmLEtBQUssRUFBRSxLQUFLO2FBQ1osQ0FBQyxDQUFDO1lBRUosTUFBTSxDQUFDLGVBQWUsQ0FDckIsSUFBQSw4Q0FBeUIsRUFBQyxhQUFhLENBQUMsRUFDeEM7Z0JBQ0MsUUFBUSxFQUFFLFdBQVc7Z0JBQ3JCLEtBQUssRUFBRSxLQUFLO2FBQ1osQ0FBQyxDQUFDO1lBRUosTUFBTSxDQUFDLGVBQWUsQ0FDckIsSUFBQSw4Q0FBeUIsRUFBQyxxQkFBcUIsQ0FBQyxFQUNoRDtnQkFDQyxRQUFRLEVBQUUsU0FBUztnQkFDbkIsS0FBSyxFQUFFLGVBQWU7YUFDdEIsQ0FBQyxDQUFDO1lBRUosTUFBTSxDQUFDLGVBQWUsQ0FDckIsSUFBQSw4Q0FBeUIsRUFBQyxLQUFLLENBQUMsRUFDaEM7Z0JBQ0MsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osS0FBSyxFQUFFLEtBQUs7YUFDWixDQUFDLENBQUM7WUFFSixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFBLDhDQUF5QixFQUFDLHFCQUFxQixDQUFDLEVBQ2hEO2dCQUNDLFFBQVEsRUFBRSxnQkFBZ0I7Z0JBQzFCLEtBQUssRUFBRSxRQUFRO2FB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