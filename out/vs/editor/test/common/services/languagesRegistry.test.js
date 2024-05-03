/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/editor/common/services/languagesRegistry"], function (require, exports, assert, uri_1, utils_1, languagesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('LanguagesRegistry', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('output language does not have a name', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'outputLangId',
                    extensions: [],
                    aliases: [],
                    mimetypes: ['outputLanguageMimeType'],
                }]);
            assert.deepStrictEqual(registry.getSortedRegisteredLanguageNames(), []);
            registry.dispose();
        });
        test('language with alias does have a name', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'langId',
                    extensions: [],
                    aliases: ['LangName'],
                    mimetypes: ['bla'],
                }]);
            assert.deepStrictEqual(registry.getSortedRegisteredLanguageNames(), [{ languageName: 'LangName', languageId: 'langId' }]);
            assert.deepStrictEqual(registry.getLanguageName('langId'), 'LangName');
            registry.dispose();
        });
        test('language without alias gets a name', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'langId',
                    extensions: [],
                    mimetypes: ['bla'],
                }]);
            assert.deepStrictEqual(registry.getSortedRegisteredLanguageNames(), [{ languageName: 'langId', languageId: 'langId' }]);
            assert.deepStrictEqual(registry.getLanguageName('langId'), 'langId');
            registry.dispose();
        });
        test('bug #4360: f# not shown in status bar', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'langId',
                    extensions: ['.ext1'],
                    aliases: ['LangName'],
                    mimetypes: ['bla'],
                }]);
            registry._registerLanguages([{
                    id: 'langId',
                    extensions: ['.ext2'],
                    aliases: [],
                    mimetypes: ['bla'],
                }]);
            assert.deepStrictEqual(registry.getSortedRegisteredLanguageNames(), [{ languageName: 'LangName', languageId: 'langId' }]);
            assert.deepStrictEqual(registry.getLanguageName('langId'), 'LangName');
            registry.dispose();
        });
        test('issue #5278: Extension cannot override language name anymore', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'langId',
                    extensions: ['.ext1'],
                    aliases: ['LangName'],
                    mimetypes: ['bla'],
                }]);
            registry._registerLanguages([{
                    id: 'langId',
                    extensions: ['.ext2'],
                    aliases: ['BetterLanguageName'],
                    mimetypes: ['bla'],
                }]);
            assert.deepStrictEqual(registry.getSortedRegisteredLanguageNames(), [{ languageName: 'BetterLanguageName', languageId: 'langId' }]);
            assert.deepStrictEqual(registry.getLanguageName('langId'), 'BetterLanguageName');
            registry.dispose();
        });
        test('mimetypes are generated if necessary', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'langId'
                }]);
            assert.deepStrictEqual(registry.getMimeType('langId'), 'text/x-langId');
            registry.dispose();
        });
        test('first mimetype wins', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'langId',
                    mimetypes: ['text/langId', 'text/langId2']
                }]);
            assert.deepStrictEqual(registry.getMimeType('langId'), 'text/langId');
            registry.dispose();
        });
        test('first mimetype wins 2', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'langId'
                }]);
            registry._registerLanguages([{
                    id: 'langId',
                    mimetypes: ['text/langId']
                }]);
            assert.deepStrictEqual(registry.getMimeType('langId'), 'text/x-langId');
            registry.dispose();
        });
        test('aliases', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'a'
                }]);
            assert.deepStrictEqual(registry.getSortedRegisteredLanguageNames(), [{ languageName: 'a', languageId: 'a' }]);
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('a'), 'a');
            assert.deepStrictEqual(registry.getLanguageName('a'), 'a');
            registry._registerLanguages([{
                    id: 'a',
                    aliases: ['A1', 'A2']
                }]);
            assert.deepStrictEqual(registry.getSortedRegisteredLanguageNames(), [{ languageName: 'A1', languageId: 'a' }]);
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('a'), 'a');
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('a1'), 'a');
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('a2'), 'a');
            assert.deepStrictEqual(registry.getLanguageName('a'), 'A1');
            registry._registerLanguages([{
                    id: 'a',
                    aliases: ['A3', 'A4']
                }]);
            assert.deepStrictEqual(registry.getSortedRegisteredLanguageNames(), [{ languageName: 'A3', languageId: 'a' }]);
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('a'), 'a');
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('a1'), 'a');
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('a2'), 'a');
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('a3'), 'a');
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('a4'), 'a');
            assert.deepStrictEqual(registry.getLanguageName('a'), 'A3');
            registry.dispose();
        });
        test('empty aliases array means no alias', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'a'
                }]);
            assert.deepStrictEqual(registry.getSortedRegisteredLanguageNames(), [{ languageName: 'a', languageId: 'a' }]);
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('a'), 'a');
            assert.deepStrictEqual(registry.getLanguageName('a'), 'a');
            registry._registerLanguages([{
                    id: 'b',
                    aliases: []
                }]);
            assert.deepStrictEqual(registry.getSortedRegisteredLanguageNames(), [{ languageName: 'a', languageId: 'a' }]);
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('a'), 'a');
            assert.deepStrictEqual(registry.getLanguageIdByLanguageName('b'), 'b');
            assert.deepStrictEqual(registry.getLanguageName('a'), 'a');
            assert.deepStrictEqual(registry.getLanguageName('b'), null);
            registry.dispose();
        });
        test('extensions', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'a',
                    aliases: ['aName'],
                    extensions: ['aExt']
                }]);
            assert.deepStrictEqual(registry.getExtensions('a'), ['aExt']);
            registry._registerLanguages([{
                    id: 'a',
                    extensions: ['aExt2']
                }]);
            assert.deepStrictEqual(registry.getExtensions('a'), ['aExt', 'aExt2']);
            registry.dispose();
        });
        test('extensions of primary language registration come first', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'a',
                    extensions: ['aExt3']
                }]);
            assert.deepStrictEqual(registry.getExtensions('a')[0], 'aExt3');
            registry._registerLanguages([{
                    id: 'a',
                    configuration: uri_1.URI.file('conf.json'),
                    extensions: ['aExt']
                }]);
            assert.deepStrictEqual(registry.getExtensions('a')[0], 'aExt');
            registry._registerLanguages([{
                    id: 'a',
                    extensions: ['aExt2']
                }]);
            assert.deepStrictEqual(registry.getExtensions('a')[0], 'aExt');
            registry.dispose();
        });
        test('filenames', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'a',
                    aliases: ['aName'],
                    filenames: ['aFilename']
                }]);
            assert.deepStrictEqual(registry.getFilenames('a'), ['aFilename']);
            registry._registerLanguages([{
                    id: 'a',
                    filenames: ['aFilename2']
                }]);
            assert.deepStrictEqual(registry.getFilenames('a'), ['aFilename', 'aFilename2']);
            registry.dispose();
        });
        test('configuration', () => {
            const registry = new languagesRegistry_1.LanguagesRegistry(false);
            registry._registerLanguages([{
                    id: 'a',
                    aliases: ['aName'],
                    configuration: uri_1.URI.file('/path/to/aFilename')
                }]);
            assert.deepStrictEqual(registry.getConfigurationFiles('a'), [uri_1.URI.file('/path/to/aFilename')]);
            assert.deepStrictEqual(registry.getConfigurationFiles('aname'), []);
            assert.deepStrictEqual(registry.getConfigurationFiles('aName'), []);
            registry._registerLanguages([{
                    id: 'a',
                    configuration: uri_1.URI.file('/path/to/aFilename2')
                }]);
            assert.deepStrictEqual(registry.getConfigurationFiles('a'), [uri_1.URI.file('/path/to/aFilename'), uri_1.URI.file('/path/to/aFilename2')]);
            assert.deepStrictEqual(registry.getConfigurationFiles('aname'), []);
            assert.deepStrictEqual(registry.getConfigurationFiles('aName'), []);
            registry.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VzUmVnaXN0cnkudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL3NlcnZpY2VzL2xhbmd1YWdlc1JlZ2lzdHJ5LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUUvQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLEdBQUcsRUFBRTtZQUNqRCxNQUFNLFFBQVEsR0FBRyxJQUFJLHFDQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTlDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO29CQUM1QixFQUFFLEVBQUUsY0FBYztvQkFDbEIsVUFBVSxFQUFFLEVBQUU7b0JBQ2QsT0FBTyxFQUFFLEVBQUU7b0JBQ1gsU0FBUyxFQUFFLENBQUMsd0JBQXdCLENBQUM7aUJBQ3JDLENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsZ0NBQWdDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV4RSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1lBQ2pELE1BQU0sUUFBUSxHQUFHLElBQUkscUNBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFOUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7b0JBQzVCLEVBQUUsRUFBRSxRQUFRO29CQUNaLFVBQVUsRUFBRSxFQUFFO29CQUNkLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQztvQkFDckIsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDO2lCQUNsQixDQUFD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