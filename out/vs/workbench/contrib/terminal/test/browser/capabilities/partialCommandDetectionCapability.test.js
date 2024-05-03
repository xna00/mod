/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/terminal/common/capabilities/partialCommandDetectionCapability", "vs/amdX", "vs/workbench/contrib/terminal/browser/terminalTestHelpers", "vs/base/test/common/utils"], function (require, exports, assert_1, partialCommandDetectionCapability_1, amdX_1, terminalTestHelpers_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('PartialCommandDetectionCapability', () => {
        let xterm;
        let capability;
        let addEvents;
        function assertCommands(expectedLines) {
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.line), expectedLines);
            (0, assert_1.deepStrictEqual)(addEvents.map(e => e.line), expectedLines);
        }
        setup(async () => {
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = new TerminalCtor({ allowProposedApi: true, cols: 80 });
            capability = new partialCommandDetectionCapability_1.PartialCommandDetectionCapability(xterm);
            addEvents = [];
            capability.onCommandFinished(e => addEvents.push(e));
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('should not add commands when the cursor position is too close to the left side', async () => {
            assertCommands([]);
            xterm._core._onData.fire('\x0d');
            await (0, terminalTestHelpers_1.writeP)(xterm, '\r\n');
            assertCommands([]);
            await (0, terminalTestHelpers_1.writeP)(xterm, 'a');
            xterm._core._onData.fire('\x0d');
            await (0, terminalTestHelpers_1.writeP)(xterm, '\r\n');
            assertCommands([]);
        });
        test('should add commands when the cursor position is not too close to the left side', async () => {
            assertCommands([]);
            await (0, terminalTestHelpers_1.writeP)(xterm, 'ab');
            xterm._core._onData.fire('\x0d');
            await (0, terminalTestHelpers_1.writeP)(xterm, '\r\n\r\n');
            assertCommands([0]);
            await (0, terminalTestHelpers_1.writeP)(xterm, 'cd');
            xterm._core._onData.fire('\x0d');
            await (0, terminalTestHelpers_1.writeP)(xterm, '\r\n');
            assertCommands([0, 2]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGlhbENvbW1hbmREZXRlY3Rpb25DYXBhYmlsaXR5LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL3Rlc3QvYnJvd3Nlci9jYXBhYmlsaXRpZXMvcGFydGlhbENvbW1hbmREZXRlY3Rpb25DYXBhYmlsaXR5LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFjaEcsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtRQUMvQyxJQUFJLEtBQW1CLENBQUM7UUFDeEIsSUFBSSxVQUE2QyxDQUFDO1FBQ2xELElBQUksU0FBb0IsQ0FBQztRQUV6QixTQUFTLGNBQWMsQ0FBQyxhQUF1QjtZQUM5QyxJQUFBLHdCQUFlLEVBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDckUsSUFBQSx3QkFBZSxFQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNoQixNQUFNLFlBQVksR0FBRyxDQUFDLE1BQU0sSUFBQSwwQkFBbUIsRUFBZ0MsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBRXpILEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBQyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQWlCLENBQUM7WUFDL0UsVUFBVSxHQUFHLElBQUkscUVBQWlDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUQsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNmLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsZ0ZBQWdGLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakcsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25CLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqQyxNQUFNLElBQUEsNEJBQU0sRUFBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDNUIsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6QixLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakMsTUFBTSxJQUFBLDRCQUFNLEVBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnRkFBZ0YsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqRyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbkIsTUFBTSxJQUFBLDRCQUFNLEVBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFCLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqQyxNQUFNLElBQUEsNEJBQU0sRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDaEMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixNQUFNLElBQUEsNEJBQU0sRUFBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDMUIsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sSUFBQSw0QkFBTSxFQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QixjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=