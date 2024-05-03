/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/errors", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/linkedList"], function (require, exports, uri_1, errors_1, extHostTypes_1, extHostTypeConverters_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDocumentSaveParticipant = void 0;
    class ExtHostDocumentSaveParticipant {
        constructor(_logService, _documents, _mainThreadBulkEdits, _thresholds = { timeout: 1500, errors: 3 }) {
            this._logService = _logService;
            this._documents = _documents;
            this._mainThreadBulkEdits = _mainThreadBulkEdits;
            this._thresholds = _thresholds;
            this._callbacks = new linkedList_1.LinkedList();
            this._badListeners = new WeakMap();
            //
        }
        dispose() {
            this._callbacks.clear();
        }
        getOnWillSaveTextDocumentEvent(extension) {
            return (listener, thisArg, disposables) => {
                const remove = this._callbacks.push([listener, thisArg, extension]);
                const result = { dispose: remove };
                if (Array.isArray(disposables)) {
                    disposables.push(result);
                }
                return result;
            };
        }
        async $participateInSave(data, reason) {
            const resource = uri_1.URI.revive(data);
            let didTimeout = false;
            const didTimeoutHandle = setTimeout(() => didTimeout = true, this._thresholds.timeout);
            const results = [];
            try {
                for (const listener of [...this._callbacks]) { // copy to prevent concurrent modifications
                    if (didTimeout) {
                        // timeout - no more listeners
                        break;
                    }
                    const document = this._documents.getDocument(resource);
                    const success = await this._deliverEventAsyncAndBlameBadListeners(listener, { document, reason: extHostTypeConverters_1.TextDocumentSaveReason.to(reason) });
                    results.push(success);
                }
            }
            finally {
                clearTimeout(didTimeoutHandle);
            }
            return results;
        }
        _deliverEventAsyncAndBlameBadListeners([listener, thisArg, extension], stubEvent) {
            const errors = this._badListeners.get(listener);
            if (typeof errors === 'number' && errors > this._thresholds.errors) {
                // bad listener - ignore
                return Promise.resolve(false);
            }
            return this._deliverEventAsync(extension, listener, thisArg, stubEvent).then(() => {
                // don't send result across the wire
                return true;
            }, err => {
                this._logService.error(`onWillSaveTextDocument-listener from extension '${extension.identifier.value}' threw ERROR`);
                this._logService.error(err);
                if (!(err instanceof Error) || err.message !== 'concurrent_edits') {
                    const errors = this._badListeners.get(listener);
                    this._badListeners.set(listener, !errors ? 1 : errors + 1);
                    if (typeof errors === 'number' && errors > this._thresholds.errors) {
                        this._logService.info(`onWillSaveTextDocument-listener from extension '${extension.identifier.value}' will now be IGNORED because of timeouts and/or errors`);
                    }
                }
                return false;
            });
        }
        _deliverEventAsync(extension, listener, thisArg, stubEvent) {
            const promises = [];
            const t1 = Date.now();
            const { document, reason } = stubEvent;
            const { version } = document;
            const event = Object.freeze({
                document,
                reason,
                waitUntil(p) {
                    if (Object.isFrozen(promises)) {
                        throw (0, errors_1.illegalState)('waitUntil can not be called async');
                    }
                    promises.push(Promise.resolve(p));
                }
            });
            try {
                // fire event
                listener.apply(thisArg, [event]);
            }
            catch (err) {
                return Promise.reject(err);
            }
            // freeze promises after event call
            Object.freeze(promises);
            return new Promise((resolve, reject) => {
                // join on all listener promises, reject after timeout
                const handle = setTimeout(() => reject(new Error('timeout')), this._thresholds.timeout);
                return Promise.all(promises).then(edits => {
                    this._logService.debug(`onWillSaveTextDocument-listener from extension '${extension.identifier.value}' finished after ${(Date.now() - t1)}ms`);
                    clearTimeout(handle);
                    resolve(edits);
                }).catch(err => {
                    clearTimeout(handle);
                    reject(err);
                });
            }).then(values => {
                const dto = { edits: [] };
                for (const value of values) {
                    if (Array.isArray(value) && value.every(e => e instanceof extHostTypes_1.TextEdit)) {
                        for (const { newText, newEol, range } of value) {
                            dto.edits.push({
                                resource: document.uri,
                                versionId: undefined,
                                textEdit: {
                                    range: range && extHostTypeConverters_1.Range.from(range),
                                    text: newText,
                                    eol: newEol && extHostTypeConverters_1.EndOfLine.from(newEol),
                                }
                            });
                        }
                    }
                }
                // apply edits if any and if document
                // didn't change somehow in the meantime
                if (dto.edits.length === 0) {
                    return undefined;
                }
                if (version === document.version) {
                    return this._mainThreadBulkEdits.$tryApplyWorkspaceEdit(dto);
                }
                return Promise.reject(new Error('concurrent_edits'));
            });
        }
    }
    exports.ExtHostDocumentSaveParticipant = ExtHostDocumentSaveParticipant;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50U2F2ZVBhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0RG9jdW1lbnRTYXZlUGFydGljaXBhbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUJoRyxNQUFhLDhCQUE4QjtRQUsxQyxZQUNrQixXQUF3QixFQUN4QixVQUE0QixFQUM1QixvQkFBOEMsRUFDOUMsY0FBbUQsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUU7WUFIL0UsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDeEIsZUFBVSxHQUFWLFVBQVUsQ0FBa0I7WUFDNUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUEwQjtZQUM5QyxnQkFBVyxHQUFYLFdBQVcsQ0FBb0U7WUFQaEYsZUFBVSxHQUFHLElBQUksdUJBQVUsRUFBWSxDQUFDO1lBQ3hDLGtCQUFhLEdBQUcsSUFBSSxPQUFPLEVBQW9CLENBQUM7WUFRaEUsRUFBRTtRQUNILENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBRUQsOEJBQThCLENBQUMsU0FBZ0M7WUFDOUQsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEVBQUU7Z0JBQ3pDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLE1BQU0sR0FBRyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7b0JBQ2hDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzFCLENBQUM7Z0JBQ0QsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDLENBQUM7UUFDSCxDQUFDO1FBRUQsS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQW1CLEVBQUUsTUFBa0I7WUFDL0QsTUFBTSxRQUFRLEdBQUcsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVsQyxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDdkIsTUFBTSxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXZGLE1BQU0sT0FBTyxHQUFjLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUM7Z0JBQ0osS0FBSyxNQUFNLFFBQVEsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQywyQ0FBMkM7b0JBQ3pGLElBQUksVUFBVSxFQUFFLENBQUM7d0JBQ2hCLDhCQUE4Qjt3QkFDOUIsTUFBTTtvQkFDUCxDQUFDO29CQUNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN2RCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxzQ0FBc0MsQ0FBQyxRQUFRLEVBQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLDhDQUFzQixDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3ZCLENBQUM7WUFDRixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDaEMsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFTyxzQ0FBc0MsQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFXLEVBQUUsU0FBMkM7WUFDbkksTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEQsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3BFLHdCQUF3QjtnQkFDeEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNqRixvQ0FBb0M7Z0JBQ3BDLE9BQU8sSUFBSSxDQUFDO1lBRWIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO2dCQUVSLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG1EQUFtRCxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUssZUFBZSxDQUFDLENBQUM7Z0JBQ3JILElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUU1QixJQUFJLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxDQUFDLElBQVksR0FBSSxDQUFDLE9BQU8sS0FBSyxrQkFBa0IsRUFBRSxDQUFDO29CQUM1RSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDaEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFFM0QsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3BFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLG1EQUFtRCxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUsseURBQXlELENBQUMsQ0FBQztvQkFDL0osQ0FBQztnQkFDRixDQUFDO2dCQUNELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sa0JBQWtCLENBQUMsU0FBZ0MsRUFBRSxRQUFrQixFQUFFLE9BQVksRUFBRSxTQUEyQztZQUV6SSxNQUFNLFFBQVEsR0FBaUMsRUFBRSxDQUFDO1lBRWxELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN0QixNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQztZQUN2QyxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsUUFBUSxDQUFDO1lBRTdCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQW1DO2dCQUM3RCxRQUFRO2dCQUNSLE1BQU07Z0JBQ04sU0FBUyxDQUFDLENBQW1DO29CQUM1QyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzt3QkFDL0IsTUFBTSxJQUFBLHFCQUFZLEVBQUMsbUNBQW1DLENBQUMsQ0FBQztvQkFDekQsQ0FBQztvQkFDRCxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsQ0FBQzthQUNELENBQUMsQ0FBQztZQUVILElBQUksQ0FBQztnQkFDSixhQUFhO2dCQUNiLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNsQyxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUVELG1DQUFtQztZQUNuQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXhCLE9BQU8sSUFBSSxPQUFPLENBQXNCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUMzRCxzREFBc0Q7Z0JBQ3RELE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUV4RixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUN6QyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxtREFBbUQsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQy9JLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDckIsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNoQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ2QsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNyQixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2IsQ0FBQyxDQUFDLENBQUM7WUFFSixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2hCLE1BQU0sR0FBRyxHQUFzQixFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDN0MsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUUsQ0FBQztvQkFDNUIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUF3QixLQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLHVCQUFRLENBQUMsRUFBRSxDQUFDO3dCQUMxRixLQUFLLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEtBQUssRUFBRSxDQUFDOzRCQUNoRCxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztnQ0FDZCxRQUFRLEVBQUUsUUFBUSxDQUFDLEdBQUc7Z0NBQ3RCLFNBQVMsRUFBRSxTQUFTO2dDQUNwQixRQUFRLEVBQUU7b0NBQ1QsS0FBSyxFQUFFLEtBQUssSUFBSSw2QkFBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7b0NBQ2pDLElBQUksRUFBRSxPQUFPO29DQUNiLEdBQUcsRUFBRSxNQUFNLElBQUksaUNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO2lDQUNyQzs2QkFDRCxDQUFDLENBQUM7d0JBQ0osQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBRUQscUNBQXFDO2dCQUNyQyx3Q0FBd0M7Z0JBQ3hDLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQzVCLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUVELElBQUksT0FBTyxLQUFLLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDbEMsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzlELENBQUM7Z0JBRUQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUN0RCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQXpKRCx3RUF5SkMifQ==