/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/workbench/common/configuration", "vs/workbench/common/contributions", "vs/workbench/contrib/sash/browser/sash", "vs/base/common/platform"], function (require, exports, nls_1, configurationRegistry_1, platform_1, configuration_1, contributions_1, sash_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Sash size contribution
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(sash_1.SashSettingsController, 3 /* LifecyclePhase.Restored */);
    // Sash size configuration contribution
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        ...configuration_1.workbenchConfigurationNodeBase,
        properties: {
            'workbench.sash.size': {
                type: 'number',
                default: platform_2.isIOS ? 20 : 4,
                minimum: 1,
                maximum: 20,
                description: (0, nls_1.localize)('sashSize', "Controls the feedback area size in pixels of the dragging area in between views/editors. Set it to a larger value if you feel it's hard to resize views using the mouse.")
            },
            'workbench.sash.hoverDelay': {
                type: 'number',
                default: 300,
                minimum: 0,
                maximum: 2000,
                description: (0, nls_1.localize)('sashHoverDelay', "Controls the hover feedback delay in milliseconds of the dragging area in between views/editors.")
            },
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FzaC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Nhc2gvYnJvd3Nlci9zYXNoLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyx5QkFBeUI7SUFDekIsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQztTQUN6RSw2QkFBNkIsQ0FBQyw2QkFBc0Isa0NBQTBCLENBQUM7SUFFakYsdUNBQXVDO0lBQ3ZDLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBdUIsQ0FBQyxhQUFhLENBQUM7U0FDeEUscUJBQXFCLENBQUM7UUFDdEIsR0FBRyw4Q0FBOEI7UUFDakMsVUFBVSxFQUFFO1lBQ1gscUJBQXFCLEVBQUU7Z0JBQ3RCLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxnQkFBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLE9BQU8sRUFBRSxDQUFDO2dCQUNWLE9BQU8sRUFBRSxFQUFFO2dCQUNYLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsMEtBQTBLLENBQUM7YUFDN007WUFDRCwyQkFBMkIsRUFBRTtnQkFDNUIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsT0FBTyxFQUFFLEdBQUc7Z0JBQ1osT0FBTyxFQUFFLENBQUM7Z0JBQ1YsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLGtHQUFrRyxDQUFDO2FBQzNJO1NBQ0Q7S0FDRCxDQUFDLENBQUMifQ==