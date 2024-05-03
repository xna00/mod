/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "net", "vs/base/node/ports", "vs/base/test/common/utils", "vs/base/test/node/testUtils"], function (require, exports, assert, net, ports, utils_1, testUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('Ports', () => {
        (process.env['VSCODE_PID'] ? test.skip /* this test fails when run from within VS Code */ : test)('Finds a free port (no timeout)', function (done) {
            // get an initial freeport >= 7000
            ports.findFreePort(7000, 100, 300000).then(initialPort => {
                assert.ok(initialPort >= 7000);
                // create a server to block this port
                const server = net.createServer();
                server.listen(initialPort, undefined, undefined, () => {
                    // once listening, find another free port and assert that the port is different from the opened one
                    ports.findFreePort(7000, 50, 300000).then(freePort => {
                        assert.ok(freePort >= 7000 && freePort !== initialPort);
                        server.close();
                        done();
                    }, err => done(err));
                });
            }, err => done(err));
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3Qvbm9kZS9wb3J0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsSUFBQSxzQkFBVSxFQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7UUFDeEIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtEQUFrRCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxnQ0FBZ0MsRUFBRSxVQUFVLElBQUk7WUFFakosa0NBQWtDO1lBQ2xDLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQ3hELE1BQU0sQ0FBQyxFQUFFLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxDQUFDO2dCQUUvQixxQ0FBcUM7Z0JBQ3JDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUU7b0JBRXJELG1HQUFtRztvQkFDbkcsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTt3QkFDcEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLElBQUksSUFBSSxJQUFJLFFBQVEsS0FBSyxXQUFXLENBQUMsQ0FBQzt3QkFDeEQsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUVmLElBQUksRUFBRSxDQUFDO29CQUNSLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN0QixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=