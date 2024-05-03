/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/workbench/contrib/debug/common/debugSource", "vs/workbench/contrib/debug/test/browser/mockDebugModel"], function (require, exports, assert, platform_1, uri_1, utils_1, log_1, debugSource_1, mockDebugModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - Source', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('from raw source', () => {
            const source = new debugSource_1.Source({
                name: 'zz',
                path: '/xx/yy/zz',
                sourceReference: 0,
                presentationHint: 'emphasize'
            }, 'aDebugSessionId', mockDebugModel_1.mockUriIdentityService, new log_1.NullLogService());
            assert.strictEqual(source.presentationHint, 'emphasize');
            assert.strictEqual(source.name, 'zz');
            assert.strictEqual(source.inMemory, false);
            assert.strictEqual(source.reference, 0);
            assert.strictEqual(source.uri.toString(), uri_1.URI.file('/xx/yy/zz').toString());
        });
        test('from raw internal source', () => {
            const source = new debugSource_1.Source({
                name: 'internalModule.js',
                sourceReference: 11,
                presentationHint: 'deemphasize'
            }, 'aDebugSessionId', mockDebugModel_1.mockUriIdentityService, new log_1.NullLogService());
            assert.strictEqual(source.presentationHint, 'deemphasize');
            assert.strictEqual(source.name, 'internalModule.js');
            assert.strictEqual(source.inMemory, true);
            assert.strictEqual(source.reference, 11);
            assert.strictEqual(source.uri.toString(), 'debug:internalModule.js?session%3DaDebugSessionId%26ref%3D11');
        });
        test('get encoded debug data', () => {
            const checkData = (uri, expectedName, expectedPath, expectedSourceReference, expectedSessionId) => {
                const { name, path, sourceReference, sessionId } = debugSource_1.Source.getEncodedDebugData(uri);
                assert.strictEqual(name, expectedName);
                assert.strictEqual(path, expectedPath);
                assert.strictEqual(sourceReference, expectedSourceReference);
                assert.strictEqual(sessionId, expectedSessionId);
            };
            checkData(uri_1.URI.file('a/b/c/d'), 'd', platform_1.isWindows ? '\\a\\b\\c\\d' : '/a/b/c/d', undefined, undefined);
            checkData(uri_1.URI.from({ scheme: 'file', path: '/my/path/test.js', query: 'ref=1&session=2' }), 'test.js', platform_1.isWindows ? '\\my\\path\\test.js' : '/my/path/test.js', undefined, undefined);
            checkData(uri_1.URI.from({ scheme: 'http', authority: 'www.example.com', path: '/my/path' }), 'path', 'http://www.example.com/my/path', undefined, undefined);
            checkData(uri_1.URI.from({ scheme: 'debug', authority: 'www.example.com', path: '/my/path', query: 'ref=100' }), 'path', '/my/path', 100, undefined);
            checkData(uri_1.URI.from({ scheme: 'debug', path: 'a/b/c/d.js', query: 'session=100' }), 'd.js', 'a/b/c/d.js', undefined, '100');
            checkData(uri_1.URI.from({ scheme: 'debug', path: 'a/b/c/d/foo.txt', query: 'session=100&ref=10' }), 'foo.txt', 'a/b/c/d/foo.txt', 10, '100');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdTb3VyY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvdGVzdC9icm93c2VyL2RlYnVnU291cmNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUU1QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtZQUM1QixNQUFNLE1BQU0sR0FBRyxJQUFJLG9CQUFNLENBQUM7Z0JBQ3pCLElBQUksRUFBRSxJQUFJO2dCQUNWLElBQUksRUFBRSxXQUFXO2dCQUNqQixlQUFlLEVBQUUsQ0FBQztnQkFDbEIsZ0JBQWdCLEVBQUUsV0FBVzthQUM3QixFQUFFLGlCQUFpQixFQUFFLHVDQUFzQixFQUFFLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUM7WUFFcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUM3RSxDQUFDLENBQUMsQ0FB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