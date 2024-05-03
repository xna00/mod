/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model"], function (require, exports, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlyphMarginLanesModel = void 0;
    const MAX_LANE = model_1.GlyphMarginLane.Right;
    class GlyphMarginLanesModel {
        constructor(maxLine) {
            this.persist = 0;
            this._requiredLanes = 1; // always render at least one lane
            this.lanes = new Uint8Array(Math.ceil(((maxLine + 1) * MAX_LANE) / 8));
        }
        reset(maxLine) {
            const bytes = Math.ceil(((maxLine + 1) * MAX_LANE) / 8);
            if (this.lanes.length < bytes) {
                this.lanes = new Uint8Array(bytes);
            }
            else {
                this.lanes.fill(0);
            }
            this._requiredLanes = 1;
        }
        get requiredLanes() {
            return this._requiredLanes;
        }
        push(lane, range, persist) {
            if (persist) {
                this.persist |= (1 << (lane - 1));
            }
            for (let i = range.startLineNumber; i <= range.endLineNumber; i++) {
                const bit = (MAX_LANE * i) + (lane - 1);
                this.lanes[bit >>> 3] |= (1 << (bit % 8));
                this._requiredLanes = Math.max(this._requiredLanes, this.countAtLine(i));
            }
        }
        getLanesAtLine(lineNumber) {
            const lanes = [];
            let bit = MAX_LANE * lineNumber;
            for (let i = 0; i < MAX_LANE; i++) {
                if (this.persist & (1 << i) || this.lanes[bit >>> 3] & (1 << (bit % 8))) {
                    lanes.push(i + 1);
                }
                bit++;
            }
            return lanes.length ? lanes : [model_1.GlyphMarginLane.Center];
        }
        countAtLine(lineNumber) {
            let bit = MAX_LANE * lineNumber;
            let count = 0;
            for (let i = 0; i < MAX_LANE; i++) {
                if (this.persist & (1 << i) || this.lanes[bit >>> 3] & (1 << (bit % 8))) {
                    count++;
                }
                bit++;
            }
            return count;
        }
    }
    exports.GlyphMarginLanesModel = GlyphMarginLanesModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2x5cGhMYW5lc01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3ZpZXdNb2RlbC9nbHlwaExhbmVzTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQU0sUUFBUSxHQUFHLHVCQUFlLENBQUMsS0FBSyxDQUFDO0lBRXZDLE1BQWEscUJBQXFCO1FBS2pDLFlBQVksT0FBZTtZQUhuQixZQUFPLEdBQUcsQ0FBQyxDQUFDO1lBQ1osbUJBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQyxrQ0FBa0M7WUFHN0QsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRU0sS0FBSyxDQUFDLE9BQWU7WUFDM0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3hELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLENBQUM7WUFDRCxJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBRUQsSUFBVyxhQUFhO1lBQ3ZCLE9BQU8sSUFBSSxDQUFD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