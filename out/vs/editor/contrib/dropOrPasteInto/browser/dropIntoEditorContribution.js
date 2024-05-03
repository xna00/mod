/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/config/editorConfigurationSchema", "vs/editor/common/editorFeatures", "vs/editor/contrib/dropOrPasteInto/browser/defaultProviders", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "./dropIntoEditorController"], function (require, exports, editorExtensions_1, editorConfigurationSchema_1, editorFeatures_1, defaultProviders_1, nls, configurationRegistry_1, platform_1, dropIntoEditorController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(dropIntoEditorController_1.DropIntoEditorController.ID, dropIntoEditorController_1.DropIntoEditorController, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    (0, editorFeatures_1.registerEditorFeature)(defaultProviders_1.DefaultDropProvidersFeature);
    (0, editorExtensions_1.registerEditorCommand)(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: dropIntoEditorController_1.changeDropTypeCommandId,
                precondition: dropIntoEditorController_1.dropWidgetVisibleCtx,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */,
                }
            });
        }
        runEditorCommand(_accessor, editor, _args) {
            dropIntoEditorController_1.DropIntoEditorController.get(editor)?.changeDropType();
        }
    });
    (0, editorExtensions_1.registerEditorCommand)(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'editor.hideDropWidget',
                precondition: dropIntoEditorController_1.dropWidgetVisibleCtx,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */,
                }
            });
        }
        runEditorCommand(_accessor, editor, _args) {
            dropIntoEditorController_1.DropIntoEditorController.get(editor)?.clearWidgets();
        }
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...editorConfigurationSchema_1.editorConfigurationBaseNode,
        properties: {
            [dropIntoEditorController_1.defaultProviderConfig]: {
                type: 'object',
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                description: nls.localize('defaultProviderDescription', "Configures the default drop provider to use for content of a given mime type."),
                default: {},
                additionalProperties: {
                    type: 'string',
                },
            },
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcEludG9FZGl0b3JDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2Ryb3BPclBhc3RlSW50by9icm93c2VyL2Ryb3BJbnRvRWRpdG9yQ29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLElBQUEsNkNBQTBCLEVBQUMsbURBQXdCLENBQUMsRUFBRSxFQUFFLG1EQUF3QixpRUFBeUQsQ0FBQztJQUMxSSxJQUFBLHNDQUFxQixFQUFDLDhDQUEyQixDQUFDLENBQUM7SUFFbkQsSUFBQSx3Q0FBcUIsRUFBQyxJQUFJLEtBQU0sU0FBUSxnQ0FBYTtRQUNwRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsa0RBQXVCO2dCQUMzQixZQUFZLEVBQUUsK0NBQW9CO2dCQUNsQyxNQUFNLEVBQUU7b0JBQ1AsTUFBTSwwQ0FBZ0M7b0JBQ3RDLE9BQU8sRUFBRSxtREFBK0I7aUJBQ3hDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVlLGdCQUFnQixDQUFDLFNBQWtDLEVBQUUsTUFBbUIsRUFBRSxLQUFVO1lBQ25HLG1EQUF3QixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxjQUFjLEVBQUUsQ0FBQztRQUN4RCxDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx3Q0FBcUIsRUFBQyxJQUFJLEtBQU0sU0FBUSxnQ0FBYTtRQUNwRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsdUJBQXVCO2dCQUMzQixZQUFZLEVBQUUsK0NBQW9CO2dCQUNsQyxNQUFNLEVBQUU7b0JBQ1AsTUFBTSwwQ0FBZ0M7b0JBQ3RDLE9BQU8sd0JBQWdCO2lCQUN2QjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFZSxnQkFBZ0IsQ0FBQyxTQUFrQyxFQUFFLE1BQW1CLEVBQUUsS0FBVTtZQUNuRyxtREFBd0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUM7UUFDdEQsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQztRQUNoRyxHQUFHLHVEQUEyQjtRQUM5QixVQUFVLEVBQUU7WUFDWCxDQUFDLGdEQUFxQixDQUFDLEVBQUU7Z0JBQ3hCLElBQUksRUFBRSxRQUFRO2dCQUNkLEtBQUssaURBQXlDO2dCQUM5QyxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsRUFBRSwrRUFBK0UsQ0FBQztnQkFDeEksT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsb0JBQW9CLEVBQUU7b0JBQ3JCLElBQUksRUFBRSxRQUFRO2lCQUNkO2FBQ0Q7U0FDRDtLQUNELENBQUMsQ0FBQyJ9