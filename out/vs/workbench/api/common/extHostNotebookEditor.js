/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, errors_1, extHostConverter, extHostTypes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookEditor = void 0;
    class ExtHostNotebookEditor {
        static { this.apiEditorsToExtHost = new WeakMap(); }
        constructor(id, _proxy, notebookData, visibleRanges, selections, viewColumn) {
            this.id = id;
            this._proxy = _proxy;
            this.notebookData = notebookData;
            this._selections = [];
            this._visibleRanges = [];
            this._visible = false;
            this._selections = selections;
            this._visibleRanges = visibleRanges;
            this._viewColumn = viewColumn;
        }
        get apiEditor() {
            if (!this._editor) {
                const that = this;
                this._editor = {
                    get notebook() {
                        return that.notebookData.apiNotebook;
                    },
                    get selection() {
                        return that._selections[0];
                    },
                    set selection(selection) {
                        this.selections = [selection];
                    },
                    get selections() {
                        return that._selections;
                    },
                    set selections(value) {
                        if (!Array.isArray(value) || !value.every(extHostTypes.NotebookRange.isNotebookRange)) {
                            throw (0, errors_1.illegalArgument)('selections');
                        }
                        that._selections = value;
                        that._trySetSelections(value);
                    },
                    get visibleRanges() {
                        return that._visibleRanges;
                    },
                    revealRange(range, revealType) {
                        that._proxy.$tryRevealRange(that.id, extHostConverter.NotebookRange.from(range), revealType ?? extHostTypes.NotebookEditorRevealType.Default);
                    },
                    get viewColumn() {
                        return that._viewColumn;
                    },
                };
                ExtHostNotebookEditor.apiEditorsToExtHost.set(this._editor, this);
            }
            return this._editor;
        }
        get visible() {
            return this._visible;
        }
        _acceptVisibility(value) {
            this._visible = value;
        }
        _acceptVisibleRanges(value) {
            this._visibleRanges = value;
        }
        _acceptSelections(selections) {
            this._selections = selections;
        }
        _trySetSelections(value) {
            this._proxy.$trySetSelections(this.id, value.map(extHostConverter.NotebookRange.from));
        }
        _acceptViewColumn(value) {
            this._viewColumn = value;
        }
    }
    exports.ExtHostNotebookEditor = ExtHostNotebookEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Tm90ZWJvb2tFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEscUJBQXFCO2lCQUVWLHdCQUFtQixHQUFHLElBQUksT0FBTyxFQUFnRCxBQUE5RCxDQUErRDtRQVV6RyxZQUNVLEVBQVUsRUFDRixNQUFzQyxFQUM5QyxZQUFxQyxFQUM5QyxhQUFxQyxFQUNyQyxVQUFrQyxFQUNsQyxVQUF5QztZQUxoQyxPQUFFLEdBQUYsRUFBRSxDQUFRO1lBQ0YsV0FBTSxHQUFOLE1BQU0sQ0FBZ0M7WUFDOUMsaUJBQVksR0FBWixZQUFZLENBQXlCO1lBWHZDLGdCQUFXLEdBQTJCLEVBQUUsQ0FBQztZQUN6QyxtQkFBYyxHQUEyQixFQUFFLENBQUM7WUFHNUMsYUFBUSxHQUFZLEtBQUssQ0FBQztZQVlqQyxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5QixJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztZQUNwQyxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUMvQixDQUFDO1FBRUQsSUFBSSxTQUFTO1lBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO2dCQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHO29CQUNkLElBQUksUUFBUTt3QkFDWCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDO29CQUN0QyxDQUFDO29CQUNELElBQUksU0FBUzt3QkFDWixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVCLENBQUM7b0JBQ0QsSUFBSSxTQUFTLENBQUMsU0FBK0I7d0JBQzVDLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDL0IsQ0FBQztvQkFDRCxJQUFJLFVBQVU7d0JBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO29CQUN6QixDQUFDO29CQUNELElBQUksVUFBVSxDQUFDLEtBQTZCO3dCQUMzQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDOzRCQUN2RixNQUFNLElBQUEsd0JBQWUsRUFBQyxZQUFZLENBQUMsQ0FBQzt3QkFDckMsQ0FBQzt3QkFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQzt3QkFDekIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMvQixDQUFDO29CQUNELElBQUksYUFBYTt3QkFDaEIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO29CQUM1QixDQUFDO29CQUNELFdBQVcsQ0FBQyxLQUFLLEVBQUUsVUFBVTt3QkFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQzFCLElBQUksQ0FBQyxFQUFFLEVBQ1AsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFDMUMsVUFBVSxJQUFJLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQzNELENBQUM7b0JBQ0gsQ0FBQztvQkFDRCxJQUFJLFVBQVU7d0JBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO29CQUN6QixDQUFDO2lCQUNELENBQUM7Z0JBRUYscUJBQXFCLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkUsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsSUFBSSxPQUFPO1lBQ1YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxLQUFjO1lBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxvQkFBb0IsQ0FBQyxLQUE2QjtZQUNqRCxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztRQUM3QixDQUFDO1FBRUQsaUJBQWlCLENBQUMsVUFBa0M7WUFDbkQsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDL0IsQ0FBQztRQUVPLGlCQUFpQixDQUFDLEtBQTZCO1lBQ3RELElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxLQUFvQztZQUNyRCxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUMxQixDQUFDOztJQTFGRixzREEyRkMifQ==