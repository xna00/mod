/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/pixelRatio", "vs/base/common/color", "vs/base/common/lifecycle", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, DOM, fastDomNode_1, pixelRatio_1, color_1, lifecycle_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookDiffOverviewRuler = void 0;
    const MINIMUM_SLIDER_SIZE = 20;
    let NotebookDiffOverviewRuler = class NotebookDiffOverviewRuler extends themeService_1.Themable {
        constructor(notebookEditor, width, container, themeService) {
            super(themeService);
            this.notebookEditor = notebookEditor;
            this.width = width;
            this._diffElementViewModels = [];
            this._lanes = 2;
            this._insertColor = null;
            this._removeColor = null;
            this._insertColorHex = null;
            this._removeColorHex = null;
            this._disposables = this._register(new lifecycle_1.DisposableStore());
            this._renderAnimationFrame = null;
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('canvas'));
            this._domNode.setPosition('relative');
            this._domNode.setLayerHinting(true);
            this._domNode.setContain('strict');
            container.appendChild(this._domNode.domNode);
            this._overviewViewportDomElement = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._overviewViewportDomElement.setClassName('diffViewport');
            this._overviewViewportDomElement.setPosition('absolute');
            this._overviewViewportDomElement.setWidth(width);
            container.appendChild(this._overviewViewportDomElement.domNode);
            this._register(pixelRatio_1.PixelRatio.getInstance(DOM.getWindow(this._domNode.domNode)).onDidChange(() => {
                this._scheduleRender();
            }));
            this._register(this.themeService.onDidColorThemeChange(e => {
                const colorChanged = this.applyColors(e);
                if (colorChanged) {
                    this._scheduleRender();
                }
            }));
            this.applyColors(this.themeService.getColorTheme());
            this._register(this.notebookEditor.onDidScroll(() => {
                this._renderOverviewViewport();
            }));
            this._register(DOM.addStandardDisposableListener(container, DOM.EventType.POINTER_DOWN, (e) => {
                this.notebookEditor.delegateVerticalScrollbarPointerDown(e);
            }));
        }
        applyColors(theme) {
            const newInsertColor = theme.getColor(colorRegistry_1.diffOverviewRulerInserted) || (theme.getColor(colorRegistry_1.diffInserted) || colorRegistry_1.defaultInsertColor).transparent(2);
            const newRemoveColor = theme.getColor(colorRegistry_1.diffOverviewRulerRemoved) || (theme.getColor(colorRegistry_1.diffRemoved) || colorRegistry_1.defaultRemoveColor).transparent(2);
            const hasChanges = !newInsertColor.equals(this._insertColor) || !newRemoveColor.equals(this._removeColor);
            this._insertColor = newInsertColor;
            this._removeColor = newRemoveColor;
            if (this._insertColor) {
                this._insertColorHex = color_1.Color.Format.CSS.formatHexA(this._insertColor);
            }
            if (this._removeColor) {
                this._removeColorHex = color_1.Color.Format.CSS.formatHexA(this._removeColor);
            }
            return hasChanges;
        }
        layout() {
            this._layoutNow();
        }
        updateViewModels(elements, eventDispatcher) {
            this._disposables.clear();
            this._diffElementViewModels = elements;
            if (eventDispatcher) {
                this._disposables.add(eventDispatcher.onDidChangeLayout(() => {
                    this._scheduleRender();
                }));
                this._disposables.add(eventDispatcher.onDidChangeCellLayout(() => {
                    this._scheduleRender();
                }));
            }
            this._scheduleRender();
        }
        _scheduleRender() {
            if (this._renderAnimationFrame === null) {
                this._renderAnimationFrame = DOM.runAtThisOrScheduleAtNextAnimationFrame(DOM.getWindow(this._domNode.domNode), this._onRenderScheduled.bind(this), 16);
            }
        }
        _onRenderScheduled() {
            this._renderAnimationFrame = null;
            this._layoutNow();
        }
        _layoutNow() {
            const layoutInfo = this.notebookEditor.getLayoutInfo();
            const height = layoutInfo.height;
            const contentHeight = this._diffElementViewModels.map(view => view.layoutInfo.totalHeight).reduce((a, b) => a + b, 0);
            const ratio = pixelRatio_1.PixelRatio.getInstance(DOM.getWindow(this._domNode.domNode)).value;
            this._domNode.setWidth(this.width);
            this._domNode.setHeight(height);
            this._domNode.domNode.width = this.width * ratio;
            this._domNode.domNode.height = height * ratio;
            const ctx = this._domNode.domNode.getContext('2d');
            ctx.clearRect(0, 0, this.width * ratio, height * ratio);
            this._renderCanvas(ctx, this.width * ratio, height * ratio, contentHeight * ratio, ratio);
            this._renderOverviewViewport();
        }
        _renderOverviewViewport() {
            const layout = this._computeOverviewViewport();
            if (!layout) {
                this._overviewViewportDomElement.setTop(0);
                this._overviewViewportDomElement.setHeight(0);
            }
            else {
                this._overviewViewportDomElement.setTop(layout.top);
                this._overviewViewportDomElement.setHeight(layout.height);
            }
        }
        _computeOverviewViewport() {
            const layoutInfo = this.notebookEditor.getLayoutInfo();
            if (!layoutInfo) {
                return null;
            }
            const scrollTop = this.notebookEditor.getScrollTop();
            const scrollHeight = this.notebookEditor.getScrollHeight();
            const computedAvailableSize = Math.max(0, layoutInfo.height);
            const computedRepresentableSize = Math.max(0, computedAvailableSize - 2 * 0);
            const visibleSize = layoutInfo.height;
            const computedSliderSize = Math.round(Math.max(MINIMUM_SLIDER_SIZE, Math.floor(visibleSize * computedRepresentableSize / scrollHeight)));
            const computedSliderRatio = (computedRepresentableSize - computedSliderSize) / (scrollHeight - visibleSize);
            const computedSliderPosition = Math.round(scrollTop * computedSliderRatio);
            return {
                height: computedSliderSize,
                top: computedSliderPosition
            };
        }
        _renderCanvas(ctx, width, height, scrollHeight, ratio) {
            if (!this._insertColorHex || !this._removeColorHex) {
                // no op when colors are not yet known
                return;
            }
            const laneWidth = width / this._lanes;
            let currentFrom = 0;
            for (let i = 0; i < this._diffElementViewModels.length; i++) {
                const element = this._diffElementViewModels[i];
                const cellHeight = Math.round((element.layoutInfo.totalHeight / scrollHeight) * ratio * height);
                switch (element.type) {
                    case 'insert':
                        ctx.fillStyle = this._insertColorHex;
                        ctx.fillRect(laneWidth, currentFrom, laneWidth, cellHeight);
                        break;
                    case 'delete':
                        ctx.fillStyle = this._removeColorHex;
                        ctx.fillRect(0, currentFrom, laneWidth, cellHeight);
                        break;
                    case 'unchanged':
                        break;
                    case 'modified':
                        ctx.fillStyle = this._removeColorHex;
                        ctx.fillRect(0, currentFrom, laneWidth, cellHeight);
                        ctx.fillStyle = this._insertColorHex;
                        ctx.fillRect(laneWidth, currentFrom, laneWidth, cellHeight);
                        break;
                }
                currentFrom += cellHeight;
            }
        }
        dispose() {
            if (this._renderAnimationFrame !== null) {
                this._renderAnimationFrame.dispose();
                this._renderAnimationFrame = null;
            }
            super.dispose();
        }
    };
    exports.NotebookDiffOverviewRuler = NotebookDiffOverviewRuler;
    exports.NotebookDiffOverviewRuler = NotebookDiffOverviewRuler = __decorate([
        __param(3, themeService_1.IThemeService)
    ], NotebookDiffOverviewRuler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tEaWZmT3ZlcnZpZXdSdWxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9kaWZmL25vdGVib29rRGlmZk92ZXJ2aWV3UnVsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0lBRXhCLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsdUJBQVE7UUFldEQsWUFBcUIsY0FBdUMsRUFBVyxLQUFhLEVBQUUsU0FBc0IsRUFBaUIsWUFBMkI7WUFDdkosS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBREEsbUJBQWMsR0FBZCxjQUFjLENBQXlCO1lBQVcsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQVg1RSwyQkFBc0IsR0FBK0IsRUFBRSxDQUFDO1lBQ3hELFdBQU0sR0FBRyxDQUFDLENBQUM7WUFZbEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDekIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDekIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFDMUQsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztZQUNsQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUEsK0JBQWlCLEVBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFD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