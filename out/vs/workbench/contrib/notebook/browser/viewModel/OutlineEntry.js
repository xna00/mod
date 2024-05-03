define(["require", "exports", "vs/base/common/codicons", "vs/base/common/themables", "vs/platform/markers/common/markers", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/editor/common/languages"], function (require, exports, codicons_1, themables_1, markers_1, notebookIcons_1, notebookCommon_1, languages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutlineEntry = void 0;
    class OutlineEntry {
        get icon() {
            if (this.symbolKind) {
                return languages_1.SymbolKinds.toIcon(this.symbolKind);
            }
            return this.isExecuting && this.isPaused ? notebookIcons_1.executingStateIcon :
                this.isExecuting ? themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin') :
                    this.cell.cellKind === notebookCommon_1.CellKind.Markup ? codicons_1.Codicon.markdown : codicons_1.Codicon.code;
        }
        constructor(index, level, cell, label, isExecuting, isPaused, range, symbolKind) {
            this.index = index;
            this.level = level;
            this.cell = cell;
            this.label = label;
            this.isExecuting = isExecuting;
            this.isPaused = isPaused;
            this.range = range;
            this.symbolKind = symbolKind;
            this._children = [];
        }
        addChild(entry) {
            this._children.push(entry);
            entry._parent = this;
        }
        get parent() {
            return this._parent;
        }
        get children() {
            return this._children;
        }
        get markerInfo() {
            return this._markerInfo;
        }
        get position() {
            if (this.range) {
                return { startLineNumber: this.range.startLineNumber, startColumn: this.range.startColumn };
            }
            return undefined;
        }
        updateMarkers(markerService) {
            if (this.cell.cellKind === notebookCommon_1.CellKind.Code) {
                // a code cell can have marker
                const marker = markerService.read({ resource: this.cell.uri, severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning });
                if (marker.length === 0) {
                    this._markerInfo = undefined;
                }
                else {
                    const topSev = marker.find(a => a.severity === markers_1.MarkerSeverity.Error)?.severity ?? markers_1.MarkerSeverity.Warning;
                    this._markerInfo = { topSev, count: marker.length };
                }
            }
            else {
                // a markdown cell can inherit markers from its children
                let topChild;
                for (const child of this.children) {
                    child.updateMarkers(markerService);
                    if (child.markerInfo) {
                        topChild = !topChild ? child.markerInfo.topSev : Math.max(child.markerInfo.topSev, topChild);
                    }
                }
                this._markerInfo = topChild && { topSev: topChild, count: 0 };
            }
        }
        clearMarkers() {
            this._markerInfo = undefined;
            for (const child of this.children) {
                child.clearMarkers();
            }
        }
        find(cell, parents) {
            if (cell.id === this.cell.id) {
                return this;
            }
            parents.push(this);
            for (const child of this.children) {
                const result = child.find(cell, parents);
                if (result) {
                    return result;
                }
            }
            parents.pop();
            return undefined;
        }
        asFlatList(bucket) {
            bucket.push(this);
            for (const child of this.children) {
                child.asFlatList(bucket);
            }
        }
    }
    exports.OutlineEntry = OutlineEntry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT3V0bGluZUVudHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXdNb2RlbC9PdXRsaW5lRW50cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQWtCQSxNQUFhLFlBQVk7UUFLeEIsSUFBSSxJQUFJO1lBQ1AsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sdUJBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsa0NBQWtCLENBQUMsQ0FBQztnQkFDOUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMscUJBQVMsQ0FBQyxNQUFNLENBQUMsa0NBQWtCLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDaEUsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUsseUJBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLGtCQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxrQkFBTyxDQUFDLElBQUksQ0FBQztRQUM1RSxDQUFDO1FBRUQsWUFDVSxLQUFhLEVBQ2IsS0FBYSxFQUNiLElBQW9CLEVBQ3BCLEtBQWEsRUFDYixXQUFvQixFQUNwQixRQUFpQixFQUNqQixLQUFjLEVBQ2QsVUFBdUI7WUFQdkIsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYixTQUFJLEdBQUosSUFBSSxDQUFnQjtZQUNwQixVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2IsZ0JBQVcsR0FBWCxXQUFXLENBQVM7WUFDcEIsYUFBUSxHQUFSLFFBQVEsQ0FBUztZQUNq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