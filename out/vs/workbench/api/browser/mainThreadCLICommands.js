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
define(["require", "exports", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementCLI", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/opener/common/opener", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensionManifestPropertiesService"], function (require, exports, network_1, platform_1, types_1, uri_1, nls_1, commands_1, extensionManagement_1, extensionManagementCLI_1, extensionManagementUtil_1, instantiation_1, serviceCollection_1, label_1, log_1, opener_1, environmentService_1, extensionManagement_2, extensionManifestPropertiesService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // this class contains the commands that the CLI server is reying on
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.openExternal', function (accessor, uri) {
        const openerService = accessor.get(opener_1.IOpenerService);
        return openerService.open((0, types_1.isString)(uri) ? uri : uri_1.URI.revive(uri), { openExternal: true, allowTunneling: true });
    });
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.windowOpen', function (accessor, toOpen, options) {
        const commandService = accessor.get(commands_1.ICommandService);
        if (!toOpen.length) {
            return commandService.executeCommand('_files.newWindow', options);
        }
        return commandService.executeCommand('_files.windowOpen', toOpen, options);
    });
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.getSystemStatus', function (accessor) {
        const commandService = accessor.get(commands_1.ICommandService);
        return commandService.executeCommand('_issues.getSystemStatus');
    });
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.manageExtensions', async function (accessor, args) {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const extensionManagementServerService = accessor.get(extensionManagement_2.IExtensionManagementServerService);
        const remoteExtensionManagementService = extensionManagementServerService.remoteExtensionManagementServer?.extensionManagementService;
        if (!remoteExtensionManagementService) {
            return;
        }
        const lines = [];
        const logger = new class extends log_1.AbstractMessageLogger {
            log(level, message) {
                lines.push(message);
            }
        }();
        const cliService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([extensionManagement_1.IExtensionManagementService, remoteExtensionManagementService])).createInstance(RemoteExtensionManagementCLI, logger);
        if (args.list) {
            await cliService.listExtensions(!!args.list.showVersions, args.list.category, undefined);
        }
        else {
            const revive = (inputs) => inputs.map(input => (0, types_1.isString)(input) ? input : uri_1.URI.revive(input));
            if (Array.isArray(args.install) && args.install.length) {
                try {
                    await cliService.installExtensions(revive(args.install), [], { isMachineScoped: true }, !!args.force);
                }
                catch (e) {
                    lines.push(e.message);
                }
            }
            if (Array.isArray(args.uninstall) && args.uninstall.length) {
                try {
                    await cliService.uninstallExtensions(revive(args.uninstall), !!args.force, undefined);
                }
                catch (e) {
                    lines.push(e.message);
                }
            }
        }
        return lines.join('\n');
    });
    let RemoteExtensionManagementCLI = class RemoteExtensionManagementCLI extends extensionManagementCLI_1.ExtensionManagementCLI {
        constructor(logger, extensionManagementService, extensionGalleryService, labelService, envService, _extensionManifestPropertiesService) {
            super(logger, extensionManagementService, extensionGalleryService);
            this._extensionManifestPropertiesService = _extensionManifestPropertiesService;
            const remoteAuthority = envService.remoteAuthority;
            this._location = remoteAuthority ? labelService.getHostLabel(network_1.Schemas.vscodeRemote, remoteAuthority) : undefined;
        }
        get location() {
            return this._location;
        }
        validateExtensionKind(manifest) {
            if (!this._extensionManifestPropertiesService.canExecuteOnWorkspace(manifest)
                // Web extensions installed on remote can be run in web worker extension host
                && !(platform_1.isWeb && this._extensionManifestPropertiesService.canExecuteOnWeb(manifest))) {
                this.logger.info((0, nls_1.localize)('cannot be installed', "Cannot install the '{0}' extension because it is declared to not run in this setup.", (0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name)));
                return false;
            }
            return true;
        }
    };
    RemoteExtensionManagementCLI = __decorate([
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, label_1.ILabelService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], RemoteExtensionManagementCLI);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENMSUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZENMSUNvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBdUJoRyxvRUFBb0U7SUFFcEUsMkJBQWdCLENBQUMsZUFBZSxDQUFDLHlCQUF5QixFQUFFLFVBQVUsUUFBMEIsRUFBRSxHQUEyQjtRQUM1SCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVCQUFjLENBQUMsQ0FBQztRQUNuRCxPQUFPLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBQSxnQkFBUSxFQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ2hILENBQUMsQ0FBQyxDQUFDO0lBRUgsMkJBQWdCLENBQUMsZUFBZSxDQUFDLHVCQUF1QixFQUFFLFVBQVUsUUFBMEIsRUFBRSxNQUF5QixFQUFFLE9BQTJCO1FBQ3JKLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMEJBQWUsQ0FBQyxDQUFDO1FBQ3JELElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDcEIsT0FBTyxjQUFjLENBQUMsY0FBYyxDQUFDLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFDRCxPQUFPLGNBQWMsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzVFLENBQUMsQ0FBQyxDQUFDO0lBRUgs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