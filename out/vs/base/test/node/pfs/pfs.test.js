/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "os", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/node/pfs", "vs/base/test/common/utils", "vs/base/test/node/testUtils"], function (require, exports, assert, fs, os_1, async_1, buffer_1, extpath_1, network_1, path_1, platform_1, pfs_1, utils_1, testUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, pfs_1.configureFlushOnWrite)(false); // speed up all unit tests by disabling flush on write
    (0, testUtils_1.flakySuite)('PFS', function () {
        let testDir;
        setup(() => {
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'pfs');
            return pfs_1.Promises.mkdir(testDir, { recursive: true });
        });
        teardown(() => {
            return pfs_1.Promises.rm(testDir);
        });
        test('writeFile', async () => {
            const testFile = (0, path_1.join)(testDir, 'writefile.txt');
            assert.ok(!(await pfs_1.Promises.exists(testFile)));
            await pfs_1.Promises.writeFile(testFile, 'Hello World', (null));
            assert.strictEqual((await pfs_1.Promises.readFile(testFile)).toString(), 'Hello World');
        });
        test('writeFile - parallel write on different files works', async () => {
            const testFile1 = (0, path_1.join)(testDir, 'writefile1.txt');
            const testFile2 = (0, path_1.join)(testDir, 'writefile2.txt');
            const testFile3 = (0, path_1.join)(testDir, 'writefile3.txt');
            const testFile4 = (0, path_1.join)(testDir, 'writefile4.txt');
            const testFile5 = (0, path_1.join)(testDir, 'writefile5.txt');
            await Promise.all([
                pfs_1.Promises.writeFile(testFile1, 'Hello World 1', (null)),
                pfs_1.Promises.writeFile(testFile2, 'Hello World 2', (null)),
                pfs_1.Promises.writeFile(testFile3, 'Hello World 3', (null)),
                pfs_1.Promises.writeFile(testFile4, 'Hello World 4', (null)),
                pfs_1.Promises.writeFile(testFile5, 'Hello World 5', (null))
            ]);
            assert.strictEqual(fs.readFileSync(testFile1).toString(), 'Hello World 1');
            assert.strictEqual(fs.readFileSync(testFile2).toString(), 'Hello World 2');
            assert.strictEqual(fs.readFileSync(testFile3).toString(), 'Hello World 3');
            assert.strictEqual(fs.readFileSync(testFile4).toString(), 'Hello World 4');
            assert.strictEqual(fs.readFileSync(testFile5).toString(), 'Hello World 5');
        });
        test('writeFile - parallel write on same files works and is sequentalized', async () => {
            const testFile = (0, path_1.join)(testDir, 'writefile.txt');
            await Promise.all([
                pfs_1.Promises.writeFile(testFile, 'Hello World 1', undefined),
                pfs_1.Promises.writeFile(testFile, 'Hello World 2', undefined),
                (0, async_1.timeout)(10).then(() => pfs_1.Promises.writeFile(testFile, 'Hello World 3', undefined)),
                pfs_1.Promises.writeFile(testFile, 'Hello World 4', undefined),
                (0, async_1.timeout)(10).then(() => pfs_1.Promises.writeFile(testFile, 'Hello World 5', undefined))
            ]);
            assert.strictEqual(fs.readFileSync(testFile).toString(), 'Hello World 5');
        });
        test('rimraf - simple - unlink', async () => {
            fs.writeFileSync((0, path_1.join)(testDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync((0, path_1.join)(testDir, 'someOtherFile.txt'), 'Contents');
            await pfs_1.Promises.rm(testDir);
            assert.ok(!fs.existsSync(testDir));
        });
        test('rimraf - simple - move', async () => {
            fs.writeFileSync((0, path_1.join)(testDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync((0, path_1.join)(testDir, 'someOtherFile.txt'), 'Contents');
            await pfs_1.Promises.rm(testDir, pfs_1.RimRafMode.MOVE);
            assert.ok(!fs.existsSync(testDir));
        });
        test('rimraf - simple - move (with moveToPath)', async () => {
            fs.writeFileSync((0, path_1.join)(testDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync((0, path_1.join)(testDir, 'someOtherFile.txt'), 'Contents');
            await pfs_1.Promises.rm(testDir, pfs_1.RimRafMode.MOVE, (0, path_1.join)((0, path_1.dirname)(testDir), `${(0, path_1.basename)(testDir)}.vsctmp`));
            assert.ok(!fs.existsSync(testDir));
        });
        test('rimraf - path does not exist - move', async () => {
            const nonExistingDir = (0, path_1.join)(testDir, 'unknown-move');
            await pfs_1.Promises.rm(nonExistingDir, pfs_1.RimRafMode.MOVE);
        });
        test('rimraf - path does not exist - unlink', async () => {
            const nonExistingDir = (0, path_1.join)(testDir, 'unknown-unlink');
            await pfs_1.Promises.rm(nonExistingDir, pfs_1.RimRafMode.UNLINK);
        });
        test('rimraf - recursive folder structure - unlink', async () => {
            fs.writeFileSync((0, path_1.join)(testDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync((0, path_1.join)(testDir, 'someOtherFile.txt'), 'Contents');
            fs.mkdirSync((0, path_1.join)(testDir, 'somefolder'));
            fs.writeFileSync((0, path_1.join)(testDir, 'somefolder', 'somefile.txt'), 'Contents');
            await pfs_1.Promises.rm(testDir);
            assert.ok(!fs.existsSync(testDir));
        });
        test('rimraf - recursive folder structure - move', async () => {
            fs.writeFileSync((0, path_1.join)(testDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync((0, path_1.join)(testDir, 'someOtherFile.txt'), 'Contents');
            fs.mkdirSync((0, path_1.join)(testDir, 'somefolder'));
            fs.writeFileSync((0, path_1.join)(testDir, 'somefolder', 'somefile.txt'), 'Contents');
            await pfs_1.Promises.rm(testDir, pfs_1.RimRafMode.MOVE);
            assert.ok(!fs.existsSync(testDir));
        });
        test('rimraf - simple ends with dot - move', async () => {
            fs.writeFileSync((0, path_1.join)(testDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync((0, path_1.join)(testDir, 'someOtherFile.txt'), 'Contents');
            await pfs_1.Promises.rm(testDir, pfs_1.RimRafMode.MOVE);
            assert.ok(!fs.existsSync(testDir));
        });
        test('rimraf - simple ends with dot slash/backslash - move', async () => {
            fs.writeFileSync((0, path_1.join)(testDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync((0, path_1.join)(testDir, 'someOtherFile.txt'), 'Contents');
            await pfs_1.Promises.rm(`${testDir}${path_1.sep}`, pfs_1.RimRafMode.MOVE);
            assert.ok(!fs.existsSync(testDir));
        });
        test('rimrafSync - swallows file not found error', function () {
            const nonExistingDir = (0, path_1.join)(testDir, 'not-existing');
            (0, pfs_1.rimrafSync)(nonExistingDir);
            assert.ok(!fs.existsSync(nonExistingDir));
        });
        test('rimrafSync - simple', async () => {
            fs.writeFileSync((0, path_1.join)(testDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync((0, path_1.join)(testDir, 'someOtherFile.txt'), 'Contents');
            (0, pfs_1.rimrafSync)(testDir);
            assert.ok(!fs.existsSync(testDir));
        });
        test('rimrafSync - recursive folder structure', async () => {
            fs.writeFileSync((0, path_1.join)(testDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync((0, path_1.join)(testDir, 'someOtherFile.txt'), 'Contents');
            fs.mkdirSync((0, path_1.join)(testDir, 'somefolder'));
            fs.writeFileSync((0, path_1.join)(testDir, 'somefolder', 'somefile.txt'), 'Contents');
            (0, pfs_1.rimrafSync)(testDir);
            assert.ok(!fs.existsSync(testDir));
        });
        test('copy, rename and delete', async () => {
            const sourceDir = network_1.FileAccess.asFileUri('vs/base/test/node/pfs/fixtures').fsPath;
            const parentDir = (0, path_1.join)((0, os_1.tmpdir)(), 'vsctests', 'pfs');
            const targetDir = (0, extpath_1.randomPath)(parentDir);
            const targetDir2 = (0, extpath_1.randomPath)(parentDir);
            await pfs_1.Promises.copy(sourceDir, targetDir, { preserveSymlinks: true });
            assert.ok(fs.existsSync(targetDir));
            assert.ok(fs.existsSync((0, path_1.join)(targetDir, 'index.html')));
            assert.ok(fs.existsSync((0, path_1.join)(targetDir, 'site.css')));
            assert.ok(fs.existsSync((0, path_1.join)(targetDir, 'examples')));
            assert.ok(fs.statSync((0, path_1.join)(targetDir, 'examples')).isDirectory());
            assert.ok(fs.existsSync((0, path_1.join)(targetDir, 'examples', 'small.jxs')));
            await pfs_1.Promises.rename(targetDir, targetDir2);
            assert.ok(!fs.existsSync(targetDir));
            assert.ok(fs.existsSync(targetDir2));
            assert.ok(fs.existsSync((0, path_1.join)(targetDir2, 'index.html')));
            assert.ok(fs.existsSync((0, path_1.join)(targetDir2, 'site.css')));
            assert.ok(fs.existsSync((0, path_1.join)(targetDir2, 'examples')));
            assert.ok(fs.statSync((0, path_1.join)(targetDir2, 'examples')).isDirectory());
            assert.ok(fs.existsSync((0, path_1.join)(targetDir2, 'examples', 'small.jxs')));
            await pfs_1.Promises.rename((0, path_1.join)(targetDir2, 'index.html'), (0, path_1.join)(targetDir2, 'index_moved.html'));
            assert.ok(!fs.existsSync((0, path_1.join)(targetDir2, 'index.html')));
            assert.ok(fs.existsSync((0, path_1.join)(targetDir2, 'index_moved.html')));
            await pfs_1.Promises.rm(parentDir);
            assert.ok(!fs.existsSync(parentDir));
        });
        test('rename without retry', async () => {
            const sourceDir = network_1.FileAccess.asFileUri('vs/base/test/node/pfs/fixtures').fsPath;
            const parentDir = (0, path_1.join)((0, os_1.tmpdir)(), 'vsctests', 'pfs');
            const targetDir = (0, extpath_1.randomPath)(parentDir);
            const targetDir2 = (0, extpath_1.randomPath)(parentDir);
            await pfs_1.Promises.copy(sourceDir, targetDir, { preserveSymlinks: true });
            await pfs_1.Promises.rename(targetDir, targetDir2, false);
            assert.ok(!fs.existsSync(targetDir));
            assert.ok(fs.existsSync(targetDir2));
            assert.ok(fs.existsSync((0, path_1.join)(targetDir2, 'index.html')));
            assert.ok(fs.existsSync((0, path_1.join)(targetDir2, 'site.css')));
            assert.ok(fs.existsSync((0, path_1.join)(targetDir2, 'examples')));
            assert.ok(fs.statSync((0, path_1.join)(targetDir2, 'examples')).isDirectory());
            assert.ok(fs.existsSync((0, path_1.join)(targetDir2, 'examples', 'small.jxs')));
            await pfs_1.Promises.rename((0, path_1.join)(targetDir2, 'index.html'), (0, path_1.join)(targetDir2, 'index_moved.html'), false);
            assert.ok(!fs.existsSync((0, path_1.join)(targetDir2, 'index.html')));
            assert.ok(fs.existsSync((0, path_1.join)(targetDir2, 'index_moved.html')));
            await pfs_1.Promises.rm(parentDir);
            assert.ok(!fs.existsSync(parentDir));
        });
        test('copy handles symbolic links', async () => {
            const symbolicLinkTarget = (0, extpath_1.randomPath)(testDir);
            const symLink = (0, extpath_1.randomPath)(testDir);
            const copyTarget = (0, extpath_1.randomPath)(testDir);
            await pfs_1.Promises.mkdir(symbolicLinkTarget, { recursive: true });
            fs.symlinkSync(symbolicLinkTarget, symLink, 'junction');
            // Copy preserves symlinks if configured as such
            //
            // Windows: this test does not work because creating symlinks
            // requires priviledged permissions (admin).
            if (!platform_1.isWindows) {
                await pfs_1.Promises.copy(symLink, copyTarget, { preserveSymlinks: true });
                assert.ok(fs.existsSync(copyTarget));
                const { symbolicLink } = await pfs_1.SymlinkSupport.stat(copyTarget);
                assert.ok(symbolicLink);
                assert.ok(!symbolicLink.dangling);
                const target = await pfs_1.Promises.readlink(copyTarget);
                assert.strictEqual(target, symbolicLinkTarget);
                // Copy does not preserve symlinks if configured as such
                await pfs_1.Promises.rm(copyTarget);
                await pfs_1.Promises.copy(symLink, copyTarget, { preserveSymlinks: false });
                assert.ok(fs.existsSync(copyTarget));
                const { symbolicLink: symbolicLink2 } = await pfs_1.SymlinkSupport.stat(copyTarget);
                assert.ok(!symbolicLink2);
            }
            // Copy does not fail over dangling symlinks
            await pfs_1.Promises.rm(copyTarget);
            await pfs_1.Promises.rm(symbolicLinkTarget);
            await pfs_1.Promises.copy(symLink, copyTarget, { preserveSymlinks: true }); // this should not throw
            if (!platform_1.isWindows) {
                const { symbolicLink } = await pfs_1.SymlinkSupport.stat(copyTarget);
                assert.ok(symbolicLink?.dangling);
            }
            else {
                assert.ok(!fs.existsSync(copyTarget));
            }
        });
        test('copy handles symbolic links when the reference is inside source', async () => {
            // Source Folder
            const sourceFolder = (0, path_1.join)((0, extpath_1.randomPath)(testDir), 'copy-test'); // copy-test
            const sourceLinkTestFolder = (0, path_1.join)(sourceFolder, 'link-test'); // copy-test/link-test
            const sourceLinkMD5JSFolder = (0, path_1.join)(sourceLinkTestFolder, 'md5'); // copy-test/link-test/md5
            const sourceLinkMD5JSFile = (0, path_1.join)(sourceLinkMD5JSFolder, 'md5.js'); // copy-test/link-test/md5/md5.js
            await pfs_1.Promises.mkdir(sourceLinkMD5JSFolder, { recursive: true });
            await pfs_1.Promises.writeFile(sourceLinkMD5JSFile, 'Hello from MD5');
            const sourceLinkMD5JSFolderLinked = (0, path_1.join)(sourceLinkTestFolder, 'md5-linked'); // copy-test/link-test/md5-linked
            fs.symlinkSync(sourceLinkMD5JSFolder, sourceLinkMD5JSFolderLinked, 'junction');
            // Target Folder
            const targetLinkTestFolder = (0, path_1.join)(sourceFolder, 'link-test copy'); // copy-test/link-test copy
            const targetLinkMD5JSFolder = (0, path_1.join)(targetLinkTestFolder, 'md5'); // copy-test/link-test copy/md5
            const targetLinkMD5JSFile = (0, path_1.join)(targetLinkMD5JSFolder, 'md5.js'); // copy-test/link-test copy/md5/md5.js
            const targetLinkMD5JSFolderLinked = (0, path_1.join)(targetLinkTestFolder, 'md5-linked'); // copy-test/link-test copy/md5-linked
            // Copy with `preserveSymlinks: true` and verify result
            //
            // Windows: this test does not work because creating symlinks
            // requires priviledged permissions (admin).
            if (!platform_1.isWindows) {
                await pfs_1.Promises.copy(sourceLinkTestFolder, targetLinkTestFolder, { preserveSymlinks: true });
                assert.ok(fs.existsSync(targetLinkTestFolder));
                assert.ok(fs.existsSync(targetLinkMD5JSFolder));
                assert.ok(fs.existsSync(targetLinkMD5JSFile));
                assert.ok(fs.existsSync(targetLinkMD5JSFolderLinked));
                assert.ok(fs.lstatSync(targetLinkMD5JSFolderLinked).isSymbolicLink());
                const linkTarget = await pfs_1.Promises.readlink(targetLinkMD5JSFolderLinked);
                assert.strictEqual(linkTarget, targetLinkMD5JSFolder);
                await pfs_1.Promises.rm(targetLinkTestFolder);
            }
            // Copy with `preserveSymlinks: false` and verify result
            await pfs_1.Promises.copy(sourceLinkTestFolder, targetLinkTestFolder, { preserveSymlinks: false });
            assert.ok(fs.existsSync(targetLinkTestFolder));
            assert.ok(fs.existsSync(targetLinkMD5JSFolder));
            assert.ok(fs.existsSync(targetLinkMD5JSFile));
            assert.ok(fs.existsSync(targetLinkMD5JSFolderLinked));
            assert.ok(fs.lstatSync(targetLinkMD5JSFolderLinked).isDirectory());
        });
        test('readDirsInDir', async () => {
            fs.mkdirSync((0, path_1.join)(testDir, 'somefolder1'));
            fs.mkdirSync((0, path_1.join)(testDir, 'somefolder2'));
            fs.mkdirSync((0, path_1.join)(testDir, 'somefolder3'));
            fs.writeFileSync((0, path_1.join)(testDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync((0, path_1.join)(testDir, 'someOtherFile.txt'), 'Contents');
            const result = await pfs_1.Promises.readDirsInDir(testDir);
            assert.strictEqual(result.length, 3);
            assert.ok(result.indexOf('somefolder1') !== -1);
            assert.ok(result.indexOf('somefolder2') !== -1);
            assert.ok(result.indexOf('somefolder3') !== -1);
        });
        test('stat link', async () => {
            const directory = (0, extpath_1.randomPath)(testDir);
            const symbolicLink = (0, extpath_1.randomPath)(testDir);
            await pfs_1.Promises.mkdir(directory, { recursive: true });
            fs.symlinkSync(directory, symbolicLink, 'junction');
            let statAndIsLink = await pfs_1.SymlinkSupport.stat(directory);
            assert.ok(!statAndIsLink?.symbolicLink);
            statAndIsLink = await pfs_1.SymlinkSupport.stat(symbolicLink);
            assert.ok(statAndIsLink?.symbolicLink);
            assert.ok(!statAndIsLink?.symbolicLink?.dangling);
        });
        test('stat link (non existing target)', async () => {
            const directory = (0, extpath_1.randomPath)(testDir);
            const symbolicLink = (0, extpath_1.randomPath)(testDir);
            await pfs_1.Promises.mkdir(directory, { recursive: true });
            fs.symlinkSync(directory, symbolicLink, 'junction');
            await pfs_1.Promises.rm(directory);
            const statAndIsLink = await pfs_1.SymlinkSupport.stat(symbolicLink);
            assert.ok(statAndIsLink?.symbolicLink);
            assert.ok(statAndIsLink?.symbolicLink?.dangling);
        });
        test('readdir', async () => {
            if (typeof process.versions['electron'] !== 'undefined' /* needs electron */) {
                const parent = (0, extpath_1.randomPath)((0, path_1.join)(testDir, 'pfs'));
                const newDir = (0, path_1.join)(parent, 'öäü');
                await pfs_1.Promises.mkdir(newDir, { recursive: true });
                assert.ok(fs.existsSync(newDir));
                const children = await pfs_1.Promises.readdir(parent);
                assert.strictEqual(children.some(n => n === 'öäü'), true); // Mac always converts to NFD, so
            }
        });
        test('readdir (with file types)', async () => {
            if (typeof process.versions['electron'] !== 'undefined' /* needs electron */) {
                const newDir = (0, path_1.join)(testDir, 'öäü');
                await pfs_1.Promises.mkdir(newDir, { recursive: true });
                await pfs_1.Promises.writeFile((0, path_1.join)(testDir, 'somefile.txt'), 'contents');
                assert.ok(fs.existsSync(newDir));
                const children = await pfs_1.Promises.readdir(testDir, { withFileTypes: true });
                assert.strictEqual(children.some(n => n.name === 'öäü'), true); // Mac always converts to NFD, so
                assert.strictEqual(children.some(n => n.isDirectory()), true);
                assert.strictEqual(children.some(n => n.name === 'somefile.txt'), true);
                assert.strictEqual(children.some(n => n.isFile()), true);
            }
        });
        test('writeFile (string)', async () => {
            const smallData = 'Hello World';
            const bigData = (new Array(100 * 1024)).join('Large String\n');
            return testWriteFile(smallData, smallData, bigData, bigData);
        });
        test('writeFile (string) - flush on write', async () => {
            (0, pfs_1.configureFlushOnWrite)(true);
            try {
                const smallData = 'Hello World';
                const bigData = (new Array(100 * 1024)).join('Large String\n');
                return await testWriteFile(smallData, smallData, bigData, bigData);
            }
            finally {
                (0, pfs_1.configureFlushOnWrite)(false);
            }
        });
        test('writeFile (Buffer)', async () => {
            const smallData = 'Hello World';
            const bigData = (new Array(100 * 1024)).join('Large String\n');
            return testWriteFile(Buffer.from(smallData), smallData, Buffer.from(bigData), bigData);
        });
        test('writeFile (UInt8Array)', async () => {
            const smallData = 'Hello World';
            const bigData = (new Array(100 * 1024)).join('Large String\n');
            return testWriteFile(buffer_1.VSBuffer.fromString(smallData).buffer, smallData, buffer_1.VSBuffer.fromString(bigData).buffer, bigData);
        });
        async function testWriteFile(smallData, smallDataValue, bigData, bigDataValue) {
            const testFile = (0, path_1.join)(testDir, 'flushed.txt');
            assert.ok(fs.existsSync(testDir));
            await pfs_1.Promises.writeFile(testFile, smallData);
            assert.strictEqual(fs.readFileSync(testFile).toString(), smallDataValue);
            await pfs_1.Promises.writeFile(testFile, bigData);
            assert.strictEqual(fs.readFileSync(testFile).toString(), bigDataValue);
        }
        test('writeFile (string, error handling)', async () => {
            const testFile = (0, path_1.join)(testDir, 'flushed.txt');
            fs.mkdirSync(testFile); // this will trigger an error later because testFile is now a directory!
            let expectedError;
            try {
                await pfs_1.Promises.writeFile(testFile, 'Hello World');
            }
            catch (error) {
                expectedError = error;
            }
            assert.ok(expectedError);
        });
        test('writeFileSync', async () => {
            const testFile = (0, path_1.join)(testDir, 'flushed.txt');
            (0, pfs_1.writeFileSync)(testFile, 'Hello World');
            assert.strictEqual(fs.readFileSync(testFile).toString(), 'Hello World');
            const largeString = (new Array(100 * 1024)).join('Large String\n');
            (0, pfs_1.writeFileSync)(testFile, largeString);
            assert.strictEqual(fs.readFileSync(testFile).toString(), largeString);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGZzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9ub2RlL3Bmcy9wZnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRyxJQUFBLDJCQUFxQixFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsc0RBQXNEO0lBRXBGLElBQUEsc0JBQVUsRUFBQyxLQUFLLEVBQUU7UUFFakIsSUFBSSxPQUFlLENBQUM7UUFFcEIsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLE9BQU8sR0FBRyxJQUFBLDZCQUFpQixFQUFDLElBQUEsV0FBTSxHQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRXpELE9BQU8sY0FBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixPQUFPLGNBQVEsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVCLE1BQU0sUUFBUSxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxlQUFlLENBQUMsQ0FBQztZQUVoRCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLGNBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTlDLE1BQU0sY0FBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsYUFBYSxFQUFFLENBQUMsSUFBSyxDQUFDLENBQUMsQ0FBQztZQUUzRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxjQUFRLENBQUMsUUFB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QUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUEsV0FBSSxFQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUEsV0FBSSxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUEsV0FBSSxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUEsV0FBSSxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDbkUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUEsV0FBSSxFQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXBFLE1BQU0sY0FBUSxDQUFDLE1BQU0sQ0FBQyxJQUFBLFdBQUksRUFBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLEVBQUUsSUFBQSxXQUFJLEVBQUMsVUFBVSxFQUFFLGtCQUFrQixDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbkcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBQSxXQUFJLEVBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBQSxXQUFJLEVBQUMsVUFBVSxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRS9ELE1BQU0sY0FBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUU3QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzlDLE1BQU0sa0JBQWtCLEdBQUcsSUFBQSxvQkFBVSxFQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9DLE1BQU0sT0FBTyxHQUFHLElBQUEsb0JBQVUsRUFBQyxPQUFPLENBQUMsQ0FBQztZQUNwQyxNQUFNLFVBQVUsR0FBRyxJQUFBLG9CQUFVLEVBQUMsT0FBTyxDQUFDLENBQUM7WUFFdkMsTUFBTSxjQUFRLENBQUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFOUQsRUFBRSxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFeEQsZ0RBQWdEO1lBQ2hELEVBQUU7WUFDRiw2REFBNkQ7WUFDN0QsNENBQTRDO1lBQzVDLElBQUksQ0FBQyxvQkFBUyxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sY0FBUSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFFckUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJDLE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyxNQUFNLG9CQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN4QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUVsQyxNQUFNLE1BQU0sR0FBRyxNQUFNLGNBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLGtCQUFrQixDQUFDLENBQUM7Z0JBRS9DLHdEQUF3RDtnQkFFeEQsTUFBTSxjQUFRLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM5QixNQUFNLGNBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRXRFLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUVyQyxNQUFNLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxHQUFHLE1BQU0sb0JBQWMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzlFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMzQixDQUFDO1lBRUQsNENBQTRDO1lBRTVDLE1BQU0sY0FBUSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5QixNQUFNLGNBQVEsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUV0QyxNQUFNLGNBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7WUFFOUYsSUFBSSxDQUFDLG9CQUFTLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxFQUFFLFlBQVksRUFBRSxHQUFHLE1BQU0sb0JBQWMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpRUFBaUUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUVsRixnQkFBZ0I7WUFDaEIsTUFBTSxZQUFZLEdBQUcsSUFBQSxXQUFJLEVBQUMsSUFBQSxvQkFBVSxFQUFDLE9BQU8sQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUcsWUFBWTtZQUMzRSxNQUFNLG9CQUFvQixHQUFHLElBQUEsV0FBSSxFQUFDLFlBQVksRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFFLHNCQUFzQjtZQUNyRixNQUFNLHFCQUFxQixHQUFHLElBQUEsV0FBSSxFQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsMEJBQTBCO1lBQzNGLE1BQU0sbUJBQW1CLEdBQUcsSUFBQSxXQUFJLEVBQUMscUJBQXFCLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxpQ0FBaUM7WUFDcEcsTUFBTSxjQUFRLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDakUsTUFBTSxjQUFRLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFaEUsTUFBTSwyQkFBMkIsR0FBRyxJQUFBLFdBQUksRUFBQyxvQkFBb0IsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLGlDQUFpQztZQUMvRyxFQUFFLENBQUMsV0FBVyxDQUFDLHFCQUFxQixFQUFFLDJCQUEyQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRS9FLGdCQUFnQjtZQUNoQixNQUFNLG9CQUFvQixHQUFHLElBQUEsV0FBSSxFQUFDLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUksMkJBQTJCO1lBQ2pHLE1BQU0scUJBQXFCLEdBQUcsSUFBQSxXQUFJLEVBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBSSwrQkFBK0I7WUFDbkcsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLFdBQUksRUFBQyxxQkFBcUIsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFJLHNDQUFzQztZQUM1RyxNQUFNLDJCQUEyQixHQUFHLElBQUEsV0FBSSxFQUFDLG9CQUFvQixFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsc0NBQXNDO1lBRXBILHVEQUF1RDtZQUN2RCxFQUFFO1lBQ0YsNkRBQTZEO1lBQzdELDRDQUE0QztZQUM1QyxJQUFJLENBQUMsb0JBQVMsRUFBRSxDQUFDO2dCQUNoQixNQUFNLGNBQVEsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUU1RixNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO2dCQUV0RSxNQUFNLFVBQVUsR0FBRyxNQUFNLGNBQVEsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLENBQUMsQ0FBQztnQkFDeEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUscUJBQXFCLENBQUMsQ0FBQztnQkFFdEQsTUFBTSxjQUFRLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDekMsQ0FBQztZQUVELHdEQUF3RDtZQUN4RCxNQUFNLGNBQVEsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBRTdGLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLDJCQUEyQixDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNwRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDaEMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUMzQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQzNDLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDM0MsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDNUQsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsbUJBQW1CLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVqRSxNQUFNLE1BQU0sR0FBRyxNQUFNLGNBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFdBQVcsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1QixNQUFNLFNBQVMsR0FBRyxJQUFBLG9CQUFVLEVBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEMsTUFBTSxZQUFZLEdBQUcsSUFBQSxvQkFBVSxFQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXpDLE1BQU0sY0FBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVyRCxFQUFFLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFcEQsSUFBSSxhQUFhLEdBQUcsTUFBTSxvQkFBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRXhDLGFBQWEsR0FBRyxNQUFNLG9CQUFjLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxhQUFhLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xELE1BQU0sU0FBUyxHQUFHLElBQUEsb0JBQVUsRUFBQyxPQUFPLENBQUMsQ0FBQztZQUN0QyxNQUFNLFlBQVksR0FBRyxJQUFBLG9CQUFVLEVBQUMsT0FBTyxDQUFDLENBQUM7WUFFekMsTUFBTSxjQUFRLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRXJELEVBQUUsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVwRCxNQUFNLGNBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFN0IsTUFBTSxhQUFhLEdBQUcsTUFBTSxvQkFBYyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM5RCxNQUFNLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFCLElBQUksT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUM5RSxNQUFNLE1BQU0sR0FBRyxJQUFBLG9CQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUEsV0FBSSxFQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFbkMsTUFBTSxjQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUVsRCxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFFakMsTUFBTSxRQUFRLEdBQUcsTUFBTSxjQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQ0FBaUM7WUFDN0YsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVDLElBQUksT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUM5RSxNQUFNLE1BQU0sR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3BDLE1BQU0sY0FBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFFbEQsTUFBTSxjQUFRLENBQUMsU0FBUyxDQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFFcEUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBRWpDLE1BQU0sUUFBUSxHQUFHLE1BQU0sY0FBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFFMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLGlDQUFpQztnQkFDakcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRTlELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssY0FBYyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFELENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNyQyxNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUM7WUFDaEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUUvRCxPQUFPLGFBQWEsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM5RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN0RCxJQUFBLDJCQUFxQixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQztnQkFDSixNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUM7Z0JBQ2hDLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBRS9ELE9BQU8sTUFBTSxhQUFhLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEUsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLElBQUEsMkJBQXFCLEVBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JDLE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQztZQUNoQyxNQUFNLE9BQU8sR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRS9ELE9BQU8sYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDeEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekMsTUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDO1lBQ2hDLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFL0QsT0FBTyxhQUFhLENBQUMsaUJBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEgsQ0FBQyxDQUFDLENBQUM7UUFFSCxLQUFLLFVBQVUsYUFBYSxDQUMzQixTQUF1QyxFQUN2QyxjQUFzQixFQUN0QixPQUFxQyxFQUNyQyxZQUFvQjtZQUVwQixNQUFNLFFBQVEsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFOUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFFbEMsTUFBTSxjQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFekUsTUFBTSxjQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVELElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNyRCxNQUFNLFFBQVEsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFOUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLHdFQUF3RTtZQUVoRyxJQUFJLGFBQWdDLENBQUM7WUFDckMsSUFBSSxDQUFDO2dCQUNKLE1BQU0sY0FBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDbkQsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLGFBQWEsR0FBRyxLQUFLLENBQUM7WUFDdkIsQ0FBQztZQUVELE1BQU0sQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hDLE1BQU0sUUFBUSxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUU5QyxJQUFBLG1CQUFhLEVBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUV4RSxNQUFNLFdBQVcsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRW5FLElBQUEsbUJBQWEsRUFBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3ZFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=