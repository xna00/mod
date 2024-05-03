/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/scrollbar/scrollbarState"], function (require, exports, assert, scrollbarState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ScrollbarState', () => {
        test('inflates slider size', () => {
            const actual = new scrollbarState_1.ScrollbarState(0, 14, 0, 339, 42423, 32787);
            assert.strictEqual(actual.getArrowSize(), 0);
            assert.strictEqual(actual.getScrollPosition(), 32787);
            assert.strictEqual(actual.getRectangleLargeSize(), 339);
            assert.strictEqual(actual.getRectangleSmallSize(), 14);
            assert.strictEqual(actual.isNeeded(), true);
            assert.strictEqual(actual.getSliderSize(), 20);
            assert.strictEqual(actual.getSliderPosition(), 249);
            assert.strictEqual(actual.getDesiredScrollPositionFromOffset(259), 32849);
            // 259 is greater than 230 so page down, 32787 + 339 =  33126
            assert.strictEqual(actual.getDesiredScrollPositionFromOffsetPaged(259), 33126);
            actual.setScrollPosition(32849);
            assert.strictEqual(actual.getArrowSize(), 0);
            assert.strictEqual(actual.getScrollPosition(), 32849);
            assert.strictEqual(actual.getRectangleLargeSize(), 339);
            assert.strictEqual(actual.getRectangleSmallSize(), 14);
            assert.strictEqual(actual.isNeeded(), true);
            assert.strictEqual(actual.getSliderSize(), 20);
            assert.strictEqual(actual.getSliderPosition(), 249);
        });
        test('inflates slider size with arrows', () => {
            const actual = new scrollbarState_1.ScrollbarState(12, 14, 0, 339, 42423, 32787);
            assert.strictEqual(actual.getArrowSize(), 12);
            assert.strictEqual(actual.getScrollPosition(), 32787);
            assert.strictEqual(actual.getRectangleLargeSize(), 339);
            assert.strictEqual(actual.getRectangleSmallSize(), 14);
            assert.strictEqual(actual.isNeeded(), true);
            assert.strictEqual(actual.getSliderSize(), 20);
            assert.strictEqual(actual.getSliderPosition(), 230);
            assert.strictEqual(actual.getDesiredScrollPositionFromOffset(240 + 12), 32811);
            // 240 + 12 = 252; greater than 230 so page down, 32787 + 339 =  33126
            assert.strictEqual(actual.getDesiredScrollPositionFromOffsetPaged(240 + 12), 33126);
            actual.setScrollPosition(32811);
            assert.strictEqual(actual.getArrowSize(), 12);
            assert.strictEqual(actual.getScrollPosition(), 32811);
            assert.strictEqual(actual.getRectangleLargeSize(), 339);
            assert.strictEqual(actual.getRectangleSmallSize(), 14);
            assert.strictEqual(actual.isNeeded(), true);
            assert.strictEqual(actual.getSliderSize(), 20);
            assert.strictEqual(actual.getSliderPosition(), 230);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYmFyU3RhdGUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2Jyb3dzZXIvdWkvc2Nyb2xsYmFyL3Njcm9sbGJhclN0YXRlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM1QixJQUFJLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1lBQ2pDLE1BQU0sTUFBTSxHQUFHLElBQUksK0JBQWMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRS9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMscUJBQXFCLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFcEQsTUFBTSxDQUFDLFdBQVcsQ0FB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