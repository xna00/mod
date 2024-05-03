/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/quickinput/common/quickInput"], function (require, exports, nls, actions_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Actions
    (0, actions_1.registerAction2)(class ShowAllSymbolsAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.showAllSymbols'; }
        static { this.LABEL = nls.localize('showTriggerActions', "Go to Symbol in Workspace..."); }
        static { this.ALL_SYMBOLS_PREFIX = '#'; }
        constructor() {
            super({
                id: "workbench.action.showAllSymbols" /* Constants.SearchCommandIds.ShowAllSymbolsActionId */,
                title: {
                    ...nls.localize2('showTriggerActions', "Go to Symbol in Workspace..."),
                    mnemonicTitle: nls.localize({ key: 'miGotoSymbolInWorkspace', comment: ['&& denotes a mnemonic'] }, "Go to Symbol in &&Workspace..."),
                },
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 50 /* KeyCode.KeyT */
                },
                menu: {
                    id: actions_1.MenuId.MenubarGoMenu,
                    group: '3_global_nav',
                    order: 2
                }
            });
        }
        async run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(ShowAllSymbolsAction.ALL_SYMBOLS_PREFIX);
        }
    });
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc1N5bWJvbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvc2VhcmNoQWN0aW9uc1N5bWJvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyxpQkFBaUI7SUFDakIsSUFBQSx5QkFBZSxFQUFDLE1BQU0sb0JBQXFCLFNBQVEsaUJBQU87aUJBRXpDLE9BQUUsR0FBRyxpQ0FBaUMsQ0FBQztpQkFDdkMsVUFBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsOEJBQThCLENBQUMsQ0FBQztpQkFDM0UsdUJBQWtCLEdBQUcsR0FBRyxDQUFDO1FBRXpDO1lBRUMsS0FBSyxDQUFDO2dCQUNMLEVBQUUsMkZBQW1EO2dCQUNyRCxLQUFLLEVBQUU7b0JBQ04sR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLDhCQUE4QixDQUFDO29CQUN0RSxhQUFhLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSx5QkFBeUIsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsZ0NBQWdDLENBQUM7aUJBQ3JJO2dCQUNELEVBQUUsRUFBRSxJQUFJO2dCQUNSLFVBQVUsRUFBRTtvQkFDWCxNQUFNLDZDQUFtQztvQkFDekMsT0FBTyxFQUFFLGlEQUE2QjtpQkFDdEM7Z0JBQ0QsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGFBQWE7b0JBQ3hCLEtBQUssRUFBRSxjQUFjO29CQUNyQixLQUFLLEVBQUUsQ0FBQztpQkFDUjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQzVDLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDNUYsQ0FBQztLQUNELENBQUMsQ0FBQzs7QUFFSCxZQUFZIn0=