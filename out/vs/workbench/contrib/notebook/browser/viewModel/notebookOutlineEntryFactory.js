/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/markdownRenderer", "vs/nls", "vs/workbench/contrib/notebook/browser/viewModel/foldingModel", "./OutlineEntry", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, markdownRenderer_1, nls_1, foldingModel_1, OutlineEntry_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookOutlineEntryFactory = void 0;
    class NotebookOutlineEntryFactory {
        constructor(executionStateService) {
            this.executionStateService = executionStateService;
            this.cellOutlineEntryCache = {};
        }
        getOutlineEntries(cell, target, index) {
            const entries = [];
            const isMarkdown = cell.cellKind === notebookCommon_1.CellKind.Markup;
            // cap the amount of characters that we look at and use the following logic
            // - for MD prefer headings (each header is an entry)
            // - otherwise use the first none-empty line of the cell (MD or code)
            let content = getCellFirstNonEmptyLine(cell);
            let hasHeader = false;
            if (isMarkdown) {
                const fullContent = cell.getText().substring(0, 10000);
                for (const { depth, text } of (0, foldingModel_1.getMarkdownHeadersInCell)(fullContent)) {
                    hasHeader = true;
                    entries.push(new OutlineEntry_1.OutlineEntry(index++, depth, cell, text, false, false));
                }
                if (!hasHeader) {
                    // no markdown syntax headers, try to find html tags
                    const match = fullContent.match(/<h([1-6]).*>(.*)<\/h\1>/i);
                    if (match) {
                        hasHeader = true;
                        const level = parseInt(match[1]);
                        const text = match[2].trim();
                        entries.push(new OutlineEntry_1.OutlineEntry(index++, level, cell, text, false, false));
                    }
                }
                if (!hasHeader) {
                    content = (0, markdownRenderer_1.renderMarkdownAsPlaintext)({ value: content });
                }
            }
            if (!hasHeader) {
                const exeState = !isMarkdown && this.executionStateService.getCellExecution(cell.uri);
                let preview = content.trim();
                if (!isMarkdown && cell.model.textModel) {
                    const cachedEntries = this.cellOutlineEntryCache[cell.model.textModel.id];
                    // Gathering symbols from the model is an async operation, but this provider is syncronous.
                    // So symbols need to be precached before this function is called to get the full list.
                    if (cachedEntries) {
                        // push code cell that is a parent of cached symbols if we are targeting the outlinePane
                        if (target === 1 /* OutlineTarget.OutlinePane */) {
                            entries.push(new OutlineEntry_1.OutlineEntry(index++, 7, cell, preview, !!exeState, exeState ? exeState.isPaused : false));
                        }
                        cachedEntries.forEach((cached) => {
                            entries.push(new OutlineEntry_1.OutlineEntry(index++, cached.level, cell, cached.name, false, false, cached.range, cached.kind));
                        });
                    }
                }
                if (entries.length === 0) { // if there are no cached entries, use the first line of the cell as a code cell
                    if (preview.length === 0) {
                        // empty or just whitespace
                        preview = (0, nls_1.localize)('empty', "empty cell");
                    }
                    entries.push(new OutlineEntry_1.OutlineEntry(index++, 7, cell, preview, !!exeState, exeState ? exeState.isPaused : false));
                }
            }
            return entries;
        }
        async cacheSymbols(cell, outlineModelService, cancelToken) {
            const textModel = await cell.resolveTextModel();
            const outlineModel = await outlineModelService.getOrCreate(textModel, cancelToken);
            const entries = createOutlineEntries(outlineModel.getTopLevelSymbols(), 8);
            this.cellOutlineEntryCache[textModel.id] = entries;
        }
    }
    exports.NotebookOutlineEntryFactory = NotebookOutlineEntryFactory;
    function createOutlineEntries(symbols, level) {
        const entries = [];
        symbols.forEach(symbol => {
            entries.push({ name: symbol.name, range: symbol.range, level, kind: symbol.kind });
            if (symbol.children) {
                entries.push(...createOutlineEntries(symbol.children, level + 1));
            }
        });
        return entries;
    }
    function getCellFirstNonEmptyLine(cell) {
        const textBuffer = cell.textBuffer;
        for (let i = 0; i < textBuffer.getLineCount(); i++) {
            const firstNonWhitespace = textBuffer.getLineFirstNonWhitespaceColumn(i + 1);
            const lineLength = textBuffer.getLineLength(i + 1);
            if (firstNonWhitespace < lineLength) {
                return textBuffer.getLineContent(i + 1);
            }
        }
        return cell.getText().substring(0, 100);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPdXRsaW5lRW50cnlGYWN0b3J5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXdNb2RlbC9ub3RlYm9va091dGxpbmVFbnRyeUZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0JoRyxNQUFhLDJCQUEyQjtRQUl2QyxZQUNrQixxQkFBcUQ7WUFBckQsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUFnQztZQUgvRCwwQkFBcUIsR0FBZ0MsRUFBRSxDQUFDO1FBSTVELENBQUM7UUFFRSxpQkFBaUIsQ0FBQyxJQUFvQixFQUFFLE1BQXFCLEVBQUUsS0FBYTtZQUNsRixNQUFNLE9BQU8sR0FBbUIsRUFBRSxDQUFDO1lBRW5DLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLEtBQUsseUJBQVEsQ0FBQyxNQUFNLENBQUM7WUFFckQsMkVBQTJFO1lBQzNFLHFEQUFxRDtZQUNyRCxxRUFBcUU7WUFDckUsSUFBSSxPQUFPLEdBQUcsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0MsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO1lBRXRCLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2RCxLQUFLLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksSUFBQSx1Q0FBd0IsRUFBQyxXQUFXLENBQUMsRUFBRSxDQUFDO29CQUNyRSxTQUFTLEdBQUcsSUFBSSxDQUFDO29CQUNqQixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksMkJBQVksQ0FBQyxLQUFLLEVBQUUsRUFB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