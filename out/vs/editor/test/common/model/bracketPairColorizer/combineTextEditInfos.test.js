/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/core/textEdit", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/beforeEditPositionMapper", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/combineTextEditInfos", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length", "vs/editor/test/common/core/random", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, range_1, textEdit_1, beforeEditPositionMapper_1, combineTextEditInfos_1, length_1, random_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRandomEditInfos = getRandomEditInfos;
    suite('combineTextEditInfos', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        for (let seed = 0; seed < 50; seed++) {
            test('test' + seed, () => {
                runTest(seed);
            });
        }
    });
    function runTest(seed) {
        const rng = random_1.Random.create(seed);
        const str = 'abcde\nfghij\nklmno\npqrst\n';
        const textModelS0 = (0, testTextModel_1.createTextModel)(str);
        const edits1 = getRandomEditInfos(textModelS0, rng.nextIntRange(1, 4), rng);
        const textModelS1 = (0, testTextModel_1.createTextModel)(textModelS0.getValue());
        textModelS1.applyEdits(edits1.map(e => toEdit(e)));
        const edits2 = getRandomEditInfos(textModelS1, rng.nextIntRange(1, 4), rng);
        const textModelS2 = (0, testTextModel_1.createTextModel)(textModelS1.getValue());
        textModelS2.applyEdits(edits2.map(e => toEdit(e)));
        const combinedEdits = (0, combineTextEditInfos_1.combineTextEditInfos)(edits1, edits2);
        for (const edit of combinedEdits) {
            const range = range_1.Range.fromPositions((0, length_1.lengthToPosition)(edit.startOffset), (0, length_1.lengthToPosition)((0, length_1.lengthAdd)(edit.startOffset, edit.newLength)));
            const value = textModelS2.getValueInRange(range);
            if (!value.match(/^(L|C|\n)*$/)) {
                throw new Error('Invalid edit: ' + value);
            }
            textModelS2.applyEdits([{
                    range,
                    text: textModelS0.getValueInRange(range_1.Range.fromPositions((0, length_1.lengthToPosition)(edit.startOffset), (0, length_1.lengthToPosition)(edit.endOffset))),
                }]);
        }
        assert.deepStrictEqual(textModelS2.getValue(), textModelS0.getValue());
        textModelS0.dispose();
        textModelS1.dispose();
        textModelS2.dispose();
    }
    function getRandomEditInfos(textModel, count, rng, disjoint = false) {
        const edits = [];
        let i = 0;
        for (let j = 0; j < count; j++) {
            edits.push(getRandomEdit(textModel, i, rng));
            i = textModel.getOffsetAt((0, length_1.lengthToPosition)(edits[j].endOffset)) + (disjoint ? 1 : 0);
        }
        return edits;
    }
    function getRandomEdit(textModel, rangeOffsetStart, rng) {
        const textModelLength = textModel.getValueLength();
        const offsetStart = rng.nextIntRange(rangeOffsetStart, textModelLength);
        const offsetEnd = rng.nextIntRange(offsetStart, textModelLength);
        const lineCount = rng.nextIntRange(0, 3);
        const columnCount = rng.nextIntRange(0, 5);
        return new beforeEditPositionMapper_1.TextEditInfo((0, length_1.positionToLength)(textModel.getPositionAt(offsetStart)), (0, length_1.positionToLength)(textModel.getPositionAt(offsetEnd)), (0, length_1.toLength)(lineCount, columnCount));
    }
    function toEdit(editInfo) {
        const l = (0, length_1.lengthToObj)(editInfo.newLength);
        let text = '';
        for (let i = 0; i < l.lineCount; i++) {
            text += 'LLL\n';
        }
        for (let i = 0; i < l.columnCount; i++) {
            text += 'C';
        }
        return new textEdit_1.SingleTextEdit(range_1.Range.fromPositions((0, length_1.lengthToPosition)(editInfo.startOffset), (0, length_1.lengthToPosition)(editInfo.endOffset)), text);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tYmluZVRleHRFZGl0SW5mb3MudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyQ29sb3JpemVyL2NvbWJpbmVUZXh0RWRpdEluZm9zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF5RGhHLGdEQVFDO0lBcERELEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7UUFDbEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksRUFBRSxHQUFHLEVBQUU7Z0JBQ3hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztJQUNGLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxPQUFPLENBQUMsSUFBWTtRQUM1QixNQUFNLEdBQUcsR0FBRyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWhDLE1BQU0sR0FBRyxHQUFHLDhCQUE4QixDQUFDO1FBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUEsK0JBQWUsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUV6QyxNQUFNLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDNUUsTUFBTSxXQUFXLEdBQUcsSUFBQSwrQkFBZSxFQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzVELFdBQVcsQ0FBQyxVQUFVLENBQUMs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