/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/telemetry/common/telemetryIpc", "vs/platform/telemetry/node/1dsAppender"], function (require, exports, ipc_cp_1, telemetryIpc_1, _1dsAppender_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const appender = new _1dsAppender_1.OneDataSystemAppender(undefined, false, process.argv[2], JSON.parse(process.argv[3]), process.argv[4]);
    process.once('exit', () => appender.flush());
    const channel = new telemetryIpc_1.TelemetryAppenderChannel([appender]);
    const server = new ipc_cp_1.Server('telemetry');
    server.registerChannel('telemetryAppender', channel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5QXBwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9ub2RlL3RlbGVtZXRyeUFwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxNQUFNLFFBQVEsR0FBRyxJQUFJLG9DQUFxQixDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUgsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFFN0MsTUFBTSxPQUFPLEdBQUcsSUFBSSx1Q0FBd0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDekQsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdkMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxPQUFPLENBQUMsQ0FBQyJ9