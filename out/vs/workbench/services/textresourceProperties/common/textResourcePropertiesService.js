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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/editor/common/services/textResourceConfiguration", "vs/base/common/platform", "vs/base/common/network", "vs/platform/storage/common/storage", "vs/workbench/services/environment/common/environmentService", "vs/platform/instantiation/common/extensions", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, configuration_1, textResourceConfiguration_1, platform_1, network_1, storage_1, environmentService_1, extensions_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourcePropertiesService = void 0;
    let TextResourcePropertiesService = class TextResourcePropertiesService {
        constructor(configurationService, remoteAgentService, environmentService, storageService) {
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.storageService = storageService;
            this.remoteEnvironment = null;
            remoteAgentService.getEnvironment().then(remoteEnv => this.remoteEnvironment = remoteEnv);
        }
        getEOL(resource, language) {
            const eol = this.configurationService.getValue('files.eol', { overrideIdentifier: language, resource });
            if (eol && typeof eol === 'string' && eol !== 'auto') {
                return eol;
            }
            const os = this.getOS(resource);
            return os === 3 /* OperatingSystem.Linux */ || os === 2 /* OperatingSystem.Macintosh */ ? '\n' : '\r\n';
        }
        getOS(resource) {
            let os = platform_1.OS;
            const remoteAuthority = this.environmentService.remoteAuthority;
            if (remoteAuthority) {
                if (resource && resource.scheme !== network_1.Schemas.file) {
                    const osCacheKey = `resource.authority.os.${remoteAuthority}`;
                    os = this.remoteEnvironment ? this.remoteEnvironment.os : /* Get it from cache */ this.storageService.getNumber(osCacheKey, 1 /* StorageScope.WORKSPACE */, platform_1.OS);
                    this.storageService.store(osCacheKey, os, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                }
            }
            return os;
        }
    };
    exports.TextResourcePropertiesService = TextResourcePropertiesService;
    exports.TextResourcePropertiesService = TextResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, storage_1.IStorageService)
    ], TextResourcePropertiesService);
    (0, extensions_1.registerSingleton)(textResourceConfiguration_1.ITextResourcePropertiesService, TextResourcePropertiesService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFJlc291cmNlUHJvcGVydGllc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0cmVzb3VyY2VQcm9wZXJ0aWVzL2NvbW1vbi90ZXh0UmVzb3VyY2VQcm9wZXJ0aWVzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBNkI7UUFNekMsWUFDd0Isb0JBQTRELEVBQzlELGtCQUF1QyxFQUM5QixrQkFBaUUsRUFDOUUsY0FBZ0Q7WUFIekIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUVwQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBQzdELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQU4xRCxzQkFBaUIsR0FBbUMsSUFBSSxDQUFDO1lBUWhFLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUMzRixDQUFDO1FBRUQsTUFBTSxDQUFDLFFBQWMsRUFBRSxRQUFpQjtZQUN2QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hHLElBQUksR0FBRyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQ3RELE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztZQUNELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsT0FBTyxFQUFFLGtDQUEwQixJQUFJLEVBQUUsc0NBQThCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3pGLENBQUM7UUFFTyxLQUFLLENBQUMsUUFBYztZQUMzQixJQUFJLEVBQUUsR0FBRyxhQUFFLENBQUM7WUFFWixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDO1lBQ2hFLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDbEQsTUFBTSxVQUFVLEdBQUcseUJBQXlCLGVBQWUsRUFBRSxDQUFDO29CQUM5RCxFQUFFLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxVQUFVLGtDQUEwQixhQUFFLENBQUMsQ0FBQztvQkFDeEosSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsZ0VBQWdELENBQUM7Z0JBQzFGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO0tBQ0QsQ0FBQTtJQXRDWSxzRUFBNkI7NENBQTdCLDZCQUE2QjtRQU92QyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsd0NBQW1CLENBQUE7UUFDbkIsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLHlCQUFlLENBQUE7T0FWTCw2QkFBNkIsQ0FzQ3pDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQywwREFBOEIsRUFBRSw2QkFBNkIsb0NBQTRCLENBQUMifQ==