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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/comments/browser/simpleCommentEditor", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/base/common/strings", "vs/base/browser/dom", "vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode"], function (require, exports, lifecycle_1, contextkey_1, instantiation_1, accessibleView_1, accessibleViewActions_1, simpleCommentEditor_1, commentContextKeys_1, nls, keybinding_1, strings, dom_1, toggleTabFocusMode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsAccessibilityHelpContribution = exports.CommentsAccessibilityHelpProvider = exports.CommentAccessibilityHelpNLS = void 0;
    var CommentAccessibilityHelpNLS;
    (function (CommentAccessibilityHelpNLS) {
        CommentAccessibilityHelpNLS.intro = nls.localize('intro', "The editor contains commentable range(s). Some useful commands include:");
        CommentAccessibilityHelpNLS.introWidget = nls.localize('introWidget', "This widget contains a text area, for composition of new comments, and actions, that can be tabbed to once tab moves focus mode has been enabled ({0}).");
        CommentAccessibilityHelpNLS.introWidgetNoKb = nls.localize('introWidgetNoKb', "This widget contains a text area, for composition of new comments, and actions, that can be tabbed to once tab moves focus mode has been enabled with the command Toggle Tab Key Moves Focus, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.commentCommands = nls.localize('commentCommands', "Some useful comment commands include:");
        CommentAccessibilityHelpNLS.escape = nls.localize('escape', "- Dismiss Comment (Escape)");
        CommentAccessibilityHelpNLS.nextRange = nls.localize('next', "- Go to Next Commenting Range ({0})");
        CommentAccessibilityHelpNLS.nextRangeNoKb = nls.localize('nextNoKb', "- Go to Next Commenting Range, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.previousRange = nls.localize('previous', "- Go to Previous Commenting Range ({0})");
        CommentAccessibilityHelpNLS.previousRangeNoKb = nls.localize('previousNoKb', "- Go to Previous Commenting Range, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.nextCommentThreadKb = nls.localize('nextCommentThreadKb', "- Go to Next Comment Thread ({0})");
        CommentAccessibilityHelpNLS.nextCommentThreadNoKb = nls.localize('nextCommentThreadNoKb', "- Go to Next Comment Thread, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.previousCommentThreadKb = nls.localize('previousCommentThreadKb', "- Go to Previous Comment Thread ({0})");
        CommentAccessibilityHelpNLS.previousCommentThreadNoKb = nls.localize('previousCommentThreadNoKb', "- Go to Previous Comment Thread, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.addComment = nls.localize('addComment', "- Add Comment ({0})");
        CommentAccessibilityHelpNLS.addCommentNoKb = nls.localize('addCommentNoKb', "- Add Comment on Current Selection, which is currently not triggerable via keybinding.");
        CommentAccessibilityHelpNLS.submitComment = nls.localize('submitComment', "- Submit Comment ({0})");
        CommentAccessibilityHelpNLS.submitCommentNoKb = nls.localize('submitCommentNoKb', "- Submit Comment, accessible via tabbing, as it's currently not triggerable with a keybinding.");
    })(CommentAccessibilityHelpNLS || (exports.CommentAccessibilityHelpNLS = CommentAccessibilityHelpNLS = {}));
    let CommentsAccessibilityHelpProvider = class CommentsAccessibilityHelpProvider {
        constructor(_keybindingService) {
            this._keybindingService = _keybindingService;
            this.id = "comments" /* AccessibleViewProviderId.Comments */;
            this.verbositySettingKey = "accessibility.verbosity.comments" /* AccessibilityVerbositySettingId.Comments */;
            this.options = { type: "help" /* AccessibleViewType.Help */ };
        }
        _descriptionForCommand(commandId, msg, noKbMsg) {
            const kb = this._keybindingService.lookupKeybinding(commandId);
            if (kb) {
                return strings.format(msg, kb.getAriaLabel());
            }
            return strings.format(noKbMsg, commandId);
        }
        provideContent() {
            this._element = (0, dom_1.getActiveElement)();
            const content = [];
            content.push(this._descriptionForCommand(toggleTabFocusMode_1.ToggleTabFocusModeAction.ID, CommentAccessibilityHelpNLS.introWidget, CommentAccessibilityHelpNLS.introWidgetNoKb) + '\n');
            content.push(CommentAccessibilityHelpNLS.commentCommands);
            content.push(CommentAccessibilityHelpNLS.escape);
            content.push(this._descriptionForCommand("workbench.action.addComment" /* CommentCommandId.Add */, CommentAccessibilityHelpNLS.addComment, CommentAccessibilityHelpNLS.addCommentNoKb));
            content.push(this._descriptionForCommand("editor.action.submitComment" /* CommentCommandId.Submit */, CommentAccessibilityHelpNLS.submitComment, CommentAccessibilityHelpNLS.submitCommentNoKb));
            content.push(this._descriptionForCommand("editor.action.nextCommentingRange" /* CommentCommandId.NextRange */, CommentAccessibilityHelpNLS.nextRange, CommentAccessibilityHelpNLS.nextRangeNoKb));
            content.push(this._descriptionForCommand("editor.action.previousCommentingRange" /* CommentCommandId.PreviousRange */, CommentAccessibilityHelpNLS.previousRange, CommentAccessibilityHelpNLS.previousRangeNoKb));
            return content.join('\n');
        }
        onClose() {
            this._element?.focus();
        }
    };
    exports.CommentsAccessibilityHelpProvider = CommentsAccessibilityHelpProvider;
    exports.CommentsAccessibilityHelpProvider = CommentsAccessibilityHelpProvider = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], CommentsAccessibilityHelpProvider);
    class CommentsAccessibilityHelpContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(110, 'comments', accessor => {
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                accessibleViewService.show(instantiationService.createInstance(CommentsAccessibilityHelpProvider));
                return true;
            }, contextkey_1.ContextKeyExpr.or(simpleCommentEditor_1.ctxCommentEditorFocused, commentContextKeys_1.CommentContextKeys.commentFocused)));
        }
    }
    exports.CommentsAccessibilityHelpContribution = CommentsAccessibilityHelpContribution;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNBY2Nlc3NpYmlsaXR5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRzQWNjZXNzaWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQmhHLElBQWlCLDJCQUEyQixDQWtCM0M7SUFsQkQsV0FBaUIsMkJBQTJCO1FBQzlCLGlDQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUseUVBQXlFLENBQUMsQ0FBQztRQUN6Ryx1Q0FBVyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLHlKQUF5SixDQUFDLENBQUM7UUFDck0sMkNBQWUsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLGtQQUFrUCxDQUFDLENBQUM7UUFDdFMsMkNBQWUsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLHVDQUF1QyxDQUFDLENBQUM7UUFDM0Ysa0NBQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1FBQzlELHFDQUFTLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUscUNBQXFDLENBQUMsQ0FBQztRQUN4RSx5Q0FBYSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLG1GQUFtRixDQUFDLENBQUM7UUFDOUgseUNBQWEsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDO1FBQ3BGLDZDQUFpQixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLHVGQUF1RixDQUFDLENBQUM7UUFDMUksK0NBQW1CLEdBQUcsR0FBRyxDQUFD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