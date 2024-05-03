/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/terminal/common/terminalRecorder"], function (require, exports, assert, utils_1, terminalRecorder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function eventsEqual(recorder, expected) {
        const actual = (await recorder.generateReplayEvent()).events;
        for (let i = 0; i < expected.length; i++) {
            assert.deepStrictEqual(actual[i], expected[i]);
        }
    }
    suite('TerminalRecorder', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('should record dimensions', async () => {
            const recorder = new terminalRecorder_1.TerminalRecorder(1, 2);
            await eventsEqual(recorder, [
                { cols: 1, rows: 2, data: '' }
            ]);
            recorder.handleData('a');
            recorder.handleResize(3, 4);
            await eventsEqual(recorder, [
                { cols: 1, rows: 2, data: 'a' },
                { cols: 3, rows: 4, data: '' }
            ]);
        });
        test('should ignore resize events without data', async () => {
            const recorder = new terminalRecorder_1.TerminalRecorder(1, 2);
            await eventsEqual(recorder, [
                { cols: 1, rows: 2, data: '' }
            ]);
            recorder.handleResize(3, 4);
            await eventsEqual(recorder, [
                { cols: 3, rows: 4, data: '' }
            ]);
        });
        test('should record data and combine it into the previous resize event', async () => {
            const recorder = new terminalRecorder_1.TerminalRecorder(1, 2);
            recorder.handleData('a');
            recorder.handleData('b');
            recorder.handleResize(3, 4);
            recorder.handleData('c');
            recorder.handleData('d');
            await eventsEqual(recorder, [
                { cols: 1, rows: 2, data: 'ab' },
                { cols: 3, rows: 4, data: 'cd' }
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxSZWNvcmRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC90ZXN0L2NvbW1vbi90ZXJtaW5hbFJlY29yZGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxVQUFVLFdBQVcsQ0FBQyxRQUEwQixFQUFFLFFBQXVCO1FBQzdFLE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxRQUFRLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUM3RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7SUFDRixDQUFDO0lBRUQsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUM5QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLDBCQUEwQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNDLE1BQU0sUUFBUSxHQUFHLElBQUksbUNBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sV0FBVyxDQUFDLFFBQVEsRUFBRTtnQkFDM0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTthQUM5QixDQUFDLENBQUM7WUFDSCxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3pCLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sV0FBVyxDQUFDLFFBQVEsRUFBRTtnQkFDM0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTtnQkFDL0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTthQUM5QixDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQywwQ0FBMEMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzRCxNQUFNLFFBQVEsR0FBRyxJQUFJLG1DQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLFdBQVcsQ0FBQyxRQUFRLEVBQUU7Z0JBQzNCLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUU7YUFDOUIsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUIsTUFBTSxXQUFXLENBQUMsUUFBUSxFQUFFO2dCQUMzQixFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFO2FBQzlCLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGtFQUFrRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25GLE1BQU0sUUFBUSxHQUFHLElBQUksbUNBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVDLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekIsUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QixRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QixRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3pCLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekIsTUFBTSxXQUFXLENBQUMsUUFBUSxFQUFFO2dCQUMzQixFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO2dCQUNoQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO2FBQ2hDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==