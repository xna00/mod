/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/marshalling"], function (require, exports, uri_1, marshalling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteExtensionEnvironmentChannelClient = void 0;
    class RemoteExtensionEnvironmentChannelClient {
        static async getEnvironmentData(channel, remoteAuthority, profile) {
            const args = {
                remoteAuthority,
                profile
            };
            const data = await channel.call('getEnvironmentData', args);
            return {
                pid: data.pid,
                connectionToken: data.connectionToken,
                appRoot: uri_1.URI.revive(data.appRoot),
                settingsPath: uri_1.URI.revive(data.settingsPath),
                logsPath: uri_1.URI.revive(data.logsPath),
                extensionHostLogsPath: uri_1.URI.revive(data.extensionHostLogsPath),
                globalStorageHome: uri_1.URI.revive(data.globalStorageHome),
                workspaceStorageHome: uri_1.URI.revive(data.workspaceStorageHome),
                localHistoryHome: uri_1.URI.revive(data.localHistoryHome),
                userHome: uri_1.URI.revive(data.userHome),
                os: data.os,
                arch: data.arch,
                marks: data.marks,
                useHostProxy: data.useHostProxy,
                profiles: (0, marshalling_1.revive)(data.profiles),
                isUnsupportedGlibc: data.isUnsupportedGlibc
            };
        }
        static async getExtensionHostExitInfo(channel, remoteAuthority, reconnectionToken) {
            const args = {
                remoteAuthority,
                reconnectionToken
            };
            return channel.call('getExtensionHostExitInfo', args);
        }
        static getDiagnosticInfo(channel, options) {
            return channel.call('getDiagnosticInfo', options);
        }
        static updateTelemetryLevel(channel, telemetryLevel) {
            return channel.call('updateTelemetryLevel', { telemetryLevel });
        }
        static logTelemetry(channel, eventName, data) {
            return channel.call('logTelemetry', { eventName, data });
        }
        static flushTelemetry(channel) {
            return channel.call('flushTelemetry');
        }
        static async ping(channel) {
            await channel.call('ping');
        }
    }
    exports.RemoteExtensionEnvironmentChannelClient = RemoteExtensionEnvironmentChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQWdlbnRFbnZpcm9ubWVudENoYW5uZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9yZW1vdGUvY29tbW9uL3JlbW90ZUFnZW50RW52aXJvbm1lbnRDaGFubmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTZDaEcsTUFBYSx1Q0FBdUM7UUFFbkQsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxPQUFpQixFQUFFLGVBQXVCLEVBQUUsT0FBMkI7WUFDdEcsTUFBTSxJQUFJLEdBQWlDO2dCQUMxQyxlQUFlO2dCQUNmLE9BQU87YUFDUCxDQUFDO1lBRUYsTUFBTSxJQUFJLEdBQUcsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUE2QixvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUV4RixPQUFPO2dCQUNOLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztnQkFDYixlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWU7Z0JBQ3JDLE9BQU8sRUFBRSxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ2pDLFlBQVksRUFBRSxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQzNDLFFBQVEsRUFBRSxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQ25DLHFCQUFxQixFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDO2dCQUM3RCxpQkFBaUIsRUFBRSxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztnQkFDckQsb0JBQW9CLEVBQUUsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUM7Z0JBQzNELGdCQUFnQixFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDO2dCQUNuRCxRQUFRLEVBQUUsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUNuQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2dCQUNmLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO2dCQUMvQixRQUFRLEVBQUUsSUFBQSxvQkFBTSxFQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQy9CLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0I7YUFDM0MsQ0FBQztRQUNILENBQUM7UUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLE9BQWlCLEVBQUUsZUFBdUIsRUFBRSxpQkFBeUI7WUFDMUcsTUFBTSxJQUFJLEdBQXVDO2dCQUNoRCxlQUFlO2dCQUNmLGlCQUFpQjthQUNqQixDQUFDO1lBQ0YsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFnQywwQkFBMEIsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0RixDQUFDO1FBRUQsTUFBTSxDQUFDLGlCQUFpQixDQUFDLE9BQWlCLEVBQUUsT0FBK0I7WUFDMUUsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFrQixtQkFBbUIsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRUQsTUFBTSxDQUFDLG9CQUFvQixDQUFDLE9BQWlCLEVBQUUsY0FBOEI7WUFDNUUsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFPLHNCQUFzQixFQUFFLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBRUQsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFpQixFQUFFLFNBQWlCLEVBQUUsSUFBb0I7WUFDN0UsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFPLGNBQWMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQWlCO1lBQ3RDLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBTyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFpQjtZQUNsQyxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQU8sTUFBTSxDQUFDLENBQUM7UUFDbEMsQ0FBQztLQUNEO0lBekRELDBGQXlEQyJ9