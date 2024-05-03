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
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/nullTokenize", "vs/editor/common/textModelEvents", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, utils_1, editOperation_1, position_1, range_1, languages_1, language_1, languageConfigurationRegistry_1, nullTokenize_1, textModelEvents_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --------- utils
    const LINE1 = 'My First Line';
    const LINE2 = '\t\tMy Second Line';
    const LINE3 = '    Third Line';
    const LINE4 = '';
    const LINE5 = '1';
    suite('Editor Model - Model', () => {
        let thisModel;
        setup(() => {
            const text = LINE1 + '\r\n' +
                LINE2 + '\n' +
                LINE3 + '\n' +
                LINE4 + '\r\n' +
                LINE5;
            thisModel = (0, testTextModel_1.createTextModel)(text);
        });
        teardown(() => {
            thisModel.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        // --------- insert text
        test('model getValue', () => {
            assert.strictEqual(thisModel.getValue(), 'My First Line\n\t\tMy Second Line\n    Third Line\n\n1');
        });
        test('model insert empty text', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), '')]);
            assert.strictEqual(thisModel.getLineCount(), 5);
            assert.strictEqual(thisModel.getLineContent(1), 'My First Line');
        });
        test('model insert text without newline 1', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'foo ')]);
            assert.strictEqual(thisModel.getLineCount(), 5);
            assert.strictEqual(thisModel.getLineContent(1), 'foo My First Line');
        });
        test('model insert text without newline 2', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), ' foo')]);
            assert.strictEqual(thisModel.getLineCount(), 5);
            assert.strictEqual(thisModel.getLineContent(1), 'My foo First Line');
        });
        test('model insert text with one newline', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), ' new line\nNo longer')]);
            assert.strictEqual(thisModel.getLineCount(), 6);
            assert.strictEqual(thisModel.getLineContent(1), 'My new line');
            assert.strictEqual(thisModel.getLineContent(2), 'No longer First Line');
        });
        test('model insert text with two newlines', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), ' new line\nOne more line in the middle\nNo longer')]);
            assert.strictEqual(thisModel.getLineCount(), 7);
            assert.strictEqual(thisModel.getLineContent(1), 'My new line');
            assert.strictEqual(thisModel.getLineContent(2), 'One more line in the middle');
            assert.strictEqual(thisModel.getLineContent(3), 'No longer First Line');
        });
        test('model insert text with many newlines', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), '\n\n\n\n')]);
            assert.strictEqual(thisModel.getLineCount(), 9);
            assert.strictEqual(thisModel.getLineContent(1), 'My');
            assert.strictEqual(thisModel.getLineContent(2), '');
            assert.strictEqual(thisModel.getLineContent(3), '');
            assert.strictEqual(thisModel.getLineContent(4), '');
            assert.strictEqual(thisModel.getLineContent(5), ' First Line');
        });
        // --------- insert text eventing
        test('model insert empty text does not trigger eventing', () => {
            const disposable = thisModel.onDidChangeContentOrInjectedText((e) => {
                assert.ok(false, 'was not expecting event');
            });
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), '')]);
            disposable.dispose();
        });
        test('model insert text without newline eventing', () => {
            let e = null;
            const disposable = thisModel.onDidChangeContentOrInjectedText((_e) => {
                if (e !== null || !(_e instanceof textModelEvents_1.InternalModelContentChangeEvent)) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e.rawContentChangedEvent;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'foo ')]);
            assert.deepStrictEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, 'foo My First Line', null)
            ], 2, false, false));
            disposable.dispose();
        });
        test('model insert text with one newline eventing', () => {
            let e = null;
            const disposable = thisModel.onDidChangeContentOrInjectedText((_e) => {
                if (e !== null || !(_e instanceof textModelEvents_1.InternalModelContentChangeEvent)) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e.rawContentChangedEvent;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), ' new line\nNo longer')]);
            assert.deepStrictEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, 'My new line', null),
                new textModelEvents_1.ModelRawLinesInserted(2, 2, ['No longer First Line'], [null]),
            ], 2, false, false));
            disposable.dispose();
        });
        // --------- delete text
        test('model delete empty text', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 1))]);
            assert.strictEqual(thisModel.getLineCount(), 5);
            assert.strictEqual(thisModel.getLineContent(1), 'My First Line');
        });
        test('model delete text from one line', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 2))]);
            assert.strictEqual(thisModel.getLineCount(), 5);
            assert.strictEqual(thisModel.getLineContent(1), 'y First Line');
        });
        test('model delete text from one line 2', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'a')]);
            assert.strictEqual(thisModel.getLineContent(1), 'aMy First Line');
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 2, 1, 4))]);
            assert.strictEqual(thisModel.getLineCount(), 5);
            assert.strictEqual(thisModel.getLineContent(1), 'a First Line');
        });
        test('model delete all text from a line', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 14))]);
            assert.strictEqual(thisModel.getLineCount(), 5);
            assert.strictEqual(thisModel.getLineContent(1), '');
        });
        test('model delete text from two lines', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 4, 2, 6))]);
            assert.strictEqual(thisModel.getLineCount(), 4);
            assert.strictEqual(thisModel.getLineContent(1), 'My Second Line');
        });
        test('model delete text from many lines', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 4, 3, 5))]);
            assert.strictEqual(thisModel.getLineCount(), 3);
            assert.strictEqual(thisModel.getLineContent(1), 'My Third Line');
        });
        test('model delete everything', () => {
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 5, 2))]);
            assert.strictEqual(thisModel.getLineCount(), 1);
            assert.strictEqual(thisModel.getLineContent(1), '');
        });
        // --------- delete text eventing
        test('model delete empty text does not trigger eventing', () => {
            const disposable = thisModel.onDidChangeContentOrInjectedText((e) => {
                assert.ok(false, 'was not expecting event');
            });
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 1))]);
            disposable.dispose();
        });
        test('model delete text from one line eventing', () => {
            let e = null;
            const disposable = thisModel.onDidChangeContentOrInjectedText((_e) => {
                if (e !== null || !(_e instanceof textModelEvents_1.InternalModelContentChangeEvent)) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e.rawContentChangedEvent;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 2))]);
            assert.deepStrictEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, 'y First Line', null),
            ], 2, false, false));
            disposable.dispose();
        });
        test('model delete all text from a line eventing', () => {
            let e = null;
            const disposable = thisModel.onDidChangeContentOrInjectedText((_e) => {
                if (e !== null || !(_e instanceof textModelEvents_1.InternalModelContentChangeEvent)) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e.rawContentChangedEvent;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 14))]);
            assert.deepStrictEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, '', null),
            ], 2, false, false));
            disposable.dispose();
        });
        test('model delete text from two lines eventing', () => {
            let e = null;
            const disposable = thisModel.onDidChangeContentOrInjectedText((_e) => {
                if (e !== null || !(_e instanceof textModelEvents_1.InternalModelContentChangeEvent)) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e.rawContentChangedEvent;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 4, 2, 6))]);
            assert.deepStrictEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, 'My Second Line', null),
                new textModelEvents_1.ModelRawLinesDeleted(2, 2),
            ], 2, false, false));
            disposable.dispose();
        });
        test('model delete text from many lines eventing', () => {
            let e = null;
            const disposable = thisModel.onDidChangeContentOrInjectedText((_e) => {
                if (e !== null || !(_e instanceof textModelEvents_1.InternalModelContentChangeEvent)) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e.rawContentChangedEvent;
            });
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 4, 3, 5))]);
            assert.deepStrictEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawLineChanged(1, 'My Third Line', null),
                new textModelEvents_1.ModelRawLinesDeleted(2, 3),
            ], 2, false, false));
            disposable.dispose();
        });
        // --------- getValueInRange
        test('getValueInRange', () => {
            assert.strictEqual(thisModel.getValueInRange(new range_1.Range(1, 1, 1, 1)), '');
            assert.strictEqual(thisModel.getValueInRange(new range_1.Range(1, 1, 1, 2)), 'M');
            assert.strictEqual(thisModel.getValueInRange(new range_1.Range(1, 2, 1, 3)), 'y');
            assert.strictEqual(thisModel.getValueInRange(new range_1.Range(1, 1, 1, 14)), 'My First Line');
            assert.strictEqual(thisModel.getValueInRange(new range_1.Range(1, 1, 2, 1)), 'My First Line\n');
            assert.strictEqual(thisModel.getValueInRange(new range_1.Range(1, 1, 2, 2)), 'My First Line\n\t');
            assert.strictEqual(thisModel.getValueInRange(new range_1.Range(1, 1, 2, 3)), 'My First Line\n\t\t');
            assert.strictEqual(thisModel.getValueInRange(new range_1.Range(1, 1, 2, 17)), 'My First Line\n\t\tMy Second Line');
            assert.strictEqual(thisModel.getValueInRange(new range_1.Range(1, 1, 3, 1)), 'My First Line\n\t\tMy Second Line\n');
            assert.strictEqual(thisModel.getValueInRange(new range_1.Range(1, 1, 4, 1)), 'My First Line\n\t\tMy Second Line\n    Third Line\n');
        });
        // --------- getValueLengthInRange
        test('getValueLengthInRange', () => {
            assert.strictEqual(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 1, 1)), ''.length);
            assert.strictEqual(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 1, 2)), 'M'.length);
            assert.strictEqual(thisModel.getValueLengthInRange(new range_1.Range(1, 2, 1, 3)), 'y'.length);
            assert.strictEqual(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 1, 14)), 'My First Line'.length);
            assert.strictEqual(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 2, 1)), 'My First Line\n'.length);
            assert.strictEqual(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 2, 2)), 'My First Line\n\t'.length);
            assert.strictEqual(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 2, 3)), 'My First Line\n\t\t'.length);
            assert.strictEqual(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 2, 17)), 'My First Line\n\t\tMy Second Line'.length);
            assert.strictEqual(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 3, 1)), 'My First Line\n\t\tMy Second Line\n'.length);
            assert.strictEqual(thisModel.getValueLengthInRange(new range_1.Range(1, 1, 4, 1)), 'My First Line\n\t\tMy Second Line\n    Third Line\n'.length);
        });
        // --------- setValue
        test('setValue eventing', () => {
            let e = null;
            const disposable = thisModel.onDidChangeContentOrInjectedText((_e) => {
                if (e !== null || !(_e instanceof textModelEvents_1.InternalModelContentChangeEvent)) {
                    assert.fail('Unexpected assertion error');
                }
                e = _e.rawContentChangedEvent;
            });
            thisModel.setValue('new value');
            assert.deepStrictEqual(e, new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawFlush()
            ], 2, false, false));
            disposable.dispose();
        });
        test('issue #46342: Maintain edit operation order in applyEdits', () => {
            const res = thisModel.applyEdits([
                { range: new range_1.Range(2, 1, 2, 1), text: 'a' },
                { range: new range_1.Range(1, 1, 1, 1), text: 'b' },
            ], true);
            assert.deepStrictEqual(res[0].range, new range_1.Range(2, 1, 2, 2));
            assert.deepStrictEqual(res[1].range, new range_1.Range(1, 1, 1, 2));
        });
    });
    // --------- Special Unicode LINE SEPARATOR character
    suite('Editor Model - Model Line Separators', () => {
        let thisModel;
        setup(() => {
            const text = LINE1 + '\u2028' +
                LINE2 + '\n' +
                LINE3 + '\u2028' +
                LINE4 + '\r\n' +
                LINE5;
            thisModel = (0, testTextModel_1.createTextModel)(text);
        });
        teardown(() => {
            thisModel.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('model getValue', () => {
            assert.strictEqual(thisModel.getValue(), 'My First Line\u2028\t\tMy Second Line\n    Third Line\u2028\n1');
        });
        test('model lines', () => {
            assert.strictEqual(thisModel.getLineCount(), 3);
        });
        test('Bug 13333:Model should line break on lonely CR too', () => {
            const model = (0, testTextModel_1.createTextModel)('Hello\rWorld!\r\nAnother line');
            assert.strictEqual(model.getLineCount(), 3);
            assert.strictEqual(model.getValue(), 'Hello\r\nWorld!\r\nAnother line');
            model.dispose();
        });
    });
    // --------- Words
    suite('Editor Model - Words', () => {
        const OUTER_LANGUAGE_ID = 'outerMode';
        const INNER_LANGUAGE_ID = 'innerMode';
        let OuterMode = class OuterMode extends lifecycle_1.Disposable {
            constructor(languageService, languageConfigurationService) {
                super();
                this.languageId = OUTER_LANGUAGE_ID;
                this._register(languageService.registerLanguage({ id: this.languageId }));
                this._register(languageConfigurationService.register(this.languageId, {}));
                const languageIdCodec = languageService.languageIdCodec;
                this._register(languages_1.TokenizationRegistry.register(this.languageId, {
                    getInitialState: () => nullTokenize_1.NullState,
                    tokenize: undefined,
                    tokenizeEncoded: (line, hasEOL, state) => {
                        const tokensArr = [];
                        let prevLanguageId = undefined;
                        for (let i = 0; i < line.length; i++) {
                            const languageId = (line.charAt(i) === 'x' ? INNER_LANGUAGE_ID : OUTER_LANGUAGE_ID);
                            const encodedLanguageId = languageIdCodec.encodeLanguageId(languageId);
                            if (prevLanguageId !== languageId) {
                                tokensArr.push(i);
                                tokensArr.push((encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */));
                            }
                            prevLanguageId = languageId;
                        }
                        const tokens = new Uint32Array(tokensArr.length);
                        for (let i = 0; i < tokens.length; i++) {
                            tokens[i] = tokensArr[i];
                        }
                        return new languages_1.EncodedTokenizationResult(tokens, state);
                    }
                }));
            }
        };
        OuterMode = __decorate([
            __param(0, language_1.ILanguageService),
            __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
        ], OuterMode);
        let InnerMode = class InnerMode extends lifecycle_1.Disposable {
            constructor(languageService, languageConfigurationService) {
                super();
                this.languageId = INNER_LANGUAGE_ID;
                this._register(languageService.registerLanguage({ id: this.languageId }));
                this._register(languageConfigurationService.register(this.languageId, {}));
            }
        };
        InnerMode = __decorate([
            __param(0, language_1.ILanguageService),
            __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
        ], InnerMode);
        let disposables = [];
        setup(() => {
            disposables = [];
        });
        teardown(() => {
            (0, lifecycle_1.dispose)(disposables);
            disposables = [];
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Get word at position', () => {
            const text = ['This text has some  words. '];
            const thisModel = (0, testTextModel_1.createTextModel)(text.join('\n'));
            disposables.push(thisModel);
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 1)), { word: 'This', startColumn: 1, endColumn: 5 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 2)), { word: 'This', startColumn: 1, endColumn: 5 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 4)), { word: 'This', startColumn: 1, endColumn: 5 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 5)), { word: 'This', startColumn: 1, endColumn: 5 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 6)), { word: 'text', startColumn: 6, endColumn: 10 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 19)), { word: 'some', startColumn: 15, endColumn: 19 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 20)), null);
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 21)), { word: 'words', startColumn: 21, endColumn: 26 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 26)), { word: 'words', startColumn: 21, endColumn: 26 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 27)), null);
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 28)), null);
        });
        test('getWordAtPosition at embedded language boundaries', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            const outerMode = disposables.add(instantiationService.createInstance(OuterMode));
            disposables.add(instantiationService.createInstance(InnerMode));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'ab<xx>ab<x>', outerMode.languageId));
            assert.deepStrictEqual(model.getWordAtPosition(new position_1.Position(1, 1)), { word: 'ab', startColumn: 1, endColumn: 3 });
            assert.deepStrictEqual(model.getWordAtPosition(new position_1.Position(1, 2)), { word: 'ab', startColumn: 1, endColumn: 3 });
            assert.deepStrictEqual(model.getWordAtPosition(new position_1.Position(1, 3)), { word: 'ab', startColumn: 1, endColumn: 3 });
            assert.deepStrictEqual(model.getWordAtPosition(new position_1.Position(1, 4)), { word: 'xx', startColumn: 4, endColumn: 6 });
            assert.deepStrictEqual(model.getWordAtPosition(new position_1.Position(1, 5)), { word: 'xx', startColumn: 4, endColumn: 6 });
            assert.deepStrictEqual(model.getWordAtPosition(new position_1.Position(1, 6)), { word: 'xx', startColumn: 4, endColumn: 6 });
            assert.deepStrictEqual(model.getWordAtPosition(new position_1.Position(1, 7)), { word: 'ab', startColumn: 7, endColumn: 9 });
            disposables.dispose();
        });
        test('issue #61296: VS code freezes when editing CSS file with emoji', () => {
            const MODE_ID = 'testMode';
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const languageService = instantiationService.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({ id: MODE_ID }));
            disposables.add(languageConfigurationService.register(MODE_ID, {
                wordPattern: /(#?-?\d*\.\d\w*%?)|(::?[\w-]*(?=[^,{;]*[,{]))|(([@#.!])?[\w-?]+%?|[@#!.])/g
            }));
            const thisModel = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '.🐷-a-b', MODE_ID));
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 1)), { word: '.', startColumn: 1, endColumn: 2 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 2)), { word: '.', startColumn: 1, endColumn: 2 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 3)), null);
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 4)), { word: '-a-b', startColumn: 4, endColumn: 8 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 5)), { word: '-a-b', startColumn: 4, endColumn: 8 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 6)), { word: '-a-b', startColumn: 4, endColumn: 8 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 7)), { word: '-a-b', startColumn: 4, endColumn: 8 });
            assert.deepStrictEqual(thisModel.getWordAtPosition(new position_1.Position(1, 8)), { word: '-a-b', startColumn: 4, endColumn: 8 });
            disposables.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVsL21vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFpQmhHLGtCQUFrQjtJQUVsQixNQUFNLEtBQUssR0FBRyxlQUFlLENBQUM7SUFDOUIsTUFBTSxLQUFLLEdBQUcsb0JBQW9CLENBQUM7SUFDbkMsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUM7SUFDL0IsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQztJQUVsQixLQUFLLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1FBRWxDLElBQUksU0FBb0IsQ0FBQztRQUV6QixLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsTUFBTSxJQUFJLEdBQ1QsS0FBSyxHQUFHLE1BQU07Z0JBQ2QsS0FBSyxHQUFHLElBQUk7Z0JBQ1osS0FBSyxHQUFHLElBQUk7Z0JBQ1osS0FBSyxHQUFHLE1BQU07Z0JBQ2QsS0FBSyxDQUFDO1lBQ1AsU0FBUyxHQUFHLElBQUEsK0JBQWUsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsd0JBQXdCO1FBRXhCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7WUFDM0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsd0RBQXdELENBQUMsQ0FBQztRQUNwRyxDQUFDLENBQUMsQ0FBQztRQUVI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