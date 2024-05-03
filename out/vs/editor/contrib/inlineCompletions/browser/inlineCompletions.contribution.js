/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/inlineCompletions/browser/commands", "vs/editor/contrib/inlineCompletions/browser/hoverParticipant", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/platform/actions/common/actions"], function (require, exports, editorExtensions_1, hoverTypes_1, commands_1, hoverParticipant_1, inlineCompletionsController_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(inlineCompletionsController_1.InlineCompletionsController.ID, inlineCompletionsController_1.InlineCompletionsController, 3 /* EditorContributionInstantiation.Eventually */);
    (0, editorExtensions_1.registerEditorAction)(commands_1.TriggerInlineSuggestionAction);
    (0, editorExtensions_1.registerEditorAction)(commands_1.ShowNextInlineSuggestionAction);
    (0, editorExtensions_1.registerEditorAction)(commands_1.ShowPreviousInlineSuggestionAction);
    (0, editorExtensions_1.registerEditorAction)(commands_1.AcceptNextWordOfInlineCompletion);
    (0, editorExtensions_1.registerEditorAction)(commands_1.AcceptNextLineOfInlineCompletion);
    (0, editorExtensions_1.registerEditorAction)(commands_1.AcceptInlineCompletion);
    (0, editorExtensions_1.registerEditorAction)(commands_1.HideInlineCompletion);
    (0, actions_1.registerAction2)(commands_1.ToggleAlwaysShowInlineSuggestionToolbar);
    hoverTypes_1.HoverParticipantRegistry.register(hoverParticipant_1.InlineCompletionsHoverParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ29tcGxldGlvbnMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVDb21wbGV0aW9ucy9icm93c2VyL2lubGluZUNvbXBsZXRpb25zLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxJQUFBLDZDQUEwQixFQUFDLHlEQUEyQixDQUFDLEVBQUUsRUFBRSx5REFBMkIscURBQTZDLENBQUM7SUFFcEksSUFBQSx1Q0FBb0IsRUFBQyx3Q0FBNkIsQ0FBQyxDQUFDO0lBQ3BELElBQUEsdUNBQW9CLEVBQUMseUNBQThCLENBQUMsQ0FBQztJQUNyRCxJQUFBLHVDQUFvQixFQUFDLDZDQUFrQyxDQUFDLENBQUM7SUFDekQsSUFBQSx1Q0FBb0IsRUFBQywyQ0FBZ0MsQ0FBQyxDQUFDO0lBQ3ZELElBQUEsdUNBQW9CLEVBQUMsMkNBQWdDLENBQUMsQ0FBQztJQUN2RCxJQUFBLHVDQUFvQixFQUFDLGlDQUFzQixDQUFDLENBQUM7SUFDN0MsSUFBQSx1Q0FBb0IsRUFBQywrQkFBb0IsQ0FBQyxDQUFDO0lBQzNDLElBQUEseUJBQWUsRUFBQyxrREFBdUMsQ0FBQyxDQUFDO0lBRXpELHFDQUF3QixDQUFDLFFBQVEsQ0FBQyxvREFBaUMsQ0FBQyxDQUFDIn0=