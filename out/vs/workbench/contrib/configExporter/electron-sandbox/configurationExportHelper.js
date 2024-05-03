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
define(["require", "exports", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands", "vs/platform/files/common/files", "vs/base/common/buffer", "vs/base/common/uri", "vs/platform/product/common/productService"], function (require, exports, environmentService_1, platform_1, configurationRegistry_1, extensions_1, commands_1, files_1, buffer_1, uri_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultConfigurationExportHelper = void 0;
    let DefaultConfigurationExportHelper = class DefaultConfigurationExportHelper {
        constructor(environmentService, extensionService, commandService, fileService, productService) {
            this.extensionService = extensionService;
            this.commandService = commandService;
            this.fileService = fileService;
            this.productService = productService;
            const exportDefaultConfigurationPath = environmentService.args['export-default-configuration'];
            if (exportDefaultConfigurationPath) {
                this.writeConfigModelAndQuit(uri_1.URI.file(exportDefaultConfigurationPath));
            }
        }
        async writeConfigModelAndQuit(target) {
            try {
                await this.extensionService.whenInstalledExtensionsRegistered();
                await this.writeConfigModel(target);
            }
            finally {
                this.commandService.executeCommand('workbench.action.quit');
            }
        }
        async writeConfigModel(target) {
            const config = this.getConfigModel();
            const resultString = JSON.stringify(config, undefined, '  ');
            await this.fileService.writeFile(target, buffer_1.VSBuffer.fromString(resultString));
        }
        getConfigModel() {
            const configRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            const configurations = configRegistry.getConfigurations().slice();
            const settings = [];
            const processedNames = new Set();
            const processProperty = (name, prop) => {
                if (processedNames.has(name)) {
                    console.warn('Setting is registered twice: ' + name);
                    return;
                }
                processedNames.add(name);
                const propDetails = {
                    name,
                    description: prop.description || prop.markdownDescription || '',
                    default: prop.default,
                    type: prop.type
                };
                if (prop.enum) {
                    propDetails.enum = prop.enum;
                }
                if (prop.enumDescriptions || prop.markdownEnumDescriptions) {
                    propDetails.enumDescriptions = prop.enumDescriptions || prop.markdownEnumDescriptions;
                }
                settings.push(propDetails);
            };
            const processConfig = (config) => {
                if (config.properties) {
                    for (const name in config.properties) {
                        processProperty(name, config.properties[name]);
                    }
                }
                config.allOf?.forEach(processConfig);
            };
            configurations.forEach(processConfig);
            const excludedProps = configRegistry.getExcludedConfigurationProperties();
            for (const name in excludedProps) {
                processProperty(name, excludedProps[name]);
            }
            const result = {
                settings: settings.sort((a, b) => a.name.localeCompare(b.name)),
                buildTime: Date.now(),
                commit: this.productService.commit,
                buildNumber: this.productService.settingsSearchBuildId
            };
            return result;
        }
    };
    exports.DefaultConfigurationExportHelper = DefaultConfigurationExportHelper;
    exports.DefaultConfigurationExportHelper = DefaultConfigurationExportHelper = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, extensions_1.IExtensionService),
        __param(2, commands_1.ICommandService),
        __param(3, files_1.IFileService),
        __param(4, productService_1.IProductService)
    ], DefaultConfigurationExportHelper);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbkV4cG9ydEhlbHBlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29uZmlnRXhwb3J0ZXIvZWxlY3Ryb24tc2FuZGJveC9jb25maWd1cmF0aW9uRXhwb3J0SGVscGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTRCekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBZ0M7UUFFNUMsWUFDcUMsa0JBQXNELEVBQ3RELGdCQUFtQyxFQUNyQyxjQUErQixFQUNsQyxXQUF5QixFQUN0QixjQUErQjtZQUg3QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3JDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNsQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN0QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFFakUsTUFBTSw4QkFBOEIsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUMvRixJQUFJLDhCQUE4QixFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQztZQUN4RSxDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxNQUFXO1lBQ2hELElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDO2dCQUNoRSxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyQyxDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUM3RCxD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