/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewEventHandler = void 0;
    class ViewEventHandler extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._shouldRender = true;
        }
        shouldRender() {
            return this._shouldRender;
        }
        forceShouldRender() {
            this._shouldRender = true;
        }
        setShouldRender() {
            this._shouldRender = true;
        }
        onDidRender() {
            this._shouldRender = false;
        }
        // --- begin event handlers
        onCompositionStart(e) {
            return false;
        }
        onCompositionEnd(e) {
            return false;
        }
        onConfigurationChanged(e) {
            return false;
        }
        onCursorStateChanged(e) {
            return false;
        }
        onDecorationsChanged(e) {
            return false;
        }
        onFlushed(e) {
            return false;
        }
        onFocusChanged(e) {
            return false;
        }
        onLanguageConfigurationChanged(e) {
            return false;
        }
        onLineMappingChanged(e) {
            return false;
        }
        onLinesChanged(e) {
            return false;
        }
        onLinesDeleted(e) {
            return false;
        }
        onLinesInserted(e) {
            return false;
        }
        onRevealRangeRequest(e) {
            return false;
        }
        onScrollChanged(e) {
            return false;
        }
        onThemeChanged(e) {
            return false;
        }
        onTokensChanged(e) {
            return false;
        }
        onTokensColorsChanged(e) {
            return false;
        }
        onZonesChanged(e) {
            return false;
        }
        // --- end event handlers
        handleEvents(events) {
            let shouldRender = false;
            for (let i = 0, len = events.length; i < len; i++) {
                const e = events[i];
                switch (e.type) {
                    case 0 /* viewEvents.ViewEventType.ViewCompositionStart */:
                        if (this.onCompositionStart(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 1 /* viewEvents.ViewEventType.ViewCompositionEnd */:
                        if (this.onCompositionEnd(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 2 /* viewEvents.ViewEventType.ViewConfigurationChanged */:
                        if (this.onConfigurationChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 3 /* viewEvents.ViewEventType.ViewCursorStateChanged */:
                        if (this.onCursorStateChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 4 /* viewEvents.ViewEventType.ViewDecorationsChanged */:
                        if (this.onDecorationsChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 5 /* viewEvents.ViewEventType.ViewFlushed */:
                        if (this.onFlushed(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 6 /* viewEvents.ViewEventType.ViewFocusChanged */:
                        if (this.onFocusChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 7 /* viewEvents.ViewEventType.ViewLanguageConfigurationChanged */:
                        if (this.onLanguageConfigurationChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 8 /* viewEvents.ViewEventType.ViewLineMappingChanged */:
                        if (this.onLineMappingChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 9 /* viewEvents.ViewEventType.ViewLinesChanged */:
                        if (this.onLinesChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 10 /* viewEvents.ViewEventType.ViewLinesDeleted */:
                        if (this.onLinesDeleted(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 11 /* viewEvents.ViewEventType.ViewLinesInserted */:
                        if (this.onLinesInserted(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 12 /* viewEvents.ViewEventType.ViewRevealRangeRequest */:
                        if (this.onRevealRangeRequest(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 13 /* viewEvents.ViewEventType.ViewScrollChanged */:
                        if (this.onScrollChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 15 /* viewEvents.ViewEventType.ViewTokensChanged */:
                        if (this.onTokensChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 14 /* viewEvents.ViewEventType.ViewThemeChanged */:
                        if (this.onThemeChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 16 /* viewEvents.ViewEventType.ViewTokensColorsChanged */:
                        if (this.onTokensColorsChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    case 17 /* viewEvents.ViewEventType.ViewZonesChanged */:
                        if (this.onZonesChanged(e)) {
                            shouldRender = true;
                        }
                        break;
                    default:
                        console.info('View received unknown event: ');
                        console.info(e);
                }
            }
            if (shouldRender) {
                this._shouldRender = true;
            }
        }
    }
    exports.ViewEventHandler = ViewEventHandler;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0V2ZW50SGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3RXZlbnRIYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxNQUFhLGdCQUFpQixTQUFRLHNCQUFVO1FBSS9DO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBRU0sWUFBWTtZQUNsQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVNLGlCQUFpQjtZQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBRVMsZUFBZTtZQUN4QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBRU0sV0FBVztZQUNqQixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztRQUM1QixDQUFDO1FBRUQsMkJBQTJCO1FBRXBCLGtCQUFrQixDQUFDLENBQXVDO1lBQ2hFLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNNLGdCQUFnQixDQUFDLENBQXFDO1lBQzVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNNLHNCQUFzQixDQUFDLENBQTJDO1lBQ3hFLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNNLG9CQUFvQixDQUFDLENBQXlDO1lBQ3BFLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNNLG9CQUFvQixDQUFDLENBQXlDO1lBQ3BFLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNNLFNBQVMsQ0FBQyxDQUE4QjtZQUM5QyxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDTSxjQUFjLENBQUMsQ0FBbUM7WUFDeEQsT0FBTyxL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