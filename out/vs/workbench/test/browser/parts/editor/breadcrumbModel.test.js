/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/editor/breadcrumbsModel", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/files/common/files", "vs/workbench/test/common/workbenchTestServices", "vs/platform/workspace/test/common/testWorkspace", "vs/base/test/common/mock", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, workspace_1, breadcrumbsModel_1, testConfigurationService_1, files_1, workbenchTestServices_1, testWorkspace_1, mock_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Breadcrumb Model', function () {
        let model;
        const workspaceService = new workbenchTestServices_1.TestContextService(new testWorkspace_1.Workspace('ffff', [new workspace_1.WorkspaceFolder({ uri: uri_1.URI.parse('foo:/bar/baz/ws'), name: 'ws', index: 0 })]));
        const configService = new class extends testConfigurationService_1.TestConfigurationService {
            getValue(...args) {
                if (args[0] === 'breadcrumbs.filePath') {
                    return 'on';
                }
                if (args[0] === 'breadcrumbs.symbolPath') {
                    return 'on';
                }
                return super.getValue(...args);
            }
            updateValue() {
                return Promise.resolve();
            }
        };
        teardown(function () {
            model.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('only uri, inside workspace', function () {
            model = new breadcrumbsModel_1.BreadcrumbsModel(uri_1.URI.parse('foo:/bar/baz/ws/some/path/file.ts'), undefined, configService, workspaceService, new class extends (0, mock_1.mock)() {
            });
            const elements = model.getElements();
            assert.strictEqual(elements.length, 3);
            const [one, two, three] = elements;
            assert.strictEqual(one.kind, files_1.FileKind.FOLDER);
            assert.strictEqual(two.kind, files_1.FileKind.FOLDER);
            assert.strictEqual(three.kind, files_1.FileKind.FILE);
            assert.strictEqual(one.uri.toString(), 'foo:/bar/baz/ws/some');
            assert.strictEqual(two.uri.toString(), 'foo:/bar/baz/ws/some/path');
            assert.strictEqual(three.uri.toString(), 'foo:/bar/baz/ws/some/path/file.ts');
        });
        test('display uri matters for FileElement', function () {
            model = new breadcrumbsModel_1.BreadcrumbsModel(uri_1.URI.parse('foo:/bar/baz/ws/some/PATH/file.ts'), undefined, configService, workspaceService, new class extends (0, mock_1.mock)() {
            });
            const elements = model.getElements();
            assert.strictEqual(elements.length, 3);
            const [one, two, three] = elements;
            assert.strictEqual(one.kind, files_1.FileKind.FOLDER);
            assert.strictEqual(two.kind, files_1.FileKind.FOLDER);
            assert.strictEqual(three.kind, files_1.FileKind.FILE);
            assert.strictEqual(one.uri.toString(), 'foo:/bar/baz/ws/some');
            assert.strictEqual(two.uri.toString(), 'foo:/bar/baz/ws/some/PATH');
            assert.strictEqual(three.uri.toString(), 'foo:/bar/baz/ws/some/PATH/file.ts');
        });
        test('only uri, outside workspace', function () {
            model = new breadcrumbsModel_1.BreadcrumbsModel(uri_1.URI.parse('foo:/outside/file.ts'), undefined, configService, workspaceService, new class extends (0, mock_1.mock)() {
            });
            const elements = model.getElements();
            assert.strictEqual(elements.length, 2);
            const [one, two] = elements;
            assert.strictEqual(one.kind, files_1.FileKind.FOLDER);
            assert.strictEqual(two.kind, files_1.FileKind.FILE);
            assert.strictEqual(one.uri.toString(), 'foo:/outside');
            assert.strictEqual(two.uri.toString(), 'foo:/outside/file.ts');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWRjcnVtYk1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC90ZXN0L2Jyb3dzZXIvcGFydHMvZWRpdG9yL2JyZWFkY3J1bWJNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRTtRQUV6QixJQUFJLEtBQXVCLENBQUM7UUFDNUIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLDBDQUFrQixDQUFDLElBQUkseUJBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLDJCQUFlLENBQUMsRUFBRSxHQUFHLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0osTUFBTSxhQUFhLEdBQUcsSUFBSSxLQUFNLFNBQVEsbURBQXdCO1lBQ3RELFFBQVEsQ0FBQyxHQUFHLElBQVc7Z0JBQy9CLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLHNCQUFzQixFQUFFLENBQUM7b0JBQ3hDLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssd0JBQXdCLEVBQUUsQ0FBQztvQkFDMUMsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFDRCxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUNoQyxDQUFDO1lBQ1EsV0FBVztnQkFDbkIsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDMUIsQ0FBQztTQUNELENBQUM7UUFFRixRQUFRLENBQUM7WUFDUixLQUFLLENBQUMsT0FBTyxFQUFF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