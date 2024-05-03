define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextLength = void 0;
    /**
     * Represents a non-negative length of text in terms of line and column count.
    */
    class TextLength {
        static { this.zero = new TextLength(0, 0); }
        static lengthDiffNonNegative(start, end) {
            if (end.isLessThan(start)) {
                return TextLength.zero;
            }
            if (start.lineCount === end.lineCount) {
                return new TextLength(0, end.columnCount - start.columnCount);
            }
            else {
                return new TextLength(end.lineCount - start.lineCount, end.columnCount);
            }
        }
        static betweenPositions(position1, position2) {
            if (position1.lineNumber === position2.lineNumber) {
                return new TextLength(0, position2.column - position1.column);
            }
            else {
                return new TextLength(position2.lineNumber - position1.lineNumber, position2.column - 1);
            }
        }
        static ofRange(range) {
            return TextLength.betweenPositions(range.getStartPosition(), range.getEndPosition());
        }
        static ofText(text) {
            let line = 0;
            let column = 0;
            for (const c of text) {
                if (c === '\n') {
                    line++;
                    column = 0;
                }
                else {
                    column++;
                }
            }
            return new TextLength(line, column);
        }
        constructor(lineCount, columnCount) {
            this.lineCount = lineCount;
            this.columnCount = columnCount;
        }
        isZero() {
            return this.lineCount === 0 && this.columnCount === 0;
        }
        isLessThan(other) {
            if (this.lineCount !== other.lineCount) {
                return this.lineCount < other.lineCount;
            }
            return this.columnCount < other.columnCount;
        }
        isGreaterThan(other) {
            if (this.lineCount !== other.lineCount) {
                return this.lineCount > other.lineCount;
            }
            return this.columnCount > other.columnCount;
        }
        equals(other) {
            return this.lineCount === other.lineCount && this.columnCount === other.columnCount;
        }
        compare(other) {
            if (this.lineCount !== other.lineCount) {
                return this.lineCount - other.lineCount;
            }
            return this.columnCount - other.columnCount;
        }
        add(other) {
            if (other.lineCount === 0) {
                return new TextLength(this.lineCount, this.columnCount + other.columnCount);
            }
            else {
                return new TextLength(this.lineCount + other.lineCount, other.columnCount);
            }
        }
        createRange(startPosition) {
            if (this.lineCount === 0) {
                return new range_1.Range(startPosition.lineNumber, startPosition.column, startPosition.lineNumber, startPosition.column + this.columnCount);
            }
            else {
                return new range_1.Range(startPosition.lineNumber, startPosition.column, startPosition.lineNumber + this.lineCount, this.columnCount + 1);
            }
        }
        toRange() {
            return new range_1.Range(1, 1, this.lineCount + 1, this.columnCount + 1);
        }
        addToPosition(position) {
            if (this.lineCount === 0) {
                return new position_1.Position(position.lineNumber, position.column + this.columnCount);
            }
            else {
                return new position_1.Position(position.lineNumber + this.lineCount, this.columnCount + 1);
            }
        }
        toString() {
            return `${this.lineCount},${this.columnCount}`;
        }
    }
    exports.TextLength = TextLength;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dExlbmd0aC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb3JlL3RleHRMZW5ndGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQU9BOztNQUVFO0lBQ0YsTUFBYSxVQUFVO2lCQUNSLFNBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFbkMsTUFBTSxDQUFDLHFCQUFxQixDQUFDLEtBQWlCLEVBQUUsR0FBZTtZQUNyRSxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDO1lBQ3hCLENBQUM7WUFDRCxJQUFJLEtBQUssQ0FBQyxTQUFTLEtBQUssR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN2QyxPQUFPLElBQUksVUFBVSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMvRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3pFLENBQUM7UUFDRixDQUFDO1FBRU0sTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQW1CLEVBQUUsU0FBbUI7WUFDdEUsSUFBSSxTQUFTLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDbkQsT0FBTyxJQUFJLFVBQVUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0QsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDMUYsQ0FBQztRQUNGLENBQUM7UUFFTSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQVk7WUFDakMsT0FBTyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7UUFDdEYsQ0FBQztRQUVNLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBWTtZQUNoQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7WUFDYixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDZixLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxFQUFFLENBQUM7b0JBQ1AsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFDWixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxFQUFFLENBQUM7Z0JBQ1YsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLElBQUksVUFBVSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsWUFDaUIsU0FBaUIsRUFDakIsV0FBbUI7WUFEbkIsY0FBUyxHQUFULFNBQVMsQ0FBUTtZQUNqQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtRQUNoQyxDQUFDO1FBRUUsTUFBTTtZQUNaLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVNLFVBQVUsQ0FBQyxLQUFpQjtZQUNsQyxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4QyxPQUFPLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztZQUN6QyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7UUFDN0MsQ0FBQztRQUVNLGFBQWEsQ0FBQyxLQUFpQjtZQUNyQyxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4QyxPQUFPLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztZQUN6QyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7UUFDN0MsQ0FBQztRQUVNLE1BQU0sQ0FBQyxLQUFpQjtZQUM5QixPQUFPLElBQUksQ0FBQyxTQUFTLEtBQUssS0FBSyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLEtBQUssQ0FBQyxXQUFXLENBQUM7UUFDckYsQ0FBQztRQUVNLE9BQU8sQ0FBQyxLQUFpQjtZQUMvQixJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4QyxPQUFPLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztZQUN6QyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7UUFDN0MsQ0FBQztRQUVNLEdBQUcsQ0FBQyxLQUFpQjtZQUMzQixJQUFJLEtBQUssQ0FBQyxTQUFTLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE9BQU8sSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3RSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzVFLENBQUM7UUFDRixDQUFDO1FBRU0sV0FBVyxDQUFDLGFBQXVCO1lBQ3pDLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxJQUFJLGFBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNySSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxJQUFJLGFBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbkksQ0FBQztRQUNGLENBQUM7UUFFTSxPQUFPO1lBQ2IsT0FBTyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVNLGFBQWEsQ0FBQyxRQUFrQjtZQUN0QyxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sSUFBSSxtQkFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sSUFBSSxtQkFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLENBQUM7UUFDRixDQUFDO1FBRUQsUUFBUTtZQUNQLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNoRCxDQUFDOztJQXhHRixnQ0F5R0MifQ==