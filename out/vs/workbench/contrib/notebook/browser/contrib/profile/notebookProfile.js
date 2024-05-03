/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, nls_1, actions_1, configuration_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookProfileType = void 0;
    var NotebookProfileType;
    (function (NotebookProfileType) {
        NotebookProfileType["default"] = "default";
        NotebookProfileType["jupyter"] = "jupyter";
        NotebookProfileType["colab"] = "colab";
    })(NotebookProfileType || (exports.NotebookProfileType = NotebookProfileType = {}));
    const profiles = {
        [NotebookProfileType.default]: {
            [notebookCommon_1.NotebookSetting.focusIndicator]: 'gutter',
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: 'both',
            [notebookCommon_1.NotebookSetting.globalToolbar]: true,
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: { default: 'right' },
            [notebookCommon_1.NotebookSetting.compactView]: true,
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: 'visible',
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: true,
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: false
        },
        [NotebookProfileType.jupyter]: {
            [notebookCommon_1.NotebookSetting.focusIndicator]: 'gutter',
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: 'notebookToolbar',
            [notebookCommon_1.NotebookSetting.globalToolbar]: true,
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: { default: 'left' },
            [notebookCommon_1.NotebookSetting.compactView]: true,
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: 'visible',
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: false,
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: true
        },
        [NotebookProfileType.colab]: {
            [notebookCommon_1.NotebookSetting.focusIndicator]: 'border',
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: 'betweenCells',
            [notebookCommon_1.NotebookSetting.globalToolbar]: false,
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: { default: 'right' },
            [notebookCommon_1.NotebookSetting.compactView]: false,
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: 'hidden',
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: true,
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: false
        }
    };
    async function applyProfile(configService, profile) {
        const promises = [];
        for (const settingKey in profile) {
            promises.push(configService.updateValue(settingKey, profile[settingKey]));
        }
        await Promise.all(promises);
    }
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.setProfile',
                title: (0, nls_1.localize)('setProfileTitle', "Set Profile")
            });
        }
        async run(accessor, args) {
            if (!isSetProfileArgs(args)) {
                return;
            }
            const configService = accessor.get(configuration_1.IConfigurationService);
            return applyProfile(configService, profiles[args.profile]);
        }
    });
    function isSetProfileArgs(args) {
        const setProfileArgs = args;
        return setProfileArgs.profile === NotebookProfileType.colab ||
            setProfileArgs.profile === NotebookProfileType.default ||
            setProfileArgs.profile === NotebookProfileType.jupyter;
    }
});
// export class NotebookProfileContribution extends Disposable {
// 	static readonly ID = 'workbench.contrib.notebookProfile';
// 	constructor(@IConfigurationService configService: IConfigurationService, @IWorkbenchAssignmentService private readonly experimentService: IWorkbenchAssignmentService) {
// 		super();
// 		if (this.experimentService) {
// 			this.experimentService.getTreatment<NotebookProfileType.default | NotebookProfileType.jupyter | NotebookProfileType.colab>('notebookprofile').then(treatment => {
// 				if (treatment === undefined) {
// 					return;
// 				} else {
// 					// check if settings are already modified
// 					const focusIndicator = configService.getValue(NotebookSetting.focusIndicator);
// 					const insertToolbarPosition = configService.getValue(NotebookSetting.insertToolbarLocation);
// 					const globalToolbar = configService.getValue(NotebookSetting.globalToolbar);
// 					// const cellToolbarLocation = configService.getValue(NotebookSetting.cellToolbarLocation);
// 					const compactView = configService.getValue(NotebookSetting.compactView);
// 					const showCellStatusBar = configService.getValue(NotebookSetting.showCellStatusBar);
// 					const consolidatedRunButton = configService.getValue(NotebookSetting.consolidatedRunButton);
// 					if (focusIndicator === 'border'
// 						&& insertToolbarPosition === 'both'
// 						&& globalToolbar === false
// 						// && cellToolbarLocation === undefined
// 						&& compactView === true
// 						&& showCellStatusBar === 'visible'
// 						&& consolidatedRunButton === true
// 					) {
// 						applyProfile(configService, profiles[treatment] ?? profiles[NotebookProfileType.default]);
// 					}
// 				}
// 			});
// 		}
// 	}
// }
// registerWorkbenchContribution2(NotebookProfileContribution.ID, NotebookProfileContribution, WorkbenchPhase.BlockRestore);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvcHJvZmlsZS9ub3RlYm9va1Byb2ZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLElBQVksbUJBSVg7SUFKRCxXQUFZLG1CQUFtQjtRQUM5QiwwQ0FBbUIsQ0FBQTtRQUNuQiwwQ0FBbUIsQ0FBQTtRQUNuQixzQ0FBZSxDQUFBO0lBQ2hCLENBQUMsRUFKVyxtQkFBbUIsbUNBQW5CLG1CQUFtQixRQUk5QjtJQUVELE1BQU0sUUFBUSxHQUFHO1FBQ2hCLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDOUIsQ0FBQyxnQ0FBZSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFFBQVE7WUFDMUMsQ0FBQyxnQ0FBZSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsTUFBTTtZQUMvQyxDQUFDLGdDQUFlLENBQUMsYUFBYSxDQUFDLEVBQUUsSUFBSTtZQUNyQyxDQUFDLGdDQUFlLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7WUFDM0QsQ0FBQyxnQ0FBZSxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUk7WUFDbkMsQ0FBQyxnQ0FBZSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsU0FBUztZQUM5QyxDQUFDLGdDQUFlLENBQUMscUJBQXFCLENBQUMsRUFBRSxJQUFJO1lBQzdDLENBQUMsZ0NBQWUsQ0FBQyxlQUFlLENBQUMsRUFBRSxLQUFLO1NBQ3hDO1FBQ0QsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUM5QixDQUFDLGdDQUFlLENBQUMsY0FBYyxDQUFDLEVBQUUsUUFBUTtZQUMxQyxDQUFDLGdDQUFlLENBQUMscUJBQXFCLENBQUMsRUFBRSxpQkFBaUI7WUFDMUQsQ0FBQyxnQ0FBZSxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUk7WUFDckMsQ0FBQyxnQ0FBZSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFO1lBQzFELENBQUMsZ0NBQWUsQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJO1lBQ25DLENBQUMsZ0NBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLFNBQVM7WUFDOUMsQ0FBQyxnQ0FBZSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsS0FBSztZQUM5QyxDQUFDLGdDQUFlLENBQUMsZUFBZSxDQUFDLEVBQUUsSUFBSTtTQUN2QztRQUNELENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDNUIsQ0FBQyxnQ0FBZSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFFBQVE7WUFDMUMsQ0FBQyxnQ0FBZSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsY0FBYztZQUN2RCxDQUFDLGdDQUFlLENBQUMsYUFBYSxDQUFDLEVBQUUsS0FBSztZQUN0QyxDQUFDLGdDQUFlLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7WUFDM0QsQ0FBQyxnQ0FBZSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEtBQUs7WUFDcEMsQ0FBQyxnQ0FBZSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsUUFBUTtZQUM3QyxDQUFDLGdDQUFlLENBQUMscUJBQXFCLENBQUMsRUFBRSxJQUFJO1lBQzdDLENBQUMsZ0NBQWUsQ0FBQyxlQUFlLENBQUMsRUFBRSxLQUFLO1NBQ3hDO0tBQ0QsQ0FBQztJQUVGLEtBQUssVUFBVSxZQUFZLENBQUMsYUFBb0MsRUFBRSxPQUE0QjtRQUM3RixNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDcEIsS0FBSyxNQUFNLFVBQVUsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNsQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVELE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBTUQsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUscUJBQXFCO2dCQUN6QixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxDQUFDO2FBQ2pELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsSUFBYTtZQUNsRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFDMUQsT0FBTyxZQUFZLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM1RCxDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsU0FBUyxnQkFBZ0IsQ0FBQyxJQUFhO1FBQ3RDLE1BQU0sY0FBYyxHQUFHLElBQXVCLENBQUM7UUFDL0MsT0FBTyxjQUFjLENBQUMsT0FBTyxLQUFLLG1CQUFtQixDQUFDLEtBQUs7WUFDMUQsY0FBYyxDQUFDLE9BQU8sS0FBSyxtQkFBbUIsQ0FBQyxPQUFPO1lBQ3RELGNBQWMsQ0FBQyxPQUFPLEtBQUssbUJBQW1CLENBQUMsT0FBTyxDQUFDO0lBQ3pELENBQUM7O0FBRUQsZ0VBQWdFO0FBRWhFLDZEQUE2RDtBQUU3RCw0S0FBNEs7QUFDNUssYUFBYTtBQUViLGtDQUFrQztBQUNsQyx1S0FBdUs7QUFDdksscUNBQXFDO0FBQ3JDLGVBQWU7QUFDZixlQUFlO0FBQ2YsaURBQWlEO0FBQ2pELHNGQUFzRjtBQUN0RixvR0FBb0c7QUFDcEcsb0ZBQW9GO0FBQ3BGLG1HQUFtRztBQUNuRyxnRkFBZ0Y7QUFDaEYsNEZBQTRGO0FBQzVGLG9HQUFvRztBQUNwRyx1Q0FBdUM7QUFDdkMsNENBQTRDO0FBQzVDLG1DQUFtQztBQUNuQyxnREFBZ0Q7QUFDaEQsZ0NBQWdDO0FBQ2hDLDJDQUEyQztBQUMzQywwQ0FBMEM7QUFDMUMsV0FBVztBQUNYLG1HQUFtRztBQUNuRyxTQUFTO0FBQ1QsUUFBUTtBQUNSLFNBQVM7QUFDVCxNQUFNO0FBQ04sS0FBSztBQUNMLElBQUk7QUFFSiw0SEFBNEgifQ==