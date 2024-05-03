/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentContextKeys = void 0;
    var CommentContextKeys;
    (function (CommentContextKeys) {
        /**
         * A context key that is set when the active cursor is in a commenting range.
         */
        CommentContextKeys.activeCursorHasCommentingRange = new contextkey_1.RawContextKey('activeCursorHasCommentingRange', false, {
            description: nls.localize('hasCommentingRange', "Whether the position at the active cursor has a commenting range"),
            type: 'boolean'
        });
        /**
         * A context key that is set when the active editor has commenting ranges.
         */
        CommentContextKeys.activeEditorHasCommentingRange = new contextkey_1.RawContextKey('activeEditorHasCommentingRange', false, {
            description: nls.localize('editorHasCommentingRange', "Whether the active editor has a commenting range"),
            type: 'boolean'
        });
        /**
         * A context key that is set when the workspace has either comments or commenting ranges.
         */
        CommentContextKeys.WorkspaceHasCommenting = new contextkey_1.RawContextKey('workspaceHasCommenting', false, {
            description: nls.localize('hasCommentingProvider', "Whether the open workspace has either comments or commenting ranges."),
            type: 'boolean'
        });
        /**
         * A context key that is set when the comment thread has no comments.
         */
        CommentContextKeys.commentThreadIsEmpty = new contextkey_1.RawContextKey('commentThreadIsEmpty', false, { type: 'boolean', description: nls.localize('commentThreadIsEmpty', "Set when the comment thread has no comments") });
        /**
         * A context key that is set when the comment has no input.
         */
        CommentContextKeys.commentIsEmpty = new contextkey_1.RawContextKey('commentIsEmpty', false, { type: 'boolean', description: nls.localize('commentIsEmpty', "Set when the comment has no input") });
        /**
         * The context value of the comment.
         */
        CommentContextKeys.commentContext = new contextkey_1.RawContextKey('comment', undefined, { type: 'string', description: nls.localize('comment', "The context value of the comment") });
        /**
         * The context value of the comment thread.
         */
        CommentContextKeys.commentThreadContext = new contextkey_1.RawContextKey('commentThread', undefined, { type: 'string', description: nls.localize('commentThread', "The context value of the comment thread") });
        /**
         * The comment controller id associated with a comment thread.
         */
        CommentContextKeys.commentControllerContext = new contextkey_1.RawContextKey('commentController', undefined, { type: 'string', description: nls.localize('commentController', "The comment controller id associated with a comment thread") });
        /**
         * The comment widget is focused.
         */
        CommentContextKeys.commentFocused = new contextkey_1.RawContextKey('commentFocused', false, { type: 'boolean', description: nls.localize('commentFocused', "Set when the comment is focused") });
    })(CommentContextKeys || (exports.CommentContextKeys = CommentContextKeys = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudENvbnRleHRLZXlzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9jb21tb24vY29tbWVudENvbnRleHRLZXlzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxJQUFpQixrQkFBa0IsQ0FtRGxDO0lBbkRELFdBQWlCLGtCQUFrQjtRQUVsQzs7V0FFRztRQUNVLGlEQUE4QixHQUFHLElBQUksMEJBQWEsQ0FBVSxnQ0FBZ0MsRUFBRSxLQUFLLEVBQUU7WUFDakgsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsa0VBQWtFLENBQUM7WUFDbkgsSUFBSSxFQUFFLFNBQVM7U0FDZixDQUFDLENBQUM7UUFFSDs7V0FFRztRQUNVLGlEQUE4QixHQUFHLElBQUksMEJBQWEsQ0FBVSxnQ0FBZ0MsRUFBRSxLQUFLLEVBQUU7WUFDakgsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLEVBQUUsa0RBQWtELENBQUM7WUFDekcsSUFBSSxFQUFFLFNBQVM7U0FDZixDQUFDLENBQUM7UUFFSDs7V0FFRztRQUNVLHlDQUFzQixHQUFHLElBQUksMEJBQWEsQ0FBVSx3QkFBd0IsRUFBRSxLQUFLLEVBQUU7WUFDakcsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsc0VBQXNFLENBQUM7WUFDMUgsSUFBSSxFQUFFLFNBQVM7U0FDZixDQUFDLENBQUM7UUFFSDs7V0FFRztRQUNVLHVDQUFvQixHQUFHLElBQUksMEJBQWEsQ0FBVSxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLDZDQUE2QyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3JOOztXQUVHO1FBQ1UsaUNBQWMsR0FBRyxJQUFJLDBCQUFhLENBQVUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxtQ0FBbUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN6TDs7V0FFRztRQUNVLGlDQUFjLEdBQUcsSUFBSSwwQkFBYSxDQUFTLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxrQ0FBa0MsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1Szs7V0FFRztRQUNVLHVDQUFvQixHQUFHLElBQUksMEJBQWEsQ0FBUyxlQUFlLEVBQUUsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUseUNBQXlDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDck07O1dBRUc7UUFDVSwyQ0FBd0IsR0FBRyxJQUFJLDBCQUFhLENBQVMsbUJBQW1CLEVBQUUsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSw0REFBNEQsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVwTzs7V0FFRztRQUNVLGlDQUFjLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGdCQUFnQixFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsaUNBQWlDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDeEwsQ0FBQyxFQW5EZ0Isa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFtRGxDIn0=