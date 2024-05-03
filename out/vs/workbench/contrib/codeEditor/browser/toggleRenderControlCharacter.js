/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/action/common/actionCommonCategories"], function (require, exports, nls_1, actions_1, configuration_1, contextkey_1, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleRenderControlCharacterAction = void 0;
    class ToggleRenderControlCharacterAction extends actions_1.Action2 {
        static { this.ID = 'editor.action.toggleRenderControlCharacter'; }
        constructor() {
            super({
                id: ToggleRenderControlCharacterAction.ID,
                title: {
                    ...(0, nls_1.localize2)('toggleRenderControlCharacters', "Toggle Control Characters"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miToggleRenderControlCharacters', comment: ['&& denotes a mnemonic'] }, "Render &&Control Characters"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                toggled: contextkey_1.ContextKeyExpr.equals('config.editor.renderControlCharacters', true),
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '4_editor',
                    order: 5
                }
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newRenderControlCharacters = !configurationService.getValue('editor.renderControlCharacters');
            return configurationService.updateValue('editor.renderControlCharacters', newRenderControlCharacters);
        }
    }
    exports.ToggleRenderControlCharacterAction = ToggleRenderControlCharacterAction;
    (0, actions_1.registerAction2)(ToggleRenderControlCharacterAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlUmVuZGVyQ29udHJvbENoYXJhY3Rlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL3RvZ2dsZVJlbmRlckNvbnRyb2xDaGFyYWN0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsa0NBQW1DLFNBQVEsaUJBQU87aUJBRTlDLE9BQUUsR0FBRyw0Q0FBNEMsQ0FBQztRQUVsRTtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsa0NBQWtDLENBQUMsRUFBRTtnQkFDekMsS0FBSyxFQUFFO29CQUNOLEdBQUcsSUFBQSxlQUFTLEVBQUMsK0JBQStCLEVBQUUsMkJBQTJCLENBQUM7b0JBQzFFLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxpQ0FBaUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsNkJBQTZCLENBQUM7aUJBQ3RJO2dCQUNELFFBQVEsRUFBRSxtQ0FBVSxDQUFDLElBQUk7Z0JBQ3pCLEVBQUUsRUFBRSxJQUFJO2dCQUNSLE9BQU8sRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyx1Q0FBdUMsRUFBRSxJQUFJLENBQUM7Z0JBQzdFLElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxxQkFBcUI7b0JBQ2hDLEtBQUssRUFBRSxVQUFVO29CQUNqQixLQUFLLEVBQUUsQ0FBQztpQkFDUjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxHQUFHLENBQUMsUUFBMEI7WUFDdEMsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFFakUsTUFBTSwwQkFBMEIsR0FBRyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQzdHLE9BQU8sb0JBQW9CLENBQUMsV0FBVyxDQUFDLGdDQUFnQyxFQUFFLDBCQUEwQixDQUFDLENBQUM7UUFDdkcsQ0FBQzs7SUEzQkYsZ0ZBNEJDO0lBRUQsSUFBQSx5QkFBZSxFQUFDLGtDQUFrQyxDQUFDLENBQUMifQ==