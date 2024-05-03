/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range"], function (require, exports, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewportData = void 0;
    /**
     * Contains all data needed to render at a specific viewport.
     */
    class ViewportData {
        constructor(selections, partialData, whitespaceViewportData, model) {
            this.selections = selections;
            this.startLineNumber = partialData.startLineNumber | 0;
            this.endLineNumber = partialData.endLineNumber | 0;
            this.relativeVerticalOffset = partialData.relativeVerticalOffset;
            this.bigNumbersDelta = partialData.bigNumbersDelta | 0;
            this.lineHeight = partialData.lineHeight | 0;
            this.whitespaceViewportData = whitespaceViewportData;
            this._model = model;
            this.visibleRange = new range_1.Range(partialData.startLineNumber, this._model.getLineMinColumn(partialData.startLineNumber), partialData.endLineNumber, this._model.getLineMaxColumn(partialData.endLineNumber));
        }
        getViewLineRenderingData(lineNumber) {
            return this._model.getViewportViewLineRenderingData(this.visibleRange, lineNumber);
        }
        getDecorationsInViewport() {
            return this._model.getDecorationsInViewport(this.visibleRange);
        }
    }
    exports.ViewportData = ViewportData;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xpbmVzVmlld3BvcnREYXRhLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3ZpZXdMYXlvdXQvdmlld0xpbmVzVmlld3BvcnREYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRzs7T0FFRztJQUNILE1BQWEsWUFBWTtRQXNDeEIsWUFDQyxVQUF1QixFQUN2QixXQUEwQyxFQUMxQyxzQkFBcUQsRUFDckQsS0FBaUI7WUFFakIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDN0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsYUFBYSxHQUFHLFdBQVcsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxXQUFXLENBQUMsc0JBQXNCLENBQUM7WUFDakUsSUFBSSxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxzQkFBc0IsQ0FBQztZQUVyRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUVwQixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksYUFBSyxDQUM1QixXQUFXLENBQUMsZUFBZSxFQUMzQixJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsRUFDekQsV0FBVyxDQUFDLGFBQWEsRUFDekIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQ3ZELENBQUM7UUFDSCxDQUFDO1FBRU0sd0JBQXdCLENBQUMsVUFBa0I7WUFDakQsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUVNLHdCQUF3QjtZQUM5QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2hFLENBQUM7S0FDRDtJQXJFRCxvQ0FxRUMifQ==