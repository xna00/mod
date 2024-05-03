/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/platform/actions/common/actions", "vs/workbench/contrib/inlineChat/electron-sandbox/inlineChatQuickVoice", "./inlineChatActions"], function (require, exports, editorExtensions_1, actions_1, inlineChatQuickVoice_1, inlineChatActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // start and hold for voice
    (0, actions_1.registerAction2)(inlineChatActions_1.HoldToSpeak);
    // quick voice
    (0, editorExtensions_1.registerEditorContribution)(inlineChatQuickVoice_1.InlineChatQuickVoice.ID, inlineChatQuickVoice_1.InlineChatQuickVoice, 0 /* EditorContributionInstantiation.Eager */); // EAGER because of notebook dispose/create of editors
    (0, actions_1.registerAction2)(inlineChatQuickVoice_1.StartAction);
    (0, actions_1.registerAction2)(inlineChatQuickVoice_1.StopAction);
    (0, actions_1.registerAction2)(inlineChatQuickVoice_1.CancelAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvZWxlY3Ryb24tc2FuZGJveC9pbmxpbmVDaGF0LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRywyQkFBMkI7SUFFM0IsSUFBQSx5QkFBZSxFQUFDLCtCQUFXLENBQUMsQ0FBQztJQUU3QixjQUFjO0lBRWQsSUFBQSw2Q0FBMEIsRUFBQywyQ0FBb0IsQ0FBQyxFQUFFLEVBQUUsMkNBQW9CLGdEQUF3QyxDQUFDLENBQUMsc0RBQXNEO0lBQ3hLLElBQUEseUJBQWUsRUFBQyxrQ0FBVyxDQUFDLENBQUM7SUFDN0IsSUFBQSx5QkFBZSxFQUFDLGlDQUFVLENBQUMsQ0FBQztJQUM1QixJQUFBLHlCQUFlLEVBQUMsbUNBQVksQ0FBQyxDQUFDIn0=