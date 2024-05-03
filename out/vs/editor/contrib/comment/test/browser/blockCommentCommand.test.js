/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/test/common/utils", "vs/editor/common/core/selection", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/comment/browser/blockCommentCommand", "vs/editor/test/browser/testCommand"], function (require, exports, utils_1, selection_1, language_1, languageConfigurationRegistry_1, blockCommentCommand_1, testCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function _testCommentCommand(lines, selection, commandFactory, expectedLines, expectedSelection) {
        const languageId = 'commentMode';
        const prepare = (accessor, disposables) => {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const languageService = accessor.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                comments: { lineComment: '!@#', blockComment: ['<0', '0>'] }
            }));
        };
        (0, testCommand_1.testCommand)(lines, languageId, selection, commandFactory, expectedLines, expectedSelection, undefined, prepare);
    }
    function testBlockCommentCommand(lines, selection, expectedLines, expectedSelection) {
        _testCommentCommand(lines, selection, (accessor, sel) => new blockCommentCommand_1.BlockCommentCommand(sel, true, accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService)), expectedLines, expectedSelection);
    }
    suite('Editor Contrib - Block Comment Command', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('empty selection wraps itself', function () {
            testBlockCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 3), [
                'fi<0  0>rst',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 6, 1, 6));
        });
        test('invisible selection ignored', function () {
            testBlockCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 1, 1), [
                '<0 first',
                ' 0>\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 4, 2, 1));
        });
        test('bug9511', () => {
            testBlockCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 6, 1, 1), [
                '<0 first 0>',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 4, 1, 9));
            testBlockCommentCommand([
                '<0first0>',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 8, 1, 3), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 6));
        });
        test('one line selection', function () {
            testBlockCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 6, 1, 3), [
                'fi<0 rst 0>',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 6, 1, 9));
        });
        test('one line selection toggle', function () {
            testBlockCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 6, 1, 3), [
                'fi<0 rst 0>',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 6, 1, 9));
            testBlockCommentCommand([
                'fi<0rst0>',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 8, 1, 5), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 6));
            testBlockCommentCommand([
                '<0 first 0>',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 10, 1, 1), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 6));
            testBlockCommentCommand([
                '<0 first0>',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 9, 1, 1), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 6));
            testBlockCommentCommand([
                '<0first 0>',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 9, 1, 1), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 6));
            testBlockCommentCommand([
                'fi<0rst0>',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 8, 1, 5), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 6));
        });
        test('multi line selection', function () {
            testBlockCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 4, 1, 1), [
                '<0 first',
                '\tse 0>cond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 4, 2, 4));
        });
        test('multi line selection toggle', function () {
            testBlockCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 4, 1, 1), [
                '<0 first',
                '\tse 0>cond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 4, 2, 4));
            testBlockCommentCommand([
                '<0first',
                '\tse0>cond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 4, 1, 3), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 2, 4));
            testBlockCommentCommand([
                '<0 first',
                '\tse0>cond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 4, 1, 3), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 2, 4));
            testBlockCommentCommand([
                '<0first',
                '\tse 0>cond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 4, 1, 3), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 2, 4));
            testBlockCommentCommand([
                '<0 first',
                '\tse 0>cond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 4, 1, 3), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 2, 4));
        });
        test('fuzzy removes', function () {
            testBlockCommentCommand([
                'asd <0 qwe',
                'asd 0> qwe'
            ], new selection_1.Selection(2, 5, 1, 7), [
                'asd qwe',
                'asd qwe'
            ], new selection_1.Selection(1, 5, 2, 4));
            testBlockCommentCommand([
                'asd <0 qwe',
                'asd 0> qwe'
            ], new selection_1.Selection(2, 5, 1, 6), [
                'asd qwe',
                'asd qwe'
            ], new selection_1.Selection(1, 5, 2, 4));
            testBlockCommentCommand([
                'asd <0 qwe',
                'asd 0> qwe'
            ], new selection_1.Selection(2, 5, 1, 5), [
                'asd qwe',
                'asd qwe'
            ], new selection_1.Selection(1, 5, 2, 4));
            testBlockCommentCommand([
                'asd <0 qwe',
                'asd 0> qwe'
            ], new selection_1.Selection(2, 5, 1, 11), [
                'asd qwe',
                'asd qwe'
            ], new selection_1.Selection(1, 5, 2, 4));
            testBlockCommentCommand([
                'asd <0 qwe',
                'asd 0> qwe'
            ], new selection_1.Selection(2, 1, 1, 11), [
                'asd qwe',
                'asd qwe'
            ], new selection_1.Selection(1, 5, 2, 4));
            testBlockCommentCommand([
                'asd <0 qwe',
                'asd 0> qwe'
            ], new selection_1.Selection(2, 7, 1, 11), [
                'asd qwe',
                'asd qwe'
            ], new selection_1.Selection(1, 5, 2, 4));
        });
        test('bug #30358', function () {
            testBlockCommentCommand([
                '<0 start 0> middle end',
            ], new selection_1.Selection(1, 20, 1, 23), [
                '<0 start 0> middle <0 end 0>'
            ], new selection_1.Selection(1, 23, 1, 26));
            testBlockCommentCommand([
                '<0 start 0> middle <0 end 0>'
            ], new selection_1.Selection(1, 13, 1, 19), [
                '<0 start 0> <0 middle 0> <0 end 0>'
            ], new selection_1.Selection(1, 16, 1, 22));
        });
        test('issue #34618', function () {
            testBlockCommentCommand([
                '<0  0> middle end',
            ], new selection_1.Selection(1, 4, 1, 4), [
                ' middle end'
            ], new selection_1.Selection(1, 1, 1, 1));
        });
        test('insertSpace false', () => {
            function testLineCommentCommand(lines, selection, expectedLines, expectedSelection) {
                _testCommentCommand(lines, selection, (accessor, sel) => new blockCommentCommand_1.BlockCommentCommand(sel, false, accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService)), expectedLines, expectedSelection);
            }
            testLineCommentCommand([
                'some text'
            ], new selection_1.Selection(1, 1, 1, 5), [
                '<0some0> text'
            ], new selection_1.Selection(1, 3, 1, 7));
        });
        test('insertSpace false does not remove space', () => {
            function testLineCommentCommand(lines, selection, expectedLines, expectedSelection) {
                _testCommentCommand(lines, selection, (accessor, sel) => new blockCommentCommand_1.BlockCommentCommand(sel, false, accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService)), expectedLines, expectedSelection);
            }
            testLineCommentCommand([
                '<0 some 0> text'
            ], new selection_1.Selection(1, 4, 1, 8), [
                ' some  text'
            ], new selection_1.Selection(1, 1, 1, 7));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxvY2tDb21tZW50Q29tbWFuZC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb21tZW50L3Rlc3QvYnJvd3Nlci9ibG9ja0NvbW1lbnRDb21tYW5kLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsU0FBUyxtQkFBbUIsQ0FBQyxLQUFlLEVBQUUsU0FBb0IsRUFBRSxjQUE4RSxFQUFFLGFBQXVCLEVBQUUsaUJBQTRCO1FBQ3hNLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQztRQUNqQyxNQUFNLE9BQU8sR0FBRyxDQUFDLFFBQTBCLEVBQUUsV0FBNEIsRUFBRSxFQUFFO1lBQzVFLE1BQU0sNEJBQTRCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw2REFBNkIsQ0FBQyxDQUFDO1lBQ2pGLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztZQUN2RCxXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEUsV0FBVyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO2dCQUNqRSxRQUFRLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRTthQUM1RCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztRQUNGLElBQUEseUJBQVcsRUFBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNqSCxDQUFD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