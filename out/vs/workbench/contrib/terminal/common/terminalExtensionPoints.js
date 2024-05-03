/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri"], function (require, exports, extensionsRegistry, terminal_1, instantiation_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalContributionService = exports.ITerminalContributionService = void 0;
    // terminal extension point
    const terminalsExtPoint = extensionsRegistry.ExtensionsRegistry.registerExtensionPoint(terminal_1.terminalContributionsDescriptor);
    exports.ITerminalContributionService = (0, instantiation_1.createDecorator)('terminalContributionsService');
    class TerminalContributionService {
        get terminalProfiles() { return this._terminalProfiles; }
        constructor() {
            this._terminalProfiles = [];
            terminalsExtPoint.setHandler(contributions => {
                this._terminalProfiles = contributions.map(c => {
                    return c.value?.profiles?.filter(p => hasValidTerminalIcon(p)).map(e => {
                        return { ...e, extensionIdentifier: c.description.identifier.value };
                    }) || [];
                }).flat();
            });
        }
    }
    exports.TerminalContributionService = TerminalContributionService;
    function hasValidTerminalIcon(profile) {
        return !profile.icon ||
            (typeof profile.icon === 'string' ||
                uri_1.URI.isUri(profile.icon) ||
                ('light' in profile.icon && 'dark' in profile.icon &&
                    uri_1.URI.isUri(profile.icon.light) && uri_1.URI.isUri(profile.icon.dark)));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFeHRlbnNpb25Qb2ludHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2NvbW1vbi90ZXJtaW5hbEV4dGVuc2lvblBvaW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsMkJBQTJCO0lBQzNCLE1BQU0saUJBQWlCLEdBQUcsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsc0JBQXNCLENBQXlCLDBDQUErQixDQUFDLENBQUM7SUFRbkksUUFBQSw0QkFBNEIsR0FBRyxJQUFBLCtCQUFlLEVBQStCLDhCQUE4QixDQUFDLENBQUM7SUFFMUgsTUFBYSwyQkFBMkI7UUFJdkMsSUFBSSxnQkFBZ0IsS0FBSyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFFekQ7WUFIUSxzQkFBaUIsR0FBNkMsRUFBRSxDQUFDO1lBSXhFLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsRUFBRTtnQkFDNUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzlDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQ3RFLE9BQU8sRUFBRSxHQUFHLENBQUMsRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDdEUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNWLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1gsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFmRCxrRUFlQztJQUVELFNBQVMsb0JBQW9CLENBQUMsT0FBcUM7UUFDbEUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJO1lBQ25CLENBQ0MsT0FBTyxPQUFPLENBQUMsSUFBSSxLQUFLLFFBQVE7Z0JBQ2hDLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztnQkFDdkIsQ0FDQyxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksSUFBSSxNQUFNLElBQUksT0FBTyxDQUFDLElBQUk7b0JBQ2pELFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQzdELENBQ0QsQ0FBQztJQUNKLENBQUMifQ==