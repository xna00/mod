/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model/utils", "vs/editor/contrib/folding/browser/foldingRanges"], function (require, exports, utils_1, foldingRanges_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangesCollector = exports.IndentRangeProvider = void 0;
    exports.computeRanges = computeRanges;
    const MAX_FOLDING_REGIONS_FOR_INDENT_DEFAULT = 5000;
    const ID_INDENT_PROVIDER = 'indent';
    class IndentRangeProvider {
        constructor(editorModel, languageConfigurationService, foldingRangesLimit) {
            this.editorModel = editorModel;
            this.languageConfigurationService = languageConfigurationService;
            this.foldingRangesLimit = foldingRangesLimit;
            this.id = ID_INDENT_PROVIDER;
        }
        dispose() { }
        compute(cancelationToken) {
            const foldingRules = this.languageConfigurationService.getLanguageConfiguration(this.editorModel.getLanguageId()).foldingRules;
            const offSide = foldingRules && !!foldingRules.offSide;
            const markers = foldingRules && foldingRules.markers;
            return Promise.resolve(computeRanges(this.editorModel, offSide, markers, this.foldingRangesLimit));
        }
    }
    exports.IndentRangeProvider = IndentRangeProvider;
    // public only for testing
    class RangesCollector {
        constructor(foldingRangesLimit) {
            this._startIndexes = [];
            this._endIndexes = [];
            this._indentOccurrences = [];
            this._length = 0;
            this._foldingRangesLimit = foldingRangesLimit;
        }
        insertFirst(startLineNumber, endLineNumber, indent) {
            if (startLineNumber > foldingRanges_1.MAX_LINE_NUMBER || endLineNumber > foldingRanges_1.MAX_LINE_NUMBER) {
                return;
            }
            const index = this._length;
            this._startIndexes[index] = startLineNumber;
            this._endIndexes[index] = endLineNumber;
            this._length++;
            if (indent < 1000) {
                this._indentOccurrences[indent] = (this._indentOccurrences[indent] || 0) + 1;
            }
        }
        toIndentRanges(model) {
            const limit = this._foldingRangesLimit.limit;
            if (this._length <= limit) {
                this._foldingRangesLimit.update(this._length, false);
                // reverse and create arrays of the exact length
                const startIndexes = new Uint32Array(this._length);
                const endIndexes = new Uint32Array(this._length);
                for (let i = this._length - 1, k = 0; i >= 0; i--, k++) {
                    startIndexes[k] = this._startIndexes[i];
                    endIndexes[k] = this._endIndexes[i];
                }
                return new foldingRanges_1.FoldingRegions(startIndexes, endIndexes);
            }
            else {
                this._foldingRangesLimit.update(this._length, limit);
                let entries = 0;
                let maxIndent = this._indentOccurrences.length;
                for (let i = 0; i < this._indentOccurrences.length; i++) {
                    const n = this._indentOccurrences[i];
                    if (n) {
                        if (n + entries > limit) {
                            maxIndent = i;
                            break;
                        }
                        entries += n;
                    }
                }
                const tabSize = model.getOptions().tabSize;
                // reverse and create arrays of the exact length
                const startIndexes = new Uint32Array(limit);
                const endIndexes = new Uint32Array(limit);
                for (let i = this._length - 1, k = 0; i >= 0; i--) {
                    const startIndex = this._startIndexes[i];
                    const lineContent = model.getLineContent(startIndex);
                    const indent = (0, utils_1.computeIndentLevel)(lineContent, tabSize);
                    if (indent < maxIndent || (indent === maxIndent && entries++ < limit)) {
                        startIndexes[k] = startIndex;
                        endIndexes[k] = this._endIndexes[i];
                        k++;
                    }
                }
                return new foldingRanges_1.FoldingRegions(startIndexes, endIndexes);
            }
        }
    }
    exports.RangesCollector = RangesCollector;
    const foldingRangesLimitDefault = {
        limit: MAX_FOLDING_REGIONS_FOR_INDENT_DEFAULT,
        update: () => { }
    };
    function computeRanges(model, offSide, markers, foldingRangesLimit = foldingRangesLimitDefault) {
        const tabSize = model.getOptions().tabSize;
        const result = new RangesCollector(foldingRangesLimit);
        let pattern = undefined;
        if (markers) {
            pattern = new RegExp(`(${markers.start.source})|(?:${markers.end.source})`);
        }
        const previousRegions = [];
        const line = model.getLineCount() + 1;
        previousRegions.push({ indent: -1, endAbove: line, line }); // sentinel, to make sure there's at least one entry
        for (let line = model.getLineCount(); line > 0; line--) {
            const lineContent = model.getLineContent(line);
            const indent = (0, utils_1.computeIndentLevel)(lineContent, tabSize);
            let previous = previousRegions[previousRegions.length - 1];
            if (indent === -1) {
                if (offSide) {
                    // for offSide languages, empty lines are associated to the previous block
                    // note: the next block is already written to the results, so this only
                    // impacts the end position of the block before
                    previous.endAbove = line;
                }
                continue; // only whitespace
            }
            let m;
            if (pattern && (m = lineContent.match(pattern))) {
                // folding pattern match
                if (m[1]) { // start pattern match
                    // discard all regions until the folding pattern
                    let i = previousRegions.length - 1;
                    while (i > 0 && previousRegions[i].indent !== -2) {
                        i--;
                    }
                    if (i > 0) {
                        previousRegions.length = i + 1;
                        previous = previousRegions[i];
                        // new folding range from pattern, includes the end line
                        result.insertFirst(line, previous.line, indent);
                        previous.line = line;
                        previous.indent = indent;
                        previous.endAbove = line;
                        continue;
                    }
                    else {
                        // no end marker found, treat line as a regular line
                    }
                }
                else { // end pattern match
                    previousRegions.push({ indent: -2, endAbove: line, line });
                    continue;
                }
            }
            if (previous.indent > indent) {
                // discard all regions with larger indent
                do {
                    previousRegions.pop();
                    previous = previousRegions[previousRegions.length - 1];
                } while (previous.indent > indent);
                // new folding range
                const endLineNumber = previous.endAbove - 1;
                if (endLineNumber - line >= 1) { // needs at east size 1
                    result.insertFirst(line, endLineNumber, indent);
                }
            }
            if (previous.indent === indent) {
                previous.endAbove = line;
            }
            else { // previous.indent < indent
                // new region with a bigger indent
                previousRegions.push({ indent, endAbove: line, line });
            }
        }
        return result.toIndentRanges(model);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50UmFuZ2VQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZm9sZGluZy9icm93c2VyL2luZGVudFJhbmdlUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMEhoRyxzQ0EwRUM7SUExTEQsTUFBTSxzQ0FBc0MsR0FBRyxJQUFJLENBQUM7SUFFcEQsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUM7SUFFcEMsTUFBYSxtQkFBbUI7UUFHL0IsWUFDa0IsV0FBdUIsRUFDdkIsNEJBQTJELEVBQzNELGtCQUF3QztZQUZ4QyxnQkFBVyxHQUFYLFdBQVcsQ0FBWTtZQUN2QixpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBQzNELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFMakQsT0FBRSxHQUFHLGtCQUFrQixDQUFDO1FBTTdCLENBQUM7UUFFTCxPQUFPLEtBQUssQ0FBQztRQUViLE9BQU8sQ0FBQyxnQkFBbUM7WUFDMUMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUM7WUFDL0gsTUFBTSxPQUFPLEdBQUcsWUFBWSxJQUFJLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDO1lBQ3ZELE1BQU0sT0FBTyxHQUFHLFlBQVksSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDO1lBQ3JELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDcEcsQ0FBQztLQUNEO0lBakJELGtEQWlC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