/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/mock", "vs/base/common/event", "vs/base/common/uri", "vs/workbench/api/browser/mainThreadBulkEdits", "vs/platform/uriIdentity/common/uriIdentityService", "vs/base/test/common/utils"], function (require, exports, assert, mock_1, event_1, uri_1, mainThreadBulkEdits_1, uriIdentityService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadBulkEdits', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('"Rename failed to apply edits" in monorepo with pnpm #158845', function () {
            const fileService = new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidChangeFileSystemProviderCapabilities = event_1.Event.None;
                    this.onDidChangeFileSystemProviderRegistrations = event_1.Event.None;
                }
                hasProvider(uri) {
                    return true;
                }
                hasCapability(resource, capability) {
                    // if (resource.scheme === 'case' && capability === FileSystemProviderCapabilities.PathCaseSensitive) {
                    // 	return false;
                    // }
                    // NO capabilities, esp not being case-sensitive
                    return false;
                }
            };
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            const edits = [
                { resource: uri_1.URI.from({ scheme: 'case', path: '/hello/WORLD/foo.txt' }), textEdit: { range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }, text: 'sss' }, versionId: undefined },
                { resource: uri_1.URI.from({ scheme: 'case', path: '/heLLO/world/fOO.txt' }), textEdit: { range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }, text: 'sss' }, versionId: undefined },
                { resource: uri_1.URI.from({ scheme: 'case', path: '/other/path.txt' }), textEdit: { range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }, text: 'sss' }, versionId: undefined },
                { resource: uri_1.URI.from({ scheme: 'foo', path: '/other/path.txt' }), textEdit: { range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }, text: 'sss' }, versionId: undefined },
            ];
            const out = (0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)({ edits }, uriIdentityService);
            assert.strictEqual(out.edits[0].resource.path, '/hello/WORLD/foo.txt');
            assert.strictEqual(out.edits[1].resource.path, '/hello/WORLD/foo.txt'); // the FIRST occurrence defined the shape!
            assert.strictEqual(out.edits[2].resource.path, '/other/path.txt');
            assert.strictEqual(out.edits[3].resource.path, '/other/path.txt');
            uriIdentityService.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEJ1bGtFZGl0cy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9tYWluVGhyZWFkQnVsa0VkaXRzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLHFCQUFxQixFQUFFO1FBRTVCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsOERBQThELEVBQUU7WUFHcEUsTUFBTSxXQUFXLEdBQUcsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQWdCO2dCQUFsQzs7b0JBQ2QsOENBQXlDLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztvQkFDdkQsK0NBQTBDLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztnQkFhbEUsQ0FBQztnQkFYUyxXQUFXLENBQUMsR0FBUTtvQkFDNUIsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFFUSxhQUFhLENBQUMsUUFBYSxFQUFFLFVBQTBDO29CQUMvRSx1R0FBdUc7b0JBQ3ZHLGlCQUFpQjtvQkFDakIsSUFBSTtvQkFDSixnREFBZ0Q7b0JBQ2hELE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7YUFDRCxDQUFDO1lBRUYsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLHVDQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRS9ELE1BQU0sS0FBSyxHQUE0QjtnQkFDdEMsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLHNCQUFzQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxlQUFlLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUU7Z0JBQ3hNLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxzQkFBc0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsZUFBZSxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFO2dCQUN4TSxFQUFFLFFBQVEsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLGVBQWUsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRTtnQkFDbk0sRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxlQUFlLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUU7YUFDbE0sQ0FBQztZQUdGLE1BQU0sR0FBRyxHQUFHLElBQUEsNENBQXNCLEVBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBRWxFLE1BQU0sQ0FBQyxXQUFXLENBQXNCLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFFLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1lBQzdGLE1BQU0sQ0FBQyxXQUFXLENBQXNCLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFFLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsMENBQTBDO1lBQ3hJLE1BQU0sQ0FBQyxXQUFXLENBQXNCLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFFLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3hGLE1BQU0sQ0FBQyxXQUFXLENBQXNCLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFFLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBRXhGLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRTlCLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==