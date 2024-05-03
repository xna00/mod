/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/viewModel", "vs/editor/common/config/editorOptions"], function (require, exports, position_1, range_1, viewModel_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewModelDecorations = void 0;
    exports.isModelDecorationVisible = isModelDecorationVisible;
    exports.isModelDecorationInComment = isModelDecorationInComment;
    exports.isModelDecorationInString = isModelDecorationInString;
    class ViewModelDecorations {
        constructor(editorId, model, configuration, linesCollection, coordinatesConverter) {
            this.editorId = editorId;
            this.model = model;
            this.configuration = configuration;
            this._linesCollection = linesCollection;
            this._coordinatesConverter = coordinatesConverter;
            this._decorationsCache = Object.create(null);
            this._cachedModelDecorationsResolver = null;
            this._cachedModelDecorationsResolverViewRange = null;
        }
        _clearCachedModelDecorationsResolver() {
            this._cachedModelDecorationsResolver = null;
            this._cachedModelDecorationsResolverViewRange = null;
        }
        dispose() {
            this._decorationsCache = Object.create(null);
            this._clearCachedModelDecorationsResolver();
        }
        reset() {
            this._decorationsCache = Object.create(null);
            this._clearCachedModelDecorationsResolver();
        }
        onModelDecorationsChanged() {
            this._decorationsCache = Object.create(null);
            this._clearCachedModelDecorationsResolver();
        }
        onLineMappingChanged() {
            this._decorationsCache = Object.create(null);
            this._clearCachedModelDecorationsResolver();
        }
        _getOrCreateViewModelDecoration(modelDecoration) {
            const id = modelDecoration.id;
            let r = this._decorationsCache[id];
            if (!r) {
                const modelRange = modelDecoration.range;
                const options = modelDecoration.options;
                let viewRange;
                if (options.isWholeLine) {
                    const start = this._coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.startLineNumber, 1), 0 /* PositionAffinity.Left */, false, true);
                    const end = this._coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.endLineNumber, this.model.getLineMaxColumn(modelRange.endLineNumber)), 1 /* PositionAffinity.Right */);
                    viewRange = new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column);
                }
                else {
                    // For backwards compatibility reasons, we want injected text before any decoration.
                    // Thus, move decorations to the right.
                    viewRange = this._coordinatesConverter.convertModelRangeToViewRange(modelRange, 1 /* PositionAffinity.Right */);
                }
                r = new viewModel_1.ViewModelDecoration(viewRange, options);
                this._decorationsCache[id] = r;
            }
            return r;
        }
        getMinimapDecorationsInRange(range) {
            return this._getDecorationsInRange(range, true, false).decorations;
        }
        getDecorationsViewportData(viewRange) {
            let cacheIsValid = (this._cachedModelDecorationsResolver !== null);
            cacheIsValid = cacheIsValid && (viewRange.equalsRange(this._cachedModelDecorationsResolverViewRange));
            if (!cacheIsValid) {
                this._cachedModelDecorationsResolver = this._getDecorationsInRange(viewRange, false, false);
                this._cachedModelDecorationsResolverViewRange = viewRange;
            }
            return this._cachedModelDecorationsResolver;
        }
        getInlineDecorationsOnLine(lineNumber, onlyMinimapDecorations = false, onlyMarginDecorations = false) {
            const range = new range_1.Range(lineNumber, this._linesCollection.getViewLineMinColumn(lineNumber), lineNumber, this._linesCollection.getViewLineMaxColumn(lineNumber));
            return this._getDecorationsInRange(range, onlyMinimapDecorations, onlyMarginDecorations).inlineDecorations[0];
        }
        _getDecorationsInRange(viewRange, onlyMinimapDecorations, onlyMarginDecorations) {
            const modelDecorations = this._linesCollection.getDecorationsInRange(viewRange, this.editorId, (0, editorOptions_1.filterValidationDecorations)(this.configuration.options), onlyMinimapDecorations, onlyMarginDecorations);
            const startLineNumber = viewRange.startLineNumber;
            const endLineNumber = viewRange.endLineNumber;
            const decorationsInViewport = [];
            let decorationsInViewportLen = 0;
            const inlineDecorations = [];
            for (let j = startLineNumber; j <= endLineNumber; j++) {
                inlineDecorations[j - startLineNumber] = [];
            }
            for (let i = 0, len = modelDecorations.length; i < len; i++) {
                const modelDecoration = modelDecorations[i];
                const decorationOptions = modelDecoration.options;
                if (!isModelDecorationVisible(this.model, modelDecoration)) {
                    continue;
                }
                const viewModelDecoration = this._getOrCreateViewModelDecoration(modelDecoration);
                const viewRange = viewModelDecoration.range;
                decorationsInViewport[decorationsInViewportLen++] = viewModelDecoration;
                if (decorationOptions.inlineClassName) {
                    const inlineDecoration = new viewModel_1.InlineDecoration(viewRange, decorationOptions.inlineClassName, decorationOptions.inlineClassNameAffectsLetterSpacing ? 3 /* InlineDecorationType.RegularAffectingLetterSpacing */ : 0 /* InlineDecorationType.Regular */);
                    const intersectedStartLineNumber = Math.max(startLineNumber, viewRange.startLineNumber);
                    const intersectedEndLineNumber = Math.min(endLineNumber, viewRange.endLineNumber);
                    for (let j = intersectedStartLineNumber; j <= intersectedEndLineNumber; j++) {
                        inlineDecorations[j - startLineNumber].push(inlineDecoration);
                    }
                }
                if (decorationOptions.beforeContentClassName) {
                    if (startLineNumber <= viewRange.startLineNumber && viewRange.startLineNumber <= endLineNumber) {
                        const inlineDecoration = new viewModel_1.InlineDecoration(new range_1.Range(viewRange.startLineNumber, viewRange.startColumn, viewRange.startLineNumber, viewRange.startColumn), decorationOptions.beforeContentClassName, 1 /* InlineDecorationType.Before */);
                        inlineDecorations[viewRange.startLineNumber - startLineNumber].push(inlineDecoration);
                    }
                }
                if (decorationOptions.afterContentClassName) {
                    if (startLineNumber <= viewRange.endLineNumber && viewRange.endLineNumber <= endLineNumber) {
                        const inlineDecoration = new viewModel_1.InlineDecoration(new range_1.Range(viewRange.endLineNumber, viewRange.endColumn, viewRange.endLineNumber, viewRange.endColumn), decorationOptions.afterContentClassName, 2 /* InlineDecorationType.After */);
                        inlineDecorations[viewRange.endLineNumber - startLineNumber].push(inlineDecoration);
                    }
                }
            }
            return {
                decorations: decorationsInViewport,
                inlineDecorations: inlineDecorations
            };
        }
    }
    exports.ViewModelDecorations = ViewModelDecorations;
    function isModelDecorationVisible(model, decoration) {
        if (decoration.options.hideInCommentTokens && isModelDecorationInComment(model, decoration)) {
            return false;
        }
        if (decoration.options.hideInStringTokens && isModelDecorationInString(model, decoration)) {
            return false;
        }
        return true;
    }
    function isModelDecorationInComment(model, decoration) {
        return testTokensInRange(model, decoration.range, (tokenType) => tokenType === 1 /* StandardTokenType.Comment */);
    }
    function isModelDecorationInString(model, decoration) {
        return testTokensInRange(model, decoration.range, (tokenType) => tokenType === 2 /* StandardTokenType.String */);
    }
    /**
     * Calls the callback for every token that intersects the range.
     * If the callback returns `false`, iteration stops and `false` is returned.
     * Otherwise, `true` is returned.
     */
    function testTokensInRange(model, range, callback) {
        for (let lineNumber = range.startLineNumber; lineNumber <= range.endLineNumber; lineNumber++) {
            const lineTokens = model.tokenization.getLineTokens(lineNumber);
            const isFirstLine = lineNumber === range.startLineNumber;
            const isEndLine = lineNumber === range.endLineNumber;
            let tokenIdx = isFirstLine ? lineTokens.findTokenIndexAtOffset(range.startColumn - 1) : 0;
            while (tokenIdx < lineTokens.getCount()) {
                if (isEndLine) {
                    const startOffset = lineTokens.getStartOffset(tokenIdx);
                    if (startOffset > range.endColumn - 1) {
                        break;
                    }
                }
                const callbackResult = callback(lineTokens.getStandardTokenType(tokenIdx));
                if (!callbackResult) {
                    return false;
                }
                tokenIdx++;
            }
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsRGVjb3JhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdmlld01vZGVsL3ZpZXdNb2RlbERlY29yYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdMaEcsNERBVUM7SUFFRCxnRUFNQztJQUVELDhEQU1DO0lBbkxELE1BQWEsb0JBQW9CO1FBYWhDLFlBQVksUUFBZ0IsRUFBRSxLQUFpQixFQUFFLGFBQW1DLEVBQUUsZUFBZ0MsRUFBRSxvQkFBMkM7WUFDbEssSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDekIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7WUFDbkMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztZQUN4QyxJQUFJLENBQUMscUJBQXFCLEdBQUcsb0JBQW9CLENBQUM7WUFDbEQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLCtCQUErQixHQUFHLElBQUksQ0FBQztZQUM1QyxJQUFJLENBQUMsd0NBQXdDLEdBQUcsSUFBSSxDQUFDO1FBQ3RELENBQUM7UUFFTyxvQ0FBb0M7WUFDM0MsSUFBSSxDQUFDLCtCQUErQixHQUFHLElBQUksQ0FBQztZQUM1QyxJQUFJLENBQUMsd0NBQXdDLEdBQUcsSUFBSSxDQUFDO1FBQ3RELENBQUM7UUFFTSxPQUFPO1lBQ2IsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLENBQUM7UUFDN0MsQ0FBQztRQUVNLEtBQUs7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