/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostDocumentData", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/types", "vs/base/common/objects", "vs/workbench/api/common/extHostTypes"], function (require, exports, event_1, lifecycle_1, uri_1, extHost_protocol_1, extHostDocumentData_1, TypeConverters, types_1, objects_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDocuments = void 0;
    class ExtHostDocuments {
        constructor(mainContext, documentsAndEditors) {
            this._onDidAddDocument = new event_1.Emitter();
            this._onDidRemoveDocument = new event_1.Emitter();
            this._onDidChangeDocument = new event_1.Emitter();
            this._onDidSaveDocument = new event_1.Emitter();
            this.onDidAddDocument = this._onDidAddDocument.event;
            this.onDidRemoveDocument = this._onDidRemoveDocument.event;
            this.onDidChangeDocument = this._onDidChangeDocument.event;
            this.onDidSaveDocument = this._onDidSaveDocument.event;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._documentLoader = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDocuments);
            this._documentsAndEditors = documentsAndEditors;
            this._documentsAndEditors.onDidRemoveDocuments(documents => {
                for (const data of documents) {
                    this._onDidRemoveDocument.fire(data.document);
                }
            }, undefined, this._toDispose);
            this._documentsAndEditors.onDidAddDocuments(documents => {
                for (const data of documents) {
                    this._onDidAddDocument.fire(data.document);
                }
            }, undefined, this._toDispose);
        }
        dispose() {
            this._toDispose.dispose();
        }
        getAllDocumentData() {
            return [...this._documentsAndEditors.allDocuments()];
        }
        getDocumentData(resource) {
            if (!resource) {
                return undefined;
            }
            const data = this._documentsAndEditors.getDocument(resource);
            if (data) {
                return data;
            }
            return undefined;
        }
        getDocument(resource) {
            const data = this.getDocumentData(resource);
            if (!data?.document) {
                throw new Error(`Unable to retrieve document from URI '${resource}'`);
            }
            return data.document;
        }
        ensureDocumentData(uri) {
            const cached = this._documentsAndEditors.getDocument(uri);
            if (cached) {
                return Promise.resolve(cached);
            }
            let promise = this._documentLoader.get(uri.toString());
            if (!promise) {
                promise = this._proxy.$tryOpenDocument(uri).then(uriData => {
                    this._documentLoader.delete(uri.toString());
                    const canonicalUri = uri_1.URI.revive(uriData);
                    return (0, types_1.assertIsDefined)(this._documentsAndEditors.getDocument(canonicalUri));
                }, err => {
                    this._documentLoader.delete(uri.toString());
                    return Promise.reject(err);
                });
                this._documentLoader.set(uri.toString(), promise);
            }
            return promise;
        }
        createDocumentData(options) {
            return this._proxy.$tryCreateDocument(options).then(data => uri_1.URI.revive(data));
        }
        $acceptModelLanguageChanged(uriComponents, newLanguageId) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            // Treat a language change as a remove + add
            this._onDidRemoveDocument.fire(data.document);
            data._acceptLanguageId(newLanguageId);
            this._onDidAddDocument.fire(data.document);
        }
        $acceptModelSaved(uriComponents) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            this.$acceptDirtyStateChanged(uriComponents, false);
            this._onDidSaveDocument.fire(data.document);
        }
        $acceptDirtyStateChanged(uriComponents, isDirty) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            data._acceptIsDirty(isDirty);
            this._onDidChangeDocument.fire({
                document: data.document,
                contentChanges: [],
                reason: undefined
            });
        }
        $acceptModelChanged(uriComponents, events, isDirty) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            data._acceptIsDirty(isDirty);
            data.onEvents(events);
            let reason = undefined;
            if (events.isUndoing) {
                reason = extHostTypes_1.TextDocumentChangeReason.Undo;
            }
            else if (events.isRedoing) {
                reason = extHostTypes_1.TextDocumentChangeReason.Redo;
            }
            this._onDidChangeDocument.fire((0, objects_1.deepFreeze)({
                document: data.document,
                contentChanges: events.changes.map((change) => {
                    return {
                        range: TypeConverters.Range.to(change.range),
                        rangeOffset: change.rangeOffset,
                        rangeLength: change.rangeLength,
                        text: change.text
                    };
                }),
                reason
            }));
        }
        setWordDefinitionFor(languageId, wordDefinition) {
            (0, extHostDocumentData_1.setWordDefinitionFor)(languageId, wordDefinition);
        }
    }
    exports.ExtHostDocuments = ExtHostDocuments;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdERvY3VtZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBYSxnQkFBZ0I7UUFpQjVCLFlBQVksV0FBeUIsRUFBRSxtQkFBK0M7WUFmckUsc0JBQWlCLEdBQUcsSUFBSSxlQUFPLEVBQXVCLENBQUM7WUFDdkQseUJBQW9CLEdBQUcsSUFBSSxlQUFPLEVBQXVCLENBQUM7WUFDMUQseUJBQW9CLEdBQUcsSUFBSSxlQUFPLEVBQWtDLENBQUM7WUFDckUsdUJBQWtCLEdBQUcsSUFBSSxlQUFPLEVBQXVCLENBQUM7WUFFaEUscUJBQWdCLEdBQStCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFDNUUsd0JBQW1CLEdBQStCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFDbEYsd0JBQW1CLEdBQTBDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFDN0Ysc0JBQWlCLEdBQStCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFFdEUsZUFBVSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRzVDLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQXdDLENBQUM7WUFHekUsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsbUJBQW1CLENBQUM7WUFFaEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUMxRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsRUFB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