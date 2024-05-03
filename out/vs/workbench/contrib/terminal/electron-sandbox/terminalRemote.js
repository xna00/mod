/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/services/history/common/history"], function (require, exports, network_1, nls_1, environment_1, remoteAuthorityResolver_1, terminalActions_1, history_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerRemoteContributions = registerRemoteContributions;
    function registerRemoteContributions() {
        (0, terminalActions_1.registerTerminalAction)({
            id: "workbench.action.terminal.newLocal" /* TerminalCommandId.NewLocal */,
            title: (0, nls_1.localize2)('workbench.action.terminal.newLocal', 'Create New Integrated Terminal (Local)'),
            run: async (c, accessor) => {
                const historyService = accessor.get(history_1.IHistoryService);
                const remoteAuthorityResolverService = accessor.get(remoteAuthorityResolver_1.IRemoteAuthorityResolverService);
                const nativeEnvironmentService = accessor.get(environment_1.INativeEnvironmentService);
                let cwd;
                try {
                    const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.vscodeRemote);
                    if (activeWorkspaceRootUri) {
                        const canonicalUri = await remoteAuthorityResolverService.getCanonicalURI(activeWorkspaceRootUri);
                        if (canonicalUri.scheme === network_1.Schemas.file) {
                            cwd = canonicalUri;
                        }
                    }
                }
                catch { }
                if (!cwd) {
                    cwd = nativeEnvironmentService.userHome;
                }
                const instance = await c.service.createTerminal({ cwd });
                if (!instance) {
                    return Promise.resolve(undefined);
                }
                c.service.setActiveInstance(instance);
                return c.groupService.showPanel(true);
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxSZW1vdGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2VsZWN0cm9uLXNhbmRib3gvdGVybWluYWxSZW1vdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsa0VBOEJDO0lBOUJELFNBQWdCLDJCQUEyQjtRQUMxQyxJQUFBLHdDQUFzQixFQUFDO1lBQ3RCLEVBQUUsdUVBQTRCO1lBQzlCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxvQ0FBb0MsRUFBRSx3Q0FBd0MsQ0FBQztZQUNoRyxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRTtnQkFDMUIsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sOEJBQThCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5REFBK0IsQ0FBQyxDQUFDO2dCQUNyRixNQUFNLHdCQUF3QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXlCLENBQUMsQ0FBQztnQkFDekUsSUFBSSxHQUFvQixDQUFDO2dCQUN6QixJQUFJLENBQUM7b0JBQ0osTUFBTSxzQkFBc0IsR0FBRyxjQUFjLENBQUMsMEJBQTBCLENBQUMsaUJBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDL0YsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO3dCQUM1QixNQUFNLFlBQVksR0FBRyxNQUFNLDhCQUE4QixDQUFDLGVBQWUsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO3dCQUNsRyxJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0QkFDMUMsR0FBRyxHQUFHLFlBQVksQ0FBQzt3QkFDcEIsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDWCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ1YsR0FBRyxHQUFHLHdCQUF3QixDQUFDLFFBQVEsQ0FBQztnQkFDekMsQ0FBQztnQkFDRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDekQsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNmLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztnQkFFRCxDQUFDLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0QyxPQUFPLENBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7U0FDRCxDQUFDLENBQUM7SUFDSixDQUFDIn0=