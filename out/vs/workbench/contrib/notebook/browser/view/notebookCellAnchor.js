/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, notebookBrowser_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellAnchor = void 0;
    class NotebookCellAnchor {
        constructor(notebookExecutionStateService, configurationService, scrollEvent) {
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.configurationService = configurationService;
            this.scrollEvent = scrollEvent;
            this.stopAnchoring = false;
        }
        shouldAnchor(cellListView, focusedIndex, heightDelta, executingCellUri) {
            if (cellListView.element(focusedIndex).focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                return true;
            }
            if (this.stopAnchoring) {
                return false;
            }
            const newFocusBottom = cellListView.elementTop(focusedIndex) + cellListView.elementHeight(focusedIndex) + heightDelta;
            const viewBottom = cellListView.renderHeight + cellListView.getScrollTop();
            const focusStillVisible = viewBottom > newFocusBottom;
            const anchorFocusedSetting = this.configurationService.getValue(notebookCommon_1.NotebookSetting.anchorToFocusedCell);
            const allowScrolling = this.configurationService.getValue(notebookCommon_1.NotebookSetting.scrollToRevealCell) !== 'none';
            const growing = heightDelta > 0;
            const autoAnchor = allowScrolling && growing && !focusStillVisible && anchorFocusedSetting !== 'off';
            if (autoAnchor || anchorFocusedSetting === 'on') {
                this.watchAchorDuringExecution(executingCellUri);
                return true;
            }
            return false;
        }
        watchAchorDuringExecution(executingCell) {
            // anchor while the cell is executing unless the user scrolls up.
            if (!this.executionWatcher && executingCell.cellKind === notebookCommon_1.CellKind.Code) {
                const executionState = this.notebookExecutionStateService.getCellExecution(executingCell.uri);
                if (executionState && executionState.state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                    this.executionWatcher = executingCell.onDidStopExecution(() => {
                        this.executionWatcher?.dispose();
                        this.executionWatcher = undefined;
                        this.scrollWatcher?.dispose();
                        this.stopAnchoring = false;
                    });
                    this.scrollWatcher = this.scrollEvent((scrollEvent) => {
                        if (scrollEvent.scrollTop < scrollEvent.oldScrollTop) {
                            this.stopAnchoring = true;
                            this.scrollWatcher?.dispose();
                        }
                    });
                }
            }
        }
        dispose() {
            this.executionWatcher?.dispose();
            this.scrollWatcher?.dispose();
        }
    }
    exports.NotebookCellAnchor = NotebookCellAnchor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDZWxsQW5jaG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvbm90ZWJvb2tDZWxsQW5jaG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxNQUFhLGtCQUFrQjtRQU05QixZQUNrQiw2QkFBNkQsRUFDN0Qsb0JBQTJDLEVBQzNDLFdBQStCO1lBRi9CLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFDN0QseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyxnQkFBVyxHQUFYLFdBQVcsQ0FBb0I7WUFQekMsa0JBQWEsR0FBRyxLQUFLLENBQUM7UUFROUIsQ0FBQztRQUVNLFlBQVksQ0FBQyxZQUFzQyxFQUFFLFlBQW9CLEVBQUUsV0FBbUIsRUFBRSxnQkFBZ0M7WUFDdEksSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLFNBQVMsS0FBSywrQkFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMzRSxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsTUFBTSxjQUFjLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxHQUFHLFdBQVcsQ0FBQztZQUN0SCxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUMzRSxNQUFNLGlCQUFpQixHQUFHLFVBQVUsR0FBRyxjQUFjLENBQUM7WUFDdEQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLGdDQUFlLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNyRyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLGdDQUFlLENBQUMsa0JBQWtCLENBQUMsS0FBSyxNQUFNLENBQUM7WUFDekcsTUFBTSxPQUFPLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQztZQUNoQyxNQUFNLFVBQVUsR0FBRyxjQUFjLElBQUksT0FBTyxJQUFJLENBQUMsaUJBQWlCLElBQUksb0JBQW9CLEtBQUssS0FBSyxDQUFDO1lBRXJHLElBQUksVUFBVSxJQUFJLG9CQUFvQixLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMseUJBQXlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDakQsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU0seUJBQXlCLENBQUMsYUFBNkI7WUFDN0QsaUVBQWlFO1lBQ2pFLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLElBQUksYUFBYSxDQUFDLFFBQVEsS0FBSyx5QkFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN4RSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM5RixJQUFJLGNBQWMsSUFBSSxjQUFjLENBQUMsS0FBSyxLQUFLLDJDQUEwQixDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNyRixJQUFJLENBQUMsZ0JBQWdCLEdBQUksYUFBbUMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUU7d0JBQ3BGLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsQ0FBQzt3QkFDakMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQzt3QkFDbEMsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsQ0FBQzt3QkFDOUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7b0JBQzVCLENBQUMsQ0FBQyxDQUFDO29CQUNILElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFO3dCQUNyRCxJQUFJLFdBQVcsQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLFlBQVksRUFBRSxDQUFDOzRCQUN0RCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQzs0QkFDMUIsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsQ0FBQzt3QkFDL0IsQ0FBQztvQkFDRixDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDL0IsQ0FBQztLQUNEO0lBN0RELGdEQTZEQyJ9