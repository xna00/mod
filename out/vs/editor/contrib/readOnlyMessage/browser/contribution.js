/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/contrib/message/browser/messageController", "vs/nls"], function (require, exports, htmlContent_1, lifecycle_1, editorExtensions_1, messageController_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReadOnlyMessageController = void 0;
    class ReadOnlyMessageController extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.readOnlyMessageController'; }
        constructor(editor) {
            super();
            this.editor = editor;
            this._register(this.editor.onDidAttemptReadOnlyEdit(() => this._onDidAttemptReadOnlyEdit()));
        }
        _onDidAttemptReadOnlyEdit() {
            const messageController = messageController_1.MessageController.get(this.editor);
            if (messageController && this.editor.hasModel()) {
                let message = this.editor.getOptions().get(92 /* EditorOption.readOnlyMessage */);
                if (!message) {
                    if (this.editor.isSimpleWidget) {
                        message = new htmlContent_1.MarkdownString(nls.localize('editor.simple.readonly', "Cannot edit in read-only input"));
                    }
                    else {
                        message = new htmlContent_1.MarkdownString(nls.localize('editor.readonly', "Cannot edit in read-only editor"));
                    }
                }
                messageController.showMessage(message, this.editor.getPosition());
            }
        }
    }
    exports.ReadOnlyMessageController = ReadOnlyMessageController;
    (0, editorExtensions_1.registerEditorContribution)(ReadOnlyMessageController.ID, ReadOnlyMessageController, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9yZWFkT25seU1lc3NhZ2UvYnJvd3Nlci9jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEseUJBQTBCLFNBQVEsc0JBQVU7aUJBRWpDLE9BQUUsR0FBRywwQ0FBMEMsQ0FBQztRQUV2RSxZQUNrQixNQUFtQjtZQUVwQyxLQUFLLEVBQUUsQ0FBQztZQUZTLFdBQU0sR0FBTixNQUFNLENBQWE7WUFHcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5RixDQUFDO1FBRU8seUJBQXlCO1lBQ2hDLE1BQU0saUJBQWlCLEdBQUcscUNBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3RCxJQUFJLGlCQUFpQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLHVDQUE4QixDQUFDO2dCQUN6RSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDO3dCQUNoQyxPQUFPLEdBQUcsSUFBSSw0QkFBYyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsd0JBQXdCLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO29CQUN4RyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsT0FBTyxHQUFHLElBQUksNEJBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLGlDQUFpQyxDQUFDLENBQUMsQ0FBQztvQkFDbEcsQ0FBQztnQkFDRixDQUFDO2dCQUVELGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLENBQUM7UUFDRixDQUFDOztJQXpCRiw4REEwQkM7SUFFRCxJQUFBLDZDQUEwQixFQUFDLHlCQUF5QixDQUFDLEVBQUUsRUFBRSx5QkFBeUIsaUVBQXlELENBQUMifQ==