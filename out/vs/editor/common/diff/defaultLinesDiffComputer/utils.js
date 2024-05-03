/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineRangeFragment = exports.Array2D = void 0;
    exports.isSpace = isSpace;
    class Array2D {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.array = [];
            this.array = new Array(width * height);
        }
        get(x, y) {
            return this.array[x + y * this.width];
        }
        set(x, y, value) {
            this.array[x + y * this.width] = value;
        }
    }
    exports.Array2D = Array2D;
    function isSpace(charCode) {
        return charCode === 32 /* CharCode.Space */ || charCode === 9 /* CharCode.Tab */;
    }
    class LineRangeFragment {
        static { this.chrKeys = new Map(); }
        static getKey(chr) {
            let key = this.chrKeys.get(chr);
            if (key === undefined) {
                key = this.chrKeys.size;
                this.chrKeys.set(chr, key);
            }
            return key;
        }
        constructor(range, lines, source) {
            this.range = range;
            this.lines = lines;
            this.source = source;
            this.histogram = [];
            let counter = 0;
            for (let i = range.startLineNumber - 1; i < range.endLineNumberExclusive - 1; i++) {
                const line = lines[i];
                for (let j = 0; j < line.length; j++) {
                    counter++;
                    const chr = line[j];
                    const key = LineRangeFragment.getKey(chr);
                    this.histogram[key] = (this.histogram[key] || 0) + 1;
                }
                counter++;
                const key = LineRangeFragment.getKey('\n');
                this.histogram[key] = (this.histogram[key] || 0) + 1;
            }
            this.totalCount = counter;
        }
        computeSimilarity(other) {
            let sumDifferences = 0;
            const maxLength = Math.max(this.histogram.length, other.histogram.length);
            for (let i = 0; i < maxLength; i++) {
                sumDifferences += Math.abs((this.histogram[i] ?? 0) - (other.histogram[i] ?? 0));
            }
            return 1 - (sumDifferences / (this.totalCount + other.totalCount));
        }
    }
    exports.LineRangeFragment = LineRangeFragment;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vZGlmZi9kZWZhdWx0TGluZXNEaWZmQ29tcHV0ZXIvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0JoRywwQkFFQztJQWxCRCxNQUFhLE9BQU87UUFHbkIsWUFBNEIsS0FBYSxFQUFrQixNQUFjO1lBQTdDLFVBQUssR0FBTCxLQUFLLENBQVE7WUFBa0IsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUZ4RCxVQUFLLEdBQVEsRUFBRSxDQUFDO1lBR2hDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCxHQUFHLENBQUMsQ0FBUyxFQUFFLENBQVM7WUFDdkIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxHQUFHLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxLQUFRO1lBQ2pDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3hDLENBQUM7S0FDRDtJQWRELDBCQWNDO0lBRUQsU0FBZ0IsT0FBTyxDQUFDLFFBQWdCO1FBQ3ZDLE9BQU8sUUFBUSw0QkFBbUIsSUFBSSxRQUFRLHlCQUFpQixDQUFDO0lBQ2pFLENBQUM7SUFFRCxNQUFhLGlCQUFpQjtpQkFDZCxZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQWtCLEFBQTVCLENBQTZCO1FBRTNDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBVztZQUNoQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FB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