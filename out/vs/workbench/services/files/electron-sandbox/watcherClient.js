/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/platform/files/common/watcher"], function (require, exports, lifecycle_1, ipc_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UniversalWatcherClient = void 0;
    class UniversalWatcherClient extends watcher_1.AbstractUniversalWatcherClient {
        constructor(onFileChanges, onLogMessage, verboseLogging, utilityProcessWorkerWorkbenchService) {
            super(onFileChanges, onLogMessage, verboseLogging);
            this.utilityProcessWorkerWorkbenchService = utilityProcessWorkerWorkbenchService;
            this.init();
        }
        createWatcher(disposables) {
            const watcher = ipc_1.ProxyChannel.toService((0, ipc_1.getDelayedChannel)((async () => {
                // Acquire universal watcher via utility process worker
                //
                // We explicitly do not add the worker as a disposable
                // because we need to call `stop` on disposal to prevent
                // a crash on shutdown (see below).
                //
                // The utility process worker services ensures to terminate
                // the process automatically when the window closes or reloads.
                const { client, onDidTerminate } = await this.utilityProcessWorkerWorkbenchService.createWorker({
                    moduleId: 'vs/platform/files/node/watcher/watcherMain',
                    type: 'fileWatcher'
                });
                // React on unexpected termination of the watcher process
                // by listening to the `onDidTerminate` event. We do not
                // consider an exit code of `0` as abnormal termination.
                onDidTerminate.then(({ reason }) => {
                    if (reason?.code === 0) {
                        this.trace(`terminated by itself with code ${reason.code}, signal: ${reason.signal}`);
                    }
                    else {
                        this.onError(`terminated by itself unexpectedly with code ${reason?.code}, signal: ${reason?.signal}`);
                    }
                });
                return client.getChannel('watcher');
            })()));
            // Looks like universal watcher needs an explicit stop
            // to prevent access on data structures after process
            // exit. This only seem to be happening when used from
            // Electron, not pure node.js.
            // https://github.com/microsoft/vscode/issues/136264
            disposables.add((0, lifecycle_1.toDisposable)(() => watcher.stop()));
            return watcher;
        }
    }
    exports.UniversalWatcherClient = UniversalWatcherClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlckNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2ZpbGVzL2VsZWN0cm9uLXNhbmRib3gvd2F0Y2hlckNsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSxzQkFBdUIsU0FBUSx3Q0FBOEI7UUFFekUsWUFDQyxhQUErQyxFQUMvQyxZQUF3QyxFQUN4QyxjQUF1QixFQUNOLG9DQUEyRTtZQUU1RixLQUFLLENBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUZsQyx5Q0FBb0MsR0FBcEMsb0NBQW9DLENBQXVDO1lBSTVGLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNiLENBQUM7UUFFa0IsYUFBYSxDQUFDLFdBQTRCO1lBQzVELE1BQU0sT0FBTyxHQUFHLGtCQUFZLENBQUMsU0FBUyxDQUFvQixJQUFBLHVCQUFpQixFQUFDLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBRXZGLHVEQUF1RDtnQkFDdkQsRUFBRTtnQkFDRixzREFBc0Q7Z0JBQ3RELHdEQUF3RDtnQkFDeEQsbUNBQW1DO2dCQUNuQyxFQUFFO2dCQUNGLDJEQUEyRDtnQkFDM0QsK0RBQStEO2dCQUMvRCxNQUFNLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLG9DQUFvQyxDQUFDLFlBQVksQ0FBQztvQkFDL0YsUUFBUSxFQUFFLDRDQUE0QztvQkFDdEQsSUFBSSxFQUFFLGFBQWE7aUJBQ25CLENBQUMsQ0FBQztnQkFFSCx5REFBeUQ7Z0JBQ3pELHdEQUF3RDtnQkFDeEQsd0RBQXdEO2dCQUV4RCxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFO29CQUNsQyxJQUFJLE1BQU0sRUFBRSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3hCLElBQUksQ0FBQyxLQUFLLENBQUMsa0NBQWtDLE1BQU0sQ0FBQyxJQUFJLGFBQWEsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7b0JBQ3ZGLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsT0FBTyxDQUFDLCtDQUErQyxNQUFNLEVBQUUsSUFBSSxhQUFhLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO29CQUN4RyxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUVILE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVQLHNEQUFzRDtZQUN0RCxxREFBcUQ7WUFDckQsc0RBQXNEO1lBQ3RELDhCQUE4QjtZQUM5QixvREFBb0Q7WUFDcEQsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVwRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO0tBQ0Q7SUFyREQsd0RBcURDIn0=