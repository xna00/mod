/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/node/uriTransformer", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/path", "vs/platform/files/node/diskFileSystemProviderServer"], function (require, exports, uri_1, uriTransformer_1, diskFileSystemProvider_1, path_1, diskFileSystemProviderServer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentFileSystemProviderChannel = void 0;
    class RemoteAgentFileSystemProviderChannel extends diskFileSystemProviderServer_1.AbstractDiskFileSystemProviderChannel {
        constructor(logService, environmentService) {
            super(new diskFileSystemProvider_1.DiskFileSystemProvider(logService), logService);
            this.environmentService = environmentService;
            this.uriTransformerCache = new Map();
            this._register(this.provider);
        }
        getUriTransformer(ctx) {
            let transformer = this.uriTransformerCache.get(ctx.remoteAuthority);
            if (!transformer) {
                transformer = (0, uriTransformer_1.createURITransformer)(ctx.remoteAuthority);
                this.uriTransformerCache.set(ctx.remoteAuthority, transformer);
            }
            return transformer;
        }
        transformIncoming(uriTransformer, _resource, supportVSCodeResource = false) {
            if (supportVSCodeResource && _resource.path === '/vscode-resource' && _resource.query) {
                const requestResourcePath = JSON.parse(_resource.query).requestResourcePath;
                return uri_1.URI.from({ scheme: 'file', path: requestResourcePath });
            }
            return uri_1.URI.revive(uriTransformer.transformIncoming(_resource));
        }
        //#region File Watching
        createSessionFileWatcher(uriTransformer, emitter) {
            return new SessionFileWatcher(uriTransformer, emitter, this.logService, this.environmentService);
        }
    }
    exports.RemoteAgentFileSystemProviderChannel = RemoteAgentFileSystemProviderChannel;
    class SessionFileWatcher extends diskFileSystemProviderServer_1.AbstractSessionFileWatcher {
        constructor(uriTransformer, sessionEmitter, logService, environmentService) {
            super(uriTransformer, sessionEmitter, logService, environmentService);
        }
        getRecursiveWatcherOptions(environmentService) {
            const fileWatcherPolling = environmentService.args['file-watcher-polling'];
            if (fileWatcherPolling) {
                const segments = fileWatcherPolling.split(path_1.delimiter);
                const pollingInterval = Number(segments[0]);
                if (pollingInterval > 0) {
                    const usePolling = segments.length > 1 ? segments.slice(1) : true;
                    return { usePolling, pollingInterval };
                }
            }
            return undefined;
        }
        getExtraExcludes(environmentService) {
            if (environmentService.extensionsPath) {
                // when opening the $HOME folder, we end up watching the extension folder
                // so simply exclude watching the extensions folder
                return [path_1.posix.join(environmentService.extensionsPath, '**')];
            }
            return undefined;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRmlsZVN5c3RlbVByb3ZpZGVyU2VydmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS9yZW1vdGVGaWxlU3lzdGVtUHJvdmlkZXJTZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQWEsb0NBQXFDLFNBQVEsb0VBQW1FO1FBSTVILFlBQ0MsVUFBdUIsRUFDTixrQkFBNkM7WUFFOUQsS0FBSyxDQUFDLElBQUksK0NBQXNCLENBQUMsVUFBVSxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFGekMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUEyQjtZQUo5Qyx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztZQVF6RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRWtCLGlCQUFpQixDQUFDLEdBQWlDO1lBQ3JFLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3BFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEIsV0FBVyxHQUFHLElBQUEscUNBQW9CLEVBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUN4RCxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDaEUsQ0FBQztZQUVELE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFFa0IsaUJBQWlCLENBQUMsY0FBK0IsRUFBRSxTQUF3QixFQUFFLHFCQUFxQixHQUFHLEtBQUs7WUFDNUgsSUFBSSxxQkFBcUIsSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLGtCQUFrQixJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDdkYsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQztnQkFFNUUsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLENBQUM7WUFFRCxPQUFPLFNBQUcsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELHVCQUF1QjtRQUViLHdCQUF3QixDQUFDLGNBQStCLEVBQUUsT0FBd0M7WUFDM0csT0FBTyxJQUFJLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNsRyxDQUFDO0tBR0Q7SUF4Q0Qsb0ZBd0NDO0lBRUQsTUFBTSxrQkFBbUIsU0FBUSx5REFBMEI7UUFFMUQsWUFDQyxjQUErQixFQUMvQixjQUErQyxFQUMvQyxVQUF1QixFQUN2QixrQkFBNkM7WUFFN0MsS0FBSyxDQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVrQiwwQkFBMEIsQ0FBQyxrQkFBNkM7WUFDMUYsTUFBTSxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUMzRSxJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sUUFBUSxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxnQkFBUyxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxlQUFlLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3pCLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ2xFLE9BQU8sRUFBRSxVQUFVLEVBQUUsZUFBZSxFQUFFLENBQUM7Z0JBQ3hDLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVrQixnQkFBZ0IsQ0FBQyxrQkFBNkM7WUFDaEYsSUFBSSxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDdkMseUVBQXlFO2dCQUN6RSxtREFBbUQ7Z0JBQ25ELE9BQU8sQ0FBQyxZQUFLLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzlELENBQUM7WUFFRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO0tBQ0QifQ==