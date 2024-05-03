/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookDiffEditorEventDispatcher = exports.NotebookCellLayoutChangedEvent = exports.NotebookDiffLayoutChangedEvent = exports.NotebookDiffViewEventType = void 0;
    var NotebookDiffViewEventType;
    (function (NotebookDiffViewEventType) {
        NotebookDiffViewEventType[NotebookDiffViewEventType["LayoutChanged"] = 1] = "LayoutChanged";
        NotebookDiffViewEventType[NotebookDiffViewEventType["CellLayoutChanged"] = 2] = "CellLayoutChanged";
        // MetadataChanged = 2,
        // CellStateChanged = 3
    })(NotebookDiffViewEventType || (exports.NotebookDiffViewEventType = NotebookDiffViewEventType = {}));
    class NotebookDiffLayoutChangedEvent {
        constructor(source, value) {
            this.source = source;
            this.value = value;
            this.type = NotebookDiffViewEventType.LayoutChanged;
        }
    }
    exports.NotebookDiffLayoutChangedEvent = NotebookDiffLayoutChangedEvent;
    class NotebookCellLayoutChangedEvent {
        constructor(source) {
            this.source = source;
            this.type = NotebookDiffViewEventType.CellLayoutChanged;
        }
    }
    exports.NotebookCellLayoutChangedEvent = NotebookCellLayoutChangedEvent;
    class NotebookDiffEditorEventDispatcher extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeLayout = this._register(new event_1.Emitter());
            this.onDidChangeLayout = this._onDidChangeLayout.event;
            this._onDidChangeCellLayout = this._register(new event_1.Emitter());
            this.onDidChangeCellLayout = this._onDidChangeCellLayout.event;
        }
        emit(events) {
            for (let i = 0, len = events.length; i < len; i++) {
                const e = events[i];
                switch (e.type) {
                    case NotebookDiffViewEventType.LayoutChanged:
                        this._onDidChangeLayout.fire(e);
                        break;
                    case NotebookDiffViewEventType.CellLayoutChanged:
                        this._onDidChangeCellLayout.fire(e);
                        break;
                }
            }
        }
    }
    exports.NotebookDiffEditorEventDispatcher = NotebookDiffEditorEventDispatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnREaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2RpZmYvZXZlbnREaXNwYXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxJQUFZLHlCQUtYO0lBTEQsV0FBWSx5QkFBeUI7UUFDcEMsMkZBQWlCLENBQUE7UUFDakIsbUdBQXFCLENBQUE7UUFDckIsdUJBQXVCO1FBQ3ZCLHVCQUF1QjtJQUN4QixDQUFDLEVBTFcseUJBQXlCLHlDQUF6Qix5QkFBeUIsUUFLcEM7SUFFRCxNQUFhLDhCQUE4QjtRQUcxQyxZQUFxQixNQUFpQyxFQUFXLEtBQXlCO1lBQXJFLFdBQU0sR0FBTixNQUFNLENBQTJCO1lBQVcsVUFBSyxHQUFMLEtBQUssQ0FBb0I7WUFGMUUsU0FBSSxHQUFHLHlCQUF5QixDQUFDLGFBQWEsQ0FBQztRQUkvRCxDQUFDO0tBQ0Q7SUFORCx3RUFNQztJQUVELE1BQWEsOEJBQThCO1FBRzFDLFlBQXFCLE1BQThCO1lBQTlCLFdBQU0sR0FBTixNQUFNLENBQXdCO1lBRm5DLFNBQUksR0FBRyx5QkFBeUIsQ0FBQyxpQkFBaUIsQ0FBQztRQUluRSxDQUFDO0tBQ0Q7SUFORCx3RUFNQztJQUlELE1BQWEsaUNBQWtDLFNBQVEsc0JBQVU7UUFBakU7O1lBQ29CLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWtDLENBQUMsQ0FBQztZQUM3RixzQkFBaUIsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBRXhDLDJCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWtDLENBQUMsQ0FBQztZQUNqRywwQkFBcUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1FBZ0JwRSxDQUFDO1FBZEEsSUFBSSxDQUFDLE1BQStCO1lBQ25DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVwQixRQUFRLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDaEIsS0FBSyx5QkFBeUIsQ0FBQyxhQUFhO3dCQUMzQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNoQyxNQUFNO29CQUNQLEtBQUsseUJBQXlCLENBQUMsaUJBQWlCO3dCQUMvQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNwQyxNQUFNO2dCQUNSLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBckJELDhFQXFCQyJ9