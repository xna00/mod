/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestAccessibilityService = void 0;
    class TestAccessibilityService {
        constructor() {
            this.onDidChangeScreenReaderOptimized = event_1.Event.None;
            this.onDidChangeReducedMotion = event_1.Event.None;
        }
        isScreenReaderOptimized() { return false; }
        isMotionReduced() { return false; }
        alwaysUnderlineAccessKeys() { return Promise.resolve(false); }
        setAccessibilitySupport(accessibilitySupport) { }
        getAccessibilitySupport() { return 0 /* AccessibilitySupport.Unknown */; }
        alert(message) { }
        status(message) { }
    }
    exports.TestAccessibilityService = TestAccessibilityService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEFjY2Vzc2liaWxpdHlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hY2Nlc3NpYmlsaXR5L3Rlc3QvY29tbW9uL3Rlc3RBY2Nlc3NpYmlsaXR5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsTUFBYSx3QkFBd0I7UUFBckM7WUFJQyxxQ0FBZ0MsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzlDLDZCQUF3QixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7UUFTdkMsQ0FBQztRQVBBLHVCQUF1QixLQUFjLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNwRCxlQUFlLEtBQWMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzVDLHlCQUF5QixLQUF1QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLHVCQUF1QixDQUFDLG9CQUEwQyxJQUFVLENBQUM7UUFDN0UsdUJBQXVCLEtBQTJCLDRDQUFvQyxDQUFDLENBQUM7UUFDeEYsS0FBSyxDQUFDLE9BQWUsSUFBVSxDQUFDO1FBQ2hDLE1BQU0sQ0FBQyxPQUFlLElBQVUsQ0FBQztLQUNqQztJQWRELDREQWNDIn0=