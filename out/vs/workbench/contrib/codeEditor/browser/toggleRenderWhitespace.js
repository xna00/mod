/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/action/common/actionCommonCategories"], function (require, exports, nls_1, actions_1, configuration_1, contextkey_1, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ToggleRenderWhitespaceAction extends actions_1.Action2 {
        static { this.ID = 'editor.action.toggleRenderWhitespace'; }
        constructor() {
            super({
                id: ToggleRenderWhitespaceAction.ID,
                title: {
                    ...(0, nls_1.localize2)('toggleRenderWhitespace', "Toggle Render Whitespace"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miToggleRenderWhitespace', comment: ['&& denotes a mnemonic'] }, "&&Render Whitespace"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                toggled: contextkey_1.ContextKeyExpr.notEquals('config.editor.renderWhitespace', 'none'),
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '4_editor',
                    order: 4
                }
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const renderWhitespace = configurationService.getValue('editor.renderWhitespace');
            let newRenderWhitespace;
            if (renderWhitespace === 'none') {
                newRenderWhitespace = 'all';
            }
            else {
                newRenderWhitespace = 'none';
            }
            return configurationService.updateValue('editor.renderWhitespace', newRenderWhitespace);
        }
    }
    (0, actions_1.registerAction2)(ToggleRenderWhitespaceAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlUmVuZGVyV2hpdGVzcGFjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL3RvZ2dsZVJlbmRlcldoaXRlc3BhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsTUFBTSw0QkFBNkIsU0FBUSxpQkFBTztpQkFFakMsT0FBRSxHQUFHLHNDQUFzQyxDQUFDO1FBRTVEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw0QkFBNEIsQ0FBQyxFQUFFO2dCQUNuQyxLQUFLLEVBQUU7b0JBQ04sR0FBRyxJQUFBLGVBQVMsRUFBQyx3QkFBd0IsRUFBRSwwQkFBMEIsQ0FBQztvQkFDbEUsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLDBCQUEwQixFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQztpQkFDdkg7Z0JBQ0QsUUFBUSxFQUFFLG1DQUFVLENBQUMsSUFBSTtnQkFDekIsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsT0FBTyxFQUFFLDJCQUFjLENBQUMsU0FBUyxDQUFDLGdDQUFnQyxFQUFFLE1BQU0sQ0FBQztnQkFDM0UsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLHFCQUFxQjtvQkFDaEMsS0FBSyxFQUFFLFVBQVU7b0JBQ2pCLEtBQUssRUFBRSxDQUFDO2lCQUNSO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLEdBQUcsQ0FBQyxRQUEwQjtZQUN0QyxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUVqRSxNQUFNLGdCQUFnQixHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBUyx5QkFBeUIsQ0FBQyxDQUFDO1lBRTFGLElBQUksbUJBQTJCLENBQUM7WUFDaEMsSUFBSSxnQkFBZ0IsS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDakMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1lBQzdCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxtQkFBbUIsR0FBRyxNQUFNLENBQUM7WUFDOUIsQ0FBQztZQUVELE9BQU8sb0JBQW9CLENBQUMsV0FBVyxDQUFDLHlCQUF5QixFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDekYsQ0FBQzs7SUFHRixJQUFBLHlCQUFlLEVBQUMsNEJBQTRCLENBQUMsQ0FBQyJ9