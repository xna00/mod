/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/test/common/model/editableTextModelTestUtils"], function (require, exports, utils_1, position_1, range_1, editableTextModelTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const GENERATE_TESTS = false;
    suite('EditorModel Auto Tests', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function editOp(startLineNumber, startColumn, endLineNumber, endColumn, text) {
            return {
                range: new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn),
                text: text.join('\n'),
                forceMoveMarkers: false
            };
        }
        test('auto1', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'ioe',
                '',
                'yjct',
                '',
                '',
            ], [
                editOp(1, 2, 1, 2, ['b', 'r', 'fq']),
                editOp(1, 4, 2, 1, ['', '']),
            ], [
                'ib',
                'r',
                'fqoe',
                '',
                'yjct',
                '',
                '',
            ]);
        });
        test('auto2', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'f',
                'littnhskrq',
                'utxvsizqnk',
                'lslqz',
                'jxn',
                'gmm',
            ], [
                editOp(1, 2, 1, 2, ['', 'o']),
                editOp(2, 4, 2, 4, ['zaq', 'avb']),
                editOp(2, 5, 6, 2, ['jlr', 'zl', 'j']),
            ], [
                'f',
                'o',
                'litzaq',
                'avbtjlr',
                'zl',
                'jmm',
            ]);
        });
        test('auto3', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'ofw',
                'qsxmziuvzw',
                'rp',
                'qsnymek',
                'elth',
                'wmgzbwudxz',
                'iwsdkndh',
                'bujlbwb',
                'asuouxfv',
                'xuccnb',
            ], [
                editOp(4, 3, 4, 3, ['']),
            ], [
                'ofw',
                'qsxmziuvzw',
                'rp',
                'qsnymek',
                'elth',
                'wmgzbwudxz',
                'iwsdkndh',
                'bujlbwb',
                'asuouxfv',
                'xuccnb',
            ]);
        });
        test('auto4', () => {
            (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)([
                'fefymj',
                'qum',
                'vmiwxxaiqq',
                'dz',
                'lnqdgorosf',
            ], [
                editOp(1, 3, 1, 5, ['hp']),
                editOp(1, 7, 2, 1, ['kcg', '', 'mpx']),
                editOp(2, 2, 2, 2, ['', 'aw', '']),
                editOp(2, 2, 2, 2, ['vqr', 'mo']),
                editOp(4, 2, 5, 3, ['xyc']),
            ], [
                'fehpmjkcg',
                '',
                'mpxq',
                'aw',
                'vqr',
                'moum',
                'vmiwxxaiqq',
                'dxycqdgorosf',
            ]);
        });
    });
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function getRandomString(minLength, maxLength) {
        const length = getRandomInt(minLength, maxLength);
        let r = '';
        for (let i = 0; i < length; i++) {
            r += String.fromCharCode(getRandomInt(97 /* CharCode.a */, 122 /* CharCode.z */));
        }
        return r;
    }
    function generateFile(small) {
        const lineCount = getRandomInt(1, small ? 3 : 10);
        const lines = [];
        for (let i = 0; i < lineCount; i++) {
            lines.push(getRandomString(0, small ? 3 : 10));
        }
        return lines.join('\n');
    }
    function generateEdits(content) {
        const result = [];
        let cnt = getRandomInt(1, 5);
        let maxOffset = content.length;
        while (cnt > 0 && maxOffset > 0) {
            const offset = getRandomInt(0, maxOffset);
            const length = getRandomInt(0, maxOffset - offset);
            const text = generateFile(true);
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
    class TestModel {
        static _generateOffsetToPosition(content) {
            const result = [];
            let lineNumber = 1;
            let column = 1;
            for (let offset = 0, len = content.length; offset <= len; offset++) {
                const ch = content.charAt(offset);
                result[offset] = new position_1.Position(lineNumber, column);
                if (ch === '\n') {
                    lineNumber++;
                    column = 1;
                }
                else {
                    column++;
                }
            }
            return result;
        }
        constructor() {
            this.initialContent = generateFile(false);
            const edits = generateEdits(this.initialContent);
            const offsetToPosition = TestModel._generateOffsetToPosition(this.initialContent);
            this.edits = [];
            for (const edit of edits) {
                const startPosition = offsetToPosition[edit.offset];
                const endPosition = offsetToPosition[edit.offset + edit.length];
                this.edits.push({
                    range: new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column),
                    text: edit.text
                });
            }
            this.resultingContent = this.initialContent;
            for (let i = edits.length - 1; i >= 0; i--) {
                this.resultingContent = (this.resultingContent.substring(0, edits[i].offset) +
                    edits[i].text +
                    this.resultingContent.substring(edits[i].offset + edits[i].length));
            }
        }
        print() {
            let r = [];
            r.push('testApplyEditsWithSyncedModels(');
            r.push('\t[');
            const initialLines = this.initialContent.split('\n');
            r = r.concat(initialLines.map((i) => `\t\t'${i}',`));
            r.push('\t],');
            r.push('\t[');
            r = r.concat(this.edits.map((i) => {
                const text = `['` + i.text.split('\n').join(`', '`) + `']`;
                return `\t\teditOp(${i.range.startLineNumber}, ${i.range.startColumn}, ${i.range.endLineNumber}, ${i.range.endColumn}, ${text}),`;
            }));
            r.push('\t],');
            r.push('\t[');
            const resultLines = this.resultingContent.split('\n');
            r = r.concat(resultLines.map((i) => `\t\t'${i}',`));
            r.push('\t]');
            r.push(');');
            return r.join('\n');
        }
    }
    if (GENERATE_TESTS) {
        let number = 1;
        while (true) {
            console.log('------BEGIN NEW TEST: ' + number);
            const testModel = new TestModel();
            // console.log(testModel.print());
            console.log('------END NEW TEST: ' + (number++));
            try {
                (0, editableTextModelTestUtils_1.testApplyEditsWithSyncedModels)(testModel.initialContent.split('\n'), testModel.edits, testModel.resultingContent.split('\n'));
                // throw new Error('a');
            }
            catch (err) {
                console.log(err);
                console.log(testModel.print());
                break;
            }
            // break;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdGFibGVUZXh0TW9kZWxBdXRvLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2RlbC9lZGl0YWJsZVRleHRNb2RlbEF1dG8udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFFN0IsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtRQUVwQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxNQUFNLENBQUMsZUFBdUIsRUFBRSxXQUFtQixFQUFFLGFBQXFCLEVBQUUsU0FBaUIsRUFBRSxJQUFjO1lBQ3JILE9BQU87Z0JBQ04sS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLGVBQWUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLFNBQVMsQ0FBQztnQkFDeEUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUNyQixnQkFBZ0IsRUFBRSxLQUFLO2FBQ3ZCLENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDbEIsSUFBQSwyREFBOEIsRUFDN0I7Z0JBQ0MsS0FBSztnQkFDTCxFQUFFO2dCQUNGLE1BQU07Z0JBQ04sRUFBRTtnQkFDRixFQUFFO2FBQ0YsRUFDRDtnQkFDQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUM1QixFQUNEO2dCQUND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