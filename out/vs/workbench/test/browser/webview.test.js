/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/iframe", "vs/base/test/common/utils"], function (require, exports, assert, iframe_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('parentOriginHash', () => {
        test('localhost 1', async () => {
            const hash = await (0, iframe_1.parentOriginHash)('http://localhost:9888', '123456');
            assert.strictEqual(hash, '0fnsiac2jaup1t266qekgr7iuj4pnm31gf8r0h1o6k2lvvmfh6hk');
        });
        test('localhost 2', async () => {
            const hash = await (0, iframe_1.parentOriginHash)('http://localhost:9888', '123457');
            assert.strictEqual(hash, '07shf01bmdfrghk96voldpletbh36vj7blnl4td8kdq1sej5kjqs');
        });
        test('localhost 3', async () => {
            const hash = await (0, iframe_1.parentOriginHash)('http://localhost:9887', '123456');
            assert.strictEqual(hash, '1v1128i162q0nee9l89360sqan26u3pdnjrkke5ijd0sel8sbtqf');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlldy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9icm93c2VyL3dlYnZpZXcudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1FBRTlCLElBQUksQ0FBQyxhQUFhLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDOUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLHlCQUFnQixFQUFDLHVCQUF1QixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLHNEQUFzRCxDQUFDLENBQUM7UUFDbEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsYUFBYSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzlCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSx5QkFBZ0IsRUFBQyx1QkFBdUIsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxzREFBc0QsQ0FBQyxDQUFDO1FBQ2xGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGFBQWEsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM5QixNQUFNLElBQUksR0FBRyxNQUFNLElBQUEseUJBQWdCLEVBQUMsdUJBQXVCLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsc0RBQXNELENBQUMsQ0FBQztRQUNsRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9