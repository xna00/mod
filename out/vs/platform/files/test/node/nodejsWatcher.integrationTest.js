/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/path", "vs/base/node/pfs", "vs/base/test/node/testUtils", "vs/platform/files/node/watcher/nodejs/nodejsWatcherLib", "vs/base/common/platform", "vs/base/common/extpath", "vs/base/common/strings", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/files/node/watcher/nodejs/nodejsWatcher", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/unc", "vs/base/common/event"], function (require, exports, os_1, path_1, pfs_1, testUtils_1, nodejsWatcherLib_1, platform_1, extpath_1, strings_1, async_1, cancellation_1, nodejsWatcher_1, network_1, resources_1, uri_1, unc_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // this suite has shown flaky runs in Azure pipelines where
    // tasks would just hang and timeout after a while (not in
    // mocha but generally). as such they will run only on demand
    // whenever we update the watcher library.
    ((process.env['BUILD_SOURCEVERSION'] || process.env['CI']) ? suite.skip : testUtils_1.flakySuite)('File Watcher (node.js)', () => {
        class TestNodeJSWatcher extends nodejsWatcher_1.NodeJSWatcher {
            constructor() {
                super(...arguments);
                this.suspendedWatchRequestPollingInterval = 100;
                this._onDidWatch = this._register(new event_1.Emitter());
                this.onDidWatch = this._onDidWatch.event;
                this.onWatchFail = this._onDidWatchFail.event;
            }
            async doWatch(requests) {
                await super.doWatch(requests);
                for (const watcher of this.watchers) {
                    await watcher.instance.ready;
                }
                this._onDidWatch.fire();
            }
        }
        let testDir;
        let watcher;
        let loggingEnabled = false;
        function enableLogging(enable) {
            loggingEnabled = enable;
            watcher?.setVerboseLogging(enable);
        }
        enableLogging(false);
        setup(async () => {
            watcher = new TestNodeJSWatcher();
            watcher?.setVerboseLogging(loggingEnabled);
            watcher.onDidLogMessage(e => {
                if (loggingEnabled) {
                    console.log(`[non-recursive watcher test message] ${e.message}`);
                }
            });
            watcher.onDidError(e => {
                if (loggingEnabled) {
                    console.log(`[non-recursive watcher test error] ${e}`);
                }
            });
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'filewatcher');
            const sourceDir = network_1.FileAccess.asFileUri('vs/platform/files/test/node/fixtures/service').fsPath;
            await pfs_1.Promises.copy(sourceDir, testDir, { preserveSymlinks: false });
        });
        teardown(async () => {
            await watcher.stop();
            watcher.dispose();
            // Possible that the file watcher is still holding
            // onto the folders on Windows specifically and the
            // unlink would fail. In that case, do not fail the
            // test suite.
            return pfs_1.Promises.rm(testDir).catch(error => console.error(error));
        });
        function toMsg(type) {
            switch (type) {
                case 1 /* FileChangeType.ADDED */: return 'added';
                case 2 /* FileChangeType.DELETED */: return 'deleted';
                default: return 'changed';
            }
        }
        async function awaitEvent(service, path, type, correlationId, expectedCount) {
            if (loggingEnabled) {
                console.log(`Awaiting change type '${toMsg(type)}' on file '${path}'`);
            }
            // Await the event
            await new Promise(resolve => {
                let counter = 0;
                const disposable = service.onDidChangeFile(events => {
                    for (const event of events) {
                        if (resources_1.extUriBiasedIgnorePathCase.isEqual(event.resource, uri_1.URI.file(path)) && event.type === type && (correlationId === null || event.cId === correlationId)) {
                            counter++;
                            if (typeof expectedCount === 'number' && counter < expectedCount) {
                                continue; // not yet
                            }
                            disposable.dispose();
                            resolve();
                            break;
                        }
                    }
                });
            });
        }
        test('basics (folder watch)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], recursive: false }]);
            // New file
            const newFilePath = (0, path_1.join)(testDir, 'newFile.txt');
            let changeFuture = awaitEvent(watcher, newFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newFilePath, 'Hello World');
            await changeFuture;
            // New folder
            const newFolderPath = (0, path_1.join)(testDir, 'New Folder');
            changeFuture = awaitEvent(watcher, newFolderPath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.mkdir(newFolderPath);
            await changeFuture;
            // Rename file
            let renamedFilePath = (0, path_1.join)(testDir, 'renamedFile.txt');
            changeFuture = Promise.all([
                awaitEvent(watcher, newFilePath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, renamedFilePath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(newFilePath, renamedFilePath);
            await changeFuture;
            // Rename folder
            let renamedFolderPath = (0, path_1.join)(testDir, 'Renamed Folder');
            changeFuture = Promise.all([
                awaitEvent(watcher, newFolderPath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, renamedFolderPath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(newFolderPath, renamedFolderPath);
            await changeFuture;
            // Rename file (same name, different case)
            const caseRenamedFilePath = (0, path_1.join)(testDir, 'RenamedFile.txt');
            changeFuture = Promise.all([
                awaitEvent(watcher, renamedFilePath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, caseRenamedFilePath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(renamedFilePath, caseRenamedFilePath);
            await changeFuture;
            renamedFilePath = caseRenamedFilePath;
            // Rename folder (same name, different case)
            const caseRenamedFolderPath = (0, path_1.join)(testDir, 'REnamed Folder');
            changeFuture = Promise.all([
                awaitEvent(watcher, renamedFolderPath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, caseRenamedFolderPath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(renamedFolderPath, caseRenamedFolderPath);
            await changeFuture;
            renamedFolderPath = caseRenamedFolderPath;
            // Move file
            const movedFilepath = (0, path_1.join)(testDir, 'movedFile.txt');
            changeFuture = Promise.all([
                awaitEvent(watcher, renamedFilePath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, movedFilepath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(renamedFilePath, movedFilepath);
            await changeFuture;
            // Move folder
            const movedFolderpath = (0, path_1.join)(testDir, 'Moved Folder');
            changeFuture = Promise.all([
                awaitEvent(watcher, renamedFolderPath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, movedFolderpath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(renamedFolderPath, movedFolderpath);
            await changeFuture;
            // Copy file
            const copiedFilepath = (0, path_1.join)(testDir, 'copiedFile.txt');
            changeFuture = awaitEvent(watcher, copiedFilepath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.copyFile(movedFilepath, copiedFilepath);
            await changeFuture;
            // Copy folder
            const copiedFolderpath = (0, path_1.join)(testDir, 'Copied Folder');
            changeFuture = awaitEvent(watcher, copiedFolderpath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.copy(movedFolderpath, copiedFolderpath, { preserveSymlinks: false });
            await changeFuture;
            // Change file
            changeFuture = awaitEvent(watcher, copiedFilepath, 0 /* FileChangeType.UPDATED */);
            await pfs_1.Promises.writeFile(copiedFilepath, 'Hello Change');
            await changeFuture;
            // Create new file
            const anotherNewFilePath = (0, path_1.join)(testDir, 'anotherNewFile.txt');
            changeFuture = awaitEvent(watcher, anotherNewFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(anotherNewFilePath, 'Hello Another World');
            await changeFuture;
            // Delete file
            changeFuture = awaitEvent(watcher, copiedFilepath, 2 /* FileChangeType.DELETED */);
            await pfs_1.Promises.unlink(copiedFilepath);
            await changeFuture;
            // Delete folder
            changeFuture = awaitEvent(watcher, copiedFolderpath, 2 /* FileChangeType.DELETED */);
            await pfs_1.Promises.rmdir(copiedFolderpath);
            await changeFuture;
            watcher.dispose();
        });
        test('basics (file watch)', async function () {
            const filePath = (0, path_1.join)(testDir, 'lorem.txt');
            await watcher.watch([{ path: filePath, excludes: [], recursive: false }]);
            // Change file
            let changeFuture = awaitEvent(watcher, filePath, 0 /* FileChangeType.UPDATED */);
            await pfs_1.Promises.writeFile(filePath, 'Hello Change');
            await changeFuture;
            // Delete file
            changeFuture = awaitEvent(watcher, filePath, 2 /* FileChangeType.DELETED */);
            await pfs_1.Promises.unlink(filePath);
            await changeFuture;
            // Recreate watcher
            await pfs_1.Promises.writeFile(filePath, 'Hello Change');
            await watcher.watch([]);
            await watcher.watch([{ path: filePath, excludes: [], recursive: false }]);
            // Move file
            changeFuture = awaitEvent(watcher, filePath, 2 /* FileChangeType.DELETED */);
            await pfs_1.Promises.rename(filePath, `${filePath}-moved`);
            await changeFuture;
        });
        test('atomic writes (folder watch)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], recursive: false }]);
            // Delete + Recreate file
            const newFilePath = (0, path_1.join)(testDir, 'lorem.txt');
            const changeFuture = awaitEvent(watcher, newFilePath, 0 /* FileChangeType.UPDATED */);
            await pfs_1.Promises.unlink(newFilePath);
            pfs_1.Promises.writeFile(newFilePath, 'Hello Atomic World');
            await changeFuture;
        });
        test('atomic writes (file watch)', async function () {
            const filePath = (0, path_1.join)(testDir, 'lorem.txt');
            await watcher.watch([{ path: filePath, excludes: [], recursive: false }]);
            // Delete + Recreate file
            const newFilePath = (0, path_1.join)(filePath);
            const changeFuture = awaitEvent(watcher, newFilePath, 0 /* FileChangeType.UPDATED */);
            await pfs_1.Promises.unlink(newFilePath);
            pfs_1.Promises.writeFile(newFilePath, 'Hello Atomic World');
            await changeFuture;
        });
        test('multiple events (folder watch)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], recursive: false }]);
            // multiple add
            const newFilePath1 = (0, path_1.join)(testDir, 'newFile-1.txt');
            const newFilePath2 = (0, path_1.join)(testDir, 'newFile-2.txt');
            const newFilePath3 = (0, path_1.join)(testDir, 'newFile-3.txt');
            const addedFuture1 = awaitEvent(watcher, newFilePath1, 1 /* FileChangeType.ADDED */);
            const addedFuture2 = awaitEvent(watcher, newFilePath2, 1 /* FileChangeType.ADDED */);
            const addedFuture3 = awaitEvent(watcher, newFilePath3, 1 /* FileChangeType.ADDED */);
            await Promise.all([
                await pfs_1.Promises.writeFile(newFilePath1, 'Hello World 1'),
                await pfs_1.Promises.writeFile(newFilePath2, 'Hello World 2'),
                await pfs_1.Promises.writeFile(newFilePath3, 'Hello World 3'),
            ]);
            await Promise.all([addedFuture1, addedFuture2, addedFuture3]);
            // multiple change
            const changeFuture1 = awaitEvent(watcher, newFilePath1, 0 /* FileChangeType.UPDATED */);
            const changeFuture2 = awaitEvent(watcher, newFilePath2, 0 /* FileChangeType.UPDATED */);
            const changeFuture3 = awaitEvent(watcher, newFilePath3, 0 /* FileChangeType.UPDATED */);
            await Promise.all([
                await pfs_1.Promises.writeFile(newFilePath1, 'Hello Update 1'),
                await pfs_1.Promises.writeFile(newFilePath2, 'Hello Update 2'),
                await pfs_1.Promises.writeFile(newFilePath3, 'Hello Update 3'),
            ]);
            await Promise.all([changeFuture1, changeFuture2, changeFuture3]);
            // copy with multiple files
            const copyFuture1 = awaitEvent(watcher, (0, path_1.join)(testDir, 'newFile-1-copy.txt'), 1 /* FileChangeType.ADDED */);
            const copyFuture2 = awaitEvent(watcher, (0, path_1.join)(testDir, 'newFile-2-copy.txt'), 1 /* FileChangeType.ADDED */);
            const copyFuture3 = awaitEvent(watcher, (0, path_1.join)(testDir, 'newFile-3-copy.txt'), 1 /* FileChangeType.ADDED */);
            await Promise.all([
                pfs_1.Promises.copy((0, path_1.join)(testDir, 'newFile-1.txt'), (0, path_1.join)(testDir, 'newFile-1-copy.txt'), { preserveSymlinks: false }),
                pfs_1.Promises.copy((0, path_1.join)(testDir, 'newFile-2.txt'), (0, path_1.join)(testDir, 'newFile-2-copy.txt'), { preserveSymlinks: false }),
                pfs_1.Promises.copy((0, path_1.join)(testDir, 'newFile-3.txt'), (0, path_1.join)(testDir, 'newFile-3-copy.txt'), { preserveSymlinks: false })
            ]);
            await Promise.all([copyFuture1, copyFuture2, copyFuture3]);
            // multiple delete
            const deleteFuture1 = awaitEvent(watcher, newFilePath1, 2 /* FileChangeType.DELETED */);
            const deleteFuture2 = awaitEvent(watcher, newFilePath2, 2 /* FileChangeType.DELETED */);
            const deleteFuture3 = awaitEvent(watcher, newFilePath3, 2 /* FileChangeType.DELETED */);
            await Promise.all([
                await pfs_1.Promises.unlink(newFilePath1),
                await pfs_1.Promises.unlink(newFilePath2),
                await pfs_1.Promises.unlink(newFilePath3)
            ]);
            await Promise.all([deleteFuture1, deleteFuture2, deleteFuture3]);
        });
        test('multiple events (file watch)', async function () {
            const filePath = (0, path_1.join)(testDir, 'lorem.txt');
            await watcher.watch([{ path: filePath, excludes: [], recursive: false }]);
            // multiple change
            const changeFuture1 = awaitEvent(watcher, filePath, 0 /* FileChangeType.UPDATED */);
            await Promise.all([
                await pfs_1.Promises.writeFile(filePath, 'Hello Update 1'),
                await pfs_1.Promises.writeFile(filePath, 'Hello Update 2'),
                await pfs_1.Promises.writeFile(filePath, 'Hello Update 3'),
            ]);
            await Promise.all([changeFuture1]);
        });
        test('excludes can be updated (folder watch)', async function () {
            await watcher.watch([{ path: testDir, excludes: ['**'], recursive: false }]);
            await watcher.watch([{ path: testDir, excludes: [], recursive: false }]);
            return basicCrudTest((0, path_1.join)(testDir, 'files-excludes.txt'));
        });
        test('excludes are ignored (file watch)', async function () {
            const filePath = (0, path_1.join)(testDir, 'lorem.txt');
            await watcher.watch([{ path: filePath, excludes: ['**'], recursive: false }]);
            return basicCrudTest(filePath, true);
        });
        test('includes can be updated (folder watch)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: ['nothing'], recursive: false }]);
            await watcher.watch([{ path: testDir, excludes: [], recursive: false }]);
            return basicCrudTest((0, path_1.join)(testDir, 'files-includes.txt'));
        });
        test('non-includes are ignored (file watch)', async function () {
            const filePath = (0, path_1.join)(testDir, 'lorem.txt');
            await watcher.watch([{ path: filePath, excludes: [], includes: ['nothing'], recursive: false }]);
            return basicCrudTest(filePath, true);
        });
        test('includes are supported (folder watch)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: ['**/files-includes.txt'], recursive: false }]);
            return basicCrudTest((0, path_1.join)(testDir, 'files-includes.txt'));
        });
        test('includes are supported (folder watch, relative pattern explicit)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: [{ base: testDir, pattern: 'files-includes.txt' }], recursive: false }]);
            return basicCrudTest((0, path_1.join)(testDir, 'files-includes.txt'));
        });
        test('includes are supported (folder watch, relative pattern implicit)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: ['files-includes.txt'], recursive: false }]);
            return basicCrudTest((0, path_1.join)(testDir, 'files-includes.txt'));
        });
        test('correlationId is supported', async function () {
            const correlationId = Math.random();
            await watcher.watch([{ correlationId, path: testDir, excludes: [], recursive: false }]);
            return basicCrudTest((0, path_1.join)(testDir, 'newFile.txt'), undefined, correlationId);
        });
        (platform_1.isWindows /* windows: cannot create file symbolic link without elevated context */ ? test.skip : test)('symlink support (folder watch)', async function () {
            const link = (0, path_1.join)(testDir, 'deep-linked');
            const linkTarget = (0, path_1.join)(testDir, 'deep');
            await pfs_1.Promises.symlink(linkTarget, link);
            await watcher.watch([{ path: link, excludes: [], recursive: false }]);
            return basicCrudTest((0, path_1.join)(link, 'newFile.txt'));
        });
        async function basicCrudTest(filePath, skipAdd, correlationId, expectedCount, awaitWatchAfterAdd) {
            let changeFuture;
            // New file
            if (!skipAdd) {
                changeFuture = awaitEvent(watcher, filePath, 1 /* FileChangeType.ADDED */, correlationId, expectedCount);
                await pfs_1.Promises.writeFile(filePath, 'Hello World');
                await changeFuture;
                if (awaitWatchAfterAdd) {
                    await event_1.Event.toPromise(watcher.onDidWatch);
                }
            }
            // Change file
            changeFuture = awaitEvent(watcher, filePath, 0 /* FileChangeType.UPDATED */, correlationId, expectedCount);
            await pfs_1.Promises.writeFile(filePath, 'Hello Change');
            await changeFuture;
            // Delete file
            changeFuture = awaitEvent(watcher, filePath, 2 /* FileChangeType.DELETED */, correlationId, expectedCount);
            await pfs_1.Promises.unlink(await pfs_1.Promises.realpath(filePath)); // support symlinks
            await changeFuture;
        }
        (platform_1.isWindows /* windows: cannot create file symbolic link without elevated context */ ? test.skip : test)('symlink support (file watch)', async function () {
            const link = (0, path_1.join)(testDir, 'lorem.txt-linked');
            const linkTarget = (0, path_1.join)(testDir, 'lorem.txt');
            await pfs_1.Promises.symlink(linkTarget, link);
            await watcher.watch([{ path: link, excludes: [], recursive: false }]);
            return basicCrudTest(link, true);
        });
        (!platform_1.isWindows /* UNC is windows only */ ? test.skip : test)('unc support (folder watch)', async function () {
            (0, unc_1.addUNCHostToAllowlist)('localhost');
            // Local UNC paths are in the form of: \\localhost\c$\my_dir
            const uncPath = `\\\\localhost\\${(0, extpath_1.getDriveLetter)(testDir)?.toLowerCase()}$\\${(0, strings_1.ltrim)(testDir.substr(testDir.indexOf(':') + 1), '\\')}`;
            await watcher.watch([{ path: uncPath, excludes: [], recursive: false }]);
            return basicCrudTest((0, path_1.join)(uncPath, 'newFile.txt'));
        });
        (!platform_1.isWindows /* UNC is windows only */ ? test.skip : test)('unc support (file watch)', async function () {
            (0, unc_1.addUNCHostToAllowlist)('localhost');
            // Local UNC paths are in the form of: \\localhost\c$\my_dir
            const uncPath = `\\\\localhost\\${(0, extpath_1.getDriveLetter)(testDir)?.toLowerCase()}$\\${(0, strings_1.ltrim)(testDir.substr(testDir.indexOf(':') + 1), '\\')}\\lorem.txt`;
            await watcher.watch([{ path: uncPath, excludes: [], recursive: false }]);
            return basicCrudTest(uncPath, true);
        });
        (platform_1.isLinux /* linux: is case sensitive */ ? test.skip : test)('wrong casing (folder watch)', async function () {
            const wrongCase = (0, path_1.join)((0, path_1.dirname)(testDir), (0, path_1.basename)(testDir).toUpperCase());
            await watcher.watch([{ path: wrongCase, excludes: [], recursive: false }]);
            return basicCrudTest((0, path_1.join)(wrongCase, 'newFile.txt'));
        });
        (platform_1.isLinux /* linux: is case sensitive */ ? test.skip : test)('wrong casing (file watch)', async function () {
            const filePath = (0, path_1.join)(testDir, 'LOREM.txt');
            await watcher.watch([{ path: filePath, excludes: [], recursive: false }]);
            return basicCrudTest(filePath, true);
        });
        test('invalid path does not explode', async function () {
            const invalidPath = (0, path_1.join)(testDir, 'invalid');
            await watcher.watch([{ path: invalidPath, excludes: [], recursive: false }]);
        });
        test('watchFileContents', async function () {
            const watchedPath = (0, path_1.join)(testDir, 'lorem.txt');
            const cts = new cancellation_1.CancellationTokenSource();
            const readyPromise = new async_1.DeferredPromise();
            const chunkPromise = new async_1.DeferredPromise();
            const watchPromise = (0, nodejsWatcherLib_1.watchFileContents)(watchedPath, () => chunkPromise.complete(), () => readyPromise.complete(), cts.token);
            await readyPromise.p;
            pfs_1.Promises.writeFile(watchedPath, 'Hello World');
            await chunkPromise.p;
            cts.cancel(); // this will resolve `watchPromise`
            return watchPromise;
        });
        test('watching same or overlapping paths supported when correlation is applied', async function () {
            await watcher.watch([
                { path: testDir, excludes: [], recursive: false, correlationId: 1 }
            ]);
            await basicCrudTest((0, path_1.join)(testDir, 'newFile_1.txt'), undefined, null, 1);
            await watcher.watch([
                { path: testDir, excludes: [], recursive: false, correlationId: 1 },
                { path: testDir, excludes: [], recursive: false, correlationId: 2, },
                { path: testDir, excludes: [], recursive: false, correlationId: undefined }
            ]);
            await basicCrudTest((0, path_1.join)(testDir, 'newFile_2.txt'), undefined, null, 3);
            await basicCrudTest((0, path_1.join)(testDir, 'otherNewFile.txt'), undefined, null, 3);
        });
        test('watching missing path emits watcher fail event', async function () {
            const onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            const folderPath = (0, path_1.join)(testDir, 'missing');
            watcher.watch([{ path: folderPath, excludes: [], recursive: true }]);
            await onDidWatchFail;
        });
        test('deleting watched path emits watcher fail and delete event when correlated (file watch)', async function () {
            const filePath = (0, path_1.join)(testDir, 'lorem.txt');
            await watcher.watch([{ path: filePath, excludes: [], recursive: false, correlationId: 1 }]);
            const onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            const changeFuture = awaitEvent(watcher, filePath, 2 /* FileChangeType.DELETED */, 1);
            pfs_1.Promises.unlink(filePath);
            await onDidWatchFail;
            await changeFuture;
        });
        (platform_1.isMacintosh /* macOS: does not seem to report deletes on folders */ ? test.skip : test)('deleting watched path emits watcher fail and delete event when correlated (folder watch)', async function () {
            const folderPath = (0, path_1.join)(testDir, 'deep');
            await watcher.watch([{ path: folderPath, excludes: [], recursive: false }]);
            const onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            const changeFuture = awaitEvent(watcher, folderPath, 2 /* FileChangeType.DELETED */, 1);
            pfs_1.Promises.rm(folderPath, pfs_1.RimRafMode.UNLINK);
            await onDidWatchFail;
            await changeFuture;
        });
        test('correlated watch requests support suspend/resume (file, does not exist in beginning)', async function () {
            const filePath = (0, path_1.join)(testDir, 'not-found.txt');
            const onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            await watcher.watch([{ path: filePath, excludes: [], recursive: false, correlationId: 1 }]);
            await onDidWatchFail;
            await basicCrudTest(filePath, undefined, 1, undefined, true);
            await basicCrudTest(filePath, undefined, 1, undefined, true);
        });
        test('correlated watch requests support suspend/resume (file, exists in beginning)', async function () {
            const filePath = (0, path_1.join)(testDir, 'lorem.txt');
            await watcher.watch([{ path: filePath, excludes: [], recursive: false, correlationId: 1 }]);
            const onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            await basicCrudTest(filePath, true, 1);
            await onDidWatchFail;
            await basicCrudTest(filePath, undefined, 1, undefined, true);
        });
        test('correlated watch requests support suspend/resume (folder, does not exist in beginning)', async function () {
            let onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            const folderPath = (0, path_1.join)(testDir, 'not-found');
            await watcher.watch([{ path: folderPath, excludes: [], recursive: false, correlationId: 1 }]);
            await onDidWatchFail;
            let changeFuture = awaitEvent(watcher, folderPath, 1 /* FileChangeType.ADDED */, 1);
            let onDidWatch = event_1.Event.toPromise(watcher.onDidWatch);
            await pfs_1.Promises.mkdir(folderPath);
            await changeFuture;
            await onDidWatch;
            const filePath = (0, path_1.join)(folderPath, 'newFile.txt');
            await basicCrudTest(filePath, undefined, 1);
            if (!platform_1.isMacintosh) { // macOS does not report DELETE events for folders
                onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
                await pfs_1.Promises.rmdir(folderPath);
                await onDidWatchFail;
                changeFuture = awaitEvent(watcher, folderPath, 1 /* FileChangeType.ADDED */, 1);
                onDidWatch = event_1.Event.toPromise(watcher.onDidWatch);
                await pfs_1.Promises.mkdir(folderPath);
                await changeFuture;
                await onDidWatch;
                await (0, async_1.timeout)(500); // somehow needed on Linux
                await basicCrudTest(filePath, undefined, 1);
            }
        });
        (platform_1.isMacintosh /* macOS: does not seem to report this */ ? test.skip : test)('correlated watch requests support suspend/resume (folder, exists in beginning)', async function () {
            const folderPath = (0, path_1.join)(testDir, 'deep');
            await watcher.watch([{ path: folderPath, excludes: [], recursive: false, correlationId: 1 }]);
            const filePath = (0, path_1.join)(folderPath, 'newFile.txt');
            await basicCrudTest(filePath, undefined, 1);
            const onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            await pfs_1.Promises.rm(folderPath);
            await onDidWatchFail;
            const changeFuture = awaitEvent(watcher, folderPath, 1 /* FileChangeType.ADDED */, 1);
            const onDidWatch = event_1.Event.toPromise(watcher.onDidWatch);
            await pfs_1.Promises.mkdir(folderPath);
            await changeFuture;
            await onDidWatch;
            await (0, async_1.timeout)(500); // somehow needed on Linux
            await basicCrudTest(filePath, undefined, 1);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZWpzV2F0Y2hlci5pbnRlZ3JhdGlvblRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL3Rlc3Qvbm9kZS9ub2RlanNXYXRjaGVyLmludGVncmF0aW9uVGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsMkRBQTJEO0lBQzNELDBEQUEwRDtJQUMxRCw2REFBNkQ7SUFDN0QsMENBQTBDO0lBRTFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxzQkFBVSxDQUFDLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1FBRXBILE1BQU0saUJBQWtCLFNBQVEsNkJBQWE7WUFBN0M7O2dCQUU2Qix5Q0FBb0MsR0FBRyxHQUFHLENBQUM7Z0JBRXRELGdCQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7Z0JBQzFELGVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztnQkFFcEMsZ0JBQVcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQztZQVVuRCxDQUFDO1lBUm1CLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBcUM7Z0JBQ3JFLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDOUIsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3JDLE1BQU0sT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7Z0JBQzlCLENBQUM7Z0JBRUQsSUFBSSxDQUFD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