/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/mime", "vs/base/test/common/utils"], function (require, exports, assert, mime_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Mime', () => {
        test('normalize', () => {
            assert.strictEqual((0, mime_1.normalizeMimeType)('invalid'), 'invalid');
            assert.strictEqual((0, mime_1.normalizeMimeType)('invalid', true), undefined);
            assert.strictEqual((0, mime_1.normalizeMimeType)('Text/plain'), 'text/plain');
            assert.strictEqual((0, mime_1.normalizeMimeType)('Text/pläin'), 'text/pläin');
            assert.strictEqual((0, mime_1.normalizeMimeType)('Text/plain;UPPER'), 'text/plain;UPPER');
            assert.strictEqual((0, mime_1.normalizeMimeType)('Text/plain;lower'), 'text/plain;lower');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWltZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL21pbWUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtRQUVsQixJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtZQUN0QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQWlCLEVBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFpQixFQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsd0JBQWlCLEVBQUMsWUFBWSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFpQixFQUFDLFlBQVksQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx3QkFBaUIsRUFBQyxrQkFBa0IsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDOUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHdCQUFpQixFQUFDLGtCQUFrQixDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUMvRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9