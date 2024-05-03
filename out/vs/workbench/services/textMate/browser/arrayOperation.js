/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays"], function (require, exports, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CombinedIndexTransformer = exports.MonotonousIndexTransformer = exports.SingleArrayEdit = exports.ArrayEdit = void 0;
    class ArrayEdit {
        constructor(
        /**
         * Disjoint edits that are applied in parallel
         */
        edits) {
            this.edits = edits.slice().sort((0, arrays_1.compareBy)(c => c.offset, arrays_1.numberComparator));
        }
        applyToArray(array) {
            for (let i = this.edits.length - 1; i >= 0; i--) {
                const c = this.edits[i];
                array.splice(c.offset, c.length, ...new Array(c.newLength));
            }
        }
    }
    exports.ArrayEdit = ArrayEdit;
    class SingleArrayEdit {
        constructor(offset, length, newLength) {
            this.offset = offset;
            this.length = length;
            this.newLength = newLength;
        }
        toString() {
            return `[${this.offset}, +${this.length}) -> +${this.newLength}}`;
        }
    }
    exports.SingleArrayEdit = SingleArrayEdit;
    /**
     * Can only be called with increasing values of `index`.
    */
    class MonotonousIndexTransformer {
        static fromMany(transformations) {
            // TODO improve performance by combining transformations first
            const transformers = transformations.map(t => new MonotonousIndexTransformer(t));
            return new CombinedIndexTransformer(transformers);
        }
        constructor(transformation) {
            this.transformation = transformation;
            this.idx = 0;
            this.offset = 0;
        }
        /**
         * Precondition: index >= previous-value-of(index).
         */
        transform(index) {
            let nextChange = this.transformation.edits[this.idx];
            while (nextChange && nextChange.offset + nextChange.length <= index) {
                this.offset += nextChange.newLength - nextChange.length;
                this.idx++;
                nextChange = this.transformation.edits[this.idx];
            }
            // assert nextChange === undefined || index < nextChange.offset + nextChange.length
            if (nextChange && nextChange.offset <= index) {
                // Offset is touched by the change
                return undefined;
            }
            return index + this.offset;
        }
    }
    exports.MonotonousIndexTransformer = MonotonousIndexTransformer;
    class CombinedIndexTransformer {
        constructor(transformers) {
            this.transformers = transformers;
        }
        transform(index) {
            for (const transformer of this.transformers) {
                const result = transformer.transform(index);
                if (result === undefined) {
                    return undefined;
                }
                index = result;
            }
            return index;
        }
    }
    exports.CombinedIndexTransformer = CombinedIndexTransformer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlPcGVyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0TWF0ZS9icm93c2VyL2FycmF5T3BlcmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRyxNQUFhLFNBQVM7UUFHckI7UUFDQzs7V0FFRztRQUNILEtBQWlDO1lBRWpDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFBLGtCQUFTLEVBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLHlCQUFnQixDQUFDLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRUQsWUFBWSxDQUFDLEtBQVk7WUFDeEIsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzdELENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFsQkQsOEJBa0JDO0lBRUQsTUFBYSxlQUFlO1FBQzNCLFlBQ2lCLE1BQWMsRUFDZCxNQUFjLEVBQ2QsU0FBaUI7WUFGakIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUNkLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxjQUFTLEdBQVQsU0FBUyxDQUFRO1FBQzlCLENBQUM7UUFFTCxRQUFRO1lBQ1AsT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLE1BQU0sSUFBSSxDQUFDLE1BQU0sU0FBUyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUM7UUFDbkUsQ0FBQztLQUNEO0lBVkQsMENBVUM7SUFNRDs7TUFFRTtJQUNGLE1BQWEsMEJBQTBCO1FBQy9CLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBNEI7WUFDbEQsOERBQThEO1lBQzlELE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakYsT0FBTyxJQUFJLHdCQUF3QixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFLRCxZQUE2QixjQUF5QjtZQUF6QixtQkFBYyxHQUFkLGNBQWMsQ0FBVztZQUg5QyxRQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ1IsV0FBTSxHQUFHLENBQUMsQ0FBQztRQUduQixDQUFDO1FBRUQ7O1dBRUc7UUFDSCxTQUFTLENBQUMsS0FBYTtZQUN0QixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFnQyxDQUFDO1lBQ3BGLE9BQU8sVUFBVSxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDckUsSUFBSSxDQUFDLE1BQU0sSUFBSSxVQUFVLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7Z0JBQ3hELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxVQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xELENBQUM7WUFDRCxtRkFBbUY7WUFFbkYsSUFBSSxVQUFVLElBQUksVUFBVSxDQUFDLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDOUMsa0NBQWtDO2dCQUNsQyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUM1QixDQUFDO0tBQ0Q7SUFoQ0QsZ0VBZ0NDO0lBRUQsTUFBYSx3QkFBd0I7UUFDcEMsWUFDa0IsWUFBaUM7WUFBakMsaUJBQVksR0FBWixZQUFZLENBQXFCO1FBQy9DLENBQUM7UUFFTCxTQUFTLENBQUMsS0FBYTtZQUN0QixLQUFLLE1BQU0sV0FBVyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQzFCLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUNELEtBQUssR0FBRyxNQUFNLENBQUM7WUFDaEIsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztLQUNEO0lBZkQsNERBZUMifQ==