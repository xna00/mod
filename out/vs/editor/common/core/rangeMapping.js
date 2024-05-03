/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/editor/common/core/range", "vs/editor/common/core/textLength"], function (require, exports, arraysFind_1, range_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PositionOrRange = exports.SingleRangeMapping = exports.RangeMapping = void 0;
    /**
     * Represents a list of mappings of ranges from one document to another.
     */
    class RangeMapping {
        constructor(mappings) {
            this.mappings = mappings;
        }
        mapPosition(position) {
            const mapping = (0, arraysFind_1.findLastMonotonous)(this.mappings, m => m.original.getStartPosition().isBeforeOrEqual(position));
            if (!mapping) {
                return PositionOrRange.position(position);
            }
            if (mapping.original.containsPosition(position)) {
                return PositionOrRange.range(mapping.modified);
            }
            const l = textLength_1.TextLength.betweenPositions(mapping.original.getEndPosition(), position);
            return PositionOrRange.position(l.addToPosition(mapping.modified.getEndPosition()));
        }
        mapRange(range) {
            const start = this.mapPosition(range.getStartPosition());
            const end = this.mapPosition(range.getEndPosition());
            return range_1.Range.fromPositions(start.range?.getStartPosition() ?? start.position, end.range?.getEndPosition() ?? end.position);
        }
        reverse() {
            return new RangeMapping(this.mappings.map(mapping => mapping.reverse()));
        }
    }
    exports.RangeMapping = RangeMapping;
    class SingleRangeMapping {
        constructor(original, modified) {
            this.original = original;
            this.modified = modified;
        }
        reverse() {
            return new SingleRangeMapping(this.modified, this.original);
        }
        toString() {
            return `${this.original.toString()} -> ${this.modified.toString()}`;
        }
    }
    exports.SingleRangeMapping = SingleRangeMapping;
    class PositionOrRange {
        static position(position) {
            return new PositionOrRange(position, undefined);
        }
        static range(range) {
            return new PositionOrRange(undefined, range);
        }
        constructor(position, range) {
            this.position = position;
            this.range = range;
        }
    }
    exports.PositionOrRange = PositionOrRange;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2VNYXBwaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2NvcmUvcmFuZ2VNYXBwaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRzs7T0FFRztJQUNILE1BQWEsWUFBWTtRQUN4QixZQUE0QixRQUF1QztZQUF2QyxhQUFRLEdBQVIsUUFBUSxDQUErQjtRQUNuRSxDQUFDO1FBRUQsV0FBVyxDQUFDLFFBQWtCO1lBQzdCLE1BQU0sT0FBTyxHQUFHLElBQUEsK0JBQWtCLEVBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNoSCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxlQUFlLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzNDLENBQUM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDakQsT0FBTyxlQUFlLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoRCxDQUFDO1lBQ0QsTUFBTSxDQUFDLEdBQUcsdUJBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ25GLE9BQU8sZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFFRCxRQUFRLENBQUMsS0FBWTtZQUNwQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDekQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztZQUNyRCxPQUFPLGFBQUssQ0FBQyxhQUFhLENBQ3pCLEtBQUssQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUyxFQUNsRCxHQUFHLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxRQUFTLENBQzVDLENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTztZQUNOLE9BQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFFLENBQUM7S0FDRDtJQTVCRCxvQ0E0QkM7SUFFRCxNQUFhLGtCQUFrQjtRQUM5QixZQUNpQixRQUFlLEVBQ2YsUUFBZTtZQURmLGFBQVEsR0FBUixRQUFRLENBQU87WUFDZixhQUFRLEdBQVIsUUFBUSxDQUFPO1FBRWhDLENBQUM7UUFFRCxPQUFPO1lBQ04sT0FBTyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxRQUFRO1lBQ1AsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO1FBQ3JFLENBQUM7S0FDRDtJQWRELGdEQWNDO0lBRUQsTUFBYSxlQUFlO1FBQ3BCLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBa0I7WUFDeEMsT0FBTyxJQUFJLGVBQWUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVNLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBWTtZQUMvQixPQUFPLElBQUksZUFBZSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsWUFDaUIsUUFBOEIsRUFDOUIsS0FBd0I7WUFEeEIsYUFBUSxHQUFSLFFBQVEsQ0FBc0I7WUFDOUIsVUFBSyxHQUFMLEtBQUssQ0FBbUI7UUFDckMsQ0FBQztLQUNMO0lBYkQsMENBYUMifQ==