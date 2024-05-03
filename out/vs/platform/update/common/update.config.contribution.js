/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, platform_1, nls_1, configurationRegistry_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'update',
        order: 15,
        title: (0, nls_1.localize)('updateConfigurationTitle', "Update"),
        type: 'object',
        properties: {
            'update.mode': {
                type: 'string',
                enum: ['none', 'manual', 'start', 'default'],
                default: 'default',
                scope: 1 /* ConfigurationScope.APPLICATION */,
                description: (0, nls_1.localize)('updateMode', "Configure whether you receive automatic updates. Requires a restart after change. The updates are fetched from a Microsoft online service."),
                tags: ['usesOnlineServices'],
                enumDescriptions: [
                    (0, nls_1.localize)('none', "Disable updates."),
                    (0, nls_1.localize)('manual', "Disable automatic background update checks. Updates will be available if you manually check for updates."),
                    (0, nls_1.localize)('start', "Check for updates only on startup. Disable automatic background update checks."),
                    (0, nls_1.localize)('default', "Enable automatic update checks. Code will check for updates automatically and periodically.")
                ],
                policy: {
                    name: 'UpdateMode',
                    minimumVersion: '1.67',
                }
            },
            'update.channel': {
                type: 'string',
                default: 'default',
                scope: 1 /* ConfigurationScope.APPLICATION */,
                description: (0, nls_1.localize)('updateMode', "Configure whether you receive automatic updates. Requires a restart after change. The updates are fetched from a Microsoft online service."),
                deprecationMessage: (0, nls_1.localize)('deprecated', "This setting is deprecated, please use '{0}' instead.", 'update.mode')
            },
            'update.enableWindowsBackgroundUpdates': {
                type: 'boolean',
                default: true,
                scope: 1 /* ConfigurationScope.APPLICATION */,
                title: (0, nls_1.localize)('enableWindowsBackgroundUpdatesTitle', "Enable Background Updates on Windows"),
                description: (0, nls_1.localize)('enableWindowsBackgroundUpdates', "Enable to download and install new VS Code versions in the background on Windows."),
                included: platform_1.isWindows && !platform_1.isWeb
            },
            'update.showReleaseNotes': {
                type: 'boolean',
                default: true,
                scope: 1 /* ConfigurationScope.APPLICATION */,
                description: (0, nls_1.localize)('showReleaseNotes', "Show Release Notes after an update. The Release Notes are fetched from a Microsoft online service."),
                tags: ['usesOnlineServices']
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLmNvbmZpZy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VwZGF0ZS9jb21tb24vdXBkYXRlLmNvbmZpZy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsTUFBTSxxQkFBcUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDekcscUJBQXFCLENBQUMscUJBQXFCLENBQUM7UUFDM0MsRUFBRSxFQUFFLFFBQVE7UUFDWixLQUFLLEVBQUUsRUFBRTtRQUNULEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSxRQUFRLENBQUM7UUFDckQsSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDWCxhQUFhLEVBQUU7Z0JBQ2QsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDO2dCQUM1QyxPQUFPLEVBQUUsU0FBUztnQkFDbEIsS0FBSyx3Q0FBZ0M7Z0JBQ3JDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsNElBQTRJLENBQUM7Z0JBQ2pMLElBQUksRUFBRSxDQUFDLG9CQUFvQixDQUFDO2dCQUM1QixnQkFBZ0IsRUFBRTtvQkFDakIsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLGtCQUFrQixDQUFDO29CQUNwQyxJQUFBLGNBQVEsRUFBQyxRQUFRLEVBQUUsMEdBQTBHLENBQUM7b0JBQzlILElBQUEsY0FBUSxFQUFDLE9BQU8sRUFBRSxnRkFBZ0YsQ0FBQztvQkFDbkcsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLDZGQUE2RixDQUFDO2lCQUNsSDtnQkFDRCxNQUFNLEVBQUU7b0JBQ1AsSUFBSSxFQUFFLFlBQVk7b0JBQ2xCLGNBQWMsRUFBRSxNQUFNO2lCQUN0QjthQUNEO1lBQ0QsZ0JBQWdCLEVBQUU7Z0JBQ2pCLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxTQUFTO2dCQUNsQixLQUFLLHdDQUFnQztnQkFDckMsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSw0SUFBNEksQ0FBQztnQkFDakwsa0JBQWtCLEVBQUUsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLHVEQUF1RCxFQUFFLGFBQWEsQ0FBQzthQUNsSDtZQUNELHVDQUF1QyxFQUFFO2dCQUN4QyxJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsSUFBSTtnQkFDYixLQUFLLHdDQUFnQztnQkFDckMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHFDQUFxQyxFQUFFLHNDQUFzQyxDQUFDO2dCQUM5RixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsbUZBQW1GLENBQUM7Z0JBQzVJLFFBQVEsRUFBRSxvQkFBUyxJQUFJLENBQUMsZ0JBQUs7YUFDN0I7WUFDRCx5QkFBeUIsRUFBRTtnQkFDMUIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsS0FBSyx3Q0FBZ0M7Z0JBQ3JDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxvR0FBb0csQ0FBQztnQkFDL0ksSUFBSSxFQUFFLENBQUMsb0JBQW9CLENBQUM7YUFDNUI7U0FDRDtLQUNELENBQUMsQ0FBQyJ9