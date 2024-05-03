/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/test/common/testTextModel", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/nullTokenize", "vs/editor/contrib/indentation/browser/indentation", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/browser/testCommand", "vs/editor/test/common/modes/supports/indentationRules", "vs/editor/test/common/modes/supports/onEnterRules"], function (require, exports, assert, lifecycle_1, utils_1, languageConfigurationRegistry_1, testTextModel_1, range_1, selection_1, languages_1, language_1, nullTokenize_1, indentation_1, testCodeEditor_1, testCommand_1, indentationRules_1, onEnterRules_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Language;
    (function (Language) {
        Language[Language["TypeScript"] = 0] = "TypeScript";
        Language[Language["Ruby"] = 1] = "Ruby";
        Language[Language["PHP"] = 2] = "PHP";
        Language[Language["Go"] = 3] = "Go";
        Language[Language["CPP"] = 4] = "CPP";
    })(Language || (Language = {}));
    function testIndentationToSpacesCommand(lines, selection, tabSize, expectedLines, expectedSelection) {
        (0, testCommand_1.testCommand)(lines, null, selection, (accessor, sel) => new indentation_1.IndentationToSpacesCommand(sel, tabSize), expectedLines, expectedSelection);
    }
    function testIndentationToTabsCommand(lines, selection, tabSize, expectedLines, expectedSelection) {
        (0, testCommand_1.testCommand)(lines, null, selection, (accessor, sel) => new indentation_1.IndentationToTabsCommand(sel, tabSize), expectedLines, expectedSelection);
    }
    function registerLanguage(instantiationService, languageId, language, disposables) {
        const languageService = instantiationService.get(language_1.ILanguageService);
        registerLanguageConfiguration(instantiationService, languageId, language, disposables);
        disposables.add(languageService.registerLanguage({ id: languageId }));
    }
    // TODO@aiday-mar read directly the configuration file
    function registerLanguageConfiguration(instantiationService, languageId, language, disposables) {
        const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
        switch (language) {
            case Language.TypeScript:
                disposables.add(languageConfigurationService.register(languageId, {
                    brackets: [
                        ['${', '}'],
                        ['{', '}'],
                        ['[', ']'],
                        ['(', ')']
                    ],
                    comments: {
                        lineComment: '//',
                        blockComment: ['/*', '*/']
                    },
                    indentationRules: indentationRules_1.javascriptIndentationRules,
                    onEnterRules: onEnterRules_1.javascriptOnEnterRules
                }));
                break;
            case Language.Ruby:
                disposables.add(languageConfigurationService.register(languageId, {
                    brackets: [
                        ['{', '}'],
                        ['[', ']'],
                        ['(', ')']
                    ],
                    indentationRules: indentationRules_1.rubyIndentationRules,
                }));
                break;
            case Language.PHP:
                disposables.add(languageConfigurationService.register(languageId, {
                    brackets: [
                        ['{', '}'],
                        ['[', ']'],
                        ['(', ')']
                    ],
                    indentationRules: indentationRules_1.phpIndentationRules,
                    onEnterRules: onEnterRules_1.phpOnEnterRules
                }));
                break;
            case Language.Go:
                disposables.add(languageConfigurationService.register(languageId, {
                    brackets: [
                        ['{', '}'],
                        ['[', ']'],
                        ['(', ')']
                    ],
                    indentationRules: indentationRules_1.goIndentationRules
                }));
                break;
            case Language.CPP:
                disposables.add(languageConfigurationService.register(languageId, {
                    brackets: [
                        ['{', '}'],
                        ['[', ']'],
                        ['(', ')']
                    ],
                    onEnterRules: onEnterRules_1.cppOnEnterRules
                }));
                break;
        }
    }
    function registerTokens(instantiationService, tokens, languageId, disposables) {
        let lineIndex = 0;
        const languageService = instantiationService.get(language_1.ILanguageService);
        const tokenizationSupport = {
            getInitialState: () => nullTokenize_1.NullState,
            tokenize: undefined,
            tokenizeEncoded: (line, hasEOL, state) => {
                const tokensOnLine = tokens[lineIndex++];
                const encodedLanguageId = languageService.languageIdCodec.encodeLanguageId(languageId);
                const result = new Uint32Array(2 * tokensOnLine.length);
                for (let i = 0; i < tokensOnLine.length; i++) {
                    result[2 * i] = tokensOnLine[i].startIndex;
                    result[2 * i + 1] =
                        ((encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
                            | (tokensOnLine[i].value << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */));
                }
                return new languages_1.EncodedTokenizationResult(result, state);
            }
        };
        disposables.add(languages_1.TokenizationRegistry.register(languageId, tokenizationSupport));
    }
    suite('Change Indentation to Spaces - TypeScript/Javascript', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('single tabs only at start of line', function () {
            testIndentationToSpacesCommand([
                'first',
                'second line',
                'third line',
                '\tfourth line',
                '\tfifth'
            ], new selection_1.Selection(2, 3, 2, 3), 4, [
                'first',
                'second line',
                'third line',
                '    fourth line',
                '    fifth'
            ], new selection_1.Selection(2, 3, 2, 3));
        });
        test('multiple tabs at start of line', function () {
            testIndentationToSpacesCommand([
                '\t\tfirst',
                '\tsecond line',
                '\t\t\t third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5), 3, [
                '      first',
                '   second line',
                '          third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 9, 1, 9));
        });
        test('multiple tabs', function () {
            testIndentationToSpacesCommand([
                '\t\tfirst\t',
                '\tsecond  \t line \t',
                '\t\t\t third line',
                ' \tfourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5), 2, [
                '    first\t',
                '  second  \t line \t',
                '       third line',
                '   fourth line',
                'fifth'
            ], new selection_1.Selection(1, 7, 1, 7));
        });
        test('empty lines', function () {
            testIndentationToSpacesCommand([
                '\t\t\t',
                '\t',
                '\t\t'
            ], new selection_1.Selection(1, 4, 1, 4), 2, [
                '      ',
                '  ',
                '    '
            ], new selection_1.Selection(1, 4, 1, 4));
        });
    });
    suite('Change Indentation to Tabs -  TypeScript/Javascript', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('spaces only at start of line', function () {
            testIndentationToTabsCommand([
                '    first',
                'second line',
                '    third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 3, 2, 3), 4, [
                '\tfirst',
                'second line',
                '\tthird line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 3, 2, 3));
        });
        test('multiple spaces at start of line', function () {
            testIndentationToTabsCommand([
                'first',
                '   second line',
                '          third line',
                'fourth line',
                '     fifth'
            ], new selection_1.Selection(1, 5, 1, 5), 3, [
                'first',
                '\tsecond line',
                '\t\t\t third line',
                'fourth line',
                '\t  fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('multiple spaces', function () {
            testIndentationToTabsCommand([
                '      first   ',
                '  second     line \t',
                '       third line',
                '   fourth line',
                'fifth'
            ], new selection_1.Selection(1, 8, 1, 8), 2, [
                '\t\t\tfirst   ',
                '\tsecond     line \t',
                '\t\t\t third line',
                '\t fourth line',
                'fifth'
            ], new selection_1.Selection(1, 5, 1, 5));
        });
        test('issue #45996', function () {
            testIndentationToSpacesCommand([
                '\tabc',
            ], new selection_1.Selection(1, 3, 1, 3), 4, [
                '    abc',
            ], new selection_1.Selection(1, 6, 1, 6));
        });
    });
    suite('Auto Indent On Paste - TypeScript/JavaScript', () => {
        const languageId = 'ts-test';
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #119225: Do not add extra leading space when pasting JSDoc', () => {
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                const pasteText = [
                    '/**',
                    ' * JSDoc',
                    ' */',
                    'function a() {}'
                ].join('\n');
                const tokens = [
                    [
                        { startIndex: 0, value: 1 },
                        { startIndex: 3, value: 1 },
                    ],
                    [
                        { startIndex: 0, value: 1 },
                        { startIndex: 2, value: 1 },
                        { startIndex: 8, value: 1 },
                    ],
                    [
                        { startIndex: 0, value: 1 },
                        { startIndex: 1, value: 1 },
                        { startIndex: 3, value: 0 },
                    ],
                    [
                        { startIndex: 0, value: 0 },
                        { startIndex: 8, value: 0 },
                        { startIndex: 9, value: 0 },
                        { startIndex: 10, value: 0 },
                        { startIndex: 11, value: 0 },
                        { startIndex: 12, value: 0 },
                        { startIndex: 13, value: 0 },
                        { startIndex: 14, value: 0 },
                        { startIndex: 15, value: 0 },
                    ]
                ];
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                registerTokens(instantiationService, tokens, languageId, disposables);
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(pasteText, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(1, 1, 4, 16));
                assert.strictEqual(model.getValue(), pasteText);
            });
        });
        test('issue #167299: Blank line removes indent', () => {
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                // no need for tokenization because there are no comments
                const pasteText = [
                    '',
                    'export type IncludeReference =',
                    '	| BaseReference',
                    '	| SelfReference',
                    '	| RelativeReference;',
                    '',
                    'export const enum IncludeReferenceKind {',
                    '	Base,',
                    '	Self,',
                    '	RelativeReference,',
                    '}'
                ].join('\n');
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(pasteText, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(1, 1, 11, 2));
                assert.strictEqual(model.getValue(), pasteText);
            });
        });
        test('issue #29803: do not indent when pasting text with only one line', () => {
            // https://github.com/microsoft/vscode/issues/29803
            const model = (0, testTextModel_1.createTextModel)([
                'const linkHandler = new Class(a, b, c,',
                '    d)'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(2, 6, 2, 6));
                const text = ', null';
                viewModel.paste(text, true, undefined, 'keyboard');
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                autoIndentOnPasteController.trigger(new range_1.Range(2, 6, 2, 11));
                assert.strictEqual(model.getValue(), [
                    'const linkHandler = new Class(a, b, c,',
                    '    d, null)'
                ].join('\n'));
            });
        });
        test('issue #29753: incorrect indentation after comment', () => {
            // https://github.com/microsoft/vscode/issues/29753
            const model = (0, testTextModel_1.createTextModel)([
                'class A {',
                '    /**',
                '     * used only for debug purposes.',
                '     */',
                '    private _codeInfo: KeyMapping[];',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(5, 24, 5, 34));
                const text = 'IMacLinuxKeyMapping';
                viewModel.paste(text, true, undefined, 'keyboard');
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                autoIndentOnPasteController.trigger(new range_1.Range(5, 24, 5, 43));
                assert.strictEqual(model.getValue(), [
                    'class A {',
                    '    /**',
                    '     * used only for debug purposes.',
                    '     */',
                    '    private _codeInfo: IMacLinuxKeyMapping[];',
                    '}',
                ].join('\n'));
            });
        });
        test('issue #29753: incorrect indentation of header comment', () => {
            // https://github.com/microsoft/vscode/issues/29753
            const model = (0, testTextModel_1.createTextModel)('', languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                const text = [
                    '/*----------------',
                    ' *  Copyright (c) ',
                    ' *  Licensed under ...',
                    ' *-----------------*/',
                ].join('\n');
                viewModel.paste(text, true, undefined, 'keyboard');
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                autoIndentOnPasteController.trigger(new range_1.Range(1, 1, 4, 22));
                assert.strictEqual(model.getValue(), text);
            });
        });
        // Failing tests found in issues...
        test.skip('issue #181065: Incorrect paste of object within comment', () => {
            // https://github.com/microsoft/vscode/issues/181065
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                const text = [
                    '/**',
                    ' * @typedef {',
                    ' * }',
                    ' */'
                ].join('\n');
                const tokens = [
                    [
                        { startIndex: 0, value: 1 },
                        { startIndex: 3, value: 1 },
                    ],
                    [
                        { startIndex: 0, value: 1 },
                        { startIndex: 2, value: 1 },
                        { startIndex: 3, value: 1 },
                        { startIndex: 11, value: 1 },
                        { startIndex: 12, value: 0 },
                        { startIndex: 13, value: 0 },
                    ],
                    [
                        { startIndex: 0, value: 1 },
                        { startIndex: 2, value: 0 },
                        { startIndex: 3, value: 0 },
                        { startIndex: 4, value: 0 },
                    ],
                    [
                        { startIndex: 0, value: 1 },
                        { startIndex: 1, value: 1 },
                        { startIndex: 3, value: 0 },
                    ]
                ];
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                registerTokens(instantiationService, tokens, languageId, disposables);
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(1, 1, 4, 4));
                assert.strictEqual(model.getValue(), text);
            });
        });
        test.skip('issue #86301: preserve cursor at inserted indentation level', () => {
            // https://github.com/microsoft/vscode/issues/86301
            const model = (0, testTextModel_1.createTextModel)([
                '() => {',
                '',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                editor.setSelection(new selection_1.Selection(2, 1, 2, 1));
                const text = [
                    '() => {',
                    '',
                    '}',
                    ''
                ].join('\n');
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(2, 1, 5, 1));
                // notes:
                // why is line 3 not indented to the same level as line 2?
                // looks like the indentation is inserted correctly at line 5, but the cursor does not appear at the maximum indentation level?
                assert.strictEqual(model.getValue(), [
                    '() => {',
                    '    () => {',
                    '    ', // <- should also be indented
                    '    }',
                    '    ', // <- cursor should be at the end of the indentation
                    '}',
                ].join('\n'));
                const selection = viewModel.getSelection();
                assert.deepStrictEqual(selection, new selection_1.Selection(5, 5, 5, 5));
            });
        });
        test.skip('issue #85781: indent line with extra white space', () => {
            // https://github.com/microsoft/vscode/issues/85781
            // note: still to determine whether this is a bug or not
            const model = (0, testTextModel_1.createTextModel)([
                '() => {',
                '    console.log("a");',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                editor.setSelection(new selection_1.Selection(2, 5, 2, 5));
                const text = [
                    '() => {',
                    '    console.log("b")',
                    '}',
                    ' '
                ].join('\n');
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                // todo@aiday-mar, make sure range is correct, and make test work as in real life
                autoIndentOnPasteController.trigger(new range_1.Range(2, 5, 5, 6));
                assert.strictEqual(model.getValue(), [
                    '() => {',
                    '    () => {',
                    '        console.log("b")',
                    '    }',
                    '    console.log("a");',
                    '}',
                ].join('\n'));
            });
        });
        test.skip('issue #29589: incorrect indentation of closing brace on paste', () => {
            // https://github.com/microsoft/vscode/issues/29589
            const model = (0, testTextModel_1.createTextModel)('', languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                editor.setSelection(new selection_1.Selection(2, 5, 2, 5));
                const text = [
                    'function makeSub(a,b) {',
                    'subsent = sent.substring(a,b);',
                    'return subsent;',
                    '}',
                ].join('\n');
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                // todo@aiday-mar, make sure range is correct, and make test work as in real life
                autoIndentOnPasteController.trigger(new range_1.Range(1, 1, 4, 2));
                assert.strictEqual(model.getValue(), [
                    'function makeSub(a,b) {',
                    '    subsent = sent.substring(a,b);',
                    '    return subsent;',
                    '}',
                ].join('\n'));
            });
        });
        test.skip('issue #201420: incorrect indentation when first line is comment', () => {
            // https://github.com/microsoft/vscode/issues/201420
            const model = (0, testTextModel_1.createTextModel)([
                'function bar() {',
                '',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'full' }, (editor, viewModel, instantiationService) => {
                const tokens = [
                    [{ startIndex: 0, value: 0 }, { startIndex: 8, value: 0 }, { startIndex: 9, value: 0 }, { startIndex: 12, value: 0 }, { startIndex: 13, value: 0 }, { startIndex: 14, value: 0 }, { startIndex: 15, value: 0 }, { startIndex: 16, value: 0 }],
                    [{ startIndex: 0, value: 1 }, { startIndex: 2, value: 1 }, { startIndex: 3, value: 1 }, { startIndex: 10, value: 1 }],
                    [{ startIndex: 0, value: 0 }, { startIndex: 5, value: 0 }, { startIndex: 6, value: 0 }, { startIndex: 9, value: 0 }, { startIndex: 10, value: 0 }, { startIndex: 11, value: 0 }, { startIndex: 12, value: 0 }, { startIndex: 14, value: 0 }],
                    [{ startIndex: 0, value: 0 }, { startIndex: 1, value: 0 }]
                ];
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                registerTokens(instantiationService, tokens, languageId, disposables);
                editor.setSelection(new selection_1.Selection(2, 1, 2, 1));
                const text = [
                    '// comment',
                    'const foo = 42',
                ].join('\n');
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(2, 1, 3, 15));
                assert.strictEqual(model.getValue(), [
                    'function bar() {',
                    '    // comment',
                    '    const foo = 42',
                    '}',
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Type - TypeScript/JavaScript', () => {
        const languageId = "ts-test";
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        // Failing tests from issues...
        test('issue #208215: indent after arrow function', () => {
            // https://github.com/microsoft/vscode/issues/208215
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                viewModel.type('const add1 = (n) =>');
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const add1 = (n) =>',
                    '    ',
                ].join('\n'));
            });
        });
        test('issue #208215: indent after arrow function 2', () => {
            // https://github.com/microsoft/vscode/issues/208215
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3, 4, 5];',
                'array.map(',
                '    v =>',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(3, 9, 3, 9));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3, 4, 5];',
                    'array.map(',
                    '    v =>',
                    '        '
                ].join('\n'));
            });
        });
        test('issue #116843: indent after arrow function', () => {
            // https://github.com/microsoft/vscode/issues/116843
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                viewModel.type([
                    'const add1 = (n) =>',
                    '    n + 1;',
                ].join('\n'));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const add1 = (n) =>',
                    '    n + 1;',
                    '',
                ].join('\n'));
            });
        });
        test('issue #29755: do not add indentation on enter if indentation is already valid', () => {
            //https://github.com/microsoft/vscode/issues/29755
            const model = (0, testTextModel_1.createTextModel)([
                'function f() {',
                '    const one = 1;',
                '    const two = 2;',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(3, 1, 3, 1));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'function f() {',
                    '    const one = 1;',
                    '',
                    '    const two = 2;',
                    '}',
                ].join('\n'));
            });
        });
        test('issue #36090', () => {
            // https://github.com/microsoft/vscode/issues/36090
            const model = (0, testTextModel_1.createTextModel)([
                'class ItemCtrl {',
                '    getPropertiesByItemId(id) {',
                '        return this.fetchItem(id)',
                '            .then(item => {',
                '                return this.getPropertiesOfItem(item);',
                '            });',
                '    }',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'advanced' }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(7, 6, 7, 6));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'class ItemCtrl {',
                    '    getPropertiesByItemId(id) {',
                    '        return this.fetchItem(id)',
                    '            .then(item => {',
                    '                return this.getPropertiesOfItem(item);',
                    '            });',
                    '    }',
                    '    ',
                    '}',
                ].join('\n'));
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(8, 5, 8, 5));
            });
        });
        test('issue #115304: indent block comment onEnter', () => {
            // https://github.com/microsoft/vscode/issues/115304
            const model = (0, testTextModel_1.createTextModel)([
                '/** */',
                'function f() {}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: 'advanced' }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(1, 4, 1, 4));
                viewModel.type('\n', 'keyboard');
                assert.strictEqual(model.getValue(), [
                    '/**',
                    ' * ',
                    ' */',
                    'function f() {}',
                ].join('\n'));
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(2, 4, 2, 4));
            });
        });
        test('issue #43244: indent when lambda arrow function is detected, outdent when end is reached', () => {
            // https://github.com/microsoft/vscode/issues/43244
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3, 4, 5];',
                'array.map(_)'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(2, 12, 2, 12));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3, 4, 5];',
                    'array.map(_',
                    '    ',
                    ')'
                ].join('\n'));
            });
        });
        test('issue #43244: incorrect indentation after if/for/while without braces', () => {
            // https://github.com/microsoft/vscode/issues/43244
            const model = (0, testTextModel_1.createTextModel)([
                'function f() {',
                '    if (condition)',
                '}'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(2, 19, 2, 19));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'function f() {',
                    '    if (condition)',
                    '        ',
                    '}',
                ].join('\n'));
                viewModel.type("return;");
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'function f() {',
                    '    if (condition)',
                    '        return;',
                    '    ',
                    '}',
                ].join('\n'));
            });
        });
        // Failing tests...
        test.skip('issue #208232: incorrect indentation inside of comments', () => {
            // https://github.com/microsoft/vscode/issues/208232
            const model = (0, testTextModel_1.createTextModel)([
                '/**',
                'indentation done for {',
                '*/'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(2, 23, 2, 23));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    '/**',
                    'indentation done for {',
                    '',
                    '*/'
                ].join('\n'));
            });
        });
        test.skip('issue #43244: indent after equal sign is detected', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // issue: Should indent after an equal sign is detected followed by whitespace characters.
            // This should be outdented when a semi-colon is detected indicating the end of the assignment.
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array ='
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(1, 14, 1, 14));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array =',
                    '    '
                ].join('\n'));
            });
        });
        test.skip('issue #43244: indent after dot detected after object/array signifying a method call', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // issue: When a dot is written, we should detect that this is a method call and indent accordingly
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3];',
                'array.'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(2, 7, 2, 7));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3];',
                    'array.',
                    '    '
                ].join('\n'));
            });
        });
        test.skip('issue #43244: indent after dot detected on a subsequent line after object/array signifying a method call', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // issue: When a dot is written, we should detect that this is a method call and indent accordingly
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3]',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(2, 7, 2, 7));
                viewModel.type("\n", 'keyboard');
                viewModel.type(".");
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3]',
                    '    .'
                ].join('\n'));
            });
        });
        test.skip('issue #43244: keep indentation when methods called on object/array', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // Currently passes, but should pass with all the tests above too
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3]',
                '    .filter(() => true)'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(2, 24, 2, 24));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3]',
                    '    .filter(() => true)',
                    '    '
                ].join('\n'));
            });
        });
        test.skip('issue #43244: keep indentation when chained methods called on object/array', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // When the call chain is not finished yet, and we type a dot, we do not want to change the indentation
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3]',
                '    .filter(() => true)',
                '    '
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(3, 5, 3, 5));
                viewModel.type(".");
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3]',
                    '    .filter(() => true)',
                    '    .' // here we don't want to increase the indentation because we have chained methods
                ].join('\n'));
            });
        });
        test.skip('issue #43244: outdent when a semi-color is detected indicating the end of the assignment', () => {
            // https://github.com/microsoft/vscode/issues/43244
            // TODO: requires exploring indent/outdent pairs instead
            const model = (0, testTextModel_1.createTextModel)([
                'const array = [1, 2, 3]',
                '    .filter(() => true);'
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(2, 25, 2, 25));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'const array = [1, 2, 3]',
                    '    .filter(() => true);',
                    ''
                ].join('\n'));
            });
        });
        test.skip('issue #40115: keep indentation when added', () => {
            // https://github.com/microsoft/vscode/issues/40115
            const model = (0, testTextModel_1.createTextModel)('function foo() {}', languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(1, 17, 1, 17));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'function foo() {',
                    '    ',
                    '}',
                ].join('\n'));
                editor.setSelection(new selection_1.Selection(2, 5, 2, 5));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'function foo() {',
                    '    ',
                    '    ',
                    '}',
                ].join('\n'));
            });
        });
        test.skip('issue #193875: incorrect indentation on enter', () => {
            // https://github.com/microsoft/vscode/issues/193875
            const model = (0, testTextModel_1.createTextModel)([
                '{',
                '    for(;;)',
                '    for(;;) {}',
                '}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.TypeScript, disposables);
                editor.setSelection(new selection_1.Selection(3, 14, 3, 14));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    '{',
                    '    for(;;)',
                    '    for(;;) {',
                    '        ',
                    '    }',
                    '}',
                ].join('\n'));
            });
        });
        // Add tests for:
        // https://github.com/microsoft/vscode/issues/88638
        // https://github.com/microsoft/vscode/issues/63388
        // https://github.com/microsoft/vscode/issues/46401
        // https://github.com/microsoft/vscode/issues/174044
    });
    suite('Auto Indent On Type - Ruby', () => {
        const languageId = "ruby-test";
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #198350: in or when incorrectly match non keywords for Ruby', () => {
            // https://github.com/microsoft/vscode/issues/198350
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.Ruby, disposables);
                viewModel.type("def foo\n        i");
                viewModel.type("n", 'keyboard');
                assert.strictEqual(model.getValue(), "def foo\n        in");
                viewModel.type(" ", 'keyboard');
                assert.strictEqual(model.getValue(), "def foo\nin ");
                viewModel.model.setValue("");
                viewModel.type("  # in");
                assert.strictEqual(model.getValue(), "  # in");
                viewModel.type(" ", 'keyboard');
                assert.strictEqual(model.getValue(), "  # in ");
            });
        });
        // Failing tests...
        test.skip('issue #199846: in or when incorrectly match non keywords for Ruby', () => {
            // https://github.com/microsoft/vscode/issues/199846
            // explanation: happening because the # is detected probably as a comment
            const model = (0, testTextModel_1.createTextModel)("", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.Ruby, disposables);
                viewModel.type("method('#foo') do");
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    "method('#foo') do",
                    "    "
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Type - PHP', () => {
        const languageId = "php-test";
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('temp issue because there should be at least one passing test in a suite', () => {
            assert.ok(true);
        });
        test.skip('issue #199050: should not indent after { detected in a string', () => {
            // https://github.com/microsoft/vscode/issues/199050
            const model = (0, testTextModel_1.createTextModel)("$phrase = preg_replace('#(\{1|%s).*#su', '', $phrase);", languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.PHP, disposables);
                editor.setSelection(new selection_1.Selection(1, 54, 1, 54));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    "$phrase = preg_replace('#(\{1|%s).*#su', '', $phrase);",
                    ""
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Paste - Go', () => {
        const languageId = "go-test";
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('temp issue because there should be at least one passing test in a suite', () => {
            assert.ok(true);
        });
        test.skip('issue #199050: should not indent after { detected in a string', () => {
            // https://github.com/microsoft/vscode/issues/199050
            const model = (0, testTextModel_1.createTextModel)([
                'var s = `',
                'quick  brown',
                'fox',
                '`',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.Go, disposables);
                editor.setSelection(new selection_1.Selection(3, 1, 3, 1));
                const text = '  ';
                const autoIndentOnPasteController = editor.registerAndInstantiateContribution(indentation_1.AutoIndentOnPaste.ID, indentation_1.AutoIndentOnPaste);
                viewModel.paste(text, true, undefined, 'keyboard');
                autoIndentOnPasteController.trigger(new range_1.Range(3, 1, 3, 3));
                assert.strictEqual(model.getValue(), [
                    'var s = `',
                    'quick  brown',
                    '  fox',
                    '`',
                ].join('\n'));
            });
        });
    });
    suite('Auto Indent On Type - CPP', () => {
        const languageId = "cpp-test";
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('temp issue because there should be at least one passing test in a suite', () => {
            assert.ok(true);
        });
        test.skip('issue #178334: incorrect outdent of } when signature spans multiple lines', () => {
            // https://github.com/microsoft/vscode/issues/178334
            const model = (0, testTextModel_1.createTextModel)([
                'int WINAPI WinMain(bool instance,',
                '    int nshowcmd) {}',
            ].join('\n'), languageId, {});
            disposables.add(model);
            (0, testCodeEditor_1.withTestCodeEditor)(model, { autoIndent: "full" }, (editor, viewModel, instantiationService) => {
                registerLanguage(instantiationService, languageId, Language.CPP, disposables);
                editor.setSelection(new selection_1.Selection(2, 20, 2, 20));
                viewModel.type("\n", 'keyboard');
                assert.strictEqual(model.getValue(), [
                    'int WINAPI WinMain(bool instance,',
                    '    int nshowcmd) {',
                    '    ',
                    '}'
                ].join('\n'));
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50YXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5kZW50YXRpb24vdGVzdC9icm93c2VyL2luZGVudGF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvQmhHLElBQUssUUFNSjtJQU5ELFdBQUssUUFBUTtRQUNaLG1EQUFVLENBQUE7UUFDVix1Q0FBSSxDQUFBO1FBQ0oscUNBQUcsQ0FBQTtRQUNILG1DQUFFLENBQUE7UUFDRixxQ0FBRyxDQUFBO0lBQ0osQ0FBQyxFQU5JLFFBQVEsS0FBUixRQUFRLFFBTVo7SUFFRCxTQUFTLDhCQUE4QixDQUFDLEtBQWUsRUFBRSxTQUFvQixFQUFFLE9BQWUsRUFBRSxhQUF1QixFQUFFLGlCQUE0QjtRQUNwSixJQUFBLHlCQUFXLEVBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLHdDQUEwQixDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUN4SSxDQUFDO0lBRUQsU0FBUyw0QkFBNEIsQ0FBQyxLQUFlLEVBQUUsU0FBb0IsRUFBRSxPQUFlLEVBQUUsYUFBdUIsRUFBRSxpQkFBNEI7UUFDbEosSUFBQSx5QkFBVyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsSUFBSSxzQ0FBd0IsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDdEksQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsb0JBQThDLEVBQUUsVUFBa0IsRUFBRSxR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RSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQzNCLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3FCQUMzQjtvQkFDRDt3QkFDQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt3QkFDM0IsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQzNCLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3FCQUMzQjtvQkFDRDt3QkFDQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt3QkFDM0IsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQzNCLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3FCQUMzQjtvQkFDRDt3QkFDQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt3QkFDM0IsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQzNCLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3dCQUMzQixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt3QkFDNUIsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQzVCLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO3dCQUM1QixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTt3QkFDNUIsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7d0JBQzVCLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUs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RSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUM3TyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ3JILENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUM1TyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVB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