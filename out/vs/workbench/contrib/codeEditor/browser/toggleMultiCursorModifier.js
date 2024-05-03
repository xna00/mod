/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/common/contributions"], function (require, exports, nls_1, platform_1, actions_1, configuration_1, contextkey_1, platform_2, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleMultiCursorModifierAction = void 0;
    class ToggleMultiCursorModifierAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.toggleMultiCursorModifier'; }
        static { this.multiCursorModifierConfigurationKey = 'editor.multiCursorModifier'; }
        constructor() {
            super({
                id: ToggleMultiCursorModifierAction.ID,
                title: (0, nls_1.localize2)('toggleLocation', 'Toggle Multi-Cursor Modifier'),
                f1: true
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const editorConf = configurationService.getValue('editor');
            const newValue = (editorConf.multiCursorModifier === 'ctrlCmd' ? 'alt' : 'ctrlCmd');
            return configurationService.updateValue(ToggleMultiCursorModifierAction.multiCursorModifierConfigurationKey, newValue);
        }
    }
    exports.ToggleMultiCursorModifierAction = ToggleMultiCursorModifierAction;
    const multiCursorModifier = new contextkey_1.RawContextKey('multiCursorModifier', 'altKey');
    let MultiCursorModifierContextKeyController = class MultiCursorModifierContextKeyController {
        constructor(configurationService, contextKeyService) {
            this.configurationService = configurationService;
            this._multiCursorModifier = multiCursorModifier.bindTo(contextKeyService);
            this._update();
            configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('editor.multiCursorModifier')) {
                    this._update();
                }
            });
        }
        _update() {
            const editorConf = this.configurationService.getValue('editor');
            const value = (editorConf.multiCursorModifier === 'ctrlCmd' ? 'ctrlCmd' : 'altKey');
            this._multiCursorModifier.set(value);
        }
    };
    MultiCursorModifierContextKeyController = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, contextkey_1.IContextKeyService)
    ], MultiCursorModifierContextKeyController);
    platform_2.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(MultiCursorModifierContextKeyController, 3 /* LifecyclePhase.Restored */);
    (0, actions_1.registerAction2)(ToggleMultiCursorModifierAction);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSelectionMenu, {
        group: '4_config',
        command: {
            id: ToggleMultiCursorModifierAction.ID,
            title: (0, nls_1.localize)('miMultiCursorAlt', "Switch to Alt+Click for Multi-Cursor")
        },
        when: multiCursorModifier.isEqualTo('ctrlCmd'),
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSelectionMenu, {
        group: '4_config',
        command: {
            id: ToggleMultiCursorModifierAction.ID,
            title: (platform_1.isMacintosh
                ? (0, nls_1.localize)('miMultiCursorCmd', "Switch to Cmd+Click for Multi-Cursor")
                : (0, nls_1.localize)('miMultiCursorCtrl', "Switch to Ctrl+Click for Multi-Cursor"))
        },
        when: multiCursorModifier.isEqualTo('altKey'),
        order: 1
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlTXVsdGlDdXJzb3JNb2RpZmllci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL3RvZ2dsZU11bHRpQ3Vyc29yTW9kaWZpZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWWhHLE1BQWEsK0JBQWdDLFNBQVEsaUJBQU87aUJBRTNDLE9BQUUsR0FBRyw0Q0FBNEMsQ0FBQztpQkFFMUMsd0NBQW1DLEdBQUcsNEJBQTRCLENBQUM7UUFFM0Y7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLCtCQUErQixDQUFDLEVBQUU7Z0JBQ3RDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxnQkFBZ0IsRUFBRSw4QkFBOEIsQ0FBQztnQkFDbEUsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsR0FBRyxDQUFDLFFBQTBCO1lBQ3RDLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1lBRWpFLE1BQU0sVUFBVSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBNkMsUUFBUSxDQUFDLENBQUM7WUFDdkcsTUFBTSxRQUFRLEdBQXNCLENBQUMsVUFBVSxDQUFDLG1CQUFtQixLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUV2RyxPQUFPLG9CQUFvQixDQUFDLFdBQVcsQ0FBQywrQkFBK0IsQ0FBQyxtQ0FBbUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4SCxDQUFDOztJQXJCRiwwRUFzQkM7SUFFRCxNQUFNLG1CQUFtQixHQUFHLElBQUksMEJBQWEsQ0FBUyxxQkFBcUIsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUV2RixJQUFNLHVDQUF1QyxHQUE3QyxNQUFNLHVDQUF1QztRQUk1QyxZQUN5QyxvQkFBMkMsRUFDL0QsaUJBQXFDO1lBRGpCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFHbkYsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRTFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25ELElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLDRCQUE0QixDQUFDLEVBQUUsQ0FBQztvQkFDMUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sT0FBTztZQUNkLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQTZDLFFBQVEsQ0FBQyxDQUFDO1lBQzVHLE1BQU0sS0FBSyxHQUFHLENBQUMsVUFBVSxDQUFDLG1CQUFtQixLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwRixJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLENBQUM7S0FDRCxDQUFBO0lBdkJLLHVDQUF1QztRQUsxQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsK0JBQWtCLENBQUE7T0FOZix1Q0FBdUMsQ0F1QjVDO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLHVDQUF1QyxrQ0FBMEIsQ0FBQztJQUU1SyxJQUFBLHlCQUFlLEVBQUMsK0JBQStCLENBQUMsQ0FBQztJQUVqRCxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLG9CQUFvQixFQUFFO1FBQ3hELEtBQUssRUFBRSxVQUFVO1FBQ2pCLE9BQU8sRUFBRTtZQUNSLEVBQUUsRUFBRSwrQkFBK0IsQ0FBQyxFQUFFO1lBQ3RDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxzQ0FBc0MsQ0FBQztTQUMzRTtRQUNELElBQUksRUFBRSxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO1FBQzlDLEtBQUssRUFBRSxDQUFDO0tBQ1IsQ0FBQyxDQUFDO0lBQ0gsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxvQkFBb0IsRUFBRTtRQUN4RCxLQUFLLEVBQUUsVUFBVTtRQUNqQixPQUFPLEVBQUU7WUFDUixFQUFFLEVBQUUsK0JBQStCLENBQUMsRUFBRTtZQUN0QyxLQUFLLEVBQUUsQ0FDTixzQkFBVztnQkFDVixDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsc0NBQXNDLENBQUM7Z0JBQ3RFLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSx1Q0FBdUMsQ0FBQyxDQUN6RTtTQUNEO1FBQ0QsSUFBSSxFQUFFLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFDN0MsS0FBSyxFQUFFLENBQUM7S0FDUixDQUFDLENBQUMifQ==