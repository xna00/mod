/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/terminal/browser/xterm/lineDataEventAddon", "assert", "vs/amdX", "vs/workbench/contrib/terminal/browser/terminalTestHelpers", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, lineDataEventAddon_1, assert_1, amdX_1, terminalTestHelpers_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('LineDataEventAddon', () => {
        let xterm;
        let lineDataEventAddon;
        let store;
        setup(() => store = new lifecycle_1.DisposableStore());
        teardown(() => store.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('onLineData', () => {
            let events;
            setup(async () => {
                const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
                xterm = store.add(new TerminalCtor({ allowProposedApi: true, cols: 4 }));
                lineDataEventAddon = store.add(new lineDataEventAddon_1.LineDataEventAddon());
                xterm.loadAddon(lineDataEventAddon);
                events = [];
                store.add(lineDataEventAddon.onLineData(e => events.push(e)));
            });
            test('should fire when a non-wrapped line ends with a line feed', async () => {
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.deepStrictEqual)(events, []);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\n\r');
                (0, assert_1.deepStrictEqual)(events, ['foo']);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'bar');
                (0, assert_1.deepStrictEqual)(events, ['foo']);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\n');
                (0, assert_1.deepStrictEqual)(events, ['foo', 'bar']);
            });
            test('should not fire soft wrapped lines', async () => {
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo.');
                (0, assert_1.deepStrictEqual)(events, []);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'bar.');
                (0, assert_1.deepStrictEqual)(events, []);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'baz.');
                (0, assert_1.deepStrictEqual)(events, []);
            });
            test('should fire when a wrapped line ends with a line feed', async () => {
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo.bar.baz.');
                (0, assert_1.deepStrictEqual)(events, []);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\n\r');
                (0, assert_1.deepStrictEqual)(events, ['foo.bar.baz.']);
            });
            test('should not fire on cursor move when the backing process is not on Windows', async () => {
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo.\x1b[H');
                (0, assert_1.deepStrictEqual)(events, []);
            });
            test('should fire on cursor move when the backing process is on Windows', async () => {
                lineDataEventAddon.setOperatingSystem(1 /* OperatingSystem.Windows */);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo\x1b[H');
                (0, assert_1.deepStrictEqual)(events, ['foo']);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZURhdGFFdmVudEFkZG9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL3Rlc3QvYnJvd3Nlci94dGVybS9saW5lRGF0YUV2ZW50QWRkb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1FBQ2hDLElBQUksS0FBZSxDQUFDO1FBQ3BCLElBQUksa0JBQXNDLENBQUM7UUFFM0MsSUFBSSxLQUFzQixDQUFDO1FBQzNCLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztRQUMzQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDaEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3hCLElBQUksTUFBZ0IsQ0FBQztZQUVyQixLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ2hCLE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBTSxJQUFBLDBCQUFtQixFQUFnQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBQ3pILEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsRUFBRSxDQUFDLENBQUM7Z0JBQ3pELEtBQUssQ0FBQyxTQUFTLENBQUMsa0JB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