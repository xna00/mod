/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/inlineEdit/browser/commands", "vs/editor/contrib/inlineEdit/browser/hoverParticipant", "vs/editor/contrib/inlineEdit/browser/inlineEditController"], function (require, exports, editorExtensions_1, hoverTypes_1, commands_1, hoverParticipant_1, inlineEditController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorAction)(commands_1.AcceptInlineEdit);
    (0, editorExtensions_1.registerEditorAction)(commands_1.RejectInlineEdit);
    (0, editorExtensions_1.registerEditorAction)(commands_1.JumpToInlineEdit);
    (0, editorExtensions_1.registerEditorAction)(commands_1.JumpBackInlineEdit);
    (0, editorExtensions_1.registerEditorAction)(commands_1.TriggerInlineEdit);
    (0, editorExtensions_1.registerEditorContribution)(inlineEditController_1.InlineEditController.ID, inlineEditController_1.InlineEditController, 3 /* EditorContributionInstantiation.Eventually */);
    hoverTypes_1.HoverParticipantRegistry.register(hoverParticipant_1.InlineEditHoverParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lRWRpdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGluZUVkaXQvYnJvd3Nlci9pbmxpbmVFZGl0LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxJQUFBLHVDQUFvQixFQUFDLDJCQUFnQixDQUFDLENBQUM7SUFDdkMsSUFBQSx1Q0FBb0IsRUFBQywyQkFBZ0IsQ0FBQyxDQUFDO0lBQ3ZDLElBQUEsdUNBQW9CLEVBQUMsMkJBQWdCLENBQUMsQ0FBQztJQUN2QyxJQUFBLHVDQUFvQixFQUFDLDZCQUFrQixDQUFDLENBQUM7SUFDekMsSUFBQSx1Q0FBb0IsRUFBQyw0QkFBaUIsQ0FBQyxDQUFDO0lBQ3hDLElBQUEsNkNBQTBCLEVBQUMsMkNBQW9CLENBQUMsRUFBRSxFQUFFLDJDQUFvQixxREFBNkMsQ0FBQztJQUd0SCxxQ0FBd0IsQ0FBQyxRQUFRLENBQUMsNkNBQTBCLENBQUMsQ0FBQyJ9