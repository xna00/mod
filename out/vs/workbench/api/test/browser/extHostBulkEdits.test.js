define(["require", "exports", "assert", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHost.protocol", "vs/base/common/uri", "vs/base/test/common/mock", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/test/common/testRPCProtocol", "vs/platform/log/common/log", "vs/workbench/api/common/extHostBulkEdits", "vs/workbench/services/extensions/common/extensions", "vs/base/test/common/utils"], function (require, exports, assert, extHostTypes, extHost_protocol_1, uri_1, mock_1, extHostDocumentsAndEditors_1, testRPCProtocol_1, log_1, extHostBulkEdits_1, extensions_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostBulkEdits.applyWorkspaceEdit', () => {
        const resource = uri_1.URI.parse('foo:bar');
        let bulkEdits;
        let workspaceResourceEdits;
        setup(() => {
            workspaceResourceEdits = null;
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadBulkEdits, new class extends (0, mock_1.mock)() {
                $tryApplyWorkspaceEdit(_workspaceResourceEdits) {
                    workspaceResourceEdits = _workspaceResourceEdits;
                    return Promise.resolve(true);
                }
            });
            const documentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors((0, testRPCProtocol_1.SingleProxyRPCProtocol)(null), new log_1.NullLogService());
            documentsAndEditors.$acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        isDirty: false,
                        languageId: 'foo',
                        uri: resource,
                        versionId: 1337,
                        lines: ['foo'],
                        EOL: '\n',
                    }]
            });
            bulkEdits = new extHostBulkEdits_1.ExtHostBulkEdits(rpcProtocol, documentsAndEditors);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('uses version id if document available', async () => {
            const edit = new extHostTypes.WorkspaceEdit();
            edit.replace(resource, new extHostTypes.Range(0, 0, 0, 0), 'hello');
            await bulkEdits.applyWorkspaceEdit(edit, extensions_1.nullExtensionDescription, undefined);
            assert.strictEqual(workspaceResourceEdits.edits.length, 1);
            const [first] = workspaceResourceEdits.edits;
            assert.strictEqual(first.versionId, 1337);
        });
        test('does not use version id if document is not available', async () => {
            const edit = new extHostTypes.WorkspaceEdit();
            edit.replace(uri_1.URI.parse('foo:bar2'), new extHostTypes.Range(0, 0, 0, 0), 'hello');
            await bulkEdits.applyWorkspaceEdit(edit, extensions_1.nullExtensionDescription, undefined);
            assert.strictEqual(workspaceResourceEdits.edits.length, 1);
            const [first] = workspaceResourceEdits.edits;
            assert.ok(typeof first.versionId === 'undefined');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEJ1bGtFZGl0cy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9leHRIb3N0QnVsa0VkaXRzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBZ0JBLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7UUFFakQsTUFBTSxRQUFRLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxJQUFJLFNBQTJCLENBQUM7UUFDaEMsSUFBSSxzQkFBeUMsQ0FBQztRQUU5QyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1Ysc0JBQXNCLEdBQUcsSUFBSyxDQUFDO1lBRS9CLE1BQU0sV0FBVyxHQUFHLElBQUksaUNBQWUsRUFBRSxDQUFDO1lBQzFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsOEJBQVcsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBNEI7Z0JBQ3pGLHNCQUFzQixDQUFDLHVCQUEwQztvQkFDekUsc0JBQXNCLEdBQUcsdUJBQXVCLENBQUM7b0JBQ2pELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUIsQ0FBQzthQUNELENBQUMsQ0FBQztZQUNILE1BQU0sbUJBQW1CLEdBQUcsSUFBSSx1REFBMEIsQ0FBQyxJQUFBLHdDQUFzQixFQUFDLElBQUksQ0FBQyxFQUFFLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUM7WUFDL0csbUJBQW1CLENBQUMsK0JBQStCLENBQUM7Z0JBQ25ELGNBQWMsRUFBRSxDQUFDO3dCQUNoQixPQUFPLEVBQUUsS0FBSzt3QkFDZCxVQUFVLEVBQUUsS0FBSzt3QkFDakIsR0FBRyxFQUFFLFFBQVE7d0JBQ2IsU0FBUyxFQUFFLElBQUk7d0JBQ2YsS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDO3dCQUNkLEdBQUcsRUFBRSxJQUFJO3FCQUNULENBQUM7YUFDRixDQUFDLENBQUM7WUFDSCxTQUFTLEdBQUcsSUFBSSxtQ0FBZ0IsQ0FBQyxXQUFXLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUNwRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsdUNBQXVDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDOUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sU0FBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxxQ0FBd0IsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RSxNQUFNLENBQUMsV0FBVyxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUM3QyxNQUFNLENBQUMsV0FBVyxDQUF5QixLQUFNLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNEQUFzRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3ZFLE1BQU0sSUFBSSxHQUFHLElBQUksWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzlDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakYsTUFBTSxTQUFTLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLHFDQUF3QixFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sQ0FBQyxXQUFXLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBK0IsS0FBTSxDQUFDLFNBQVMsS0FBSyxXQUFXLENBQUMsQ0FBQztRQUM1RSxDQUFDLENBQUMsQ0FBQztJQUVKLENBQUMsQ0FBQyxDQUFDIn0=