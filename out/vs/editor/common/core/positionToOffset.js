/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/editor/common/core/offsetRange", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/textLength"], function (require, exports, arraysFind_1, offsetRange_1, position_1, range_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PositionOffsetTransformer = void 0;
    class PositionOffsetTransformer {
        constructor(text) {
            this.text = text;
            this.lineStartOffsetByLineIdx = [];
            this.lineStartOffsetByLineIdx.push(0);
            for (let i = 0; i < text.length; i++) {
                if (text.charAt(i) === '\n') {
                    this.lineStartOffsetByLineIdx.push(i + 1);
                }
            }
        }
        getOffset(position) {
            return this.lineStartOffsetByLineIdx[position.lineNumber - 1] + position.column - 1;
        }
        getOffsetRange(range) {
            return new offsetRange_1.OffsetRange(this.getOffset(range.getStartPosition()), this.getOffset(range.getEndPosition()));
        }
        getPosition(offset) {
            const idx = (0, arraysFind_1.findLastIdxMonotonous)(this.lineStartOffsetByLineIdx, i => i <= offset);
            const lineNumber = idx + 1;
            const column = offset - this.lineStartOffsetByLineIdx[idx] + 1;
            return new position_1.Position(lineNumber, column);
        }
        getRange(offsetRange) {
            return range_1.Range.fromPositions(this.getPosition(offsetRange.start), this.getPosition(offsetRange.endExclusive));
        }
        getTextLength(offsetRange) {
            return textLength_1.TextLength.ofRange(this.getRange(offsetRange));
        }
        get textLength() {
            const lineIdx = this.lineStartOffsetByLineIdx.length - 1;
            return new textLength_1.TextLength(lineIdx, this.text.length - this.lineStartOffsetByLineIdx[lineIdx]);
        }
    }
    exports.PositionOffsetTransformer = PositionOffsetTransformer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zaXRpb25Ub09mZnNldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb3JlL3Bvc2l0aW9uVG9PZmZzZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEseUJBQXlCO1FBR3JDLFlBQTRCLElBQVk7WUFBWixTQUFJLEdBQUosSUFBSSxDQUFRO1lBQ3ZDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxFQUFFLENBQUM7WUFDbkMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQzdCLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxTQUFTLENBQUMsUUFBa0I7WUFDM0IsT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBRUQsY0FBYyxDQUFDLEtBQVk7WUFDMUIsT0FBTyxJQUFJLHlCQUFXLENBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFDeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FDdEMsQ0FBQztRQUNILENBQUM7UUFFRCxXQUFXLENBQUMsTUFBYztZQUN6QixNQUFNLEdBQUcsR0FBRyxJQUFBLGtDQUFxQixFQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQztZQUNuRixNQUFNLFVBQVUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sTUFBTSxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQy9ELE9BQU8sSUFBSSxtQkFBUSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRUQsUUFBUSxDQUFDLFdBQXdCO1lBQ2hDLE9BQU8sYUFBSyxDQUFDLGFBQWEsQ0FDekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQ25DLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUMxQyxDQUFDO1FBQ0gsQ0FBQztRQUVELGFBQWEsQ0FBQyxXQUF3QjtZQUNyQyxPQUFPLHVCQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRUQsSUFBSSxVQUFVO1lBQ2IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDekQsT0FBTyxJQUFJLHVCQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzNGLENBQUM7S0FDRDtJQTlDRCw4REE4Q0MifQ==