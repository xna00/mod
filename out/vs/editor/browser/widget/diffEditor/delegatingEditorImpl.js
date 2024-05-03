/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DelegatingEditor = void 0;
    class DelegatingEditor extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._id = ++DelegatingEditor.idCounter;
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            // #endregion
        }
        static { this.idCounter = 0; }
        getId() { return this.getEditorType() + ':v2:' + this._id; }
        // #region editorBrowser.IDiffEditor: Delegating to modified Editor
        getVisibleColumnFromPosition(position) {
            return this._targetEditor.getVisibleColumnFromPosition(position);
        }
        getStatusbarColumn(position) {
            return this._targetEditor.getStatusbarColumn(position);
        }
        getPosition() {
            return this._targetEditor.getPosition();
        }
        setPosition(position, source = 'api') {
            this._targetEditor.setPosition(position, source);
        }
        revealLine(lineNumber, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealLine(lineNumber, scrollType);
        }
        revealLineInCenter(lineNumber, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealLineInCenter(lineNumber, scrollType);
        }
        revealLineInCenterIfOutsideViewport(lineNumber, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealLineInCenterIfOutsideViewport(lineNumber, scrollType);
        }
        revealLineNearTop(lineNumber, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealLineNearTop(lineNumber, scrollType);
        }
        revealPosition(position, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealPosition(position, scrollType);
        }
        revealPositionInCenter(position, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealPositionInCenter(position, scrollType);
        }
        revealPositionInCenterIfOutsideViewport(position, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealPositionInCenterIfOutsideViewport(position, scrollType);
        }
        revealPositionNearTop(position, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealPositionNearTop(position, scrollType);
        }
        getSelection() {
            return this._targetEditor.getSelection();
        }
        getSelections() {
            return this._targetEditor.getSelections();
        }
        setSelection(something, source = 'api') {
            this._targetEditor.setSelection(something, source);
        }
        setSelections(ranges, source = 'api') {
            this._targetEditor.setSelections(ranges, source);
        }
        revealLines(startLineNumber, endLineNumber, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealLines(startLineNumber, endLineNumber, scrollType);
        }
        revealLinesInCenter(startLineNumber, endLineNumber, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealLinesInCenter(startLineNumber, endLineNumber, scrollType);
        }
        revealLinesInCenterIfOutsideViewport(startLineNumber, endLineNumber, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealLinesInCenterIfOutsideViewport(startLineNumber, endLineNumber, scrollType);
        }
        revealLinesNearTop(startLineNumber, endLineNumber, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealLinesNearTop(startLineNumber, endLineNumber, scrollType);
        }
        revealRange(range, scrollType = 0 /* ScrollType.Smooth */, revealVerticalInCenter = false, revealHorizontal = true) {
            this._targetEditor.revealRange(range, scrollType, revealVerticalInCenter, revealHorizontal);
        }
        revealRangeInCenter(range, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealRangeInCenter(range, scrollType);
        }
        revealRangeInCenterIfOutsideViewport(range, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealRangeInCenterIfOutsideViewport(range, scrollType);
        }
        revealRangeNearTop(range, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealRangeNearTop(range, scrollType);
        }
        revealRangeNearTopIfOutsideViewport(range, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealRangeNearTopIfOutsideViewport(range, scrollType);
        }
        revealRangeAtTop(range, scrollType = 0 /* ScrollType.Smooth */) {
            this._targetEditor.revealRangeAtTop(range, scrollType);
        }
        getSupportedActions() {
            return this._targetEditor.getSupportedActions();
        }
        focus() {
            this._targetEditor.focus();
        }
        trigger(source, handlerId, payload) {
            this._targetEditor.trigger(source, handlerId, payload);
        }
        createDecorationsCollection(decorations) {
            return this._targetEditor.createDecorationsCollection(decorations);
        }
        changeDecorations(callback) {
            return this._targetEditor.changeDecorations(callback);
        }
    }
    exports.DelegatingEditor = DelegatingEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsZWdhdGluZ0VkaXRvckltcGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2RlbGVnYXRpbmdFZGl0b3JJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFzQixnQkFBaUIsU0FBUSxzQkFBVTtRQUF6RDs7WUFFa0IsUUFBRyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsU0FBUyxDQUFDO1lBRW5DLGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDckQsaUJBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQW1KeEQsYUFBYTtRQUNkLENBQUM7aUJBeEplLGNBQVMsR0FBRyxDQUFDLEFBQUosQ0FBSztRQVE3QixLQUFLLEtBQWEsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBYXBFLG1FQUFtRTtRQUU1RCw0QkFBNEIsQ0FBQyxRQUFtQjtZQUN0RCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsNEJBQTRCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVNLGtCQUFrQixDQUFDLFFBQW1CO1lBQzVDLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRU0sV0FBVztZQUNqQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDekMsQ0FBQztRQUVNLFdBQVcsQ0FBQyxRQUFtQixFQUFFLFNBQWlCLEtBQUs7WUFDN0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMs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