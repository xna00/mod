/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, event_1, uri_1, extHostTypeConverters_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookDocumentSaveParticipant = void 0;
    class ExtHostNotebookDocumentSaveParticipant {
        constructor(_logService, _notebooksAndEditors, _mainThreadBulkEdits, _thresholds = { timeout: 1500, errors: 3 }) {
            this._logService = _logService;
            this._notebooksAndEditors = _notebooksAndEditors;
            this._mainThreadBulkEdits = _mainThreadBulkEdits;
            this._thresholds = _thresholds;
            this._onWillSaveNotebookDocumentEvent = new event_1.AsyncEmitter();
        }
        dispose() {
        }
        getOnWillSaveNotebookDocumentEvent(extension) {
            return (listener, thisArg, disposables) => {
                const wrappedListener = function wrapped(e) { listener.call(thisArg, e); };
                wrappedListener.extension = extension;
                return this._onWillSaveNotebookDocumentEvent.event(wrappedListener, undefined, disposables);
            };
        }
        async $participateInSave(resource, reason, token) {
            const revivedUri = uri_1.URI.revive(resource);
            const document = this._notebooksAndEditors.getNotebookDocument(revivedUri);
            if (!document) {
                throw new Error('Unable to resolve notebook document');
            }
            const edits = [];
            await this._onWillSaveNotebookDocumentEvent.fireAsync({ notebook: document.apiNotebook, reason: extHostTypeConverters_1.TextDocumentSaveReason.to(reason) }, token, async (thenable, listener) => {
                const now = Date.now();
                const data = await await Promise.resolve(thenable);
                if (Date.now() - now > this._thresholds.timeout) {
                    this._logService.warn('onWillSaveNotebookDocument-listener from extension', listener.extension.identifier);
                }
                if (token.isCancellationRequested) {
                    return;
                }
                if (data) {
                    if (data instanceof extHostTypes_1.WorkspaceEdit) {
                        edits.push(data);
                    }
                    else {
                        // ignore invalid data
                        this._logService.warn('onWillSaveNotebookDocument-listener from extension', listener.extension.identifier, 'ignored due to invalid data');
                    }
                }
                return;
            });
            if (token.isCancellationRequested) {
                return false;
            }
            if (edits.length === 0) {
                return true;
            }
            const dto = { edits: [] };
            for (const edit of edits) {
                const { edits } = extHostTypeConverters_1.WorkspaceEdit.from(edit);
                dto.edits = dto.edits.concat(edits);
            }
            return this._mainThreadBulkEdits.$tryApplyWorkspaceEdit(dto);
        }
    }
    exports.ExtHostNotebookDocumentSaveParticipant = ExtHostNotebookDocumentSaveParticipant;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rRG9jdW1lbnRTYXZlUGFydGljaXBhbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3ROb3RlYm9va0RvY3VtZW50U2F2ZVBhcnRpY2lwYW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1CaEcsTUFBYSxzQ0FBc0M7UUFJbEQsWUFDa0IsV0FBd0IsRUFDeEIsb0JBQStDLEVBQy9DLG9CQUE4QyxFQUM5QyxjQUFtRCxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRTtZQUgvRSxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUN4Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQTJCO1lBQy9DLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMEI7WUFDOUMsZ0JBQVcsR0FBWCxXQUFXLENBQW9FO1lBTmhGLHFDQUFnQyxHQUFHLElBQUksb0JBQVksRUFBaUMsQ0FBQztRQVF0RyxDQUFDO1FBRUQsT0FBTztRQUNQLENBQUM7UUFFRCxrQ0FBa0MsQ0FBQyxTQUFnQztZQUNsRSxPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsRUFBRTtnQkFDekMsTUFBTSxlQUFlLEdBQXNELFNBQVMsT0FBTyxDQUFDLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUgsZUFBZSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7Z0JBQ3RDLE9BQU8sSUFBSSxDQUFDLGdDQUFnQyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzdGLENBQUMsQ0FBQztRQUNILENBQUM7UUFFRCxLQUFLLENBQUMsa0JBQWtCLENBQUMsUUFBdUIsRUFBRSxNQUFrQixFQUFFLEtBQXdCO1lBQzdGLE1BQU0sVUFBVSxHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTNFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixNQUFNLElBQUksS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFvQixFQUFFLENBQUM7WUFFbEMsTUFBTSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsU0FBUyxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLDhDQUFzQixDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsUUFBMEIsRUFBRSxRQUFRLEVBQUUsRUFBRTtnQkFDMUwsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN2QixNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2pELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLG9EQUFvRCxFQUFzRCxRQUFTLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqSyxDQUFDO2dCQUVELElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7b0JBQ25DLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLElBQUksRUFBRSxDQUFDO29CQUNWLElBQUksSUFBSSxZQUFZLDRCQUFhLEVBQUUsQ0FBQzt3QkFDbkMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbEIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLHNCQUFzQjt3QkFDdEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsb0RBQW9ELEVBQXNELFFBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLDZCQUE2QixDQUFDLENBQUM7b0JBQ2hNLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxPQUFPO1lBQ1IsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sR0FBRyxHQUFzQixFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUM3QyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUMxQixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwRCxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5RCxDQUFDO0tBQ0Q7SUF4RUQsd0ZBd0VDIn0=