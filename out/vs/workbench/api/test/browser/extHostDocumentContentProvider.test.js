/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/test/common/testRPCProtocol", "vs/platform/log/common/log", "vs/base/test/common/utils", "vs/workbench/api/common/extHostDocumentContentProviders", "vs/base/common/event", "vs/base/common/async", "vs/base/test/common/timeTravelScheduler"], function (require, exports, assert, uri_1, extHostDocumentsAndEditors_1, testRPCProtocol_1, log_1, utils_1, extHostDocumentContentProviders_1, event_1, async_1, timeTravelScheduler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostDocumentContentProvider', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const resource = uri_1.URI.parse('foo:bar');
        let documentContentProvider;
        let mainThreadContentProvider;
        const changes = [];
        setup(() => {
            changes.length = 0;
            mainThreadContentProvider = new class {
                $registerTextContentProvider(handle, scheme) {
                }
                $unregisterTextContentProvider(handle) {
                }
                async $onVirtualDocumentChange(uri, value) {
                    await (0, async_1.timeout)(10);
                    changes.push([uri, value]);
                }
                dispose() {
                    throw new Error('Method not implemented.');
                }
            };
            const ehContext = (0, testRPCProtocol_1.SingleProxyRPCProtocol)(mainThreadContentProvider);
            const documentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(ehContext, new log_1.NullLogService());
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
            documentContentProvider = new extHostDocumentContentProviders_1.ExtHostDocumentContentProvider(ehContext, documentsAndEditors, new log_1.NullLogService());
        });
        test('TextDocumentContentProvider drops onDidChange events when they happen quickly #179711', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async function () {
                const emitter = new event_1.Emitter();
                const contents = ['X', 'Y'];
                let counter = 0;
                let stack = 0;
                const d = documentContentProvider.registerTextDocumentContentProvider(resource.scheme, {
                    onDidChange: emitter.event,
                    async provideTextDocumentContent(_uri) {
                        assert.strictEqual(stack, 0);
                        stack++;
                        try {
                            await (0, async_1.timeout)(0);
                            return contents[counter++ % contents.length];
                        }
                        finally {
                            stack--;
                        }
                    }
                });
                emitter.fire(resource);
                emitter.fire(resource);
                await (0, async_1.timeout)(100);
                assert.strictEqual(changes.length, 2);
                assert.strictEqual(changes[0][1], 'X');
                assert.strictEqual(changes[1][1], 'Y');
                d.dispose();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50Q29udGVudFByb3ZpZGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL2V4dEhvc3REb2N1bWVudENvbnRlbnRQcm92aWRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLEVBQUU7UUFFNUMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLE1BQU0sUUFBUSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEMsSUFBSSx1QkFBdUQsQ0FBQztRQUM1RCxJQUFJLHlCQUFrRSxDQUFDO1FBQ3ZFLE1BQU0sT0FBTyxHQUEwQyxFQUFFLENBQUM7UUFFMUQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUVWLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBRW5CLHlCQUF5QixHQUFHLElBQUk7Z0JBQy9CLDRCQUE0QixDQUFDLE1BQWMsRUFBRSxNQUFjO2dCQUUzRCxDQUFDO2dCQUNELDhCQUE4QixDQUFDLE1BQWM7Z0JBRTdDLENBQUM7Z0JBQ0QsS0FBSyxDQUFDLHdCQUF3QixDQUFDLEdBQWtCLEVBQUUsS0FBYTtvQkFDL0QsTUFBTSxJQUFBLGVBQU8sRUFBQyxFQUFFLENBQUMsQ0FBQztvQkFDbEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixDQUFDO2dCQUNELE9BQU87b0JBQ04sTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO2FBQ0QsQ0FBQztZQUVGLE1BQU0sU0FBUyxHQUFHLElBQUEsd0NBQXNCLEVBQUMseUJBQXlC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