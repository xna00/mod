define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/contrib/find/browser/findDecorations", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/notebook/browser/notebookBrowser"], function (require, exports, lifecycle_1, findDecorations_1, colorRegistry_1, notebookBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindMatchDecorationModel = void 0;
    class FindMatchDecorationModel extends lifecycle_1.Disposable {
        constructor(_notebookEditor, ownerID) {
            super();
            this._notebookEditor = _notebookEditor;
            this.ownerID = ownerID;
            this._allMatchesDecorations = [];
            this._currentMatchCellDecorations = [];
            this._allMatchesCellDecorations = [];
            this._currentMatchDecorations = null;
        }
        get currentMatchDecorations() {
            return this._currentMatchDecorations;
        }
        clearDecorations() {
            this.clearCurrentFindMatchDecoration();
            this.setAllFindMatchesDecorations([]);
        }
        async highlightCurrentFindMatchDecorationInCell(cell, cellRange) {
            this.clearCurrentFindMatchDecoration();
            // match is an editor FindMatch, we update find match decoration in the editor
            // we will highlight the match in the webview
            this._notebookEditor.changeModelDecorations(accessor => {
                const findMatchesOptions = findDecorations_1.FindDecorations._CURRENT_FIND_MATCH_DECORATION;
                const decorations = [
                    { range: cellRange, options: findMatchesOptions }
                ];
                const deltaDecoration = {
                    ownerId: cell.handle,
                    decorations: decorations
                };
                this._currentMatchDecorations = {
                    kind: 'input',
                    decorations: accessor.deltaDecorations(this._currentMatchDecorations?.kind === 'input' ? this._currentMatchDecorations.decorations : [], [deltaDecoration])
                };
            });
            this._currentMatchCellDecorations = this._notebookEditor.deltaCellDecorations(this._currentMatchCellDecorations, [{
                    ownerId: cell.handle,
                    handle: cell.handle,
                    options: {
                        overviewRuler: {
                            color: colorRegistry_1.overviewRulerSelectionHighlightForeground,
                            modelRanges: [cellRange],
                            includeOutput: false,
                            position: notebookBrowser_1.NotebookOverviewRulerLane.Center
                        }
                    }
                }]);
            return null;
        }
        async highlightCurrentFindMatchDecorationInWebview(cell, index) {
            this.clearCurrentFindMatchDecoration();
            const offset = await this._notebookEditor.findHighlightCurrent(index, this.ownerID);
            this._currentMatchDecorations = { kind: 'output', index: index };
            this._currentMatchCellDecorations = this._notebookEditor.deltaCellDecorations(this._currentMatchCellDecorations, [{
                    ownerId: cell.handle,
                    handle: cell.handle,
                    options: {
                        overviewRuler: {
                            color: colorRegistry_1.overviewRulerSelectionHighlightForeground,
                            modelRanges: [],
                            includeOutput: true,
                            position: notebookBrowser_1.NotebookOverviewRulerLane.Center
                        }
                    }
                }]);
            return offset;
        }
        clearCurrentFindMatchDecoration() {
            if (this._currentMatchDecorations?.kind === 'input') {
                this._notebookEditor.changeModelDecorations(accessor => {
                    accessor.deltaDecorations(this._currentMatchDecorations?.kind === 'input' ? this._currentMatchDecorations.decorations : [], []);
                    this._currentMatchDecorations = null;
                });
            }
            else if (this._currentMatchDecorations?.kind === 'output') {
                this._notebookEditor.findUnHighlightCurrent(this._currentMatchDecorations.index, this.ownerID);
            }
            this._currentMatchCellDecorations = this._notebookEditor.deltaCellDecorations(this._currentMatchCellDecorations, []);
        }
        setAllFindMatchesDecorations(cellFindMatches) {
            this._notebookEditor.changeModelDecorations((accessor) => {
                const findMatchesOptions = findDecorations_1.FindDecorations._FIND_MATCH_DECORATION;
                const deltaDecorations = cellFindMatches.map(cellFindMatch => {
                    // Find matches
                    const newFindMatchesDecorations = new Array(cellFindMatch.contentMatches.length);
                    for (let i = 0; i < cellFindMatch.contentMatches.length; i++) {
                        newFindMatchesDecorations[i] = {
                            range: cellFindMatch.contentMatches[i].range,
                            options: findMatchesOptions
                        };
                    }
                    return { ownerId: cellFindMatch.cell.handle, decorations: newFindMatchesDecorations };
                });
                this._allMatchesDecorations = accessor.deltaDecorations(this._allMatchesDecorations, deltaDecorations);
            });
            this._allMatchesCellDecorations = this._notebookEditor.deltaCellDecorations(this._allMatchesCellDecorations, cellFindMatches.map(cellFindMatch => {
                return {
                    ownerId: cellFindMatch.cell.handle,
                    handle: cellFindMatch.cell.handle,
                    options: {
                        overviewRuler: {
                            color: colorRegistry_1.overviewRulerFindMatchForeground,
                            modelRanges: cellFindMatch.contentMatches.map(match => match.range),
                            includeOutput: cellFindMatch.webviewMatches.length > 0,
                            position: notebookBrowser_1.NotebookOverviewRulerLane.Center
                        }
                    }
                };
            }));
        }
        stopWebviewFind() {
            this._notebookEditor.findStop(this.ownerID);
        }
        dispose() {
            this.clearDecorations();
            super.dispose();
        }
    }
    exports.FindMatchDecorationModel = FindMatchDecorationModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZE1hdGNoRGVjb3JhdGlvbk1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvZmluZC9maW5kTWF0Y2hEZWNvcmF0aW9uTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQVlBLE1BQWEsd0JBQXlCLFNBQVEsc0JBQVU7UUFNdkQsWUFDa0IsZUFBZ0MsRUFDaEMsT0FBZTtZQUVoQyxLQUFLLEVBQUUsQ0FBQztZQUhTLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNoQyxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBUHpCLDJCQUFzQixHQUE0QixFQUFFLENBQUM7WUFDckQsaUNBQTRCLEdBQWEsRUFBRSxDQUFDO1lBQzVDLCtCQUEwQixHQUFhLEVBQUUsQ0FBQztZQUMxQyw2QkFBd0IsR0FBdUcsSUFBSSxDQUFDO1FBTzVJLENBQUM7UUFFRCxJQUFXLHVCQUF1QjtZQUNqQyxPQUFPLElBQUksQ0FBQyx3QkFBd0IsQ0FBQztRQUN0QyxDQUFDO1FBRU8sZ0JBQWdCO1lBQ3ZCLElBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBR00sS0FBSyxDQUFDLHlDQUF5QyxDQUFDLElBQW9CLEVBQUUsU0FBZ0I7WUFFNUYsSUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUM7WUFFdkMsOEVBQThFO1lBQzlFLDZDQUE2QztZQUM3QyxJQUFJLENBQUMsZUFBZSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUN0RCxNQUFNLGtCQUFrQixHQUEyQixpQ0FBZSxDQUFDLDhCQUE4QixDQUFDO2dCQUVsRyxNQUFNLFdBQVcsR0FBNEI7b0JBQzVDLEVBQUUsS0FB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