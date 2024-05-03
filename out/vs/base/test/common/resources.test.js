define(["require", "exports", "assert", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/utils"], function (require, exports, assert, extpath_1, path_1, platform_1, resources_1, uri_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Resources', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('distinctParents', () => {
            // Basic
            let resources = [
                uri_1.URI.file('/some/folderA/file.txt'),
                uri_1.URI.file('/some/folderB/file.txt'),
                uri_1.URI.file('/some/folderC/file.txt')
            ];
            let distinct = (0, resources_1.distinctParents)(resources, r => r);
            assert.strictEqual(distinct.length, 3);
            assert.strictEqual(distinct[0].toString(), resources[0].toString());
            assert.strictEqual(distinct[1].toString(), resources[1].toString());
            assert.strictEqual(distinct[2].toString(), resources[2].toString());
            // Parent / Child
            resources = [
                uri_1.URI.file('/some/folderA'),
                uri_1.URI.file('/some/folderA/file.txt'),
                uri_1.URI.file('/some/folderA/child/file.txt'),
                uri_1.URI.file('/some/folderA2/file.txt'),
                uri_1.URI.file('/some/file.txt')
            ];
            distinct = (0, resources_1.distinctParents)(resources, r => r);
            assert.strictEqual(distinct.length, 3);
            assert.strictEqual(distinct[0].toString(), resources[0].toString());
            assert.strictEqual(distinct[1].toString(), resources[3].toString());
            assert.strictEqual(distinct[2].toString(), resources[4].toString());
        });
        test('dirname', () => {
            if (platform_1.isWindows) {
                assert.strictEqual((0, resources_1.dirname)(uri_1.URI.file('c:\\some\\file\\test.txt')).toString(), 'file:///c%3A/some/file');
                assert.strictEqual((0, resources_1.dirname)(uri_1.URI.file('c:\\some\\file')).toString(), 'file:///c%3A/some');
                assert.strictEqual((0, resources_1.dirname)(uri_1.URI.file('c:\\some\\file\\')).toString(), 'file:///c%3A/some');
                assert.strictEqual((0, resources_1.dirname)(uri_1.URI.file('c:\\some')).toString(), 'file:///c%3A/');
                assert.strictEqual((0, resources_1.dirname)(uri_1.URI.file('C:\\some')).toString(), 'file:///c%3A/');
                assert.strictEqual((0, resources_1.dirname)(uri_1.URI.file('c:\\')).toString(), 'file:///c%3A/');
            }
            else {
                assert.strictEqual((0, resources_1.dirname)(uri_1.URI.file('/some/file/test.txt')).toString(), 'file:///some/file');
                assert.strictEqual((0, resources_1.dirname)(uri_1.URI.file('/some/file/')).toString(), 'file:///some');
                assert.strictEqual((0, resources_1.dirname)(uri_1.URI.file('/some/file')).toString(), 'file:///some');
            }
            assert.strictEqual((0, resources_1.dirname)(uri_1.URI.parse('foo://a/some/file/test.txt')).toString(), 'foo://a/some/file');
            assert.strictEqual((0, resources_1.dirname)(uri_1.URI.parse('foo://a/some/file/')).toString(), 'foo://a/some');
            assert.strictEqual((0, resources_1.dirname)(uri_1.URI.parse('foo://a/some/file')).toString(), 'foo://a/some');
            assert.strictEqual((0, resources_1.dirname)(uri_1.URI.parse('foo://a/some')).toString(), 'foo://a/');
            assert.strictEqual((0, resources_1.dirname)(uri_1.URI.parse('foo://a/')).toString(), 'foo://a/');
            assert.strictEqual((0, resources_1.dirname)(uri_1.URI.parse('foo://a')).toString(), 'foo://a');
            // does not explode (https://github.com/microsoft/vscode/issues/41987)
            (0, resources_1.dirname)(uri_1.URI.from({ scheme: 'file', authority: '/users/someone/portal.h' }));
            assert.strictEqual((0, resources_1.dirname)(uri_1.URI.parse('foo://a/b/c?q')).toString(), 'foo://a/b?q');
        });
        test('basename', () => {
            if (platform_1.isWindows) {
                assert.strictEqual((0, resources_1.basename)(uri_1.URI.file('c:\\some\\file\\test.txt')), 'test.txt');
                assert.strictEqual((0, resources_1.basename)(uri_1.URI.file('c:\\some\\file')), 'file');
                assert.strictEqual((0, resources_1.basename)(uri_1.URI.file('c:\\some\\file\\')), 'file');
                assert.strictEqual((0, resources_1.basename)(uri_1.URI.file('C:\\some\\file\\')), 'file');
            }
            else {
                assert.strictEqual((0, resources_1.basename)(uri_1.URI.file('/some/file/test.txt')), 'test.txt');
                assert.strictEqual((0, resources_1.basename)(uri_1.URI.file('/some/file/')), 'file');
                assert.strictEqual((0, resources_1.basename)(uri_1.URI.file('/some/file')), 'file');
                assert.strictEqual((0, resources_1.basename)(uri_1.URI.file('/some')), 'some');
            }
            assert.strictEqual((0, resources_1.basename)(uri_1.URI.parse('foo://a/some/file/test.txt')), 'test.txt');
            assert.strictEqual((0, resources_1.basename)(uri_1.URI.parse('foo://a/some/file/')), 'file');
            assert.strictEqual((0, resources_1.basename)(uri_1.URI.parse('foo://a/some/file')), 'file');
            assert.strictEqual((0, resources_1.basename)(uri_1.URI.parse('foo://a/some')), 'some');
            assert.strictEqual((0, resources_1.basename)(uri_1.URI.parse('foo://a/')), '');
            assert.strictEqual((0, resources_1.basename)(uri_1.URI.parse('foo://a')), '');
        });
        test('joinPath', () => {
            if (platform_1.isWindows) {
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('c:\\foo\\bar'), '/file.js').toString(), 'file:///c%3A/foo/bar/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('c:\\foo\\bar\\'), 'file.js').toString(), 'file:///c%3A/foo/bar/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('c:\\foo\\bar\\'), '/file.js').toString(), 'file:///c%3A/foo/bar/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('c:\\'), '/file.js').toString(), 'file:///c%3A/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('c:\\'), 'bar/file.js').toString(), 'file:///c%3A/bar/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('c:\\foo'), './file.js').toString(), 'file:///c%3A/foo/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('c:\\foo'), '/./file.js').toString(), 'file:///c%3A/foo/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('C:\\foo'), '../file.js').toString(), 'file:///c%3A/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('C:\\foo\\.'), '../file.js').toString(), 'file:///c%3A/file.js');
            }
            else {
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('/foo/bar'), '/file.js').toString(), 'file:///foo/bar/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('/foo/bar'), 'file.js').toString(), 'file:///foo/bar/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('/foo/bar/'), '/file.js').toString(), 'file:///foo/bar/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('/'), '/file.js').toString(), 'file:///file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('/foo/bar'), './file.js').toString(), 'file:///foo/bar/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('/foo/bar'), '/./file.js').toString(), 'file:///foo/bar/file.js');
                assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.file('/foo/bar'), '../file.js').toString(), 'file:///foo/file.js');
            }
            assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.parse('foo://a/foo/bar')).toString(), 'foo://a/foo/bar');
            assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.parse('foo://a/foo/bar'), '/file.js').toString(), 'foo://a/foo/bar/file.js');
            assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.parse('foo://a/foo/bar'), 'file.js').toString(), 'foo://a/foo/bar/file.js');
            assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.parse('foo://a/foo/bar/'), '/file.js').toString(), 'foo://a/foo/bar/file.js');
            assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.parse('foo://a/'), '/file.js').toString(), 'foo://a/file.js');
            assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.parse('foo://a/foo/bar/'), './file.js').toString(), 'foo://a/foo/bar/file.js');
            assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.parse('foo://a/foo/bar/'), '/./file.js').toString(), 'foo://a/foo/bar/file.js');
            assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.parse('foo://a/foo/bar/'), '../file.js').toString(), 'foo://a/foo/file.js');
            assert.strictEqual((0, resources_1.joinPath)(uri_1.URI.from({ scheme: 'myScheme', authority: 'authority', path: '/path', query: 'query', fragment: 'fragment' }), '/file.js').toString(), 'myScheme://authority/path/file.js?query#fragment');
        });
        test('normalizePath', () => {
            if (platform_1.isWindows) {
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('c:\\foo\\.\\bar')).toString(), 'file:///c%3A/foo/bar');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('c:\\foo\\.')).toString(), 'file:///c%3A/foo');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('c:\\foo\\.\\')).toString(), 'file:///c%3A/foo/');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('c:\\foo\\..')).toString(), 'file:///c%3A/');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('c:\\foo\\..\\bar')).toString(), 'file:///c%3A/bar');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('c:\\foo\\..\\..\\bar')).toString(), 'file:///c%3A/bar');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('c:\\foo\\foo\\..\\..\\bar')).toString(), 'file:///c%3A/bar');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('C:\\foo\\foo\\.\\..\\..\\bar')).toString(), 'file:///c%3A/bar');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('C:\\foo\\foo\\.\\..\\some\\..\\bar')).toString(), 'file:///c%3A/foo/bar');
            }
            else {
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('/foo/./bar')).toString(), 'file:///foo/bar');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('/foo/.')).toString(), 'file:///foo');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('/foo/./')).toString(), 'file:///foo/');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('/foo/..')).toString(), 'file:///');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('/foo/../bar')).toString(), 'file:///bar');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('/foo/../../bar')).toString(), 'file:///bar');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('/foo/foo/../../bar')).toString(), 'file:///bar');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('/foo/foo/./../../bar')).toString(), 'file:///bar');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('/foo/foo/./../some/../bar')).toString(), 'file:///foo/bar');
                assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.file('/f')).toString(), 'file:///f');
            }
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a/foo/./bar')).toString(), 'foo://a/foo/bar');
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a/foo/.')).toString(), 'foo://a/foo');
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a/foo/./')).toString(), 'foo://a/foo/');
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a/foo/..')).toString(), 'foo://a/');
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a/foo/../bar')).toString(), 'foo://a/bar');
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a/foo/../../bar')).toString(), 'foo://a/bar');
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a/foo/foo/../../bar')).toString(), 'foo://a/bar');
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a/foo/foo/./../../bar')).toString(), 'foo://a/bar');
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a/foo/foo/./../some/../bar')).toString(), 'foo://a/foo/bar');
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a')).toString(), 'foo://a');
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a/')).toString(), 'foo://a/');
            assert.strictEqual((0, resources_1.normalizePath)(uri_1.URI.parse('foo://a/foo/./bar?q=1')).toString(), uri_1.URI.parse('foo://a/foo/bar?q%3D1').toString());
        });
        test('isAbsolute', () => {
            if (platform_1.isWindows) {
                assert.strictEqual((0, resources_1.isAbsolutePath)(uri_1.URI.file('c:\\foo\\')), true);
                assert.strictEqual((0, resources_1.isAbsolutePath)(uri_1.URI.file('C:\\foo\\')), true);
                assert.strictEqual((0, resources_1.isAbsolutePath)(uri_1.URI.file('bar')), true); // URI normalizes all file URIs to be absolute
            }
            else {
                assert.strictEqual((0, resources_1.isAbsolutePath)(uri_1.URI.file('/foo/bar')), true);
                assert.strictEqual((0, resources_1.isAbsolutePath)(uri_1.URI.file('bar')), true); // URI normalizes all file URIs to be absolute
            }
            assert.strictEqual((0, resources_1.isAbsolutePath)(uri_1.URI.parse('foo:foo')), false);
            assert.strictEqual((0, resources_1.isAbsolutePath)(uri_1.URI.parse('foo://a/foo/.')), true);
        });
        function assertTrailingSeparator(u1, expected) {
            assert.strictEqual((0, resources_1.hasTrailingPathSeparator)(u1), expected, u1.toString());
        }
        function assertRemoveTrailingSeparator(u1, expected) {
            assertEqualURI((0, resources_1.removeTrailingPathSeparator)(u1), expected, u1.toString());
        }
        function assertAddTrailingSeparator(u1, expected) {
            assertEqualURI((0, resources_1.addTrailingPathSeparator)(u1), expected, u1.toString());
        }
        test('trailingPathSeparator', () => {
            assertTrailingSeparator(uri_1.URI.parse('foo://a/foo'), false);
            assertTrailingSeparator(uri_1.URI.parse('foo://a/foo/'), true);
            assertTrailingSeparator(uri_1.URI.parse('foo://a/'), false);
            assertTrailingSeparator(uri_1.URI.parse('foo://a'), false);
            assertRemoveTrailingSeparator(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo'));
            assertRemoveTrailingSeparator(uri_1.URI.parse('foo://a/foo/'), uri_1.URI.parse('foo://a/foo'));
            assertRemoveTrailingSeparator(uri_1.URI.parse('foo://a/'), uri_1.URI.parse('foo://a/'));
            assertRemoveTrailingSeparator(uri_1.URI.parse('foo://a'), uri_1.URI.parse('foo://a'));
            assertAddTrailingSeparator(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo/'));
            assertAddTrailingSeparator(uri_1.URI.parse('foo://a/foo/'), uri_1.URI.parse('foo://a/foo/'));
            assertAddTrailingSeparator(uri_1.URI.parse('foo://a/'), uri_1.URI.parse('foo://a/'));
            assertAddTrailingSeparator(uri_1.URI.parse('foo://a'), uri_1.URI.parse('foo://a/'));
            if (platform_1.isWindows) {
                assertTrailingSeparator(uri_1.URI.file('c:\\a\\foo'), false);
                assertTrailingSeparator(uri_1.URI.file('c:\\a\\foo\\'), true);
                assertTrailingSeparator(uri_1.URI.file('c:\\'), false);
                assertTrailingSeparator(uri_1.URI.file('\\\\server\\share\\some\\'), true);
                assertTrailingSeparator(uri_1.URI.file('\\\\server\\share\\'), false);
                assertRemoveTrailingSeparator(uri_1.URI.file('c:\\a\\foo'), uri_1.URI.file('c:\\a\\foo'));
                assertRemoveTrailingSeparator(uri_1.URI.file('c:\\a\\foo\\'), uri_1.URI.file('c:\\a\\foo'));
                assertRemoveTrailingSeparator(uri_1.URI.file('c:\\'), uri_1.URI.file('c:\\'));
                assertRemoveTrailingSeparator(uri_1.URI.file('\\\\server\\share\\some\\'), uri_1.URI.file('\\\\server\\share\\some'));
                assertRemoveTrailingSeparator(uri_1.URI.file('\\\\server\\share\\'), uri_1.URI.file('\\\\server\\share\\'));
                assertAddTrailingSeparator(uri_1.URI.file('c:\\a\\foo'), uri_1.URI.file('c:\\a\\foo\\'));
                assertAddTrailingSeparator(uri_1.URI.file('c:\\a\\foo\\'), uri_1.URI.file('c:\\a\\foo\\'));
                assertAddTrailingSeparator(uri_1.URI.file('c:\\'), uri_1.URI.file('c:\\'));
                assertAddTrailingSeparator(uri_1.URI.file('\\\\server\\share\\some'), uri_1.URI.file('\\\\server\\share\\some\\'));
                assertAddTrailingSeparator(uri_1.URI.file('\\\\server\\share\\some\\'), uri_1.URI.file('\\\\server\\share\\some\\'));
            }
            else {
                assertTrailingSeparator(uri_1.URI.file('/foo/bar'), false);
                assertTrailingSeparator(uri_1.URI.file('/foo/bar/'), true);
                assertTrailingSeparator(uri_1.URI.file('/'), false);
                assertRemoveTrailingSeparator(uri_1.URI.file('/foo/bar'), uri_1.URI.file('/foo/bar'));
                assertRemoveTrailingSeparator(uri_1.URI.file('/foo/bar/'), uri_1.URI.file('/foo/bar'));
                assertRemoveTrailingSeparator(uri_1.URI.file('/'), uri_1.URI.file('/'));
                assertAddTrailingSeparator(uri_1.URI.file('/foo/bar'), uri_1.URI.file('/foo/bar/'));
                assertAddTrailingSeparator(uri_1.URI.file('/foo/bar/'), uri_1.URI.file('/foo/bar/'));
                assertAddTrailingSeparator(uri_1.URI.file('/'), uri_1.URI.file('/'));
            }
        });
        function assertEqualURI(actual, expected, message, ignoreCase) {
            const util = ignoreCase ? resources_1.extUriIgnorePathCase : resources_1.extUri;
            if (!util.isEqual(expected, actual)) {
                assert.strictEqual(actual.toString(), expected.toString(), message);
            }
        }
        function assertRelativePath(u1, u2, expectedPath, ignoreJoin, ignoreCase) {
            const util = ignoreCase ? resources_1.extUriIgnorePathCase : resources_1.extUri;
            assert.strictEqual(util.relativePath(u1, u2), expectedPath, `from ${u1.toString()} to ${u2.toString()}`);
            if (expectedPath !== undefined && !ignoreJoin) {
                assertEqualURI((0, resources_1.removeTrailingPathSeparator)((0, resources_1.joinPath)(u1, expectedPath)), (0, resources_1.removeTrailingPathSeparator)(u2), 'joinPath on relativePath should be equal', ignoreCase);
            }
        }
        test('relativePath', () => {
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo/bar'), 'bar');
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo/bar/'), 'bar');
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo/bar/goo'), 'bar/goo');
            assertRelativePath(uri_1.URI.parse('foo://a/'), uri_1.URI.parse('foo://a/foo/bar/goo'), 'foo/bar/goo');
            assertRelativePath(uri_1.URI.parse('foo://a/foo/xoo'), uri_1.URI.parse('foo://a/foo/bar'), '../bar');
            assertRelativePath(uri_1.URI.parse('foo://a/foo/xoo/yoo'), uri_1.URI.parse('foo://a'), '../../..', true);
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo/'), '');
            assertRelativePath(uri_1.URI.parse('foo://a/foo/'), uri_1.URI.parse('foo://a/foo'), '');
            assertRelativePath(uri_1.URI.parse('foo://a/foo/'), uri_1.URI.parse('foo://a/foo/'), '');
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://a/foo'), '');
            assertRelativePath(uri_1.URI.parse('foo://a'), uri_1.URI.parse('foo://a'), '', true);
            assertRelativePath(uri_1.URI.parse('foo://a/'), uri_1.URI.parse('foo://a/'), '');
            assertRelativePath(uri_1.URI.parse('foo://a/'), uri_1.URI.parse('foo://a'), '', true);
            assertRelativePath(uri_1.URI.parse('foo://a/foo?q'), uri_1.URI.parse('foo://a/foo/bar#h'), 'bar', true);
            assertRelativePath(uri_1.URI.parse('foo://'), uri_1.URI.parse('foo://a/b'), undefined);
            assertRelativePath(uri_1.URI.parse('foo://a2/b'), uri_1.URI.parse('foo://a/b'), undefined);
            assertRelativePath(uri_1.URI.parse('goo://a/b'), uri_1.URI.parse('foo://a/b'), undefined);
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://A/FOO/bar/goo'), 'bar/goo', false, true);
            assertRelativePath(uri_1.URI.parse('foo://a/foo'), uri_1.URI.parse('foo://A/FOO/BAR/GOO'), 'BAR/GOO', false, true);
            assertRelativePath(uri_1.URI.parse('foo://a/foo/xoo'), uri_1.URI.parse('foo://A/FOO/BAR/GOO'), '../BAR/GOO', false, true);
            assertRelativePath(uri_1.URI.parse('foo:///c:/a/foo'), uri_1.URI.parse('foo:///C:/a/foo/xoo/'), 'xoo', false, true);
            if (platform_1.isWindows) {
                assertRelativePath(uri_1.URI.file('c:\\foo\\bar'), uri_1.URI.file('c:\\foo\\bar'), '');
                assertRelativePath(uri_1.URI.file('c:\\foo\\bar\\huu'), uri_1.URI.file('c:\\foo\\bar'), '..');
                assertRelativePath(uri_1.URI.file('c:\\foo\\bar\\a1\\a2'), uri_1.URI.file('c:\\foo\\bar'), '../..');
                assertRelativePath(uri_1.URI.file('c:\\foo\\bar\\'), uri_1.URI.file('c:\\foo\\bar\\a1\\a2'), 'a1/a2');
                assertRelativePath(uri_1.URI.file('c:\\foo\\bar\\'), uri_1.URI.file('c:\\foo\\bar\\a1\\a2\\'), 'a1/a2');
                assertRelativePath(uri_1.URI.file('c:\\'), uri_1.URI.file('c:\\foo\\bar'), 'foo/bar');
                assertRelativePath(uri_1.URI.file('\\\\server\\share\\some\\'), uri_1.URI.file('\\\\server\\share\\some\\path'), 'path');
                assertRelativePath(uri_1.URI.file('\\\\server\\share\\some\\'), uri_1.URI.file('\\\\server\\share2\\some\\path'), '../../share2/some/path', true); // ignore joinPath assert: path.join is not root aware
            }
            else {
                assertRelativePath(uri_1.URI.file('/a/foo'), uri_1.URI.file('/a/foo/bar'), 'bar');
                assertRelativePath(uri_1.URI.file('/a/foo'), uri_1.URI.file('/a/foo/bar/'), 'bar');
                assertRelativePath(uri_1.URI.file('/a/foo'), uri_1.URI.file('/a/foo/bar/goo'), 'bar/goo');
                assertRelativePath(uri_1.URI.file('/a/'), uri_1.URI.file('/a/foo/bar/goo'), 'foo/bar/goo');
                assertRelativePath(uri_1.URI.file('/'), uri_1.URI.file('/a/foo/bar/goo'), 'a/foo/bar/goo');
                assertRelativePath(uri_1.URI.file('/a/foo/xoo'), uri_1.URI.file('/a/foo/bar'), '../bar');
                assertRelativePath(uri_1.URI.file('/a/foo/xoo/yoo'), uri_1.URI.file('/a'), '../../..');
                assertRelativePath(uri_1.URI.file('/a/foo'), uri_1.URI.file('/a/foo/'), '');
                assertRelativePath(uri_1.URI.file('/a/foo'), uri_1.URI.file('/b/foo/'), '../../b/foo');
            }
        });
        function assertResolve(u1, path, expected) {
            const actual = (0, resources_1.resolvePath)(u1, path);
            assertEqualURI(actual, expected, `from ${u1.toString()} and ${path}`);
            const p = path.indexOf('/') !== -1 ? path_1.posix : path_1.win32;
            if (!p.isAbsolute(path)) {
                let expectedPath = platform_1.isWindows ? (0, extpath_1.toSlashes)(path) : path;
                expectedPath = expectedPath.startsWith('./') ? expectedPath.substr(2) : expectedPath;
                assert.strictEqual((0, resources_1.relativePath)(u1, actual), expectedPath, `relativePath (${u1.toString()}) on actual (${actual.toString()}) should be to path (${expectedPath})`);
            }
        }
        test('resolve', () => {
            if (platform_1.isWindows) {
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), 'file.js', uri_1.URI.file('c:\\foo\\bar\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), 't\\file.js', uri_1.URI.file('c:\\foo\\bar\\t\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), '.\\t\\file.js', uri_1.URI.file('c:\\foo\\bar\\t\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), 'a1/file.js', uri_1.URI.file('c:\\foo\\bar\\a1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), './a1/file.js', uri_1.URI.file('c:\\foo\\bar\\a1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), '\\b1\\file.js', uri_1.URI.file('c:\\b1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar'), '/b1/file.js', uri_1.URI.file('c:\\b1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\foo\\bar\\'), 'file.js', uri_1.URI.file('c:\\foo\\bar\\file.js'));
                assertResolve(uri_1.URI.file('c:\\'), 'file.js', uri_1.URI.file('c:\\file.js'));
                assertResolve(uri_1.URI.file('c:\\'), '\\b1\\file.js', uri_1.URI.file('c:\\b1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\'), '/b1/file.js', uri_1.URI.file('c:\\b1\\file.js'));
                assertResolve(uri_1.URI.file('c:\\'), 'd:\\foo\\bar.txt', uri_1.URI.file('d:\\foo\\bar.txt'));
                assertResolve(uri_1.URI.file('\\\\server\\share\\some\\'), 'b1\\file.js', uri_1.URI.file('\\\\server\\share\\some\\b1\\file.js'));
                assertResolve(uri_1.URI.file('\\\\server\\share\\some\\'), '\\file.js', uri_1.URI.file('\\\\server\\share\\file.js'));
                assertResolve(uri_1.URI.file('c:\\'), '\\\\server\\share\\some\\', uri_1.URI.file('\\\\server\\share\\some'));
                assertResolve(uri_1.URI.file('\\\\server\\share\\some\\'), 'c:\\', uri_1.URI.file('c:\\'));
            }
            else {
                assertResolve(uri_1.URI.file('/foo/bar'), 'file.js', uri_1.URI.file('/foo/bar/file.js'));
                assertResolve(uri_1.URI.file('/foo/bar'), './file.js', uri_1.URI.file('/foo/bar/file.js'));
                assertResolve(uri_1.URI.file('/foo/bar'), '/file.js', uri_1.URI.file('/file.js'));
                assertResolve(uri_1.URI.file('/foo/bar/'), 'file.js', uri_1.URI.file('/foo/bar/file.js'));
                assertResolve(uri_1.URI.file('/'), 'file.js', uri_1.URI.file('/file.js'));
                assertResolve(uri_1.URI.file(''), './file.js', uri_1.URI.file('/file.js'));
                assertResolve(uri_1.URI.file(''), '/file.js', uri_1.URI.file('/file.js'));
            }
            assertResolve(uri_1.URI.parse('foo://server/foo/bar'), 'file.js', uri_1.URI.parse('foo://server/foo/bar/file.js'));
            assertResolve(uri_1.URI.parse('foo://server/foo/bar'), './file.js', uri_1.URI.parse('foo://server/foo/bar/file.js'));
            assertResolve(uri_1.URI.parse('foo://server/foo/bar'), './file.js', uri_1.URI.parse('foo://server/foo/bar/file.js'));
            assertResolve(uri_1.URI.parse('foo://server/foo/bar'), 'c:\\a1\\b1', uri_1.URI.parse('foo://server/c:/a1/b1'));
            assertResolve(uri_1.URI.parse('foo://server/foo/bar'), 'c:\\', uri_1.URI.parse('foo://server/c:'));
        });
        function assertIsEqual(u1, u2, ignoreCase, expected) {
            const util = ignoreCase ? resources_1.extUriIgnorePathCase : resources_1.extUri;
            assert.strictEqual(util.isEqual(u1, u2), expected, `${u1.toString()}${expected ? '===' : '!=='}${u2.toString()}`);
            assert.strictEqual(util.compare(u1, u2) === 0, expected);
            assert.strictEqual(util.getComparisonKey(u1) === util.getComparisonKey(u2), expected, `comparison keys ${u1.toString()}, ${u2.toString()}`);
            assert.strictEqual(util.isEqualOrParent(u1, u2), expected, `isEqualOrParent ${u1.toString()}, ${u2.toString()}`);
            if (!ignoreCase) {
                assert.strictEqual(u1.toString() === u2.toString(), expected);
            }
        }
        test('isEqual', () => {
            const fileURI = platform_1.isWindows ? uri_1.URI.file('c:\\foo\\bar') : uri_1.URI.file('/foo/bar');
            const fileURI2 = platform_1.isWindows ? uri_1.URI.file('C:\\foo\\Bar') : uri_1.URI.file('/foo/Bar');
            assertIsEqual(fileURI, fileURI, true, true);
            assertIsEqual(fileURI, fileURI, false, true);
            assertIsEqual(fileURI, fileURI, undefined, true);
            assertIsEqual(fileURI, fileURI2, true, true);
            assertIsEqual(fileURI, fileURI2, false, false);
            const fileURI3 = uri_1.URI.parse('foo://server:453/foo/bar');
            const fileURI4 = uri_1.URI.parse('foo://server:453/foo/Bar');
            assertIsEqual(fileURI3, fileURI3, true, true);
            assertIsEqual(fileURI3, fileURI3, false, true);
            assertIsEqual(fileURI3, fileURI3, undefined, true);
            assertIsEqual(fileURI3, fileURI4, true, true);
            assertIsEqual(fileURI3, fileURI4, false, false);
            assertIsEqual(fileURI, fileURI3, true, false);
            assertIsEqual(uri_1.URI.parse('file://server'), uri_1.URI.parse('file://server/'), true, true);
            assertIsEqual(uri_1.URI.parse('http://server'), uri_1.URI.parse('http://server/'), true, true);
            assertIsEqual(uri_1.URI.parse('foo://server'), uri_1.URI.parse('foo://server/'), true, false); // only selected scheme have / as the default path
            assertIsEqual(uri_1.URI.parse('foo://server/foo'), uri_1.URI.parse('foo://server/foo/'), true, false);
            assertIsEqual(uri_1.URI.parse('foo://server/foo'), uri_1.URI.parse('foo://server/foo?'), true, true);
            const fileURI5 = uri_1.URI.parse('foo://server:453/foo/bar?q=1');
            const fileURI6 = uri_1.URI.parse('foo://server:453/foo/bar#xy');
            assertIsEqual(fileURI5, fileURI5, true, true);
            assertIsEqual(fileURI5, fileURI3, true, false);
            assertIsEqual(fileURI6, fileURI6, true, true);
            assertIsEqual(fileURI6, fileURI5, true, false);
            assertIsEqual(fileURI6, fileURI3, true, false);
        });
        test('isEqualOrParent', () => {
            const fileURI = platform_1.isWindows ? uri_1.URI.file('c:\\foo\\bar') : uri_1.URI.file('/foo/bar');
            const fileURI2 = platform_1.isWindows ? uri_1.URI.file('c:\\foo') : uri_1.URI.file('/foo');
            const fileURI2b = platform_1.isWindows ? uri_1.URI.file('C:\\Foo\\') : uri_1.URI.file('/Foo/');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI, fileURI), true, '1');
            assert.strictEqual(resources_1.extUri.isEqualOrParent(fileURI, fileURI), true, '2');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI, fileURI2), true, '3');
            assert.strictEqual(resources_1.extUri.isEqualOrParent(fileURI, fileURI2), true, '4');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI, fileURI2b), true, '5');
            assert.strictEqual(resources_1.extUri.isEqualOrParent(fileURI, fileURI2b), false, '6');
            assert.strictEqual(resources_1.extUri.isEqualOrParent(fileURI2, fileURI), false, '7');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI2b, fileURI2), true, '8');
            const fileURI3 = uri_1.URI.parse('foo://server:453/foo/bar/goo');
            const fileURI4 = uri_1.URI.parse('foo://server:453/foo/');
            const fileURI5 = uri_1.URI.parse('foo://server:453/foo');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI3, fileURI3, true), true, '11');
            assert.strictEqual(resources_1.extUri.isEqualOrParent(fileURI3, fileURI3), true, '12');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI3, fileURI4, true), true, '13');
            assert.strictEqual(resources_1.extUri.isEqualOrParent(fileURI3, fileURI4), true, '14');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI3, fileURI, true), false, '15');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI5, fileURI5, true), true, '16');
            const fileURI6 = uri_1.URI.parse('foo://server:453/foo?q=1');
            const fileURI7 = uri_1.URI.parse('foo://server:453/foo/bar?q=1');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI6, fileURI5), false, '17');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI6, fileURI6), true, '18');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI7, fileURI6), true, '19');
            assert.strictEqual(resources_1.extUriIgnorePathCase.isEqualOrParent(fileURI7, fileURI5), false, '20');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vcmVzb3VyY2VzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBYUEsS0FBSyxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7UUFFdkIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7WUFFNUIsUUFBUTtZQUNSLElBQUksU0FBUyxHQUFHO2dCQUNmLFNBQUcsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUM7Z0JBQ2xDLFNBQUcsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUM7Z0JBQ2xDLFNBQUcsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUM7YUFDbEMsQ0FBQztZQUVGLElBQUksUUFBUSxHQUFHLElBQUEsMkJBQWUsRUFBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxD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