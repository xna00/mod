/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/editor/common/core/position", "vs/editor/common/model"], function (require, exports, assert_1, position_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputPosition = exports.InjectedText = exports.ModelLineProjectionData = void 0;
    /**
     * *input*:
     * ```
     * xxxxxxxxxxxxxxxxxxxxxxxxxxx
     * ```
     *
     * -> Applying injections `[i...i]`, *inputWithInjections*:
     * ```
     * xxxxxx[iiiiiiiiii]xxxxxxxxxxxxxxxxx[ii]xxxx
     * ```
     *
     * -> breaking at offsets `|` in `xxxxxx[iiiiiii|iii]xxxxxxxxxxx|xxxxxx[ii]xxxx|`:
     * ```
     * xxxxxx[iiiiiii
     * iii]xxxxxxxxxxx
     * xxxxxx[ii]xxxx
     * ```
     *
     * -> applying wrappedTextIndentLength, *output*:
     * ```
     * xxxxxx[iiiiiii
     *    iii]xxxxxxxxxxx
     *    xxxxxx[ii]xxxx
     * ```
     */
    class ModelLineProjectionData {
        constructor(injectionOffsets, 
        /**
         * `injectionOptions.length` must equal `injectionOffsets.length`
         */
        injectionOptions, 
        /**
         * Refers to offsets after applying injections to the source.
         * The last break offset indicates the length of the source after applying injections.
         */
        breakOffsets, 
        /**
         * Refers to offsets after applying injections
         */
        breakOffsetsVisibleColumn, wrappedTextIndentLength) {
            this.injectionOffsets = injectionOffsets;
            this.injectionOptions = injectionOptions;
            this.breakOffsets = breakOffsets;
            this.breakOffsetsVisibleColumn = breakOffsetsVisibleColumn;
            this.wrappedTextIndentLength = wrappedTextIndentLength;
        }
        getOutputLineCount() {
            return this.breakOffsets.length;
        }
        getMinOutputOffset(outputLineIndex) {
            if (outputLineIndex > 0) {
                return this.wrappedTextIndentLength;
            }
            return 0;
        }
        getLineLength(outputLineIndex) {
            // These offsets refer to model text with injected text.
            const startOffset = outputLineIndex > 0 ? this.breakOffsets[outputLineIndex - 1] : 0;
            const endOffset = this.breakOffsets[outputLineIndex];
            let lineLength = endOffset - startOffset;
            if (outputLineIndex > 0) {
                lineLength += this.wrappedTextIndentLength;
            }
            return lineLength;
        }
        getMaxOutputOffset(outputLineIndex) {
            return this.getLineLength(outputLineIndex);
        }
        translateToInputOffset(outputLineIndex, outputOffset) {
            if (outputLineIndex > 0) {
                outputOffset = Math.max(0, outputOffset - this.wrappedTextIndentLength);
            }
            const offsetInInputWithInjection = outputLineIndex === 0 ? outputOffset : this.breakOffsets[outputLineIndex - 1] + outputOffset;
            let offsetInInput = offsetInInputWithInjection;
            if (this.injectionOffsets !== null) {
                for (let i = 0; i < this.injectionOffsets.length; i++) {
                    if (offsetInInput > this.injectionOffsets[i]) {
                        if (offsetInInput < this.injectionOffsets[i] + this.injectionOptions[i].content.length) {
                            // `inputOffset` is within injected text
                            offsetInInput = this.injectionOffsets[i];
                        }
                        else {
                            offsetInInput -= this.injectionOptions[i].content.length;
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            return offsetInInput;
        }
        translateToOutputPosition(inputOffset, affinity = 2 /* PositionAffinity.None */) {
            let inputOffsetInInputWithInjection = inputOffset;
            if (this.injectionOffsets !== null) {
                for (let i = 0; i < this.injectionOffsets.length; i++) {
                    if (inputOffset < this.injectionOffsets[i]) {
                        break;
                    }
                    if (affinity !== 1 /* PositionAffinity.Right */ && inputOffset === this.injectionOffsets[i]) {
                        break;
                    }
                    inputOffsetInInputWithInjection += this.injectionOptions[i].content.length;
                }
            }
            return this.offsetInInputWithInjectionsToOutputPosition(inputOffsetInInputWithInjection, affinity);
        }
        offsetInInputWithInjectionsToOutputPosition(offsetInInputWithInjections, affinity = 2 /* PositionAffinity.None */) {
            let low = 0;
            let high = this.breakOffsets.length - 1;
            let mid = 0;
            let midStart = 0;
            while (low <= high) {
                mid = low + ((high - low) / 2) | 0;
                const midStop = this.breakOffsets[mid];
                midStart = mid > 0 ? this.breakOffsets[mid - 1] : 0;
                if (affinity === 0 /* PositionAffinity.Left */) {
                    if (offsetInInputWithInjections <= midStart) {
                        high = mid - 1;
                    }
                    else if (offsetInInputWithInjections > midStop) {
                        low = mid + 1;
                    }
                    else {
                        break;
                    }
                }
                else {
                    if (offsetInInputWithInjections < midStart) {
                        high = mid - 1;
                    }
                    else if (offsetInInputWithInjections >= midStop) {
                        low = mid + 1;
                    }
                    else {
                        break;
                    }
                }
            }
            let outputOffset = offsetInInputWithInjections - midStart;
            if (mid > 0) {
                outputOffset += this.wrappedTextIndentLength;
            }
            return new OutputPosition(mid, outputOffset);
        }
        normalizeOutputPosition(outputLineIndex, outputOffset, affinity) {
            if (this.injectionOffsets !== null) {
                const offsetInInputWithInjections = this.outputPositionToOffsetInInputWithInjections(outputLineIndex, outputOffset);
                const normalizedOffsetInUnwrappedLine = this.normalizeOffsetInInputWithInjectionsAroundInjections(offsetInInputWithInjections, affinity);
                if (normalizedOffsetInUnwrappedLine !== offsetInInputWithInjections) {
                    // injected text caused a change
                    return this.offsetInInputWithInjectionsToOutputPosition(normalizedOffsetInUnwrappedLine, affinity);
                }
            }
            if (affinity === 0 /* PositionAffinity.Left */) {
                if (outputLineIndex > 0 && outputOffset === this.getMinOutputOffset(outputLineIndex)) {
                    return new OutputPosition(outputLineIndex - 1, this.getMaxOutputOffset(outputLineIndex - 1));
                }
            }
            else if (affinity === 1 /* PositionAffinity.Right */) {
                const maxOutputLineIndex = this.getOutputLineCount() - 1;
                if (outputLineIndex < maxOutputLineIndex && outputOffset === this.getMaxOutputOffset(outputLineIndex)) {
                    return new OutputPosition(outputLineIndex + 1, this.getMinOutputOffset(outputLineIndex + 1));
                }
            }
            return new OutputPosition(outputLineIndex, outputOffset);
        }
        outputPositionToOffsetInInputWithInjections(outputLineIndex, outputOffset) {
            if (outputLineIndex > 0) {
                outputOffset = Math.max(0, outputOffset - this.wrappedTextIndentLength);
            }
            const result = (outputLineIndex > 0 ? this.breakOffsets[outputLineIndex - 1] : 0) + outputOffset;
            return result;
        }
        normalizeOffsetInInputWithInjectionsAroundInjections(offsetInInputWithInjections, affinity) {
            const injectedText = this.getInjectedTextAtOffset(offsetInInputWithInjections);
            if (!injectedText) {
                return offsetInInputWithInjections;
            }
            if (affinity === 2 /* PositionAffinity.None */) {
                if (offsetInInputWithInjections === injectedText.offsetInInputWithInjections + injectedText.length
                    && hasRightCursorStop(this.injectionOptions[injectedText.injectedTextIndex].cursorStops)) {
                    return injectedText.offsetInInputWithInjections + injectedText.length;
                }
                else {
                    let result = injectedText.offsetInInputWithInjections;
                    if (hasLeftCursorStop(this.injectionOptions[injectedText.injectedTextIndex].cursorStops)) {
                        return result;
                    }
                    let index = injectedText.injectedTextIndex - 1;
                    while (index >= 0 && this.injectionOffsets[index] === this.injectionOffsets[injectedText.injectedTextIndex]) {
                        if (hasRightCursorStop(this.injectionOptions[index].cursorStops)) {
                            break;
                        }
                        result -= this.injectionOptions[index].content.length;
                        if (hasLeftCursorStop(this.injectionOptions[index].cursorStops)) {
                            break;
                        }
                        index--;
                    }
                    return result;
                }
            }
            else if (affinity === 1 /* PositionAffinity.Right */ || affinity === 4 /* PositionAffinity.RightOfInjectedText */) {
                let result = injectedText.offsetInInputWithInjections + injectedText.length;
                let index = injectedText.injectedTextIndex;
                // traverse all injected text that touch each other
                while (index + 1 < this.injectionOffsets.length && this.injectionOffsets[index + 1] === this.injectionOffsets[index]) {
                    result += this.injectionOptions[index + 1].content.length;
                    index++;
                }
                return result;
            }
            else if (affinity === 0 /* PositionAffinity.Left */ || affinity === 3 /* PositionAffinity.LeftOfInjectedText */) {
                // affinity is left
                let result = injectedText.offsetInInputWithInjections;
                let index = injectedText.injectedTextIndex;
                // traverse all injected text that touch each other
                while (index - 1 >= 0 && this.injectionOffsets[index - 1] === this.injectionOffsets[index]) {
                    result -= this.injectionOptions[index - 1].content.length;
                    index--;
                }
                return result;
            }
            (0, assert_1.assertNever)(affinity);
        }
        getInjectedText(outputLineIndex, outputOffset) {
            const offset = this.outputPositionToOffsetInInputWithInjections(outputLineIndex, outputOffset);
            const injectedText = this.getInjectedTextAtOffset(offset);
            if (!injectedText) {
                return null;
            }
            return {
                options: this.injectionOptions[injectedText.injectedTextIndex]
            };
        }
        getInjectedTextAtOffset(offsetInInputWithInjections) {
            const injectionOffsets = this.injectionOffsets;
            const injectionOptions = this.injectionOptions;
            if (injectionOffsets !== null) {
                let totalInjectedTextLengthBefore = 0;
                for (let i = 0; i < injectionOffsets.length; i++) {
                    const length = injectionOptions[i].content.length;
                    const injectedTextStartOffsetInInputWithInjections = injectionOffsets[i] + totalInjectedTextLengthBefore;
                    const injectedTextEndOffsetInInputWithInjections = injectionOffsets[i] + totalInjectedTextLengthBefore + length;
                    if (injectedTextStartOffsetInInputWithInjections > offsetInInputWithInjections) {
                        // Injected text starts later.
                        break; // All later injected texts have an even larger offset.
                    }
                    if (offsetInInputWithInjections <= injectedTextEndOffsetInInputWithInjections) {
                        // Injected text ends after or with the given position (but also starts with or before it).
                        return {
                            injectedTextIndex: i,
                            offsetInInputWithInjections: injectedTextStartOffsetInInputWithInjections,
                            length
                        };
                    }
                    totalInjectedTextLengthBefore += length;
                }
            }
            return undefined;
        }
    }
    exports.ModelLineProjectionData = ModelLineProjectionData;
    function hasRightCursorStop(cursorStop) {
        if (cursorStop === null || cursorStop === undefined) {
            return true;
        }
        return cursorStop === model_1.InjectedTextCursorStops.Right || cursorStop === model_1.InjectedTextCursorStops.Both;
    }
    function hasLeftCursorStop(cursorStop) {
        if (cursorStop === null || cursorStop === undefined) {
            return true;
        }
        return cursorStop === model_1.InjectedTextCursorStops.Left || cursorStop === model_1.InjectedTextCursorStops.Both;
    }
    class InjectedText {
        constructor(options) {
            this.options = options;
        }
    }
    exports.InjectedText = InjectedText;
    class OutputPosition {
        constructor(outputLineIndex, outputOffset) {
            this.outputLineIndex = outputLineIndex;
            this.outputOffset = outputOffset;
        }
        toString() {
            return `${this.outputLineIndex}:${this.outputOffset}`;
        }
        toPosition(baseLineNumber) {
            return new position_1.Position(baseLineNumber + this.outputLineIndex, this.outputOffset + 1);
        }
    }
    exports.OutputPosition = OutputPosition;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxMaW5lUHJvamVjdGlvbkRhdGEuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWxMaW5lUHJvamVjdGlvbkRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0F3Qkc7SUFDSCxNQUFhLHVCQUF1QjtRQUNuQyxZQUNRLGdCQUFpQztRQUN4Qzs7V0FFRztRQUNJLGdCQUE4QztRQUNyRDs7O1dBR0c7UUFDSSxZQUFzQjtRQUM3Qjs7V0FFRztRQUNJLHlCQUFtQyxFQUNuQyx1QkFBK0I7WUFkL0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQjtZQUlqQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQThCO1lBSzlDLGlCQUFZLEdBQVosWUFBWSxDQUFVO1lBSXRCLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBVTtZQUNuQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQVE7UUFFdkMsQ0FBQztRQUVNLGtCQUFrQjtZQUN4QixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDO1FBQ2pDLENBQUM7UUFFTSxrQkFBa0IsQ0FBQyxlQUF1QjtZQUNoRCxJQUFJLGVBQWUsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUM7WUFDckMsQ0FBQztZQUNELE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQUVNLGFBQWEsQ0FBQyxlQUF1QjtZQUMzQyx3REFBd0Q7WUFDeEQsTUFBTSxXQUFXLEdBQUcsZUFBZSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRixNQUFNLFNB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