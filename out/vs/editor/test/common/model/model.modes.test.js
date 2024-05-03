/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/languages/nullTokenize", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, editOperation_1, position_1, range_1, languages, nullTokenize_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --------- utils
    suite('Editor Model - Model Modes 1', () => {
        let calledFor = [];
        function getAndClear() {
            const result = calledFor;
            calledFor = [];
            return result;
        }
        const tokenizationSupport = {
            getInitialState: () => nullTokenize_1.NullState,
            tokenize: undefined,
            tokenizeEncoded: (line, hasEOL, state) => {
                calledFor.push(line.charAt(0));
                return new languages.EncodedTokenizationResult(new Uint32Array(0), state);
            }
        };
        let thisModel;
        let languageRegistration;
        setup(() => {
            const TEXT = '1\r\n' +
                '2\n' +
                '3\n' +
                '4\r\n' +
                '5';
            const LANGUAGE_ID = 'modelModeTest1';
            calledFor = [];
            languageRegistration = languages.TokenizationRegistry.register(LANGUAGE_ID, tokenizationSupport);
            thisModel = (0, testTextModel_1.createTextModel)(TEXT, LANGUAGE_ID);
        });
        teardown(() => {
            thisModel.dispose();
            languageRegistration.dispose();
            calledFor = [];
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('model calls syntax highlighter 1', () => {
            thisModel.tokenization.forceTokenization(1);
            assert.deepStrictEqual(getAndClear(), ['1']);
        });
        test('model calls syntax highlighter 2', () => {
            thisModel.tokenization.forceTokenization(2);
            assert.deepStrictEqual(getAndClear(), ['1', '2']);
            thisModel.tokenization.forceTokenization(2);
            assert.deepStrictEqual(getAndClear(), []);
        });
        test('model caches states', () => {
            thisModel.tokenization.forceTokenization(1);
            assert.deepStrictEqual(getAndClear(), ['1']);
            thisModel.tokenization.forceTokenization(2);
            assert.deepStrictEqual(getAndClear(), ['2']);
            thisModel.tokenization.forceTokenization(3);
            assert.deepStrictEqual(getAndClear(), ['3']);
            thisModel.tokenization.forceTokenization(4);
            assert.deepStrictEqual(getAndClear(), ['4']);
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['5']);
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), []);
        });
        test('model invalidates states for one line insert', () => {
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['1', '2', '3', '4', '5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), '-')]);
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['-']);
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), []);
        });
        test('model invalidates states for many lines insert', () => {
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['1', '2', '3', '4', '5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), '0\n-\n+')]);
            assert.strictEqual(thisModel.getLineCount(), 7);
            thisModel.tokenization.forceTokenization(7);
            assert.deepStrictEqual(getAndClear(), ['0', '-', '+']);
            thisModel.tokenization.forceTokenization(7);
            assert.deepStrictEqual(getAndClear(), []);
        });
        test('model invalidates states for one new line', () => {
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['1', '2', '3', '4', '5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 2), '\n')]);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(2, 1), 'a')]);
            thisModel.tokenization.forceTokenization(6);
            assert.deepStrictEqual(getAndClear(), ['1', 'a']);
        });
        test('model invalidates states for one line delete', () => {
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['1', '2', '3', '4', '5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 2), '-')]);
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['1']);
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 2))]);
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['-']);
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), []);
        });
        test('model invalidates states for many lines delete', () => {
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['1', '2', '3', '4', '5']);
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 3, 1))]);
            thisModel.tokenization.forceTokenization(3);
            assert.deepStrictEqual(getAndClear(), ['3']);
            thisModel.tokenization.forceTokenization(3);
            assert.deepStrictEqual(getAndClear(), []);
        });
    });
    suite('Editor Model - Model Modes 2', () => {
        class ModelState2 {
            constructor(prevLineContent) {
                this.prevLineContent = prevLineContent;
            }
            clone() {
                return new ModelState2(this.prevLineContent);
            }
            equals(other) {
                return (other instanceof ModelState2) && other.prevLineContent === this.prevLineContent;
            }
        }
        let calledFor = [];
        function getAndClear() {
            const actual = calledFor;
            calledFor = [];
            return actual;
        }
        const tokenizationSupport = {
            getInitialState: () => new ModelState2(''),
            tokenize: undefined,
            tokenizeEncoded: (line, hasEOL, state) => {
                calledFor.push(line);
                state.prevLineContent = line;
                return new languages.EncodedTokenizationResult(new Uint32Array(0), state);
            }
        };
        let thisModel;
        let languageRegistration;
        setup(() => {
            const TEXT = 'Line1' + '\r\n' +
                'Line2' + '\n' +
                'Line3' + '\n' +
                'Line4' + '\r\n' +
                'Line5';
            const LANGUAGE_ID = 'modelModeTest2';
            languageRegistration = languages.TokenizationRegistry.register(LANGUAGE_ID, tokenizationSupport);
            thisModel = (0, testTextModel_1.createTextModel)(TEXT, LANGUAGE_ID);
        });
        teardown(() => {
            thisModel.dispose();
            languageRegistration.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('getTokensForInvalidLines one text insert', () => {
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 6), '-')]);
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['Line1-', 'Line2']);
        });
        test('getTokensForInvalidLines two text insert', () => {
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([
                editOperation_1.EditOperation.insert(new position_1.Position(1, 6), '-'),
                editOperation_1.EditOperation.insert(new position_1.Position(3, 6), '-')
            ]);
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['Line1-', 'Line2', 'Line3-', 'Line4']);
        });
        test('getTokensForInvalidLines one multi-line text insert, one small text insert', () => {
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 6), '\nNew line\nAnother new line')]);
            thisModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(5, 6), '-')]);
            thisModel.tokenization.forceTokenization(7);
            assert.deepStrictEqual(getAndClear(), ['Line1', 'New line', 'Another new line', 'Line2', 'Line3-', 'Line4']);
        });
        test('getTokensForInvalidLines one delete text', () => {
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 1, 5))]);
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['1', 'Line2']);
        });
        test('getTokensForInvalidLines one line delete text', () => {
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 2, 1))]);
            thisModel.tokenization.forceTokenization(4);
            assert.deepStrictEqual(getAndClear(), ['Line2']);
        });
        test('getTokensForInvalidLines multiple lines delete text', () => {
            thisModel.tokenization.forceTokenization(5);
            assert.deepStrictEqual(getAndClear(), ['Line1', 'Line2', 'Line3', 'Line4', 'Line5']);
            thisModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(1, 1, 3, 3))]);
            thisModel.tokenization.forceTokenization(3);
            assert.deepStrictEqual(getAndClear(), ['ne3', 'Line4']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwubW9kZXMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVsL21vZGVsLm1vZGVzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsa0JBQWtCO0lBRWxCLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLEVBQUU7UUFFMUMsSUFBSSxTQUFTLEdBQWEsRUFBRSxDQUFDO1FBRTdCLFNBQVMsV0FBVztZQUNuQixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUM7WUFDekIsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNmLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU0sbUJBQW1CLEdBQW1DO1lBQzNELGVBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyx3QkFBUztZQUNoQyxRQUFRLEVBQUUsU0FBVTtZQUNwQixlQUFlLEVBQUUsQ0FBQyxJQUFZLEVBQUUsTUFBZSxFQUFFLEtBQXVCLEVBQXVDLEVBQUU7Z0JBQ2hILFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMvQixPQUFPLElBQUksU0FBUyxDQUFDLHlCQUF5QixDQUFDLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzNFLENBQUM7U0FDRCxDQUFDO1FBRUYsSUFBSSxTQUFvQixDQUFDO1FBQ3pCLElBQUksb0JBQWlDLENBQUM7UUFFdEMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLE1BQU0sSUFBSSxHQUNULE9BQU87Z0JBQ1AsS0FBSztnQkFDTCxLQUFLO2dCQUNMLE9BQU87Z0JBQ1AsR0FBRyxDQUFDO1lBQ0wsTUFBTSxXQUFXLEdBQUcsZ0JBQWdCLENBQUM7WUFDckMsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNmLG9CQUFvQixHQUFHLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDakcsU0FBUyxHQUFHLElBQUEsK0JBQWUsRUFBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQy9CLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLGtDQUFrQyxFQUFFLEdBQUcsRUFBRTtZQUM3QyxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzlDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtDQUFrQyxFQUFFLEdBQUcsRUFBRTtZQUM3QyxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVsRCxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1lBQ2hDLFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFN0MsU0FBUyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUU3QyxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRTdDLFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFN0MsU0FBUyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUU3QyxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBQ3pELFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRWpFLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RSxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRTdDLFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7WUFDM0QsU0FBUyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFakUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLDZCQUFhLENBQUMsTUFBTSxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hELFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUV2RCxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO1lBQ3RELFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRWpFLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2RSxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsNkJBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEUsU0FBUyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBQ3pELFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRWpFLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RSxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRTdDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRSxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRTdDLFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7WUFDM0QsU0FBUyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFakUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLDZCQUFhLENBQUMsTUFBTSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFN0MsU0FBUyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1FBRTFDLE1BQU0sV0FBVztZQUdoQixZQUFZLGVBQXVCO2dCQUNsQyxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztZQUN4QyxDQUFDO1lBRUQsS0FBSztnQkFDSixPQUFPLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBRUQsTUFBTSxDQUFDLEtBQXVCO2dCQUM3QixPQUFPLENBQUMsS0FBSyxZQUFZLFdBQVcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxlQUFlLEtBQUssSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUN6RixDQUFDO1NBQ0Q7UUFFRCxJQUFJLFNBQVMsR0FBYSxFQUFFLENBQUM7UUFFN0IsU0FBUyxXQUFXO1lBQ25CLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQztZQUN6QixTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQ2YsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQsTUFBTSxtQkFBbUIsR0FBbUM7WUFDM0QsZUFBZSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUMxQyxRQUFRLEVBQUUsU0FBVTtZQUNwQixlQUFlLEVBQUUsQ0FBQyxJQUFZLEVBQUUsTUFBZSxFQUFFLEtBQXVCLEVBQXVDLEVBQUU7Z0JBQ2hILFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ1AsS0FBTSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7Z0JBQzVDLE9BQU8sSUFBSSxTQUFTLENBQUMseUJBQXlCLENBQUMsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0UsQ0FBQztTQUNELENBQUM7UUFFRixJQUFJLFNBQW9CLENBQUM7UUFDekIsSUFBSSxvQkFBaUMsQ0FBQztRQUV0QyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsTUFBTSxJQUFJLEdBQ1QsT0FBTyxHQUFHLE1BQU07Z0JBQ2hCLE9BQU8sR0FBRyxJQUFJO2dCQUNkLE9BQU8sR0FBRyxJQUFJO2dCQUNkLE9BQU8sR0FBRyxNQUFNO2dCQUNoQixPQUFPLENBQUM7WUFDVCxNQUFNLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQztZQUNyQyxvQkFBb0IsR0FBRyxTQUFTLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2pHLFNBQVMsR0FBRyxJQUFBLCtCQUFlLEVBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsMENBQTBDLEVBQUUsR0FBRyxFQUFFO1lBQ3JELFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RSxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM1RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwQ0FBMEMsRUFBRSxHQUFHLEVBQUU7WUFDckQsU0FBUyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDckYsU0FBUyxDQUFDLFVBQVUsQ0FBQztnQkFDcEIsNkJBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUM7Z0JBQzdDLDZCQUFhLENBQUMsTUFBTSxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO2FBQzdDLENBQUMsQ0FBQztZQUVILFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNEVBQTRFLEVBQUUsR0FBRyxFQUFFO1lBQ3ZGLFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RSxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM5RyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwQ0FBMEMsRUFBRSxHQUFHLEVBQUU7WUFDckQsU0FBUyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDckYsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLDZCQUFhLENBQUMsTUFBTSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtDQUErQyxFQUFFLEdBQUcsRUFBRTtZQUMxRCxTQUFTLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNyRixTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsNkJBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEUsU0FBUyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxREFBcUQsRUFBRSxHQUFHLEVBQUU7WUFDaEUsU0FBUyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDckYsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLDZCQUFhLENBQUMsTUFBTSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLFNBQVMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==