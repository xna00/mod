/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/common/notebookExecutionService"], function (require, exports, notebookExecutionService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookDto = void 0;
    var NotebookDto;
    (function (NotebookDto) {
        function toNotebookOutputItemDto(item) {
            return {
                mime: item.mime,
                valueBytes: item.data
            };
        }
        NotebookDto.toNotebookOutputItemDto = toNotebookOutputItemDto;
        function toNotebookOutputDto(output) {
            return {
                outputId: output.outputId,
                metadata: output.metadata,
                items: output.outputs.map(toNotebookOutputItemDto)
            };
        }
        NotebookDto.toNotebookOutputDto = toNotebookOutputDto;
        function toNotebookCellDataDto(cell) {
            return {
                cellKind: cell.cellKind,
                language: cell.language,
                mime: cell.mime,
                source: cell.source,
                internalMetadata: cell.internalMetadata,
                metadata: cell.metadata,
                outputs: cell.outputs.map(toNotebookOutputDto)
            };
        }
        NotebookDto.toNotebookCellDataDto = toNotebookCellDataDto;
        function toNotebookDataDto(data) {
            return {
                metadata: data.metadata,
                cells: data.cells.map(toNotebookCellDataDto)
            };
        }
        NotebookDto.toNotebookDataDto = toNotebookDataDto;
        function fromNotebookOutputItemDto(item) {
            return {
                mime: item.mime,
                data: item.valueBytes
            };
        }
        NotebookDto.fromNotebookOutputItemDto = fromNotebookOutputItemDto;
        function fromNotebookOutputDto(output) {
            return {
                outputId: output.outputId,
                metadata: output.metadata,
                outputs: output.items.map(fromNotebookOutputItemDto)
            };
        }
        NotebookDto.fromNotebookOutputDto = fromNotebookOutputDto;
        function fromNotebookCellDataDto(cell) {
            return {
                cellKind: cell.cellKind,
                language: cell.language,
                mime: cell.mime,
                source: cell.source,
                outputs: cell.outputs.map(fromNotebookOutputDto),
                metadata: cell.metadata,
                internalMetadata: cell.internalMetadata
            };
        }
        NotebookDto.fromNotebookCellDataDto = fromNotebookCellDataDto;
        function fromNotebookDataDto(data) {
            return {
                metadata: data.metadata,
                cells: data.cells.map(fromNotebookCellDataDto)
            };
        }
        NotebookDto.fromNotebookDataDto = fromNotebookDataDto;
        function toNotebookCellDto(cell) {
            return {
                handle: cell.handle,
                uri: cell.uri,
                source: cell.textBuffer.getLinesContent(),
                eol: cell.textBuffer.getEOL(),
                language: cell.language,
                cellKind: cell.cellKind,
                outputs: cell.outputs.map(toNotebookOutputDto),
                metadata: cell.metadata,
                internalMetadata: cell.internalMetadata,
            };
        }
        NotebookDto.toNotebookCellDto = toNotebookCellDto;
        function fromCellExecuteUpdateDto(data) {
            if (data.editType === notebookExecutionService_1.CellExecutionUpdateType.Output) {
                return {
                    editType: data.editType,
                    cellHandle: data.cellHandle,
                    append: data.append,
                    outputs: data.outputs.map(fromNotebookOutputDto)
                };
            }
            else if (data.editType === notebookExecutionService_1.CellExecutionUpdateType.OutputItems) {
                return {
                    editType: data.editType,
                    append: data.append,
                    outputId: data.outputId,
                    items: data.items.map(fromNotebookOutputItemDto)
                };
            }
            else {
                return data;
            }
        }
        NotebookDto.fromCellExecuteUpdateDto = fromCellExecuteUpdateDto;
        function fromCellExecuteCompleteDto(data) {
            return data;
        }
        NotebookDto.fromCellExecuteCompleteDto = fromCellExecuteCompleteDto;
        function fromCellEditOperationDto(edit) {
            if (edit.editType === 1 /* notebookCommon.CellEditType.Replace */) {
                return {
                    editType: edit.editType,
                    index: edit.index,
                    count: edit.count,
                    cells: edit.cells.map(fromNotebookCellDataDto)
                };
            }
            else {
                return edit;
            }
        }
        NotebookDto.fromCellEditOperationDto = fromCellEditOperationDto;
    })(NotebookDto || (exports.NotebookDto = NotebookDto = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rRHRvLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZE5vdGVib29rRHRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxJQUFpQixXQUFXLENBd0gzQjtJQXhIRCxXQUFpQixXQUFXO1FBRTNCLFNBQWdCLHVCQUF1QixDQUFDLElBQW1DO1lBQzFFLE9BQU87Z0JBQ04sSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2dCQUNmLFVBQVUsRUFBRSxJQUFJLENBQUMsSUFBSTthQUNyQixDQUFDO1FBQ0gsQ0FBQztRQUxlLG1DQUF1QiwwQkFLdEMsQ0FBQTtRQUVELFNBQWdCLG1CQUFtQixDQUFDLE1BQWlDO1lBQ3BFLE9BQU87Z0JBQ04sUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO2dCQUN6QixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7Z0JBQ3pCLEtBQUssRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQzthQUNsRCxDQUFDO1FBQ0gsQ0FBQztRQU5lLCtCQUFtQixzQkFNbEMsQ0FBQTtRQUVELFNBQWdCLHFCQUFxQixDQUFDLElBQThCO1lBQ25FLE9BQU87Z0JBQ04sUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7Z0JBQ3ZCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07Z0JBQ25CLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7Z0JBQ3ZDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtnQkFDdkIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFD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