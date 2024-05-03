/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/viewModel/overviewZoneManager"], function (require, exports, assert, utils_1, overviewZoneManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor View - OverviewZoneManager', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('pixel ratio 1, dom height 600', () => {
            const LINE_COUNT = 50;
            const LINE_HEIGHT = 20;
            const manager = new overviewZoneManager_1.OverviewZoneManager((lineNumber) => LINE_HEIGHT * lineNumber);
            manager.setDOMWidth(30);
            manager.setDOMHeight(600);
            manager.setOuterHeight(LINE_COUNT * LINE_HEIGHT);
            manager.setLineHeight(LINE_HEIGHT);
            manager.setPixelRatio(1);
            manager.setZones([
                new overviewZoneManager_1.OverviewRulerZone(1, 1, 0, '1'),
                new overviewZoneManager_1.OverviewRulerZone(10, 10, 0, '2'),
                new overviewZoneManager_1.OverviewRulerZone(30, 31, 0, '3'),
                new overviewZoneManager_1.OverviewRulerZone(50, 50, 0, '4'),
            ]);
            // one line = 12, but cap is at 6
            assert.deepStrictEqual(manager.resolveColorZones(), [
                new overviewZoneManager_1.ColorZone(12, 24, 1), //
                new overviewZoneManager_1.ColorZone(120, 132, 2), // 120 -> 132
                new overviewZoneManager_1.ColorZone(360, 384, 3), // 360 -> 372 [360 -> 384]
                new overviewZoneManager_1.ColorZone(588, 600, 4), // 588 -> 600
            ]);
        });
        test('pixel ratio 1, dom height 300', () => {
            const LINE_COUNT = 50;
            const LINE_HEIGHT = 20;
            const manager = new overviewZoneManager_1.OverviewZoneManager((lineNumber) => LINE_HEIGHT * lineNumber);
            manager.setDOMWidth(30);
            manager.setDOMHeight(300);
            manager.setOuterHeight(LINE_COUNT * LINE_HEIGHT);
            manager.setLineHeight(LINE_HEIGHT);
            manager.setPixelRatio(1);
            manager.setZones([
                new overviewZoneManager_1.OverviewRulerZone(1, 1, 0, '1'),
                new overviewZoneManager_1.OverviewRulerZone(10, 10, 0, '2'),
                new overviewZoneManager_1.OverviewRulerZone(30, 31, 0, '3'),
                new overviewZoneManager_1.OverviewRulerZone(50, 50, 0, '4'),
            ]);
            // one line = 6, cap is at 6
            assert.deepStrictEqual(manager.resolveColorZones(), [
                new overviewZoneManager_1.ColorZone(6, 12, 1), //
                new overviewZoneManager_1.ColorZone(60, 66, 2), // 60 -> 66
                new overviewZoneManager_1.ColorZone(180, 192, 3), // 180 -> 192
                new overviewZoneManager_1.ColorZone(294, 300, 4), // 294 -> 300
            ]);
        });
        test('pixel ratio 2, dom height 300', () => {
            const LINE_COUNT = 50;
            const LINE_HEIGHT = 20;
            const manager = new overviewZoneManager_1.OverviewZoneManager((lineNumber) => LINE_HEIGHT * lineNumber);
            manager.setDOMWidth(30);
            manager.setDOMHeight(300);
            manager.setOuterHeight(LINE_COUNT * LINE_HEIGHT);
            manager.setLineHeight(LINE_HEIGHT);
            manager.setPixelRatio(2);
            manager.setZones([
                new overviewZoneManager_1.OverviewRulerZone(1, 1, 0, '1'),
                new overviewZoneManager_1.OverviewRulerZone(10, 10, 0, '2'),
                new overviewZoneManager_1.OverviewRulerZone(30, 31, 0, '3'),
                new overviewZoneManager_1.OverviewRulerZone(50, 50, 0, '4'),
            ]);
            // one line = 6, cap is at 12
            assert.deepStrictEqual(manager.resolveColorZones(), [
                new overviewZoneManager_1.ColorZone(12, 24, 1), //
                new overviewZoneManager_1.ColorZone(120, 132, 2), // 120 -> 132
                new overviewZoneManager_1.ColorZone(360, 384, 3), // 360 -> 384
                new overviewZoneManager_1.ColorZone(588, 600, 4), // 588 -> 600
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcnZpZXdab25lTWFuYWdlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vdmlldy9vdmVydmlld1pvbmVNYW5hZ2VyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtRQUUvQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtZQUMxQyxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDdEIsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sT0FBTyxHQUFHLElBQUkseUNBQW1CLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsQ0FBQztZQUNsRixPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUIsT0FBTyxDQUFDLGNBQWMsQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDLENBQUM7WUFDakQsT0FBTyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNuQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpCLE9BQU8sQ0FBQyxRQUFRLENBQUM7Z0JBQ2hCLElBQUksdUNBQWlCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDO2dCQUNuQyxJQUFJLHVDQUFpQixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQztnQkFDckMsSUFBSSx1Q0FBaUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENB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