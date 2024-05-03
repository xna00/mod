/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/config/editorConfigurationSchema", "vs/editor/contrib/codeAction/browser/codeActionCommands", "vs/editor/contrib/codeAction/browser/codeActionController", "vs/editor/contrib/codeAction/browser/lightBulbWidget", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, editorExtensions_1, editorConfigurationSchema_1, codeActionCommands_1, codeActionController_1, lightBulbWidget_1, nls, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(codeActionController_1.CodeActionController.ID, codeActionController_1.CodeActionController, 3 /* EditorContributionInstantiation.Eventually */);
    (0, editorExtensions_1.registerEditorContribution)(lightBulbWidget_1.LightBulbWidget.ID, lightBulbWidget_1.LightBulbWidget, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.QuickFixAction);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.RefactorAction);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.SourceAction);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.OrganizeImportsAction);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.AutoFixAction);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.FixAllAction);
    (0, editorExtensions_1.registerEditorCommand)(new codeActionCommands_1.CodeActionCommand());
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...editorConfigurationSchema_1.editorConfigurationBaseNode,
        properties: {
            'editor.codeActionWidget.showHeaders': {
                type: 'boolean',
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                description: nls.localize('showCodeActionHeaders', "Enable/disable showing group headers in the Code Action menu."),
                default: true,
            },
        }
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...editorConfigurationSchema_1.editorConfigurationBaseNode,
        properties: {
            'editor.codeActionWidget.includeNearbyQuickFixes': {
                type: 'boolean',
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                description: nls.localize('includeNearbyQuickFixes', "Enable/disable showing nearest Quick Fix within a line when not currently on a diagnostic."),
                default: true,
            },
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbkNvbnRyaWJ1dGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvZGVBY3Rpb24vYnJvd3Nlci9jb2RlQWN0aW9uQ29udHJpYnV0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxJQUFBLDZDQUEwQixFQUFDLDJDQUFvQixDQUFDLEVBQUUsRUFBRSwyQ0FBb0IscURBQTZDLENBQUM7SUFDdEgsSUFBQSw2Q0FBMEIsRUFBQyxpQ0FBZSxDQUFDLEVBQUUsRUFBRSxpQ0FBZSwrQ0FBdUMsQ0FBQztJQUN0RyxJQUFBLHVDQUFvQixFQUFDLG1DQUFjLENBQUMsQ0FBQztJQUNyQyxJQUFBLHVDQUFvQixFQUFDLG1DQUFjLENBQUMsQ0FBQztJQUNyQyxJQUFBLHVDQUFvQixFQUFDLGlDQUFZLENBQUMsQ0FBQztJQUNuQyxJQUFBLHVDQUFvQixFQUFDLDBDQUFxQixDQUFDLENBQUM7SUFDNUMsSUFBQSx1Q0FBb0IsRUFBQyxrQ0FBYSxDQUFDLENBQUM7SUFDcEMsSUFBQSx1Q0FBb0IsRUFBQyxpQ0FBWSxDQUFDLENBQUM7SUFDbkMsSUFBQSx3Q0FBcUIsRUFBQyxJQUFJLHNDQUFpQixFQUFFLENBQUMsQ0FBQztJQUUvQyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQztRQUNuRixHQUFHLHVEQUEyQjtRQUM5QixVQUFVLEVBQUU7WUFDWCxxQ0FBcUMsRUFBRTtnQkFDdEMsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsS0FBSyxpREFBeUM7Z0JBQzlDLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUFFLCtEQUErRCxDQUFDO2dCQUNuSCxPQUFPLEVBQUUsSUFBSTthQUNiO1NBQ0Q7S0FDRCxDQUFDLENBQUM7SUFFSCxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQztRQUNuRixHQUFHLHVEQUEyQjtRQUM5QixVQUFVLEVBQUU7WUFDWCxpREFBaUQsRUFBRTtnQkFDbEQsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsS0FBSyxpREFBeUM7Z0JBQzlDLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUFFLDRGQUE0RixDQUFDO2dCQUNsSixPQUFPLEVBQUUsSUFBSTthQUNiO1NBQ0Q7S0FDRCxDQUFDLENBQUMifQ==