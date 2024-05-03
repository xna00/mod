/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/selection", "vs/editor/common/core/textChange", "vs/editor/common/model/editStack"], function (require, exports, assert, utils_1, selection_1, textChange_1, editStack_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditStack', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #118041: unicode character undo bug', () => {
            const stackData = new editStack_1.SingleModelEditStackData(1, 2, 0 /* EndOfLineSequence.LF */, 0 /* EndOfLineSequence.LF */, [new selection_1.Selection(10, 2, 10, 2)], [new selection_1.Selection(10, 1, 10, 1)], [new textChange_1.TextChange(428, '﻿', 428, '')]);
            const buff = stackData.serialize();
            const actual = editStack_1.SingleModelEditStackData.deserialize(buff);
            assert.deepStrictEqual(actual, stackData);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFN0YWNrLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2RlbC9lZGl0U3RhY2sudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxLQUFLLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUV2QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLDJDQUEyQyxFQUFFLEdBQUcsRUFBRTtZQUN0RCxNQUFNLFNBQVMsR0FBRyxJQUFJLG9DQUF3QixDQUM3QyxDQUFDLEVBQ0QsQ0FBQyw4REFHRCxDQUFDLElBQUkscUJBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUM3QixDQUFDLElBQUkscUJBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUM3QixDQUFDLElBQUksdUJBQVUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUNuQyxDQUFDO1lBRUYsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ25DLE1BQU0sTUFBTSxHQUFHLG9DQUF3QixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUxRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztJQUVKLENBQUMsQ0FBQyxDQUFDIn0=