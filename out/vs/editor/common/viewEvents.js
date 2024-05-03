/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewZonesChangedEvent = exports.ViewTokensColorsChangedEvent = exports.ViewTokensChangedEvent = exports.ViewThemeChangedEvent = exports.ViewScrollChangedEvent = exports.ViewRevealRangeRequestEvent = exports.VerticalRevealType = exports.ViewLinesInsertedEvent = exports.ViewLinesDeletedEvent = exports.ViewLinesChangedEvent = exports.ViewLineMappingChangedEvent = exports.ViewLanguageConfigurationEvent = exports.ViewFocusChangedEvent = exports.ViewFlushedEvent = exports.ViewDecorationsChangedEvent = exports.ViewCursorStateChangedEvent = exports.ViewConfigurationChangedEvent = exports.ViewCompositionEndEvent = exports.ViewCompositionStartEvent = exports.ViewEventType = void 0;
    var ViewEventType;
    (function (ViewEventType) {
        ViewEventType[ViewEventType["ViewCompositionStart"] = 0] = "ViewCompositionStart";
        ViewEventType[ViewEventType["ViewCompositionEnd"] = 1] = "ViewCompositionEnd";
        ViewEventType[ViewEventType["ViewConfigurationChanged"] = 2] = "ViewConfigurationChanged";
        ViewEventType[ViewEventType["ViewCursorStateChanged"] = 3] = "ViewCursorStateChanged";
        ViewEventType[ViewEventType["ViewDecorationsChanged"] = 4] = "ViewDecorationsChanged";
        ViewEventType[ViewEventType["ViewFlushed"] = 5] = "ViewFlushed";
        ViewEventType[ViewEventType["ViewFocusChanged"] = 6] = "ViewFocusChanged";
        ViewEventType[ViewEventType["ViewLanguageConfigurationChanged"] = 7] = "ViewLanguageConfigurationChanged";
        ViewEventType[ViewEventType["ViewLineMappingChanged"] = 8] = "ViewLineMappingChanged";
        ViewEventType[ViewEventType["ViewLinesChanged"] = 9] = "ViewLinesChanged";
        ViewEventType[ViewEventType["ViewLinesDeleted"] = 10] = "ViewLinesDeleted";
        ViewEventType[ViewEventType["ViewLinesInserted"] = 11] = "ViewLinesInserted";
        ViewEventType[ViewEventType["ViewRevealRangeRequest"] = 12] = "ViewRevealRangeRequest";
        ViewEventType[ViewEventType["ViewScrollChanged"] = 13] = "ViewScrollChanged";
        ViewEventType[ViewEventType["ViewThemeChanged"] = 14] = "ViewThemeChanged";
        ViewEventType[ViewEventType["ViewTokensChanged"] = 15] = "ViewTokensChanged";
        ViewEventType[ViewEventType["ViewTokensColorsChanged"] = 16] = "ViewTokensColorsChanged";
        ViewEventType[ViewEventType["ViewZonesChanged"] = 17] = "ViewZonesChanged";
    })(ViewEventType || (exports.ViewEventType = ViewEventType = {}));
    class ViewCompositionStartEvent {
        constructor() {
            this.type = 0 /* ViewEventType.ViewCompositionStart */;
        }
    }
    exports.ViewCompositionStartEvent = ViewCompositionStartEvent;
    class ViewCompositionEndEvent {
        constructor() {
            this.type = 1 /* ViewEventType.ViewCompositionEnd */;
        }
    }
    exports.ViewCompositionEndEvent = ViewCompositionEndEvent;
    class ViewConfigurationChangedEvent {
        constructor(source) {
            this.type = 2 /* ViewEventType.ViewConfigurationChanged */;
            this._source = source;
        }
        hasChanged(id) {
            return this._source.hasChanged(id);
        }
    }
    exports.ViewConfigurationChangedEvent = ViewConfigurationChangedEvent;
    class ViewCursorStateChangedEvent {
        constructor(selections, modelSelections, reason) {
            this.selections = selections;
            this.modelSelections = modelSelections;
            this.reason = reason;
            this.type = 3 /* ViewEventType.ViewCursorStateChanged */;
        }
    }
    exports.ViewCursorStateChangedEvent = ViewCursorStateChangedEvent;
    class ViewDecorationsChangedEvent {
        constructor(source) {
            this.type = 4 /* ViewEventType.ViewDecorationsChanged */;
            if (source) {
                this.affectsMinimap = source.affectsMinimap;
                this.affectsOverviewRuler = source.affectsOverviewRuler;
                this.affectsGlyphMargin = source.affectsGlyphMargin;
                this.affectsLineNumber = source.affectsLineNumber;
            }
            else {
                this.affectsMinimap = true;
                this.affectsOverviewRuler = true;
                this.affectsGlyphMargin = true;
                this.affectsLineNumber = true;
            }
        }
    }
    exports.ViewDecorationsChangedEvent = ViewDecorationsChangedEvent;
    class ViewFlushedEvent {
        constructor() {
            this.type = 5 /* ViewEventType.ViewFlushed */;
            // Nothing to do
        }
    }
    exports.ViewFlushedEvent = ViewFlushedEvent;
    class ViewFocusChangedEvent {
        constructor(isFocused) {
            this.type = 6 /* ViewEventType.ViewFocusChanged */;
            this.isFocused = isFocused;
        }
    }
    exports.ViewFocusChangedEvent = ViewFocusChangedEvent;
    class ViewLanguageConfigurationEvent {
        constructor() {
            this.type = 7 /* ViewEventType.ViewLanguageConfigurationChanged */;
        }
    }
    exports.ViewLanguageConfigurationEvent = ViewLanguageConfigurationEvent;
    class ViewLineMappingChangedEvent {
        constructor() {
            this.type = 8 /* ViewEventType.ViewLineMappingChanged */;
            // Nothing to do
        }
    }
    exports.ViewLineMappingChangedEvent = ViewLineMappingChangedEvent;
    class ViewLinesChangedEvent {
        constructor(
        /**
         * The first line that has changed.
         */
        fromLineNumber, 
        /**
         * The number of lines that have changed.
         */
        count) {
            this.fromLineNumber = fromLineNumber;
            this.count = count;
            this.type = 9 /* ViewEventType.ViewLinesChanged */;
        }
    }
    exports.ViewLinesChangedEvent = ViewLinesChangedEvent;
    class ViewLinesDeletedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 10 /* ViewEventType.ViewLinesDeleted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesDeletedEvent = ViewLinesDeletedEvent;
    class ViewLinesInsertedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 11 /* ViewEventType.ViewLinesInserted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesInsertedEvent = ViewLinesInsertedEvent;
    var VerticalRevealType;
    (function (VerticalRevealType) {
        VerticalRevealType[VerticalRevealType["Simple"] = 0] = "Simple";
        VerticalRevealType[VerticalRevealType["Center"] = 1] = "Center";
        VerticalRevealType[VerticalRevealType["CenterIfOutsideViewport"] = 2] = "CenterIfOutsideViewport";
        VerticalRevealType[VerticalRevealType["Top"] = 3] = "Top";
        VerticalRevealType[VerticalRevealType["Bottom"] = 4] = "Bottom";
        VerticalRevealType[VerticalRevealType["NearTop"] = 5] = "NearTop";
        VerticalRevealType[VerticalRevealType["NearTopIfOutsideViewport"] = 6] = "NearTopIfOutsideViewport";
    })(VerticalRevealType || (exports.VerticalRevealType = VerticalRevealType = {}));
    class ViewRevealRangeRequestEvent {
        constructor(
        /**
         * Source of the call that caused the event.
         */
        source, 
        /**
         * Reduce the revealing to a minimum (e.g. avoid scrolling if the bounding box is visible and near the viewport edge).
         */
        minimalReveal, 
        /**
         * Range to be reavealed.
         */
        range, 
        /**
         * Selections to be revealed.
         */
        selections, 
        /**
         * The vertical reveal strategy.
         */
        verticalType, 
        /**
         * If true: there should be a horizontal & vertical revealing.
         * If false: there should be just a vertical revealing.
         */
        revealHorizontal, 
        /**
         * The scroll type.
         */
        scrollType) {
            this.source = source;
            this.minimalReveal = minimalReveal;
            this.range = range;
            this.selections = selections;
            this.verticalType = verticalType;
            this.revealHorizontal = revealHorizontal;
            this.scrollType = scrollType;
            this.type = 12 /* ViewEventType.ViewRevealRangeRequest */;
        }
    }
    exports.ViewRevealRangeRequestEvent = ViewRevealRangeRequestEvent;
    class ViewScrollChangedEvent {
        constructor(source) {
            this.type = 13 /* ViewEventType.ViewScrollChanged */;
            this.scrollWidth = source.scrollWidth;
            this.scrollLeft = source.scrollLeft;
            this.scrollHeight = source.scrollHeight;
            this.scrollTop = source.scrollTop;
            this.scrollWidthChanged = source.scrollWidthChanged;
            this.scrollLeftChanged = source.scrollLeftChanged;
            this.scrollHeightChanged = source.scrollHeightChanged;
            this.scrollTopChanged = source.scrollTopChanged;
        }
    }
    exports.ViewScrollChangedEvent = ViewScrollChangedEvent;
    class ViewThemeChangedEvent {
        constructor(theme) {
            this.theme = theme;
            this.type = 14 /* ViewEventType.ViewThemeChanged */;
        }
    }
    exports.ViewThemeChangedEvent = ViewThemeChangedEvent;
    class ViewTokensChangedEvent {
        constructor(ranges) {
            this.type = 15 /* ViewEventType.ViewTokensChanged */;
            this.ranges = ranges;
        }
    }
    exports.ViewTokensChangedEvent = ViewTokensChangedEvent;
    class ViewTokensColorsChangedEvent {
        constructor() {
            this.type = 16 /* ViewEventType.ViewTokensColorsChanged */;
            // Nothing to do
        }
    }
    exports.ViewTokensColorsChangedEvent = ViewTokensColorsChangedEvent;
    class ViewZonesChangedEvent {
        constructor() {
            this.type = 17 /* ViewEventType.ViewZonesChanged */;
            // Nothing to do
        }
    }
    exports.ViewZonesChangedEvent = ViewZonesChangedEvent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0V2ZW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3RXZlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxJQUFrQixhQW1CakI7SUFuQkQsV0FBa0IsYUFBYTtRQUM5QixpRkFBb0IsQ0FBQTtRQUNwQiw2RUFBa0IsQ0FBQTtRQUNsQix5RkFBd0IsQ0FBQTtRQUN4QixxRkFBc0IsQ0FBQTtRQUN0QixxRkFBc0IsQ0FBQTtRQUN0QiwrREFBVyxDQUFBO1FBQ1gseUVBQWdCLENBQUE7UUFDaEIseUdBQWdDLENBQUE7UUFDaEMscUZBQXNCLENBQUE7UUFDdEIseUVBQWdCLENBQUE7UUFDaEIsMEVBQWdCLENBQUE7UUFDaEIsNEVBQWlCLENBQUE7UUFDakIsc0ZBQXNCLENBQUE7UUFDdEIsNEVBQWlCLENBQUE7UUFDakIsMEVBQWdCLENBQUE7UUFDaEIsNEVBQWlCLENBQUE7UUFDakIsd0ZBQXVCLENBQUE7UUFDdkIsMEVBQWdCLENBQUE7SUFDakIsQ0FBQyxFQW5CaUIsYUFBYSw2QkFBYixhQUFhLFFBbUI5QjtJQUVELE1BQWEseUJBQXlCO1FBRXJDO1lBRGdCLFNBQUksOENBQXNDO1FBQzFDLENBQUM7S0FDakI7SUFIRCw4REFHQztJQUVELE1BQWEsdUJBQXVCO1FBRW5DO1lBRGdCLFNBQUksNENBQW9DO1FBQ3hDLENBQUM7S0FDakI7SUFIRCwwREFHQztJQUVELE1BQWEsNkJBQTZCO1FBTXpDLFlBQVksTUFBaUM7WUFKN0IsU0FBSSxrREFBMEM7WUFLN0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdkIsQ0FBQztRQUVNLFVBQVUsQ0FBQyxFQUFnQjtZQUNqQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FB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