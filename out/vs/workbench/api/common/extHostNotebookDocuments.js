/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri"], function (require, exports, event_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookDocuments = void 0;
    class ExtHostNotebookDocuments {
        constructor(_notebooksAndEditors) {
            this._notebooksAndEditors = _notebooksAndEditors;
            this._onDidSaveNotebookDocument = new event_1.Emitter();
            this.onDidSaveNotebookDocument = this._onDidSaveNotebookDocument.event;
            this._onDidChangeNotebookDocument = new event_1.Emitter();
            this.onDidChangeNotebookDocument = this._onDidChangeNotebookDocument.event;
        }
        $acceptModelChanged(uri, event, isDirty, newMetadata) {
            const document = this._notebooksAndEditors.getNotebookDocument(uri_1.URI.revive(uri));
            const e = document.acceptModelChanged(event.value, isDirty, newMetadata);
            this._onDidChangeNotebookDocument.fire(e);
        }
        $acceptDirtyStateChanged(uri, isDirty) {
            const document = this._notebooksAndEditors.getNotebookDocument(uri_1.URI.revive(uri));
            document.acceptDirty(isDirty);
        }
        $acceptModelSaved(uri) {
            const document = this._notebooksAndEditors.getNotebookDocument(uri_1.URI.revive(uri));
            this._onDidSaveNotebookDocument.fire(document.apiNotebook);
        }
    }
    exports.ExtHostNotebookDocuments = ExtHostNotebookDocuments;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rRG9jdW1lbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Tm90ZWJvb2tEb2N1bWVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsd0JBQXdCO1FBUXBDLFlBQ2tCLG9CQUErQztZQUEvQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQTJCO1lBUGhELCtCQUEwQixHQUFHLElBQUksZUFBTyxFQUEyQixDQUFDO1lBQzVFLDhCQUF5QixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUM7WUFFMUQsaUNBQTRCLEdBQUcsSUFBSSxlQUFPLEVBQXNDLENBQUM7WUFDekYsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEtBQUssQ0FBQztRQUkzRSxDQUFDO1FBRUwsbUJBQW1CLENBQUMsR0FBa0IsRUFBRSxLQUFrRixFQUFFLE9BQWdCLEVBQUUsV0FBc0M7WUFDbkwsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLG1CQUFtQixDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNoRixNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDekUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsd0JBQXdCLENBQUMsR0FBa0IsRUFBRSxPQUFnQjtZQUM1RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsbUJBQW1CLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELGlCQUFpQixDQUFDLEdBQWtCO1lBQ25DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEYsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDNUQsQ0FBQztLQUNEO0lBM0JELDREQTJCQyJ9