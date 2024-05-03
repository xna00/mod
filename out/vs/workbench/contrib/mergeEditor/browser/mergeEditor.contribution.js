/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/mergeEditor/browser/commands/commands", "vs/workbench/contrib/mergeEditor/browser/commands/devCommands", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput", "vs/workbench/contrib/mergeEditor/browser/view/mergeEditor", "./mergeEditorSerializer"], function (require, exports, nls_1, actions_1, configurationRegistry_1, descriptors_1, platform_1, editor_1, contributions_1, editor_2, commands_1, devCommands_1, mergeEditorInput_1, mergeEditor_1, mergeEditorSerializer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(mergeEditor_1.MergeEditor, mergeEditor_1.MergeEditor.ID, (0, nls_1.localize)('name', "Merge Editor")), [
        new descriptors_1.SyncDescriptor(mergeEditorInput_1.MergeEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(mergeEditorInput_1.MergeEditorInput.ID, mergeEditorSerializer_1.MergeEditorSerializer);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        properties: {
            'mergeEditor.diffAlgorithm': {
                type: 'string',
                enum: ['legacy', 'advanced'],
                default: 'advanced',
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('diffAlgorithm.legacy', "Uses the legacy diffing algorithm."),
                    (0, nls_1.localize)('diffAlgorithm.advanced', "Uses the advanced diffing algorithm."),
                ]
            },
            'mergeEditor.showDeletionMarkers': {
                type: 'boolean',
                default: true,
                description: 'Controls if deletions in base or one of the inputs should be indicated by a vertical bar.',
            },
        }
    });
    (0, actions_1.registerAction2)(commands_1.OpenResultResource);
    (0, actions_1.registerAction2)(commands_1.SetMixedLayout);
    (0, actions_1.registerAction2)(commands_1.SetColumnLayout);
    (0, actions_1.registerAction2)(commands_1.OpenMergeEditor);
    (0, actions_1.registerAction2)(commands_1.OpenBaseFile);
    (0, actions_1.registerAction2)(commands_1.ShowNonConflictingChanges);
    (0, actions_1.registerAction2)(commands_1.ShowHideBase);
    (0, actions_1.registerAction2)(commands_1.ShowHideTopBase);
    (0, actions_1.registerAction2)(commands_1.ShowHideCenterBase);
    (0, actions_1.registerAction2)(commands_1.GoToNextUnhandledConflict);
    (0, actions_1.registerAction2)(commands_1.GoToPreviousUnhandledConflict);
    (0, actions_1.registerAction2)(commands_1.ToggleActiveConflictInput1);
    (0, actions_1.registerAction2)(commands_1.ToggleActiveConflictInput2);
    (0, actions_1.registerAction2)(commands_1.CompareInput1WithBaseCommand);
    (0, actions_1.registerAction2)(commands_1.CompareInput2WithBaseCommand);
    (0, actions_1.registerAction2)(commands_1.AcceptAllInput1);
    (0, actions_1.registerAction2)(commands_1.AcceptAllInput2);
    (0, actions_1.registerAction2)(commands_1.ResetToBaseAndAutoMergeCommand);
    (0, actions_1.registerAction2)(commands_1.AcceptMerge);
    (0, actions_1.registerAction2)(commands_1.ResetCloseWithConflictsChoice);
    // Dev Commands
    (0, actions_1.registerAction2)(devCommands_1.MergeEditorCopyContentsToJSON);
    (0, actions_1.registerAction2)(devCommands_1.MergeEditorSaveContentsToFolder);
    (0, actions_1.registerAction2)(devCommands_1.MergeEditorLoadContentsFromFolder);
    platform_1.Registry
        .as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(mergeEditor_1.MergeEditorOpenHandlerContribution, 3 /* LifecyclePhase.Restored */);
    (0, contributions_1.registerWorkbenchContribution2)(mergeEditor_1.MergeEditorResolverContribution.ID, mergeEditor_1.MergeEditorResolverContribution, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VFZGl0b3IuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL21lcmdlRWRpdG9yLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXNCaEcsbUJBQVEsQ0FBQyxFQUFFLENBQXNCLHlCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixDQUMvRSw2QkFBb0IsQ0FBQyxNQUFNLENBQzFCLHlCQUFXLEVBQ1gseUJBQVcsQ0FBQyxFQUFFLEVBQ2QsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUNoQyxFQUNEO1FBQ0MsSUFBSSw0QkFBYyxDQUFDLG1DQUFnQixDQUFDO0tBQ3BDLENBQ0QsQ0FBQztJQUVGLG1CQUFRLENBQUMsRUFBRSxDQUF5Qix5QkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyx3QkFBd0IsQ0FDM0YsbUNBQWdCLENBQUMsRUFBRSxFQUNuQiw2Q0FBcUIsQ0FDckIsQ0FBQztJQUVGLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLHFCQUFxQixDQUFDO1FBQ25GLFVBQVUsRUFBRTtZQUNYLDJCQUEyQixFQUFFO2dCQUM1QixJQUFJLEVBQUUsUUFBUTtnQkFDZCxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDO2dCQUM1QixPQUFPLEVBQUUsVUFBVTtnQkFDbkIsd0JBQXdCLEVBQUU7b0JBQ3pCLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLG9DQUFvQyxDQUFDO29CQUN0RSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxzQ0FBc0MsQ0FBQztpQkFDMUU7YUFDRDtZQUNELGlDQUFpQyxFQUFFO2dCQUNsQyxJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsSUFBSTtnQkFDYixXQUFXLEVBQUUsMkZBQTJGO2FBQ3hHO1NBQ0Q7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsNkJBQWtCLENBQUMsQ0FBQztJQUNwQyxJQUFBLHlCQUFlLEVBQUMseUJBQWMsQ0FBQyxDQUFDO0lBQ2hDLElBQUEseUJBQWUsRUFBQywwQkFBZSxDQUFDLENBQUM7SUFDakMsSUFBQSx5QkFBZSxFQUFDLDBCQUFlLENBQUMsQ0FBQztJQUNqQyxJQUFBLHlCQUFlLEVBQUMsdUJBQVksQ0FBQyxDQUFDO0lBQzlCLElBQUEseUJBQWUsRUFBQyxvQ0FBeUIsQ0FBQyxDQUFDO0lBQzNDLElBQUEseUJBQWUsRUFBQyx1QkFBWSxDQUFDLENBQUM7SUFDOUIsSUFBQSx5QkFBZSxFQUFDLDBCQUFlLENBQUMsQ0FBQztJQUNqQyxJQUFBLHlCQUFlLEVBQUMsNkJBQWtCLENBQUMsQ0FBQztJQUVwQyxJQUFBLHlCQUFlLEVBQUMsb0NBQXlCLENBQUMsQ0FBQztJQUMzQyxJQUFBLHlCQUFlLEVBQUMsd0NBQTZCLENBQUMsQ0FBQztJQUUvQyxJQUFBLHlCQUFlLEVBQUMscUNBQTBCLENBQUMsQ0FBQztJQUM1QyxJQUFBLHlCQUFlLEVBQUMscUNBQTBCLENBQUMsQ0FBQztJQUU1QyxJQUFBLHlCQUFlLEVBQUMsdUNBQTRCLENBQUMsQ0FBQztJQUM5QyxJQUFBLHlCQUFlLEVBQUMsdUNBQTRCLENBQUMsQ0FBQztJQUU5QyxJQUFBLHlCQUFlLEVBQUMsMEJBQWUsQ0FBQyxDQUFDO0lBQ2pDLElBQUEseUJBQWUsRUFBQywwQkFBZSxDQUFDLENBQUM7SUFFakMsSUFBQSx5QkFBZSxFQUFDLHlDQUE4QixDQUFDLENBQUM7SUFFaEQsSUFBQSx5QkFBZSxFQUFDLHNCQUFXLENBQUMsQ0FBQztJQUM3QixJQUFBLHlCQUFlLEVBQUMsd0NBQTZCLENBQUMsQ0FBQztJQUUvQyxlQUFlO0lBQ2YsSUFBQSx5QkFBZSxFQUFDLDJDQUE2QixDQUFDLENBQUM7SUFDL0MsSUFBQSx5QkFBZSxFQUFDLDZDQUErQixDQUFDLENBQUM7SUFDakQsSUFBQSx5QkFBZSxFQUFDLCtDQUFpQyxDQUFDLENBQUM7SUFFbkQsbUJBQVE7U0FDTixFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQztTQUNsRSw2QkFBNkIsQ0FBQyxnREFBa0Msa0NBQTBCLENBQUM7SUFFN0YsSUFBQSw4Q0FBOEIsRUFBQyw2Q0FBK0IsQ0FBQyxFQUFFLEVBQUUsNkNBQStCLHNDQUFzRSxDQUFDIn0=