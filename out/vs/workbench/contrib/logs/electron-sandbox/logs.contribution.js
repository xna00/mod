/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/workbench/contrib/logs/electron-sandbox/logsActions", "vs/platform/instantiation/common/instantiation"], function (require, exports, actionCommonCategories_1, actions_1, logsActions_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: logsActions_1.OpenLogsFolderAction.ID,
                title: logsActions_1.OpenLogsFolderAction.TITLE,
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(servicesAccessor) {
            return servicesAccessor.get(instantiation_1.IInstantiationService).createInstance(logsActions_1.OpenLogsFolderAction, logsActions_1.OpenLogsFolderAction.ID, logsActions_1.OpenLogsFolderAction.TITLE.value).run();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: logsActions_1.OpenExtensionLogsFolderAction.ID,
                title: logsActions_1.OpenExtensionLogsFolderAction.TITLE,
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(servicesAccessor) {
            return servicesAccessor.get(instantiation_1.IInstantiationService).createInstance(logsActions_1.OpenExtensionLogsFolderAction, logsActions_1.OpenExtensionLogsFolderAction.ID, logsActions_1.OpenExtensionLogsFolderAction.TITLE.value).run();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9ncy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvZ3MvZWxlY3Ryb24tc2FuZGJveC9sb2dzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxrQ0FBb0IsQ0FBQyxFQUFFO2dCQUMzQixLQUFLLEVBQUUsa0NBQW9CLENBQUMsS0FBSztnQkFDakMsUUFBUSxFQUFFLG1DQUFVLENBQUMsU0FBUztnQkFDOUIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsR0FBRyxDQUFDLGdCQUFrQztZQUNyQyxPQUFPLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxrQ0FBb0IsRUFBRSxrQ0FBb0IsQ0FBQyxFQUFFLEVBQUUsa0NBQW9CLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzFKLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwyQ0FBNkIsQ0FBQyxFQUFFO2dCQUNwQyxLQUFLLEVBQUUsMkNBQTZCLENBQUMsS0FBSztnQkFDMUMsUUFBUSxFQUFFLG1DQUFVLENBQUMsU0FBUztnQkFDOUIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsR0FBRyxDQUFDLGdCQUFrQztZQUNyQyxPQUFPLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDLGNBQWMsQ0FBQywyQ0FBNkIsRUFBRSwyQ0FBNkIsQ0FBQyxFQUFFLEVBQUUsMkNBQTZCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3JMLENBQUM7S0FDRCxDQUFDLENBQUMifQ==