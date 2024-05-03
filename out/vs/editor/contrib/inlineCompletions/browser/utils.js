/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, errors_1, lifecycle_1, observable_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColumnRange = void 0;
    exports.getReadonlyEmptyArray = getReadonlyEmptyArray;
    exports.applyObservableDecorations = applyObservableDecorations;
    exports.addPositions = addPositions;
    exports.subtractPositions = subtractPositions;
    const array = [];
    function getReadonlyEmptyArray() {
        return array;
    }
    class ColumnRange {
        constructor(startColumn, endColumnExclusive) {
            this.startColumn = startColumn;
            this.endColumnExclusive = endColumnExclusive;
            if (startColumn > endColumnExclusive) {
                throw new errors_1.BugIndicatingError(`startColumn ${startColumn} cannot be after endColumnExclusive ${endColumnExclusive}`);
            }
        }
        toRange(lineNumber) {
            return new range_1.Range(lineNumber, this.startColumn, lineNumber, this.endColumnExclusive);
        }
        equals(other) {
            return this.startColumn === other.startColumn
                && this.endColumnExclusive === other.endColumnExclusive;
        }
    }
    exports.ColumnRange = ColumnRange;
    function applyObservableDecorations(editor, decorations) {
        const d = new lifecycle_1.DisposableStore();
        const decorationsCollection = editor.createDecorationsCollection();
        d.add((0, observable_1.autorunOpts)({ debugName: () => `Apply decorations from ${decorations.debugName}` }, reader => {
            const d = decorations.read(reader);
            decorationsCollection.set(d);
        }));
        d.add({
            dispose: () => {
                decorationsCollection.clear();
            }
        });
        return d;
    }
    function addPositions(pos1, pos2) {
        return new position_1.Position(pos1.lineNumber + pos2.lineNumber - 1, pos2.lineNumber === 1 ? pos1.column + pos2.column - 1 : pos2.column);
    }
    function subtractPositions(pos1, pos2) {
        return new position_1.Position(pos1.lineNumber - pos2.lineNumber + 1, pos1.lineNumber - pos2.lineNumber === 0 ? pos1.column - pos2.column + 1 : pos1.column);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGluZUNvbXBsZXRpb25zL2Jyb3dzZXIvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLHNEQUVDO0lBc0JELGdFQWFDO0lBRUQsb0NBRUM7SUFFRCw4Q0FFQztJQTlDRCxNQUFNLEtBQUssR0FBdUIsRUFBRSxDQUFDO0lBQ3JDLFNBQWdCLHFCQUFxQjtRQUNwQyxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxNQUFhLFdBQVc7UUFDdkIsWUFDaUIsV0FBbUIsRUFDbkIsa0JBQTBCO1lBRDFCLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQ25CLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBUTtZQUUxQyxJQUFJLFdBQVcsR0FBRyxrQkFBa0IsRUFBRSxDQUFDO2dCQUN0QyxNQUFNLElBQUksMkJBQWtCLENBQUMsZUFBZSxXQUFXLHVDQUF1QyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7WUFDckgsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLENBQUMsVUFBa0I7WUFDekIsT0FBTyxJQUFJLGFBQUssQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDckYsQ0FBQztRQUVELE1BQU0sQ0FBQyxLQUFrQjtZQUN4QixPQUFPLElBQUksQ0FBQyxXQUFXLEtBQUssS0FBSyxDQUFDLFdBQVc7bUJBQ3pDLElBQUksQ0FBQyxrQkFBa0IsS0FBSyxLQUFLLENBQUMsa0JBQWtCLENBQUM7UUFDMUQsQ0FBQztLQUNEO0lBbEJELGtDQWtCQztJQUVELFNBQWdCLDBCQUEwQixDQUFDLE1BQW1CLEVBQUUsV0FBaUQ7UUFDaEgsTUFBTSxDQUFDLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDaEMsTUFBTSxxQkFBcUIsR0FBRyxNQUFNLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztRQUNuRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVcsRUFBQyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQywwQkFBMEIsV0FBVyxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbEcsTUFBTSxDQUFDLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDTCxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUNiLHFCQUFxQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQy9CLENBQUM7U0FDRCxDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsQ0FBQztJQUNWLENBQUM7SUFFRCxTQUFnQixZQUFZLENBQUMsSUFBYyxFQUFFLElBQWM7UUFDMUQsT0FBTyxJQUFJLG1CQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2pJLENBQUM7SUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxJQUFjLEVBQUUsSUFBYztRQUMvRCxPQUFPLElBQUksbUJBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuSixDQUFDIn0=