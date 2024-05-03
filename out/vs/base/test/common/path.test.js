/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/base/test/common/utils"], function (require, exports, assert, path, platform_1, process, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Paths (Node Implementation)', () => {
        const __filename = 'path.test.js';
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('join', () => {
            const failures = [];
            const backslashRE = /\\/g;
            const joinTests = [
                [[path.posix.join, path.win32.join],
                    // arguments                     result
                    [[['.', 'x/b', '..', '/b/c.js'], 'x/b/c.js'],
                        [[], '.'],
                        [['/.', 'x/b', '..', '/b/c.js'], '/x/b/c.js'],
                        [['/foo', '../../../bar'], '/bar'],
                        [['foo', '../../../bar'], '../../bar'],
                        [['foo/', '../../../bar'], '../../bar'],
                        [['foo/x', '../../../bar'], '../bar'],
                        [['foo/x', './bar'], 'foo/x/bar'],
                        [['foo/x/', './bar'], 'foo/x/bar'],
                        [['foo/x/', '.', 'bar'], 'foo/x/bar'],
                        [['./'], './'],
                        [['.', './'], './'],
                        [['.', '.', '.'], '.'],
                        [['.', './', '.'], '.'],
                        [['.', '/./', '.'], '.'],
                        [['.', '/////./', '.'], '.'],
                        [['.'], '.'],
                        [['', '.'], '.'],
                        [['', 'foo'], 'foo'],
                        [['foo', '/bar'], 'foo/bar'],
                        [['', '/foo'], '/foo'],
                        [['', '', '/foo'], '/foo'],
                        [['', '', 'foo'], 'foo'],
                        [['foo', ''], 'foo'],
                        [['foo/', ''], 'foo/'],
                        [['foo', '', '/bar'], 'foo/bar'],
                        [['./', '..', '/foo'], '../foo'],
                        [['./', '..', '..', '/foo'], '../../foo'],
                        [['.', '..', '..', '/foo'], '../../foo'],
                        [['', '..', '..', '/foo'], '../../foo'],
                        [['/'], '/'],
                        [['/', '.'], '/'],
                        [['/', '..'], '/'],
                        [['/', '..', '..'], '/'],
                        [[''], '.'],
                        [['', ''], '.'],
                        [[' /foo'], ' /foo'],
                        [[' ', 'foo'], ' /foo'],
                        [[' ', '.'], ' '],
                        [[' ', '/'], ' /'],
                        [[' ', ''], ' '],
                        [['/', 'foo'], '/foo'],
                        [['/', '/foo'], '/foo'],
                        [['/', '//foo'], '/foo'],
                        [['/', '', '/foo'], '/foo'],
                        [['', '/', 'foo'], '/foo'],
                        [['', '/', '/foo'], '/foo']
                    ]
                ]
            ];
            // Windows-specific join tests
            joinTests.push([
                path.win32.join,
                joinTests[0][1].slice(0).concat([
                    // UNC path expected
                    [['//foo/bar'], '\\\\foo\\bar\\'],
                    [['\\/foo/bar'], '\\\\foo\\bar\\'],
                    [['\\\\foo/bar'], '\\\\foo\\bar\\'],
                    // UNC path expected - server and share separate
                    [['//foo', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo/', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo', '/bar'], '\\\\foo\\bar\\'],
                    // UNC path expected - questionable
                    [['//foo', '', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo/', '', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo/', '', '/bar'], '\\\\foo\\bar\\'],
                    // UNC path expected - even more questionable
                    [['', '//foo', 'bar'], '\\\\foo\\bar\\'],
                    [['', '//foo/', 'bar'], '\\\\foo\\bar\\'],
                    [['', '//foo/', '/bar'], '\\\\foo\\bar\\'],
                    // No UNC path expected (no double slash in first component)
                    [['\\', 'foo/bar'], '\\foo\\bar'],
                    [['\\', '/foo/bar'], '\\foo\\bar'],
                    [['', '/', '/foo/bar'], '\\foo\\bar'],
                    // No UNC path expected (no non-slashes in first component -
                    // questionable)
                    [['//', 'foo/bar'], '\\foo\\bar'],
                    [['//', '/foo/bar'], '\\foo\\bar'],
                    [['\\\\', '/', '/foo/bar'], '\\foo\\bar'],
                    [['//'], '\\'],
                    // No UNC path expected (share name missing - questionable).
                    [['//foo'], '\\foo'],
                    [['//foo/'], '\\foo\\'],
                    [['//foo', '/'], '\\foo\\'],
                    [['//foo', '', '/'], '\\foo\\'],
                    // No UNC path expected (too many leading slashes - questionable)
                    [['///foo/bar'], '\\foo\\bar'],
                    [['////foo', 'bar'], '\\foo\\bar'],
                    [['\\\\\\/foo/bar'], '\\foo\\bar'],
                    // Drive-relative vs drive-absolute paths. This merely describes the
                    // status quo, rather than being obviously right
                    [['c:'], 'c:.'],
                    [['c:.'], 'c:.'],
                    [['c:', ''], 'c:.'],
                    [['', 'c:'], 'c:.'],
                    [['c:.', '/'], 'c:.\\'],
                    [['c:.', 'file'], 'c:file'],
                    [['c:', '/'], 'c:\\'],
                    [['c:', 'file'], 'c:\\file']
                ])
            ]);
            joinTests.forEach((test) => {
                if (!Array.isArray(test[0])) {
                    test[0] = [test[0]];
                }
                test[0].forEach((join) => {
                    test[1].forEach((test) => {
                        const actual = join.apply(null, test[0]);
                        const expected = test[1];
                        // For non-Windows specific tests with the Windows join(), we need to try
                        // replacing the slashes since the non-Windows specific tests' `expected`
                        // use forward slashes
                        let actualAlt;
                        let os;
                        if (join === path.win32.join) {
                            actualAlt = actual.replace(backslashRE, '/');
                            os = 'win32';
                        }
                        else {
                            os = 'posix';
                        }
                        const message = `path.${os}.join(${test[0].map(JSON.stringify).join(',')})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                        if (actual !== expected && actualAlt !== expected) {
                            failures.push(`\n${message}`);
                        }
                    });
                });
            });
            assert.strictEqual(failures.length, 0, failures.join(''));
        });
        test('dirname', () => {
            assert.strictEqual(path.posix.dirname('/a/b/'), '/a');
            assert.strictEqual(path.posix.dirname('/a/b'), '/a');
            assert.strictEqual(path.posix.dirname('/a'), '/');
            assert.strictEqual(path.posix.dirname(''), '.');
            assert.strictEqual(path.posix.dirname('/'), '/');
            assert.strictEqual(path.posix.dirname('////'), '/');
            assert.strictEqual(path.posix.dirname('//a'), '//');
            assert.strictEqual(path.posix.dirname('foo'), '.');
            assert.strictEqual(path.win32.dirname('c:\\'), 'c:\\');
            assert.strictEqual(path.win32.dirname('c:\\foo'), 'c:\\');
            assert.strictEqual(path.win32.dirname('c:\\foo\\'), 'c:\\');
            assert.strictEqual(path.win32.dirname('c:\\foo\\bar'), 'c:\\foo');
            assert.strictEqual(path.win32.dirname('c:\\foo\\bar\\'), 'c:\\foo');
            assert.strictEqual(path.win32.dirname('c:\\foo\\bar\\baz'), 'c:\\foo\\bar');
            assert.strictEqual(path.win32.dirname('\\'), '\\');
            assert.strictEqual(path.win32.dirname('\\foo'), '\\');
            assert.strictEqual(path.win32.dirname('\\foo\\'), '\\');
            assert.strictEqual(path.win32.dirname('\\foo\\bar'), '\\foo');
            assert.strictEqual(path.win32.dirname('\\foo\\bar\\'), '\\foo');
            assert.strictEqual(path.win32.dirname('\\foo\\bar\\baz'), '\\foo\\bar');
            assert.strictEqual(path.win32.dirname('c:'), 'c:');
            assert.strictEqual(path.win32.dirname('c:foo'), 'c:');
            assert.strictEqual(path.win32.dirname('c:foo\\'), 'c:');
            assert.strictEqual(path.win32.dirname('c:foo\\bar'), 'c:foo');
            assert.strictEqual(path.win32.dirname('c:foo\\bar\\'), 'c:foo');
            assert.strictEqual(path.win32.dirname('c:foo\\bar\\baz'), 'c:foo\\bar');
            assert.strictEqual(path.win32.dirname('file:stream'), '.');
            assert.strictEqual(path.win32.dirname('dir\\file:stream'), 'dir');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share'), '\\\\unc\\share');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo'), '\\\\unc\\share\\');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\'), '\\\\unc\\share\\');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar'), '\\\\unc\\share\\foo');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar\\'), '\\\\unc\\share\\foo');
            assert.strictEqual(path.win32.dirname('\\\\unc\\share\\foo\\bar\\baz'), '\\\\unc\\share\\foo\\bar');
            assert.strictEqual(path.win32.dirname('/a/b/'), '/a');
            assert.strictEqual(path.win32.dirname('/a/b'), '/a');
            assert.strictEqual(path.win32.dirname('/a'), '/');
            assert.strictEqual(path.win32.dirname(''), '.');
            assert.strictEqual(path.win32.dirname('/'), '/');
            assert.strictEqual(path.win32.dirname('////'), '/');
            assert.strictEqual(path.win32.dirname('foo'), '.');
            // Tests from VSCode
            function assertDirname(p, expected, win = false) {
                const actual = win ? path.win32.dirname(p) : path.posix.dirname(p);
                if (actual !== expected) {
                    assert.fail(`${p}: expected: ${expected}, ours: ${actual}`);
                }
            }
            assertDirname('foo/bar', 'foo');
            assertDirname('foo\\bar', 'foo', true);
            assertDirname('/foo/bar', '/foo');
            assertDirname('\\foo\\bar', '\\foo', true);
            assertDirname('/foo', '/');
            assertDirname('\\foo', '\\', true);
            assertDirname('/', '/');
            assertDirname('\\', '\\', true);
            assertDirname('foo', '.');
            assertDirname('f', '.');
            assertDirname('f/', '.');
            assertDirname('/folder/', '/');
            assertDirname('c:\\some\\file.txt', 'c:\\some', true);
            assertDirname('c:\\some', 'c:\\', true);
            assertDirname('c:\\', 'c:\\', true);
            assertDirname('c:', 'c:', true);
            assertDirname('\\\\server\\share\\some\\path', '\\\\server\\share\\some', true);
            assertDirname('\\\\server\\share\\some', '\\\\server\\share\\', true);
            assertDirname('\\\\server\\share\\', '\\\\server\\share\\', true);
        });
        test('extname', () => {
            const failures = [];
            const slashRE = /\//g;
            [
                [__filename, '.js'],
                ['', ''],
                ['/path/to/file', ''],
                ['/path/to/file.ext', '.ext'],
                ['/path.to/file.ext', '.ext'],
                ['/path.to/file', ''],
                ['/path.to/.file', ''],
                ['/path.to/.file.ext', '.ext'],
                ['/path/to/f.ext', '.ext'],
                ['/path/to/..ext', '.ext'],
                ['/path/to/..', ''],
                ['file', ''],
                ['file.ext', '.ext'],
                ['.file', ''],
                ['.file.ext', '.ext'],
                ['/file', ''],
                ['/file.ext', '.ext'],
                ['/.file', ''],
                ['/.file.ext', '.ext'],
                ['.path/file.ext', '.ext'],
                ['file.ext.ext', '.ext'],
                ['file.', '.'],
                ['.', ''],
                ['./', ''],
                ['.file.ext', '.ext'],
                ['.file', ''],
                ['.file.', '.'],
                ['.file..', '.'],
                ['..', ''],
                ['../', ''],
                ['..file.ext', '.ext'],
                ['..file', '.file'],
                ['..file.', '.'],
                ['..file..', '.'],
                ['...', '.'],
                ['...ext', '.ext'],
                ['....', '.'],
                ['file.ext/', '.ext'],
                ['file.ext//', '.ext'],
                ['file/', ''],
                ['file//', ''],
                ['file./', '.'],
                ['file.//', '.'],
            ].forEach((test) => {
                const expected = test[1];
                [path.posix.extname, path.win32.extname].forEach((extname) => {
                    let input = test[0];
                    let os;
                    if (extname === path.win32.extname) {
                        input = input.replace(slashRE, '\\');
                        os = 'win32';
                    }
                    else {
                        os = 'posix';
                    }
                    const actual = extname(input);
                    const message = `path.${os}.extname(${JSON.stringify(input)})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                    if (actual !== expected) {
                        failures.push(`\n${message}`);
                    }
                });
                {
                    const input = `C:${test[0].replace(slashRE, '\\')}`;
                    const actual = path.win32.extname(input);
                    const message = `path.win32.extname(${JSON.stringify(input)})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                    if (actual !== expected) {
                        failures.push(`\n${message}`);
                    }
                }
            });
            assert.strictEqual(failures.length, 0, failures.join(''));
            // On Windows, backslash is a path separator.
            assert.strictEqual(path.win32.extname('.\\'), '');
            assert.strictEqual(path.win32.extname('..\\'), '');
            assert.strictEqual(path.win32.extname('file.ext\\'), '.ext');
            assert.strictEqual(path.win32.extname('file.ext\\\\'), '.ext');
            assert.strictEqual(path.win32.extname('file\\'), '');
            assert.strictEqual(path.win32.extname('file\\\\'), '');
            assert.strictEqual(path.win32.extname('file.\\'), '.');
            assert.strictEqual(path.win32.extname('file.\\\\'), '.');
            // On *nix, backslash is a valid name component like any other character.
            assert.strictEqual(path.posix.extname('.\\'), '');
            assert.strictEqual(path.posix.extname('..\\'), '.\\');
            assert.strictEqual(path.posix.extname('file.ext\\'), '.ext\\');
            assert.strictEqual(path.posix.extname('file.ext\\\\'), '.ext\\\\');
            assert.strictEqual(path.posix.extname('file\\'), '');
            assert.strictEqual(path.posix.extname('file\\\\'), '');
            assert.strictEqual(path.posix.extname('file.\\'), '.\\');
            assert.strictEqual(path.posix.extname('file.\\\\'), '.\\\\');
            // Tests from VSCode
            assert.strictEqual(path.extname('far.boo'), '.boo');
            assert.strictEqual(path.extname('far.b'), '.b');
            assert.strictEqual(path.extname('far.'), '.');
            assert.strictEqual(path.extname('far.boo/boo.far'), '.far');
            assert.strictEqual(path.extname('far.boo/boo'), '');
        });
        test('resolve', () => {
            const failures = [];
            const slashRE = /\//g;
            const backslashRE = /\\/g;
            const resolveTests = [
                [path.win32.resolve,
                    // arguments                               result
                    [[['c:/blah\\blah', 'd:/games', 'c:../a'], 'c:\\blah\\a'],
                        [['c:/ignore', 'd:\\a/b\\c/d', '\\e.exe'], 'd:\\e.exe'],
                        [['c:/ignore', 'c:/some/file'], 'c:\\some\\file'],
                        [['d:/ignore', 'd:some/dir//'], 'd:\\ignore\\some\\dir'],
                        [['//server/share', '..', 'relative\\'], '\\\\server\\share\\relative'],
                        [['c:/', '//'], 'c:\\'],
                        [['c:/', '//dir'], 'c:\\dir'],
                        [['c:/', '//server/share'], '\\\\server\\share\\'],
                        [['c:/', '//server//share'], '\\\\server\\share\\'],
                        [['c:/', '///some//dir'], 'c:\\some\\dir'],
                        [['C:\\foo\\tmp.3\\', '..\\tmp.3\\cycles\\root.js'],
                            'C:\\foo\\tmp.3\\cycles\\root.js']
                    ]
                ],
                [path.posix.resolve,
                    // arguments                    result
                    [[['/var/lib', '../', 'file/'], '/var/file'],
                        [['/var/lib', '/../', 'file/'], '/file'],
                        [['/some/dir', '.', '/absolute/'], '/absolute'],
                        [['/foo/tmp.3/', '../tmp.3/cycles/root.js'], '/foo/tmp.3/cycles/root.js']
                    ]
                ],
                [(platform_1.isWeb ? path.posix.resolve : path.resolve),
                    // arguments						result
                    [[['.'], process.cwd()],
                        [['a/b/c', '../../..'], process.cwd()]
                    ]
                ],
            ];
            resolveTests.forEach((test) => {
                const resolve = test[0];
                //@ts-expect-error
                test[1].forEach((test) => {
                    //@ts-expect-error
                    const actual = resolve.apply(null, test[0]);
                    let actualAlt;
                    const os = resolve === path.win32.resolve ? 'win32' : 'posix';
                    if (resolve === path.win32.resolve && !platform_1.isWindows) {
                        actualAlt = actual.replace(backslashRE, '/');
                    }
                    else if (resolve !== path.win32.resolve && platform_1.isWindows) {
                        actualAlt = actual.replace(slashRE, '\\');
                    }
                    const expected = test[1];
                    const message = `path.${os}.resolve(${test[0].map(JSON.stringify).join(',')})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                    if (actual !== expected && actualAlt !== expected) {
                        failures.push(`\n${message}`);
                    }
                });
            });
            assert.strictEqual(failures.length, 0, failures.join(''));
            // if (isWindows) {
            // 	// Test resolving the current Windows drive letter from a spawned process.
            // 	// See https://github.com/nodejs/node/issues/7215
            // 	const currentDriveLetter = path.parse(process.cwd()).root.substring(0, 2);
            // 	const resolveFixture = fixtures.path('path-resolve.js');
            // 	const spawnResult = child.spawnSync(
            // 		process.argv[0], [resolveFixture, currentDriveLetter]);
            // 	const resolvedPath = spawnResult.stdout.toString().trim();
            // 	assert.strictEqual(resolvedPath.toLowerCase(), process.cwd().toLowerCase());
            // }
        });
        test('basename', () => {
            assert.strictEqual(path.basename(__filename), 'path.test.js');
            assert.strictEqual(path.basename(__filename, '.js'), 'path.test');
            assert.strictEqual(path.basename('.js', '.js'), '');
            assert.strictEqual(path.basename(''), '');
            assert.strictEqual(path.basename('/dir/basename.ext'), 'basename.ext');
            assert.strictEqual(path.basename('/basename.ext'), 'basename.ext');
            assert.strictEqual(path.basename('basename.ext'), 'basename.ext');
            assert.strictEqual(path.basename('basename.ext/'), 'basename.ext');
            assert.strictEqual(path.basename('basename.ext//'), 'basename.ext');
            assert.strictEqual(path.basename('aaa/bbb', '/bbb'), 'bbb');
            assert.strictEqual(path.basename('aaa/bbb', 'a/bbb'), 'bbb');
            assert.strictEqual(path.basename('aaa/bbb', 'bbb'), 'bbb');
            assert.strictEqual(path.basename('aaa/bbb//', 'bbb'), 'bbb');
            assert.strictEqual(path.basename('aaa/bbb', 'bb'), 'b');
            assert.strictEqual(path.basename('aaa/bbb', 'b'), 'bb');
            assert.strictEqual(path.basename('/aaa/bbb', '/bbb'), 'bbb');
            assert.strictEqual(path.basename('/aaa/bbb', 'a/bbb'), 'bbb');
            assert.strictEqual(path.basename('/aaa/bbb', 'bbb'), 'bbb');
            assert.strictEqual(path.basename('/aaa/bbb//', 'bbb'), 'bbb');
            assert.strictEqual(path.basename('/aaa/bbb', 'bb'), 'b');
            assert.strictEqual(path.basename('/aaa/bbb', 'b'), 'bb');
            assert.strictEqual(path.basename('/aaa/bbb'), 'bbb');
            assert.strictEqual(path.basename('/aaa/'), 'aaa');
            assert.strictEqual(path.basename('/aaa/b'), 'b');
            assert.strictEqual(path.basename('/a/b'), 'b');
            assert.strictEqual(path.basename('//a'), 'a');
            assert.strictEqual(path.basename('a', 'a'), '');
            // On Windows a backslash acts as a path separator.
            assert.strictEqual(path.win32.basename('\\dir\\basename.ext'), 'basename.ext');
            assert.strictEqual(path.win32.basename('\\basename.ext'), 'basename.ext');
            assert.strictEqual(path.win32.basename('basename.ext'), 'basename.ext');
            assert.strictEqual(path.win32.basename('basename.ext\\'), 'basename.ext');
            assert.strictEqual(path.win32.basename('basename.ext\\\\'), 'basename.ext');
            assert.strictEqual(path.win32.basename('foo'), 'foo');
            assert.strictEqual(path.win32.basename('aaa\\bbb', '\\bbb'), 'bbb');
            assert.strictEqual(path.win32.basename('aaa\\bbb', 'a\\bbb'), 'bbb');
            assert.strictEqual(path.win32.basename('aaa\\bbb', 'bbb'), 'bbb');
            assert.strictEqual(path.win32.basename('aaa\\bbb\\\\\\\\', 'bbb'), 'bbb');
            assert.strictEqual(path.win32.basename('aaa\\bbb', 'bb'), 'b');
            assert.strictEqual(path.win32.basename('aaa\\bbb', 'b'), 'bb');
            assert.strictEqual(path.win32.basename('C:'), '');
            assert.strictEqual(path.win32.basename('C:.'), '.');
            assert.strictEqual(path.win32.basename('C:\\'), '');
            assert.strictEqual(path.win32.basename('C:\\dir\\base.ext'), 'base.ext');
            assert.strictEqual(path.win32.basename('C:\\basename.ext'), 'basename.ext');
            assert.strictEqual(path.win32.basename('C:basename.ext'), 'basename.ext');
            assert.strictEqual(path.win32.basename('C:basename.ext\\'), 'basename.ext');
            assert.strictEqual(path.win32.basename('C:basename.ext\\\\'), 'basename.ext');
            assert.strictEqual(path.win32.basename('C:foo'), 'foo');
            assert.strictEqual(path.win32.basename('file:stream'), 'file:stream');
            assert.strictEqual(path.win32.basename('a', 'a'), '');
            // On unix a backslash is just treated as any other character.
            assert.strictEqual(path.posix.basename('\\dir\\basename.ext'), '\\dir\\basename.ext');
            assert.strictEqual(path.posix.basename('\\basename.ext'), '\\basename.ext');
            assert.strictEqual(path.posix.basename('basename.ext'), 'basename.ext');
            assert.strictEqual(path.posix.basename('basename.ext\\'), 'basename.ext\\');
            assert.strictEqual(path.posix.basename('basename.ext\\\\'), 'basename.ext\\\\');
            assert.strictEqual(path.posix.basename('foo'), 'foo');
            // POSIX filenames may include control characters
            // c.f. http://www.dwheeler.com/essays/fixing-unix-linux-filenames.html
            const controlCharFilename = `Icon${String.fromCharCode(13)}`;
            assert.strictEqual(path.posix.basename(`/a/b/${controlCharFilename}`), controlCharFilename);
            // Tests from VSCode
            assert.strictEqual(path.basename('foo/bar'), 'bar');
            assert.strictEqual(path.posix.basename('foo\\bar'), 'foo\\bar');
            assert.strictEqual(path.win32.basename('foo\\bar'), 'bar');
            assert.strictEqual(path.basename('/foo/bar'), 'bar');
            assert.strictEqual(path.posix.basename('\\foo\\bar'), '\\foo\\bar');
            assert.strictEqual(path.win32.basename('\\foo\\bar'), 'bar');
            assert.strictEqual(path.basename('./bar'), 'bar');
            assert.strictEqual(path.posix.basename('.\\bar'), '.\\bar');
            assert.strictEqual(path.win32.basename('.\\bar'), 'bar');
            assert.strictEqual(path.basename('/bar'), 'bar');
            assert.strictEqual(path.posix.basename('\\bar'), '\\bar');
            assert.strictEqual(path.win32.basename('\\bar'), 'bar');
            assert.strictEqual(path.basename('bar/'), 'bar');
            assert.strictEqual(path.posix.basename('bar\\'), 'bar\\');
            assert.strictEqual(path.win32.basename('bar\\'), 'bar');
            assert.strictEqual(path.basename('bar'), 'bar');
            assert.strictEqual(path.basename('////////'), '');
            assert.strictEqual(path.posix.basename('\\\\\\\\'), '\\\\\\\\');
            assert.strictEqual(path.win32.basename('\\\\\\\\'), '');
        });
        test('relative', () => {
            const failures = [];
            const relativeTests = [
                [path.win32.relative,
                    // arguments                     result
                    [['c:/blah\\blah', 'd:/games', 'd:\\games'],
                        ['c:/aaaa/bbbb', 'c:/aaaa', '..'],
                        ['c:/aaaa/bbbb', 'c:/cccc', '..\\..\\cccc'],
                        ['c:/aaaa/bbbb', 'c:/aaaa/bbbb', ''],
                        ['c:/aaaa/bbbb', 'c:/aaaa/cccc', '..\\cccc'],
                        ['c:/aaaa/', 'c:/aaaa/cccc', 'cccc'],
                        ['c:/', 'c:\\aaaa\\bbbb', 'aaaa\\bbbb'],
                        ['c:/aaaa/bbbb', 'd:\\', 'd:\\'],
                        ['c:/AaAa/bbbb', 'c:/aaaa/bbbb', ''],
                        ['c:/aaaaa/', 'c:/aaaa/cccc', '..\\aaaa\\cccc'],
                        ['C:\\foo\\bar\\baz\\quux', 'C:\\', '..\\..\\..\\..'],
                        ['C:\\foo\\test', 'C:\\foo\\test\\bar\\package.json', 'bar\\package.json'],
                        ['C:\\foo\\bar\\baz-quux', 'C:\\foo\\bar\\baz', '..\\baz'],
                        ['C:\\foo\\bar\\baz', 'C:\\foo\\bar\\baz-quux', '..\\baz-quux'],
                        ['\\\\foo\\bar', '\\\\foo\\bar\\baz', 'baz'],
                        ['\\\\foo\\bar\\baz', '\\\\foo\\bar', '..'],
                        ['\\\\foo\\bar\\baz-quux', '\\\\foo\\bar\\baz', '..\\baz'],
                        ['\\\\foo\\bar\\baz', '\\\\foo\\bar\\baz-quux', '..\\baz-quux'],
                        ['C:\\baz-quux', 'C:\\baz', '..\\baz'],
                        ['C:\\baz', 'C:\\baz-quux', '..\\baz-quux'],
                        ['\\\\foo\\baz-quux', '\\\\foo\\baz', '..\\baz'],
                        ['\\\\foo\\baz', '\\\\foo\\baz-quux', '..\\baz-quux'],
                        ['C:\\baz', '\\\\foo\\bar\\baz', '\\\\foo\\bar\\baz'],
                        ['\\\\foo\\bar\\baz', 'C:\\baz', 'C:\\baz']
                    ]
                ],
                [path.posix.relative,
                    // arguments          result
                    [['/var/lib', '/var', '..'],
                        ['/var/lib', '/bin', '../../bin'],
                        ['/var/lib', '/var/lib', ''],
                        ['/var/lib', '/var/apache', '../apache'],
                        ['/var/', '/var/lib', 'lib'],
                        ['/', '/var/lib', 'var/lib'],
                        ['/foo/test', '/foo/test/bar/package.json', 'bar/package.json'],
                        ['/Users/a/web/b/test/mails', '/Users/a/web/b', '../..'],
                        ['/foo/bar/baz-quux', '/foo/bar/baz', '../baz'],
                        ['/foo/bar/baz', '/foo/bar/baz-quux', '../baz-quux'],
                        ['/baz-quux', '/baz', '../baz'],
                        ['/baz', '/baz-quux', '../baz-quux']
                    ]
                ]
            ];
            relativeTests.forEach((test) => {
                const relative = test[0];
                //@ts-expect-error
                test[1].forEach((test) => {
                    //@ts-expect-error
                    const actual = relative(test[0], test[1]);
                    const expected = test[2];
                    const os = relative === path.win32.relative ? 'win32' : 'posix';
                    const message = `path.${os}.relative(${test.slice(0, 2).map(JSON.stringify).join(',')})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                    if (actual !== expected) {
                        failures.push(`\n${message}`);
                    }
                });
            });
            assert.strictEqual(failures.length, 0, failures.join(''));
        });
        test('normalize', () => {
            assert.strictEqual(path.win32.normalize('./fixtures///b/../b/c.js'), 'fixtures\\b\\c.js');
            assert.strictEqual(path.win32.normalize('/foo/../../../bar'), '\\bar');
            assert.strictEqual(path.win32.normalize('a//b//../b'), 'a\\b');
            assert.strictEqual(path.win32.normalize('a//b//./c'), 'a\\b\\c');
            assert.strictEqual(path.win32.normalize('a//b//.'), 'a\\b');
            assert.strictEqual(path.win32.normalize('//server/share/dir/file.ext'), '\\\\server\\share\\dir\\file.ext');
            assert.strictEqual(path.win32.normalize('/a/b/c/../../../x/y/z'), '\\x\\y\\z');
            assert.strictEqual(path.win32.normalize('C:'), 'C:.');
            assert.strictEqual(path.win32.normalize('C:..\\abc'), 'C:..\\abc');
            assert.strictEqual(path.win32.normalize('C:..\\..\\abc\\..\\def'), 'C:..\\..\\def');
            assert.strictEqual(path.win32.normalize('C:\\.'), 'C:\\');
            assert.strictEqual(path.win32.normalize('file:stream'), 'file:stream');
            assert.strictEqual(path.win32.normalize('bar\\foo..\\..\\'), 'bar\\');
            assert.strictEqual(path.win32.normalize('bar\\foo..\\..'), 'bar');
            assert.strictEqual(path.win32.normalize('bar\\foo..\\..\\baz'), 'bar\\baz');
            assert.strictEqual(path.win32.normalize('bar\\foo..\\'), 'bar\\foo..\\');
            assert.strictEqual(path.win32.normalize('bar\\foo..'), 'bar\\foo..');
            assert.strictEqual(path.win32.normalize('..\\foo..\\..\\..\\bar'), '..\\..\\bar');
            assert.strictEqual(path.win32.normalize('..\\...\\..\\.\\...\\..\\..\\bar'), '..\\..\\bar');
            assert.strictEqual(path.win32.normalize('../../../foo/../../../bar'), '..\\..\\..\\..\\..\\bar');
            assert.strictEqual(path.win32.normalize('../../../foo/../../../bar/../../'), '..\\..\\..\\..\\..\\..\\');
            assert.strictEqual(path.win32.normalize('../foobar/barfoo/foo/../../../bar/../../'), '..\\..\\');
            assert.strictEqual(path.win32.normalize('../.../../foobar/../../../bar/../../baz'), '..\\..\\..\\..\\baz');
            assert.strictEqual(path.win32.normalize('foo/bar\\baz'), 'foo\\bar\\baz');
            assert.strictEqual(path.posix.normalize('./fixtures///b/../b/c.js'), 'fixtures/b/c.js');
            assert.strictEqual(path.posix.normalize('/foo/../../../bar'), '/bar');
            assert.strictEqual(path.posix.normalize('a//b//../b'), 'a/b');
            assert.strictEqual(path.posix.normalize('a//b//./c'), 'a/b/c');
            assert.strictEqual(path.posix.normalize('a//b//.'), 'a/b');
            assert.strictEqual(path.posix.normalize('/a/b/c/../../../x/y/z'), '/x/y/z');
            assert.strictEqual(path.posix.normalize('///..//./foo/.//bar'), '/foo/bar');
            assert.strictEqual(path.posix.normalize('bar/foo../../'), 'bar/');
            assert.strictEqual(path.posix.normalize('bar/foo../..'), 'bar');
            assert.strictEqual(path.posix.normalize('bar/foo../../baz'), 'bar/baz');
            assert.strictEqual(path.posix.normalize('bar/foo../'), 'bar/foo../');
            assert.strictEqual(path.posix.normalize('bar/foo..'), 'bar/foo..');
            assert.strictEqual(path.posix.normalize('../foo../../../bar'), '../../bar');
            assert.strictEqual(path.posix.normalize('../.../.././.../../../bar'), '../../bar');
            assert.strictEqual(path.posix.normalize('../../../foo/../../../bar'), '../../../../../bar');
            assert.strictEqual(path.posix.normalize('../../../foo/../../../bar/../../'), '../../../../../../');
            assert.strictEqual(path.posix.normalize('../foobar/barfoo/foo/../../../bar/../../'), '../../');
            assert.strictEqual(path.posix.normalize('../.../../foobar/../../../bar/../../baz'), '../../../../baz');
            assert.strictEqual(path.posix.normalize('foo/bar\\baz'), 'foo/bar\\baz');
        });
        test('isAbsolute', () => {
            assert.strictEqual(path.win32.isAbsolute('/'), true);
            assert.strictEqual(path.win32.isAbsolute('//'), true);
            assert.strictEqual(path.win32.isAbsolute('//server'), true);
            assert.strictEqual(path.win32.isAbsolute('//server/file'), true);
            assert.strictEqual(path.win32.isAbsolute('\\\\server\\file'), true);
            assert.strictEqual(path.win32.isAbsolute('\\\\server'), true);
            assert.strictEqual(path.win32.isAbsolute('\\\\'), true);
            assert.strictEqual(path.win32.isAbsolute('c'), false);
            assert.strictEqual(path.win32.isAbsolute('c:'), false);
            assert.strictEqual(path.win32.isAbsolute('c:\\'), true);
            assert.strictEqual(path.win32.isAbsolute('c:/'), true);
            assert.strictEqual(path.win32.isAbsolute('c://'), true);
            assert.strictEqual(path.win32.isAbsolute('C:/Users/'), true);
            assert.strictEqual(path.win32.isAbsolute('C:\\Users\\'), true);
            assert.strictEqual(path.win32.isAbsolute('C:cwd/another'), false);
            assert.strictEqual(path.win32.isAbsolute('C:cwd\\another'), false);
            assert.strictEqual(path.win32.isAbsolute('directory/directory'), false);
            assert.strictEqual(path.win32.isAbsolute('directory\\directory'), false);
            assert.strictEqual(path.posix.isAbsolute('/home/foo'), true);
            assert.strictEqual(path.posix.isAbsolute('/home/foo/..'), true);
            assert.strictEqual(path.posix.isAbsolute('bar/'), false);
            assert.strictEqual(path.posix.isAbsolute('./baz'), false);
            // Tests from VSCode:
            // Absolute Paths
            [
                'C:/',
                'C:\\',
                'C:/foo',
                'C:\\foo',
                'z:/foo/bar.txt',
                'z:\\foo\\bar.txt',
                '\\\\localhost\\c$\\foo',
                '/',
                '/foo'
            ].forEach(absolutePath => {
                assert.ok(path.win32.isAbsolute(absolutePath), absolutePath);
            });
            [
                '/',
                '/foo',
                '/foo/bar.txt'
            ].forEach(absolutePath => {
                assert.ok(path.posix.isAbsolute(absolutePath), absolutePath);
            });
            // Relative Paths
            [
                '',
                'foo',
                'foo/bar',
                './foo',
                'http://foo.com/bar'
            ].forEach(nonAbsolutePath => {
                assert.ok(!path.win32.isAbsolute(nonAbsolutePath), nonAbsolutePath);
            });
            [
                '',
                'foo',
                'foo/bar',
                './foo',
                'http://foo.com/bar',
                'z:/foo/bar.txt',
            ].forEach(nonAbsolutePath => {
                assert.ok(!path.posix.isAbsolute(nonAbsolutePath), nonAbsolutePath);
            });
        });
        test('path', () => {
            // path.sep tests
            // windows
            assert.strictEqual(path.win32.sep, '\\');
            // posix
            assert.strictEqual(path.posix.sep, '/');
            // path.delimiter tests
            // windows
            assert.strictEqual(path.win32.delimiter, ';');
            // posix
            assert.strictEqual(path.posix.delimiter, ':');
            // if (isWindows) {
            // 	assert.strictEqual(path, path.win32);
            // } else {
            // 	assert.strictEqual(path, path.posix);
            // }
        });
        // test('perf', () => {
        // 	const folderNames = [
        // 		'abc',
        // 		'Users',
        // 		'reallylongfoldername',
        // 		's',
        // 		'reallyreallyreallylongfoldername',
        // 		'home'
        // 	];
        // 	const basePaths = [
        // 		'C:',
        // 		'',
        // 	];
        // 	const separators = [
        // 		'\\',
        // 		'/'
        // 	];
        // 	function randomInt(ciel: number): number {
        // 		return Math.floor(Math.random() * ciel);
        // 	}
        // 	let pathsToNormalize = [];
        // 	let pathsToJoin = [];
        // 	let i;
        // 	for (i = 0; i < 1000000; i++) {
        // 		const basePath = basePaths[randomInt(basePaths.length)];
        // 		let lengthOfPath = randomInt(10) + 2;
        // 		let pathToNormalize = basePath + separators[randomInt(separators.length)];
        // 		while (lengthOfPath-- > 0) {
        // 			pathToNormalize = pathToNormalize + folderNames[randomInt(folderNames.length)] + separators[randomInt(separators.length)];
        // 		}
        // 		pathsToNormalize.push(pathToNormalize);
        // 		let pathToJoin = '';
        // 		lengthOfPath = randomInt(10) + 2;
        // 		while (lengthOfPath-- > 0) {
        // 			pathToJoin = pathToJoin + folderNames[randomInt(folderNames.length)] + separators[randomInt(separators.length)];
        // 		}
        // 		pathsToJoin.push(pathToJoin + '.ts');
        // 	}
        // 	let newTime = 0;
        // 	let j;
        // 	for(j = 0; j < pathsToJoin.length; j++) {
        // 		const path1 = pathsToNormalize[j];
        // 		const path2 = pathsToNormalize[j];
        // 		const newStart = performance.now();
        // 		path.join(path1, path2);
        // 		newTime += performance.now() - newStart;
        // 	}
        // 	assert.ok(false, `Time: ${newTime}ms.`);
        // });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL3BhdGgudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdDaEcsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUN6QyxNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUM7UUFDbEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO1lBQ2pCLE1BQU0sUUFBUSxHQUFHLEVBQWMsQ0FBQztZQUNoQyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFFMUIsTUFBTSxTQUFTLEdBQVE7Z0JBQ3RCLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDbkMsdUNBQXVDO29CQUN2QyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsRUFBRSxVQUFVLENBQUM7d0JBQzVDLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQzt3QkFDVCxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUUsV0FBVyxDQUFDO3dCQUM3QyxDQUFDLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxFQUFFLE1BQU0sQ0FBQzt3QkFDbEMsQ0FBQyxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUMsRUFBRSxXQUFXLENBQUM7d0JBQ3RDLENBQUMsQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLEVBQUUsV0FBVyxDQUFDO3dCQUN2QyxDQUFDLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxFQUFFLFFBQVEsQ0FBQzt3QkFDckMsQ0FB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LEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM5RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFdEQsOERBQThEO1lBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsRUFDNUQscUJBQXFCLENBQUMsQ0FBQztZQUN4QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFdEQsaURBQWlEO1lBQ2pELHVFQUF1RTtZQUN2RSxNQUFNLG1CQUFtQixHQUFHLE9BQU8sTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxtQkFBbUIsRUFBRSxDQUFDLEVBQ3BFLG1CQUFtQixDQUFDLENBQUM7WUFFdEIsb0JBQW9CO1lBQ3BCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDaEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO1lBQ3JCLE1BQU0sUUFBUSxHQUFHLEVBQWMsQ0FBQztZQUVoQyxNQUFNLGFBQWEsR0FBRztnQkFDckIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVE7b0JBQ3BCLHVDQUF1QztvQkFDdkMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDO3dCQUMzQyxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDO3dCQUNqQyxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsY0FBYyxDQUFDO3dCQUMzQyxDQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUUsRUFBRSxDQUFDO3dCQUNwQyxDQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUUsVUFBVSxDQUFDO3dCQUM1QyxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsTUFBTSxDQUFDO3dCQUNwQyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLENBQUM7d0JBQ3ZDLENBQUMsY0FBYyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUM7d0JBQ2hDLENBQUMsY0FBYyxFQUFFLGNBQWMsRUFBRSxFQUFFLENBQUM7d0JBQ3BDLENBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsQ0FBQzt3QkFDL0MsQ0FBQyx5QkFBeUIsRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLENBQUM7d0JBQ3JELENBQUMsZUFBZSxFQUFFLGtDQUFrQyxFQUFFLG1CQUFtQixDQUFDO3dCQUMxRSxDQUFDLHdCQUF3QixFQUFFLG1CQUFtQixFQUFFLFNBQVMsQ0FBQzt3QkFDMUQsQ0FBQyxtQkFBbUIsRUFBRSx3QkFBd0IsRUFBRSxjQUFjLENBQUM7d0JBQy9ELENBQUMsY0FBYyxFQUFFLG1CQUFtQixFQUFFLEtBQUssQ0FBQzt3QkFDNUMsQ0FBQyxtQkFBbUIsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDO3dCQUMzQyxDQUFDLHdCQUF3QixFQUFFLG1CQUFtQixFQUFFLFNBQVMsQ0FBQzt3QkFDMUQsQ0FBQyxtQkFBbUIsRUFBRSx3QkFBd0IsRUFBRSxjQUFjLENBQUM7d0JBQy9ELENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUM7d0JBQ3RDLENBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUM7d0JBQzNDLENBQUMsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLFNBQVMsQ0FBQzt3QkFDaEQsQ0FBQyxjQUFjLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxDQUFDO3dCQUNyRCxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxtQkFBbUIsQ0FBQzt3QkFDckQsQ0FBQyxtQkFBbUIsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDO3FCQUMxQztpQkFDQTtnQkFDRCxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUTtvQkFDcEIsNEJBQTRCO29CQUM1QixDQUFDLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUM7d0JBQzNCLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUM7d0JBQ2pDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7d0JBQzVCLENBQUMsVUFBVSxFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUM7d0JBQ3hDLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUM7d0JBQzVCLENBQUMsR0FBRyxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUM7d0JBQzVCLENBQUMsV0FBVyxFQUFFLDRCQUE0QixFQUFFLGtCQUFrQixDQUFDO3dCQUMvRCxDQUFDLDJCQUEyQixFQUFFLGdCQUFnQixFQUFFLE9BQU8sQ0FBQzt3QkFDeEQsQ0FBQyxtQkFBbUIsRUFBRSxjQUFjLEVBQUUsUUFBUSxDQUFDO3dCQUMvQyxDQUFDLGNBQWMsRUFBRSxtQkFBbUIsRUFBRSxhQUFhLENBQUM7d0JBQ3BELENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUM7d0JBQy9CLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxhQUFhLENBQUM7cUJBQ25DO2lCQUNBO2FBQ0QsQ0FBQztZQUNGLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDOUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixrQkFBa0I7Z0JBQ2xCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtvQkFDeEIsa0JBQWtCO29CQUNsQixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3pCLE1BQU0sRUFBRSxHQUFHLFFBQVEsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7b0JBQ2hFLE1BQU0sT0FBTyxHQUFHLFFBQVEsRUFBRSxhQUFhLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGNBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUNuSyxJQUFJLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQzt3QkFDekIsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUM7b0JBQy9CLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7WUFDdEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQywwQkFBMEIsQ0FBQyxFQUNsRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN2RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLDZCQUE2QixDQUFDLEVBQ3JFLGtDQUFrQyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQy9FLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNuRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLHdCQUF3QixDQUFDLEVBQ2hFLGVBQWUsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUN2RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxFQUNoRSxhQUFhLENBQUMsQ0FBQztZQUNoQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGtDQUFrQyxDQUFDLEVBQzFFLGFBQWEsQ0FBQyxDQUFDO1lBQ2hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsMkJBQTJCLENBQUMsRUFDbkUseUJBQXlCLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGtDQUFrQyxDQUFDLEVBQzFFLDBCQUEwQixDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLFdBQVcsQ0FDakIsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsMENBQTBDLENBQUMsRUFDaEUsVUFBVSxDQUNWLENBQUM7WUFDRixNQUFNLENBQUMsV0FBVyxDQUNqQixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyx5Q0FBeUMsQ0FBQyxFQUMvRCxxQkFBcUIsQ0FDckIsQ0FBQztZQUNGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQywwQkFBMEIsQ0FBQyxFQUNsRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDeEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLDJCQUEyQixDQUFDLEVBQ25FLFdBQVcsQ0FBQyxDQUFDO1lBQ2QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQywyQkFBMkIsQ0FBQyxFQUNuRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3ZCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsa0NBQWtDLENBQUMsRUFDMUUsb0JBQW9CLENBQUMsQ0FBQztZQUN2QixNQUFNLENBQUMsV0FBVyxDQUNqQixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQywwQ0FBMEMsQ0FBQyxFQUNoRSxRQUFRLENBQ1IsQ0FBQztZQUNGLE1BQU0sQ0FBQyxXQUFXLENBQ2pCLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLHlDQUF5QyxDQUFDLEVBQy9ELGlCQUFpQixDQUNqQixDQUFDO1lBQ0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUMxRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3ZCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lB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