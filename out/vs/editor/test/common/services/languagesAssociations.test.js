/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/editor/common/services/languagesAssociations"], function (require, exports, assert, uri_1, utils_1, languagesAssociations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('LanguagesAssociations', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Dynamically Register Text Mime', () => {
            let guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('foo.monaco'));
            assert.deepStrictEqual(guess, ['application/unknown']);
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco', extension: '.monaco', mime: 'text/monaco' });
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('foo.monaco'));
            assert.deepStrictEqual(guess, ['text/monaco', 'text/plain']);
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('.monaco'));
            assert.deepStrictEqual(guess, ['text/monaco', 'text/plain']);
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'codefile', filename: 'Codefile', mime: 'text/code' });
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('Codefile'));
            assert.deepStrictEqual(guess, ['text/code', 'text/plain']);
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('foo.Codefile'));
            assert.deepStrictEqual(guess, ['application/unknown']);
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'docker', filepattern: 'Docker*', mime: 'text/docker' });
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('Docker-debug'));
            assert.deepStrictEqual(guess, ['text/docker', 'text/plain']);
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('docker-PROD'));
            assert.deepStrictEqual(guess, ['text/docker', 'text/plain']);
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'niceregex', mime: 'text/nice-regex', firstline: /RegexesAreNice/ });
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('Randomfile.noregistration'), 'RegexesAreNice');
            assert.deepStrictEqual(guess, ['text/nice-regex', 'text/plain']);
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('Randomfile.noregistration'), 'RegexesAreNotNice');
            assert.deepStrictEqual(guess, ['application/unknown']);
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('Codefile'), 'RegexesAreNice');
            assert.deepStrictEqual(guess, ['text/code', 'text/plain']);
        });
        test('Mimes Priority', () => {
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco', extension: '.monaco', mime: 'text/monaco' });
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'foobar', mime: 'text/foobar', firstline: /foobar/ });
            let guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('foo.monaco'));
            assert.deepStrictEqual(guess, ['text/monaco', 'text/plain']);
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('foo.monaco'), 'foobar');
            assert.deepStrictEqual(guess, ['text/monaco', 'text/plain']);
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'docker', filename: 'dockerfile', mime: 'text/winner' });
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'docker', filepattern: 'dockerfile*', mime: 'text/looser' });
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('dockerfile'));
            assert.deepStrictEqual(guess, ['text/winner', 'text/plain']);
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'azure-looser', mime: 'text/azure-looser', firstline: /azure/ });
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'azure-winner', mime: 'text/azure-winner', firstline: /azure/ });
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('azure'), 'azure');
            assert.deepStrictEqual(guess, ['text/azure-winner', 'text/plain']);
        });
        test('Specificity priority 1', () => {
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco2', extension: '.monaco2', mime: 'text/monaco2' });
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco2', filename: 'specific.monaco2', mime: 'text/specific-monaco2' });
            assert.deepStrictEqual((0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('specific.monaco2')), ['text/specific-monaco2', 'text/plain']);
            assert.deepStrictEqual((0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('foo.monaco2')), ['text/monaco2', 'text/plain']);
        });
        test('Specificity priority 2', () => {
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco3', filename: 'specific.monaco3', mime: 'text/specific-monaco3' });
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco3', extension: '.monaco3', mime: 'text/monaco3' });
            assert.deepStrictEqual((0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('specific.monaco3')), ['text/specific-monaco3', 'text/plain']);
            assert.deepStrictEqual((0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('foo.monaco3')), ['text/monaco3', 'text/plain']);
        });
        test('Mimes Priority - Longest Extension wins', () => {
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco', extension: '.monaco', mime: 'text/monaco' });
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco', extension: '.monaco.xml', mime: 'text/monaco-xml' });
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco', extension: '.monaco.xml.build', mime: 'text/monaco-xml-build' });
            let guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('foo.monaco'));
            assert.deepStrictEqual(guess, ['text/monaco', 'text/plain']);
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('foo.monaco.xml'));
            assert.deepStrictEqual(guess, ['text/monaco-xml', 'text/plain']);
            guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('foo.monaco.xml.build'));
            assert.deepStrictEqual(guess, ['text/monaco-xml-build', 'text/plain']);
        });
        test('Mimes Priority - User configured wins', () => {
            (0, languagesAssociations_1.registerConfiguredLanguageAssociation)({ id: 'monaco', extension: '.monaco.xnl', mime: 'text/monaco' });
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco', extension: '.monaco.xml', mime: 'text/monaco-xml' });
            const guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('foo.monaco.xnl'));
            assert.deepStrictEqual(guess, ['text/monaco', 'text/plain']);
        });
        test('Mimes Priority - Pattern matches on path if specified', () => {
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco', filepattern: '**/dot.monaco.xml', mime: 'text/monaco' });
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'other', filepattern: '*ot.other.xml', mime: 'text/other' });
            const guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('/some/path/dot.monaco.xml'));
            assert.deepStrictEqual(guess, ['text/monaco', 'text/plain']);
        });
        test('Mimes Priority - Last registered mime wins', () => {
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'monaco', filepattern: '**/dot.monaco.xml', mime: 'text/monaco' });
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'other', filepattern: '**/dot.monaco.xml', mime: 'text/other' });
            const guess = (0, languagesAssociations_1.getMimeTypes)(uri_1.URI.file('/some/path/dot.monaco.xml'));
            assert.deepStrictEqual(guess, ['text/other', 'text/plain']);
        });
        test('Data URIs', () => {
            (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: 'data', extension: '.data', mime: 'text/data' });
            assert.deepStrictEqual((0, languagesAssociations_1.getMimeTypes)(uri_1.URI.parse(`data:;label:something.data;description:data,`)), ['text/data', 'text/plain']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VzQXNzb2NpYXRpb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9zZXJ2aWNlcy9sYW5ndWFnZXNBc3NvY2lhdGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBRW5DLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1lBQzNDLElBQUksS0FBSyxHQUFHLElBQUEsb0NBQVksRUFBQyxTQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7WUFFdkQsSUFBQSwyREFBbUMsRUFBQyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUNqRyxLQUFLLEdBQUcsSUFBQSxvQ0FBWSxFQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBRTdELEtBQUssR0FBRyxJQUFBLG9DQUFZLEVBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFFN0QsSUFBQSwyREFBbUMsRUFBQyxFQUFFLEVBQUUs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QUM7WUFFM0csTUFBTSxLQUFLLEdBQUcsSUFBQSxvQ0FBWSxFQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDN0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtZQUN0QixJQUFBLDJEQUFtQyxFQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBRTNGLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSxvQ0FBWSxFQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsOENBQThDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDOUgsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9