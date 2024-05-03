define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostDocumentSaveParticipant", "vs/workbench/api/test/common/testRPCProtocol", "vs/base/test/common/mock", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, extHostDocuments_1, extHostDocumentsAndEditors_1, extHostTypes_1, extHostDocumentSaveParticipant_1, testRPCProtocol_1, mock_1, log_1, extensions_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function timeout(n) {
        return new Promise(resolve => setTimeout(resolve, n));
    }
    suite('ExtHostDocumentSaveParticipant', () => {
        const resource = uri_1.URI.parse('foo:bar');
        const mainThreadBulkEdits = new class extends (0, mock_1.mock)() {
        };
        let documents;
        const nullLogService = new log_1.NullLogService();
        setup(() => {
            const documentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors((0, testRPCProtocol_1.SingleProxyRPCProtocol)(null), new log_1.NullLogService());
            documentsAndEditors.$acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        isDirty: false,
                        languageId: 'foo',
                        uri: resource,
                        versionId: 1,
                        lines: ['foo'],
                        EOL: '\n',
                    }]
            });
            documents = new extHostDocuments_1.ExtHostDocuments((0, testRPCProtocol_1.SingleProxyRPCProtocol)(null), documentsAndEditors);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('no listeners, no problem', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => assert.ok(true));
        });
        test('event delivery', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let event;
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.ok(event);
                assert.strictEqual(event.reason, extHostTypes_1.TextDocumentSaveReason.Manual);
                assert.strictEqual(typeof event.waitUntil, 'function');
            });
        });
        test('event delivery, immutable', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let event;
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.ok(event);
                assert.throws(() => { event.document = null; });
            });
        });
        test('event delivery, bad listener', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                throw new Error('💀');
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub.dispose();
                const [first] = values;
                assert.strictEqual(first, false);
            });
        });
        test('event delivery, bad listener doesn\'t prevent more events', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            const sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                throw new Error('💀');
            });
            let event;
            const sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub1.dispose();
                sub2.dispose();
                assert.ok(event);
            });
        });
        test('event delivery, in subscriber order', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let counter = 0;
            const sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                assert.strictEqual(counter++, 0);
            });
            const sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                assert.strictEqual(counter++, 1);
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub1.dispose();
                sub2.dispose();
            });
        });
        test('event delivery, ignore bad listeners', async () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits, { timeout: 5, errors: 1 });
            let callCount = 0;
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                callCount += 1;
                throw new Error('boom');
            });
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            sub.dispose();
            assert.strictEqual(callCount, 2);
        });
        test('event delivery, overall timeout', async function () {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits, { timeout: 20, errors: 5 });
            // let callCount = 0;
            const calls = [];
            const sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                calls.push(1);
            });
            const sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                calls.push(2);
                event.waitUntil(timeout(100));
            });
            const sub3 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                calls.push(3);
            });
            const values = await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            sub1.dispose();
            sub2.dispose();
            sub3.dispose();
            assert.deepStrictEqual(calls, [1, 2]);
            assert.strictEqual(values.length, 2);
        });
        test('event delivery, waitUntil', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                event.waitUntil(timeout(10));
                event.waitUntil(timeout(10));
                event.waitUntil(timeout(10));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
            });
        });
        test('event delivery, waitUntil must be called sync', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                event.waitUntil(new Promise((resolve, reject) => {
                    setTimeout(() => {
                        try {
                            assert.throws(() => event.waitUntil(timeout(10)));
                            resolve(undefined);
                        }
                        catch (e) {
                            reject(e);
                        }
                    }, 10);
                }));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
            });
        });
        test('event delivery, waitUntil will timeout', function () {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits, { timeout: 5, errors: 3 });
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                event.waitUntil(timeout(100));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub.dispose();
                const [first] = values;
                assert.strictEqual(first, false);
            });
        });
        test('event delivery, waitUntil failure handling', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            const sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                e.waitUntil(Promise.reject(new Error('dddd')));
            });
            let event;
            const sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                assert.ok(event);
                sub1.dispose();
                sub2.dispose();
            });
        });
        test('event delivery, pushEdits sync', () => {
            let dto;
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, new class extends (0, mock_1.mock)() {
                $tryApplyWorkspaceEdit(_edits) {
                    dto = _edits;
                    return Promise.resolve(true);
                }
            });
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.setEndOfLine(extHostTypes_1.EndOfLine.CRLF)]));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.strictEqual(dto.edits.length, 2);
                assert.ok(dto.edits[0].textEdit);
                assert.ok(dto.edits[1].textEdit);
            });
        });
        test('event delivery, concurrent change', () => {
            let edits;
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, new class extends (0, mock_1.mock)() {
                $tryApplyWorkspaceEdit(_edits) {
                    edits = _edits;
                    return Promise.resolve(true);
                }
            });
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                // concurrent change from somewhere
                documents.$acceptModelChanged(resource, {
                    changes: [{
                            range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
                            rangeOffset: undefined,
                            rangeLength: undefined,
                            text: 'bar'
                        }],
                    eol: undefined,
                    versionId: 2,
                    isRedoing: false,
                    isUndoing: false,
                }, true);
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub.dispose();
                assert.strictEqual(edits, undefined);
                assert.strictEqual(values[0], false);
            });
        });
        test('event delivery, two listeners -> two document states', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, new class extends (0, mock_1.mock)() {
                $tryApplyWorkspaceEdit(dto) {
                    for (const edit of dto.edits) {
                        const uri = uri_1.URI.revive(edit.resource);
                        const { text, range } = edit.textEdit;
                        documents.$acceptModelChanged(uri, {
                            changes: [{
                                    range,
                                    text,
                                    rangeOffset: undefined,
                                    rangeLength: undefined,
                                }],
                            eol: undefined,
                            versionId: documents.getDocumentData(uri).version + 1,
                            isRedoing: false,
                            isUndoing: false,
                        }, true);
                        // }
                    }
                    return Promise.resolve(true);
                }
            });
            const document = documents.getDocument(resource);
            const sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                // the document state we started with
                assert.strictEqual(document.version, 1);
                assert.strictEqual(document.getText(), 'foo');
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
            });
            const sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                // the document state AFTER the first listener kicked in
                assert.strictEqual(document.version, 2);
                assert.strictEqual(document.getText(), 'barfoo');
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub1.dispose();
                sub2.dispose();
                // the document state AFTER eventing is done
                assert.strictEqual(document.version, 3);
                assert.strictEqual(document.getText(), 'barbarfoo');
            });
        });
        test('Log failing listener', function () {
            let didLogSomething = false;
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(new class extends log_1.NullLogService {
                error(message, ...args) {
                    didLogSomething = true;
                }
            }, documents, mainThreadBulkEdits);
            const sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                throw new Error('boom');
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.strictEqual(didLogSomething, true);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50U2F2ZVBhcnRpY2lwYW50LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL2V4dEhvc3REb2N1bWVudFNhdmVQYXJ0aWNpcGFudC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQW1CQSxTQUFTLE9BQU8sQ0FBQyxDQUFTO1FBQ3pCLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVELEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLEVBQUU7UUFFNUMsTUFBTSxRQUFRLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxNQUFNLG1CQUFtQixHQUFHLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUE0QjtTQUFJLENBQUM7UUFDbkYsSUFBSSxTQUEyQixDQUFDO1FBQ2hDLE1BQU0sY0FBYyxHQUFHLElBQUksb0JBQWMsRUFBRSxDQUFDO1FBRTVDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLG1CQUFtQixHQUFHLElBQUksdURBQTBCLENBQUMsSUFBQSx3Q0FBc0IsRUFBQyxJQUFJLENBQUMsRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxDQUFDO1lBQy9HLG1CQUFtQixDQUFDLCtCQUErQixDQUFDO2dCQUNuRCxjQUFjLEVBQUUsQ0FBQzt3QkFDaEIsT0FBTyxFQUFFLEtBQUs7d0JBQ2QsVUFBVSxFQUFFLEtBQUs7d0JBQ2pCLEdBQUcsRUFBRSxRQUFRO3dCQUNiLFNBQVMsRUFBRSxDQUFDO3dCQUNaLEtBQUssRUFBRSxDQUFDLEtBQUssQ0FBQzt3QkFDZCxHQUFHLEVBQUUsSUFBSTtxQkFDVCxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1lBQ0gsU0FBUyxHQUFHLElBQUksbUNBQWdCLENBQUMsSUFBQSx3Q0FBc0IsRUFBQyxJQUFJLENBQUMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3JGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7WUFDckMsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDdkcsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2xHLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUMzQixNQUFNLFdBQVcsR0FBRyxJQUFJLCtEQUE4QixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUV2RyxJQUFJLEtBQXVDLENBQUM7WUFDNUMsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUMzRixLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzlFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFZCxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNqQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUscUNBQXNCLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxLQUFLLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3hELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLE1BQU0sV0FBVyxHQUFHLElBQUksK0RBQThCLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBRXZHLElBQUksS0FBdUMsQ0FBQztZQUM1QyxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQzNGLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sV0FBVyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsOEJBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDOUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUVkLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUksS0FBSyxDQUFDLFFBQWdCLEdBQUcsSUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLEVBQUU7WUFDekMsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFdkcsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUMzRixNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2xGLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFZCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDO2dCQUN2QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsQyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJEQUEyRCxFQUFFLEdBQUcsRUFBRTtZQUN0RSxNQUFNLFdBQVcsR0FBRyxJQUFJLCtEQUE4QixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUV2RyxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQzVGLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkIsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLEtBQXVDLENBQUM7WUFDNUMsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUM1RixLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzlFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRWYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtZQUNoRCxNQUFNLFdBQVcsR0FBRyxJQUFJLCtEQUE4QixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUV2RyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7WUFDaEIsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxLQUFLO2dCQUNoRyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxLQUFLO2dCQUNoRyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUM5RSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdkQsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVsSSxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDbEIsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxLQUFLO2dCQUMvRixTQUFTLElBQUksQ0FBQyxDQUFDO2dCQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekIsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDO1lBQ3BFLE1BQU0sV0FBVyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsOEJBQXNCLENBQUM7WUFDcEUsTUFBTSxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQztZQUNwRSxNQUFNLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDO1lBRXBFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNkLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEtBQUs7WUFDNUMsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVuSSxxQkFBcUI7WUFDckIsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO1lBQzNCLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsS0FBSztnQkFDaEcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxLQUFLO2dCQUNoRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNkLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDL0IsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLEtBQUs7Z0JBQ2hHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sTUFBTSxHQUFHLE1BQU0sV0FBVyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsOEJBQXNCLENBQUM7WUFDbkYsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLE1BQU0sV0FBVyxHQUFHLElBQUksK0RBQThCLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBRXZHLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsS0FBSztnQkFFL0YsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0IsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0IsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5QixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sV0FBVyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsOEJBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDOUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsQ0FBQyxDQUFDLENBQUM7UUFFSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLEVBQUU7WUFDMUQsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFdkcsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxLQUFLO2dCQUUvRixLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFZLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUMxRCxVQUFVLENBQUMsR0FBRyxFQUFFO3dCQUNmLElBQUksQ0FBQzs0QkFDSixNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDbEQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUNwQixDQUFDO3dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7NEJBQ1osTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNYLENBQUM7b0JBRUYsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNSLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sV0FBVyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsOEJBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDOUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3Q0FBd0MsRUFBRTtZQUU5QyxNQUFNLFdBQVcsR0FBRyxJQUFJLCtEQUE4QixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRWxJLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsS0FBSztnQkFDL0YsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMvQixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sV0FBVyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsOEJBQXNCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNsRixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRWQsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQztnQkFDdkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7WUFDdkQsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFdkcsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUM1RixDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxLQUF1QyxDQUFDO1lBQzVDLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDNUYsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNYLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUM5RSxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNqQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1lBRTNDLElBQUksR0FBc0IsQ0FBQztZQUMzQixNQUFNLFdBQVcsR0FBRyxJQUFJLCtEQUE4QixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQThCO2dCQUNySSxzQkFBc0IsQ0FBQyxNQUF5QjtvQkFDL0MsR0FBRyxHQUFHLE1BQU0sQ0FBQztvQkFDYixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLENBQUM7YUFDRCxDQUFDLENBQUM7WUFFSCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQzNGLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHVCQUFRLENBQUMsTUFBTSxDQUFDLElBQUksdUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNFLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHVCQUFRLENBQUMsWUFBWSxDQUFDLHdCQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkUsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLDhCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzlFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFZCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLENBQUMsRUFBRSxDQUF5QixHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLENBQUMsRUFBRSxDQUF5QixHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzNELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1lBRTlDLElBQUksS0FBd0IsQ0FBQztZQUM3QixNQUFNLFdBQVcsR0FBRyxJQUFJLCtEQUE4QixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQThCO2dCQUNySSxzQkFBc0IsQ0FBQyxNQUF5QjtvQkFDL0MsS0FBSyxHQUFHLE1BQU0sQ0FBQztvQkFDZixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLENBQUM7YUFDRCxDQUFDLENBQUM7WUFFSCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBRTNGLG1DQUFtQztnQkFDbkMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRTtvQkFDdkMsT0FBTyxFQUFFLENBQUM7NEJBQ1QsS0FBSyxFQUFFLEVBQUUsZUFBZSxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRTs0QkFDN0UsV0FBVyxFQUFFLFNBQVU7NEJBQ3ZCLFdBQVcsRUFBRSxTQUFVOzRCQUN2QixJQUFJLEVBQUUsS0FBSzt5QkFDWCxDQUFDO29CQUNGLEdBQUcsRUFBRSxTQUFVO29CQUNmLFNBQVMsRUFBRSxDQUFDO29CQUNaLFNBQVMsRUFBRSxLQUFLO29CQUNoQixTQUFTLEVBQUUsS0FBSztpQkFDaEIsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFVCxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyx1QkFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLHVCQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVFLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2xGLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFZCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEMsQ0FBQyxDQUFDLENBQUM7UUFFSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzREFBc0QsRUFBRSxHQUFHLEVBQUU7WUFFakUsTUFBTSxXQUFXLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUE4QjtnQkFDckksc0JBQXNCLENBQUMsR0FBc0I7b0JBRTVDLEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUU5QixNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUF5QixJQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQy9ELE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQTJCLElBQUssQ0FBQyxRQUFRLENBQUM7d0JBQy9ELFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUU7NEJBQ2xDLE9BQU8sRUFBRSxDQUFDO29DQUNULEtBQUs7b0NBQ0wsSUFBSTtvQ0FDSixXQUFXLEVBQUUsU0FBVTtvQ0FDdkIsV0FBVyxFQUFFLFNBQVU7aUNBQ3ZCLENBQUM7NEJBQ0YsR0FBRyxFQUFFLFNBQVU7NEJBQ2YsU0FBUyxFQUFFLFNBQVMsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFFLENBQUMsT0FBTyxHQUFHLENBQUM7NEJBQ3RELFNBQVMsRUFBRSxLQUFLOzRCQUNoQixTQUFTLEVBQUUsS0FBSzt5QkFDaEIsRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDVCxJQUFJO29CQUNMLENBQUM7b0JBRUQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVqRCxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMscUNBQXdCLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQzVGLHFDQUFxQztnQkFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFOUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsdUJBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSx1QkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1RSxDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDNUYsd0RBQXdEO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUVqRCxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyx1QkFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLHVCQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVFLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2xGLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRWYsNENBQTRDO2dCQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1FBRUosQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0JBQXNCLEVBQUU7WUFDNUIsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO1lBQzVCLE1BQU0sV0FBVyxHQUFHLElBQUksK0RBQThCLENBQUMsSUFBSSxLQUFNLFNBQVEsb0JBQWM7Z0JBQzdFLEtBQUssQ0FBQyxPQUF1QixFQUFFLEdBQUcsSUFBVztvQkFDckQsZUFBZSxHQUFHLElBQUksQ0FBQztnQkFDeEIsQ0FBQzthQUNELEVBQUUsU0FBUyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFHbkMsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUMzRixNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pCLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxXQUFXLENBQUMsa0JBQWtCLENBQUMsUUFBUSw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUM5RSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=