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
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/commands/shiftCommand", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/test/browser/testCommand", "vs/editor/test/common/modes/supports/onEnterRules", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, utils_1, shiftCommand_1, range_1, selection_1, language_1, languageConfigurationRegistry_1, testCommand_1, onEnterRules_1, testLanguageConfigurationService_1, testTextModel_1) {
    "use strict";
    var DocBlockCommentMode_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Create single edit operation
     */
    function createSingleEditOp(text, positionLineNumber, positionColumn, selectionLineNumber = positionLineNumber, selectionColumn = positionColumn) {
        return {
            range: new range_1.Range(selectionLineNumber, selectionColumn, positionLineNumber, positionColumn),
            text: text,
            forceMoveMarkers: false
        };
    }
    let DocBlockCommentMode = class DocBlockCommentMode extends lifecycle_1.Disposable {
        static { DocBlockCommentMode_1 = this; }
        static { this.languageId = 'commentMode'; }
        constructor(languageService, languageConfigurationService) {
            super();
            this.languageId = DocBlockCommentMode_1.languageId;
            this._register(languageService.registerLanguage({ id: this.languageId }));
            this._register(languageConfigurationService.register(this.languageId, {
                brackets: [
                    ['(', ')'],
                    ['{', '}'],
                    ['[', ']']
                ],
                onEnterRules: onEnterRules_1.javascriptOnEnterRules
            }));
        }
    };
    DocBlockCommentMode = DocBlockCommentMode_1 = __decorate([
        __param(0, language_1.ILanguageService),
        __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], DocBlockCommentMode);
    function testShiftCommand(lines, languageId, useTabStops, selection, expectedLines, expectedSelection, prepare) {
        (0, testCommand_1.testCommand)(lines, languageId, selection, (accessor, sel) => new shiftCommand_1.ShiftCommand(sel, {
            isUnshift: false,
            tabSize: 4,
            indentSize: 4,
            insertSpaces: false,
            useTabStops: useTabStops,
            autoIndent: 4 /* EditorAutoIndentStrategy.Full */,
        }, accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService)), expectedLines, expectedSelection, undefined, prepare);
    }
    function testUnshiftCommand(lines, languageId, useTabStops, selection, expectedLines, expectedSelection, prepare) {
        (0, testCommand_1.testCommand)(lines, languageId, selection, (accessor, sel) => new shiftCommand_1.ShiftCommand(sel, {
            isUnshift: true,
            tabSize: 4,
            indentSize: 4,
            insertSpaces: false,
            useTabStops: useTabStops,
            autoIndent: 4 /* EditorAutoIndentStrategy.Full */,
        }, accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService)), expectedLines, expectedSelection, undefined, prepare);
    }
    function prepareDocBlockCommentLanguage(accessor, disposables) {
        const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
        const languageService = accessor.get(language_1.ILanguageService);
        disposables.add(new DocBlockCommentMode(languageService, languageConfigurationService));
    }
    suite('Editor Commands - ShiftCommand', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        // --------- shift
        test('Bug 9503: Shifting without any selection', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 1, 1), [
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 2, 1, 2));
        });
        test('shift on single line selection 1', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 3, 1, 1), [
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 4, 1, 1));
        });
        test('shift on single line selection 2', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 1, 3), [
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 1, 4));
        });
        test('simple shift', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 2, 1), [
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 2, 1));
        });
        test('shifting on two separate lines', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 2, 1), [
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 2, 1));
            testShiftCommand([
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 1, 3, 1), [
                '\tMy First Line',
                '\t\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 1, 3, 1));
        });
        test('shifting on two lines', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 2, 2, 2), [
                '\tMy First Line',
                '\t\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 3, 2, 2));
        });
        test('shifting on two lines again', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 2, 1, 2), [
                '\tMy First Line',
                '\t\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 2, 1, 3));
        });
        test('shifting at end of file', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(4, 1, 5, 2), [
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '\t123'
            ], new selection_1.Selection(4, 1, 5, 3));
        });
        test('issue #1120 TAB should not indent empty lines in a multi-line selection', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 5, 2), [
                '\tMy First Line',
                '\t\t\tMy Second Line',
                '\t\tThird Line',
                '',
                '\t123'
            ], new selection_1.Selection(1, 1, 5, 3));
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(4, 1, 5, 1), [
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '\t',
                '123'
            ], new selection_1.Selection(4, 1, 5, 1));
        });
        // --------- unshift
        test('unshift on single line selection 1', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 3, 2, 1), [
                'My First Line',
                '\t\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 3, 2, 1));
        });
        test('unshift on single line selection 2', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 1, 2, 3), [
                'My First Line',
                '\t\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 1, 2, 3));
        });
        test('simple unshift', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 2, 1), [
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 2, 1));
        });
        test('unshifting on two lines 1', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 2, 2, 2), [
                'My First Line',
                '\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 2, 2, 2));
        });
        test('unshifting on two lines 2', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 3, 2, 1), [
                'My First Line',
                '\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 2, 2, 1));
        });
        test('unshifting at the end of the file', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(4, 1, 5, 2), [
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(4, 1, 5, 2));
        });
        test('unshift many times + shift', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 5, 4), [
                'My First Line',
                '\tMy Second Line',
                'Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 5, 4));
            testUnshiftCommand([
                'My First Line',
                '\tMy Second Line',
                'Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 5, 4), [
                'My First Line',
                'My Second Line',
                'Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 5, 4));
            testShiftCommand([
                'My First Line',
                'My Second Line',
                'Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 5, 4), [
                '\tMy First Line',
                '\tMy Second Line',
                '\tThird Line',
                '',
                '\t123'
            ], new selection_1.Selection(1, 1, 5, 5));
        });
        test('Bug 9119: Unshift from first column doesn\'t work', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 1, 2, 1), [
                'My First Line',
                '\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 1, 2, 1));
        });
        test('issue #348: indenting around doc block comments', () => {
            testShiftCommand([
                '',
                '/**',
                ' * a doc comment',
                ' */',
                'function hello() {}'
            ], DocBlockCommentMode.languageId, true, new selection_1.Selection(1, 1, 5, 20), [
                '',
                '\t/**',
                '\t * a doc comment',
                '\t */',
                '\tfunction hello() {}'
            ], new selection_1.Selection(1, 1, 5, 21), prepareDocBlockCommentLanguage);
            testUnshiftCommand([
                '',
                '/**',
                ' * a doc comment',
                ' */',
                'function hello() {}'
            ], DocBlockCommentMode.languageId, true, new selection_1.Selection(1, 1, 5, 20), [
                '',
                '/**',
                ' * a doc comment',
                ' */',
                'function hello() {}'
            ], new selection_1.Selection(1, 1, 5, 20), prepareDocBlockCommentLanguage);
            testUnshiftCommand([
                '\t',
                '\t/**',
                '\t * a doc comment',
                '\t */',
                '\tfunction hello() {}'
            ], DocBlockCommentMode.languageId, true, new selection_1.Selection(1, 1, 5, 21), [
                '',
                '/**',
                ' * a doc comment',
                ' */',
                'function hello() {}'
            ], new selection_1.Selection(1, 1, 5, 20), prepareDocBlockCommentLanguage);
        });
        test('issue #1609: Wrong indentation of block comments', () => {
            testShiftCommand([
                '',
                '/**',
                ' * test',
                ' *',
                ' * @type {number}',
                ' */',
                'var foo = 0;'
            ], DocBlockCommentMode.languageId, true, new selection_1.Selection(1, 1, 7, 13), [
                '',
                '\t/**',
                '\t * test',
                '\t *',
                '\t * @type {number}',
                '\t */',
                '\tvar foo = 0;'
            ], new selection_1.Selection(1, 1, 7, 14), prepareDocBlockCommentLanguage);
        });
        test('issue #1620: a) Line indent doesn\'t handle leading whitespace properly', () => {
            (0, testCommand_1.testCommand)([
                '   Written | Numeric',
                '       one | 1',
                '       two | 2',
                '     three | 3',
                '      four | 4',
                '      five | 5',
                '       six | 6',
                '     seven | 7',
                '     eight | 8',
                '      nine | 9',
                '       ten | 10',
                '    eleven | 11',
                '',
            ], null, new selection_1.Selection(1, 1, 13, 1), (accessor, sel) => new shiftCommand_1.ShiftCommand(sel, {
                isUnshift: false,
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                useTabStops: false,
                autoIndent: 4 /* EditorAutoIndentStrategy.Full */,
            }, accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService)), [
                '       Written | Numeric',
                '           one | 1',
                '           two | 2',
                '         three | 3',
                '          four | 4',
                '          five | 5',
                '           six | 6',
                '         seven | 7',
                '         eight | 8',
                '          nine | 9',
                '           ten | 10',
                '        eleven | 11',
                '',
            ], new selection_1.Selection(1, 1, 13, 1));
        });
        test('issue #1620: b) Line indent doesn\'t handle leading whitespace properly', () => {
            (0, testCommand_1.testCommand)([
                '       Written | Numeric',
                '           one | 1',
                '           two | 2',
                '         three | 3',
                '          four | 4',
                '          five | 5',
                '           six | 6',
                '         seven | 7',
                '         eight | 8',
                '          nine | 9',
                '           ten | 10',
                '        eleven | 11',
                '',
            ], null, new selection_1.Selection(1, 1, 13, 1), (accessor, sel) => new shiftCommand_1.ShiftCommand(sel, {
                isUnshift: true,
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                useTabStops: false,
                autoIndent: 4 /* EditorAutoIndentStrategy.Full */,
            }, accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService)), [
                '   Written | Numeric',
                '       one | 1',
                '       two | 2',
                '     three | 3',
                '      four | 4',
                '      five | 5',
                '       six | 6',
                '     seven | 7',
                '     eight | 8',
                '      nine | 9',
                '       ten | 10',
                '    eleven | 11',
                '',
            ], new selection_1.Selection(1, 1, 13, 1));
        });
        test('issue #1620: c) Line indent doesn\'t handle leading whitespace properly', () => {
            (0, testCommand_1.testCommand)([
                '       Written | Numeric',
                '           one | 1',
                '           two | 2',
                '         three | 3',
                '          four | 4',
                '          five | 5',
                '           six | 6',
                '         seven | 7',
                '         eight | 8',
                '          nine | 9',
                '           ten | 10',
                '        eleven | 11',
                '',
            ], null, new selection_1.Selection(1, 1, 13, 1), (accessor, sel) => new shiftCommand_1.ShiftCommand(sel, {
                isUnshift: true,
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                useTabStops: false,
                autoIndent: 4 /* EditorAutoIndentStrategy.Full */,
            }, accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService)), [
                '   Written | Numeric',
                '       one | 1',
                '       two | 2',
                '     three | 3',
                '      four | 4',
                '      five | 5',
                '       six | 6',
                '     seven | 7',
                '     eight | 8',
                '      nine | 9',
                '       ten | 10',
                '    eleven | 11',
                '',
            ], new selection_1.Selection(1, 1, 13, 1));
        });
        test('issue #1620: d) Line indent doesn\'t handle leading whitespace properly', () => {
            (0, testCommand_1.testCommand)([
                '\t   Written | Numeric',
                '\t       one | 1',
                '\t       two | 2',
                '\t     three | 3',
                '\t      four | 4',
                '\t      five | 5',
                '\t       six | 6',
                '\t     seven | 7',
                '\t     eight | 8',
                '\t      nine | 9',
                '\t       ten | 10',
                '\t    eleven | 11',
                '',
            ], null, new selection_1.Selection(1, 1, 13, 1), (accessor, sel) => new shiftCommand_1.ShiftCommand(sel, {
                isUnshift: true,
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                useTabStops: false,
                autoIndent: 4 /* EditorAutoIndentStrategy.Full */,
            }, accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService)), [
                '   Written | Numeric',
                '       one | 1',
                '       two | 2',
                '     three | 3',
                '      four | 4',
                '      five | 5',
                '       six | 6',
                '     seven | 7',
                '     eight | 8',
                '      nine | 9',
                '       ten | 10',
                '    eleven | 11',
                '',
            ], new selection_1.Selection(1, 1, 13, 1));
        });
        test('issue microsoft/monaco-editor#443: Indentation of a single row deletes selected text in some cases', () => {
            (0, testCommand_1.testCommand)([
                'Hello world!',
                'another line'
            ], null, new selection_1.Selection(1, 1, 1, 13), (accessor, sel) => new shiftCommand_1.ShiftCommand(sel, {
                isUnshift: false,
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                useTabStops: true,
                autoIndent: 4 /* EditorAutoIndentStrategy.Full */,
            }, accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService)), [
                '\tHello world!',
                'another line'
            ], new selection_1.Selection(1, 1, 1, 14));
        });
        test('bug #16815:Shift+Tab doesn\'t go back to tabstop', () => {
            const repeatStr = (str, cnt) => {
                let r = '';
                for (let i = 0; i < cnt; i++) {
                    r += str;
                }
                return r;
            };
            const testOutdent = (tabSize, indentSize, insertSpaces, lineText, expectedIndents) => {
                const oneIndent = insertSpaces ? repeatStr(' ', indentSize) : '\t';
                const expectedIndent = repeatStr(oneIndent, expectedIndents);
                if (lineText.length > 0) {
                    _assertUnshiftCommand(tabSize, indentSize, insertSpaces, [lineText + 'aaa'], [createSingleEditOp(expectedIndent, 1, 1, 1, lineText.length + 1)]);
                }
                else {
                    _assertUnshiftCommand(tabSize, indentSize, insertSpaces, [lineText + 'aaa'], []);
                }
            };
            const testIndent = (tabSize, indentSize, insertSpaces, lineText, expectedIndents) => {
                const oneIndent = insertSpaces ? repeatStr(' ', indentSize) : '\t';
                const expectedIndent = repeatStr(oneIndent, expectedIndents);
                _assertShiftCommand(tabSize, indentSize, insertSpaces, [lineText + 'aaa'], [createSingleEditOp(expectedIndent, 1, 1, 1, lineText.length + 1)]);
            };
            const testIndentation = (tabSize, indentSize, lineText, expectedOnOutdent, expectedOnIndent) => {
                testOutdent(tabSize, indentSize, true, lineText, expectedOnOutdent);
                testOutdent(tabSize, indentSize, false, lineText, expectedOnOutdent);
                testIndent(tabSize, indentSize, true, lineText, expectedOnIndent);
                testIndent(tabSize, indentSize, false, lineText, expectedOnIndent);
            };
            // insertSpaces: true
            // 0 => 0
            testIndentation(4, 4, '', 0, 1);
            // 1 => 0
            testIndentation(4, 4, '\t', 0, 2);
            testIndentation(4, 4, ' ', 0, 1);
            testIndentation(4, 4, ' \t', 0, 2);
            testIndentation(4, 4, '  ', 0, 1);
            testIndentation(4, 4, '  \t', 0, 2);
            testIndentation(4, 4, '   ', 0, 1);
            testIndentation(4, 4, '   \t', 0, 2);
            testIndentation(4, 4, '    ', 0, 2);
            // 2 => 1
            testIndentation(4, 4, '\t\t', 1, 3);
            testIndentation(4, 4, '\t ', 1, 2);
            testIndentation(4, 4, '\t \t', 1, 3);
            testIndentation(4, 4, '\t  ', 1, 2);
            testIndentation(4, 4, '\t  \t', 1, 3);
            testIndentation(4, 4, '\t   ', 1, 2);
            testIndentation(4, 4, '\t   \t', 1, 3);
            testIndentation(4, 4, '\t    ', 1, 3);
            testIndentation(4, 4, ' \t\t', 1, 3);
            testIndentation(4, 4, ' \t ', 1, 2);
            testIndentation(4, 4, ' \t \t', 1, 3);
            testIndentation(4, 4, ' \t  ', 1, 2);
            testIndentation(4, 4, ' \t  \t', 1, 3);
            testIndentation(4, 4, ' \t   ', 1, 2);
            testIndentation(4, 4, ' \t   \t', 1, 3);
            testIndentation(4, 4, ' \t    ', 1, 3);
            testIndentation(4, 4, '  \t\t', 1, 3);
            testIndentation(4, 4, '  \t ', 1, 2);
            testIndentation(4, 4, '  \t \t', 1, 3);
            testIndentation(4, 4, '  \t  ', 1, 2);
            testIndentation(4, 4, '  \t  \t', 1, 3);
            testIndentation(4, 4, '  \t   ', 1, 2);
            testIndentation(4, 4, '  \t   \t', 1, 3);
            testIndentation(4, 4, '  \t    ', 1, 3);
            testIndentation(4, 4, '   \t\t', 1, 3);
            testIndentation(4, 4, '   \t ', 1, 2);
            testIndentation(4, 4, '   \t \t', 1, 3);
            testIndentation(4, 4, '   \t  ', 1, 2);
            testIndentation(4, 4, '   \t  \t', 1, 3);
            testIndentation(4, 4, '   \t   ', 1, 2);
            testIndentation(4, 4, '   \t   \t', 1, 3);
            testIndentation(4, 4, '   \t    ', 1, 3);
            testIndentation(4, 4, '    \t', 1, 3);
            testIndentation(4, 4, '     ', 1, 2);
            testIndentation(4, 4, '     \t', 1, 3);
            testIndentation(4, 4, '      ', 1, 2);
            testIndentation(4, 4, '      \t', 1, 3);
            testIndentation(4, 4, '       ', 1, 2);
            testIndentation(4, 4, '       \t', 1, 3);
            testIndentation(4, 4, '        ', 1, 3);
            // 3 => 2
            testIndentation(4, 4, '         ', 2, 3);
            function _assertUnshiftCommand(tabSize, indentSize, insertSpaces, text, expected) {
                return (0, testTextModel_1.withEditorModel)(text, (model) => {
                    const testLanguageConfigurationService = new testLanguageConfigurationService_1.TestLanguageConfigurationService();
                    const op = new shiftCommand_1.ShiftCommand(new selection_1.Selection(1, 1, text.length + 1, 1), {
                        isUnshift: true,
                        tabSize: tabSize,
                        indentSize: indentSize,
                        insertSpaces: insertSpaces,
                        useTabStops: true,
                        autoIndent: 4 /* EditorAutoIndentStrategy.Full */,
                    }, testLanguageConfigurationService);
                    const actual = (0, testCommand_1.getEditOperation)(model, op);
                    assert.deepStrictEqual(actual, expected);
                    testLanguageConfigurationService.dispose();
                });
            }
            function _assertShiftCommand(tabSize, indentSize, insertSpaces, text, expected) {
                return (0, testTextModel_1.withEditorModel)(text, (model) => {
                    const testLanguageConfigurationService = new testLanguageConfigurationService_1.TestLanguageConfigurationService();
                    const op = new shiftCommand_1.ShiftCommand(new selection_1.Selection(1, 1, text.length + 1, 1), {
                        isUnshift: false,
                        tabSize: tabSize,
                        indentSize: indentSize,
                        insertSpaces: insertSpaces,
                        useTabStops: true,
                        autoIndent: 4 /* EditorAutoIndentStrategy.Full */,
                    }, testLanguageConfigurationService);
                    const actual = (0, testCommand_1.getEditOperation)(model, op);
                    assert.deepStrictEqual(actual, expected);
                    testLanguageConfigurationService.dispose();
                });
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hpZnRDb21tYW5kLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2Jyb3dzZXIvY29tbWFuZHMvc2hpZnRDb21tYW5kLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0JoRzs7T0FFRztJQUNILFNBQVMsa0JBQWtCLENBQUMsSUFBWSxFQUFFLGtCQUEwQixFQUFFLGNBQXNCLEVBQUUsc0JBQThCLGtCQUFrQixFQUFFLGtCQUEwQixjQUFjO1FBQ3ZMLE9BQU87WUFDTixLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsbUJBQW1CLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLGNBQWMsQ0FBQztZQUMxRixJQUFJLEVBQUUsSUFBSTtZQUNWLGdCQUFnQixFQUFFLEtBQUs7U0FDdkIsQ0FBQztJQUNILENBQUM7SUFFRCxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVOztpQkFFN0IsZUFBVSxHQUFHLGFBQWEsQUFBaEIsQ0FBaUI7UUFHekMsWUFDbUIsZUFBaUMsRUFDcEIsNEJBQTJEO1lBRTFGLEtBQUssRUFBRSxDQUFDO1lBTk8sZUFBVSxHQUFHLHFCQUFtQixDQUFDLFVBQVUsQ0FBQztZQU8zRCxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxTQUFTLENBQUMsNEJBQTRCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQ3JFLFFBQVEsRUFBRTtvQkFDVCxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNW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QUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXBDLFNBQVM7WUFDVCxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsZUFB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