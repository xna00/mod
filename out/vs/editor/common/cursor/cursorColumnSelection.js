/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/cursorCommon", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, cursorCommon_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColumnSelection = void 0;
    class ColumnSelection {
        static columnSelect(config, model, fromLineNumber, fromVisibleColumn, toLineNumber, toVisibleColumn) {
            const lineCount = Math.abs(toLineNumber - fromLineNumber) + 1;
            const reversed = (fromLineNumber > toLineNumber);
            const isRTL = (fromVisibleColumn > toVisibleColumn);
            const isLTR = (fromVisibleColumn < toVisibleColumn);
            const result = [];
            // console.log(`fromVisibleColumn: ${fromVisibleColumn}, toVisibleColumn: ${toVisibleColumn}`);
            for (let i = 0; i < lineCount; i++) {
                const lineNumber = fromLineNumber + (reversed ? -i : i);
                const startColumn = config.columnFromVisibleColumn(model, lineNumber, fromVisibleColumn);
                const endColumn = config.columnFromVisibleColumn(model, lineNumber, toVisibleColumn);
                const visibleStartColumn = config.visibleColumnFromColumn(model, new position_1.Position(lineNumber, startColumn));
                const visibleEndColumn = config.visibleColumnFromColumn(model, new position_1.Position(lineNumber, endColumn));
                // console.log(`lineNumber: ${lineNumber}: visibleStartColumn: ${visibleStartColumn}, visibleEndColumn: ${visibleEndColumn}`);
                if (isLTR) {
                    if (visibleStartColumn > toVisibleColumn) {
                        continue;
                    }
                    if (visibleEndColumn < fromVisibleColumn) {
                        continue;
                    }
                }
                if (isRTL) {
                    if (visibleEndColumn > fromVisibleColumn) {
                        continue;
                    }
                    if (visibleStartColumn < toVisibleColumn) {
                        continue;
                    }
                }
                result.push(new cursorCommon_1.SingleCursorState(new range_1.Range(lineNumber, startColumn, lineNumber, startColumn), 0 /* SelectionStartKind.Simple */, 0, new position_1.Position(lineNumber, endColumn), 0));
            }
            if (result.length === 0) {
                // We are after all the lines, so add cursor at the end of each line
                for (let i = 0; i < lineCount; i++) {
                    const lineNumber = fromLineNumber + (reversed ? -i : i);
                    const maxColumn = model.getLineMaxColumn(lineNumber);
                    result.push(new cursorCommon_1.SingleCursorState(new range_1.Range(lineNumber, maxColumn, lineNumber, maxColumn), 0 /* SelectionStartKind.Simple */, 0, new position_1.Position(lineNumber, maxColumn), 0));
                }
            }
            return {
                viewStates: result,
                reversed: reversed,
                fromLineNumber: fromLineNumber,
                fromVisualColumn: fromVisibleColumn,
                toLineNumber: toLineNumber,
                toVisualColumn: toVisibleColumn
            };
        }
        static columnSelectLeft(config, model, prevColumnSelectData) {
            let toViewVisualColumn = prevColumnSelectData.toViewVisualColumn;
            if (toViewVisualColumn > 0) {
                toViewVisualColumn--;
            }
            return ColumnSelection.columnSelect(config, model, prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.fromViewVisualColumn, prevColumnSelectData.toViewLineNumber, toViewVisualColumn);
        }
        static columnSelectRight(config, model, prevColumnSelectData) {
            let maxVisualViewColumn = 0;
            const minViewLineNumber = Math.min(prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.toViewLineNumber);
            const maxViewLineNumber = Math.max(prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.toViewLineNumber);
            for (let lineNumber = minViewLineNumber; lineNumber <= maxViewLineNumber; lineNumber++) {
                const lineMaxViewColumn = model.getLineMaxColumn(lineNumber);
                const lineMaxVisualViewColumn = config.visibleColumnFromColumn(model, new position_1.Position(lineNumber, lineMaxViewColumn));
                maxVisualViewColumn = Math.max(maxVisualViewColumn, lineMaxVisualViewColumn);
            }
            let toViewVisualColumn = prevColumnSelectData.toViewVisualColumn;
            if (toViewVisualColumn < maxVisualViewColumn) {
                toViewVisualColumn++;
            }
            return this.columnSelect(config, model, prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.fromViewVisualColumn, prevColumnSelectData.toViewLineNumber, toViewVisualColumn);
        }
        static columnSelectUp(config, model, prevColumnSelectData, isPaged) {
            const linesCount = isPaged ? config.pageSize : 1;
            const toViewLineNumber = Math.max(1, prevColumnSelectData.toViewLineNumber - linesCount);
            return this.columnSelect(config, model, prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.fromViewVisualColumn, toViewLineNumber, prevColumnSelectData.toViewVisualColumn);
        }
        static columnSelectDown(config, model, prevColumnSelectData, isPaged) {
            const linesCount = isPaged ? config.pageSize : 1;
            const toViewLineNumber = Math.min(model.getLineCount(), prevColumnSelectData.toViewLineNumber + linesCount);
            return this.columnSelect(config, model, prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.fromViewVisualColumn, toViewLineNumber, prevColumnSelectData.toViewVisualColumn);
        }
    }
    exports.ColumnSelection = ColumnSelection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQ29sdW1uU2VsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2N1cnNvci9jdXJzb3JDb2x1bW5TZWxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsZUFBZTtRQUVwQixNQUFNLENBQUMsWUFBWSxDQUFDLE1BQTJCLEVBQUUsS0FBeUIsRUFBRSxjQUFzQixFQUFFLGlCQUF5QixFQUFFLFlBQW9CLEVBQUUsZUFBdUI7WUFDbEwsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlELE1BQU0sUUFBUSxHQUFHLENBQUMsY0FBYyxHQUFHLFlBQVksQ0FBQyxDQUFDO1lBQ2pELE1BQU0sS0FBSyxHQUFHLENBQUMsaUJBQWlCLEdBQUcsZUFBZSxDQUFDLENBQUM7WUFDcEQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsQ0FBQztZQUVwRCxNQUFNLE1BQU0sR0FBd0IsRUFBRSxDQUFDO1lBRXZDLCtGQUErRjtZQUUvRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sVUFBVSxHQUFHLGNBQWMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUV4RCxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2dCQUN6RixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsdUJBQXVCLENB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