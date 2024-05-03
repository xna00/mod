/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/map", "vs/base/common/network", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation"], function (require, exports, buffer_1, map_1, network_1, extensions_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookDocumentWorkbenchService = exports.INotebookDocumentService = void 0;
    exports.parse = parse;
    exports.generate = generate;
    exports.INotebookDocumentService = (0, instantiation_1.createDecorator)('notebookDocumentService');
    const _lengths = ['W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f'];
    const _padRegexp = new RegExp(`^[${_lengths.join('')}]+`);
    const _radix = 7;
    function parse(cell) {
        if (cell.scheme !== network_1.Schemas.vscodeNotebookCell) {
            return undefined;
        }
        const idx = cell.fragment.indexOf('s');
        if (idx < 0) {
            return undefined;
        }
        const handle = parseInt(cell.fragment.substring(0, idx).replace(_padRegexp, ''), _radix);
        const _scheme = (0, buffer_1.decodeBase64)(cell.fragment.substring(idx + 1)).toString();
        if (isNaN(handle)) {
            return undefined;
        }
        return {
            handle,
            notebook: cell.with({ scheme: _scheme, fragment: null })
        };
    }
    function generate(notebook, handle) {
        const s = handle.toString(_radix);
        const p = s.length < _lengths.length ? _lengths[s.length - 1] : 'z';
        const fragment = `${p}${s}s${(0, buffer_1.encodeBase64)(buffer_1.VSBuffer.fromString(notebook.scheme), true, true)}`;
        return notebook.with({ scheme: network_1.Schemas.vscodeNotebookCell, fragment });
    }
    class NotebookDocumentWorkbenchService {
        constructor() {
            this._documents = new map_1.ResourceMap();
        }
        getNotebook(uri) {
            if (uri.scheme === network_1.Schemas.vscodeNotebookCell) {
                const cellUri = parse(uri);
                if (cellUri) {
                    const document = this._documents.get(cellUri.notebook);
                    if (document) {
                        return document;
                    }
                }
            }
            return this._documents.get(uri);
        }
        addNotebookDocument(document) {
            this._documents.set(document.uri, document);
        }
        removeNotebookDocument(document) {
            this._documents.delete(document.uri);
        }
    }
    exports.NotebookDocumentWorkbenchService = NotebookDocumentWorkbenchService;
    (0, extensions_1.registerSingleton)(exports.INotebookDocumentService, NotebookDocumentWorkbenchService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tEb2N1bWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9ub3RlYm9vay9jb21tb24vbm90ZWJvb2tEb2N1bWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUJoRyxzQkFvQkM7SUFFRCw0QkFPQztJQXZDWSxRQUFBLHdCQUF3QixHQUFHLElBQUEsK0JBQWUsRUFBMkIseUJBQXlCLENBQUMsQ0FBQztJQU83RyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3BFLE1BQU0sVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLFNBQWdCLEtBQUssQ0FBQyxJQUFTO1FBQzlCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDaEQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2IsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFD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