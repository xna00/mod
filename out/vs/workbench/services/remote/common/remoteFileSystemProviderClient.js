/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/platform/files/common/diskFileSystemProviderClient"], function (require, exports, errors_1, lifecycle_1, network_1, diskFileSystemProviderClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteFileSystemProviderClient = exports.REMOTE_FILE_SYSTEM_CHANNEL_NAME = void 0;
    exports.REMOTE_FILE_SYSTEM_CHANNEL_NAME = 'remoteFilesystem';
    class RemoteFileSystemProviderClient extends diskFileSystemProviderClient_1.DiskFileSystemProviderClient {
        static register(remoteAgentService, fileService, logService) {
            const connection = remoteAgentService.getConnection();
            if (!connection) {
                return lifecycle_1.Disposable.None;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const environmentPromise = (async () => {
                try {
                    const environment = await remoteAgentService.getRawEnvironment();
                    if (environment) {
                        // Register remote fsp even before it is asked to activate
                        // because, some features (configuration) wait for its
                        // registration before making fs calls.
                        fileService.registerProvider(network_1.Schemas.vscodeRemote, disposables.add(new RemoteFileSystemProviderClient(environment, connection)));
                    }
                    else {
                        logService.error('Cannot register remote filesystem provider. Remote environment doesnot exist.');
                    }
                }
                catch (error) {
                    logService.error('Cannot register remote filesystem provider. Error while fetching remote environment.', (0, errors_1.getErrorMessage)(error));
                }
            })();
            disposables.add(fileService.onWillActivateFileSystemProvider(e => {
                if (e.scheme === network_1.Schemas.vscodeRemote) {
                    e.join(environmentPromise);
                }
            }));
            return disposables;
        }
        constructor(remoteAgentEnvironment, connection) {
            super(connection.getChannel(exports.REMOTE_FILE_SYSTEM_CHANNEL_NAME), { pathCaseSensitive: remoteAgentEnvironment.os === 3 /* OperatingSystem.Linux */ });
        }
    }
    exports.RemoteFileSystemProviderClient = RemoteFileSystemProviderClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRmlsZVN5c3RlbVByb3ZpZGVyQ2xpZW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcmVtb3RlL2NvbW1vbi9yZW1vdGVGaWxlU3lzdGVtUHJvdmlkZXJDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWW5GLFFBQUEsK0JBQStCLEdBQUcsa0JBQWtCLENBQUM7SUFFbEUsTUFBYSw4QkFBK0IsU0FBUSwyREFBNEI7UUFFL0UsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBdUMsRUFBRSxXQUF5QixFQUFFLFVBQXVCO1lBQzFHLE1BQU0sVUFBVSxHQUFHLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3RELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxzQkFBVSxDQUFDLElBQUksQ0FBQztZQUN4QixDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUN0QyxJQUFJLENBQUM7b0JBQ0osTUFBTSxXQUFXLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUNqRSxJQUFJLFdBQVcsRUFBRSxDQUFDO3dCQUNqQiwwREFBMEQ7d0JBQzFELHNEQUFzRDt3QkFDdEQsdUNBQXVDO3dCQUN2QyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQU8sQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDhCQUE4QixDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xJLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxVQUFVLENBQUMsS0FBSyxDQUFDLCtFQUErRSxDQUFDLENBQUM7b0JBQ25HLENBQUM7Z0JBQ0YsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNoQixVQUFVLENBQUMsS0FBSyxDQUFDLHNGQUFzRixFQUFFLElBQUEsd0JBQWUsRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNsSSxDQUFDO1lBQ0YsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUVMLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNoRSxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDdkMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUM1QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFFRCxZQUFvQixzQkFBK0MsRUFBRSxVQUFrQztZQUN0RyxLQUFLLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyx1Q0FBK0IsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxrQ0FBMEIsRUFBRSxDQUFDLENBQUM7UUFDM0ksQ0FBQztLQUNEO0lBdENELHdFQXNDQyJ9