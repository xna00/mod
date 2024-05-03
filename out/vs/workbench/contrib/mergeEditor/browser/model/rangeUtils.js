/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/textLength"], function (require, exports, position_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.rangeContainsPosition = rangeContainsPosition;
    exports.lengthOfRange = lengthOfRange;
    exports.lengthBetweenPositions = lengthBetweenPositions;
    exports.addLength = addLength;
    exports.rangeIsBeforeOrTouching = rangeIsBeforeOrTouching;
    function rangeContainsPosition(range, position) {
        if (position.lineNumber < range.startLineNumber || position.lineNumber > range.endLineNumber) {
            return false;
        }
        if (position.lineNumber === range.startLineNumber && position.column < range.startColumn) {
            return false;
        }
        if (position.lineNumber === range.endLineNumber && position.column >= range.endColumn) {
            return false;
        }
        return true;
    }
    function lengthOfRange(range) {
        if (range.startLineNumber === range.endLineNumber) {
            return new textLength_1.TextLength(0, range.endColumn - range.startColumn);
        }
        else {
            return new textLength_1.TextLength(range.endLineNumber - range.startLineNumber, range.endColumn - 1);
        }
    }
    function lengthBetweenPositions(position1, position2) {
        if (position1.lineNumber === position2.lineNumber) {
            return new textLength_1.TextLength(0, position2.column - position1.column);
        }
        else {
            return new textLength_1.TextLength(position2.lineNumber - position1.lineNumber, position2.column - 1);
        }
    }
    function addLength(position, length) {
        if (length.lineCount === 0) {
            return new position_1.Position(position.lineNumber, position.column + length.columnCount);
        }
        else {
            return new position_1.Position(position.lineNumber + length.lineCount, length.columnCount + 1);
        }
    }
    function rangeIsBeforeOrTouching(range, other) {
        return (range.endLineNumber < other.startLineNumber ||
            (range.endLineNumber === other.startLineNumber &&
                range.endColumn <= other.startColumn));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2VVdGlscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci9tb2RlbC9yYW5nZVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLHNEQVdDO0lBRUQsc0NBTUM7SUFFRCx3REFNQztJQUVELDhCQU1DO0lBRUQsMERBTUM7SUEzQ0QsU0FBZ0IscUJBQXFCLENBQUMsS0FBWSxFQUFFLFFBQWtCO1FBQ3JFLElBQUksUUFBUSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsZUFBZSxJQUFJLFFBQVEsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzlGLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNELElBQUksUUFBUSxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUMsZUFBZSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzFGLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNELElBQUksUUFBUSxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUMsYUFBYSxJQUFJLFFBQVEsQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3ZGLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELFNBQWdCLGFBQWEsQ0FBQyxLQUFZO1FBQ3pDLElBQUksS0FBSyxDQUFDLGVBQWUsS0FBSyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDbkQsT0FBTyxJQUFJLHVCQUFVLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9ELENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FBTyxJQUFJLHVCQUFVLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDekYsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFnQixzQkFBc0IsQ0FBQyxTQUFtQixFQUFFLFNBQW1CO1FBQzlFLElBQUksU0FBUyxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbkQsT0FBTyxJQUFJLHVCQUFVLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9ELENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FBTyxJQUFJLHVCQUFVLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDMUYsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFnQixTQUFTLENBQUMsUUFBa0IsRUFBRSxNQUFrQjtRQUMvRCxJQUFJLE1BQU0sQ0FBQyxTQUFTLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDNUIsT0FBTyxJQUFJLG1CQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNoRixDQUFDO2FBQU0sQ0FBQztZQUNQLE9BQU8sSUFBSSxtQkFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7SUFDRixDQUFDO0lBRUQsU0FBZ0IsdUJBQXVCLENBQUMsS0FBWSxFQUFFLEtBQVk7UUFDakUsT0FBTyxDQUNOLEtBQUssQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLGVBQWU7WUFDM0MsQ0FBQyxLQUFLLENBQUMsYUFBYSxLQUFLLEtBQUssQ0FBQyxlQUFlO2dCQUM3QyxLQUFLLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FDdEMsQ0FBQztJQUNILENBQUMifQ==