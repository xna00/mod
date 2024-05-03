/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/extpath", "vs/base/common/platform", "vs/base/test/common/utils"], function (require, exports, assert, extpath, platform_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Paths', () => {
        test('toForwardSlashes', () => {
            assert.strictEqual(extpath.toSlashes('\\\\server\\share\\some\\path'), '//server/share/some/path');
            assert.strictEqual(extpath.toSlashes('c:\\test'), 'c:/test');
            assert.strictEqual(extpath.toSlashes('foo\\bar'), 'foo/bar');
            assert.strictEqual(extpath.toSlashes('/user/far'), '/user/far');
        });
        test('getRoot', () => {
            assert.strictEqual(extpath.getRoot('/user/far'), '/');
            assert.strictEqual(extpath.getRoot('\\\\server\\share\\some\\path'), '//server/share/');
            assert.strictEqual(extpath.getRoot('//server/share/some/path'), '//server/share/');
            assert.strictEqual(extpath.getRoot('//server/share'), '/');
            assert.strictEqual(extpath.getRoot('//server'), '/');
            assert.strictEqual(extpath.getRoot('//server//'), '/');
            assert.strictEqual(extpath.getRoot('c:/user/far'), 'c:/');
            assert.strictEqual(extpath.getRoot('c:user/far'), 'c:');
            assert.strictEqual(extpath.getRoot('http://www'), '');
            assert.strictEqual(extpath.getRoot('http://www/'), 'http://www/');
            assert.strictEqual(extpath.getRoot('file:///foo'), 'file:///');
            assert.strictEqual(extpath.getRoot('file://foo'), '');
        });
        (!platform_1.isWindows ? test.skip : test)('isUNC', () => {
            assert.ok(!extpath.isUNC('foo'));
            assert.ok(!extpath.isUNC('/foo'));
            assert.ok(!extpath.isUNC('\\foo'));
            assert.ok(!extpath.isUNC('\\\\foo'));
            assert.ok(extpath.isUNC('\\\\a\\b'));
            assert.ok(!extpath.isUNC('//a/b'));
            assert.ok(extpath.isUNC('\\\\server\\share'));
            assert.ok(extpath.isUNC('\\\\server\\share\\'));
            assert.ok(extpath.isUNC('\\\\server\\share\\path'));
        });
        test('isValidBasename', () => {
            assert.ok(!extpath.isValidBasename(null));
            assert.ok(!extpath.isValidBasename(''));
            assert.ok(extpath.isValidBasename('test.txt'));
            assert.ok(!extpath.isValidBasename('/test.txt'));
            assert.ok(!extpath.isValidBasename('\\test.txt'));
            if (platform_1.isWindows) {
                assert.ok(!extpath.isValidBasename('aux'));
                assert.ok(!extpath.isValidBasename('Aux'));
                assert.ok(!extpath.isValidBasename('LPT0'));
                assert.ok(!extpath.isValidBasename('aux.txt'));
                assert.ok(!extpath.isValidBasename('com0.abc'));
                assert.ok(extpath.isValidBasename('LPT00'));
                assert.ok(extpath.isValidBasename('aux1'));
                assert.ok(extpath.isValidBasename('aux1.txt'));
                assert.ok(extpath.isValidBasename('aux1.aux.txt'));
                assert.ok(!extpath.isValidBasename('test.txt.'));
                assert.ok(!extpath.isValidBasename('test.txt..'));
                assert.ok(!extpath.isValidBasename('test.txt '));
                assert.ok(!extpath.isValidBasename('test.txt\t'));
                assert.ok(!extpath.isValidBasename('tes:t.txt'));
                assert.ok(!extpath.isValidBasename('tes"t.txt'));
            }
        });
        test('sanitizeFilePath', () => {
            if (platform_1.isWindows) {
                assert.strictEqual(extpath.sanitizeFilePath('.', 'C:\\the\\cwd'), 'C:\\the\\cwd');
                assert.strictEqual(extpath.sanitizeFilePath('', 'C:\\the\\cwd'), 'C:\\the\\cwd');
                assert.strictEqual(extpath.sanitizeFilePath('C:', 'C:\\the\\cwd'), 'C:\\');
                assert.strictEqual(extpath.sanitizeFilePath('C:\\', 'C:\\the\\cwd'), 'C:\\');
                assert.strictEqual(extpath.sanitizeFilePath('C:\\\\', 'C:\\the\\cwd'), 'C:\\');
                assert.strictEqual(extpath.sanitizeFilePath('C:\\folder\\my.txt', 'C:\\the\\cwd'), 'C:\\folder\\my.txt');
                assert.strictEqual(extpath.sanitizeFilePath('C:\\folder\\my', 'C:\\the\\cwd'), 'C:\\folder\\my');
                assert.strictEqual(extpath.sanitizeFilePath('C:\\folder\\..\\my', 'C:\\the\\cwd'), 'C:\\my');
                assert.strictEqual(extpath.sanitizeFilePath('C:\\folder\\my\\', 'C:\\the\\cwd'), 'C:\\folder\\my');
                assert.strictEqual(extpath.sanitizeFilePath('C:\\folder\\my\\\\\\', 'C:\\the\\cwd'), 'C:\\folder\\my');
                assert.strictEqual(extpath.sanitizeFilePath('my.txt', 'C:\\the\\cwd'), 'C:\\the\\cwd\\my.txt');
                assert.strictEqual(extpath.sanitizeFilePath('my.txt\\', 'C:\\the\\cwd'), 'C:\\the\\cwd\\my.txt');
                assert.strictEqual(extpath.sanitizeFilePath('\\\\localhost\\folder\\my', 'C:\\the\\cwd'), '\\\\localhost\\folder\\my');
                assert.strictEqual(extpath.sanitizeFilePath('\\\\localhost\\folder\\my\\', 'C:\\the\\cwd'), '\\\\localhost\\folder\\my');
            }
            else {
                assert.strictEqual(extpath.sanitizeFilePath('.', '/the/cwd'), '/the/cwd');
                assert.strictEqual(extpath.sanitizeFilePath('', '/the/cwd'), '/the/cwd');
                assert.strictEqual(extpath.sanitizeFilePath('/', '/the/cwd'), '/');
                assert.strictEqual(extpath.sanitizeFilePath('/folder/my.txt', '/the/cwd'), '/folder/my.txt');
                assert.strictEqual(extpath.sanitizeFilePath('/folder/my', '/the/cwd'), '/folder/my');
                assert.strictEqual(extpath.sanitizeFilePath('/folder/../my', '/the/cwd'), '/my');
                assert.strictEqual(extpath.sanitizeFilePath('/folder/my/', '/the/cwd'), '/folder/my');
                assert.strictEqual(extpath.sanitizeFilePath('/folder/my///', '/the/cwd'), '/folder/my');
                assert.strictEqual(extpath.sanitizeFilePath('my.txt', '/the/cwd'), '/the/cwd/my.txt');
                assert.strictEqual(extpath.sanitizeFilePath('my.txt/', '/the/cwd'), '/the/cwd/my.txt');
            }
        });
        test('isRootOrDriveLetter', () => {
            if (platform_1.isWindows) {
                assert.ok(extpath.isRootOrDriveLetter('c:'));
                assert.ok(extpath.isRootOrDriveLetter('D:'));
                assert.ok(extpath.isRootOrDriveLetter('D:/'));
                assert.ok(extpath.isRootOrDriveLetter('D:\\'));
                assert.ok(!extpath.isRootOrDriveLetter('D:\\path'));
                assert.ok(!extpath.isRootOrDriveLetter('D:/path'));
            }
            else {
                assert.ok(extpath.isRootOrDriveLetter('/'));
                assert.ok(!extpath.isRootOrDriveLetter('/path'));
            }
        });
        test('hasDriveLetter', () => {
            if (platform_1.isWindows) {
                assert.ok(extpath.hasDriveLetter('c:'));
                assert.ok(extpath.hasDriveLetter('D:'));
                assert.ok(extpath.hasDriveLetter('D:/'));
                assert.ok(extpath.hasDriveLetter('D:\\'));
                assert.ok(extpath.hasDriveLetter('D:\\path'));
                assert.ok(extpath.hasDriveLetter('D:/path'));
            }
            else {
                assert.ok(!extpath.hasDriveLetter('/'));
                assert.ok(!extpath.hasDriveLetter('/path'));
            }
        });
        test('getDriveLetter', () => {
            if (platform_1.isWindows) {
                assert.strictEqual(extpath.getDriveLetter('c:'), 'c');
                assert.strictEqual(extpath.getDriveLetter('D:'), 'D');
                assert.strictEqual(extpath.getDriveLetter('D:/'), 'D');
                assert.strictEqual(extpath.getDriveLetter('D:\\'), 'D');
                assert.strictEqual(extpath.getDriveLetter('D:\\path'), 'D');
                assert.strictEqual(extpath.getDriveLetter('D:/path'), 'D');
            }
            else {
                assert.ok(!extpath.getDriveLetter('/'));
                assert.ok(!extpath.getDriveLetter('/path'));
            }
        });
        test('isWindowsDriveLetter', () => {
            assert.ok(!extpath.isWindowsDriveLetter(0));
            assert.ok(!extpath.isWindowsDriveLetter(-1));
            assert.ok(extpath.isWindowsDriveLetter(65 /* CharCode.A */));
            assert.ok(extpath.isWindowsDriveLetter(122 /* CharCode.z */));
        });
        test('indexOfPath', () => {
            assert.strictEqual(extpath.indexOfPath('/foo', '/bar', true), -1);
            assert.strictEqual(extpath.indexOfPath('/foo', '/FOO', false), -1);
            assert.strictEqual(extpath.indexOfPath('/foo', '/FOO', true), 0);
            assert.strictEqual(extpath.indexOfPath('/some/long/path', '/some/long', false), 0);
            assert.strictEqual(extpath.indexOfPath('/some/long/path', '/PATH', true), 10);
        });
        test('parseLineAndColumnAware', () => {
            let res = extpath.parseLineAndColumnAware('/foo/bar');
            assert.strictEqual(res.path, '/foo/bar');
            assert.strictEqual(res.line, undefined);
            assert.strictEqual(res.column, undefined);
            res = extpath.parseLineAndColumnAware('/foo/bar:33');
            assert.strictEqual(res.path, '/foo/bar');
            assert.strictEqual(res.line, 33);
            assert.strictEqual(res.column, 1);
            res = extpath.parseLineAndColumnAware('/foo/bar:33:34');
            assert.strictEqual(res.path, '/foo/bar');
            assert.strictEqual(res.line, 33);
            assert.strictEqual(res.column, 34);
            res = extpath.parseLineAndColumnAware('C:\\foo\\bar');
            assert.strictEqual(res.path, 'C:\\foo\\bar');
            assert.strictEqual(res.line, undefined);
            assert.strictEqual(res.column, undefined);
            res = extpath.parseLineAndColumnAware('C:\\foo\\bar:33');
            assert.strictEqual(res.path, 'C:\\foo\\bar');
            assert.strictEqual(res.line, 33);
            assert.strictEqual(res.column, 1);
            res = extpath.parseLineAndColumnAware('C:\\foo\\bar:33:34');
            assert.strictEqual(res.path, 'C:\\foo\\bar');
            assert.strictEqual(res.line, 33);
            assert.strictEqual(res.column, 34);
            res = extpath.parseLineAndColumnAware('/foo/bar:abb');
            assert.strictEqual(res.path, '/foo/bar:abb');
            assert.strictEqual(res.line, undefined);
            assert.strictEqual(res.column, undefined);
        });
        test('randomPath', () => {
            let res = extpath.randomPath('/foo/bar');
            assert.ok(res);
            res = extpath.randomPath('/foo/bar', 'prefix-');
            assert.ok(res.indexOf('prefix-'));
            const r1 = extpath.randomPath('/foo/bar');
            const r2 = extpath.randomPath('/foo/bar');
            assert.notStrictEqual(r1, r2);
            const r3 = extpath.randomPath('', '', 3);
            assert.strictEqual(r3.length, 3);
            const r4 = extpath.randomPath();
            assert.ok(r4);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cGF0aC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2V4dHBhdGgudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtRQUVuQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1lBQzdCLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQywrQkFBK0IsQ0FBQyxFQUFFLDBCQUEwQixDQUFDLENBQUM7WUFDbkcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDakUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUNwQixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLCtCQUErQixDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUN4RixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxXQUFXLENBQUMs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