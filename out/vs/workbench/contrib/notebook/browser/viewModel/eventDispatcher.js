/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/notebookViewEvents"], function (require, exports, event_1, lifecycle_1, notebookViewEvents_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEventDispatcher = void 0;
    class NotebookEventDispatcher extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeLayout = this._register(new event_1.Emitter());
            this.onDidChangeLayout = this._onDidChangeLayout.event;
            this._onDidChangeMetadata = this._register(new event_1.Emitter());
            this.onDidChangeMetadata = this._onDidChangeMetadata.event;
            this._onDidChangeCellState = this._register(new event_1.Emitter());
            this.onDidChangeCellState = this._onDidChangeCellState.event;
        }
        emit(events) {
            for (let i = 0, len = events.length; i < len; i++) {
                const e = events[i];
                switch (e.type) {
                    case notebookViewEvents_1.NotebookViewEventType.LayoutChanged:
                        this._onDidChangeLayout.fire(e);
                        break;
                    case notebookViewEvents_1.NotebookViewEventType.MetadataChanged:
                        this._onDidChangeMetadata.fire(e);
                        break;
                    case notebookViewEvents_1.NotebookViewEventType.CellStateChanged:
                        this._onDidChangeCellState.fire(e);
                        break;
                }
            }
        }
    }
    exports.NotebookEventDispatcher = NotebookEventDispatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnREaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXdNb2RlbC9ldmVudERpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsdUJBQXdCLFNBQVEsc0JBQVU7UUFBdkQ7O1lBQ2tCLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQThCLENBQUMsQ0FBQztZQUN2RixzQkFBaUIsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBRTFDLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWdDLENBQUMsQ0FBQztZQUMzRix3QkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBRTlDLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWlDLENBQUMsQ0FBQztZQUM3Rix5QkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1FBbUJsRSxDQUFDO1FBakJBLElBQUksQ0FBQyxNQUEyQjtZQUMvQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFcEIsUUFBUSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2hCLEtBQUssMENBQXFCLENBQUMsYUFBYTt3QkFDdkMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDaEMsTUFBTTtvQkFDUCxLQUFLLDBDQUFxQixDQUFDLGVBQWU7d0JBQ3pDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2xDLE1BQU07b0JBQ1AsS0FBSywwQ0FBcUIsQ0FBQyxnQkFBZ0I7d0JBQzFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ25DLE1BQU07Z0JBQ1IsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUEzQkQsMERBMkJDIn0=