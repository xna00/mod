/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects"], function (require, exports, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplyEditsResult = exports.SearchData = exports.ValidAnnotatedEditOperation = exports.ModelConstants = exports.PositionAffinity = exports.TrackedRangeStickiness = exports.FindMatch = exports.TextModelResolvedOptions = exports.EndOfLineSequence = exports.DefaultEndOfLine = exports.EndOfLinePreference = exports.InjectedTextCursorStops = exports.MinimapSectionHeaderStyle = exports.MinimapPosition = exports.GlyphMarginLane = exports.OverviewRulerLane = void 0;
    exports.isITextSnapshot = isITextSnapshot;
    exports.shouldSynchronizeModel = shouldSynchronizeModel;
    /**
     * Vertical Lane in the overview ruler of the editor.
     */
    var OverviewRulerLane;
    (function (OverviewRulerLane) {
        OverviewRulerLane[OverviewRulerLane["Left"] = 1] = "Left";
        OverviewRulerLane[OverviewRulerLane["Center"] = 2] = "Center";
        OverviewRulerLane[OverviewRulerLane["Right"] = 4] = "Right";
        OverviewRulerLane[OverviewRulerLane["Full"] = 7] = "Full";
    })(OverviewRulerLane || (exports.OverviewRulerLane = OverviewRulerLane = {}));
    /**
     * Vertical Lane in the glyph margin of the editor.
     */
    var GlyphMarginLane;
    (function (GlyphMarginLane) {
        GlyphMarginLane[GlyphMarginLane["Left"] = 1] = "Left";
        GlyphMarginLane[GlyphMarginLane["Center"] = 2] = "Center";
        GlyphMarginLane[GlyphMarginLane["Right"] = 3] = "Right";
    })(GlyphMarginLane || (exports.GlyphMarginLane = GlyphMarginLane = {}));
    /**
     * Position in the minimap to render the decoration.
     */
    var MinimapPosition;
    (function (MinimapPosition) {
        MinimapPosition[MinimapPosition["Inline"] = 1] = "Inline";
        MinimapPosition[MinimapPosition["Gutter"] = 2] = "Gutter";
    })(MinimapPosition || (exports.MinimapPosition = MinimapPosition = {}));
    /**
     * Section header style.
     */
    var MinimapSectionHeaderStyle;
    (function (MinimapSectionHeaderStyle) {
        MinimapSectionHeaderStyle[MinimapSectionHeaderStyle["Normal"] = 1] = "Normal";
        MinimapSectionHeaderStyle[MinimapSectionHeaderStyle["Underlined"] = 2] = "Underlined";
    })(MinimapSectionHeaderStyle || (exports.MinimapSectionHeaderStyle = MinimapSectionHeaderStyle = {}));
    var InjectedTextCursorStops;
    (function (InjectedTextCursorStops) {
        InjectedTextCursorStops[InjectedTextCursorStops["Both"] = 0] = "Both";
        InjectedTextCursorStops[InjectedTextCursorStops["Right"] = 1] = "Right";
        InjectedTextCursorStops[InjectedTextCursorStops["Left"] = 2] = "Left";
        InjectedTextCursorStops[InjectedTextCursorStops["None"] = 3] = "None";
    })(InjectedTextCursorStops || (exports.InjectedTextCursorStops = InjectedTextCursorStops = {}));
    /**
     * End of line character preference.
     */
    var EndOfLinePreference;
    (function (EndOfLinePreference) {
        /**
         * Use the end of line character identified in the text buffer.
         */
        EndOfLinePreference[EndOfLinePreference["TextDefined"] = 0] = "TextDefined";
        /**
         * Use line feed (\n) as the end of line character.
         */
        EndOfLinePreference[EndOfLinePreference["LF"] = 1] = "LF";
        /**
         * Use carriage return and line feed (\r\n) as the end of line character.
         */
        EndOfLinePreference[EndOfLinePreference["CRLF"] = 2] = "CRLF";
    })(EndOfLinePreference || (exports.EndOfLinePreference = EndOfLinePreference = {}));
    /**
     * The default end of line to use when instantiating models.
     */
    var DefaultEndOfLine;
    (function (DefaultEndOfLine) {
        /**
         * Use line feed (\n) as the end of line character.
         */
        DefaultEndOfLine[DefaultEndOfLine["LF"] = 1] = "LF";
        /**
         * Use carriage return and line feed (\r\n) as the end of line character.
         */
        DefaultEndOfLine[DefaultEndOfLine["CRLF"] = 2] = "CRLF";
    })(DefaultEndOfLine || (exports.DefaultEndOfLine = DefaultEndOfLine = {}));
    /**
     * End of line character preference.
     */
    var EndOfLineSequence;
    (function (EndOfLineSequence) {
        /**
         * Use line feed (\n) as the end of line character.
         */
        EndOfLineSequence[EndOfLineSequence["LF"] = 0] = "LF";
        /**
         * Use carriage return and line feed (\r\n) as the end of line character.
         */
        EndOfLineSequence[EndOfLineSequence["CRLF"] = 1] = "CRLF";
    })(EndOfLineSequence || (exports.EndOfLineSequence = EndOfLineSequence = {}));
    class TextModelResolvedOptions {
        get originalIndentSize() {
            return this._indentSizeIsTabSize ? 'tabSize' : this.indentSize;
        }
        /**
         * @internal
         */
        constructor(src) {
            this._textModelResolvedOptionsBrand = undefined;
            this.tabSize = Math.max(1, src.tabSize | 0);
            if (src.indentSize === 'tabSize') {
                this.indentSize = this.tabSize;
                this._indentSizeIsTabSize = true;
            }
            else {
                this.indentSize = Math.max(1, src.indentSize | 0);
                this._indentSizeIsTabSize = false;
            }
            this.insertSpaces = Boolean(src.insertSpaces);
            this.defaultEOL = src.defaultEOL | 0;
            this.trimAutoWhitespace = Boolean(src.trimAutoWhitespace);
            this.bracketPairColorizationOptions = src.bracketPairColorizationOptions;
        }
        /**
         * @internal
         */
        equals(other) {
            return (this.tabSize === other.tabSize
                && this._indentSizeIsTabSize === other._indentSizeIsTabSize
                && this.indentSize === other.indentSize
                && this.insertSpaces === other.insertSpaces
                && this.defaultEOL === other.defaultEOL
                && this.trimAutoWhitespace === other.trimAutoWhitespace
                && (0, objects_1.equals)(this.bracketPairColorizationOptions, other.bracketPairColorizationOptions));
        }
        /**
         * @internal
         */
        createChangeEvent(newOpts) {
            return {
                tabSize: this.tabSize !== newOpts.tabSize,
                indentSize: this.indentSize !== newOpts.indentSize,
                insertSpaces: this.insertSpaces !== newOpts.insertSpaces,
                trimAutoWhitespace: this.trimAutoWhitespace !== newOpts.trimAutoWhitespace,
            };
        }
    }
    exports.TextModelResolvedOptions = TextModelResolvedOptions;
    class FindMatch {
        /**
         * @internal
         */
        constructor(range, matches) {
            this._findMatchBrand = undefined;
            this.range = range;
            this.matches = matches;
        }
    }
    exports.FindMatch = FindMatch;
    /**
     * Describes the behavior of decorations when typing/editing near their edges.
     * Note: Please do not edit the values, as they very carefully match `DecorationRangeBehavior`
     */
    var TrackedRangeStickiness;
    (function (TrackedRangeStickiness) {
        TrackedRangeStickiness[TrackedRangeStickiness["AlwaysGrowsWhenTypingAtEdges"] = 0] = "AlwaysGrowsWhenTypingAtEdges";
        TrackedRangeStickiness[TrackedRangeStickiness["NeverGrowsWhenTypingAtEdges"] = 1] = "NeverGrowsWhenTypingAtEdges";
        TrackedRangeStickiness[TrackedRangeStickiness["GrowsOnlyWhenTypingBefore"] = 2] = "GrowsOnlyWhenTypingBefore";
        TrackedRangeStickiness[TrackedRangeStickiness["GrowsOnlyWhenTypingAfter"] = 3] = "GrowsOnlyWhenTypingAfter";
    })(TrackedRangeStickiness || (exports.TrackedRangeStickiness = TrackedRangeStickiness = {}));
    /**
     * @internal
     */
    function isITextSnapshot(obj) {
        return (obj && typeof obj.read === 'function');
    }
    var PositionAffinity;
    (function (PositionAffinity) {
        /**
         * Prefers the left most position.
        */
        PositionAffinity[PositionAffinity["Left"] = 0] = "Left";
        /**
         * Prefers the right most position.
        */
        PositionAffinity[PositionAffinity["Right"] = 1] = "Right";
        /**
         * No preference.
        */
        PositionAffinity[PositionAffinity["None"] = 2] = "None";
        /**
         * If the given position is on injected text, prefers the position left of it.
        */
        PositionAffinity[PositionAffinity["LeftOfInjectedText"] = 3] = "LeftOfInjectedText";
        /**
         * If the given position is on injected text, prefers the position right of it.
        */
        PositionAffinity[PositionAffinity["RightOfInjectedText"] = 4] = "RightOfInjectedText";
    })(PositionAffinity || (exports.PositionAffinity = PositionAffinity = {}));
    /**
     * @internal
     */
    var ModelConstants;
    (function (ModelConstants) {
        ModelConstants[ModelConstants["FIRST_LINE_DETECTION_LENGTH_LIMIT"] = 1000] = "FIRST_LINE_DETECTION_LENGTH_LIMIT";
    })(ModelConstants || (exports.ModelConstants = ModelConstants = {}));
    /**
     * @internal
     */
    class ValidAnnotatedEditOperation {
        constructor(identifier, range, text, forceMoveMarkers, isAutoWhitespaceEdit, _isTracked) {
            this.identifier = identifier;
            this.range = range;
            this.text = text;
            this.forceMoveMarkers = forceMoveMarkers;
            this.isAutoWhitespaceEdit = isAutoWhitespaceEdit;
            this._isTracked = _isTracked;
        }
    }
    exports.ValidAnnotatedEditOperation = ValidAnnotatedEditOperation;
    /**
     * @internal
     */
    class SearchData {
        constructor(regex, wordSeparators, simpleSearch) {
            this.regex = regex;
            this.wordSeparators = wordSeparators;
            this.simpleSearch = simpleSearch;
        }
    }
    exports.SearchData = SearchData;
    /**
     * @internal
     */
    class ApplyEditsResult {
        constructor(reverseEdits, changes, trimAutoWhitespaceLineNumbers) {
            this.reverseEdits = reverseEdits;
            this.changes = changes;
            this.trimAutoWhitespaceLineNumbers = trimAutoWhitespaceLineNumbers;
        }
    }
    exports.ApplyEditsResult = ApplyEditsResult;
    /**
     * @internal
     */
    function shouldSynchronizeModel(model) {
        return (!model.isTooLargeForSyncing() && !model.isForSimpleWidget);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK25CaEcsMENBRUM7SUFnMUJELHdEQUlDO0lBOTdDRDs7T0FFRztJQUNILElBQVksaUJBS1g7SUFMRCxXQUFZLGlCQUFpQjtRQUM1Qix5REFBUSxDQUFBO1FBQ1IsNkRBQVUsQ0FBQTtRQUNWLDJEQUFTLENBQUE7UUFDVCx5REFBUSxDQUFBO0lBQ1QsQ0FBQyxFQUxXLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBSzVCO0lBRUQ7O09BRUc7SUFDSCxJQUFZLGVBSVg7SUFKRCxXQUFZLGVBQWU7UUFDMUIscURBQVEsQ0FBQTtRQUNSLHlEQUFVLENBQUE7UUFDVix1REFBUyxDQUFBO0lBQ1YsQ0FBQyxFQUpXLGVBQWUsK0JBQWYsZUFBZSxRQUkxQjtJQTBCRDs7T0FFRztJQUNILElBQWtCLGVBR2pCO0lBSEQsV0FBa0IsZUFBZTtRQUNoQyx5REFBVSxDQUFBO1FBQ1YseURBQVUsQ0FBQTtJQUNYLENBQUMsRUFIaUIsZUFBZSwrQkFBZixlQUFlLFFBR2hDO0lBRUQ7O09BRUc7SUFDSCxJQUFrQix5QkFHakI7SUFIRCxXQUFrQix5QkFBeUI7UUFDMUMsNkVBQVUsQ0FBQTtRQUNWLHFGQUFjLENBQUE7SUFDZixDQUFDLEVBSGlCLHlCQUF5Qix5Q0FBekIseUJBQXlCLFFBRzFDO0lBb09ELElBQVksdUJBS1g7SUFMRCxXQUFZLHVCQUF1QjtRQUNsQyxxRUFBSSxDQUFBO1FBQ0osdUVBQUssQ0FBQTtRQUNMLHFFQUFJLENBQUE7UUFDSixxRUFBSSxDQUFBO0lBQ0wsQ0FBQyxFQUxXLHVCQUF1Qix1Q0FBdkIsdUJBQXVCLFFBS2xDO0lBK0VEOztPQUVHO0lBQ0gsSUFBa0IsbUJBYWpC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