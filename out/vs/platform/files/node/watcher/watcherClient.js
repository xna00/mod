/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/files/common/watcher"], function (require, exports, network_1, ipc_1, ipc_cp_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UniversalWatcherClient = void 0;
    class UniversalWatcherClient extends watcher_1.AbstractUniversalWatcherClient {
        constructor(onFileChanges, onLogMessage, verboseLogging) {
            super(onFileChanges, onLogMessage, verboseLogging);
            this.init();
        }
        createWatcher(disposables) {
            // Fork the universal file watcher and build a client around
            // its server for passing over requests and receiving events.
            const client = disposables.add(new ipc_cp_1.Client(network_1.FileAccess.asFileUri('bootstrap-fork').fsPath, {
                serverName: 'File Watcher',
                args: ['--type=fileWatcher'],
                env: {
                    VSCODE_AMD_ENTRYPOINT: 'vs/platform/files/node/watcher/watcherMain',
                    VSCODE_PIPE_LOGGING: 'true',
                    VSCODE_VERBOSE_LOGGING: 'true' // transmit console logs from server to client
                }
            }));
            // React on unexpected termination of the watcher process
            disposables.add(client.onDidProcessExit(({ code, signal }) => this.onError(`terminated by itself with code ${code}, signal: ${signal}`)));
            return ipc_1.ProxyChannel.toService((0, ipc_1.getNextTickChannel)(client.getChannel('watcher')));
        }
    }
    exports.UniversalWatcherClient = UniversalWatcherClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlckNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvbm9kZS93YXRjaGVyL3dhdGNoZXJDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsc0JBQXVCLFNBQVEsd0NBQThCO1FBRXpFLFlBQ0MsYUFBK0MsRUFDL0MsWUFBd0MsRUFDeEMsY0FBdUI7WUFFdkIsS0FBSyxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFbkQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2IsQ0FBQztRQUVrQixhQUFhLENBQUMsV0FBNEI7WUFFNUQsNERBQTREO1lBQzVELDZEQUE2RDtZQUM3RCxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTSxDQUN4QyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sRUFDN0M7Z0JBQ0MsVUFBVSxFQUFFLGNBQWM7Z0JBQzFCLElBQUksRUFBRSxDQUFDLG9CQUFvQixDQUFDO2dCQUM1QixHQUFHLEVBQUU7b0JBQ0oscUJBQXFCLEVBQUUsNENBQTRDO29CQUNuRSxtQkFBbUIsRUFBRSxNQUFNO29CQUMzQixzQkFBc0IsRUFBRSxNQUFNLENBQUMsOENBQThDO2lCQUM3RTthQUNELENBQ0QsQ0FBQyxDQUFDO1lBRUgseURBQXlEO1lBQ3pELFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsa0NBQWtDLElBQUksYUFBYSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUxSSxPQUFPLGtCQUFZLENBQUMsU0FBUyxDQUFvQixJQUFBLHdCQUFrQixFQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLENBQUM7S0FDRDtJQWxDRCx3REFrQ0MifQ==