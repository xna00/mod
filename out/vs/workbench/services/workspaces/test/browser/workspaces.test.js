/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/services/workspaces/browser/workspaces"], function (require, exports, assert, uri_1, utils_1, workspaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workspaces', () => {
        test('workspace identifiers are stable', function () {
            // workspace identifier
            assert.strictEqual((0, workspaces_1.getWorkspaceIdentifier)(uri_1.URI.parse('vscode-remote:/hello/test')).id, '474434e4');
            // single folder identifier
            assert.strictEqual((0, workspaces_1.getSingleFolderWorkspaceIdentifier)(uri_1.URI.parse('vscode-remote:/hello/test'))?.id, '474434e4');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya3NwYWNlcy90ZXN0L2Jyb3dzZXIvd29ya3NwYWNlcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLEtBQUssQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1FBQ3hCLElBQUksQ0FBQyxrQ0FBa0MsRUFBRTtZQUV4Qyx1QkFBdUI7WUFDdkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLG1DQUFzQixFQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVsRywyQkFBMkI7WUFDM0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLCtDQUFrQyxFQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNoSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9