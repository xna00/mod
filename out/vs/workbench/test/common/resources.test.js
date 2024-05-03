/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/common/resources", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, lifecycle_1, uri_1, utils_1, testConfigurationService_1, resources_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ResourceGlobMatcher', () => {
        const SETTING = 'test.matcher';
        let contextService;
        let configurationService;
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            contextService = new workbenchTestServices_1.TestContextService();
            configurationService = new testConfigurationService_1.TestConfigurationService({
                [SETTING]: {
                    '**/*.md': true,
                    '**/*.txt': false
                }
            });
        });
        teardown(() => {
            disposables.clear();
        });
        test('Basics', async () => {
            const matcher = disposables.add(new resources_1.ResourceGlobMatcher(() => configurationService.getValue(SETTING), e => e.affectsConfiguration(SETTING), contextService, configurationService));
            // Matching
            assert.equal(matcher.matches(uri_1.URI.file('/foo/bar')), false);
            assert.equal(matcher.matches(uri_1.URI.file('/foo/bar.md')), true);
            assert.equal(matcher.matches(uri_1.URI.file('/foo/bar.txt')), false);
            // Events
            let eventCounter = 0;
            disposables.add(matcher.onExpressionChange(() => eventCounter++));
            await configurationService.setUserConfiguration(SETTING, { '**/*.foo': true });
            configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: (key) => key === SETTING });
            assert.equal(eventCounter, 1);
            assert.equal(matcher.matches(uri_1.URI.file('/foo/bar.md')), false);
            assert.equal(matcher.matches(uri_1.URI.file('/foo/bar.foo')), true);
            await configurationService.setUserConfiguration(SETTING, undefined);
            configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: (key) => key === SETTING });
            assert.equal(eventCounter, 2);
            assert.equal(matcher.matches(uri_1.URI.file('/foo/bar.md')), false);
            assert.equal(matcher.matches(uri_1.URI.file('/foo/bar.foo')), false);
            await configurationService.setUserConfiguration(SETTING, {
                '**/*.md': true,
                '**/*.txt': false,
                'C:/bar/**': true,
                '/bar/**': true
            });
            configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: (key) => key === SETTING });
            assert.equal(matcher.matches(uri_1.URI.file('/bar/foo.1')), true);
            assert.equal(matcher.matches(uri_1.URI.file('C:/bar/foo.1')), true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC90ZXN0L2NvbW1vbi9yZXNvdXJjZXMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxLQUFLLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1FBRWpDLE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQztRQUUvQixJQUFJLGNBQXdDLENBQUM7UUFDN0MsSUFBSSxvQkFBOEMsQ0FBQztRQUVuRCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsY0FBYyxHQUFHLElBQUksMENBQWtCLEVBQUUsQ0FBQztZQUMxQyxvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixDQUFDO2dCQUNuRCxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNWLFNBQVMsRUFBRSxJQUFJO29CQUNmLFVBQVUsRUFBRSxLQUFLO2lCQUNqQjthQUNELENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekIsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLCtCQUFtQixDQUFDLEdBQUcsRUFBRSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxjQUFjLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBRW5MLFdBQVc7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