/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/grid/gridview", "vs/base/common/event"], function (require, exports, assert, gridview_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestView = void 0;
    exports.nodesToArrays = nodesToArrays;
    class TestView {
        get minimumWidth() { return this._minimumWidth; }
        set minimumWidth(size) { this._minimumWidth = size; this._onDidChange.fire(undefined); }
        get maximumWidth() { return this._maximumWidth; }
        set maximumWidth(size) { this._maximumWidth = size; this._onDidChange.fire(undefined); }
        get minimumHeight() { return this._minimumHeight; }
        set minimumHeight(size) { this._minimumHeight = size; this._onDidChange.fire(undefined); }
        get maximumHeight() { return this._maximumHeight; }
        set maximumHeight(size) { this._maximumHeight = size; this._onDidChange.fire(undefined); }
        get element() { this._onDidGetElement.fire(); return this._element; }
        get width() { return this._width; }
        get height() { return this._height; }
        get top() { return this._top; }
        get left() { return this._left; }
        get size() { return [this.width, this.height]; }
        constructor(_minimumWidth, _maximumWidth, _minimumHeight, _maximumHeight) {
            this._minimumWidth = _minimumWidth;
            this._maximumWidth = _maximumWidth;
            this._minimumHeight = _minimumHeight;
            this._maximumHeight = _maximumHeight;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._element = document.createElement('div');
            this._onDidGetElement = new event_1.Emitter();
            this.onDidGetElement = this._onDidGetElement.event;
            this._width = 0;
            this._height = 0;
            this._top = 0;
            this._left = 0;
            this._onDidLayout = new event_1.Emitter();
            this.onDidLayout = this._onDidLayout.event;
            this._onDidFocus = new event_1.Emitter();
            this.onDidFocus = this._onDidFocus.event;
            assert(_minimumWidth <= _maximumWidth, 'gridview view minimum width must be <= maximum width');
            assert(_minimumHeight <= _maximumHeight, 'gridview view minimum height must be <= maximum height');
        }
        layout(width, height, top, left) {
            this._width = width;
            this._height = height;
            this._top = top;
            this._left = left;
            this._onDidLayout.fire({ width, height, top, left });
        }
        focus() {
            this._onDidFocus.fire();
        }
        dispose() {
            this._onDidChange.dispose();
            this._onDidGetElement.dispose();
            this._onDidLayout.dispose();
            this._onDidFocus.dispose();
        }
    }
    exports.TestView = TestView;
    function nodesToArrays(node) {
        if ((0, gridview_1.isGridBranchNode)(node)) {
            return node.children.map(nodesToArrays);
        }
        else {
            return node.view;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2Jyb3dzZXIvdWkvZ3JpZC91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdGaEcsc0NBTUM7SUEvRUQsTUFBYSxRQUFRO1FBS3BCLElBQUksWUFBWSxLQUFhLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDekQsSUFBSSxZQUFZLENBQUMsSUFBWSxJQUFJLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRWhHLElBQUksWUFBWSxLQUFhLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDekQsSUFBSSxZQUFZLENBQUMsSUFBWSxJQUFJLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRWhHLElBQUksYUFBYSxLQUFhLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDM0QsSUFBSSxhQUFhLENBQUMsSUFBWSxJQUFJLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRWxHLElBQUksYUFBYSxLQUFhLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDM0QsSUFBSSxhQUFhLENBQUMsSUFBWSxJQUFJLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJ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