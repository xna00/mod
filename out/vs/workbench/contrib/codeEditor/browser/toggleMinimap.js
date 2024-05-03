/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/action/common/actionCommonCategories"], function (require, exports, nls_1, actions_1, configuration_1, contextkey_1, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleMinimapAction = void 0;
    class ToggleMinimapAction extends actions_1.Action2 {
        static { this.ID = 'editor.action.toggleMinimap'; }
        constructor() {
            super({
                id: ToggleMinimapAction.ID,
                title: {
                    ...(0, nls_1.localize2)('toggleMinimap', "Toggle Minimap"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miMinimap', comment: ['&& denotes a mnemonic'] }, "&&Minimap"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                toggled: contextkey_1.ContextKeyExpr.equals('config.editor.minimap.enabled', true),
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '4_editor',
                    order: 1
                }
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('editor.minimap.enabled');
            return configurationService.updateValue('editor.minimap.enabled', newValue);
        }
    }
    exports.ToggleMinimapAction = ToggleMinimapAction;
    (0, actions_1.registerAction2)(ToggleMinimapAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlTWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL3RvZ2dsZU1pbmltYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsbUJBQW9CLFNBQVEsaUJBQU87aUJBRS9CLE9BQUUsR0FBRyw2QkFBNkIsQ0FBQztRQUVuRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsbUJBQW1CLENBQUMsRUFBRTtnQkFDMUIsS0FBSyxFQUFFO29CQUNOLEdBQUcsSUFBQSxlQUFTLEVBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDO29CQUMvQyxhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUM7aUJBQzlGO2dCQUNELFFBQVEsRUFBRSxtQ0FBVSxDQUFDLElBQUk7Z0JBQ3pCLEVBQUUsRUFBRSxJQUFJO2dCQUNSLE9BQU8sRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQywrQkFBK0IsRUFBRSxJQUFJLENBQUM7Z0JBQ3JFLElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxxQkFBcUI7b0JBQ2hDLEtBQUssRUFBRSxVQUFVO29CQUNqQixLQUFLLEVBQUUsQ0FBQztpQkFDUjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQzVDLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1lBRWpFLE1BQU0sUUFBUSxHQUFHLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDMUUsT0FBTyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsd0JBQXdCLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDN0UsQ0FBQzs7SUEzQkYsa0RBNEJDO0lBRUQsSUFBQSx5QkFBZSxFQUFDLG1CQUFtQixDQUFDLENBQUMifQ==