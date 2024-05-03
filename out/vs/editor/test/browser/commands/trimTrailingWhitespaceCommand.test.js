/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/commands/trimTrailingWhitespaceCommand", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/nullTokenize", "vs/editor/test/browser/testCommand", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, utils_1, trimTrailingWhitespaceCommand_1, position_1, range_1, selection_1, languages_1, language_1, nullTokenize_1, testCommand_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Create single edit operation
     */
    function createInsertDeleteSingleEditOp(text, positionLineNumber, positionColumn, selectionLineNumber = positionLineNumber, selectionColumn = positionColumn) {
        return {
            range: new range_1.Range(selectionLineNumber, selectionColumn, positionLineNumber, positionColumn),
            text: text
        };
    }
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
    function assertTrimTrailingWhitespaceCommand(text, expected) {
        return (0, testTextModel_1.withEditorModel)(text, (model) => {
            const op = new trimTrailingWhitespaceCommand_1.TrimTrailingWhitespaceCommand(new selection_1.Selection(1, 1, 1, 1), [], true);
            const actual = (0, testCommand_1.getEditOperation)(model, op);
            assert.deepStrictEqual(actual, expected);
        });
    }
    function assertTrimTrailingWhitespace(text, cursors, expected) {
        return (0, testTextModel_1.withEditorModel)(text, (model) => {
            const actual = (0, trimTrailingWhitespaceCommand_1.trimTrailingWhitespace)(model, cursors, true);
            assert.deepStrictEqual(actual, expected);
        });
    }
    suite('Editor Commands - Trim Trailing Whitespace Command', () => {
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('remove trailing whitespace', function () {
            assertTrimTrailingWhitespaceCommand([''], []);
            assertTrimTrailingWhitespaceCommand(['text'], []);
            assertTrimTrailingWhitespaceCommand(['text   '], [createSingleEditOp(null, 1, 5, 1, 8)]);
            assertTrimTrailingWhitespaceCommand(['text\t   '], [createSingleEditOp(null, 1, 5, 1, 9)]);
            assertTrimTrailingWhitespaceCommand(['\t   '], [createSingleEditOp(null, 1, 1, 1, 5)]);
            assertTrimTrailingWhitespaceCommand(['text\t'], [createSingleEditOp(null, 1, 5, 1, 6)]);
            assertTrimTrailingWhitespaceCommand([
                'some text\t',
                'some more text',
                '\t  ',
                'even more text  ',
                'and some mixed\t   \t'
            ], [
                createSingleEditOp(null, 1, 10, 1, 11),
                createSingleEditOp(null, 3, 1, 3, 4),
                createSingleEditOp(null, 4, 15, 4, 17),
                createSingleEditOp(null, 5, 15, 5, 20)
            ]);
            assertTrimTrailingWhitespace(['text   '], [new position_1.Position(1, 1), new position_1.Position(1, 2), new position_1.Position(1, 3)], [createInsertDeleteSingleEditOp(null, 1, 5, 1, 8)]);
            assertTrimTrailingWhitespace(['text   '], [new position_1.Position(1, 1), new position_1.Position(1, 5)], [createInsertDeleteSingleEditOp(null, 1, 5, 1, 8)]);
            assertTrimTrailingWhitespace(['text   '], [new position_1.Position(1, 1), new position_1.Position(1, 5), new position_1.Position(1, 6)], [createInsertDeleteSingleEditOp(null, 1, 6, 1, 8)]);
            assertTrimTrailingWhitespace([
                'some text\t',
                'some more text',
                '\t  ',
                'even more text  ',
                'and some mixed\t   \t'
            ], [], [
                createInsertDeleteSingleEditOp(null, 1, 10, 1, 11),
                createInsertDeleteSingleEditOp(null, 3, 1, 3, 4),
                createInsertDeleteSingleEditOp(null, 4, 15, 4, 17),
                createInsertDeleteSingleEditOp(null, 5, 15, 5, 20)
            ]);
            assertTrimTrailingWhitespace([
                'some text\t',
                'some more text',
                '\t  ',
                'even more text  ',
                'and some mixed\t   \t'
            ], [new position_1.Position(1, 11), new position_1.Position(3, 2), new position_1.Position(5, 1), new position_1.Position(4, 1), new position_1.Position(5, 10)], [
                createInsertDeleteSingleEditOp(null, 3, 2, 3, 4),
                createInsertDeleteSingleEditOp(null, 4, 15, 4, 17),
                createInsertDeleteSingleEditOp(null, 5, 15, 5, 20)
            ]);
        });
        test('skips strings and regex if configured', function () {
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            const languageService = instantiationService.get(language_1.ILanguageService);
            const languageId = 'testLanguageId';
            const languageIdCodec = languageService.languageIdCodec;
            disposables.add(languageService.registerLanguage({ id: languageId }));
            const encodedLanguageId = languageIdCodec.encodeLanguageId(languageId);
            const otherMetadata = ((encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
                | (0 /* StandardTokenType.Other */ << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)
                | (1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */)) >>> 0;
            const stringMetadata = ((encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
                | (2 /* StandardTokenType.String */ << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)
                | (1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */)) >>> 0;
            const tokenizationSupport = {
                getInitialState: () => nullTokenize_1.NullState,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    switch (line) {
                        case 'const a = `  ': {
                            const tokens = new Uint32Array([
                                0, otherMetadata,
                                10, stringMetadata,
                            ]);
                            return new languages_1.EncodedTokenizationResult(tokens, state);
                        }
                        case '  a string  ': {
                            const tokens = new Uint32Array([
                                0, stringMetadata,
                            ]);
                            return new languages_1.EncodedTokenizationResult(tokens, state);
                        }
                        case '`;  ': {
                            const tokens = new Uint32Array([
                                0, stringMetadata,
                                1, otherMetadata
                            ]);
                            return new languages_1.EncodedTokenizationResult(tokens, state);
                        }
                    }
                    throw new Error(`Unexpected`);
                }
            };
            disposables.add(languages_1.TokenizationRegistry.register(languageId, tokenizationSupport));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, [
                'const a = `  ',
                '  a string  ',
                '`;  ',
            ].join('\n'), languageId));
            model.tokenization.forceTokenization(1);
            model.tokenization.forceTokenization(2);
            model.tokenization.forceTokenization(3);
            const op = new trimTrailingWhitespaceCommand_1.TrimTrailingWhitespaceCommand(new selection_1.Selection(1, 1, 1, 1), [], false);
            const actual = (0, testCommand_1.getEditOperation)(model, op);
            assert.deepStrictEqual(actual, [createSingleEditOp(null, 3, 3, 3, 5)]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJpbVRyYWlsaW5nV2hpdGVzcGFjZUNvbW1hbmQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvYnJvd3Nlci9jb21tYW5kcy90cmltVHJhaWxpbmdXaGl0ZXNwYWNlQ29tbWFuZC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaUJoRzs7T0FFRztJQUNILFNBQVMsOEJBQThCLENBQUMsSUFBbUIsRUFBRSxrQkFBMEIsRUFBRSxjQUFzQixFQUFFLHNCQUE4QixrQkFBa0IsRUFBRSxrQkFBMEIsY0FBYztRQUMxTSxPQUFPO1lBQ04sS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLENBQUM7WUFDMUYsSUFBSSxFQUFFLElBQUk7U0FDVixDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUyxrQkFBa0IsQ0FBQyxJQUFtQixFQUFFLGtCQUEwQixFQUFFLGNBQXNCLEVBQUUsc0JBQThCLGtCQUFrQixFQUFFLGtCQUEwQixjQUFjO1FBQzlMLE9BQU87WUFDTixLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsbUJBQW1CLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLGNBQWMsQ0FBQztZQUMxRixJQUFJLEVBQUUsSUFBSTtZQUNWLGdCQUFnQixFQUFFLEtBQUs7U0FDdkIsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFTLG1DQUFtQyxDQUFDLElBQWMsRUFBRSxRQUFnQztRQUM1RixPQUFPLElBQUEsK0JBQWUsRUFBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUN0QyxNQUFNLEVBQUUsR0FBRyxJQUFJLDZEQUE2QixDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENB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