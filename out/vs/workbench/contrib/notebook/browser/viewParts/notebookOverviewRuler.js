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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/pixelRatio", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/notebookBrowser"], function (require, exports, dom_1, fastDomNode_1, pixelRatio_1, themeService_1, notebookBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookOverviewRuler = void 0;
    let NotebookOverviewRuler = class NotebookOverviewRuler extends themeService_1.Themable {
        constructor(notebookEditor, container, themeService) {
            super(themeService);
            this.notebookEditor = notebookEditor;
            this._lanes = 3;
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('canvas'));
            this._domNode.setPosition('relative');
            this._domNode.setLayerHinting(true);
            this._domNode.setContain('strict');
            container.appendChild(this._domNode.domNode);
            this._register(notebookEditor.onDidChangeDecorations(() => {
                this.layout();
            }));
            this._register(pixelRatio_1.PixelRatio.getInstance((0, dom_1.getWindow)(this._domNode.domNode)).onDidChange(() => {
                this.layout();
            }));
        }
        layout() {
            const width = 10;
            const layoutInfo = this.notebookEditor.getLayoutInfo();
            const scrollHeight = layoutInfo.scrollHeight;
            const height = layoutInfo.height;
            const ratio = pixelRatio_1.PixelRatio.getInstance((0, dom_1.getWindow)(this._domNode.domNode)).value;
            this._domNode.setWidth(width);
            this._domNode.setHeight(height);
            this._domNode.domNode.width = width * ratio;
            this._domNode.domNode.height = height * ratio;
            const ctx = this._domNode.domNode.getContext('2d');
            ctx.clearRect(0, 0, width * ratio, height * ratio);
            this._render(ctx, width * ratio, height * ratio, scrollHeight * ratio, ratio);
        }
        _render(ctx, width, height, scrollHeight, ratio) {
            const viewModel = this.notebookEditor.getViewModel();
            const fontInfo = this.notebookEditor.getLayoutInfo().fontInfo;
            const laneWidth = width / this._lanes;
            let currentFrom = 0;
            if (viewModel) {
                for (let i = 0; i < viewModel.viewCells.length; i++) {
                    const viewCell = viewModel.viewCells[i];
                    const textBuffer = viewCell.textBuffer;
                    const decorations = viewCell.getCellDecorations();
                    const cellHeight = (viewCell.layoutInfo.totalHeight / scrollHeight) * ratio * height;
                    decorations.filter(decoration => decoration.overviewRuler).forEach(decoration => {
                        const overviewRuler = decoration.overviewRuler;
                        const fillStyle = this.getColor(overviewRuler.color) ?? '#000000';
                        const lineHeight = Math.min(fontInfo.lineHeight, (viewCell.layoutInfo.editorHeight / scrollHeight / textBuffer.getLineCount()) * ratio * height);
                        const lineNumbers = overviewRuler.modelRanges.map(range => range.startLineNumber).reduce((previous, current) => {
                            if (previous.length === 0) {
                                previous.push(current);
                            }
                            else {
                                const last = previous[previous.length - 1];
                                if (last !== current) {
                                    previous.push(current);
                                }
                            }
                            return previous;
                        }, []);
                        let x = 0;
                        switch (overviewRuler.position) {
                            case notebookBrowser_1.NotebookOverviewRulerLane.Left:
                                x = 0;
                                break;
                            case notebookBrowser_1.NotebookOverviewRulerLane.Center:
                                x = laneWidth;
                                break;
                            case notebookBrowser_1.NotebookOverviewRulerLane.Right:
                                x = laneWidth * 2;
                                break;
                            default:
                                break;
                        }
                        const width = overviewRuler.position === notebookBrowser_1.NotebookOverviewRulerLane.Full ? laneWidth * 3 : laneWidth;
                        for (let i = 0; i < lineNumbers.length; i++) {
                            ctx.fillStyle = fillStyle;
                            const lineNumber = lineNumbers[i];
                            const offset = (lineNumber - 1) * lineHeight;
                            ctx.fillRect(x, currentFrom + offset, width, lineHeight);
                        }
                        if (overviewRuler.includeOutput) {
                            ctx.fillStyle = fillStyle;
                            const outputOffset = (viewCell.layoutInfo.editorHeight / scrollHeight) * ratio * height;
                            const decorationHeight = (fontInfo.lineHeight / scrollHeight) * ratio * height;
                            ctx.fillRect(laneWidth, currentFrom + outputOffset, laneWidth, decorationHeight);
                        }
                    });
                    currentFrom += cellHeight;
                }
            }
        }
    };
    exports.NotebookOverviewRuler = NotebookOverviewRuler;
    exports.NotebookOverviewRuler = NotebookOverviewRuler = __decorate([
        __param(2, themeService_1.IThemeService)
    ], NotebookOverviewRuler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPdmVydmlld1J1bGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXdQYXJ0cy9ub3RlYm9va092ZXJ2aWV3UnVsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsdUJBQVE7UUFJbEQsWUFBcUIsY0FBdUMsRUFBRSxTQUFzQixFQUFpQixZQUEyQjtZQUMvSCxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFEQSxtQkFBYyxHQUFkLGNBQWMsQ0FBeUI7WUFGcEQsV0FBTSxHQUFHLENBQUMsQ0FBQztZQUlsQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUEsK0JBQWlCLEVBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRW5DLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU3QyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3pELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUFVLENBQUMsV0FBVyxDQUFDLElBQUEsZUFBUyxFQUFD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