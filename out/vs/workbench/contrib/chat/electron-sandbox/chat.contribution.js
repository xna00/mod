/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/chat/electron-sandbox/actions/voiceChatActions", "vs/platform/actions/common/actions", "vs/workbench/common/contributions"], function (require, exports, voiceChatActions_1, actions_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(voiceChatActions_1.StartVoiceChatAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.InstallVoiceChatAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.VoiceChatInChatViewAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.HoldToVoiceChatInChatViewAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.QuickVoiceChatAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.InlineVoiceChatAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningAndSubmitAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningInChatViewAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningInChatEditorAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningInQuickChatAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningInTerminalChatAction);
    (0, contributions_1.registerWorkbenchContribution2)(voiceChatActions_1.KeywordActivationContribution.ID, voiceChatActions_1.KeywordActivationContribution, 3 /* WorkbenchPhase.AfterRestored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvZWxlY3Ryb24tc2FuZGJveC9jaGF0LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxJQUFBLHlCQUFlLEVBQUMsdUNBQW9CLENBQUMsQ0FBQztJQUN0QyxJQUFBLHlCQUFlLEVBQUMseUNBQXNCLENBQUMsQ0FBQztJQUV4QyxJQUFBLHlCQUFlLEVBQUMsNENBQXlCLENBQUMsQ0FBQztJQUMzQyxJQUFBLHlCQUFlLEVBQUMsa0RBQStCLENBQUMsQ0FBQztJQUNqRCxJQUFBLHlCQUFlLEVBQUMsdUNBQW9CLENBQUMsQ0FBQztJQUN0QyxJQUFBLHlCQUFlLEVBQUMsd0NBQXFCLENBQUMsQ0FBQztJQUV2QyxJQUFBLHlCQUFlLEVBQUMsc0NBQW1CLENBQUMsQ0FBQztJQUNyQyxJQUFBLHlCQUFlLEVBQUMsK0NBQTRCLENBQUMsQ0FBQztJQUU5QyxJQUFBLHlCQUFlLEVBQUMsZ0RBQTZCLENBQUMsQ0FBQztJQUMvQyxJQUFBLHlCQUFlLEVBQUMsa0RBQStCLENBQUMsQ0FBQztJQUNqRCxJQUFBLHlCQUFlLEVBQUMsaURBQThCLENBQUMsQ0FBQztJQUNoRCxJQUFBLHlCQUFlLEVBQUMsb0RBQWlDLENBQUMsQ0FBQztJQUVuRCxJQUFBLDhDQUE4QixFQUFDLGdEQUE2QixDQUFDLEVBQUUsRUFBRSxnREFBNkIsdUNBQStCLENBQUMifQ==