/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/workspace/common/workspace"], function (require, exports, assert, uri_1, utils_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workspaces', () => {
        test('reviveIdentifier', () => {
            const serializedWorkspaceIdentifier = { id: 'id', configPath: uri_1.URI.file('foo').toJSON() };
            assert.strictEqual((0, workspace_1.isWorkspaceIdentifier)((0, workspace_1.reviveIdentifier)(serializedWorkspaceIdentifier)), true);
            const serializedSingleFolderWorkspaceIdentifier = { id: 'id', uri: uri_1.URI.file('foo').toJSON() };
            assert.strictEqual((0, workspace_1.isSingleFolderWorkspaceIdentifier)((0, workspace_1.reviveIdentifier)(serializedSingleFolderWorkspaceIdentifier)), true);
            const serializedEmptyWorkspaceIdentifier = { id: 'id' };
            assert.strictEqual((0, workspace_1.reviveIdentifier)(serializedEmptyWorkspaceIdentifier).id, serializedEmptyWorkspaceIdentifier.id);
            assert.strictEqual((0, workspace_1.isWorkspaceIdentifier)(serializedEmptyWorkspaceIdentifier), false);
            assert.strictEqual((0, workspace_1.isSingleFolderWorkspaceIdentifier)(serializedEmptyWorkspaceIdentifier), false);
            assert.strictEqual((0, workspace_1.reviveIdentifier)(undefined), undefined);
        });
        test('hasWorkspaceFileExtension', () => {
            assert.strictEqual((0, workspace_1.hasWorkspaceFileExtension)('something'), false);
            assert.strictEqual((0, workspace_1.hasWorkspaceFileExtension)('something.code-workspace'), true);
        });
        test('toWorkspaceIdentifier', () => {
            let identifier = (0, workspace_1.toWorkspaceIdentifier)({ id: 'id', folders: [] });
            assert.ok(identifier);
            assert.ok((0, workspace_1.isEmptyWorkspaceIdentifier)(identifier));
            assert.ok(!(0, workspace_1.isWorkspaceIdentifier)(identifier));
            assert.ok(!(0, workspace_1.isWorkspaceIdentifier)(identifier));
            identifier = (0, workspace_1.toWorkspaceIdentifier)({ id: 'id', folders: [{ index: 0, name: 'test', toResource: () => uri_1.URI.file('test'), uri: uri_1.URI.file('test') }] });
            assert.ok(identifier);
            assert.ok((0, workspace_1.isSingleFolderWorkspaceIdentifier)(identifier));
            assert.ok(!(0, workspace_1.isWorkspaceIdentifier)(identifier));
            identifier = (0, workspace_1.toWorkspaceIdentifier)({ id: 'id', configuration: uri_1.URI.file('test.code-workspace'), folders: [] });
            assert.ok(identifier);
            assert.ok(!(0, workspace_1.isSingleFolderWorkspaceIdentifier)(identifier));
            assert.ok((0, workspace_1.isWorkspaceIdentifier)(identifier));
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93b3Jrc3BhY2VzL3Rlc3QvY29tbW9uL3dvcmtzcGFjZXMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtRQUV4QixJQUFJLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1lBQzdCLE1BQU0sNkJBQTZCLEdBQW1DLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO1lBQ3pILE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxpQ0FBcUIsRUFBQyxJQUFBLDRCQUFnQixFQUFDLDZCQUE2QixDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVqRyxNQUFNLHlDQUF5QyxHQUErQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztZQUMxSSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsNkNBQWlDLEVBQUMsSUFBQSw0QkFBZ0IsRUFBQyx5Q0FBeUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFekgsTUFBTSxrQ0FBa0MsR0FBOEIsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDbkYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDRCQUFnQixFQUFDLGtDQUFrQyxDQUFDLENBQUMsRUFBRSxFQUFFLGtDQUFrQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25ILE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxp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