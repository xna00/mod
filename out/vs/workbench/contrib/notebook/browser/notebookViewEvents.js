/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellStateChangedEvent = exports.NotebookMetadataChangedEvent = exports.NotebookLayoutChangedEvent = exports.NotebookViewEventType = void 0;
    var NotebookViewEventType;
    (function (NotebookViewEventType) {
        NotebookViewEventType[NotebookViewEventType["LayoutChanged"] = 1] = "LayoutChanged";
        NotebookViewEventType[NotebookViewEventType["MetadataChanged"] = 2] = "MetadataChanged";
        NotebookViewEventType[NotebookViewEventType["CellStateChanged"] = 3] = "CellStateChanged";
    })(NotebookViewEventType || (exports.NotebookViewEventType = NotebookViewEventType = {}));
    class NotebookLayoutChangedEvent {
        constructor(source, value) {
            this.source = source;
            this.value = value;
            this.type = NotebookViewEventType.LayoutChanged;
        }
    }
    exports.NotebookLayoutChangedEvent = NotebookLayoutChangedEvent;
    class NotebookMetadataChangedEvent {
        constructor(source) {
            this.source = source;
            this.type = NotebookViewEventType.MetadataChanged;
        }
    }
    exports.NotebookMetadataChangedEvent = NotebookMetadataChangedEvent;
    class NotebookCellStateChangedEvent {
        constructor(source, cell) {
            this.source = source;
            this.cell = cell;
            this.type = NotebookViewEventType.CellStateChanged;
        }
    }
    exports.NotebookCellStateChangedEvent = NotebookCellStateChangedEvent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWaWV3RXZlbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL25vdGVib29rVmlld0V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzQ2hHLElBQVkscUJBSVg7SUFKRCxXQUFZLHFCQUFxQjtRQUNoQyxtRkFBaUIsQ0FBQTtRQUNqQix1RkFBbUIsQ0FBQTtRQUNuQix5RkFBb0IsQ0FBQTtJQUNyQixDQUFDLEVBSlcscUJBQXFCLHFDQUFyQixxQkFBcUIsUUFJaEM7SUFFRCxNQUFhLDBCQUEwQjtRQUd0QyxZQUFxQixNQUFpQyxFQUFXLEtBQXlCO1lBQXJFLFdBQU0sR0FBTixNQUFNLENBQTJCO1lBQVcsVUFBSyxHQUFMLEtBQUssQ0FBb0I7WUFGMUUsU0FBSSxHQUFHLHFCQUFxQixDQUFDLGFBQWEsQ0FBQztRQUkzRCxDQUFDO0tBQ0Q7SUFORCxnRUFNQztJQUdELE1BQWEsNEJBQTRCO1FBR3hDLFlBQXFCLE1BQWdDO1lBQWhDLFdBQU0sR0FBTixNQUFNLENBQTBCO1lBRnJDLFNBQUksR0FBRyxxQkFBcUIsQ0FBQyxlQUFlLENBQUM7UUFJN0QsQ0FBQztLQUNEO0lBTkQsb0VBTUM7SUFFRCxNQUFhLDZCQUE2QjtRQUd6QyxZQUFxQixNQUFxQyxFQUFXLElBQTJCO1lBQTNFLFdBQU0sR0FBTixNQUFNLENBQStCO1lBQVcsU0FBSSxHQUFKLElBQUksQ0FBdUI7WUFGaEYsU0FBSSxHQUFHLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDO1FBSTlELENBQUM7S0FDRDtJQU5ELHNFQU1DIn0=