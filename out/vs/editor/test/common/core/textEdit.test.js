/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/offsetRange", "vs/editor/common/core/textEdit", "vs/editor/test/common/core/random"], function (require, exports, assert, utils_1, offsetRange_1, textEdit_1, random_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextEdit', () => {
        suite('inverse', () => {
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
            function runTest(seed) {
                const rand = random_1.Random.create(seed);
                const source = new textEdit_1.StringText(rand.nextMultiLineString(10, new offsetRange_1.OffsetRange(0, 10)));
                const edit = rand.nextTextEdit(source, rand.nextIntRange(1, 5));
                const invEdit = edit.inverse(source);
                const s1 = edit.apply(source);
                const s2 = invEdit.applyToString(s1);
                assert.deepStrictEqual(s2, source.value);
            }
            test.skip('brute-force', () => {
                for (let i = 0; i < 100_000; i++) {
                    runTest(i);
                }
            });
            for (let seed = 0; seed < 20; seed++) {
                test(`test ${seed}`, () => runTest(seed));
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEVkaXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL2NvcmUvdGV4dEVkaXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxLQUFLLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtRQUN0QixLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUNyQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7WUFFMUMsU0FBUyxPQUFPLENBQUMsSUFBWTtnQkFDNUIsTUFBTSxJQUFJLEdBQUcsZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDakMsTUFBTSxNQUFNLEdBQUcsSUFBSSxxQkFBVSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsSUFBSSx5QkFBVyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXBGLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXJDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRXJDLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO2dCQUM3QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ2xDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzNDLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=