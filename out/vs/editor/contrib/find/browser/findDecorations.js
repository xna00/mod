/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, range_1, model_1, textModel_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindDecorations = void 0;
    class FindDecorations {
        constructor(editor) {
            this._editor = editor;
            this._decorations = [];
            this._overviewRulerApproximateDecorations = [];
            this._findScopeDecorationIds = [];
            this._rangeHighlightDecorationId = null;
            this._highlightedDecorationId = null;
            this._startPosition = this._editor.getPosition();
        }
        dispose() {
            this._editor.removeDecorations(this._allDecorations());
            this._decorations = [];
            this._overviewRulerApproximateDecorations = [];
            this._findScopeDecorationIds = [];
            this._rangeHighlightDecorationId = null;
            this._highlightedDecorationId = null;
        }
        reset() {
            this._decorations = [];
            this._overviewRulerApproximateDecorations = [];
            this._findScopeDecorationIds = [];
            this._rangeHighlightDecorationId = null;
            this._highlightedDecorationId = null;
        }
        getCount() {
            return this._decorations.length;
        }
        /** @deprecated use getFindScopes to support multiple selections */
        getFindScope() {
            if (this._findScopeDecorationIds[0]) {
                return this._editor.getModel().getDecorationRange(this._findScopeDecorationIds[0]);
            }
            return null;
        }
        getFindScopes() {
            if (this._findScopeDecorationIds.length) {
                const scopes = this._findScopeDecorationIds.map(findScopeDecorationId => this._editor.getModel().getDecorationRange(findScopeDecorationId)).filter(element => !!element);
                if (scopes.length) {
                    return scopes;
                }
            }
            return null;
        }
        getStartPosition() {
            return this._startPosition;
        }
        setStartPosition(newStartPosition) {
            this._startPosition = newStartPosition;
            this.setCurrentFindMatch(null);
        }
        _getDecorationIndex(decorationId) {
            const index = this._decorations.indexOf(decorationId);
            if (index >= 0) {
                return index + 1;
            }
            return 1;
        }
        getDecorationRangeAt(index) {
            const decorationId = index < this._decorations.length ? this._decorations[index] : null;
            if (decorationId) {
                return this._editor.getModel().getDecorationRange(decorationId);
            }
            return null;
        }
        getCurrentMatchesPosition(desiredRange) {
            const candidates = this._editor.getModel().getDecorationsInRange(desiredRange);
            for (const candidate of candidates) {
                const candidateOpts = candidate.options;
                if (candidateOpts === FindDecorations._FIND_MATCH_DECORATION || candidateOpts === FindDecorations._CURRENT_FIND_MATCH_DECORATION) {
                    return this._getDecorationIndex(candidate.id);
                }
            }
            // We don't know the current match position, so returns zero to show '?' in find widget
            return 0;
        }
        setCurrentFindMatch(nextMatch) {
            let newCurrentDecorationId = null;
            let matchPosition = 0;
            if (nextMatch) {
                for (let i = 0, len = this._decorations.length; i < len; i++) {
                    const range = this._editor.getModel().getDecorationRange(this._decorations[i]);
                    if (nextMatch.equalsRange(range)) {
                        newCurrentDecorationId = this._decorations[i];
                        matchPosition = (i + 1);
                        break;
                    }
                }
            }
            if (this._highlightedDecorationId !== null || newCurrentDecorationId !== null) {
                this._editor.changeDecorations((changeAccessor) => {
                    if (this._highlightedDecorationId !== null) {
                        changeAccessor.changeDecorationOptions(this._highlightedDecorationId, FindDecorations._FIND_MATCH_DECORATION);
                        this._highlightedDecorationId = null;
                    }
                    if (newCurrentDecorationId !== null) {
                        this._highlightedDecorationId = newCurrentDecorationId;
                        changeAccessor.changeDecorationOptions(this._highlightedDecorationId, FindDecorations._CURRENT_FIND_MATCH_DECORATION);
                    }
                    if (this._rangeHighlightDecorationId !== null) {
                        changeAccessor.removeDecoration(this._rangeHighlightDecorationId);
                        this._rangeHighlightDecorationId = null;
                    }
                    if (newCurrentDecorationId !== null) {
                        let rng = this._editor.getModel().getDecorationRange(newCurrentDecorationId);
                        if (rng.startLineNumber !== rng.endLineNumber && rng.endColumn === 1) {
                            const lineBeforeEnd = rng.endLineNumber - 1;
                            const lineBeforeEndMaxColumn = this._editor.getModel().getLineMaxColumn(lineBeforeEnd);
                            rng = new range_1.Range(rng.startLineNumber, rng.startColumn, lineBeforeEnd, lineBeforeEndMaxColumn);
                        }
                        this._rangeHighlightDecorationId = changeAccessor.addDecoration(rng, FindDecorations._RANGE_HIGHLIGHT_DECORATION);
                    }
                });
            }
            return matchPosition;
        }
        set(findMatches, findScopes) {
            this._editor.changeDecorations((accessor) => {
                let findMatchesOptions = FindDecorations._FIND_MATCH_DECORATION;
                const newOverviewRulerApproximateDecorations = [];
                if (findMatches.length > 1000) {
                    // we go into a mode where the overview ruler gets "approximate" decorations
                    // the reason is that the overview ruler paints all the decorations in the file and we don't want to cause freezes
                    findMatchesOptions = FindDecorations._FIND_MATCH_NO_OVERVIEW_DECORATION;
                    // approximate a distance in lines where matches should be merged
                    const lineCount = this._editor.getModel().getLineCount();
                    const height = this._editor.getLayoutInfo().height;
                    const approxPixelsPerLine = height / lineCount;
                    const mergeLinesDelta = Math.max(2, Math.ceil(3 / approxPixelsPerLine));
                    // merge decorations as much as possible
                    let prevStartLineNumber = findMatches[0].range.startLineNumber;
                    let prevEndLineNumber = findMatches[0].range.endLineNumber;
                    for (let i = 1, len = findMatches.length; i < len; i++) {
                        const range = findMatches[i].range;
                        if (prevEndLineNumber + mergeLinesDelta >= range.startLineNumber) {
                            if (range.endLineNumber > prevEndLineNumber) {
                                prevEndLineNumber = range.endLineNumber;
                            }
                        }
                        else {
                            newOverviewRulerApproximateDecorations.push({
                                range: new range_1.Range(prevStartLineNumber, 1, prevEndLineNumber, 1),
                                options: FindDecorations._FIND_MATCH_ONLY_OVERVIEW_DECORATION
                            });
                            prevStartLineNumber = range.startLineNumber;
                            prevEndLineNumber = range.endLineNumber;
                        }
                    }
                    newOverviewRulerApproximateDecorations.push({
                        range: new range_1.Range(prevStartLineNumber, 1, prevEndLineNumber, 1),
                        options: FindDecorations._FIND_MATCH_ONLY_OVERVIEW_DECORATION
                    });
                }
                // Find matches
                const newFindMatchesDecorations = new Array(findMatches.length);
                for (let i = 0, len = findMatches.length; i < len; i++) {
                    newFindMatchesDecorations[i] = {
                        range: findMatches[i].range,
                        options: findMatchesOptions
                    };
                }
                this._decorations = accessor.deltaDecorations(this._decorations, newFindMatchesDecorations);
                // Overview ruler approximate decorations
                this._overviewRulerApproximateDecorations = accessor.deltaDecorations(this._overviewRulerApproximateDecorations, newOverviewRulerApproximateDecorations);
                // Range highlight
                if (this._rangeHighlightDecorationId) {
                    accessor.removeDecoration(this._rangeHighlightDecorationId);
                    this._rangeHighlightDecorationId = null;
                }
                // Find scope
                if (this._findScopeDecorationIds.length) {
                    this._findScopeDecorationIds.forEach(findScopeDecorationId => accessor.removeDecoration(findScopeDecorationId));
                    this._findScopeDecorationIds = [];
                }
                if (findScopes?.length) {
                    this._findScopeDecorationIds = findScopes.map(findScope => accessor.addDecoration(findScope, FindDecorations._FIND_SCOPE_DECORATION));
                }
            });
        }
        matchBeforePosition(position) {
            if (this._decorations.length === 0) {
                return null;
            }
            for (let i = this._decorations.length - 1; i >= 0; i--) {
                const decorationId = this._decorations[i];
                const r = this._editor.getModel().getDecorationRange(decorationId);
                if (!r || r.endLineNumber > position.lineNumber) {
                    continue;
                }
                if (r.endLineNumber < position.lineNumber) {
                    return r;
                }
                if (r.endColumn > position.column) {
                    continue;
                }
                return r;
            }
            return this._editor.getModel().getDecorationRange(this._decorations[this._decorations.length - 1]);
        }
        matchAfterPosition(position) {
            if (this._decorations.length === 0) {
                return null;
            }
            for (let i = 0, len = this._decorations.length; i < len; i++) {
                const decorationId = this._decorations[i];
                const r = this._editor.getModel().getDecorationRange(decorationId);
                if (!r || r.startLineNumber < position.lineNumber) {
                    continue;
                }
                if (r.startLineNumber > position.lineNumber) {
                    return r;
                }
                if (r.startColumn < position.column) {
                    continue;
                }
                return r;
            }
            return this._editor.getModel().getDecorationRange(this._decorations[0]);
        }
        _allDecorations() {
            let result = [];
            result = result.concat(this._decorations);
            result = result.concat(this._overviewRulerApproximateDecorations);
            if (this._findScopeDecorationIds.length) {
                result.push(...this._findScopeDecorationIds);
            }
            if (this._rangeHighlightDecorationId) {
                result.push(this._rangeHighlightDecorationId);
            }
            return result;
        }
        static { this._CURRENT_FIND_MATCH_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'current-find-match',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            zIndex: 13,
            className: 'currentFindMatch',
            showIfCollapsed: true,
            overviewRuler: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerFindMatchForeground),
                position: model_1.OverviewRulerLane.Center
            },
            minimap: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapFindMatch),
                position: 1 /* MinimapPosition.Inline */
            }
        }); }
        static { this._FIND_MATCH_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'find-match',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            zIndex: 10,
            className: 'findMatch',
            showIfCollapsed: true,
            overviewRuler: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerFindMatchForeground),
                position: model_1.OverviewRulerLane.Center
            },
            minimap: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapFindMatch),
                position: 1 /* MinimapPosition.Inline */
            }
        }); }
        static { this._FIND_MATCH_NO_OVERVIEW_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'find-match-no-overview',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'findMatch',
            showIfCollapsed: true
        }); }
        static { this._FIND_MATCH_ONLY_OVERVIEW_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'find-match-only-overview',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            overviewRuler: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerFindMatchForeground),
                position: model_1.OverviewRulerLane.Center
            }
        }); }
        static { this._RANGE_HIGHLIGHT_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'find-range-highlight',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'rangeHighlight',
            isWholeLine: true
        }); }
        static { this._FIND_SCOPE_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'find-scope',
            className: 'findScope',
            isWholeLine: true
        }); }
    }
    exports.FindDecorations = FindDecorations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZERlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9maW5kL2Jyb3dzZXIvZmluZERlY29yYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFhLGVBQWU7UUFVM0IsWUFBWSxNQUF5QjtZQUNwQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsb0NBQW9DLEdBQUcsRUFBRSxDQUFDO1lBQy9DLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLDJCQUEyQixHQUFHLElBQUksQ0FBQztZQUN4QyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNsRCxDQUFDO1FBRU0sT0FBTztZQUNiLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFFdkQsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLG9DQUFvQyxHQUFHLEVBQUUsQ0FBQztZQUMvQyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUM7WUFDeEMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQztRQUN0QyxDQUFDO1FBRU0sS0FBSztZQUNYLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxvQ0FBb0MsR0FBRyxFQUFF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