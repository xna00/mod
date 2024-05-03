/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/sash/sash", "vs/base/common/color", "vs/base/common/idGenerator", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/css!./zoneWidget"], function (require, exports, dom, sash_1, color_1, idGenerator_1, lifecycle_1, objects, range_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ZoneWidget = exports.OverlayWidgetDelegate = void 0;
    const defaultColor = new color_1.Color(new color_1.RGBA(0, 122, 204));
    const defaultOptions = {
        showArrow: true,
        showFrame: true,
        className: '',
        frameColor: defaultColor,
        arrowColor: defaultColor,
        keepEditorSelection: false
    };
    const WIDGET_ID = 'vs.editor.contrib.zoneWidget';
    class ViewZoneDelegate {
        constructor(domNode, afterLineNumber, afterColumn, heightInLines, onDomNodeTop, onComputedHeight, showInHiddenAreas, ordinal) {
            this.id = ''; // A valid zone id should be greater than 0
            this.domNode = domNode;
            this.afterLineNumber = afterLineNumber;
            this.afterColumn = afterColumn;
            this.heightInLines = heightInLines;
            this.showInHiddenAreas = showInHiddenAreas;
            this.ordinal = ordinal;
            this._onDomNodeTop = onDomNodeTop;
            this._onComputedHeight = onComputedHeight;
        }
        onDomNodeTop(top) {
            this._onDomNodeTop(top);
        }
        onComputedHeight(height) {
            this._onComputedHeight(height);
        }
    }
    class OverlayWidgetDelegate {
        constructor(id, domNode) {
            this._id = id;
            this._domNode = domNode;
        }
        getId() {
            return this._id;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return null;
        }
    }
    exports.OverlayWidgetDelegate = OverlayWidgetDelegate;
    class Arrow {
        static { this._IdGenerator = new idGenerator_1.IdGenerator('.arrow-decoration-'); }
        constructor(_editor) {
            this._editor = _editor;
            this._ruleName = Arrow._IdGenerator.nextId();
            this._decorations = this._editor.createDecorationsCollection();
            this._color = null;
            this._height = -1;
        }
        dispose() {
            this.hide();
            dom.removeCSSRulesContainingSelector(this._ruleName);
        }
        set color(value) {
            if (this._color !== value) {
                this._color = value;
                this._updateStyle();
            }
        }
        set height(value) {
            if (this._height !== value) {
                this._height = value;
                this._updateStyle();
            }
        }
        _updateStyle() {
            dom.removeCSSRulesContainingSelector(this._ruleName);
            dom.createCSSRule(`.monaco-editor ${this._ruleName}`, `border-style: solid; border-color: transparent; border-bottom-color: ${this._color}; border-width: ${this._height}px; bottom: -${this._height}px !important; margin-left: -${this._height}px; `);
        }
        show(where) {
            if (where.column === 1) {
                // the arrow isn't pretty at column 1 and we need to push it out a little
                where = { lineNumber: where.lineNumber, column: 2 };
            }
            this._decorations.set([{
                    range: range_1.Range.fromPositions(where),
                    options: {
                        description: 'zone-widget-arrow',
                        className: this._ruleName,
                        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */
                    }
                }]);
        }
        hide() {
            this._decorations.clear();
        }
    }
    class ZoneWidget {
        constructor(editor, options = {}) {
            this._arrow = null;
            this._overlayWidget = null;
            this._resizeSash = null;
            this._viewZone = null;
            this._disposables = new lifecycle_1.DisposableStore();
            this.container = null;
            this._isShowing = false;
            this.editor = editor;
            this._positionMarkerId = this.editor.createDecorationsCollection();
            this.options = objects.deepClone(options);
            objects.mixin(this.options, defaultOptions, false);
            this.domNode = document.createElement('div');
            if (!this.options.isAccessible) {
                this.domNode.setAttribute('aria-hidden', 'true');
                this.domNode.setAttribute('role', 'presentation');
            }
            this._disposables.add(this.editor.onDidLayoutChange((info) => {
                const width = this._getWidth(info);
                this.domNode.style.width = width + 'px';
                this.domNode.style.left = this._getLeft(info) + 'px';
                this._onWidth(width);
            }));
        }
        dispose() {
            if (this._overlayWidget) {
                this.editor.removeOverlayWidget(this._overlayWidget);
                this._overlayWidget = null;
            }
            if (this._viewZone) {
                this.editor.changeViewZones(accessor => {
                    if (this._viewZone) {
                        accessor.removeZone(this._viewZone.id);
                    }
                    this._viewZone = null;
                });
            }
            this._positionMarkerId.clear();
            this._disposables.dispose();
        }
        create() {
            this.domNode.classList.add('zone-widget');
            if (this.options.className) {
                this.domNode.classList.add(this.options.className);
            }
            this.container = document.createElement('div');
            this.container.classList.add('zone-widget-container');
            this.domNode.appendChild(this.container);
            if (this.options.showArrow) {
                this._arrow = new Arrow(this.editor);
                this._disposables.add(this._arrow);
            }
            this._fillContainer(this.container);
            this._initSash();
            this._applyStyles();
        }
        style(styles) {
            if (styles.frameColor) {
                this.options.frameColor = styles.frameColor;
            }
            if (styles.arrowColor) {
                this.options.arrowColor = styles.arrowColor;
            }
            this._applyStyles();
        }
        _applyStyles() {
            if (this.container && this.options.frameColor) {
                const frameColor = this.options.frameColor.toString();
                this.container.style.borderTopColor = frameColor;
                this.container.style.borderBottomColor = frameColor;
            }
            if (this._arrow && this.options.arrowColor) {
                const arrowColor = this.options.arrowColor.toString();
                this._arrow.color = arrowColor;
            }
        }
        _getWidth(info) {
            return info.width - info.minimap.minimapWidth - info.verticalScrollbarWidth;
        }
        _getLeft(info) {
            // If minimap is to the left, we move beyond it
            if (info.minimap.minimapWidth > 0 && info.minimap.minimapLeft === 0) {
                return info.minimap.minimapWidth;
            }
            return 0;
        }
        _onViewZoneTop(top) {
            this.domNode.style.top = top + 'px';
        }
        _onViewZoneHeight(height) {
            this.domNode.style.height = `${height}px`;
            if (this.container) {
                const containerHeight = height - this._decoratingElementsHeight();
                this.container.style.height = `${containerHeight}px`;
                const layoutInfo = this.editor.getLayoutInfo();
                this._doLayout(containerHeight, this._getWidth(layoutInfo));
            }
            this._resizeSash?.layout();
        }
        get position() {
            const range = this._positionMarkerId.getRange(0);
            if (!range) {
                return undefined;
            }
            return range.getStartPosition();
        }
        hasFocus() {
            return this.domNode.contains(dom.getActiveElement());
        }
        show(rangeOrPos, heightInLines) {
            const range = range_1.Range.isIRange(rangeOrPos) ? range_1.Range.lift(rangeOrPos) : range_1.Range.fromPositions(rangeOrPos);
            this._isShowing = true;
            this._showImpl(range, heightInLines);
            this._isShowing = false;
            this._positionMarkerId.set([{ range, options: textModel_1.ModelDecorationOptions.EMPTY }]);
        }
        updatePositionAndHeight(rangeOrPos, heightInLines) {
            if (this._viewZone) {
                rangeOrPos = range_1.Range.isIRange(rangeOrPos) ? range_1.Range.getStartPosition(rangeOrPos) : rangeOrPos;
                this._viewZone.afterLineNumber = rangeOrPos.lineNumber;
                this._viewZone.afterColumn = rangeOrPos.column;
                this._viewZone.heightInLines = heightInLines ?? this._viewZone.heightInLines;
                this.editor.changeViewZones(accessor => {
                    accessor.layoutZone(this._viewZone.id);
                });
                this._positionMarkerId.set([{
                        range: range_1.Range.isIRange(rangeOrPos) ? rangeOrPos : range_1.Range.fromPositions(rangeOrPos),
                        options: textModel_1.ModelDecorationOptions.EMPTY
                    }]);
            }
        }
        hide() {
            if (this._viewZone) {
                this.editor.changeViewZones(accessor => {
                    if (this._viewZone) {
                        accessor.removeZone(this._viewZone.id);
                    }
                });
                this._viewZone = null;
            }
            if (this._overlayWidget) {
                this.editor.removeOverlayWidget(this._overlayWidget);
                this._overlayWidget = null;
            }
            this._arrow?.hide();
            this._positionMarkerId.clear();
        }
        _decoratingElementsHeight() {
            const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
            let result = 0;
            if (this.options.showArrow) {
                const arrowHeight = Math.round(lineHeight / 3);
                result += 2 * arrowHeight;
            }
            if (this.options.showFrame) {
                const frameThickness = Math.round(lineHeight / 9);
                result += 2 * frameThickness;
            }
            return result;
        }
        _showImpl(where, heightInLines) {
            const position = where.getStartPosition();
            const layoutInfo = this.editor.getLayoutInfo();
            const width = this._getWidth(layoutInfo);
            this.domNode.style.width = `${width}px`;
            this.domNode.style.left = this._getLeft(layoutInfo) + 'px';
            // Render the widget as zone (rendering) and widget (lifecycle)
            const viewZoneDomNode = document.createElement('div');
            viewZoneDomNode.style.overflow = 'hidden';
            const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
            // adjust heightInLines to viewport
            if (!this.options.allowUnlimitedHeight) {
                const maxHeightInLines = Math.max(12, (this.editor.getLayoutInfo().height / lineHeight) * 0.8);
                heightInLines = Math.min(heightInLines, maxHeightInLines);
            }
            let arrowHeight = 0;
            let frameThickness = 0;
            // Render the arrow one 1/3 of an editor line height
            if (this._arrow && this.options.showArrow) {
                arrowHeight = Math.round(lineHeight / 3);
                this._arrow.height = arrowHeight;
                this._arrow.show(position);
            }
            // Render the frame as 1/9 of an editor line height
            if (this.options.showFrame) {
                frameThickness = Math.round(lineHeight / 9);
            }
            // insert zone widget
            this.editor.changeViewZones((accessor) => {
                if (this._viewZone) {
                    accessor.removeZone(this._viewZone.id);
                }
                if (this._overlayWidget) {
                    this.editor.removeOverlayWidget(this._overlayWidget);
                    this._overlayWidget = null;
                }
                this.domNode.style.top = '-1000px';
                this._viewZone = new ViewZoneDelegate(viewZoneDomNode, position.lineNumber, position.column, heightInLines, (top) => this._onViewZoneTop(top), (height) => this._onViewZoneHeight(height), this.options.showInHiddenAreas, this.options.ordinal);
                this._viewZone.id = accessor.addZone(this._viewZone);
                this._overlayWidget = new OverlayWidgetDelegate(WIDGET_ID + this._viewZone.id, this.domNode);
                this.editor.addOverlayWidget(this._overlayWidget);
            });
            if (this.container && this.options.showFrame) {
                const width = this.options.frameWidth ? this.options.frameWidth : frameThickness;
                this.container.style.borderTopWidth = width + 'px';
                this.container.style.borderBottomWidth = width + 'px';
            }
            const containerHeight = heightInLines * lineHeight - this._decoratingElementsHeight();
            if (this.container) {
                this.container.style.top = arrowHeight + 'px';
                this.container.style.height = containerHeight + 'px';
                this.container.style.overflow = 'hidden';
            }
            this._doLayout(containerHeight, width);
            if (!this.options.keepEditorSelection) {
                this.editor.setSelection(where);
            }
            const model = this.editor.getModel();
            if (model) {
                const range = model.validateRange(new range_1.Range(where.startLineNumber, 1, where.endLineNumber + 1, 1));
                this.revealRange(range, range.startLineNumber === model.getLineCount());
            }
        }
        revealRange(range, isLastLine) {
            if (isLastLine) {
                this.editor.revealLineNearTop(range.endLineNumber, 0 /* ScrollType.Smooth */);
            }
            else {
                this.editor.revealRange(range, 0 /* ScrollType.Smooth */);
            }
        }
        setCssClass(className, classToReplace) {
            if (!this.container) {
                return;
            }
            if (classToReplace) {
                this.container.classList.remove(classToReplace);
            }
            this.container.classList.add(className);
        }
        _onWidth(widthInPixel) {
            // implement in subclass
        }
        _doLayout(heightInPixel, widthInPixel) {
            // implement in subclass
        }
        _relayout(newHeightInLines) {
            if (this._viewZone && this._viewZone.heightInLines !== newHeightInLines) {
                this.editor.changeViewZones(accessor => {
                    if (this._viewZone) {
                        this._viewZone.heightInLines = newHeightInLines;
                        accessor.layoutZone(this._viewZone.id);
                    }
                });
            }
        }
        // --- sash
        _initSash() {
            if (this._resizeSash) {
                return;
            }
            this._resizeSash = this._disposables.add(new sash_1.Sash(this.domNode, this, { orientation: 1 /* Orientation.HORIZONTAL */ }));
            if (!this.options.isResizeable) {
                this._resizeSash.state = 0 /* SashState.Disabled */;
            }
            let data;
            this._disposables.add(this._resizeSash.onDidStart((e) => {
                if (this._viewZone) {
                    data = {
                        startY: e.startY,
                        heightInLines: this._viewZone.heightInLines,
                    };
                }
            }));
            this._disposables.add(this._resizeSash.onDidEnd(() => {
                data = undefined;
            }));
            this._disposables.add(this._resizeSash.onDidChange((evt) => {
                if (data) {
                    const lineDelta = (evt.currentY - data.startY) / this.editor.getOption(67 /* EditorOption.lineHeight */);
                    const roundedLineDelta = lineDelta < 0 ? Math.ceil(lineDelta) : Math.floor(lineDelta);
                    const newHeightInLines = data.heightInLines + roundedLineDelta;
                    if (newHeightInLines > 5 && newHeightInLines < 35) {
                        this._relayout(newHeightInLines);
                    }
                }
            }));
        }
        getHorizontalSashLeft() {
            return 0;
        }
        getHorizontalSashTop() {
            return (this.domNode.style.height === null ? 0 : parseInt(this.domNode.style.height)) - (this._decoratingElementsHeight() / 2);
        }
        getHorizontalSashWidth() {
            const layoutInfo = this.editor.getLayoutInfo();
            return layoutInfo.width - layoutInfo.minimap.minimapWidth;
        }
    }
    exports.ZoneWidget = ZoneWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZVdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvem9uZVdpZGdldC9icm93c2VyL3pvbmVXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUNoRyxNQUFNLFlBQVksR0FBRyxJQUFJLGFBQUssQ0FBQyxJQUFJLFlBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFdEQsTUFBTSxjQUFjLEdBQWE7UUFDaEMsU0FBUyxFQUFFLElBQUk7UUFDZixTQUFTLEVBQUUsSUFBSTtRQUNmLFNBQVMsRUFBRSxFQUFFO1FBQ2IsVUFBVSxFQUFFLFlBQVk7UUFDeEIsVUFBVSxFQUFFLFlBQVk7UUFDeEIsbUJBQW1CLEVBQUUsS0FBSztLQUMxQixDQUFDO0lBRUYsTUFBTSxTQUFTLEdBQUcsOEJBQThCLENBQUM7SUFFakQsTUFBTSxnQkFBZ0I7UUFhckIsWUFBWSxPQUFvQixFQUFFLGVBQXVCLEVBQUUsV0FBbUIsRUFBRSxhQUFxQixFQUNwRyxZQUFtQyxFQUNuQyxnQkFBMEMsRUFDMUMsaUJBQXNDLEVBQ3RDLE9BQTJCO1lBZDVCLE9BQUUsR0FBVyxFQUFFLENBQUMsQ0FBQywyQ0FBMkM7WUFnQjNELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQy9CLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBQ25DLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztZQUMzQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLFlB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