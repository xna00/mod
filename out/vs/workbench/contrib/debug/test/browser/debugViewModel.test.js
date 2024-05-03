/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/log/common/log", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugSource", "vs/workbench/contrib/debug/common/debugViewModel", "vs/workbench/contrib/debug/test/browser/mockDebugModel", "vs/workbench/contrib/debug/test/common/mockDebug"], function (require, exports, assert, utils_1, mockKeybindingService_1, log_1, debugModel_1, debugSource_1, debugViewModel_1, mockDebugModel_1, mockDebug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - View Model', () => {
        let model;
        setup(() => {
            model = new debugViewModel_1.ViewModel(new mockKeybindingService_1.MockContextKeyService());
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('focused stack frame', () => {
            assert.strictEqual(model.focusedStackFrame, undefined);
            assert.strictEqual(model.focusedThread, undefined);
            const session = new mockDebug_1.MockSession();
            const thread = new debugModel_1.Thread(session, 'myThread', 1);
            const source = new debugSource_1.Source({
                name: 'internalModule.js',
                sourceReference: 11,
                presentationHint: 'deemphasize'
            }, 'aDebugSessionId', mockDebugModel_1.mockUriIdentityService, new log_1.NullLogService());
            const frame = new debugModel_1.StackFrame(thread, 1, source, 'app.js', 'normal', { startColumn: 1, startLineNumber: 1, endColumn: 1, endLineNumber: 1 }, 0, true);
            model.setFocus(frame, thread, session, false);
            assert.strictEqual(model.focusedStackFrame.getId(), frame.getId());
            assert.strictEqual(model.focusedThread.threadId, 1);
            assert.strictEqual(model.focusedSession.getId(), session.getId());
        });
        test('selected expression', () => {
            assert.strictEqual(model.getSelectedExpression(), undefined);
            const expression = new debugModel_1.Expression('my expression');
            model.setSelectedExpression(expression, false);
            assert.strictEqual(model.getSelectedExpression()?.expression, expression);
        });
        test('multi session view and changed workbench state', () => {
            assert.strictEqual(model.isMultiSessionView(), false);
            model.setMultiSessionView(true);
            assert.strictEqual(model.isMultiSessionView(), true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdWaWV3TW9kZWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvdGVzdC9icm93c2VyL2RlYnVnVmlld01vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtRQUNoQyxJQUFJLEtBQWdCLENBQUM7UUFFckIsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLEtBQUssR0FBRyxJQUFJLDBCQUFTLENBQUMsSUFBSSw2Q0FBcUIsRUFBRSxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDbkQsTUFBTSxPQUFPLEdBQUcsSUFBSSx1QkFBVyxFQUFFLENBQUM7WUFDbEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxtQkFBTSxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBTSxDQUFDO2dCQUN6QixJQUFJLEVBQUUsbUJBQW1CO2dCQUN6QixlQUFlLEVBQUUsRUFBRTtnQkFDbkIsZ0JBQWdCLEVBQUUsYUFBYTthQUMvQixFQUFFLGlCQUFpQixFQUFFLHVDQUFzQixFQUFFLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUM7WUFDcEUsTUFBTSxLQUFLLEdBQUcsSUFBSSx1QkFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLGVBQWUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3JKLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsaUJBQWtCLENBQUMsS0FBSyxFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsYUFBYyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFlLENBQUMsS0FBSyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDcEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDN0QsTUFBTSxVQUFVLEdBQUcsSUFBSSx1QkFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ25ELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUUsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDM0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEQsS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9