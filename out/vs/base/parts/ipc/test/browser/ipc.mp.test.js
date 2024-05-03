/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/parts/ipc/browser/ipc.mp", "vs/base/test/common/utils"], function (require, exports, assert, ipc_mp_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('IPC, MessagePorts', () => {
        test('message passing', async () => {
            const { port1, port2 } = new MessageChannel();
            const client1 = new ipc_mp_1.Client(port1, 'client1');
            const client2 = new ipc_mp_1.Client(port2, 'client2');
            client1.registerChannel('client1', {
                call(_, command, arg, cancellationToken) {
                    switch (command) {
                        case 'testMethodClient1': return Promise.resolve('success1');
                        default: return Promise.reject(new Error('not implemented'));
                    }
                },
                listen(_, event, arg) {
                    switch (event) {
                        default: throw new Error('not implemented');
                    }
                }
            });
            client2.registerChannel('client2', {
                call(_, command, arg, cancellationToken) {
                    switch (command) {
                        case 'testMethodClient2': return Promise.resolve('success2');
                        default: return Promise.reject(new Error('not implemented'));
                    }
                },
                listen(_, event, arg) {
                    switch (event) {
                        default: throw new Error('not implemented');
                    }
                }
            });
            const channelClient1 = client2.getChannel('client1');
            assert.strictEqual(await channelClient1.call('testMethodClient1'), 'success1');
            const channelClient2 = client1.getChannel('client2');
            assert.strictEqual(await channelClient2.call('testMethodClient2'), 'success2');
            client1.dispose();
            client2.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm1wLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvaXBjL3Rlc3QvYnJvd3Nlci9pcGMubXAudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBRS9CLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNsQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7WUFFOUMsTUFBTSxPQUFPLEdBQUcsSUFBSSxlQUFpQixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN4RCxNQUFNLE9BQU8sR0FBRyxJQUFJLGVBQWlCLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXhELE9BQU8sQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFO2dCQUNsQyxJQUFJLENBQUMsQ0FBVSxFQUFFLE9BQWUsRUFBRSxHQUFRLEVBQUUsaUJBQW9DO29CQUMvRSxRQUFRLE9BQU8sRUFBRSxDQUFDO3dCQUNqQixLQUFLLG1CQUFtQixDQUFDLENBQUMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUM3RCxPQUFPLENBQUMsQ0FBQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO29CQUM5RCxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsTUFBTSxDQUFDLENBQVUsRUFBRSxLQUFhLEVBQUUsR0FBUztvQkFDMUMsUUFBUSxLQUFLLEVBQUUsQ0FBQzt3QkFDZixPQUFPLENBQUMsQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7b0JBQzdDLENBQUM7Z0JBQ0YsQ0FBQzthQUNELENBQUMsQ0FBQztZQUVILE9BQU8sQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFO2dCQUNsQyxJQUFJLENBQUMsQ0FBVSxFQUFFLE9BQWUsRUFBRSxHQUFRLEVBQUUsaUJBQW9DO29CQUMvRSxRQUFRLE9BQU8sRUFBRSxDQUFDO3dCQUNqQixLQUFLLG1CQUFtQixDQUFDLENBQUMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUM3RCxPQUFPLENBQUMsQ0FBQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO29CQUM5RCxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsTUFBTSxDQUFDLENBQVUsRUFBRSxLQUFhLEVBQUUsR0FBUztvQkFDMUMsUUFBUSxLQUFLLEVBQUUsQ0FBQzt3QkFDZixPQUFPLENBQUMsQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7b0JBQzdDLENBQUM7Z0JBQ0YsQ0FBQzthQUNELENBQUMsQ0FBQztZQUVILE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLGNBQWMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUUvRSxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxjQUFjLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFL0UsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2xCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9