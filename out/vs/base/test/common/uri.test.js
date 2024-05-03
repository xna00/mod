define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils"], function (require, exports, assert, platform_1, uri_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('URI', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('file#toString', () => {
            assert.strictEqual(uri_1.URI.file('c:/win/path').toString(), 'file:///c%3A/win/path');
            assert.strictEqual(uri_1.URI.file('C:/win/path').toString(), 'file:///c%3A/win/path');
            assert.strictEqual(uri_1.URI.file('c:/win/path/').toString(), 'file:///c%3A/win/path/');
            assert.strictEqual(uri_1.URI.file('/c:/win/path').toString(), 'file:///c%3A/win/path');
        });
        test('URI.file (win-special)', () => {
            if (platform_1.isWindows) {
                assert.strictEqual(uri_1.URI.file('c:\\win\\path').toString(), 'file:///c%3A/win/path');
                assert.strictEqual(uri_1.URI.file('c:\\win/path').toString(), 'file:///c%3A/win/path');
            }
            else {
                assert.strictEqual(uri_1.URI.file('c:\\win\\path').toString(), 'file:///c%3A%5Cwin%5Cpath');
                assert.strictEqual(uri_1.URI.file('c:\\win/path').toString(), 'file:///c%3A%5Cwin/path');
            }
        });
        test('file#fsPath (win-special)', () => {
            if (platform_1.isWindows) {
                assert.strictEqual(uri_1.URI.file('c:\\win\\path').fsPath, 'c:\\win\\path');
                assert.strictEqual(uri_1.URI.file('c:\\win/path').fsPath, 'c:\\win\\path');
                assert.strictEqual(uri_1.URI.file('c:/win/path').fsPath, 'c:\\win\\path');
                assert.strictEqual(uri_1.URI.file('c:/win/path/').fsPath, 'c:\\win\\path\\');
                assert.strictEqual(uri_1.URI.file('C:/win/path').fsPath, 'c:\\win\\path');
                assert.strictEqual(uri_1.URI.file('/c:/win/path').fsPath, 'c:\\win\\path');
                assert.strictEqual(uri_1.URI.file('./c/win/path').fsPath, '\\.\\c\\win\\path');
            }
            else {
                assert.strictEqual(uri_1.URI.file('c:/win/path').fsPath, 'c:/win/path');
                assert.strictEqual(uri_1.URI.file('c:/win/path/').fsPath, 'c:/win/path/');
                assert.strictEqual(uri_1.URI.file('C:/win/path').fsPath, 'c:/win/path');
                assert.strictEqual(uri_1.URI.file('/c:/win/path').fsPath, 'c:/win/path');
                assert.strictEqual(uri_1.URI.file('./c/win/path').fsPath, '/./c/win/path');
            }
        });
        test('URI#fsPath - no `fsPath` when no `path`', () => {
            const value = uri_1.URI.parse('file://%2Fhome%2Fticino%2Fdesktop%2Fcpluscplus%2Ftest.cpp');
            assert.strictEqual(value.authority, '/home/ticino/desktop/cpluscplus/test.cpp');
            assert.strictEqual(value.path, '/');
            if (platform_1.isWindows) {
                assert.strictEqual(value.fsPath, '\\');
            }
            else {
                assert.strictEqual(value.fsPath, '/');
            }
        });
        test('http#toString', () => {
            assert.strictEqual(uri_1.URI.from({ scheme: 'http', authority: 'www.example.com', path: '/my/path' }).toString(), 'http://www.example.com/my/path');
            assert.strictEqual(uri_1.URI.from({ scheme: 'http', authority: 'www.example.com', path: '/my/path' }).toString(), 'http://www.example.com/my/path');
            assert.strictEqual(uri_1.URI.from({ scheme: 'http', authority: 'www.EXAMPLE.com', path: '/my/path' }).toString(), 'http://www.example.com/my/path');
            assert.strictEqual(uri_1.URI.from({ scheme: 'http', authority: '', path: 'my/path' }).toString(), 'http:/my/path');
            assert.strictEqual(uri_1.URI.from({ scheme: 'http', authority: '', path: '/my/path' }).toString(), 'http:/my/path');
            //http://example.com/#test=true
            assert.strictEqual(uri_1.URI.from({ scheme: 'http', authority: 'example.com', path: '/', query: 'test=true' }).toString(), 'http://example.com/?test%3Dtrue');
            assert.strictEqual(uri_1.URI.from({ scheme: 'http', authority: 'example.com', path: '/', query: '', fragment: 'test=true' }).toString(), 'http://example.com/#test%3Dtrue');
        });
        test('http#toString, encode=FALSE', () => {
            assert.strictEqual(uri_1.URI.from({ scheme: 'http', authority: 'example.com', path: '/', query: 'test=true' }).toString(true), 'http://example.com/?test=true');
            assert.strictEqual(uri_1.URI.from({ scheme: 'http', authority: 'example.com', path: '/', query: '', fragment: 'test=true' }).toString(true), 'http://example.com/#test=true');
            assert.strictEqual(uri_1.URI.from({ scheme: 'http', path: '/api/files/test.me', query: 't=1234' }).toString(true), 'http:/api/files/test.me?t=1234');
            const value = uri_1.URI.parse('file://shares/pröjects/c%23/#l12');
            assert.strictEqual(value.authority, 'shares');
            assert.strictEqual(value.path, '/pröjects/c#/');
            assert.strictEqual(value.fragment, 'l12');
            assert.strictEqual(value.toString(), 'file://shares/pr%C3%B6jects/c%23/#l12');
            assert.strictEqual(value.toString(true), 'file://shares/pröjects/c%23/#l12');
            const uri2 = uri_1.URI.parse(value.toString(true));
            const uri3 = uri_1.URI.parse(value.toString());
            assert.strictEqual(uri2.authority, uri3.authority);
            assert.strictEqual(uri2.path, uri3.path);
            assert.strictEqual(uri2.query, uri3.query);
            assert.strictEqual(uri2.fragment, uri3.fragment);
        });
        test('with, identity', () => {
            const uri = uri_1.URI.parse('foo:bar/path');
            let uri2 = uri.with(null);
            assert.ok(uri === uri2);
            uri2 = uri.with(undefined);
            assert.ok(uri === uri2);
            uri2 = uri.with({});
            assert.ok(uri === uri2);
            uri2 = uri.with({ scheme: 'foo', path: 'bar/path' });
            assert.ok(uri === uri2);
        });
        test('with, changes', () => {
            assert.strictEqual(uri_1.URI.parse('before:some/file/path').with({ scheme: 'after' }).toString(), 'after:some/file/path');
            assert.strictEqual(uri_1.URI.from({ scheme: 's' }).with({ scheme: 'http', path: '/api/files/test.me', query: 't=1234' }).toString(), 'http:/api/files/test.me?t%3D1234');
            assert.strictEqual(uri_1.URI.from({ scheme: 's' }).with({ scheme: 'http', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' }).toString(), 'http:/api/files/test.me?t%3D1234');
            assert.strictEqual(uri_1.URI.from({ scheme: 's' }).with({ scheme: 'https', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' }).toString(), 'https:/api/files/test.me?t%3D1234');
            assert.strictEqual(uri_1.URI.from({ scheme: 's' }).with({ scheme: 'HTTP', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' }).toString(), 'HTTP:/api/files/test.me?t%3D1234');
            assert.strictEqual(uri_1.URI.from({ scheme: 's' }).with({ scheme: 'HTTPS', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' }).toString(), 'HTTPS:/api/files/test.me?t%3D1234');
            assert.strictEqual(uri_1.URI.from({ scheme: 's' }).with({ scheme: 'boo', authority: '', path: '/api/files/test.me', query: 't=1234', fragment: '' }).toString(), 'boo:/api/files/test.me?t%3D1234');
        });
        test('with, remove components #8465', () => {
            assert.strictEqual(uri_1.URI.parse('scheme://authority/path').with({ authority: '' }).toString(), 'scheme:/path');
            assert.strictEqual(uri_1.URI.parse('scheme:/path').with({ authority: 'authority' }).with({ authority: '' }).toString(), 'scheme:/path');
            assert.strictEqual(uri_1.URI.parse('scheme:/path').with({ authority: 'authority' }).with({ authority: null }).toString(), 'scheme:/path');
            assert.strictEqual(uri_1.URI.parse('scheme:/path').with({ authority: 'authority' }).with({ path: '' }).toString(), 'scheme://authority');
            assert.strictEqual(uri_1.URI.parse('scheme:/path').with({ authority: 'authority' }).with({ path: null }).toString(), 'scheme://authority');
            assert.strictEqual(uri_1.URI.parse('scheme:/path').with({ authority: '' }).toString(), 'scheme:/path');
            assert.strictEqual(uri_1.URI.parse('scheme:/path').with({ authority: null }).toString(), 'scheme:/path');
        });
        test('with, validation', () => {
            const uri = uri_1.URI.parse('foo:bar/path');
            assert.throws(() => uri.with({ scheme: 'fai:l' }));
            assert.throws(() => uri.with({ scheme: 'fäil' }));
            assert.throws(() => uri.with({ authority: 'fail' }));
            assert.throws(() => uri.with({ path: '//fail' }));
        });
        test('parse', () => {
            let value = uri_1.URI.parse('http:/api/files/test.me?t=1234');
            assert.strictEqual(value.scheme, 'http');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, '/api/files/test.me');
            assert.strictEqual(value.query, 't=1234');
            assert.strictEqual(value.fragment, '');
            value = uri_1.URI.parse('http://api/files/test.me?t=1234');
            assert.strictEqual(value.scheme, 'http');
            assert.strictEqual(value.authority, 'api');
            assert.strictEqual(value.path, '/files/test.me');
            assert.strictEqual(value.query, 't=1234');
            assert.strictEqual(value.fragment, '');
            value = uri_1.URI.parse('file:///c:/test/me');
            assert.strictEqual(value.scheme, 'file');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, '/c:/test/me');
            assert.strictEqual(value.fragment, '');
            assert.strictEqual(value.query, '');
            assert.strictEqual(value.fsPath, platform_1.isWindows ? 'c:\\test\\me' : 'c:/test/me');
            value = uri_1.URI.parse('file://shares/files/c%23/p.cs');
            assert.strictEqual(value.scheme, 'file');
            assert.strictEqual(value.authority, 'shares');
            assert.strictEqual(value.path, '/files/c#/p.cs');
            assert.strictEqual(value.fragment, '');
            assert.strictEqual(value.query, '');
            assert.strictEqual(value.fsPath, platform_1.isWindows ? '\\\\shares\\files\\c#\\p.cs' : '//shares/files/c#/p.cs');
            value = uri_1.URI.parse('file:///c:/Source/Z%C3%BCrich%20or%20Zurich%20(%CB%88zj%CA%8A%C9%99r%C9%AAk,/Code/resources/app/plugins/c%23/plugin.json');
            assert.strictEqual(value.scheme, 'file');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, '/c:/Source/Zürich or Zurich (ˈzjʊərɪk,/Code/resources/app/plugins/c#/plugin.json');
            assert.strictEqual(value.fragment, '');
            assert.strictEqual(value.query, '');
            value = uri_1.URI.parse('file:///c:/test %25/path');
            assert.strictEqual(value.scheme, 'file');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, '/c:/test %/path');
            assert.strictEqual(value.fragment, '');
            assert.strictEqual(value.query, '');
            value = uri_1.URI.parse('inmemory:');
            assert.strictEqual(value.scheme, 'inmemory');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, '');
            assert.strictEqual(value.query, '');
            assert.strictEqual(value.fragment, '');
            value = uri_1.URI.parse('foo:api/files/test');
            assert.strictEqual(value.scheme, 'foo');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, 'api/files/test');
            assert.strictEqual(value.query, '');
            assert.strictEqual(value.fragment, '');
            value = uri_1.URI.parse('file:?q');
            assert.strictEqual(value.scheme, 'file');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, '/');
            assert.strictEqual(value.query, 'q');
            assert.strictEqual(value.fragment, '');
            value = uri_1.URI.parse('file:#d');
            assert.strictEqual(value.scheme, 'file');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, '/');
            assert.strictEqual(value.query, '');
            assert.strictEqual(value.fragment, 'd');
            value = uri_1.URI.parse('f3ile:#d');
            assert.strictEqual(value.scheme, 'f3ile');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, '');
            assert.strictEqual(value.query, '');
            assert.strictEqual(value.fragment, 'd');
            value = uri_1.URI.parse('foo+bar:path');
            assert.strictEqual(value.scheme, 'foo+bar');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, 'path');
            assert.strictEqual(value.query, '');
            assert.strictEqual(value.fragment, '');
            value = uri_1.URI.parse('foo-bar:path');
            assert.strictEqual(value.scheme, 'foo-bar');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, 'path');
            assert.strictEqual(value.query, '');
            assert.strictEqual(value.fragment, '');
            value = uri_1.URI.parse('foo.bar:path');
            assert.strictEqual(value.scheme, 'foo.bar');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, 'path');
            assert.strictEqual(value.query, '');
            assert.strictEqual(value.fragment, '');
        });
        test('parse, disallow //path when no authority', () => {
            assert.throws(() => uri_1.URI.parse('file:////shares/files/p.cs'));
        });
        test('URI#file, win-speciale', () => {
            if (platform_1.isWindows) {
                let value = uri_1.URI.file('c:\\test\\drive');
                assert.strictEqual(value.path, '/c:/test/drive');
                assert.strictEqual(value.toString(), 'file:///c%3A/test/drive');
                value = uri_1.URI.file('\\\\shäres\\path\\c#\\plugin.json');
                assert.strictEqual(value.scheme, 'file');
                assert.strictEqual(value.authority, 'shäres');
                assert.strictEqual(value.path, '/path/c#/plugin.json');
                assert.strictEqual(value.fragment, '');
                assert.strictEqual(value.query, '');
                assert.strictEqual(value.toString(), 'file://sh%C3%A4res/path/c%23/plugin.json');
                value = uri_1.URI.file('\\\\localhost\\c$\\GitDevelopment\\express');
                assert.strictEqual(value.scheme, 'file');
                assert.strictEqual(value.path, '/c$/GitDevelopment/express');
                assert.strictEqual(value.fsPath, '\\\\localhost\\c$\\GitDevelopment\\express');
                assert.strictEqual(value.query, '');
                assert.strictEqual(value.fragment, '');
                assert.strictEqual(value.toString(), 'file://localhost/c%24/GitDevelopment/express');
                value = uri_1.URI.file('c:\\test with %\\path');
                assert.strictEqual(value.path, '/c:/test with %/path');
                assert.strictEqual(value.toString(), 'file:///c%3A/test%20with%20%25/path');
                value = uri_1.URI.file('c:\\test with %25\\path');
                assert.strictEqual(value.path, '/c:/test with %25/path');
                assert.strictEqual(value.toString(), 'file:///c%3A/test%20with%20%2525/path');
                value = uri_1.URI.file('c:\\test with %25\\c#code');
                assert.strictEqual(value.path, '/c:/test with %25/c#code');
                assert.strictEqual(value.toString(), 'file:///c%3A/test%20with%20%2525/c%23code');
                value = uri_1.URI.file('\\\\shares');
                assert.strictEqual(value.scheme, 'file');
                assert.strictEqual(value.authority, 'shares');
                assert.strictEqual(value.path, '/'); // slash is always there
                value = uri_1.URI.file('\\\\shares\\');
                assert.strictEqual(value.scheme, 'file');
                assert.strictEqual(value.authority, 'shares');
                assert.strictEqual(value.path, '/');
            }
        });
        test('VSCode URI module\'s driveLetterPath regex is incorrect, #32961', function () {
            const uri = uri_1.URI.parse('file:///_:/path');
            assert.strictEqual(uri.fsPath, platform_1.isWindows ? '\\_:\\path' : '/_:/path');
        });
        test('URI#file, no path-is-uri check', () => {
            // we don't complain here
            const value = uri_1.URI.file('file://path/to/file');
            assert.strictEqual(value.scheme, 'file');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, '/file://path/to/file');
        });
        test('URI#file, always slash', () => {
            let value = uri_1.URI.file('a.file');
            assert.strictEqual(value.scheme, 'file');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, '/a.file');
            assert.strictEqual(value.toString(), 'file:///a.file');
            value = uri_1.URI.parse(value.toString());
            assert.strictEqual(value.scheme, 'file');
            assert.strictEqual(value.authority, '');
            assert.strictEqual(value.path, '/a.file');
            assert.strictEqual(value.toString(), 'file:///a.file');
        });
        test('URI.toString, only scheme and query', () => {
            const value = uri_1.URI.parse('stuff:?qüery');
            assert.strictEqual(value.toString(), 'stuff:?q%C3%BCery');
        });
        test('URI#toString, upper-case percent espaces', () => {
            const value = uri_1.URI.parse('file://sh%c3%a4res/path');
            assert.strictEqual(value.toString(), 'file://sh%C3%A4res/path');
        });
        test('URI#toString, lower-case windows drive letter', () => {
            assert.strictEqual(uri_1.URI.parse('untitled:c:/Users/jrieken/Code/abc.txt').toString(), 'untitled:c%3A/Users/jrieken/Code/abc.txt');
            assert.strictEqual(uri_1.URI.parse('untitled:C:/Users/jrieken/Code/abc.txt').toString(), 'untitled:c%3A/Users/jrieken/Code/abc.txt');
        });
        test('URI#toString, escape all the bits', () => {
            const value = uri_1.URI.file('/Users/jrieken/Code/_samples/18500/Mödel + Other Thîngß/model.js');
            assert.strictEqual(value.toString(), 'file:///Users/jrieken/Code/_samples/18500/M%C3%B6del%20%2B%20Other%20Th%C3%AEng%C3%9F/model.js');
        });
        test('URI#toString, don\'t encode port', () => {
            let value = uri_1.URI.parse('http://localhost:8080/far');
            assert.strictEqual(value.toString(), 'http://localhost:8080/far');
            value = uri_1.URI.from({ scheme: 'http', authority: 'löcalhost:8080', path: '/far', query: undefined, fragment: undefined });
            assert.strictEqual(value.toString(), 'http://l%C3%B6calhost:8080/far');
        });
        test('URI#toString, user information in authority', () => {
            let value = uri_1.URI.parse('http://foo:bar@localhost/far');
            assert.strictEqual(value.toString(), 'http://foo:bar@localhost/far');
            value = uri_1.URI.parse('http://foo@localhost/far');
            assert.strictEqual(value.toString(), 'http://foo@localhost/far');
            value = uri_1.URI.parse('http://foo:bAr@localhost:8080/far');
            assert.strictEqual(value.toString(), 'http://foo:bAr@localhost:8080/far');
            value = uri_1.URI.parse('http://foo@localhost:8080/far');
            assert.strictEqual(value.toString(), 'http://foo@localhost:8080/far');
            value = uri_1.URI.from({ scheme: 'http', authority: 'föö:bör@löcalhost:8080', path: '/far', query: undefined, fragment: undefined });
            assert.strictEqual(value.toString(), 'http://f%C3%B6%C3%B6:b%C3%B6r@l%C3%B6calhost:8080/far');
        });
        test('correctFileUriToFilePath2', () => {
            const test = (input, expected) => {
                const value = uri_1.URI.parse(input);
                assert.strictEqual(value.fsPath, expected, 'Result for ' + input);
                const value2 = uri_1.URI.file(value.fsPath);
                assert.strictEqual(value2.fsPath, expected, 'Result for ' + input);
                assert.strictEqual(value.toString(), value2.toString());
            };
            test('file:///c:/alex.txt', platform_1.isWindows ? 'c:\\alex.txt' : 'c:/alex.txt');
            test('file:///c:/Source/Z%C3%BCrich%20or%20Zurich%20(%CB%88zj%CA%8A%C9%99r%C9%AAk,/Code/resources/app/plugins', platform_1.isWindows ? 'c:\\Source\\Zürich or Zurich (ˈzjʊərɪk,\\Code\\resources\\app\\plugins' : 'c:/Source/Zürich or Zurich (ˈzjʊərɪk,/Code/resources/app/plugins');
            test('file://monacotools/folder/isi.txt', platform_1.isWindows ? '\\\\monacotools\\folder\\isi.txt' : '//monacotools/folder/isi.txt');
            test('file://monacotools1/certificates/SSL/', platform_1.isWindows ? '\\\\monacotools1\\certificates\\SSL\\' : '//monacotools1/certificates/SSL/');
        });
        test('URI - http, query & toString', function () {
            let uri = uri_1.URI.parse('https://go.microsoft.com/fwlink/?LinkId=518008');
            assert.strictEqual(uri.query, 'LinkId=518008');
            assert.strictEqual(uri.toString(true), 'https://go.microsoft.com/fwlink/?LinkId=518008');
            assert.strictEqual(uri.toString(), 'https://go.microsoft.com/fwlink/?LinkId%3D518008');
            let uri2 = uri_1.URI.parse(uri.toString());
            assert.strictEqual(uri2.query, 'LinkId=518008');
            assert.strictEqual(uri2.query, uri.query);
            uri = uri_1.URI.parse('https://go.microsoft.com/fwlink/?LinkId=518008&foö&ké¥=üü');
            assert.strictEqual(uri.query, 'LinkId=518008&foö&ké¥=üü');
            assert.strictEqual(uri.toString(true), 'https://go.microsoft.com/fwlink/?LinkId=518008&foö&ké¥=üü');
            assert.strictEqual(uri.toString(), 'https://go.microsoft.com/fwlink/?LinkId%3D518008%26fo%C3%B6%26k%C3%A9%C2%A5%3D%C3%BC%C3%BC');
            uri2 = uri_1.URI.parse(uri.toString());
            assert.strictEqual(uri2.query, 'LinkId=518008&foö&ké¥=üü');
            assert.strictEqual(uri2.query, uri.query);
            // #24849
            uri = uri_1.URI.parse('https://twitter.com/search?src=typd&q=%23tag');
            assert.strictEqual(uri.toString(true), 'https://twitter.com/search?src=typd&q=%23tag');
        });
        test('class URI cannot represent relative file paths #34449', function () {
            let path = '/foo/bar';
            assert.strictEqual(uri_1.URI.file(path).path, path);
            path = 'foo/bar';
            assert.strictEqual(uri_1.URI.file(path).path, '/foo/bar');
            path = './foo/bar';
            assert.strictEqual(uri_1.URI.file(path).path, '/./foo/bar'); // missing normalization
            const fileUri1 = uri_1.URI.parse(`file:foo/bar`);
            assert.strictEqual(fileUri1.path, '/foo/bar');
            assert.strictEqual(fileUri1.authority, '');
            const uri = fileUri1.toString();
            assert.strictEqual(uri, 'file:///foo/bar');
            const fileUri2 = uri_1.URI.parse(uri);
            assert.strictEqual(fileUri2.path, '/foo/bar');
            assert.strictEqual(fileUri2.authority, '');
        });
        test('Ctrl click to follow hash query param url gets urlencoded #49628', function () {
            let input = 'http://localhost:3000/#/foo?bar=baz';
            let uri = uri_1.URI.parse(input);
            assert.strictEqual(uri.toString(true), input);
            input = 'http://localhost:3000/foo?bar=baz';
            uri = uri_1.URI.parse(input);
            assert.strictEqual(uri.toString(true), input);
        });
        test('Unable to open \'%A0.txt\': URI malformed #76506', function () {
            let uri = uri_1.URI.file('/foo/%A0.txt');
            let uri2 = uri_1.URI.parse(uri.toString());
            assert.strictEqual(uri.scheme, uri2.scheme);
            assert.strictEqual(uri.path, uri2.path);
            uri = uri_1.URI.file('/foo/%2e.txt');
            uri2 = uri_1.URI.parse(uri.toString());
            assert.strictEqual(uri.scheme, uri2.scheme);
            assert.strictEqual(uri.path, uri2.path);
        });
        test('Bug in URI.isUri() that fails `thing` type comparison #114971', function () {
            const uri = uri_1.URI.file('/foo/bazz.txt');
            assert.strictEqual(uri_1.URI.isUri(uri), true);
            assert.strictEqual(uri_1.URI.isUri(uri.toJSON()), false);
            // fsPath -> getter
            assert.strictEqual(uri_1.URI.isUri({
                scheme: 'file',
                authority: '',
                path: '/foo/bazz.txt',
                get fsPath() { return '/foo/bazz.txt'; },
                query: '',
                fragment: '',
                with() { return this; },
                toString() { return ''; }
            }), true);
            // fsPath -> property
            assert.strictEqual(uri_1.URI.isUri({
                scheme: 'file',
                authority: '',
                path: '/foo/bazz.txt',
                fsPath: '/foo/bazz.txt',
                query: '',
                fragment: '',
                with() { return this; },
                toString() { return ''; }
            }), true);
        });
        test('isUriComponents', function () {
            assert.ok((0, uri_1.isUriComponents)(uri_1.URI.file('a')));
            assert.ok((0, uri_1.isUriComponents)(uri_1.URI.file('a').toJSON()));
            assert.ok((0, uri_1.isUriComponents)(uri_1.URI.file('')));
            assert.ok((0, uri_1.isUriComponents)(uri_1.URI.file('').toJSON()));
            assert.strictEqual((0, uri_1.isUriComponents)(1), false);
            assert.strictEqual((0, uri_1.isUriComponents)(true), false);
            assert.strictEqual((0, uri_1.isUriComponents)("true"), false);
            assert.strictEqual((0, uri_1.isUriComponents)({}), false);
            assert.strictEqual((0, uri_1.isUriComponents)({ scheme: '' }), true); // valid components but INVALID uri
            assert.strictEqual((0, uri_1.isUriComponents)({ scheme: 'fo' }), true);
            assert.strictEqual((0, uri_1.isUriComponents)({ scheme: 'fo', path: '/p' }), true);
            assert.strictEqual((0, uri_1.isUriComponents)({ path: '/p' }), false);
        });
        test('from, from(strict), revive', function () {
            assert.throws(() => uri_1.URI.from({ scheme: '' }, true));
            assert.strictEqual(uri_1.URI.from({ scheme: '' }).scheme, 'file');
            assert.strictEqual(uri_1.URI.revive({ scheme: '' }).scheme, '');
        });
        test('Unable to open \'%A0.txt\': URI malformed #76506, part 2', function () {
            assert.strictEqual(uri_1.URI.parse('file://some/%.txt').toString(), 'file://some/%25.txt');
            assert.strictEqual(uri_1.URI.parse('file://some/%A0.txt').toString(), 'file://some/%25A0.txt');
        });
        test.skip('Links in markdown are broken if url contains encoded parameters #79474', function () {
            const strIn = 'https://myhost.com/Redirect?url=http%3A%2F%2Fwww.bing.com%3Fsearch%3Dtom';
            const uri1 = uri_1.URI.parse(strIn);
            const strOut = uri1.toString();
            const uri2 = uri_1.URI.parse(strOut);
            assert.strictEqual(uri1.scheme, uri2.scheme);
            assert.strictEqual(uri1.authority, uri2.authority);
            assert.strictEqual(uri1.path, uri2.path);
            assert.strictEqual(uri1.query, uri2.query);
            assert.strictEqual(uri1.fragment, uri2.fragment);
            assert.strictEqual(strIn, strOut); // fails here!!
        });
        test.skip('Uri#parse can break path-component #45515', function () {
            const strIn = 'https://firebasestorage.googleapis.com/v0/b/brewlangerie.appspot.com/o/products%2FzVNZkudXJyq8bPGTXUxx%2FBetterave-Sesame.jpg?alt=media&token=0b2310c4-3ea6-4207-bbde-9c3710ba0437';
            const uri1 = uri_1.URI.parse(strIn);
            const strOut = uri1.toString();
            const uri2 = uri_1.URI.parse(strOut);
            assert.strictEqual(uri1.scheme, uri2.scheme);
            assert.strictEqual(uri1.authority, uri2.authority);
            assert.strictEqual(uri1.path, uri2.path);
            assert.strictEqual(uri1.query, uri2.query);
            assert.strictEqual(uri1.fragment, uri2.fragment);
            assert.strictEqual(strIn, strOut); // fails here!!
        });
        test('URI - (de)serialize', function () {
            const values = [
                uri_1.URI.parse('http://localhost:8080/far'),
                uri_1.URI.file('c:\\test with %25\\c#code'),
                uri_1.URI.file('\\\\shäres\\path\\c#\\plugin.json'),
                uri_1.URI.parse('http://api/files/test.me?t=1234'),
                uri_1.URI.parse('http://api/files/test.me?t=1234#fff'),
                uri_1.URI.parse('http://api/files/test.me#fff'),
            ];
            // console.profile();
            // let c = 100000;
            // while (c-- > 0) {
            for (const value of values) {
                const data = value.toJSON();
                const clone = uri_1.URI.revive(data);
                assert.strictEqual(clone.scheme, value.scheme);
                assert.strictEqual(clone.authority, value.authority);
                assert.strictEqual(clone.path, value.path);
                assert.strictEqual(clone.query, value.query);
                assert.strictEqual(clone.fragment, value.fragment);
                assert.strictEqual(clone.fsPath, value.fsPath);
                assert.strictEqual(clone.toString(), value.toString());
            }
            // }
            // console.profileEnd();
        });
        function assertJoined(base, fragment, expected, checkWithUrl = true) {
            const baseUri = uri_1.URI.parse(base);
            const newUri = uri_1.URI.joinPath(baseUri, fragment);
            const actual = newUri.toString(true);
            assert.strictEqual(actual, expected);
            if (checkWithUrl) {
                const actualUrl = new URL(fragment, base).href;
                assert.strictEqual(actualUrl, expected, 'DIFFERENT from URL');
            }
        }
        test('URI#joinPath', function () {
            assertJoined(('file:///foo/'), '../../bazz', 'file:///bazz');
            assertJoined(('file:///foo'), '../../bazz', 'file:///bazz');
            assertJoined(('file:///foo'), '../../bazz', 'file:///bazz');
            assertJoined(('file:///foo/bar/'), './bazz', 'file:///foo/bar/bazz');
            assertJoined(('file:///foo/bar'), './bazz', 'file:///foo/bar/bazz', false);
            assertJoined(('file:///foo/bar'), 'bazz', 'file:///foo/bar/bazz', false);
            // "auto-path" scheme
            assertJoined(('file:'), 'bazz', 'file:///bazz');
            assertJoined(('http://domain'), 'bazz', 'http://domain/bazz');
            assertJoined(('https://domain'), 'bazz', 'https://domain/bazz');
            assertJoined(('http:'), 'bazz', 'http:/bazz', false);
            assertJoined(('https:'), 'bazz', 'https:/bazz', false);
            // no "auto-path" scheme with and w/o paths
            assertJoined(('foo:/'), 'bazz', 'foo:/bazz');
            assertJoined(('foo://bar/'), 'bazz', 'foo://bar/bazz');
            // no "auto-path" + no path -> error
            assert.throws(() => assertJoined(('foo:'), 'bazz', ''));
            assert.throws(() => new URL('bazz', 'foo:'));
            assert.throws(() => assertJoined(('foo://bar'), 'bazz', ''));
            // assert.throws(() => new URL('bazz', 'foo://bar')); Edge, Chrome => THROW, Firefox, Safari => foo://bar/bazz
        });
        test('URI#joinPath (posix)', function () {
            if (platform_1.isWindows) {
                this.skip();
            }
            assertJoined(('file:///c:/foo/'), '../../bazz', 'file:///bazz', false);
            assertJoined(('file://server/share/c:/'), '../../bazz', 'file://server/bazz', false);
            assertJoined(('file://server/share/c:'), '../../bazz', 'file://server/bazz', false);
            assertJoined(('file://ser/foo/'), '../../bazz', 'file://ser/bazz', false); // Firefox -> Different, Edge, Chrome, Safar -> OK
            assertJoined(('file://ser/foo'), '../../bazz', 'file://ser/bazz', false); // Firefox -> Different, Edge, Chrome, Safar -> OK
        });
        test('URI#joinPath (windows)', function () {
            if (!platform_1.isWindows) {
                this.skip();
            }
            assertJoined(('file:///c:/foo/'), '../../bazz', 'file:///c:/bazz', false);
            assertJoined(('file://server/share/c:/'), '../../bazz', 'file://server/share/bazz', false);
            assertJoined(('file://server/share/c:'), '../../bazz', 'file://server/share/bazz', false);
            assertJoined(('file://ser/foo/'), '../../bazz', 'file://ser/foo/bazz', false);
            assertJoined(('file://ser/foo'), '../../bazz', 'file://ser/foo/bazz', false);
            //https://github.com/microsoft/vscode/issues/93831
            assertJoined('file:///c:/foo/bar', './other/foo.img', 'file:///c:/foo/bar/other/foo.img', false);
        });
        test('vscode-uri: URI.toString() wrongly encode IPv6 literals #154048', function () {
            assert.strictEqual(uri_1.URI.parse('http://[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html').toString(), 'http://[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/index.html');
            assert.strictEqual(uri_1.URI.parse('http://user@[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html').toString(), 'http://user@[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/index.html');
            assert.strictEqual(uri_1.URI.parse('http://us[er@[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html').toString(), 'http://us%5Ber@[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/index.html');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJpLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vdXJpLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBVUEsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUU7UUFDakIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1lBQzFCLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1FBQ2xGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtZQUNuQyxJQUFJLG9CQUFTLEVBQUUsQ0FBQztnQkFDZixNQUFNLENBQUMsV0FBVyxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztnQkFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxF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QUFFLGtDQUFrQyxDQUFDLENBQUM7WUFDbkssTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLGtDQUFrQyxDQUFDLENBQUM7WUFDaE0sTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLG1DQUFtQyxDQUFDLENBQUM7WUFDbE0sTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLGtDQUFrQyxDQUFDLENBQUM7WUFDaE0sTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxL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bEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV2QyxLQUFLLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXZDLEtBQUssR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDeEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLE1B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