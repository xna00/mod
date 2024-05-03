/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iconLabels", "vs/platform/quickinput/browser/commandsQuickAccess"], function (require, exports, iconLabels_1, commandsQuickAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractEditorCommandsQuickAccessProvider = void 0;
    class AbstractEditorCommandsQuickAccessProvider extends commandsQuickAccess_1.AbstractCommandsQuickAccessProvider {
        constructor(options, instantiationService, keybindingService, commandService, telemetryService, dialogService) {
            super(options, instantiationService, keybindingService, commandService, telemetryService, dialogService);
        }
        getCodeEditorCommandPicks() {
            const activeTextEditorControl = this.activeTextEditorControl;
            if (!activeTextEditorControl) {
                return [];
            }
            const editorCommandPicks = [];
            for (const editorAction of activeTextEditorControl.getSupportedActions()) {
                editorCommandPicks.push({
                    commandId: editorAction.id,
                    commandAlias: editorAction.alias,
                    label: (0, iconLabels_1.stripIcons)(editorAction.label) || editorAction.id,
                });
            }
            return editorCommandPicks;
        }
    }
    exports.AbstractEditorCommandsQuickAccessProvider = AbstractEditorCommandsQuickAccessProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHNRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvcXVpY2tBY2Nlc3MvYnJvd3Nlci9jb21tYW5kc1F1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFzQix5Q0FBMEMsU0FBUSx5REFBbUM7UUFFMUcsWUFDQyxPQUFvQyxFQUNwQyxvQkFBMkMsRUFDM0MsaUJBQXFDLEVBQ3JDLGNBQStCLEVBQy9CLGdCQUFtQyxFQUNuQyxhQUE2QjtZQUU3QixLQUFLLENBQUMsT0FBTyxFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUMxRyxDQUFDO1FBT1MseUJBQXlCO1lBQ2xDLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDO1lBQzdELElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUM5QixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxNQUFNLGtCQUFrQixHQUF3QixFQUFFLENBQUM7WUFDbkQsS0FBSyxNQUFNLFlBQVksSUFBSSx1QkFBdUIsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUM7Z0JBQzFFLGtCQUFrQixDQUFDLElBQUksQ0FBQztvQkFDdkIsU0FBUyxFQUFFLFlBQVksQ0FBQyxFQUFFO29CQUMxQixZQUFZLEVBQUUsWUFBWSxDQUFDLEtBQUs7b0JBQ2hDLEtBQUssRUFBRSxJQUFBLHVCQUFVLEVBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLFlBQVksQ0FBQyxFQUFFO2lCQUN4RCxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsT0FBTyxrQkFBa0IsQ0FBQztRQUMzQixDQUFDO0tBQ0Q7SUFuQ0QsOEZBbUNDIn0=