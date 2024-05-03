/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/platform/url/common/url", "vs/workbench/common/contributions", "vs/workbench/contrib/url/browser/externalUriResolver", "vs/workbench/contrib/url/browser/trustedDomains", "vs/workbench/contrib/url/browser/trustedDomainsFileSystemProvider", "vs/workbench/contrib/url/browser/trustedDomainsValidator", "vs/platform/action/common/actionCommonCategories", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration"], function (require, exports, uri_1, nls_1, actions_1, commands_1, quickInput_1, platform_1, url_1, contributions_1, externalUriResolver_1, trustedDomains_1, trustedDomainsFileSystemProvider_1, trustedDomainsValidator_1, actionCommonCategories_1, configurationRegistry_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OpenUrlAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.url.openUrl',
                title: (0, nls_1.localize2)('openUrl', 'Open URL'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const urlService = accessor.get(url_1.IURLService);
            return quickInputService.input({ prompt: (0, nls_1.localize)('urlToOpen', "URL to open") }).then(input => {
                if (input) {
                    const uri = uri_1.URI.parse(input);
                    urlService.open(uri, { originalUrl: input });
                }
            });
        }
    }
    (0, actions_1.registerAction2)(OpenUrlAction);
    /**
     * Trusted Domains Contribution
     */
    commands_1.CommandsRegistry.registerCommand(trustedDomains_1.manageTrustedDomainSettingsCommand);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: trustedDomains_1.manageTrustedDomainSettingsCommand.id,
            title: trustedDomains_1.manageTrustedDomainSettingsCommand.description.description
        }
    });
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(trustedDomainsValidator_1.OpenerValidatorContributions, 3 /* LifecyclePhase.Restored */);
    (0, contributions_1.registerWorkbenchContribution2)(trustedDomainsFileSystemProvider_1.TrustedDomainsFileSystemProvider.ID, trustedDomainsFileSystemProvider_1.TrustedDomainsFileSystemProvider, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(externalUriResolver_1.ExternalUriResolverContribution.ID, externalUriResolver_1.ExternalUriResolverContribution, 2 /* WorkbenchPhase.BlockRestore */);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        ...configuration_1.workbenchConfigurationNodeBase,
        properties: {
            'workbench.trustedDomains.promptInTrustedWorkspace': {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                type: 'boolean',
                default: false,
                description: (0, nls_1.localize)('workbench.trustedDomains.promptInTrustedWorkspace', "When enabled, trusted domain prompts will appear when opening links in trusted workspaces.")
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXJsL2Jyb3dzZXIvdXJsLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW9CaEcsTUFBTSxhQUFjLFNBQVEsaUJBQU87UUFFbEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDhCQUE4QjtnQkFDbEMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLFNBQVMsRUFBRSxVQUFVLENBQUM7Z0JBQ3ZDLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLFNBQVM7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7WUFDM0QsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBVyxDQUFDLENBQUM7WUFFN0MsT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzdGLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsTUFBTSxHQUFHLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDN0IsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDOUMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBRUQsSUFBQSx5QkFBZSxFQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRS9COztPQUVHO0lBRUgsMkJBQWdCLENBQUMsZUFBZSxDQUFDLG1EQUFrQyxDQUFDLENBQUM7SUFDckUsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxjQUFjLEVBQUU7UUFDbEQsT0FBTyxFQUFFO1lBQ1IsRUFBRSxFQUFFLG1EQUFrQyxDQUFDLEVBQUU7WUFDekMsS0FBSyxFQUFFLG1EQUFrQyxDQUFDLFdBQVcsQ0FBQyxXQUFXO1NBQ2pFO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLDZCQUE2QixDQUN4RyxzREFBNEIsa0NBRTVCLENBQUM7SUFDRixJQUFBLDhDQUE4QixFQUM3QixtRUFBZ0MsQ0FBQyxFQUFFLEVBQ25DLG1FQUFnQyxzQ0FFaEMsQ0FBQztJQUNGLElBQUEsOENBQThCLEVBQzdCLHFEQUErQixDQUFDLEVBQUUsRUFDbEMscURBQStCLHNDQUUvQixDQUFDO0lBR0YsTUFBTSxxQkFBcUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDekcscUJBQXFCLENBQUMscUJBQXFCLENBQUM7UUFDM0MsR0FBRyw4Q0FBOEI7UUFDakMsVUFBVSxFQUFFO1lBQ1gsbURBQW1ELEVBQUU7Z0JBQ3BELEtBQUssd0NBQWdDO2dCQUNyQyxJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsS0FBSztnQkFDZCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsbURBQW1ELEVBQUUsNEZBQTRGLENBQUM7YUFDeEs7U0FDRDtLQUNELENBQUMsQ0FBQyJ9