/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/textChange"], function (require, exports, assert, utils_1, textChange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const GENERATE_TESTS = false;
    suite('TextChangeCompressor', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function getResultingContent(initialContent, edits) {
            let content = initialContent;
            for (let i = edits.length - 1; i >= 0; i--) {
                content = (content.substring(0, edits[i].offset) +
                    edits[i].text +
                    content.substring(edits[i].offset + edits[i].length));
            }
            return content;
        }
        function getTextChanges(initialContent, edits) {
            let content = initialContent;
            const changes = new Array(edits.length);
            let deltaOffset = 0;
            for (let i = 0; i < edits.length; i++) {
                const edit = edits[i];
                const position = edit.offset + deltaOffset;
                const length = edit.length;
                const text = edit.text;
                const oldText = content.substr(position, length);
                content = (content.substr(0, position) +
                    text +
                    content.substr(position + length));
                changes[i] = new textChange_1.TextChange(edit.offset, oldText, position, text);
                deltaOffset += text.length - length;
            }
            return changes;
        }
        function assertCompression(initialText, edit1, edit2) {
            const tmpText = getResultingContent(initialText, edit1);
            const chg1 = getTextChanges(initialText, edit1);
            const finalText = getResultingContent(tmpText, edit2);
            const chg2 = getTextChanges(tmpText, edit2);
            const compressedTextChanges = (0, textChange_1.compressConsecutiveTextChanges)(chg1, chg2);
            // Check that the compression was correct
            const compressedDoTextEdits = compressedTextChanges.map((change) => {
                return {
                    offset: change.oldPosition,
                    length: change.oldLength,
                    text: change.newText
                };
            });
            const actualDoResult = getResultingContent(initialText, compressedDoTextEdits);
            assert.strictEqual(actualDoResult, finalText);
            const compressedUndoTextEdits = compressedTextChanges.map((change) => {
                return {
                    offset: change.newPosition,
                    length: change.newLength,
                    text: change.oldText
                };
            });
            const actualUndoResult = getResultingContent(finalText, compressedUndoTextEdits);
            assert.strictEqual(actualUndoResult, initialText);
        }
        test('simple 1', () => {
            assertCompression('', [{ offset: 0, length: 0, text: 'h' }], [{ offset: 1, length: 0, text: 'e' }]);
        });
        test('simple 2', () => {
            assertCompression('|', [{ offset: 0, length: 0, text: 'h' }], [{ offset: 2, length: 0, text: 'e' }]);
        });
        test('complex1', () => {
            assertCompression('abcdefghij', [
                { offset: 0, length: 3, text: 'qh' },
                { offset: 5, length: 0, text: '1' },
                { offset: 8, length: 2, text: 'X' }
            ], [
                { offset: 1, length: 0, text: 'Z' },
                { offset: 3, length: 3, text: 'Y' },
            ]);
        });
        // test('issue #118041', () => {
        // 	assertCompression(
        // 		'﻿',
        // 		[
        // 			{ offset: 0, length: 1, text: '' },
        // 		],
        // 		[
        // 			{ offset: 1, length: 0, text: 'Z' },
        // 			{ offset: 3, length: 3, text: 'Y' },
        // 		]
        // 	);
        // })
        test('gen1', () => {
            assertCompression('kxm', [{ offset: 0, length: 1, text: 'tod_neu' }], [{ offset: 1, length: 2, text: 'sag_e' }]);
        });
        test('gen2', () => {
            assertCompression('kpb_r_v', [{ offset: 5, length: 2, text: 'a_jvf_l' }], [{ offset: 10, length: 2, text: 'w' }]);
        });
        test('gen3', () => {
            assertCompression('slu_w', [{ offset: 4, length: 1, text: '_wfw' }], [{ offset: 3, length: 5, text: '' }]);
        });
        test('gen4', () => {
            assertCompression('_e', [{ offset: 2, length: 0, text: 'zo_b' }], [{ offset: 1, length: 3, text: 'tra' }]);
        });
        test('gen5', () => {
            assertCompression('ssn_', [{ offset: 0, length: 2, text: 'tat_nwe' }], [{ offset: 2, length: 6, text: 'jm' }]);
        });
        test('gen6', () => {
            assertCompression('kl_nru', [{ offset: 4, length: 1, text: '' }], [{ offset: 1, length: 4, text: '__ut' }]);
        });
        const _a = 'a'.charCodeAt(0);
        const _z = 'z'.charCodeAt(0);
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        function getRandomString(minLength, maxLength) {
            const length = getRandomInt(minLength, maxLength);
            let r = '';
            for (let i = 0; i < length; i++) {
                r += String.fromCharCode(getRandomInt(_a, _z));
            }
            return r;
        }
        function getRandomEOL() {
            switch (getRandomInt(1, 3)) {
                case 1: return '\r';
                case 2: return '\n';
                case 3: return '\r\n';
            }
            throw new Error(`not possible`);
        }
        function getRandomBuffer(small) {
            const lineCount = getRandomInt(1, small ? 3 : 10);
            const lines = [];
            for (let i = 0; i < lineCount; i++) {
                lines.push(getRandomString(0, small ? 3 : 10) + getRandomEOL());
            }
            return lines.join('');
        }
        function getRandomEdits(content, min = 1, max = 5) {
            const result = [];
            let cnt = getRandomInt(min, max);
            let maxOffset = content.length;
            while (cnt > 0 && maxOffset > 0) {
                const offset = getRandomInt(0, maxOffset);
                const length = getRandomInt(0, maxOffset - offset);
                const text = getRandomBuffer(true);
                result.push({
                    offset: offset,
                    length: length,
                    text: text
                });
                maxOffset = offset;
                cnt--;
            }
            result.reverse();
            return result;
        }
        class GeneratedTest {
            constructor() {
                this._content = getRandomBuffer(false).replace(/\n/g, '_');
                this._edits1 = getRandomEdits(this._content, 1, 5).map((e) => { return { offset: e.offset, length: e.length, text: e.text.replace(/\n/g, '_') }; });
                const tmp = getResultingContent(this._content, this._edits1);
                this._edits2 = getRandomEdits(tmp, 1, 5).map((e) => { return { offset: e.offset, length: e.length, text: e.text.replace(/\n/g, '_') }; });
            }
            print() {
                console.log(`assertCompression(${JSON.stringify(this._content)}, ${JSON.stringify(this._edits1)}, ${JSON.stringify(this._edits2)});`);
            }
            assert() {
                assertCompression(this._content, this._edits1, this._edits2);
            }
        }
        if (GENERATE_TESTS) {
            let testNumber = 0;
            while (true) {
                testNumber++;
                console.log(`------RUNNING TextChangeCompressor TEST ${testNumber}`);
                const test = new GeneratedTest();
                try {
                    test.assert();
                }
                catch (err) {
                    console.log(err);
                    test.print();
                    break;
                }
            }
        }
    });
    suite('TextChange', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #118041: unicode character undo bug', () => {
            const textChange = new textChange_1.TextChange(428, '﻿', 428, '');
            const buff = new Uint8Array(textChange.writeSize());
            textChange.write(buff, 0);
            const actual = [];
            textChange_1.TextChange.read(buff, 0, actual);
            assert.deepStrictEqual(actual[0], textChange);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dENoYW5nZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZWwvdGV4dENoYW5nZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQztJQVE3QixLQUFLLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1FBRWxDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLG1CQUFtQixDQUFDLGNBQXNCLEVBQUUsS0FBdUI7WUFDM0UsSUFBSSxPQUFPLEdBQUcsY0FBYyxDQUFDO1lBQzdCLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM1QyxPQUFPLEdBQUcsQ0FDVCxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO29CQUNyQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtvQkFDYixPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUNwRCxDQUFDO1lBQ0gsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFRCxTQUFTLGNBQWMsQ0FBQyxjQUFzQixFQUFFLEtBQXVCO1lBQ3RFLElBQUksT0FBTyxHQUFHLGNBQWMsQ0FBQztZQUM3QixNQUFNLE9BQU8sR0FBaUIsSUFBSSxLQUFLLENBQWEsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xFLElBQUksV0FBVyxHQUFH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