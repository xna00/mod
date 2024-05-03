/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StableEditorScrollState = void 0;
    class StableEditorScrollState {
        static capture(editor) {
            if (editor.getScrollTop() === 0 || editor.hasPendingScrollAnimation()) {
                // Never mess with the scroll top if the editor is at the top of the file or if there is a pending scroll animation
                return new StableEditorScrollState(editor.getScrollTop(), editor.getContentHeight(), null, 0, null);
            }
            let visiblePosition = null;
            let visiblePositionScrollDelta = 0;
            const visibleRanges = editor.getVisibleRanges();
            if (visibleRanges.length > 0) {
                visiblePosition = visibleRanges[0].getStartPosition();
                const visiblePositionScrollTop = editor.getTopForPosition(visiblePosition.lineNumber, visiblePosition.column);
                visiblePositionScrollDelta = editor.getScrollTop() - visiblePositionScrollTop;
            }
            return new StableEditorScrollState(editor.getScrollTop(), editor.getContentHeight(), visiblePosition, visiblePositionScrollDelta, editor.getPosition());
        }
        constructor(_initialScrollTop, _initialContentHeight, _visiblePosition, _visiblePositionScrollDelta, _cursorPosition) {
            this._initialScrollTop = _initialScrollTop;
            this._initialContentHeight = _initialContentHeight;
            this._visiblePosition = _visiblePosition;
            this._visiblePositionScrollDelta = _visiblePositionScrollDelta;
            this._cursorPosition = _cursorPosition;
        }
        restore(editor) {
            if (this._initialContentHeight === editor.getContentHeight() && this._initialScrollTop === editor.getScrollTop()) {
                // The editor's content height and scroll top haven't changed, so we don't need to do anything
                return;
            }
            if (this._visiblePosition) {
                const visiblePositionScrollTop = editor.getTopForPosition(this._visiblePosition.lineNumber, this._visiblePosition.column);
                editor.setScrollTop(visiblePositionScrollTop + this._visiblePositionScrollDelta);
            }
        }
        restoreRelativeVerticalPositionOfCursor(editor) {
            if (this._initialContentHeight === editor.getContentHeight() && this._initialScrollTop === editor.getScrollTop()) {
                // The editor's content height and scroll top haven't changed, so we don't need to do anything
                return;
            }
            const currentCursorPosition = editor.getPosition();
            if (!this._cursorPosition || !currentCursorPosition) {
                return;
            }
            const offset = editor.getTopForLineNumber(currentCursorPosition.lineNumber) - editor.getTopForLineNumber(this._cursorPosition.lineNumber);
            editor.setScrollTop(editor.getScrollTop() + offset);
        }
    }
    exports.StableEditorScrollState = StableEditorScrollState;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhYmxlRWRpdG9yU2Nyb2xsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9zdGFibGVFZGl0b3JTY3JvbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLE1BQWEsdUJBQXVCO1FBRTVCLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBbUI7WUFDeEMsSUFBSSxNQUFNLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUIsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZFLG1IQUFtSDtnQkFDbkgsT0FBTyxJQUFJLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3JHLENBQUM7WUFFRCxJQUFJLGVBQWUsR0FBb0IsSUFBSSxDQUFDO1lBQzVDLElBQUksMEJBQTBCLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ2hELElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsZUFBZSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN0RCxNQUFNLHdCQUF3QixHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDOUcsMEJBQTBCLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxHQUFHLHdCQUF3QixDQUFDO1lBQy9FLENBQUM7WUFDRCxPQUFPLElBQUksdUJBQXVCLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLGVBQWUsRUFBRSwwQkFBMEIsRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUN6SixDQUFDO1FBRUQsWUFDa0IsaUJBQXlCLEVBQ3pCLHFCQUE2QixFQUM3QixnQkFBaUMsRUFDakMsMkJBQW1DLEVBQ25DLGVBQWdDO1lBSmhDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtZQUN6QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQVE7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQjtZQUNqQyxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQVE7WUFDbkMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1FBRWxELENBQUM7UUFFTSxPQUFPLENBQUMsTUFBbUI7WUFDakMsSUFBSSxJQUFJLENBQUMscUJBQXFCLEtBQUssTUFBTSxDQUFDLGdCQUFnQixFQUFFLElBQUksSUFBSSxDQUFDLGlCQUFpQixLQUFLLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO2dCQUNsSCw4RkFBOEY7Z0JBQzlGLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSx3QkFBd0IsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzFILE1BQU0sQ0FBQyxZQUFZLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDbEYsQ0FBQztRQUNGLENBQUM7UUFFTSx1Q0FBdUMsQ0FBQyxNQUFtQjtZQUNqRSxJQUFJLElBQUksQ0FBQyxxQkFBcUIsS0FBSyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEtBQUssTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7Z0JBQ2xILDhGQUE4RjtnQkFDOUYsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUVuRCxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ3JELE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBQ3JELENBQUM7S0FDRDtJQXZERCwwREF1REMifQ==