/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/progressbar/progressbar", "vs/base/browser/window", "vs/base/test/common/utils"], function (require, exports, assert, progressbar_1, window_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ProgressBar', () => {
        let fixture;
        setup(() => {
            fixture = document.createElement('div');
            window_1.mainWindow.document.body.appendChild(fixture);
        });
        teardown(() => {
            window_1.mainWindow.document.body.removeChild(fixture);
        });
        test('Progress Bar', function () {
            const bar = new progressbar_1.ProgressBar(fixture);
            assert(bar.infinite());
            assert(bar.total(100));
            assert(bar.worked(50));
            assert(bar.setWorked(70));
            assert(bar.worked(30));
            assert(bar.done());
            bar.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NCYXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2Jyb3dzZXIvcHJvZ3Jlc3NCYXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtRQUN6QixJQUFJLE9BQW9CLENBQUM7UUFFekIsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hDLG1CQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsbUJBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDcEIsTUFBTSxHQUFHLEdBQUcsSUFBSSx5QkFBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN2QixNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxQixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVuQixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDZixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9