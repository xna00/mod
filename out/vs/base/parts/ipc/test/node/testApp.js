/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/ipc/node/ipc.cp", "./testService"], function (require, exports, ipc_cp_1, testService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const server = new ipc_cp_1.Server('test');
    const service = new testService_1.TestService();
    server.registerChannel('test', new testService_1.TestChannel(service));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEFwcC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9pcGMvdGVzdC9ub2RlL3Rlc3RBcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbEMsTUFBTSxPQUFPLEdBQUcsSUFBSSx5QkFBVyxFQUFFLENBQUM7SUFDbEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsSUFBSSx5QkFBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMifQ==