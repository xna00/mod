/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "./foldingRanges"], function (require, exports, errors_1, lifecycle_1, foldingRanges_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SyntaxRangeProvider = void 0;
    exports.sanitizeRanges = sanitizeRanges;
    const foldingContext = {};
    const ID_SYNTAX_PROVIDER = 'syntax';
    class SyntaxRangeProvider {
        constructor(editorModel, providers, handleFoldingRangesChange, foldingRangesLimit, fallbackRangeProvider // used when all providers return null
        ) {
            this.editorModel = editorModel;
            this.providers = providers;
            this.handleFoldingRangesChange = handleFoldingRangesChange;
            this.foldingRangesLimit = foldingRangesLimit;
            this.fallbackRangeProvider = fallbackRangeProvider;
            this.id = ID_SYNTAX_PROVIDER;
            this.disposables = new lifecycle_1.DisposableStore();
            if (fallbackRangeProvider) {
                this.disposables.add(fallbackRangeProvider);
            }
            for (const provider of providers) {
                if (typeof provider.onDidChange === 'function') {
                    this.disposables.add(provider.onDidChange(handleFoldingRangesChange));
                }
            }
        }
        compute(cancellationToken) {
            return collectSyntaxRanges(this.providers, this.editorModel, cancellationToken).then(ranges => {
                if (ranges) {
                    const res = sanitizeRanges(ranges, this.foldingRangesLimit);
                    return res;
                }
                return this.fallbackRangeProvider?.compute(cancellationToken) ?? null;
            });
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    exports.SyntaxRangeProvider = SyntaxRangeProvider;
    function collectSyntaxRanges(providers, model, cancellationToken) {
        let rangeData = null;
        const promises = providers.map((provider, i) => {
            return Promise.resolve(provider.provideFoldingRanges(model, foldingContext, cancellationToken)).then(ranges => {
                if (cancellationToken.isCancellationRequested) {
                    return;
                }
                if (Array.isArray(ranges)) {
                    if (!Array.isArray(rangeData)) {
                        rangeData = [];
                    }
                    const nLines = model.getLineCount();
                    for (const r of ranges) {
                        if (r.start > 0 && r.end > r.start && r.end <= nLines) {
                            rangeData.push({ start: r.start, end: r.end, rank: i, kind: r.kind });
                        }
                    }
                }
            }, errors_1.onUnexpectedExternalError);
        });
        return Promise.all(promises).then(_ => {
            return rangeData;
        });
    }
    class RangesCollector {
        constructor(foldingRangesLimit) {
            this._startIndexes = [];
            this._endIndexes = [];
            this._nestingLevels = [];
            this._nestingLevelCounts = [];
            this._types = [];
            this._length = 0;
            this._foldingRangesLimit = foldingRangesLimit;
        }
        add(startLineNumber, endLineNumber, type, nestingLevel) {
            if (startLineNumber > foldingRanges_1.MAX_LINE_NUMBER || endLineNumber > foldingRanges_1.MAX_LINE_NUMBER) {
                return;
            }
            const index = this._length;
            this._startIndexes[index] = startLineNumber;
            this._endIndexes[index] = endLineNumber;
            this._nestingLevels[index] = nestingLevel;
            this._types[index] = type;
            this._length++;
            if (nestingLevel < 30) {
                this._nestingLevelCounts[nestingLevel] = (this._nestingLevelCounts[nestingLevel] || 0) + 1;
            }
        }
        toIndentRanges() {
            const limit = this._foldingRangesLimit.limit;
            if (this._length <= limit) {
                this._foldingRangesLimit.update(this._length, false);
                const startIndexes = new Uint32Array(this._length);
                const endIndexes = new Uint32Array(this._length);
                for (let i = 0; i < this._length; i++) {
                    startIndexes[i] = this._startIndexes[i];
                    endIndexes[i] = this._endIndexes[i];
                }
                return new foldingRanges_1.FoldingRegions(startIndexes, endIndexes, this._types);
            }
            else {
                this._foldingRangesLimit.update(this._length, limit);
                let entries = 0;
                let maxLevel = this._nestingLevelCounts.length;
                for (let i = 0; i < this._nestingLevelCounts.length; i++) {
                    const n = this._nestingLevelCounts[i];
                    if (n) {
                        if (n + entries > limit) {
                            maxLevel = i;
                            break;
                        }
                        entries += n;
                    }
                }
                const startIndexes = new Uint32Array(limit);
                const endIndexes = new Uint32Array(limit);
                const types = [];
                for (let i = 0, k = 0; i < this._length; i++) {
                    const level = this._nestingLevels[i];
                    if (level < maxLevel || (level === maxLevel && entries++ < limit)) {
                        startIndexes[k] = this._startIndexes[i];
                        endIndexes[k] = this._endIndexes[i];
                        types[k] = this._types[i];
                        k++;
                    }
                }
                return new foldingRanges_1.FoldingRegions(startIndexes, endIndexes, types);
            }
        }
    }
    function sanitizeRanges(rangeData, foldingRangesLimit) {
        const sorted = rangeData.sort((d1, d2) => {
            let diff = d1.start - d2.start;
            if (diff === 0) {
                diff = d1.rank - d2.rank;
            }
            return diff;
        });
        const collector = new RangesCollector(foldingRangesLimit);
        let top = undefined;
        const previous = [];
        for (const entry of sorted) {
            if (!top) {
                top = entry;
                collector.add(entry.start, entry.end, entry.kind && entry.kind.value, previous.length);
            }
            else {
                if (entry.start > top.start) {
                    if (entry.end <= top.end) {
                        previous.push(top);
                        top = entry;
                        collector.add(entry.start, entry.end, entry.kind && entry.kind.value, previous.length);
                    }
                    else {
                        if (entry.start > top.end) {
                            do {
                                top = previous.pop();
                            } while (top && entry.start > top.end);
                            if (top) {
                                previous.push(top);
                            }
                            top = entry;
                        }
                        collector.add(entry.start, entry.end, entry.kind && entry.kind.value, previous.length);
                    }
                }
            }
        }
        return collector.toIndentRanges();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4UmFuZ2VQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZm9sZGluZy9icm93c2VyL3N5bnRheFJhbmdlUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUtoRyx3Q0FzQ0M7SUE3TEQsTUFBTSxjQUFjLEdBQW1CLEVBQ3RDLENBQUM7SUFFRixNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQztJQUVwQyxNQUFhLG1CQUFtQjtRQU0vQixZQUNrQixXQUF1QixFQUN2QixTQUFpQyxFQUN6Qyx5QkFBcUMsRUFDN0Isa0JBQXdDLEVBQ3hDLHFCQUFnRCxDQUFDLHNDQUFzQzs7WUFKdkYsZ0JBQVcsR0FBWCxXQUFXLENBQVk7WUFDdkIsY0FBUyxHQUFULFNBQVMsQ0FBd0I7WUFDekMsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUFZO1lBQzdCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDeEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUEyQjtZQVR6RCxPQUFFLEdBQUcsa0JBQWtCLENBQUM7WUFXaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUN6QyxJQUFJLHFCQUFxQixFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDN0MsQ0FBQztZQUVELEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksT0FBTyxRQUFRLENBQUMsV0FBVyxLQUFLLFVBQVUsRUFBRSxDQUFDO29CQUNoRCxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztnQkFD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