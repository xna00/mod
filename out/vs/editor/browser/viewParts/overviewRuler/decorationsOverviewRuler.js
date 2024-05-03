/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/common/color", "vs/editor/browser/view/viewPart", "vs/editor/common/core/position", "vs/editor/common/languages", "vs/editor/common/core/editorColorRegistry", "vs/editor/common/viewModel", "vs/base/common/arrays"], function (require, exports, fastDomNode_1, color_1, viewPart_1, position_1, languages_1, editorColorRegistry_1, viewModel_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecorationsOverviewRuler = void 0;
    class Settings {
        constructor(config, theme) {
            const options = config.options;
            this.lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this.pixelRatio = options.get(143 /* EditorOption.pixelRatio */);
            this.overviewRulerLanes = options.get(83 /* EditorOption.overviewRulerLanes */);
            this.renderBorder = options.get(82 /* EditorOption.overviewRulerBorder */);
            const borderColor = theme.getColor(editorColorRegistry_1.editorOverviewRulerBorder);
            this.borderColor = borderColor ? borderColor.toString() : null;
            this.hideCursor = options.get(59 /* EditorOption.hideCursorInOverviewRuler */);
            const cursorColorSingle = theme.getColor(editorColorRegistry_1.editorCursorForeground);
            this.cursorColorSingle = cursorColorSingle ? cursorColorSingle.transparent(0.7).toString() : null;
            const cursorColorPrimary = theme.getColor(editorColorRegistry_1.editorMultiCursorPrimaryForeground);
            this.cursorColorPrimary = cursorColorPrimary ? cursorColorPrimary.transparent(0.7).toString() : null;
            const cursorColorSecondary = theme.getColor(editorColorRegistry_1.editorMultiCursorSecondaryForeground);
            this.cursorColorSecondary = cursorColorSecondary ? cursorColorSecondary.transparent(0.7).toString() : null;
            this.themeType = theme.type;
            const minimapOpts = options.get(73 /* EditorOption.minimap */);
            const minimapEnabled = minimapOpts.enabled;
            const minimapSide = minimapOpts.side;
            const themeColor = theme.getColor(editorColorRegistry_1.editorOverviewRulerBackground);
            const defaultBackground = languages_1.TokenizationRegistry.getDefaultBackground();
            if (themeColor) {
                this.backgroundColor = themeColor;
            }
            else if (minimapEnabled && minimapSide === 'right') {
                this.backgroundColor = defaultBackground;
            }
            else {
                this.backgroundColor = null;
            }
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const position = layoutInfo.overviewRuler;
            this.top = position.top;
            this.right = position.right;
            this.domWidth = position.width;
            this.domHeight = position.height;
            if (this.overviewRulerLanes === 0) {
                // overview ruler is off
                this.canvasWidth = 0;
                this.canvasHeight = 0;
            }
            else {
                this.canvasWidth = (this.domWidth * this.pixelRatio) | 0;
                this.canvasHeight = (this.domHeight * this.pixelRatio) | 0;
            }
            const [x, w] = this._initLanes(1, this.canvasWidth, this.overviewRulerLanes);
            this.x = x;
            this.w = w;
        }
        _initLanes(canvasLeftOffset, canvasWidth, laneCount) {
            const remainingWidth = canvasWidth - canvasLeftOffset;
            if (laneCount >= 3) {
                const leftWidth = Math.floor(remainingWidth / 3);
                const rightWidth = Math.floor(remainingWidth / 3);
                const centerWidth = remainingWidth - leftWidth - rightWidth;
                const leftOffset = canvasLeftOffset;
                const centerOffset = leftOffset + leftWidth;
                const rightOffset = leftOffset + leftWidth + centerWidth;
                return [
                    [
                        0,
                        leftOffset, // Left
                        centerOffset, // Center
                        leftOffset, // Left | Center
                        rightOffset, // Right
                        leftOffset, // Left | Right
                        centerOffset, // Center | Right
                        leftOffset, // Left | Center | Right
                    ], [
                        0,
                        leftWidth, // Left
                        centerWidth, // Center
                        leftWidth + centerWidth, // Left | Center
                        rightWidth, // Right
                        leftWidth + centerWidth + rightWidth, // Left | Right
                        centerWidth + rightWidth, // Center | Right
                        leftWidth + centerWidth + rightWidth, // Left | Center | Right
                    ]
                ];
            }
            else if (laneCount === 2) {
                const leftWidth = Math.floor(remainingWidth / 2);
                const rightWidth = remainingWidth - leftWidth;
                const leftOffset = canvasLeftOffset;
                const rightOffset = leftOffset + leftWidth;
                return [
                    [
                        0,
                        leftOffset, // Left
                        leftOffset, // Center
                        leftOffset, // Left | Center
                        rightOffset, // Right
                        leftOffset, // Left | Right
                        leftOffset, // Center | Right
                        leftOffset, // Left | Center | Right
                    ], [
                        0,
                        leftWidth, // Left
                        leftWidth, // Center
                        leftWidth, // Left | Center
                        rightWidth, // Right
                        leftWidth + rightWidth, // Left | Right
                        leftWidth + rightWidth, // Center | Right
                        leftWidth + rightWidth, // Left | Center | Right
                    ]
                ];
            }
            else {
                const offset = canvasLeftOffset;
                const width = remainingWidth;
                return [
                    [
                        0,
                        offset, // Left
                        offset, // Center
                        offset, // Left | Center
                        offset, // Right
                        offset, // Left | Right
                        offset, // Center | Right
                        offset, // Left | Center | Right
                    ], [
                        0,
                        width, // Left
                        width, // Center
                        width, // Left | Center
                        width, // Right
                        width, // Left | Right
                        width, // Center | Right
                        width, // Left | Center | Right
                    ]
                ];
            }
        }
        equals(other) {
            return (this.lineHeight === other.lineHeight
                && this.pixelRatio === other.pixelRatio
                && this.overviewRulerLanes === other.overviewRulerLanes
                && this.renderBorder === other.renderBorder
                && this.borderColor === other.borderColor
                && this.hideCursor === other.hideCursor
                && this.cursorColorSingle === other.cursorColorSingle
                && this.cursorColorPrimary === other.cursorColorPrimary
                && this.cursorColorSecondary === other.cursorColorSecondary
                && this.themeType === other.themeType
                && color_1.Color.equals(this.backgroundColor, other.backgroundColor)
                && this.top === other.top
                && this.right === other.right
                && this.domWidth === other.domWidth
                && this.domHeight === other.domHeight
                && this.canvasWidth === other.canvasWidth
                && this.canvasHeight === other.canvasHeight);
        }
    }
    var Constants;
    (function (Constants) {
        Constants[Constants["MIN_DECORATION_HEIGHT"] = 6] = "MIN_DECORATION_HEIGHT";
    })(Constants || (Constants = {}));
    var OverviewRulerLane;
    (function (OverviewRulerLane) {
        OverviewRulerLane[OverviewRulerLane["Left"] = 1] = "Left";
        OverviewRulerLane[OverviewRulerLane["Center"] = 2] = "Center";
        OverviewRulerLane[OverviewRulerLane["Right"] = 4] = "Right";
        OverviewRulerLane[OverviewRulerLane["Full"] = 7] = "Full";
    })(OverviewRulerLane || (OverviewRulerLane = {}));
    var ShouldRenderValue;
    (function (ShouldRenderValue) {
        ShouldRenderValue[ShouldRenderValue["NotNeeded"] = 0] = "NotNeeded";
        ShouldRenderValue[ShouldRenderValue["Maybe"] = 1] = "Maybe";
        ShouldRenderValue[ShouldRenderValue["Needed"] = 2] = "Needed";
    })(ShouldRenderValue || (ShouldRenderValue = {}));
    class DecorationsOverviewRuler extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._actualShouldRender = 0 /* ShouldRenderValue.NotNeeded */;
            this._renderedDecorations = [];
            this._renderedCursorPositions = [];
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('canvas'));
            this._domNode.setClassName('decorationsOverviewRuler');
            this._domNode.setPosition('absolute');
            this._domNode.setLayerHinting(true);
            this._domNode.setContain('strict');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._updateSettings(false);
            this._tokensColorTrackerListener = languages_1.TokenizationRegistry.onDidChange((e) => {
                if (e.changedColorMap) {
                    this._updateSettings(true);
                }
            });
            this._cursorPositions = [{ position: new position_1.Position(1, 1), color: this._settings.cursorColorSingle }];
        }
        dispose() {
            super.dispose();
            this._tokensColorTrackerListener.dispose();
        }
        _updateSettings(renderNow) {
            const newSettings = new Settings(this._context.configuration, this._context.theme);
            if (this._settings && this._settings.equals(newSettings)) {
                // nothing to do
                return false;
            }
            this._settings = newSettings;
            this._domNode.setTop(this._settings.top);
            this._domNode.setRight(this._settings.right);
            this._domNode.setWidth(this._settings.domWidth);
            this._domNode.setHeight(this._settings.domHeight);
            this._domNode.domNode.width = this._settings.canvasWidth;
            this._domNode.domNode.height = this._settings.canvasHeight;
            if (renderNow) {
                this._render();
            }
            return true;
        }
        // ---- begin view event handlers
        _markRenderingIsNeeded() {
            this._actualShouldRender = 2 /* ShouldRenderValue.Needed */;
            return true;
        }
        _markRenderingIsMaybeNeeded() {
            this._actualShouldRender = 1 /* ShouldRenderValue.Maybe */;
            return true;
        }
        onConfigurationChanged(e) {
            return this._updateSettings(false) ? this._markRenderingIsNeeded() : false;
        }
        onCursorStateChanged(e) {
            this._cursorPositions = [];
            for (let i = 0, len = e.selections.length; i < len; i++) {
                let color = this._settings.cursorColorSingle;
                if (len > 1) {
                    color = i === 0 ? this._settings.cursorColorPrimary : this._settings.cursorColorSecondary;
                }
                this._cursorPositions.push({ position: e.selections[i].getPosition(), color });
            }
            this._cursorPositions.sort((a, b) => position_1.Position.compare(a.position, b.position));
            return this._markRenderingIsMaybeNeeded();
        }
        onDecorationsChanged(e) {
            if (e.affectsOverviewRuler) {
                return this._markRenderingIsMaybeNeeded();
            }
            return false;
        }
        onFlushed(e) {
            return this._markRenderingIsNeeded();
        }
        onScrollChanged(e) {
            return e.scrollHeightChanged ? this._markRenderingIsNeeded() : false;
        }
        onZonesChanged(e) {
            return this._markRenderingIsNeeded();
        }
        onThemeChanged(e) {
            return this._updateSettings(false) ? this._markRenderingIsNeeded() : false;
        }
        // ---- end view event handlers
        getDomNode() {
            return this._domNode.domNode;
        }
        prepareRender(ctx) {
            // Nothing to read
        }
        render(editorCtx) {
            this._render();
            this._actualShouldRender = 0 /* ShouldRenderValue.NotNeeded */;
        }
        _render() {
            const backgroundColor = this._settings.backgroundColor;
            if (this._settings.overviewRulerLanes === 0) {
                // overview ruler is off
                this._domNode.setBackgroundColor(backgroundColor ? color_1.Color.Format.CSS.formatHexA(backgroundColor) : '');
                this._domNode.setDisplay('none');
                return;
            }
            const decorations = this._context.viewModel.getAllOverviewRulerDecorations(this._context.theme);
            decorations.sort(viewModel_1.OverviewRulerDecorationsGroup.compareByRenderingProps);
            if (this._actualShouldRender === 1 /* ShouldRenderValue.Maybe */ && !viewModel_1.OverviewRulerDecorationsGroup.equalsArr(this._renderedDecorations, decorations)) {
                this._actualShouldRender = 2 /* ShouldRenderValue.Needed */;
            }
            if (this._actualShouldRender === 1 /* ShouldRenderValue.Maybe */ && !(0, arrays_1.equals)(this._renderedCursorPositions, this._cursorPositions, (a, b) => a.position.lineNumber === b.position.lineNumber && a.color === b.color)) {
                this._actualShouldRender = 2 /* ShouldRenderValue.Needed */;
            }
            if (this._actualShouldRender === 1 /* ShouldRenderValue.Maybe */) {
                // both decorations and cursor positions are unchanged, nothing to do
                return;
            }
            this._renderedDecorations = decorations;
            this._renderedCursorPositions = this._cursorPositions;
            this._domNode.setDisplay('block');
            const canvasWidth = this._settings.canvasWidth;
            const canvasHeight = this._settings.canvasHeight;
            const lineHeight = this._settings.lineHeight;
            const viewLayout = this._context.viewLayout;
            const outerHeight = this._context.viewLayout.getScrollHeight();
            const heightRatio = canvasHeight / outerHeight;
            const minDecorationHeight = (6 /* Constants.MIN_DECORATION_HEIGHT */ * this._settings.pixelRatio) | 0;
            const halfMinDecorationHeight = (minDecorationHeight / 2) | 0;
            const canvasCtx = this._domNode.domNode.getContext('2d');
            if (backgroundColor) {
                if (backgroundColor.isOpaque()) {
                    // We have a background color which is opaque, we can just paint the entire surface with it
                    canvasCtx.fillStyle = color_1.Color.Format.CSS.formatHexA(backgroundColor);
                    canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
                }
                else {
                    // We have a background color which is transparent, we need to first clear the surface and
                    // then fill it
                    canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                    canvasCtx.fillStyle = color_1.Color.Format.CSS.formatHexA(backgroundColor);
                    canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
                }
            }
            else {
                // We don't have a background color
                canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
            }
            const x = this._settings.x;
            const w = this._settings.w;
            for (const decorationGroup of decorations) {
                const color = decorationGroup.color;
                const decorationGroupData = decorationGroup.data;
                canvasCtx.fillStyle = color;
                let prevLane = 0;
                let prevY1 = 0;
                let prevY2 = 0;
                for (let i = 0, len = decorationGroupData.length / 3; i < len; i++) {
                    const lane = decorationGroupData[3 * i];
                    const startLineNumber = decorationGroupData[3 * i + 1];
                    const endLineNumber = decorationGroupData[3 * i + 2];
                    let y1 = (viewLayout.getVerticalOffsetForLineNumber(startLineNumber) * heightRatio) | 0;
                    let y2 = ((viewLayout.getVerticalOffsetForLineNumber(endLineNumber) + lineHeight) * heightRatio) | 0;
                    const height = y2 - y1;
                    if (height < minDecorationHeight) {
                        let yCenter = ((y1 + y2) / 2) | 0;
                        if (yCenter < halfMinDecorationHeight) {
                            yCenter = halfMinDecorationHeight;
                        }
                        else if (yCenter + halfMinDecorationHeight > canvasHeight) {
                            yCenter = canvasHeight - halfMinDecorationHeight;
                        }
                        y1 = yCenter - halfMinDecorationHeight;
                        y2 = yCenter + halfMinDecorationHeight;
                    }
                    if (y1 > prevY2 + 1 || lane !== prevLane) {
                        // flush prev
                        if (i !== 0) {
                            canvasCtx.fillRect(x[prevLane], prevY1, w[prevLane], prevY2 - prevY1);
                        }
                        prevLane = lane;
                        prevY1 = y1;
                        prevY2 = y2;
                    }
                    else {
                        // merge into prev
                        if (y2 > prevY2) {
                            prevY2 = y2;
                        }
                    }
                }
                canvasCtx.fillRect(x[prevLane], prevY1, w[prevLane], prevY2 - prevY1);
            }
            // Draw cursors
            if (!this._settings.hideCursor) {
                const cursorHeight = (2 * this._settings.pixelRatio) | 0;
                const halfCursorHeight = (cursorHeight / 2) | 0;
                const cursorX = this._settings.x[7 /* OverviewRulerLane.Full */];
                const cursorW = this._settings.w[7 /* OverviewRulerLane.Full */];
                let prevY1 = -100;
                let prevY2 = -100;
                let prevColor = null;
                for (let i = 0, len = this._cursorPositions.length; i < len; i++) {
                    const color = this._cursorPositions[i].color;
                    if (!color) {
                        continue;
                    }
                    const cursor = this._cursorPositions[i].position;
                    let yCenter = (viewLayout.getVerticalOffsetForLineNumber(cursor.lineNumber) * heightRatio) | 0;
                    if (yCenter < halfCursorHeight) {
                        yCenter = halfCursorHeight;
                    }
                    else if (yCenter + halfCursorHeight > canvasHeight) {
                        yCenter = canvasHeight - halfCursorHeight;
                    }
                    const y1 = yCenter - halfCursorHeight;
                    const y2 = y1 + cursorHeight;
                    if (y1 > prevY2 + 1 || color !== prevColor) {
                        // flush prev
                        if (i !== 0 && prevColor) {
                            canvasCtx.fillRect(cursorX, prevY1, cursorW, prevY2 - prevY1);
                        }
                        prevY1 = y1;
                        prevY2 = y2;
                    }
                    else {
                        // merge into prev
                        if (y2 > prevY2) {
                            prevY2 = y2;
                        }
                    }
                    prevColor = color;
                    canvasCtx.fillStyle = color;
                }
                if (prevColor) {
                    canvasCtx.fillRect(cursorX, prevY1, cursorW, prevY2 - prevY1);
                }
            }
            if (this._settings.renderBorder && this._settings.borderColor && this._settings.overviewRulerLanes > 0) {
                canvasCtx.beginPath();
                canvasCtx.lineWidth = 1;
                canvasCtx.strokeStyle = this._settings.borderColor;
                canvasCtx.moveTo(0, 0);
                canvasCtx.lineTo(0, canvasHeight);
                canvasCtx.stroke();
                canvasCtx.moveTo(0, 0);
                canvasCtx.lineTo(canvasWidth, 0);
                canvasCtx.stroke();
            }
        }
    }
    exports.DecorationsOverviewRuler = DecorationsOverviewRuler;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvbnNPdmVydmlld1J1bGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvb3ZlcnZpZXdSdWxlci9kZWNvcmF0aW9uc092ZXJ2aWV3UnVsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxNQUFNLFFBQVE7UUEyQmIsWUFBWSxNQUE0QixFQUFFLEtBQWtCO1lBQzNELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDL0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxrQ0FBeUIsQ0FBQztZQUN2RCxJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDO1lBQ3ZELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxPQUFPLENBQUMsR0FBRywwQ0FBaUMsQ0FBQztZQUV2RSxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLDJDQUFrQyxDQUFDO1lBQ2xFLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsK0NBQXlCLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFFL0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxpREFBd0MsQ0FBQztZQUN0RSxNQUFNLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsNENBQXNCLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFR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