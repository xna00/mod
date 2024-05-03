/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, nls, platform_1, configurationRegistry_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DispatchConfig = void 0;
    exports.readKeyboardConfig = readKeyboardConfig;
    var DispatchConfig;
    (function (DispatchConfig) {
        DispatchConfig[DispatchConfig["Code"] = 0] = "Code";
        DispatchConfig[DispatchConfig["KeyCode"] = 1] = "KeyCode";
    })(DispatchConfig || (exports.DispatchConfig = DispatchConfig = {}));
    function readKeyboardConfig(configurationService) {
        const keyboard = configurationService.getValue('keyboard');
        const dispatch = (keyboard?.dispatch === 'keyCode' ? 1 /* DispatchConfig.KeyCode */ : 0 /* DispatchConfig.Code */);
        const mapAltGrToCtrlAlt = Boolean(keyboard?.mapAltGrToCtrlAlt);
        return { dispatch, mapAltGrToCtrlAlt };
    }
    const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const keyboardConfiguration = {
        'id': 'keyboard',
        'order': 15,
        'type': 'object',
        'title': nls.localize('keyboardConfigurationTitle', "Keyboard"),
        'properties': {
            'keyboard.dispatch': {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                type: 'string',
                enum: ['code', 'keyCode'],
                default: 'code',
                markdownDescription: nls.localize('dispatch', "Controls the dispatching logic for key presses to use either `code` (recommended) or `keyCode`."),
                included: platform_1.OS === 2 /* OperatingSystem.Macintosh */ || platform_1.OS === 3 /* OperatingSystem.Linux */
            },
            'keyboard.mapAltGrToCtrlAlt': {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                type: 'boolean',
                default: false,
                markdownDescription: nls.localize('mapAltGrToCtrlAlt', "Controls if the AltGraph+ modifier should be treated as Ctrl+Alt+."),
                included: platform_1.OS === 1 /* OperatingSystem.Windows */
            }
        }
    };
    configurationRegistry.registerConfiguration(keyboardConfiguration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmRDb25maWcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2tleWJvYXJkTGF5b3V0L2NvbW1vbi9rZXlib2FyZENvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLGdEQUtDO0lBZkQsSUFBa0IsY0FHakI7SUFIRCxXQUFrQixjQUFjO1FBQy9CLG1EQUFJLENBQUE7UUFDSix5REFBTyxDQUFBO0lBQ1IsQ0FBQyxFQUhpQixjQUFjLDhCQUFkLGNBQWMsUUFHL0I7SUFPRCxTQUFnQixrQkFBa0IsQ0FBQyxvQkFBMkM7UUFDN0UsTUFBTSxRQUFRLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUF3RCxVQUFVLENBQUMsQ0FBQztRQUNsSCxNQUFNLFFBQVEsR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLEtBQUssU0FBUyxDQUFDLENBQUMsZ0NBQXdCLENBQUMsNEJBQW9CLENBQUMsQ0FBQztRQUNuRyxNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUMvRCxPQUFPLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLENBQUM7SUFDeEMsQ0FBQztJQUVELE1BQU0scUJBQXFCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2xHLE1BQU0scUJBQXFCLEdBQXVCO1FBQ2pELElBQUksRUFBRSxVQUFVO1FBQ2hCLE9BQU8sRUFBRSxFQUFFO1FBQ1gsTUFBTSxFQUFFLFFBQVE7UUFDaEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLEVBQUUsVUFBVSxDQUFDO1FBQy9ELFlBQVksRUFBRTtZQUNiLG1CQUFtQixFQUFFO2dCQUNwQixLQUFLLHdDQUFnQztnQkFDckMsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQztnQkFDekIsT0FBTyxFQUFFLE1BQU07Z0JBQ2YsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsaUdBQWlHLENBQUM7Z0JBQ2hKLFFBQVEsRUFBRSxhQUFFLHNDQUE4QixJQUFJLGFBQUUsa0NBQTBCO2FBQzFFO1lBQ0QsNEJBQTRCLEVBQUU7Z0JBQzdCLEtBQUssd0NBQWdDO2dCQUNyQyxJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsS0FBSztnQkFDZCxtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLG9FQUFvRSxDQUFDO2dCQUM1SCxRQUFRLEVBQUUsYUFBRSxvQ0FBNEI7YUFDeEM7U0FDRDtLQUNELENBQUM7SUFFRixxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDIn0=