/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, extpath_1, network_1, path_1, platform_1, resources_1, uri_1, instantiation_1, virtualWorkspace_1, workspace_1, environmentService_1, remoteAgentService_1) {
    "use strict";
    var AbstractPathService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractPathService = exports.IPathService = void 0;
    exports.IPathService = (0, instantiation_1.createDecorator)('pathService');
    let AbstractPathService = AbstractPathService_1 = class AbstractPathService {
        constructor(localUserHome, remoteAgentService, environmentService, contextService) {
            this.localUserHome = localUserHome;
            this.remoteAgentService = remoteAgentService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            // OS
            this.resolveOS = (async () => {
                const env = await this.remoteAgentService.getEnvironment();
                return env?.os || platform_1.OS;
            })();
            // User Home
            this.resolveUserHome = (async () => {
                const env = await this.remoteAgentService.getEnvironment();
                const userHome = this.maybeUnresolvedUserHome = env?.userHome ?? localUserHome;
                return userHome;
            })();
        }
        hasValidBasename(resource, arg2, basename) {
            // async version
            if (typeof arg2 === 'string' || typeof arg2 === 'undefined') {
                return this.resolveOS.then(os => this.doHasValidBasename(resource, os, arg2));
            }
            // sync version
            return this.doHasValidBasename(resource, arg2, basename);
        }
        doHasValidBasename(resource, os, name) {
            // Our `isValidBasename` method only works with our
            // standard schemes for files on disk, either locally
            // or remote.
            if (resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.vscodeRemote) {
                return (0, extpath_1.isValidBasename)(name ?? (0, resources_1.basename)(resource), os === 1 /* OperatingSystem.Windows */);
            }
            return true;
        }
        get defaultUriScheme() {
            return AbstractPathService_1.findDefaultUriScheme(this.environmentService, this.contextService);
        }
        static findDefaultUriScheme(environmentService, contextService) {
            if (environmentService.remoteAuthority) {
                return network_1.Schemas.vscodeRemote;
            }
            const virtualWorkspace = (0, virtualWorkspace_1.getVirtualWorkspaceScheme)(contextService.getWorkspace());
            if (virtualWorkspace) {
                return virtualWorkspace;
            }
            const firstFolder = contextService.getWorkspace().folders[0];
            if (firstFolder) {
                return firstFolder.uri.scheme;
            }
            const configuration = contextService.getWorkspace().configuration;
            if (configuration) {
                return configuration.scheme;
            }
            return network_1.Schemas.file;
        }
        userHome(options) {
            return options?.preferLocal ? this.localUserHome : this.resolveUserHome;
        }
        get resolvedUserHome() {
            return this.maybeUnresolvedUserHome;
        }
        get path() {
            return this.resolveOS.then(os => {
                return os === 1 /* OperatingSystem.Windows */ ?
                    path_1.win32 :
                    path_1.posix;
            });
        }
        async fileURI(_path) {
            let authority = '';
            // normalize to fwd-slashes on windows,
            // on other systems bwd-slashes are valid
            // filename character, eg /f\oo/ba\r.txt
            const os = await this.resolveOS;
            if (os === 1 /* OperatingSystem.Windows */) {
                _path = _path.replace(/\\/g, '/');
            }
            // check for authority as used in UNC shares
            // or use the path as given
            if (_path[0] === '/' && _path[1] === '/') {
                const idx = _path.indexOf('/', 2);
                if (idx === -1) {
                    authority = _path.substring(2);
                    _path = '/';
                }
                else {
                    authority = _path.substring(2, idx);
                    _path = _path.substring(idx) || '/';
                }
            }
            return uri_1.URI.from({
                scheme: network_1.Schemas.file,
                authority,
                path: _path,
                query: '',
                fragment: ''
            });
        }
    };
    exports.AbstractPathService = AbstractPathService;
    exports.AbstractPathService = AbstractPathService = AbstractPathService_1 = __decorate([
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, workspace_1.IWorkspaceContextService)
    ], AbstractPathService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9wYXRoL2NvbW1vbi9wYXRoU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBY25GLFFBQUEsWUFBWSxHQUFHLElBQUEsK0JBQWUsRUFBZSxhQUFhLENBQUMsQ0FBQztJQStEbEUsSUFBZSxtQkFBbUIsMkJBQWxDLE1BQWUsbUJBQW1CO1FBU3hDLFlBQ1MsYUFBa0IsRUFDWSxrQkFBdUMsRUFDOUIsa0JBQWdELEVBQzdELGNBQXdDO1lBSGxFLGtCQUFhLEdBQWIsYUFBYSxDQUFLO1lBQ1ksdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM5Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBQzdELG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUcxRSxLQUFLO1lBQ0wsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUM1QixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFFM0QsT0FBTyxHQUFHLEVBQUUsRUFBRSxJQUFJLGFBQUUsQ0FBQztZQUN0QixDQUFDLENBQUMsRUFBRSxDQUFDO1lBRUwsWUFBWTtZQUNaLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDbEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxHQUFHLEVBQUUsUUFBUSxJQUFJLGFBQWEsQ0FBQztnQkFFL0UsT0FBTyxRQUFRLENBQUM7WUFDakIsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNOLENBQUM7UUFJRCxnQkFBZ0IsQ0FBQyxRQUFhLEVBQUUsSUFBK0IsRUFBRSxRQUFpQjtZQUVqRixnQkFBZ0I7WUFDaEIsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQzdELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQy9FLENBQUM7WUFFRCxlQUFlO1lBQ2YsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRU8sa0JBQWtCLENBQUMsUUFBYSxFQUFFLEVBQW1CLEVBQUUsSUFBYTtZQUUzRSxtREFBbUQ7WUFDbkQscURBQXFEO1lBQ3JELGFBQWE7WUFDYixJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNsRixPQUFPLElBQUEseUJBQWUsRUFBQyxJQUFJLElBQUksSUFBQSxvQkFBUSxFQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsb0NBQTRCLENBQUMsQ0FBQztZQUNwRixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsSUFBSSxnQkFBZ0I7WUFDbkIsT0FBTyxxQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQy9GLENBQUM7UUFFRCxNQUFNLENBQUMsb0JBQW9CLENBQUMsa0JBQWdELEVBQUUsY0FBd0M7WUFDckgsSUFBSSxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxpQkFBTyxDQUFDLFlBQVksQ0FBQztZQUM3QixDQUFDO1lBRUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLDRDQUF5QixFQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ2xGLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEIsT0FBTyxnQkFBZ0IsQ0FBQztZQUN6QixDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RCxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQy9CLENBQUM7WUFFRCxNQUFNLGFBQWEsR0FBRyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQ2xFLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQ25CLE9BQU8sYUFBYSxDQUFDLE1BQU0sQ0FBQztZQUM3QixDQUFDO1lBRUQsT0FBTyxpQkFBTyxDQUFDLElBQUksQ0FBQztRQUNyQixDQUFDO1FBSUQsUUFBUSxDQUFDLE9BQWtDO1lBQzFDLE9BQU8sT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUN6RSxDQUFDO1FBRUQsSUFBSSxnQkFBZ0I7WUFDbkIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUM7UUFDckMsQ0FBQztRQUVELElBQUksSUFBSTtZQUNQLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sRUFBRSxvQ0FBNEIsQ0FBQyxDQUFDO29CQUN0QyxZQUFLLENBQUMsQ0FBQztvQkFDUCxZQUFLLENBQUM7WUFDUixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQWE7WUFDMUIsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBRW5CLHVDQUF1QztZQUN2Qyx5Q0FBeUM7WUFDekMsd0NBQXdDO1lBQ3hDLE1BQU0sRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNoQyxJQUFJLEVBQUUsb0NBQTRCLEVBQUUsQ0FBQztnQkFDcEMsS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFFRCw0Q0FBNEM7WUFDNUMsMkJBQTJCO1lBQzNCLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQzFDLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNoQixTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDL0IsS0FBSyxHQUFHLEdBQUcsQ0FBQztnQkFDYixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUNwQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUM7Z0JBQ3JDLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNmLE1BQU0sRUFBRSxpQkFBTyxDQUFDLElBQUk7Z0JBQ3BCLFNBQVM7Z0JBQ1QsSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsUUFBUSxFQUFFLEVBQUU7YUFDWixDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQXRJcUIsa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFXdEMsV0FBQSx3Q0FBbUIsQ0FBQTtRQUNuQixXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEsb0NBQXdCLENBQUE7T0FiTCxtQkFBbUIsQ0FzSXhDIn0=