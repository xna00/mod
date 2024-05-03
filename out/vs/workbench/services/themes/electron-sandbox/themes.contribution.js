/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/platform"], function (require, exports, nls_1, platform_1, configurationRegistry_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        'properties': {
            'window.systemColorTheme': {
                'type': 'string',
                'enum': ['default', 'auto', 'light', 'dark'],
                'enumDescriptions': [
                    (0, nls_1.localize)('window.systemColorTheme.default', "System color theme matches the configured OS theme."),
                    (0, nls_1.localize)('window.systemColorTheme.auto', "Enforce a light system color theme when a light workbench color theme is configured and the same for configured dark workbench color themes."),
                    (0, nls_1.localize)('window.systemColorTheme.light', "Enforce a light system color theme."),
                    (0, nls_1.localize)('window.systemColorTheme.dark', "Enforce a dark system color theme."),
                ],
                'markdownDescription': (0, nls_1.localize)('window.systemColorTheme', "The system color theme applies to native UI elements such as native dialogs, menus and title bar. Even if your OS is configured in light appearance mode, you can select a dark system color theme for the window. You can also configure to automatically adjust based on the `#workbench.colorTheme#` setting."),
                'default': 'default',
                'included': !platform_2.isLinux, // not supported on Linux (https://github.com/electron/electron/issues/28887)
                'scope': 1 /* ConfigurationScope.APPLICATION */
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVzLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RoZW1lcy9lbGVjdHJvbi1zYW5kYm94L3RoZW1lcy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsTUFBTSxxQkFBcUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDekcscUJBQXFCLENBQUMscUJBQXFCLENBQUM7UUFDM0MsWUFBWSxFQUFFO1lBQ2IseUJBQXlCLEVBQUU7Z0JBQzFCLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixNQUFNLEVBQUUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUM7Z0JBQzVDLGtCQUFrQixFQUFFO29CQUNuQixJQUFBLGNBQVEsRUFBQyxpQ0FBaUMsRUFBRSxxREFBcUQsQ0FBQztvQkFDbEcsSUFBQSxjQUFRLEVBQUMsOEJBQThCLEVBQUUsOElBQThJLENBQUM7b0JBQ3hMLElBQUEsY0FBUSxFQUFDLCtCQUErQixFQUFFLHFDQUFxQyxDQUFDO29CQUNoRixJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSxvQ0FBb0MsQ0FBQztpQkFDOUU7Z0JBQ0QscUJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsa1RBQWtULENBQUM7Z0JBQzlXLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixVQUFVLEVBQUUsQ0FBQyxrQkFBTyxFQUFFLDZFQUE2RTtnQkFDbkcsT0FBTyx3Q0FBZ0M7YUFDdkM7U0FDRDtLQUNELENBQUMsQ0FBQyJ9