/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/model/textModel", "vs/editor/common/modelLineProjectionData"], function (require, exports, assert, utils_1, textModel_1, modelLineProjectionData_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor ViewModel - LineBreakData', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Basic', () => {
            const data = new modelLineProjectionData_1.ModelLineProjectionData([], [], [100], [0], 10);
            assert.strictEqual(data.translateToInputOffset(0, 50), 50);
            assert.strictEqual(data.translateToInputOffset(1, 60), 150);
        });
        function sequence(length, start = 0) {
            const result = new Array();
            for (let i = 0; i < length; i++) {
                result.push(i + start);
            }
            return result;
        }
        function testInverse(data) {
            for (let i = 0; i < 100; i++) {
                const output = data.translateToOutputPosition(i);
                assert.deepStrictEqual(data.translateToInputOffset(output.outputLineIndex, output.outputOffset), i);
            }
        }
        function getInputOffsets(data, outputLineIdx) {
            return sequence(20).map(i => data.translateToInputOffset(outputLineIdx, i));
        }
        function getOutputOffsets(data, affinity) {
            return sequence(25).map(i => data.translateToOutputPosition(i, affinity).toString());
        }
        function mapTextToInjectedTextOptions(arr) {
            return arr.map(e => textModel_1.ModelDecorationInjectedTextOptions.from({ content: e }));
        }
        suite('Injected Text 1', () => {
            const data = new modelLineProjectionData_1.ModelLineProjectionData([2, 3, 10], mapTextToInjectedTextOptions(['1', '22', '333']), [10, 100], [], 10);
            test('getInputOffsetOfOutputPosition', () => {
                // For every view model position, what is the model position?
                assert.deepStrictEqual(getInputOffsets(data, 0), ([0, 1, 2, 2, 3, 3, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11, 12, 13]));
                assert.deepStrictEqual(getInputOffsets(data, 1), ([7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 9, 10, 10, 10, 10, 11, 12, 13]));
            });
            test('getOutputPositionOfInputOffset', () => {
                data.translateToOutputPosition(20);
                assert.deepStrictEqual(getOutputOffsets(data, 2 /* PositionAffinity.None */), [
                    '0:0',
                    '0:1',
                    '0:2',
                    '0:4',
                    '0:7',
                    '0:8',
                    '0:9',
                    '1:10',
                    '1:11',
                    '1:12',
                    '1:13',
                    '1:17',
                    '1:18',
                    '1:19',
                    '1:20',
                    '1:21',
                    '1:22',
                    '1:23',
                    '1:24',
                    '1:25',
                    '1:26',
                    '1:27',
                    '1:28',
                    '1:29',
                    '1:30',
                ]);
                assert.deepStrictEqual(getOutputOffsets(data, 0 /* PositionAffinity.Left */), [
                    '0:0',
                    '0:1',
                    '0:2',
                    '0:4',
                    '0:7',
                    '0:8',
                    '0:9',
                    '0:10',
                    '1:11',
                    '1:12',
                    '1:13',
                    '1:17',
                    '1:18',
                    '1:19',
                    '1:20',
                    '1:21',
                    '1:22',
                    '1:23',
                    '1:24',
                    '1:25',
                    '1:26',
                    '1:27',
                    '1:28',
                    '1:29',
                    '1:30',
                ]);
                assert.deepStrictEqual(getOutputOffsets(data, 1 /* PositionAffinity.Right */), [
                    '0:0',
                    '0:1',
                    '0:3',
                    '0:6',
                    '0:7',
                    '0:8',
                    '0:9',
                    '1:10',
                    '1:11',
                    '1:12',
                    '1:16',
                    '1:17',
                    '1:18',
                    '1:19',
                    '1:20',
                    '1:21',
                    '1:22',
                    '1:23',
                    '1:24',
                    '1:25',
                    '1:26',
                    '1:27',
                    '1:28',
                    '1:29',
                    '1:30',
                ]);
            });
            test('getInputOffsetOfOutputPosition is inverse of getOutputPositionOfInputOffset', () => {
                testInverse(data);
            });
            test('normalization', () => {
                assert.deepStrictEqual(sequence(25)
                    .map((v) => data.normalizeOutputPosition(1, v, 1 /* PositionAffinity.Right */))
                    .map((s) => s.toString()), [
                    '1:0',
                    '1:1',
                    '1:2',
                    '1:3',
                    '1:4',
                    '1:5',
                    '1:6',
                    '1:7',
                    '1:8',
                    '1:9',
                    '1:10',
                    '1:11',
                    '1:12',
                    '1:16',
                    '1:16',
                    '1:16',
                    '1:16',
                    '1:17',
                    '1:18',
                    '1:19',
                    '1:20',
                    '1:21',
                    '1:22',
                    '1:23',
                    '1:24',
                ]);
            });
        });
        suite('Injected Text 2', () => {
            const data = new modelLineProjectionData_1.ModelLineProjectionData([2, 2, 6], mapTextToInjectedTextOptions(['1', '22', '333']), [10, 100], [], 0);
            test('getInputOffsetOfOutputPosition', () => {
                assert.deepStrictEqual(getInputOffsets(data, 0), [0, 1, 2, 2, 2, 2, 3, 4, 5, 6, 6, 6, 6, 7, 8, 9, 10, 11, 12, 13]);
                assert.deepStrictEqual(getInputOffsets(data, 1), [
                    6, 6, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
                    23,
                ]);
            });
            test('getInputOffsetOfOutputPosition is inverse of getOutputPositionOfInputOffset', () => {
                testInverse(data);
            });
        });
        suite('Injected Text 3', () => {
            const data = new modelLineProjectionData_1.ModelLineProjectionData([2, 2, 7], mapTextToInjectedTextOptions(['1', '22', '333']), [10, 100], [], 0);
            test('getInputOffsetOfOutputPosition', () => {
                assert.deepStrictEqual(getInputOffsets(data, 0), [0, 1, 2, 2, 2, 2, 3, 4, 5, 6, 7, 7, 7, 7, 8, 9, 10, 11, 12, 13]);
                assert.deepStrictEqual(getInputOffsets(data, 1), [
                    7, 7, 7, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
                    23,
                ]);
            });
            test('getInputOffsetOfOutputPosition is inverse of getOutputPositionOfInputOffset', () => {
                testInverse(data);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZUJyZWFrRGF0YS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vdmlld01vZGVsL2xpbmVCcmVha0RhdGEudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxLQUFLLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1FBRTlDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtZQUNsQixNQUFNLElBQUksR0FBRyxJQUFJLGlEQUF1QixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRWpFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDN0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxTQUFTLFFBQVEsQ0FBQyxNQUFjLEVBQUUsS0FBSyxHQUFHLENBQUM7WUFDMUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxLQUFLLEVBQVUsQ0FBQztZQUNuQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQ3hCLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFRCxTQUFT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