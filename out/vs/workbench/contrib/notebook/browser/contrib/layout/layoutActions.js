/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, nls_1, actions_1, configuration_1, coreActions_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleCellToolbarPositionAction = void 0;
    const TOGGLE_CELL_TOOLBAR_POSITION = 'notebook.toggleCellToolbarPosition';
    class ToggleCellToolbarPositionAction extends actions_1.Action2 {
        constructor() {
            super({
                id: TOGGLE_CELL_TOOLBAR_POSITION,
                title: (0, nls_1.localize2)('notebook.toggleCellToolbarPosition', 'Toggle Cell Toolbar Position'),
                menu: [{
                        id: actions_1.MenuId.NotebookCellTitle,
                        group: 'View',
                        order: 1
                    }],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: false
            });
        }
        async run(accessor, context) {
            const editor = context && context.ui ? context.notebookEditor : undefined;
            if (editor && editor.hasModel()) {
                // from toolbar
                const viewType = editor.textModel.viewType;
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const toolbarPosition = configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarLocation);
                const newConfig = this.togglePosition(viewType, toolbarPosition);
                await configurationService.updateValue(notebookCommon_1.NotebookSetting.cellToolbarLocation, newConfig);
            }
        }
        togglePosition(viewType, toolbarPosition) {
            if (typeof toolbarPosition === 'string') {
                // legacy
                if (['left', 'right', 'hidden'].indexOf(toolbarPosition) >= 0) {
                    // valid position
                    const newViewValue = toolbarPosition === 'right' ? 'left' : 'right';
                    const config = {
                        default: toolbarPosition
                    };
                    config[viewType] = newViewValue;
                    return config;
                }
                else {
                    // invalid position
                    const config = {
                        default: 'right',
                    };
                    config[viewType] = 'left';
                    return config;
                }
            }
            else {
                const oldValue = toolbarPosition[viewType] ?? toolbarPosition['default'] ?? 'right';
                const newViewValue = oldValue === 'right' ? 'left' : 'right';
                const newConfig = {
                    ...toolbarPosition
                };
                newConfig[viewType] = newViewValue;
                return newConfig;
            }
        }
    }
    exports.ToggleCellToolbarPositionAction = ToggleCellToolbarPositionAction;
    (0, actions_1.registerAction2)(ToggleCellToolbarPositionAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2xheW91dC9sYXlvdXRBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFNLDRCQUE0QixHQUFHLG9DQUFvQyxDQUFDO0lBRTFFLE1BQWEsK0JBQWdDLFNBQVEsaUJBQU87UUFDM0Q7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDRCQUE0QjtnQkFDaEMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLG9DQUFvQyxFQUFFLDhCQUE4QixDQUFDO2dCQUN0RixJQUFJLEVBQUUsQ0FBQzt3QkFDTixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxpQkFBaUI7d0JBQzVCLEtBQUssRUFBRSxNQUFNO3dCQUNiLEtBQUssRUFBRSxDQUFDO3FCQUNSLENBQUM7Z0JBQ0YsUUFBUSxFQUFFLHVDQUF5QjtnQkFDbkMsRUFBRSxFQUFFLEtBQUs7YUFDVCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE9BQVk7WUFDakQsTUFBTSxNQUFNLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFFLE9BQWtDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDdEcsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ2pDLGVBQWU7Z0JBQ2YsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7Z0JBQzNDLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO2dCQUNqRSxNQUFNLGVBQWUsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQXFDLGdDQUFlLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDL0gsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sb0JBQW9CLENBQUMsV0FBVyxDQUFDLGdDQUFlLENBQUMsbUJBQW1CLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDeEYsQ0FBQztRQUNGLENBQUM7UUFFRCxjQUFjLENBQUMsUUFBZ0IsRUFBRSxlQUFtRDtZQUNuRixJQUFJLE9BQU8sZUFBZSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUN6QyxTQUFTO2dCQUNULElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDL0QsaUJBQWlCO29CQUNqQixNQUFNLFlBQVksR0FBRyxlQUFlLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztvQkFDcEUsTUFBTSxNQUFNLEdBQThCO3dCQUN6QyxPQUFPLEVBQUUsZUFBZTtxQkFDeEIsQ0FBQztvQkFDRixNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsWUFBWSxDQUFDO29CQUNoQyxPQUFPLE1BQU0sQ0FBQztnQkFDZixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsbUJBQW1CO29CQUNuQixNQUFNLE1BQU0sR0FBOEI7d0JBQ3pDLE9BQU8sRUFBRSxPQUFPO3FCQUNoQixDQUFDO29CQUNGLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxNQUFNLENBQUM7b0JBQzFCLE9BQU8sTUFBTSxDQUFDO2dCQUNmLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLFFBQVEsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUM7Z0JBQ3BGLE1BQU0sWUFBWSxHQUFHLFFBQVEsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUM3RCxNQUFNLFNBQVMsR0FBRztvQkFDakIsR0FBRyxlQUFlO2lCQUNsQixDQUFDO2dCQUNGLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxZQUFZLENBQUM7Z0JBQ25DLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7UUFFRixDQUFDO0tBQ0Q7SUF6REQsMEVBeURDO0lBQ0QsSUFBQSx5QkFBZSxFQUFDLCtCQUErQixDQUFDLENBQUMifQ==