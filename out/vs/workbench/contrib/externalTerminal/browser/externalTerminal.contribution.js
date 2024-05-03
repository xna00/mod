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
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/base/common/uri", "vs/platform/actions/common/actions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/common/contextkeys", "vs/platform/files/common/files", "vs/platform/list/browser/listService", "vs/workbench/contrib/files/browser/files", "vs/platform/commands/common/commands", "vs/base/common/network", "vs/base/common/arrays", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contributions", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/path", "vs/platform/registry/common/platform", "vs/platform/externalTerminal/common/externalTerminal", "vs/platform/terminal/common/terminal"], function (require, exports, nls, configuration_1, uri_1, actions_1, terminal_1, contextkeys_1, files_1, listService_1, files_2, commands_1, network_1, arrays_1, editorService_1, remoteAgentService_1, contextkey_1, contributions_1, lifecycle_1, platform_1, path_1, platform_2, externalTerminal_1, terminal_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalTerminalContribution = void 0;
    const OPEN_IN_TERMINAL_COMMAND_ID = 'openInTerminal';
    const OPEN_IN_INTEGRATED_TERMINAL_COMMAND_ID = 'openInIntegratedTerminal';
    function registerOpenTerminalCommand(id, explorerKind) {
        commands_1.CommandsRegistry.registerCommand({
            id: id,
            handler: async (accessor, resource) => {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const editorService = accessor.get(editorService_1.IEditorService);
                const fileService = accessor.get(files_1.IFileService);
                const integratedTerminalService = accessor.get(terminal_1.ITerminalService);
                const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
                const terminalGroupService = accessor.get(terminal_1.ITerminalGroupService);
                let externalTerminalService = undefined;
                try {
                    externalTerminalService = accessor.get(externalTerminal_1.IExternalTerminalService);
                }
                catch {
                }
                const resources = (0, files_2.getMultiSelectedResources)(resource, accessor.get(listService_1.IListService), editorService, accessor.get(files_2.IExplorerService));
                return fileService.resolveAll(resources.map(r => ({ resource: r }))).then(async (stats) => {
                    // Always use integrated terminal when using a remote
                    const config = configurationService.getValue();
                    const useIntegratedTerminal = remoteAgentService.getConnection() || explorerKind === 'integrated';
                    const targets = (0, arrays_1.distinct)(stats.filter(data => data.success));
                    if (useIntegratedTerminal) {
                        // TODO: Use uri for cwd in createterminal
                        const opened = {};
                        const cwds = targets.map(({ stat }) => {
                            const resource = stat.resource;
                            if (stat.isDirectory) {
                                return resource;
                            }
                            return uri_1.URI.from({
                                scheme: resource.scheme,
                                authority: resource.authority,
                                fragment: resource.fragment,
                                query: resource.query,
                                path: (0, path_1.dirname)(resource.path)
                            });
                        });
                        for (const cwd of cwds) {
                            if (opened[cwd.path]) {
                                return;
                            }
                            opened[cwd.path] = true;
                            const instance = await integratedTerminalService.createTerminal({ config: { cwd } });
                            if (instance && instance.target !== terminal_2.TerminalLocation.Editor && (resources.length === 1 || !resource || cwd.path === resource.path || cwd.path === (0, path_1.dirname)(resource.path))) {
                                integratedTerminalService.setActiveInstance(instance);
                                terminalGroupService.showPanel(true);
                            }
                        }
                    }
                    else if (externalTerminalService) {
                        (0, arrays_1.distinct)(targets.map(({ stat }) => stat.isDirectory ? stat.resource.fsPath : (0, path_1.dirname)(stat.resource.fsPath))).forEach(cwd => {
                            externalTerminalService.openTerminal(config.terminal.external, cwd);
                        });
                    }
                });
            }
        });
    }
    registerOpenTerminalCommand(OPEN_IN_TERMINAL_COMMAND_ID, 'external');
    registerOpenTerminalCommand(OPEN_IN_INTEGRATED_TERMINAL_COMMAND_ID, 'integrated');
    let ExternalTerminalContribution = class ExternalTerminalContribution extends lifecycle_1.Disposable {
        constructor(_configurationService) {
            super();
            this._configurationService = _configurationService;
            const shouldShowIntegratedOnLocal = contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.terminal.explorerKind', 'integrated'), contextkey_1.ContextKeyExpr.equals('config.terminal.explorerKind', 'both')));
            const shouldShowExternalKindOnLocal = contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.terminal.explorerKind', 'external'), contextkey_1.ContextKeyExpr.equals('config.terminal.explorerKind', 'both')));
            this._openInIntegratedTerminalMenuItem = {
                group: 'navigation',
                order: 30,
                command: {
                    id: OPEN_IN_INTEGRATED_TERMINAL_COMMAND_ID,
                    title: nls.localize('scopedConsoleAction.Integrated', "Open in Integrated Terminal")
                },
                when: contextkey_1.ContextKeyExpr.or(shouldShowIntegratedOnLocal, contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeRemote))
            };
            this._openInTerminalMenuItem = {
                group: 'navigation',
                order: 31,
                command: {
                    id: OPEN_IN_TERMINAL_COMMAND_ID,
                    title: nls.localize('scopedConsoleAction.external', "Open in External Terminal")
                },
                when: shouldShowExternalKindOnLocal
            };
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, this._openInTerminalMenuItem);
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, this._openInIntegratedTerminalMenuItem);
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('terminal.explorerKind') || e.affectsConfiguration('terminal.external')) {
                    this._refreshOpenInTerminalMenuItemTitle();
                }
            });
            this._refreshOpenInTerminalMenuItemTitle();
        }
        isWindows() {
            const config = this._configurationService.getValue().terminal;
            if (platform_1.isWindows && config.external?.windowsExec) {
                const file = (0, path_1.basename)(config.external.windowsExec);
                if (file === 'wt' || file === 'wt.exe') {
                    return true;
                }
            }
            return false;
        }
        _refreshOpenInTerminalMenuItemTitle() {
            if (this.isWindows()) {
                this._openInTerminalMenuItem.command.title = nls.localize('scopedConsoleAction.wt', "Open in Windows Terminal");
            }
        }
    };
    exports.ExternalTerminalContribution = ExternalTerminalContribution;
    exports.ExternalTerminalContribution = ExternalTerminalContribution = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], ExternalTerminalContribution);
    platform_2.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ExternalTerminalContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxUZXJtaW5hbC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVybmFsVGVybWluYWwvYnJvd3Nlci9leHRlcm5hbFRlcm1pbmFsLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQmhHLE1BQU0sMkJBQTJCLEdBQUcsZ0JBQWdCLENBQUM7SUFDckQsTUFBTSxzQ0FBc0MsR0FBRywwQkFBMEIsQ0FBQztJQUUxRSxTQUFTLDJCQUEyQixDQUFDLEVBQVUsRUFBRSxZQUF1QztRQUN2RiwyQkFBZ0IsQ0FBQyxlQUFlLENBQUM7WUFDaEMsRUFBRSxFQUFFLEVBQUU7WUFDTixPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFhLEVBQUUsRUFBRTtnQkFFMUMsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG9CQUFZLENBQUMsQ0FBQztnQkFDL0MsTUFBTSx5QkFBeUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUEwQixDQUFDLENBQUM7Z0JBQzNFLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3Q0FBbUIsQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0NBQXFCLENBQUMsQ0FBQztnQkFDakUsSUFBSSx1QkFBdUIsR0FBeUMsU0FBUyxDQUFDO2dCQUM5RSxJQUFJLENBQUM7b0JBQ0osdUJB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