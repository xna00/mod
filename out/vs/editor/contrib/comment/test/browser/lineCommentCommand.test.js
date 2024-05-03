/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/nullTokenize", "vs/editor/contrib/comment/browser/lineCommentCommand", "vs/editor/test/browser/testCommand", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/instantiation/common/instantiation"], function (require, exports, assert, lifecycle_1, utils_1, selection_1, languages_1, language_1, languageConfigurationRegistry_1, nullTokenize_1, lineCommentCommand_1, testCommand_1, testLanguageConfigurationService_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createTestCommandHelper(commentsConfig, commandFactory) {
        return (lines, selection, expectedLines, expectedSelection) => {
            const languageId = 'commentMode';
            const prepare = (accessor, disposables) => {
                const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
                const languageService = accessor.get(language_1.ILanguageService);
                disposables.add(languageService.registerLanguage({ id: languageId }));
                disposables.add(languageConfigurationService.register(languageId, {
                    comments: commentsConfig
                }));
            };
            (0, testCommand_1.testCommand)(lines, languageId, selection, commandFactory, expectedLines, expectedSelection, false, prepare);
        };
    }
    suite('Editor Contrib - Line Comment Command', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const testLineCommentCommand = createTestCommandHelper({ lineComment: '!@#', blockComment: ['<!@#', '#@!>'] }, (accessor, sel) => new lineCommentCommand_1.LineCommentCommand(accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService), sel, 4, 0 /* Type.Toggle */, true, true));
        const testAddLineCommentCommand = createTestCommandHelper({ lineComment: '!@#', blockComment: ['<!@#', '#@!>'] }, (accessor, sel) => new lineCommentCommand_1.LineCommentCommand(accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService), sel, 4, 1 /* Type.ForceAdd */, true, true));
        test('comment single line', function () {
            testLineCommentCommand([
                'some text',
                '\tsome more text'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '!@# some text',
                '\tsome more text'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('case insensitive', function () {
            const testLineCommentCommand = createTestCommandHelper({ lineComment: 'rem' }, (accessor, sel) => new lineCommentCommand_1.LineCommentCommand(accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService), sel, 4, 0 /* Type.Toggle */, true, true));
            testLineCommentCommand([
                'REM some text'
            ], new selection_1.Selection(1, 1, 1, 1), [
                'some text'
            ], new selection_1.Selection(1, 1, 1, 1));
        });
        function createSimpleModel(lines) {
            return {
                getLineContent: (lineNumber) => {
                    return lines[lineNumber - 1];
                }
            };
        }
        function createBasicLinePreflightData(commentTokens) {
            return commentTokens.map((commentString) => {
                const r = {
                    ignore: false,
                    commentStr: commentString,
                    commentStrOffset: 0,
                    commentStrLength: commentString.length
                };
                return r;
            });
        }
        test('_analyzeLines', () => {
            const disposable = new lifecycle_1.DisposableStore();
            let r;
            r = lineCommentCommand_1.LineCommentCommand._analyzeLines(0 /* Type.Toggle */, true, createSimpleModel([
                '\t\t',
                '    ',
                '    c',
                '\t\td'
            ]), createBasicLinePreflightData(['//', 'rem', '!@#', '!@#']), 1, true, false, disposable.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            if (!r.supported) {
                throw new Error(`unexpected`);
            }
            assert.strictEqual(r.shouldRemoveComments, false);
            // Does not change `commentStr`
            assert.strictEqual(r.lines[0].commentStr, '//');
            assert.strictEqual(r.lines[1].commentStr, 'rem');
            assert.strictEqual(r.lines[2].commentStr, '!@#');
            assert.strictEqual(r.lines[3].commentStr, '!@#');
            // Fills in `isWhitespace`
            assert.strictEqual(r.lines[0].ignore, true);
            assert.strictEqual(r.lines[1].ignore, true);
            assert.strictEqual(r.lines[2].ignore, false);
            assert.strictEqual(r.lines[3].ignore, false);
            // Fills in `commentStrOffset`
            assert.strictEqual(r.lines[0].commentStrOffset, 2);
            assert.strictEqual(r.lines[1].commentStrOffset, 4);
            assert.strictEqual(r.lines[2].commentStrOffset, 4);
            assert.strictEqual(r.lines[3].commentStrOffset, 2);
            r = lineCommentCommand_1.LineCommentCommand._analyzeLines(0 /* Type.Toggle */, true, createSimpleModel([
                '\t\t',
                '    rem ',
                '    !@# c',
                '\t\t!@#d'
            ]), createBasicLinePreflightData(['//', 'rem', '!@#', '!@#']), 1, true, false, disposable.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            if (!r.supported) {
                throw new Error(`unexpected`);
            }
            assert.strictEqual(r.shouldRemoveComments, true);
            // Does not change `commentStr`
            assert.strictEqual(r.lines[0].commentStr, '//');
            assert.strictEqual(r.lines[1].commentStr, 'rem');
            assert.strictEqual(r.lines[2].commentStr, '!@#');
            assert.strictEqual(r.lines[3].commentStr, '!@#');
            // Fills in `isWhitespace`
            assert.strictEqual(r.lines[0].ignore, true);
            assert.strictEqual(r.lines[1].ignore, false);
            assert.strictEqual(r.lines[2].ignore, false);
            assert.strictEqual(r.lines[3].ignore, false);
            // Fills in `commentStrOffset`
            assert.strictEqual(r.lines[0].commentStrOffset, 2);
            assert.strictEqual(r.lines[1].commentStrOffset, 4);
            assert.strictEqual(r.lines[2].commentStrOffset, 4);
            assert.strictEqual(r.lines[3].commentStrOffset, 2);
            // Fills in `commentStrLength`
            assert.strictEqual(r.lines[0].commentStrLength, 2);
            assert.strictEqual(r.lines[1].commentStrLength, 4);
            assert.strictEqual(r.lines[2].commentStrLength, 4);
            assert.strictEqual(r.lines[3].commentStrLength, 3);
            disposable.dispose();
        });
        test('_normalizeInsertionPoint', () => {
            const runTest = (mixedArr, tabSize, expected, testName) => {
                const model = createSimpleModel(mixedArr.filter((item, idx) => idx % 2 === 0));
                const offsets = mixedArr.filter((item, idx) => idx % 2 === 1).map(offset => {
                    return {
                        commentStrOffset: offset,
                        ignore: false
                    };
                });
                lineCommentCommand_1.LineCommentCommand._normalizeInsertionPoint(model, offsets, 1, tabSize);
                const actual = offsets.map(item => item.commentStrOffset);
                assert.deepStrictEqual(actual, expected, testName);
            };
            // Bug 16696:[comment] comments not aligned in this case
            runTest([
                '  XX', 2,
                '    YY', 4
            ], 4, [0, 0], 'Bug 16696');
            runTest([
                '\t\t\tXX', 3,
                '    \tYY', 5,
                '        ZZ', 8,
                '\t\tTT', 2
            ], 4, [2, 5, 8, 2], 'Test1');
            runTest([
                '\t\t\t   XX', 6,
                '    \t\t\t\tYY', 8,
                '        ZZ', 8,
                '\t\t    TT', 6
            ], 4, [2, 5, 8, 2], 'Test2');
            runTest([
                '\t\t', 2,
                '\t\t\t', 3,
                '\t\t\t\t', 4,
                '\t\t\t', 3
            ], 4, [2, 2, 2, 2], 'Test3');
            runTest([
                '\t\t', 2,
                '\t\t\t', 3,
                '\t\t\t\t', 4,
                '\t\t\t', 3,
                '    ', 4
            ], 2, [2, 2, 2, 2, 4], 'Test4');
            runTest([
                '\t\t', 2,
                '\t\t\t', 3,
                '\t\t\t\t', 4,
                '\t\t\t', 3,
                '    ', 4
            ], 4, [1, 1, 1, 1, 4], 'Test5');
            runTest([
                ' \t', 2,
                '  \t', 3,
                '   \t', 4,
                '    ', 4,
                '\t', 1
            ], 4, [2, 3, 4, 4, 1], 'Test6');
            runTest([
                ' \t\t', 3,
                '  \t\t', 4,
                '   \t\t', 5,
                '    \t', 5,
                '\t', 1
            ], 4, [2, 3, 4, 4, 1], 'Test7');
            runTest([
                '\t', 1,
                '    ', 4
            ], 4, [1, 4], 'Test8:4');
            runTest([
                '\t', 1,
                '   ', 3
            ], 4, [0, 0], 'Test8:3');
            runTest([
                '\t', 1,
                '  ', 2
            ], 4, [0, 0], 'Test8:2');
            runTest([
                '\t', 1,
                ' ', 1
            ], 4, [0, 0], 'Test8:1');
            runTest([
                '\t', 1,
                '', 0
            ], 4, [0, 0], 'Test8:0');
        });
        test('detects indentation', function () {
            testLineCommentCommand([
                '\tsome text',
                '\tsome more text'
            ], new selection_1.Selection(2, 2, 1, 1), [
                '\t!@# some text',
                '\t!@# some more text'
            ], new selection_1.Selection(2, 2, 1, 1));
        });
        test('detects mixed indentation', function () {
            testLineCommentCommand([
                '\tsome text',
                '    some more text'
            ], new selection_1.Selection(2, 2, 1, 1), [
                '\t!@# some text',
                '    !@# some more text'
            ], new selection_1.Selection(2, 2, 1, 1));
        });
        test('ignores whitespace lines', function () {
            testLineCommentCommand([
                '\tsome text',
                '\t   ',
                '',
                '\tsome more text'
            ], new selection_1.Selection(4, 2, 1, 1), [
                '\t!@# some text',
                '\t   ',
                '',
                '\t!@# some more text'
            ], new selection_1.Selection(4, 2, 1, 1));
        });
        test('removes its own', function () {
            testLineCommentCommand([
                '\t!@# some text',
                '\t   ',
                '\t\t!@# some more text'
            ], new selection_1.Selection(3, 2, 1, 1), [
                '\tsome text',
                '\t   ',
                '\t\tsome more text'
            ], new selection_1.Selection(3, 2, 1, 1));
        });
        test('works in only whitespace', function () {
            testLineCommentCommand([
                '\t    ',
                '\t',
                '\t\tsome more text'
            ], new selection_1.Selection(3, 1, 1, 1), [
                '\t!@#     ',
                '\t!@# ',
                '\t\tsome more text'
            ], new selection_1.Selection(3, 1, 1, 1));
        });
        test('bug 9697 - whitespace before comment token', function () {
            testLineCommentCommand([
                '\t !@#first',
                '\tsecond line'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '\t first',
                '\tsecond line'
            ], new selection_1.Selection(1, 1, 1, 1));
        });
        test('bug 10162 - line comment before caret', function () {
            testLineCommentCommand([
                'first!@#',
                '\tsecond line'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '!@# first!@#',
                '\tsecond line'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('comment single line - leading whitespace', function () {
            testLineCommentCommand([
                'first!@#',
                '\tsecond line'
            ], new selection_1.Selection(2, 3, 2, 1), [
                'first!@#',
                '\t!@# second line'
            ], new selection_1.Selection(2, 7, 2, 1));
        });
        test('ignores invisible selection', function () {
            testLineCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 1, 1), [
                '!@# first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 1, 5));
        });
        test('multiple lines', function () {
            testLineCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 4, 1, 1), [
                '!@# first',
                '!@# \tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 8, 1, 5));
        });
        test('multiple modes on multiple lines', function () {
            testLineCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 4, 3, 1), [
                'first',
                '\tsecond line',
                '!@# third line',
                '!@# fourth line',
                'fifth'
            ], new selection_1.Selection(4, 8, 3, 5));
        });
        test('toggle single line', function () {
            testLineCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '!@# first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
            testLineCommentCommand([
                '!@# first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 4, 1, 4), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 1));
        });
        test('toggle multiple lines', function () {
            testLineCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 4, 1, 1), [
                '!@# first',
                '!@# \tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 8, 1, 5));
            testLineCommentCommand([
                '!@# first',
                '!@# \tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 7, 1, 4), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 3, 1, 1));
        });
        test('issue #5964: Ctrl+/ to create comment when cursor is at the beginning of the line puts the cursor in a strange position', () => {
            testLineCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '!@# first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('issue #35673: Comment hotkeys throws the cursor before the comment', () => {
            testLineCommentCommand([
                'first',
                '',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 2, 1), [
                'first',
                '!@# ',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 5, 2, 5));
            testLineCommentCommand([
                'first',
                '\t',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 2, 2, 2), [
                'first',
                '\t!@# ',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 6, 2, 6));
        });
        test('issue #2837 "Add Line Comment" fault when blank lines involved', function () {
            testAddLineCommentCommand([
                '    if displayName == "":',
                '        displayName = groupName',
                '    description = getAttr(attributes, "description")',
                '    mailAddress = getAttr(attributes, "mail")',
                '',
                '    print "||Group name|%s|" % displayName',
                '    print "||Description|%s|" % description',
                '    print "||Email address|[mailto:%s]|" % mailAddress`',
            ], new selection_1.Selection(1, 1, 8, 56), [
                '    !@# if displayName == "":',
                '    !@#     displayName = groupName',
                '    !@# description = getAttr(attributes, "description")',
                '    !@# mailAddress = getAttr(attributes, "mail")',
                '',
                '    !@# print "||Group name|%s|" % displayName',
                '    !@# print "||Description|%s|" % description',
                '    !@# print "||Email address|[mailto:%s]|" % mailAddress`',
            ], new selection_1.Selection(1, 1, 8, 60));
        });
        test('issue #47004: Toggle comments shouldn\'t move cursor', () => {
            testAddLineCommentCommand([
                '    A line',
                '    Another line'
            ], new selection_1.Selection(2, 7, 1, 1), [
                '    !@# A line',
                '    !@# Another line'
            ], new selection_1.Selection(2, 11, 1, 1));
        });
        test('insertSpace false', () => {
            const testLineCommentCommand = createTestCommandHelper({ lineComment: '!@#' }, (accessor, sel) => new lineCommentCommand_1.LineCommentCommand(accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService), sel, 4, 0 /* Type.Toggle */, false, true));
            testLineCommentCommand([
                'some text'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '!@#some text'
            ], new selection_1.Selection(1, 4, 1, 4));
        });
        test('insertSpace false does not remove space', () => {
            const testLineCommentCommand = createTestCommandHelper({ lineComment: '!@#' }, (accessor, sel) => new lineCommentCommand_1.LineCommentCommand(accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService), sel, 4, 0 /* Type.Toggle */, false, true));
            testLineCommentCommand([
                '!@#    some text'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '    some text'
            ], new selection_1.Selection(1, 1, 1, 1));
        });
    });
    suite('ignoreEmptyLines false', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const testLineCommentCommand = createTestCommandHelper({ lineComment: '!@#', blockComment: ['<!@#', '#@!>'] }, (accessor, sel) => new lineCommentCommand_1.LineCommentCommand(accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService), sel, 4, 0 /* Type.Toggle */, true, false));
        test('does not ignore whitespace lines', () => {
            testLineCommentCommand([
                '\tsome text',
                '\t   ',
                '',
                '\tsome more text'
            ], new selection_1.Selection(4, 2, 1, 1), [
                '!@# \tsome text',
                '!@# \t   ',
                '!@# ',
                '!@# \tsome more text'
            ], new selection_1.Selection(4, 6, 1, 5));
        });
        test('removes its own', function () {
            testLineCommentCommand([
                '\t!@# some text',
                '\t   ',
                '\t\t!@# some more text'
            ], new selection_1.Selection(3, 2, 1, 1), [
                '\tsome text',
                '\t   ',
                '\t\tsome more text'
            ], new selection_1.Selection(3, 2, 1, 1));
        });
        test('works in only whitespace', function () {
            testLineCommentCommand([
                '\t    ',
                '\t',
                '\t\tsome more text'
            ], new selection_1.Selection(3, 1, 1, 1), [
                '\t!@#     ',
                '\t!@# ',
                '\t\tsome more text'
            ], new selection_1.Selection(3, 1, 1, 1));
        });
        test('comments single line', function () {
            testLineCommentCommand([
                'some text',
                '\tsome more text'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '!@# some text',
                '\tsome more text'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('detects indentation', function () {
            testLineCommentCommand([
                '\tsome text',
                '\tsome more text'
            ], new selection_1.Selection(2, 2, 1, 1), [
                '\t!@# some text',
                '\t!@# some more text'
            ], new selection_1.Selection(2, 2, 1, 1));
        });
    });
    suite('Editor Contrib - Line Comment As Block Comment', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const testLineCommentCommand = createTestCommandHelper({ lineComment: '', blockComment: ['(', ')'] }, (accessor, sel) => new lineCommentCommand_1.LineCommentCommand(accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService), sel, 4, 0 /* Type.Toggle */, true, true));
        test('fall back to block comment command', function () {
            testLineCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '( first )',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 3));
        });
        test('fall back to block comment command - toggle', function () {
            testLineCommentCommand([
                '(first)',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 7, 1, 2), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 6, 1, 1));
        });
        test('bug 9513 - expand single line to uncomment auto block', function () {
            testLineCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '( first )',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 3));
        });
        test('bug 9691 - always expand selection to line boundaries', function () {
            testLineCommentCommand([
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 2, 1, 3), [
                '( first',
                '\tsecond line',
                'third line )',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 2, 1, 5));
            testLineCommentCommand([
                '(first',
                '\tsecond line',
                'third line)',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 11, 1, 2), [
                'first',
                '\tsecond line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 11, 1, 1));
        });
    });
    suite('Editor Contrib - Line Comment As Block Comment 2', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const testLineCommentCommand = createTestCommandHelper({ lineComment: null, blockComment: ['<!@#', '#@!>'] }, (accessor, sel) => new lineCommentCommand_1.LineCommentCommand(accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService), sel, 4, 0 /* Type.Toggle */, true, true));
        test('no selection => uses indentation', function () {
            testLineCommentCommand([
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\t<!@#fifth#@!>\t\t'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '\t\t<!@# first\t     #@!>',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\t<!@#fifth#@!>\t\t'
            ], new selection_1.Selection(1, 1, 1, 1));
            testLineCommentCommand([
                '\t\t<!@#first\t    #@!>',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\t<!@#fifth#@!>\t\t'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '\t\tfirst\t   ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\t<!@#fifth#@!>\t\t'
            ], new selection_1.Selection(1, 1, 1, 1));
        });
        test('can remove', function () {
            testLineCommentCommand([
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\t<!@#fifth#@!>\t\t'
            ], new selection_1.Selection(5, 1, 5, 1), [
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\tfifth\t\t'
            ], new selection_1.Selection(5, 1, 5, 1));
            testLineCommentCommand([
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\t<!@#fifth#@!>\t\t'
            ], new selection_1.Selection(5, 3, 5, 3), [
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\tfifth\t\t'
            ], new selection_1.Selection(5, 3, 5, 3));
            testLineCommentCommand([
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\t<!@#fifth#@!>\t\t'
            ], new selection_1.Selection(5, 4, 5, 4), [
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\tfifth\t\t'
            ], new selection_1.Selection(5, 3, 5, 3));
            testLineCommentCommand([
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\t<!@#fifth#@!>\t\t'
            ], new selection_1.Selection(5, 16, 5, 3), [
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\tfifth\t\t'
            ], new selection_1.Selection(5, 8, 5, 3));
            testLineCommentCommand([
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\t<!@#fifth#@!>\t\t'
            ], new selection_1.Selection(5, 12, 5, 7), [
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\tfifth\t\t'
            ], new selection_1.Selection(5, 8, 5, 3));
            testLineCommentCommand([
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\t<!@#fifth#@!>\t\t'
            ], new selection_1.Selection(5, 18, 5, 18), [
                '\t\tfirst\t    ',
                '\t\tsecond line',
                '\tthird line',
                'fourth line',
                '\t\tfifth\t\t'
            ], new selection_1.Selection(5, 10, 5, 10));
        });
        test('issue #993: Remove comment does not work consistently in HTML', () => {
            testLineCommentCommand([
                '     asd qwe',
                '     asd qwe',
                ''
            ], new selection_1.Selection(1, 1, 3, 1), [
                '     <!@# asd qwe',
                '     asd qwe #@!>',
                ''
            ], new selection_1.Selection(1, 1, 3, 1));
            testLineCommentCommand([
                '     <!@#asd qwe',
                '     asd qwe#@!>',
                ''
            ], new selection_1.Selection(1, 1, 3, 1), [
                '     asd qwe',
                '     asd qwe',
                ''
            ], new selection_1.Selection(1, 1, 3, 1));
        });
    });
    suite('Editor Contrib - Line Comment in mixed modes', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const OUTER_LANGUAGE_ID = 'outerMode';
        const INNER_LANGUAGE_ID = 'innerMode';
        let OuterMode = class OuterMode extends lifecycle_1.Disposable {
            constructor(commentsConfig, languageService, languageConfigurationService) {
                super();
                this.languageId = OUTER_LANGUAGE_ID;
                this._register(languageService.registerLanguage({ id: this.languageId }));
                this._register(languageConfigurationService.register(this.languageId, {
                    comments: commentsConfig
                }));
                this._register(languages_1.TokenizationRegistry.register(this.languageId, {
                    getInitialState: () => nullTokenize_1.NullState,
                    tokenize: () => {
                        throw new Error('not implemented');
                    },
                    tokenizeEncoded: (line, hasEOL, state) => {
                        const languageId = (/^  /.test(line) ? INNER_LANGUAGE_ID : OUTER_LANGUAGE_ID);
                        const encodedLanguageId = languageService.languageIdCodec.encodeLanguageId(languageId);
                        const tokens = new Uint32Array(1 << 1);
                        tokens[(0 << 1)] = 0;
                        tokens[(0 << 1) + 1] = ((1 /* ColorId.DefaultForeground */ << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
                            | (encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */));
                        return new languages_1.EncodedTokenizationResult(tokens, state);
                    }
                }));
            }
        };
        OuterMode = __decorate([
            __param(1, language_1.ILanguageService),
            __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService)
        ], OuterMode);
        let InnerMode = class InnerMode extends lifecycle_1.Disposable {
            constructor(commentsConfig, languageService, languageConfigurationService) {
                super();
                this.languageId = INNER_LANGUAGE_ID;
                this._register(languageService.registerLanguage({ id: this.languageId }));
                this._register(languageConfigurationService.register(this.languageId, {
                    comments: commentsConfig
                }));
            }
        };
        InnerMode = __decorate([
            __param(1, language_1.ILanguageService),
            __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService)
        ], InnerMode);
        function testLineCommentCommand(lines, selection, expectedLines, expectedSelection) {
            const setup = (accessor, disposables) => {
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                disposables.add(instantiationService.createInstance(OuterMode, { lineComment: '//', blockComment: ['/*', '*/'] }));
                disposables.add(instantiationService.createInstance(InnerMode, { lineComment: null, blockComment: ['{/*', '*/}'] }));
            };
            (0, testCommand_1.testCommand)(lines, OUTER_LANGUAGE_ID, selection, (accessor, sel) => new lineCommentCommand_1.LineCommentCommand(accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService), sel, 4, 0 /* Type.Toggle */, true, true), expectedLines, expectedSelection, true, setup);
        }
        test('issue #24047 (part 1): Commenting code in JSX files', () => {
            testLineCommentCommand([
                'import React from \'react\';',
                'const Loader = () => (',
                '  <div>',
                '    Loading...',
                '  </div>',
                ');',
                'export default Loader;'
            ], new selection_1.Selection(1, 1, 7, 22), [
                '// import React from \'react\';',
                '// const Loader = () => (',
                '//   <div>',
                '//     Loading...',
                '//   </div>',
                '// );',
                '// export default Loader;'
            ], new selection_1.Selection(1, 4, 7, 25));
        });
        test('issue #24047 (part 2): Commenting code in JSX files', () => {
            testLineCommentCommand([
                'import React from \'react\';',
                'const Loader = () => (',
                '  <div>',
                '    Loading...',
                '  </div>',
                ');',
                'export default Loader;'
            ], new selection_1.Selection(3, 4, 3, 4), [
                'import React from \'react\';',
                'const Loader = () => (',
                '  {/* <div> */}',
                '    Loading...',
                '  </div>',
                ');',
                'export default Loader;'
            ], new selection_1.Selection(3, 8, 3, 8));
        });
        test('issue #36173: Commenting code in JSX tag body', () => {
            testLineCommentCommand([
                '<div>',
                '  {123}',
                '</div>',
            ], new selection_1.Selection(2, 4, 2, 4), [
                '<div>',
                '  {/* {123} */}',
                '</div>',
            ], new selection_1.Selection(2, 8, 2, 8));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZUNvbW1lbnRDb21tYW5kLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvbW1lbnQvdGVzdC9icm93c2VyL2xpbmVDb21tZW50Q29tbWFuZC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBa0JoRyxTQUFTLHVCQUF1QixDQUFDLGNBQTJCLEVBQUUsY0FBOEU7UUFDM0ksT0FBTyxDQUFDLEtBQWUsRUFBRSxTQUFvQixFQUFFLGFBQXVCLEVBQUUsaUJBQTRCLEVBQUUsRUFBRTtZQUN2RyxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUM7WUFDakMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxRQUEwQixFQUFFLFdBQTRCLEVBQUUsRUFBRTtnQkFDNUUsTUFBTSw0QkFBNEIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDZEQUE2QixDQUFDLENBQUM7Z0JBQ2pGLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztnQkFDdkQsV0FBVyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN0RSxXQUFXLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUU7b0JBQ2pFLFFBQVEsRUFBRSxjQUFjO2lCQUN4QixDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQztZQUNGLElBQUEseUJBQVcsRUFBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3RyxDQUFDLENBQUM7SUFDSCxDQUFD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LEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFaEMsT0FBTyxDQUFDO2dCQUNQLE9BQU8sRUFBRSxDQUFDO2dCQUNWLFFBQVEsRUFBRSxDQUFDO2dCQUNYLFNBQVMsRUFBRSxDQUFDO2dCQUNaLFFBQVEsRUFBRSxDQUFDO2dCQUNYLElBQUksRUFBRSxDQUFDO2FBQ1AsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFaEMsT0FBTyxDQUFDO2dCQUNQLElBQUksRUFBRSxDQUFDO2dCQUNQLE1BQU0sRUFBRSxDQUFDO2FBQ1QsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekIsT0FBTyxDQUFDO2dCQUNQLElBQUksRUFBRSxDQUFDO2dCQUNQLEtBQUssRUFBRSxDQUFDO2FBQ1IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekIsT0FBTyxDQUFDO2dCQUNQLElBQUksRUFBRSxDQUFDO2dCQUNQLElBQUksRUFBRSxDQUFDO2FBQ1AsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekIsT0FBTyxDQUFDO2dCQUNQLElBQUksRUFBRSxDQUFDO2dCQUNQLEdBQUcsRUFBRSxDQUFDO2FBQ04sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekIsT0FBTyxDQUFDO2dCQUNQLElBQUksRUFBRSxDQUFDO2dCQUNQLEVBQUUsRUFBRSxDQUFDO2FBQ0wsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFD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