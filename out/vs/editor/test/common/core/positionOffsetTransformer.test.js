/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/offsetRange", "vs/editor/common/core/positionToOffset"], function (require, exports, assert, utils_1, offsetRange_1, positionToOffset_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('PositionOffsetTransformer', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const str = '123456\nabcdef\nghijkl\nmnopqr';
        const t = new positionToOffset_1.PositionOffsetTransformer(str);
        test('getPosition', () => {
            assert.deepStrictEqual(new offsetRange_1.OffsetRange(0, str.length + 2).map(i => t.getPosition(i).toString()), [
                "(1,1)",
                "(1,2)",
                "(1,3)",
                "(1,4)",
                "(1,5)",
                "(1,6)",
                "(1,7)",
                "(2,1)",
                "(2,2)",
                "(2,3)",
                "(2,4)",
                "(2,5)",
                "(2,6)",
                "(2,7)",
                "(3,1)",
                "(3,2)",
                "(3,3)",
                "(3,4)",
                "(3,5)",
                "(3,6)",
                "(3,7)",
                "(4,1)",
                "(4,2)",
                "(4,3)",
                "(4,4)",
                "(4,5)",
                "(4,6)",
                "(4,7)",
                "(4,8)"
            ]);
        });
        test('getOffset', () => {
            for (let i = 0; i < str.length + 2; i++) {
                assert.strictEqual(t.getOffset(t.getPosition(i)), i);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zaXRpb25PZmZzZXRUcmFuc2Zvcm1lci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vY29yZS9wb3NpdGlvbk9mZnNldFRyYW5zZm9ybWVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtRQUN2QyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsTUFBTSxHQUFHLEdBQUcsZ0NBQWdDLENBQUM7UUFFN0MsTUFBTSxDQUFDLEdBQUcsSUFBSSw0Q0FBeUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtZQUN4QixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFJLHlCQUFXLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUN4RTtnQkFDQyxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87YUFDUCxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1lBQ3RCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RELENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=