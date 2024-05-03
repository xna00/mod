/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/extpath", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/files/common/files"], function (require, exports, assert, extpath_1, platform_1, uri_1, utils_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files', () => {
        test('FileChangesEvent - basics', function () {
            const changes = [
                { resource: utils_1.toResource.call(this, '/foo/updated.txt'), type: 0 /* FileChangeType.UPDATED */ },
                { resource: utils_1.toResource.call(this, '/foo/otherupdated.txt'), type: 0 /* FileChangeType.UPDATED */ },
                { resource: utils_1.toResource.call(this, '/added.txt'), type: 1 /* FileChangeType.ADDED */ },
                { resource: utils_1.toResource.call(this, '/bar/deleted.txt'), type: 2 /* FileChangeType.DELETED */ },
                { resource: utils_1.toResource.call(this, '/bar/folder'), type: 2 /* FileChangeType.DELETED */ },
                { resource: utils_1.toResource.call(this, '/BAR/FOLDER'), type: 2 /* FileChangeType.DELETED */ }
            ];
            for (const ignorePathCasing of [false, true]) {
                const event = new files_1.FileChangesEvent(changes, ignorePathCasing);
                assert(!event.contains(utils_1.toResource.call(this, '/foo'), 0 /* FileChangeType.UPDATED */));
                assert(event.affects(utils_1.toResource.call(this, '/foo'), 0 /* FileChangeType.UPDATED */));
                assert(event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 0 /* FileChangeType.UPDATED */));
                assert(event.affects(utils_1.toResource.call(this, '/foo/updated.txt'), 0 /* FileChangeType.UPDATED */));
                assert(event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 0 /* FileChangeType.UPDATED */, 1 /* FileChangeType.ADDED */));
                assert(event.affects(utils_1.toResource.call(this, '/foo/updated.txt'), 0 /* FileChangeType.UPDATED */, 1 /* FileChangeType.ADDED */));
                assert(event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 0 /* FileChangeType.UPDATED */, 1 /* FileChangeType.ADDED */, 2 /* FileChangeType.DELETED */));
                assert(!event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 1 /* FileChangeType.ADDED */, 2 /* FileChangeType.DELETED */));
                assert(!event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 1 /* FileChangeType.ADDED */));
                assert(!event.contains(utils_1.toResource.call(this, '/foo/updated.txt'), 2 /* FileChangeType.DELETED */));
                assert(!event.affects(utils_1.toResource.call(this, '/foo/updated.txt'), 2 /* FileChangeType.DELETED */));
                assert(event.contains(utils_1.toResource.call(this, '/bar/folder'), 2 /* FileChangeType.DELETED */));
                assert(event.contains(utils_1.toResource.call(this, '/BAR/FOLDER'), 2 /* FileChangeType.DELETED */));
                assert(event.affects(utils_1.toResource.call(this, '/BAR'), 2 /* FileChangeType.DELETED */));
                if (ignorePathCasing) {
                    assert(event.contains(utils_1.toResource.call(this, '/BAR/folder'), 2 /* FileChangeType.DELETED */));
                    assert(event.affects(utils_1.toResource.call(this, '/bar'), 2 /* FileChangeType.DELETED */));
                }
                else {
                    assert(!event.contains(utils_1.toResource.call(this, '/BAR/folder'), 2 /* FileChangeType.DELETED */));
                    assert(event.affects(utils_1.toResource.call(this, '/bar'), 2 /* FileChangeType.DELETED */));
                }
                assert(event.contains(utils_1.toResource.call(this, '/bar/folder/somefile'), 2 /* FileChangeType.DELETED */));
                assert(event.contains(utils_1.toResource.call(this, '/bar/folder/somefile/test.txt'), 2 /* FileChangeType.DELETED */));
                assert(event.contains(utils_1.toResource.call(this, '/BAR/FOLDER/somefile/test.txt'), 2 /* FileChangeType.DELETED */));
                if (ignorePathCasing) {
                    assert(event.contains(utils_1.toResource.call(this, '/BAR/folder/somefile/test.txt'), 2 /* FileChangeType.DELETED */));
                }
                else {
                    assert(!event.contains(utils_1.toResource.call(this, '/BAR/folder/somefile/test.txt'), 2 /* FileChangeType.DELETED */));
                }
                assert(!event.contains(utils_1.toResource.call(this, '/bar/folder2/somefile'), 2 /* FileChangeType.DELETED */));
                assert.strictEqual(1, event.rawAdded.length);
                assert.strictEqual(2, event.rawUpdated.length);
                assert.strictEqual(3, event.rawDeleted.length);
                assert.strictEqual(true, event.gotAdded());
                assert.strictEqual(true, event.gotUpdated());
                assert.strictEqual(true, event.gotDeleted());
            }
        });
        test('FileChangesEvent - supports multiple changes on file tree', function () {
            for (const type of [1 /* FileChangeType.ADDED */, 0 /* FileChangeType.UPDATED */, 2 /* FileChangeType.DELETED */]) {
                const changes = [
                    { resource: utils_1.toResource.call(this, '/foo/bar/updated.txt'), type },
                    { resource: utils_1.toResource.call(this, '/foo/bar/otherupdated.txt'), type },
                    { resource: utils_1.toResource.call(this, '/foo/bar'), type },
                    { resource: utils_1.toResource.call(this, '/foo'), type },
                    { resource: utils_1.toResource.call(this, '/bar'), type },
                    { resource: utils_1.toResource.call(this, '/bar/foo'), type },
                    { resource: utils_1.toResource.call(this, '/bar/foo/updated.txt'), type },
                    { resource: utils_1.toResource.call(this, '/bar/foo/otherupdated.txt'), type }
                ];
                for (const ignorePathCasing of [false, true]) {
                    const event = new files_1.FileChangesEvent(changes, ignorePathCasing);
                    for (const change of changes) {
                        assert(event.contains(change.resource, type));
                        assert(event.affects(change.resource, type));
                    }
                    assert(event.affects(utils_1.toResource.call(this, '/foo'), type));
                    assert(event.affects(utils_1.toResource.call(this, '/bar'), type));
                    assert(event.affects(utils_1.toResource.call(this, '/'), type));
                    assert(!event.affects(utils_1.toResource.call(this, '/foobar'), type));
                    assert(!event.contains(utils_1.toResource.call(this, '/some/foo/bar'), type));
                    assert(!event.affects(utils_1.toResource.call(this, '/some/foo/bar'), type));
                    assert(!event.contains(utils_1.toResource.call(this, '/some/bar'), type));
                    assert(!event.affects(utils_1.toResource.call(this, '/some/bar'), type));
                    switch (type) {
                        case 1 /* FileChangeType.ADDED */:
                            assert.strictEqual(8, event.rawAdded.length);
                            break;
                        case 2 /* FileChangeType.DELETED */:
                            assert.strictEqual(8, event.rawDeleted.length);
                            break;
                    }
                }
            }
        });
        test('FileChangesEvent - correlation', function () {
            let changes = [
                { resource: utils_1.toResource.call(this, '/foo/updated.txt'), type: 0 /* FileChangeType.UPDATED */ },
                { resource: utils_1.toResource.call(this, '/foo/otherupdated.txt'), type: 0 /* FileChangeType.UPDATED */ },
                { resource: utils_1.toResource.call(this, '/added.txt'), type: 1 /* FileChangeType.ADDED */ },
            ];
            let event = new files_1.FileChangesEvent(changes, true);
            assert.strictEqual(event.hasCorrelation(), false);
            assert.strictEqual(event.correlates(100), false);
            changes = [
                { resource: utils_1.toResource.call(this, '/foo/updated.txt'), type: 0 /* FileChangeType.UPDATED */, cId: 100 },
                { resource: utils_1.toResource.call(this, '/foo/otherupdated.txt'), type: 0 /* FileChangeType.UPDATED */, cId: 100 },
                { resource: utils_1.toResource.call(this, '/added.txt'), type: 1 /* FileChangeType.ADDED */, cId: 100 },
            ];
            event = new files_1.FileChangesEvent(changes, true);
            assert.strictEqual(event.hasCorrelation(), true);
            assert.strictEqual(event.correlates(100), true);
            assert.strictEqual(event.correlates(120), false);
            changes = [
                { resource: utils_1.toResource.call(this, '/foo/updated.txt'), type: 0 /* FileChangeType.UPDATED */, cId: 100 },
                { resource: utils_1.toResource.call(this, '/foo/otherupdated.txt'), type: 0 /* FileChangeType.UPDATED */ },
                { resource: utils_1.toResource.call(this, '/added.txt'), type: 1 /* FileChangeType.ADDED */, cId: 100 },
            ];
            event = new files_1.FileChangesEvent(changes, true);
            assert.strictEqual(event.hasCorrelation(), false);
            assert.strictEqual(event.correlates(100), false);
            assert.strictEqual(event.correlates(120), false);
            changes = [
                { resource: utils_1.toResource.call(this, '/foo/updated.txt'), type: 0 /* FileChangeType.UPDATED */, cId: 100 },
                { resource: utils_1.toResource.call(this, '/foo/otherupdated.txt'), type: 0 /* FileChangeType.UPDATED */, cId: 120 },
                { resource: utils_1.toResource.call(this, '/added.txt'), type: 1 /* FileChangeType.ADDED */, cId: 100 },
            ];
            event = new files_1.FileChangesEvent(changes, true);
            assert.strictEqual(event.hasCorrelation(), false);
            assert.strictEqual(event.correlates(100), false);
            assert.strictEqual(event.correlates(120), false);
        });
        function testIsEqual(testMethod) {
            // corner cases
            assert(testMethod('', '', true));
            assert(!testMethod(null, '', true));
            assert(!testMethod(undefined, '', true));
            // basics (string)
            assert(testMethod('/', '/', true));
            assert(testMethod('/some', '/some', true));
            assert(testMethod('/some/path', '/some/path', true));
            assert(testMethod('c:\\', 'c:\\', true));
            assert(testMethod('c:\\some', 'c:\\some', true));
            assert(testMethod('c:\\some\\path', 'c:\\some\\path', true));
            assert(testMethod('/someöäü/path', '/someöäü/path', true));
            assert(testMethod('c:\\someöäü\\path', 'c:\\someöäü\\path', true));
            assert(!testMethod('/some/path', '/some/other/path', true));
            assert(!testMethod('c:\\some\\path', 'c:\\some\\other\\path', true));
            assert(!testMethod('c:\\some\\path', 'd:\\some\\path', true));
            assert(testMethod('/some/path', '/some/PATH', true));
            assert(testMethod('/someöäü/path', '/someÖÄÜ/PATH', true));
            assert(testMethod('c:\\some\\path', 'c:\\some\\PATH', true));
            assert(testMethod('c:\\someöäü\\path', 'c:\\someÖÄÜ\\PATH', true));
            assert(testMethod('c:\\some\\path', 'C:\\some\\PATH', true));
        }
        test('isEqual (ignoreCase)', function () {
            testIsEqual(extpath_1.isEqual);
            // basics (uris)
            assert((0, extpath_1.isEqual)(uri_1.URI.file('/some/path').fsPath, uri_1.URI.file('/some/path').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('c:\\some\\path').fsPath, uri_1.URI.file('c:\\some\\path').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('/someöäü/path').fsPath, uri_1.URI.file('/someöäü/path').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('c:\\someöäü\\path').fsPath, uri_1.URI.file('c:\\someöäü\\path').fsPath, true));
            assert(!(0, extpath_1.isEqual)(uri_1.URI.file('/some/path').fsPath, uri_1.URI.file('/some/other/path').fsPath, true));
            assert(!(0, extpath_1.isEqual)(uri_1.URI.file('c:\\some\\path').fsPath, uri_1.URI.file('c:\\some\\other\\path').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('/some/path').fsPath, uri_1.URI.file('/some/PATH').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('/someöäü/path').fsPath, uri_1.URI.file('/someÖÄÜ/PATH').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('c:\\some\\path').fsPath, uri_1.URI.file('c:\\some\\PATH').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('c:\\someöäü\\path').fsPath, uri_1.URI.file('c:\\someÖÄÜ\\PATH').fsPath, true));
            assert((0, extpath_1.isEqual)(uri_1.URI.file('c:\\some\\path').fsPath, uri_1.URI.file('C:\\some\\PATH').fsPath, true));
        });
        test('isParent (ignorecase)', function () {
            if (platform_1.isWindows) {
                assert((0, files_1.isParent)('c:\\some\\path', 'c:\\', true));
                assert((0, files_1.isParent)('c:\\some\\path', 'c:\\some', true));
                assert((0, files_1.isParent)('c:\\some\\path', 'c:\\some\\', true));
                assert((0, files_1.isParent)('c:\\someöäü\\path', 'c:\\someöäü', true));
                assert((0, files_1.isParent)('c:\\someöäü\\path', 'c:\\someöäü\\', true));
                assert((0, files_1.isParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar', true));
                assert((0, files_1.isParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\', true));
                assert((0, files_1.isParent)('c:\\some\\path', 'C:\\', true));
                assert((0, files_1.isParent)('c:\\some\\path', 'c:\\SOME', true));
                assert((0, files_1.isParent)('c:\\some\\path', 'c:\\SOME\\', true));
                assert(!(0, files_1.isParent)('c:\\some\\path', 'd:\\', true));
                assert(!(0, files_1.isParent)('c:\\some\\path', 'c:\\some\\path', true));
                assert(!(0, files_1.isParent)('c:\\some\\path', 'd:\\some\\path', true));
                assert(!(0, files_1.isParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\barr', true));
                assert(!(0, files_1.isParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\test', true));
            }
            if (platform_1.isMacintosh || platform_1.isLinux) {
                assert((0, files_1.isParent)('/some/path', '/', true));
                assert((0, files_1.isParent)('/some/path', '/some', true));
                assert((0, files_1.isParent)('/some/path', '/some/', true));
                assert((0, files_1.isParent)('/someöäü/path', '/someöäü', true));
                assert((0, files_1.isParent)('/someöäü/path', '/someöäü/', true));
                assert((0, files_1.isParent)('/foo/bar/test.ts', '/foo/bar', true));
                assert((0, files_1.isParent)('/foo/bar/test.ts', '/foo/bar/', true));
                assert((0, files_1.isParent)('/some/path', '/SOME', true));
                assert((0, files_1.isParent)('/some/path', '/SOME/', true));
                assert((0, files_1.isParent)('/someöäü/path', '/SOMEÖÄÜ', true));
                assert((0, files_1.isParent)('/someöäü/path', '/SOMEÖÄÜ/', true));
                assert(!(0, files_1.isParent)('/some/path', '/some/path', true));
                assert(!(0, files_1.isParent)('/foo/bar/test.ts', '/foo/barr', true));
                assert(!(0, files_1.isParent)('/foo/bar/test.ts', '/foo/bar/test', true));
            }
        });
        test('isEqualOrParent (ignorecase)', function () {
            // same assertions apply as with isEqual()
            testIsEqual(extpath_1.isEqualOrParent); //
            if (platform_1.isWindows) {
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\some', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\some\\', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\someöäü\\path', 'c:\\someöäü', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\someöäü\\path', 'c:\\someöäü\\', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\some\\path', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\test.ts', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'C:\\', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\SOME', true));
                assert((0, extpath_1.isEqualOrParent)('c:\\some\\path', 'c:\\SOME\\', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\some\\path', 'd:\\', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\some\\path', 'd:\\some\\path', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\barr', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\test', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\bar\\test.', true));
                assert(!(0, extpath_1.isEqualOrParent)('c:\\foo\\bar\\test.ts', 'c:\\foo\\BAR\\test.', true));
            }
            if (platform_1.isMacintosh || platform_1.isLinux) {
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/', true));
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/some', true));
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/some/', true));
                assert((0, extpath_1.isEqualOrParent)('/someöäü/path', '/someöäü', true));
                assert((0, extpath_1.isEqualOrParent)('/someöäü/path', '/someöäü/', true));
                assert((0, extpath_1.isEqualOrParent)('/foo/bar/test.ts', '/foo/bar', true));
                assert((0, extpath_1.isEqualOrParent)('/foo/bar/test.ts', '/foo/bar/', true));
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/some/path', true));
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/SOME', true));
                assert((0, extpath_1.isEqualOrParent)('/some/path', '/SOME/', true));
                assert((0, extpath_1.isEqualOrParent)('/someöäü/path', '/SOMEÖÄÜ', true));
                assert((0, extpath_1.isEqualOrParent)('/someöäü/path', '/SOMEÖÄÜ/', true));
                assert(!(0, extpath_1.isEqualOrParent)('/foo/bar/test.ts', '/foo/barr', true));
                assert(!(0, extpath_1.isEqualOrParent)('/foo/bar/test.ts', '/foo/bar/test', true));
                assert(!(0, extpath_1.isEqualOrParent)('foo/bar/test.ts', 'foo/bar/test.', true));
                assert(!(0, extpath_1.isEqualOrParent)('foo/bar/test.ts', 'foo/BAR/test.', true));
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZXMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvdGVzdC9jb21tb24vZmlsZXMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtRQUVuQixJQUFJLENBQUMsMkJBQTJCLEVBQUU7WUFDakMsTUFBTSxPQUFPLEdBQUc7Z0JBQ2YsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLEVBQUUsSUFBSSxnQ0FBd0IsRUFBRTtnQkFDckYsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDLEVBQUUsSUFBSSxnQ0FBd0IsRUFBRTtnQkFDMUYsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxFQUFFLElBQUksOEJBQXNCLEVBQUU7Z0JBQzdFLEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLElBQUksZ0NBQXdCLEVBQUU7Z0JBQ3JGLEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsRUFBRSxJQUFJLGdDQUF3QixFQUFFO2dCQUNoRixFQUFFLFFBQVEsRUFBRSxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLEVBQUUsSUFBSSxnQ0FBd0IsRUFBRTthQUNoRixDQUFDO1lBRUYsS0FBSyxNQUFNLGdCQUFnQixJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQzlDLE1BQU0sS0FBSyxHQUFHLElBQUksd0JBQWdCLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBRTlELE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxpQ0FBeUIsQ0FBQyxDQUFDO2dCQUMvRSxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLGlDQUF5QixDQUFDLENBQUM7Z0JBQzdFLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxpQ0FBeUIsQ0FBQyxDQUFDO2dCQUMxRixNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsaUNBQXlCLENBQUMsQ0FBQztnQkFDekYsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLCtEQUErQyxDQUFDLENBQUM7Z0JBQ2hILE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQywrREFBK0MsQ0FBQyxDQUFDO2dCQUMvRyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsK0ZBQXVFLENBQUMsQ0FBQztnQkFDeEksTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsK0RBQStDLENBQUMsQ0FBQztnQkFDakgsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsK0JBQXVCLENBQUMsQ0FBQztnQkFDekYsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsaUNBQXlCLENBQUMsQ0FBQztnQkFDM0YsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsaUNBQXlCLENBQUMsQ0FBQztnQkFFMUYsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxpQ0FBeUIsQ0FBQyxDQUFDO2dCQUNyRixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLGlDQUF5QixDQUFDLENBQUM7Z0JBQ3JGLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsaUNBQXlCLENBQUMsQ0FBQztnQkFDN0UsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO29CQUN0QixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLGlDQUF5QixDQUFDLENBQUM7b0JBQ3JGLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsaUNBQXlCLENBQUMsQ0FBQztnQkFDOUUsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxpQ0FBeUIsQ0FBQyxDQUFDO29CQUN0RixNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLGlDQUF5QixDQUFDLENBQUM7Z0JBQzlFLENBQUM7Z0JBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDLGlDQUF5QixDQUFDLENBQUM7Z0JBQzlGLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSwrQkFBK0IsQ0FBQyxpQ0FBeUIsQ0FBQyxDQUFDO2dCQUN2RyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsK0JBQStCLENBQUMsaUNBQXlCLENBQUMsQ0FBQztnQkFDdkcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO29CQUN0QixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsK0JBQStCLENBQUMsaUNBQXlCLENBQUMsQ0FBQztnQkFDeEcsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLCtCQUErQixDQUFDLGlDQUF5QixDQUFDLENBQUM7Z0JBQ3pHLENBQUM7Z0JBQ0QsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUMsaUNBQXlCLENBQUMsQ0FBQztnQkFFaEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUM5QyxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkRBQTJELEVBQUU7WUFDakUsS0FBSyxNQUFNLElBQUksSUFBSSw4RkFBc0UsRUFBRSxDQUFDO2dCQUMzRixNQUFNLE9BQU8sR0FBRztvQkFDZixFQUFFLFFBQVEsRUFBRSxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxJQUFJLEVBQUU7b0JBQ2pFLEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSwyQkFBMkIsQ0FBQyxFQUFFLElBQUksRUFBRTtvQkFDdEUsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRTtvQkFDckQsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRTtvQkFDakQsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRTtvQkFDakQsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRTtvQkFDckQsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDLEVBQUUsSUFBSSxFQUFFO29CQUNqRSxFQUFFLFFBQVEsRUFBRSxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLENBQUMsRUFBRSxJQUFJLEVBQUU7aUJBQ3RFLENBQUM7Z0JBRUYsS0FBSyxNQUFNLGdCQUFnQixJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQzlDLE1BQU0sS0FBSyxHQUFHLElBQUksd0JBQWdCLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUM7b0JBRTlELEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7d0JBQzlCLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDOUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUM5QyxDQUFDO29CQUVELE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUMzRCxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDM0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ3hELE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBRS9ELE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ3RFLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ3JFLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2xFLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBRWpFLFFBQVEsSUFBSSxFQUFFLENBQUM7d0JBQ2Q7NEJBQ0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQzs0QkFDN0MsTUFBTTt3QkFDUDs0QkFDQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzRCQUMvQyxNQUFNO29CQUNSLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnQ0FBZ0MsRUFBRTtZQUN0QyxJQUFJLE9BQU8sR0FBa0I7Z0JBQzVCLEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLElBQUksZ0NBQXdCLEVBQUU7Z0JBQ3JGLEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxFQUFFLElBQUksZ0NBQXdCLEVBQUU7Z0JBQzFGLEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsRUFBRSxJQUFJLDhCQUFzQixFQUFFO2FBQzdFLENBQUM7WUFFRixJQUFJLEtBQUssR0FBcUIsSUFBSSx3QkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWpELE9BQU8sR0FBRztnQkFDVCxFQUFFLFFBQVEsRUFBRSxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxJQUFJLGdDQUF3QixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7Z0JBQy9GLEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxFQUFFLElBQUksZ0NBQXdCLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtnQkFDcEcsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxFQUFFLElBQUksOEJBQXNCLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTthQUN2RixDQUFDO1lBRUYsS0FBSyxHQUFHLElBQUksd0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFakQsT0FBTyxHQUFHO2dCQUNULEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLElBQUksZ0NBQXdCLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtnQkFDL0YsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDLEVBQUUsSUFBSSxnQ0FBd0IsRUFBRTtnQkFDMUYsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxFQUFFLElBQUksOEJBQXNCLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTthQUN2RixDQUFDO1lBRUYsS0FBSyxHQUFHLElBQUksd0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFakQsT0FBTyxHQUFHO2dCQUNULEVBQUUsUUFBUSxFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLElBQUksZ0NBQXdCLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtnQkFDL0YsRUFBRSxRQUFRLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDLEVBQUUsSUFBSSxnQ0FBd0IsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO2dCQUNwRyxFQUFFLFFBQVEsRUFBRSxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLEVBQUUsSUFBSSw4QkFBc0IsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO2FBQ3ZGLENBQUM7WUFFRixLQUFLLEdBQUcsSUFBSSx3QkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztRQUVILFNBQVMsV0FBVyxDQUFDLFVBQW9FO1lBRXhGLGVBQWU7WUFDZixNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFVLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFMUMsa0JBQWtCO1lBQ2xCLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRXJELE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUU3RCxNQUFNLENBQUMsVUFBVSxDQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFbkUsTUFBTSxDQUFDLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRTlELE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxVQUFVLENBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbkUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFRCxJQUFJLENBQUMsc0JBQXNCLEVBQUU7WUFDNUIsV0FBVyxDQUFDLGlCQUFPLENBQUMsQ0FBQztZQUVyQixnQkFBZ0I7WUFDaEIsTUFBTSxDQUFDLElBQUEsaUJBQU8sRUFBQyxTQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxJQUFBLGlCQUFPLEVBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFNUYsTUFBTSxDQUFDLElBQUEsaUJBQU8sRUFBQyxTQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzFGLE1BQU0sQ0FBQyxJQUFBLGlCQUFPLEVBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFbEcsTUFBTSxDQUFDLENBQUMsSUFBQSxpQkFBTyxFQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMzRixNQUFNLENBQUMsQ0FBQyxJQUFBLGlCQUFPLEVBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFcEcsTUFBTSxDQUFDLElBQUEsaUJBQU8sRUFBQyxTQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxJQUFBLGlCQUFPLEVBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxNQUFNLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMxRixNQUFNLENBQUMsSUFBQSxpQkFBTyxFQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzVGLE1BQU0sQ0FBQyxJQUFBLGlCQUFPLEVBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbEcsTUFBTSxDQUFDLElBQUEsaUJBQU8sRUFBQyxTQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM3RixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1QkFBdUIsRUFBRTtZQUM3QixJQUFJLG9CQUFTLEVBQUUsQ0FBQztnQkFDZixNQUFNLENBQUMsSUFBQSxnQkFBUSxFQUFDLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLENBQUMsSUFBQSxnQkFBUSxFQUFDLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNyRCxNQUFNLENBQUMsSUFBQSxnQkFBUSxFQUFDLGdCQUFnQixFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN2RCxNQUFNLENBQUMsSUFBQSxnQkFBUSxFQUFDLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMzRCxNQUFNLENBQUMsSUFBQSxnQkFBUSxFQUFDLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsSUFBQSxnQkFBUSxFQUFDLHVCQUF1QixFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLENBQUMsSUFBQSxnQkFBUSxFQUFDLHVCQUF1QixFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBRWxFLE1BQU0sQ0FBQyxJQUFBLGdCQUFRLEVBQUMsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELE1BQU0sQ0FBQyxJQUFBLGdCQUFRLEVBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxJQUFBLGdCQUFRLEVBQUMsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBRXZELE1BQU0sQ0FBQyxDQUFDLElBQUEsZ0JBQVEsRUFBQyxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDbEQsTUFBTSxDQUFDLENBQUMsSUFBQSxnQkFBUSxFQUFDLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxDQUFDLElBQUEsZ0JBQVEsRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLENBQUMsQ0FBQyxJQUFBLGdCQUFRLEVBQUMsdUJBQXVCLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2xFLE1BQU0sQ0FBQyxDQUFDLElBQUEsZ0JBQVEsRUFBQyx1QkFBdUIsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLENBQUM7WUFFRCxJQUFJLHNCQUFXLElBQUksa0JBQU8sRUFBRSxDQUFDO2dCQUM1QixNQUFNLENBQUMsSUFBQSxnQkFBUSxFQUFDLFlBQVksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDMUMsTUFBTSxDQUFDLElBQUEsZ0JBQVEsRUFBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sQ0FBQyxJQUFBLGdCQUFRLEVBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsSUFBQSxnQkFBUSxFQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxDQUFDLElBQUEsZ0JBQVEsRUFBQyxlQUFlLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxJQUFBLGdCQUFRLEVBQUMsa0JBQWtCLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELE1BQU0sQ0FBQyxJQUFBLGdCQUFRLEVBQUMsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBRXhELE1BQU0sQ0FBQyxJQUFBLGdCQUFRLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsSUFBQSxnQkFBUSxFQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDL0MsTUFBTSxDQUFDLElBQUEsZ0JBQVEsRUFBQyxlQUFlLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxJQUFBLGdCQUFRLEVBQUMsZUFBZSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxNQUFNLENBQUMsQ0FBQyxJQUFBLGdCQUFRLEVBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNwRCxNQUFNLENBQUMsQ0FBQyxJQUFBLGdCQUFRLEVBQUMsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sQ0FBQyxDQUFDLElBQUEsZ0JBQVEsRUFBQyxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM5RCxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUU7WUFFcEMsMENBQTBDO1lBQzFDLFdBQVcsQ0FBQyx5QkFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBRWhDLElBQUksb0JBQVMsRUFBRSxDQUFDO2dCQUNmLE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2xFLE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsbUJBQW1CLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsdUJBQXVCLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZFLE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsdUJBQXVCLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDekUsTUFBTSxDQUFDLElBQUEseUJBQWUsRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNsRSxNQUFNLENBQUMsSUFBQSx5QkFBZSxFQUFDLHVCQUF1QixFQUFFLHVCQUF1QixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBRWhGLE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBRTlELE1BQU0sQ0FBQyxDQUFDLElBQUEseUJBQWUsRUFBQyxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDekQsTUFBTSxDQUFDLENBQUMsSUFBQSx5QkFBZSxFQUFDLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLE1BQU0sQ0FBQyxDQUFDLElBQUEseUJBQWUsRUFBQyx1QkFBdUIsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDekUsTUFBTSxDQUFDLENBQUMsSUFBQSx5QkFBZSxFQUFDLHVCQUF1QixFQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzlFLE1BQU0sQ0FBQyxDQUFDLElBQUEseUJBQWUsRUFBQyx1QkFBdUIsRUFBRSxxQkFBcUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMvRSxNQUFNLENBQUMsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsdUJBQXVCLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNoRixDQUFDO1lBRUQsSUFBSSxzQkFBVyxJQUFJLGtCQUFPLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxDQUFDLElBQUEseUJBQWUsRUFBQyxZQUFZLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNyRCxNQUFNLENBQUMsSUFBQSx5QkFBZSxFQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDdEQsTUFBTSxDQUFDLElBQUEseUJBQWUsRUFBQyxlQUFlLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzNELE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsZUFBZSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLENBQUMsSUFBQSx5QkFBZSxFQUFDLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsSUFBQSx5QkFBZSxFQUFDLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsSUFBQSx5QkFBZSxFQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFFMUQsTUFBTSxDQUFDLElBQUEseUJBQWUsRUFBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxJQUFBLHlCQUFlLEVBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxNQUFNLENBQUMsSUFBQSx5QkFBZSxFQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxDQUFDLElBQUEseUJBQWUsRUFBQyxlQUFlLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBRTVELE1BQU0sQ0FBQyxDQUFDLElBQUEseUJBQWUsRUFBQyxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDaEUsTUFBTSxDQUFDLENBQUMsSUFBQSx5QkFBZSxFQUFDLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsaUJBQWlCLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLE1BQU0sQ0FBQyxDQUFDLElBQUEseUJBQWUsRUFBQyxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRSxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUMifQ==