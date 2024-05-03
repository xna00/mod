/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/common/editorContextKeys", "vs/editor/common/standaloneStrings", "vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/accessibility/browser/accessibilityContributions", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/comments/browser/commentsAccessibility", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/workbench/contrib/files/browser/fileConstants"], function (require, exports, lifecycle_1, codeEditorService_1, editorContextKeys_1, standaloneStrings_1, toggleTabFocusMode_1, commands_1, contextkey_1, instantiation_1, keybinding_1, accessibilityContributions_1, accessibleView_1, accessibleViewActions_1, chatContextKeys_1, commentsAccessibility_1, commentContextKeys_1, fileConstants_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorAccessibilityHelpContribution = void 0;
    exports.getCommentCommandInfo = getCommentCommandInfo;
    exports.getChatCommandInfo = getChatCommandInfo;
    class EditorAccessibilityHelpContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(95, 'editor', async (accessor) => {
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const commandService = accessor.get(commands_1.ICommandService);
                let codeEditor = codeEditorService.getActiveCodeEditor() || codeEditorService.getFocusedCodeEditor();
                if (!codeEditor) {
                    await commandService.executeCommand(fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID);
                    codeEditor = codeEditorService.getActiveCodeEditor();
                }
                accessibleViewService.show(instantiationService.createInstance(EditorAccessibilityHelpProvider, codeEditor));
            }, editorContextKeys_1.EditorContextKeys.focus));
        }
    }
    exports.EditorAccessibilityHelpContribution = EditorAccessibilityHelpContribution;
    let EditorAccessibilityHelpProvider = class EditorAccessibilityHelpProvider {
        onClose() {
            this._editor.focus();
        }
        constructor(_editor, _keybindingService, _contextKeyService) {
            this._editor = _editor;
            this._keybindingService = _keybindingService;
            this._contextKeyService = _contextKeyService;
            this.id = "editor" /* AccessibleViewProviderId.Editor */;
            this.options = { type: "help" /* AccessibleViewType.Help */, readMoreUrl: 'https://go.microsoft.com/fwlink/?linkid=851010' };
            this.verbositySettingKey = "accessibility.verbosity.editor" /* AccessibilityVerbositySettingId.Editor */;
        }
        provideContent() {
            const options = this._editor.getOptions();
            const content = [];
            if (options.get(61 /* EditorOption.inDiffEditor */)) {
                if (options.get(91 /* EditorOption.readOnly */)) {
                    content.push(standaloneStrings_1.AccessibilityHelpNLS.readonlyDiffEditor);
                }
                else {
                    content.push(standaloneStrings_1.AccessibilityHelpNLS.editableDiffEditor);
                }
            }
            else {
                if (options.get(91 /* EditorOption.readOnly */)) {
                    content.push(standaloneStrings_1.AccessibilityHelpNLS.readonlyEditor);
                }
                else {
                    content.push(standaloneStrings_1.AccessibilityHelpNLS.editableEditor);
                }
            }
            content.push(standaloneStrings_1.AccessibilityHelpNLS.listSignalSounds);
            content.push(standaloneStrings_1.AccessibilityHelpNLS.listAlerts);
            const chatCommandInfo = getChatCommandInfo(this._keybindingService, this._contextKeyService);
            if (chatCommandInfo) {
                content.push(chatCommandInfo);
            }
            const commentCommandInfo = getCommentCommandInfo(this._keybindingService, this._contextKeyService, this._editor);
            if (commentCommandInfo) {
                content.push(commentCommandInfo);
            }
            if (options.get(115 /* EditorOption.stickyScroll */).enabled) {
                content.push((0, accessibilityContributions_1.descriptionForCommand)('editor.action.focusStickyScroll', standaloneStrings_1.AccessibilityHelpNLS.stickScrollKb, standaloneStrings_1.AccessibilityHelpNLS.stickScrollNoKb, this._keybindingService));
            }
            if (options.get(144 /* EditorOption.tabFocusMode */)) {
                content.push((0, accessibilityContributions_1.descriptionForCommand)(toggleTabFocusMode_1.ToggleTabFocusModeAction.ID, standaloneStrings_1.AccessibilityHelpNLS.tabFocusModeOnMsg, standaloneStrings_1.AccessibilityHelpNLS.tabFocusModeOnMsgNoKb, this._keybindingService));
            }
            else {
                content.push((0, accessibilityContributions_1.descriptionForCommand)(toggleTabFocusMode_1.ToggleTabFocusModeAction.ID, standaloneStrings_1.AccessibilityHelpNLS.tabFocusModeOffMsg, standaloneStrings_1.AccessibilityHelpNLS.tabFocusModeOffMsgNoKb, this._keybindingService));
            }
            return content.join('\n\n');
        }
    };
    EditorAccessibilityHelpProvider = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextkey_1.IContextKeyService)
    ], EditorAccessibilityHelpProvider);
    function getCommentCommandInfo(keybindingService, contextKeyService, editor) {
        const editorContext = contextKeyService.getContext(editor.getDomNode());
        if (editorContext.getValue(commentContextKeys_1.CommentContextKeys.activeEditorHasCommentingRange.key)) {
            const commentCommandInfo = [];
            commentCommandInfo.push(commentsAccessibility_1.CommentAccessibilityHelpNLS.intro);
            commentCommandInfo.push((0, accessibilityContributions_1.descriptionForCommand)("workbench.action.addComment" /* CommentCommandId.Add */, commentsAccessibility_1.CommentAccessibilityHelpNLS.addComment, commentsAccessibility_1.CommentAccessibilityHelpNLS.addCommentNoKb, keybindingService));
            commentCommandInfo.push((0, accessibilityContributions_1.descriptionForCommand)("editor.action.nextCommentThreadAction" /* CommentCommandId.NextThread */, commentsAccessibility_1.CommentAccessibilityHelpNLS.nextCommentThreadKb, commentsAccessibility_1.CommentAccessibilityHelpNLS.nextCommentThreadNoKb, keybindingService));
            commentCommandInfo.push((0, accessibilityContributions_1.descriptionForCommand)("editor.action.previousCommentThreadAction" /* CommentCommandId.PreviousThread */, commentsAccessibility_1.CommentAccessibilityHelpNLS.previousCommentThreadKb, commentsAccessibility_1.CommentAccessibilityHelpNLS.previousCommentThreadNoKb, keybindingService));
            commentCommandInfo.push((0, accessibilityContributions_1.descriptionForCommand)("editor.action.nextCommentingRange" /* CommentCommandId.NextRange */, commentsAccessibility_1.CommentAccessibilityHelpNLS.nextRange, commentsAccessibility_1.CommentAccessibilityHelpNLS.nextRangeNoKb, keybindingService));
            commentCommandInfo.push((0, accessibilityContributions_1.descriptionForCommand)("editor.action.previousCommentingRange" /* CommentCommandId.PreviousRange */, commentsAccessibility_1.CommentAccessibilityHelpNLS.previousRange, commentsAccessibility_1.CommentAccessibilityHelpNLS.previousRangeNoKb, keybindingService));
            return commentCommandInfo.join('\n');
        }
        return;
    }
    function getChatCommandInfo(keybindingService, contextKeyService) {
        if (chatContextKeys_1.CONTEXT_PROVIDER_EXISTS.getValue(contextKeyService)) {
            const commentCommandInfo = [];
            commentCommandInfo.push((0, accessibilityContributions_1.descriptionForCommand)('workbench.action.quickchat.toggle', standaloneStrings_1.AccessibilityHelpNLS.quickChat, standaloneStrings_1.AccessibilityHelpNLS.quickChatNoKb, keybindingService));
            commentCommandInfo.push((0, accessibilityContributions_1.descriptionForCommand)('inlineChat.start', standaloneStrings_1.AccessibilityHelpNLS.startInlineChat, standaloneStrings_1.AccessibilityHelpNLS.startInlineChatNoKb, keybindingService));
            return commentCommandInfo.join('\n');
        }
        return;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQWNjZXNzaWJpbGl0eUhlbHAuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHkvYnJvd3Nlci9lZGl0b3JBY2Nlc3NpYmlsaXR5SGVscC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvR2hHLHNEQWFDO0lBRUQsZ0RBUUM7SUFwR0QsTUFBYSxtQ0FBb0MsU0FBUSxzQkFBVTtRQUVsRTtZQUNDLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLFNBQVMsQ0FBQywrQ0FBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBQyxRQUFRLEVBQUMsRUFBRTtnQkFDdkYsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHNDQUFrQixDQUFDLENBQUM7Z0JBQzNELE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBc0IsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztnQkFDakUsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQkFBZSxDQUFDLENBQUM7Z0JBQ3JELElBQUksVUFBVSxHQUFHLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLElBQUksaUJBQWlCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDckcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNqQixNQUFNLGNBQWMsQ0FBQyxjQUFjLENBQUMsNENBQTRCLENBQUMsQ0FBQztvQkFDbEUsVUFBVSxHQUFHLGlCQUFpQixDQUFDLG1CQUFtQixFQUFHLENBQUM7Z0JBQ3ZELENBQUM7Z0JBQ0QscUJBQXFC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