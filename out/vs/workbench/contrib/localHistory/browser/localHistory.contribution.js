/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/contributions", "vs/workbench/contrib/localHistory/browser/localHistoryTimeline", "vs/workbench/contrib/localHistory/browser/localHistoryCommands"], function (require, exports, contributions_1, localHistoryTimeline_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register Local History Timeline
    (0, contributions_1.registerWorkbenchContribution2)(localHistoryTimeline_1.LocalHistoryTimeline.ID, localHistoryTimeline_1.LocalHistoryTimeline, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxIaXN0b3J5LmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbG9jYWxIaXN0b3J5L2Jyb3dzZXIvbG9jYWxIaXN0b3J5LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxrQ0FBa0M7SUFDbEMsSUFBQSw4Q0FBOEIsRUFBQywyQ0FBb0IsQ0FBQyxFQUFFLEVBQUUsMkNBQW9CLHNDQUF1RCxDQUFDIn0=