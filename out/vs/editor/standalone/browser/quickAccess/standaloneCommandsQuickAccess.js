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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/editor/common/standaloneStrings", "vs/editor/browser/services/codeEditorService", "vs/editor/contrib/quickAccess/browser/commandsQuickAccess", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/platform/dialogs/common/dialogs", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/quickinput/common/quickInput"], function (require, exports, platform_1, quickAccess_1, standaloneStrings_1, codeEditorService_1, commandsQuickAccess_1, instantiation_1, keybinding_1, commands_1, telemetry_1, dialogs_1, editorExtensions_1, editorContextKeys_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoLineAction = exports.StandaloneCommandsQuickAccessProvider = void 0;
    let StandaloneCommandsQuickAccessProvider = class StandaloneCommandsQuickAccessProvider extends commandsQuickAccess_1.AbstractEditorCommandsQuickAccessProvider {
        get activeTextEditorControl() { return this.codeEditorService.getFocusedCodeEditor() ?? undefined; }
        constructor(instantiationService, codeEditorService, keybindingService, commandService, telemetryService, dialogService) {
            super({ showAlias: false }, instantiationService, keybindingService, commandService, telemetryService, dialogService);
            this.codeEditorService = codeEditorService;
        }
        async getCommandPicks() {
            return this.getCodeEditorCommandPicks();
        }
        hasAdditionalCommandPicks() {
            return false;
        }
        async getAdditionalCommandPicks() {
            return [];
        }
    };
    exports.StandaloneCommandsQuickAccessProvider = StandaloneCommandsQuickAccessProvider;
    exports.StandaloneCommandsQuickAccessProvider = StandaloneCommandsQuickAccessProvider = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, commands_1.ICommandService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, dialogs_1.IDialogService)
    ], StandaloneCommandsQuickAccessProvider);
    class GotoLineAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.quickCommand'; }
        constructor() {
            super({
                id: GotoLineAction.ID,
                label: standaloneStrings_1.QuickCommandNLS.quickCommandActionLabel,
                alias: 'Command Palette',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 59 /* KeyCode.F1 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: 'z_commands',
                    order: 1
                }
            });
        }
        run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(StandaloneCommandsQuickAccessProvider.PREFIX);
        }
    }
    exports.GotoLineAction = GotoLineAction;
    (0, editorExtensions_1.registerEditorAction)(GotoLineAction);
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: StandaloneCommandsQuickAccessProvider,
        prefix: StandaloneCommandsQuickAccessProvider.PREFIX,
        helpEntries: [{ description: standaloneStrings_1.QuickCommandNLS.quickCommandHelp, commandId: GotoLineAction.ID }]
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUNvbW1hbmRzUXVpY2tBY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9zdGFuZGFsb25lL2Jyb3dzZXIvcXVpY2tBY2Nlc3Mvc3RhbmRhbG9uZUNvbW1hbmRzUXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0J6RixJQUFNLHFDQUFxQyxHQUEzQyxNQUFNLHFDQUFzQyxTQUFRLCtEQUF5QztRQUVuRyxJQUFjLHVCQUF1QixLQUEwQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFFbkksWUFDd0Isb0JBQTJDLEVBQzdCLGlCQUFxQyxFQUN0RCxpQkFBcUMsRUFDeEMsY0FBK0IsRUFDN0IsZ0JBQW1DLEVBQ3RDLGFBQTZCO1lBRTdDLEtBQUssQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFOakYsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtRQU8zRSxDQUFDO1FBRVMsS0FBSyxDQUFDLGVBQWU7WUFDOUIsT0FBTyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUN6QyxDQUFDO1FBRVMseUJBQXlCO1lBQ2xDLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVTLEtBQUssQ0FBQyx5QkFBeUI7WUFDeEMsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO0tBQ0QsQ0FBQTtJQTFCWSxzRkFBcUM7b0RBQXJDLHFDQUFxQztRQUsvQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLDBCQUFlLENBQUE7UUFDZixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsd0JBQWMsQ0FBQTtPQVZKLHFDQUFxQyxDQTBCakQ7SUFFRCxNQUFhLGNBQWUsU0FBUSwrQkFBWTtpQkFFL0IsT0FBRSxHQUFHLDRCQUE0QixDQUFDO1FBRWxEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxjQUFjLENBQUMsRUFBRTtnQkFDckIsS0FBSyxFQUFFLG1DQUFlLENBQUMsdUJBQXVCO2dCQUM5QyxLQUFLLEVBQUUsaUJBQWlCO2dCQUN4QixZQUFZLEVBQUUsU0FBUztnQkFDdkIsTUFBTSxFQUFFO29CQUNQLE1BQU0sRUFBRSxxQ0FBaUIsQ0FBQyxLQUFLO29CQUMvQixPQUFPLHFCQUFZO29CQUNuQixNQUFNLDBDQUFnQztpQkFDdEM7Z0JBQ0QsZUFBZSxFQUFFO29CQUNoQixLQUFLLEVBQUUsWUFBWTtvQkFDbkIsS0FBSyxFQUFFLENBQUM7aUJBQ1I7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCO1lBQzdCLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLHFDQUFxQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pHLENBQUM7O0lBeEJGLHdDQXlCQztJQUVELElBQUEsdUNBQW9CLEVBQUMsY0FBYyxDQUFDLENBQUM7SUFFckMsbUJBQVEsQ0FBQyxFQUFFLENBQXVCLHdCQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsMkJBQTJCLENBQUM7UUFDckYsSUFBSSxFQUFFLHFDQUFxQztRQUMzQyxNQUFNLEVBQUUscUNBQXFDLENBQUMsTUFBTTtRQUNwRCxXQUFXLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxtQ0FBZSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxjQUFjLENBQUMsRUFBRSxFQUFFLENBQUM7S0FDOUYsQ0FBQyxDQUFDIn0=