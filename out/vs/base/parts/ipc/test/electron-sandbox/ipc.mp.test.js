/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/parts/ipc/browser/ipc.mp", "vs/base/test/common/utils"], function (require, exports, assert, ipc_mp_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('IPC, MessagePorts', () => {
        test('message port close event', async () => {
            const { port1, port2 } = new MessageChannel();
            const client1 = new ipc_mp_1.Client(port1, 'client1');
            const client2 = new ipc_mp_1.Client(port2, 'client2');
            // This test ensures that Electron's API for the close event
            // does not break because we rely on it to dispose client
            // connections from the server.
            //
            // This event is not provided by browser MessagePort API though.
            const whenClosed = new Promise(resolve => port1.addEventListener('close', () => resolve(true)));
            client2.dispose();
            assert.ok(await whenClosed);
            client1.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm1wLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvaXBjL3Rlc3QvZWxlY3Ryb24tc2FuZGJveC9pcGMubXAudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBRS9CLElBQUksQ0FBQywwQkFBMEIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7WUFFOUMsTUFBTSxPQUFPLEdBQUcsSUFBSSxlQUFpQixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN4RCxNQUFNLE9BQU8sR0FBRyxJQUFJLGVBQWlCLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXhELDREQUE0RDtZQUM1RCx5REFBeUQ7WUFDekQsK0JBQStCO1lBQy9CLEVBQUU7WUFDRixnRUFBZ0U7WUFDaEUsTUFBTSxVQUFVLEdBQUcsSUFBSSxPQUFPLENBQVUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWxCLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxVQUFVLENBQUMsQ0FBQztZQUU1QixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUMifQ==