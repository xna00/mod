/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/common/path", "vs/base/common/uri", "vs/base/test/node/testUtils", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/rawSearchService"], function (require, exports, assert, network_1, path, uri_1, testUtils_1, search_1, rawSearchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TEST_FIXTURES = path.normalize(network_1.FileAccess.asFileUri('vs/workbench/services/search/test/node/fixtures').fsPath);
    const TEST_FIXTURES2 = path.normalize(network_1.FileAccess.asFileUri('vs/workbench/services/search/test/node/fixtures2').fsPath);
    const EXAMPLES_FIXTURES = path.join(TEST_FIXTURES, 'examples');
    const MORE_FIXTURES = path.join(TEST_FIXTURES, 'more');
    const TEST_ROOT_FOLDER = { folder: uri_1.URI.file(TEST_FIXTURES) };
    const ROOT_FOLDER_QUERY = [
        TEST_ROOT_FOLDER
    ];
    const MULTIROOT_QUERIES = [
        { folder: uri_1.URI.file(EXAMPLES_FIXTURES), folderName: 'examples_folder' },
        { folder: uri_1.URI.file(MORE_FIXTURES) }
    ];
    async function doSearchTest(query, expectedResultCount) {
        const svc = new rawSearchService_1.SearchService();
        const results = [];
        await svc.doFileSearch(query, e => {
            if (!(0, search_1.isProgressMessage)(e)) {
                if (Array.isArray(e)) {
                    results.push(...e);
                }
                else {
                    results.push(e);
                }
            }
        });
        assert.strictEqual(results.length, expectedResultCount, `rg ${results.length} !== ${expectedResultCount}`);
    }
    (0, testUtils_1.flakySuite)('FileSearch-integration', function () {
        test('File - simple', () => {
            const config = {
                type: 1 /* QueryType.File */,
                folderQueries: ROOT_FOLDER_QUERY
            };
            return doSearchTest(config, 14);
        });
        test('File - filepattern', () => {
            const config = {
                type: 1 /* QueryType.File */,
                folderQueries: ROOT_FOLDER_QUERY,
                filePattern: 'anotherfile'
            };
            return doSearchTest(config, 1);
        });
        test('File - exclude', () => {
            const config = {
                type: 1 /* QueryType.File */,
                folderQueries: ROOT_FOLDER_QUERY,
                filePattern: 'file',
                excludePattern: { '**/anotherfolder/**': true }
            };
            return doSearchTest(config, 2);
        });
        test('File - multiroot', () => {
            const config = {
                type: 1 /* QueryType.File */,
                folderQueries: MULTIROOT_QUERIES,
                filePattern: 'file',
                excludePattern: { '**/anotherfolder/**': true }
            };
            return doSearchTest(config, 2);
        });
        test('File - multiroot with folder name', () => {
            const config = {
                type: 1 /* QueryType.File */,
                folderQueries: MULTIROOT_QUERIES,
                filePattern: 'examples_folder anotherfile'
            };
            return doSearchTest(config, 1);
        });
        test('File - multiroot with folder name and sibling exclude', () => {
            const config = {
                type: 1 /* QueryType.File */,
                folderQueries: [
                    { folder: uri_1.URI.file(TEST_FIXTURES), folderName: 'folder1' },
                    { folder: uri_1.URI.file(TEST_FIXTURES2) }
                ],
                filePattern: 'folder1 site',
                excludePattern: { '*.css': { when: '$(basename).less' } }
            };
            return doSearchTest(config, 1);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVNlYXJjaC5pbnRlZ3JhdGlvblRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvdGVzdC9ub2RlL2ZpbGVTZWFyY2guaW50ZWdyYXRpb25UZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQVUsQ0FBQyxTQUFTLENBQUMsaURBQWlELENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNySCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFVLENBQUMsU0FBUyxDQUFDLGtEQUFrRCxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkgsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMvRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN2RCxNQUFNLGdCQUFnQixHQUFpQixFQUFFLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7SUFDM0UsTUFBTSxpQkFBaUIsR0FBbUI7UUFDekMsZ0JBQWdCO0tBQ2hCLENBQUM7SUFFRixNQUFNLGlCQUFpQixHQUFtQjtRQUN6QyxFQUFFLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFO1FBQ3RFLEVBQUUsTUFBTSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUU7S0FDbkMsQ0FBQztJQUVGLEtBQUssVUFBVSxZQUFZLENBQUMsS0FBaUIsRUFB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