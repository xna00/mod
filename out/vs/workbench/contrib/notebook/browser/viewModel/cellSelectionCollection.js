/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellSelectionCollection = void 0;
    function rangesEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i].start !== b[i].start || a[i].end !== b[i].end) {
                return false;
            }
        }
        return true;
    }
    // Challenge is List View talks about `element`, which needs extra work to convert to ICellRange as we support Folding and Cell Move
    class NotebookCellSelectionCollection extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this._primary = null;
            this._selections = [];
        }
        get onDidChangeSelection() { return this._onDidChangeSelection.event; }
        get selections() {
            return this._selections;
        }
        get focus() {
            return this._primary ?? { start: 0, end: 0 };
        }
        setState(primary, selections, forceEventEmit, source) {
            const changed = primary !== this._primary || !rangesEqual(this._selections, selections);
            this._primary = primary;
            this._selections = selections;
            if (changed || forceEventEmit) {
                this._onDidChangeSelection.fire(source);
            }
        }
        setSelections(selections, forceEventEmit, source) {
            this.setState(this._primary, selections, forceEventEmit, source);
        }
    }
    exports.NotebookCellSelectionCollection = NotebookCellSelectionCollection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFNlbGVjdGlvbkNvbGxlY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlld01vZGVsL2NlbGxTZWxlY3Rpb25Db2xsZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxTQUFTLFdBQVcsQ0FBQyxDQUFlLEVBQUUsQ0FBZTtRQUNwRCxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzNCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDbkMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3hELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFFRCxvSUFBb0k7SUFDcEksTUFBYSwrQkFBZ0MsU0FBUSxzQkFBVTtRQUEvRDs7WUFFa0IsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7WUFHdkUsYUFBUSxHQUFzQixJQUFJLENBQUM7WUFFbkMsZ0JBQVcsR0FBaUIsRUFBRSxDQUFDO1FBdUJ4QyxDQUFDO1FBM0JBLElBQUksb0JBQW9CLEtBQW9CLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFNdEYsSUFBSSxVQUFVO1lBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUM5QyxDQUFDO1FBRUQsUUFBUSxDQUFDLE9BQTBCLEVBQUUsVUFBd0IsRUFBRSxjQUF1QixFQUFFLE1BQXdCO1lBQy9HLE1BQU0sT0FBTyxHQUFHLE9BQU8sS0FBSyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFeEYsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxPQUFPLElBQUksY0FBYyxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekMsQ0FBQztRQUNGLENBQUM7UUFFRCxhQUFhLENBQUMsVUFBd0IsRUFBRSxjQUF1QixFQUFFLE1BQXdCO1lBQ3hGLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2xFLENBQUM7S0FDRDtJQTlCRCwwRUE4QkMifQ==