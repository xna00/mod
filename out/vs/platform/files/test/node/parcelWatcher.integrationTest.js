/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "os", "vs/base/common/async", "vs/base/common/path", "vs/base/common/platform", "vs/base/node/pfs", "vs/base/test/node/testUtils", "vs/platform/files/node/watcher/parcel/parcelWatcher", "vs/base/common/extpath", "vs/base/common/strings", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/unc", "vs/base/common/event"], function (require, exports, assert, fs_1, os_1, async_1, path_1, platform_1, pfs_1, testUtils_1, parcelWatcher_1, extpath_1, strings_1, network_1, resources_1, uri_1, unc_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // this suite has shown flaky runs in Azure pipelines where
    // tasks would just hang and timeout after a while (not in
    // mocha but generally). as such they will run only on demand
    // whenever we update the watcher library.
    ((process.env['BUILD_SOURCEVERSION'] || process.env['CI']) ? suite.skip : testUtils_1.flakySuite)('File Watcher (parcel)', () => {
        class TestParcelWatcher extends parcelWatcher_1.ParcelWatcher {
            constructor() {
                super(...arguments);
                this.suspendedWatchRequestPollingInterval = 100;
                this._onDidWatch = this._register(new event_1.Emitter());
                this.onDidWatch = this._onDidWatch.event;
                this.onWatchFail = this._onDidWatchFail.event;
            }
            testRemoveDuplicateRequests(paths, excludes = []) {
                // Work with strings as paths to simplify testing
                const requests = paths.map(path => {
                    return { path, excludes, recursive: true };
                });
                return this.removeDuplicateRequests(requests, false /* validate paths skipped for tests */).map(request => request.path);
            }
            async doWatch(requests) {
                await super.doWatch(requests);
                await this.whenReady();
                this._onDidWatch.fire();
            }
            async whenReady() {
                for (const watcher of this.watchers) {
                    await watcher.ready;
                }
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
            watcher = new TestParcelWatcher();
            watcher.setVerboseLogging(loggingEnabled);
            watcher.onDidLogMessage(e => {
                if (loggingEnabled) {
                    console.log(`[recursive watcher test message] ${e.message}`);
                }
            });
            watcher.onDidError(e => {
                if (loggingEnabled) {
                    console.log(`[recursive watcher test error] ${e}`);
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
        async function awaitEvent(watcher, path, type, failOnEventReason, correlationId, expectedCount) {
            if (loggingEnabled) {
                console.log(`Awaiting change type '${toMsg(type)}' on file '${path}'`);
            }
            // Await the event
            const res = await new Promise((resolve, reject) => {
                let counter = 0;
                const disposable = watcher.onDidChangeFile(events => {
                    for (const event of events) {
                        if (resources_1.extUriBiasedIgnorePathCase.isEqual(event.resource, uri_1.URI.file(path)) && event.type === type && (correlationId === null || event.cId === correlationId)) {
                            counter++;
                            if (typeof expectedCount === 'number' && counter < expectedCount) {
                                continue; // not yet
                            }
                            disposable.dispose();
                            if (failOnEventReason) {
                                reject(new Error(`Unexpected file event: ${failOnEventReason}`));
                            }
                            else {
                                setImmediate(() => resolve(events)); // copied from parcel watcher tests, seems to drop unrelated events on macOS
                            }
                            break;
                        }
                    }
                });
            });
            // Unwind from the event call stack: we have seen crashes in Parcel
            // when e.g. calling `unsubscribe` directly from the stack of a file
            // change event
            // Refs: https://github.com/microsoft/vscode/issues/137430
            await (0, async_1.timeout)(1);
            return res;
        }
        function awaitMessage(watcher, type) {
            if (loggingEnabled) {
                console.log(`Awaiting message of type ${type}`);
            }
            // Await the message
            return new Promise(resolve => {
                const disposable = watcher.onDidLogMessage(msg => {
                    if (msg.type === type) {
                        disposable.dispose();
                        resolve();
                    }
                });
            });
        }
        test('basics', async function () {
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }]);
            // New file
            const newFilePath = (0, path_1.join)(testDir, 'deep', 'newFile.txt');
            let changeFuture = awaitEvent(watcher, newFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newFilePath, 'Hello World');
            await changeFuture;
            // New folder
            const newFolderPath = (0, path_1.join)(testDir, 'deep', 'New Folder');
            changeFuture = awaitEvent(watcher, newFolderPath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.mkdir(newFolderPath);
            await changeFuture;
            // Rename file
            let renamedFilePath = (0, path_1.join)(testDir, 'deep', 'renamedFile.txt');
            changeFuture = Promise.all([
                awaitEvent(watcher, newFilePath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, renamedFilePath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(newFilePath, renamedFilePath);
            await changeFuture;
            // Rename folder
            let renamedFolderPath = (0, path_1.join)(testDir, 'deep', 'Renamed Folder');
            changeFuture = Promise.all([
                awaitEvent(watcher, newFolderPath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, renamedFolderPath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(newFolderPath, renamedFolderPath);
            await changeFuture;
            // Rename file (same name, different case)
            const caseRenamedFilePath = (0, path_1.join)(testDir, 'deep', 'RenamedFile.txt');
            changeFuture = Promise.all([
                awaitEvent(watcher, renamedFilePath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, caseRenamedFilePath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(renamedFilePath, caseRenamedFilePath);
            await changeFuture;
            renamedFilePath = caseRenamedFilePath;
            // Rename folder (same name, different case)
            const caseRenamedFolderPath = (0, path_1.join)(testDir, 'deep', 'REnamed Folder');
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
            const copiedFilepath = (0, path_1.join)(testDir, 'deep', 'copiedFile.txt');
            changeFuture = awaitEvent(watcher, copiedFilepath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.copyFile(movedFilepath, copiedFilepath);
            await changeFuture;
            // Copy folder
            const copiedFolderpath = (0, path_1.join)(testDir, 'deep', 'Copied Folder');
            changeFuture = awaitEvent(watcher, copiedFolderpath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.copy(movedFolderpath, copiedFolderpath, { preserveSymlinks: false });
            await changeFuture;
            // Change file
            changeFuture = awaitEvent(watcher, copiedFilepath, 0 /* FileChangeType.UPDATED */);
            await pfs_1.Promises.writeFile(copiedFilepath, 'Hello Change');
            await changeFuture;
            // Create new file
            const anotherNewFilePath = (0, path_1.join)(testDir, 'deep', 'anotherNewFile.txt');
            changeFuture = awaitEvent(watcher, anotherNewFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(anotherNewFilePath, 'Hello Another World');
            await changeFuture;
            // Read file does not emit event
            changeFuture = awaitEvent(watcher, anotherNewFilePath, 0 /* FileChangeType.UPDATED */, 'unexpected-event-from-read-file');
            await pfs_1.Promises.readFile(anotherNewFilePath);
            await Promise.race([(0, async_1.timeout)(100), changeFuture]);
            // Stat file does not emit event
            changeFuture = awaitEvent(watcher, anotherNewFilePath, 0 /* FileChangeType.UPDATED */, 'unexpected-event-from-stat');
            await pfs_1.Promises.stat(anotherNewFilePath);
            await Promise.race([(0, async_1.timeout)(100), changeFuture]);
            // Stat folder does not emit event
            changeFuture = awaitEvent(watcher, copiedFolderpath, 0 /* FileChangeType.UPDATED */, 'unexpected-event-from-stat');
            await pfs_1.Promises.stat(copiedFolderpath);
            await Promise.race([(0, async_1.timeout)(100), changeFuture]);
            // Delete file
            changeFuture = awaitEvent(watcher, copiedFilepath, 2 /* FileChangeType.DELETED */);
            await pfs_1.Promises.unlink(copiedFilepath);
            await changeFuture;
            // Delete folder
            changeFuture = awaitEvent(watcher, copiedFolderpath, 2 /* FileChangeType.DELETED */);
            await pfs_1.Promises.rmdir(copiedFolderpath);
            await changeFuture;
        });
        (platform_1.isMacintosh /* this test seems not possible with fsevents backend */ ? test.skip : test)('basics (atomic writes)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }]);
            // Delete + Recreate file
            const newFilePath = (0, path_1.join)(testDir, 'deep', 'conway.js');
            const changeFuture = awaitEvent(watcher, newFilePath, 0 /* FileChangeType.UPDATED */);
            await pfs_1.Promises.unlink(newFilePath);
            pfs_1.Promises.writeFile(newFilePath, 'Hello Atomic World');
            await changeFuture;
        });
        (!platform_1.isLinux /* polling is only used in linux environments (WSL) */ ? test.skip : test)('basics (polling)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], pollingInterval: 100, recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        async function basicCrudTest(filePath, correlationId, expectedCount) {
            // New file
            let changeFuture = awaitEvent(watcher, filePath, 1 /* FileChangeType.ADDED */, undefined, correlationId, expectedCount);
            await pfs_1.Promises.writeFile(filePath, 'Hello World');
            await changeFuture;
            // Change file
            changeFuture = awaitEvent(watcher, filePath, 0 /* FileChangeType.UPDATED */, undefined, correlationId, expectedCount);
            await pfs_1.Promises.writeFile(filePath, 'Hello Change');
            await changeFuture;
            // Delete file
            changeFuture = awaitEvent(watcher, filePath, 2 /* FileChangeType.DELETED */, undefined, correlationId, expectedCount);
            await pfs_1.Promises.unlink(filePath);
            await changeFuture;
        }
        test('multiple events', async function () {
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }]);
            await pfs_1.Promises.mkdir((0, path_1.join)(testDir, 'deep-multiple'));
            // multiple add
            const newFilePath1 = (0, path_1.join)(testDir, 'newFile-1.txt');
            const newFilePath2 = (0, path_1.join)(testDir, 'newFile-2.txt');
            const newFilePath3 = (0, path_1.join)(testDir, 'newFile-3.txt');
            const newFilePath4 = (0, path_1.join)(testDir, 'deep-multiple', 'newFile-1.txt');
            const newFilePath5 = (0, path_1.join)(testDir, 'deep-multiple', 'newFile-2.txt');
            const newFilePath6 = (0, path_1.join)(testDir, 'deep-multiple', 'newFile-3.txt');
            const addedFuture1 = awaitEvent(watcher, newFilePath1, 1 /* FileChangeType.ADDED */);
            const addedFuture2 = awaitEvent(watcher, newFilePath2, 1 /* FileChangeType.ADDED */);
            const addedFuture3 = awaitEvent(watcher, newFilePath3, 1 /* FileChangeType.ADDED */);
            const addedFuture4 = awaitEvent(watcher, newFilePath4, 1 /* FileChangeType.ADDED */);
            const addedFuture5 = awaitEvent(watcher, newFilePath5, 1 /* FileChangeType.ADDED */);
            const addedFuture6 = awaitEvent(watcher, newFilePath6, 1 /* FileChangeType.ADDED */);
            await Promise.all([
                await pfs_1.Promises.writeFile(newFilePath1, 'Hello World 1'),
                await pfs_1.Promises.writeFile(newFilePath2, 'Hello World 2'),
                await pfs_1.Promises.writeFile(newFilePath3, 'Hello World 3'),
                await pfs_1.Promises.writeFile(newFilePath4, 'Hello World 4'),
                await pfs_1.Promises.writeFile(newFilePath5, 'Hello World 5'),
                await pfs_1.Promises.writeFile(newFilePath6, 'Hello World 6')
            ]);
            await Promise.all([addedFuture1, addedFuture2, addedFuture3, addedFuture4, addedFuture5, addedFuture6]);
            // multiple change
            const changeFuture1 = awaitEvent(watcher, newFilePath1, 0 /* FileChangeType.UPDATED */);
            const changeFuture2 = awaitEvent(watcher, newFilePath2, 0 /* FileChangeType.UPDATED */);
            const changeFuture3 = awaitEvent(watcher, newFilePath3, 0 /* FileChangeType.UPDATED */);
            const changeFuture4 = awaitEvent(watcher, newFilePath4, 0 /* FileChangeType.UPDATED */);
            const changeFuture5 = awaitEvent(watcher, newFilePath5, 0 /* FileChangeType.UPDATED */);
            const changeFuture6 = awaitEvent(watcher, newFilePath6, 0 /* FileChangeType.UPDATED */);
            await Promise.all([
                await pfs_1.Promises.writeFile(newFilePath1, 'Hello Update 1'),
                await pfs_1.Promises.writeFile(newFilePath2, 'Hello Update 2'),
                await pfs_1.Promises.writeFile(newFilePath3, 'Hello Update 3'),
                await pfs_1.Promises.writeFile(newFilePath4, 'Hello Update 4'),
                await pfs_1.Promises.writeFile(newFilePath5, 'Hello Update 5'),
                await pfs_1.Promises.writeFile(newFilePath6, 'Hello Update 6')
            ]);
            await Promise.all([changeFuture1, changeFuture2, changeFuture3, changeFuture4, changeFuture5, changeFuture6]);
            // copy with multiple files
            const copyFuture1 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple-copy', 'newFile-1.txt'), 1 /* FileChangeType.ADDED */);
            const copyFuture2 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple-copy', 'newFile-2.txt'), 1 /* FileChangeType.ADDED */);
            const copyFuture3 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple-copy', 'newFile-3.txt'), 1 /* FileChangeType.ADDED */);
            const copyFuture4 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple-copy'), 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.copy((0, path_1.join)(testDir, 'deep-multiple'), (0, path_1.join)(testDir, 'deep-multiple-copy'), { preserveSymlinks: false });
            await Promise.all([copyFuture1, copyFuture2, copyFuture3, copyFuture4]);
            // multiple delete (single files)
            const deleteFuture1 = awaitEvent(watcher, newFilePath1, 2 /* FileChangeType.DELETED */);
            const deleteFuture2 = awaitEvent(watcher, newFilePath2, 2 /* FileChangeType.DELETED */);
            const deleteFuture3 = awaitEvent(watcher, newFilePath3, 2 /* FileChangeType.DELETED */);
            const deleteFuture4 = awaitEvent(watcher, newFilePath4, 2 /* FileChangeType.DELETED */);
            const deleteFuture5 = awaitEvent(watcher, newFilePath5, 2 /* FileChangeType.DELETED */);
            const deleteFuture6 = awaitEvent(watcher, newFilePath6, 2 /* FileChangeType.DELETED */);
            await Promise.all([
                await pfs_1.Promises.unlink(newFilePath1),
                await pfs_1.Promises.unlink(newFilePath2),
                await pfs_1.Promises.unlink(newFilePath3),
                await pfs_1.Promises.unlink(newFilePath4),
                await pfs_1.Promises.unlink(newFilePath5),
                await pfs_1.Promises.unlink(newFilePath6)
            ]);
            await Promise.all([deleteFuture1, deleteFuture2, deleteFuture3, deleteFuture4, deleteFuture5, deleteFuture6]);
            // multiple delete (folder)
            const deleteFolderFuture1 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple'), 2 /* FileChangeType.DELETED */);
            const deleteFolderFuture2 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple-copy'), 2 /* FileChangeType.DELETED */);
            await Promise.all([pfs_1.Promises.rm((0, path_1.join)(testDir, 'deep-multiple'), pfs_1.RimRafMode.UNLINK), pfs_1.Promises.rm((0, path_1.join)(testDir, 'deep-multiple-copy'), pfs_1.RimRafMode.UNLINK)]);
            await Promise.all([deleteFolderFuture1, deleteFolderFuture2]);
        });
        test('subsequent watch updates watchers (path)', async function () {
            await watcher.watch([{ path: testDir, excludes: [(0, path_1.join)((0, fs_1.realpathSync)(testDir), 'unrelated')], recursive: true }]);
            // New file (*.txt)
            let newTextFilePath = (0, path_1.join)(testDir, 'deep', 'newFile.txt');
            let changeFuture = awaitEvent(watcher, newTextFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newTextFilePath, 'Hello World');
            await changeFuture;
            await watcher.watch([{ path: (0, path_1.join)(testDir, 'deep'), excludes: [(0, path_1.join)((0, fs_1.realpathSync)(testDir), 'unrelated')], recursive: true }]);
            newTextFilePath = (0, path_1.join)(testDir, 'deep', 'newFile2.txt');
            changeFuture = awaitEvent(watcher, newTextFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newTextFilePath, 'Hello World');
            await changeFuture;
            await watcher.watch([{ path: (0, path_1.join)(testDir, 'deep'), excludes: [(0, fs_1.realpathSync)(testDir)], recursive: true }]);
            await watcher.watch([{ path: (0, path_1.join)(testDir, 'deep'), excludes: [], recursive: true }]);
            newTextFilePath = (0, path_1.join)(testDir, 'deep', 'newFile3.txt');
            changeFuture = awaitEvent(watcher, newTextFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newTextFilePath, 'Hello World');
            await changeFuture;
        });
        test('invalid path does not crash watcher', async function () {
            await watcher.watch([
                { path: testDir, excludes: [], recursive: true },
                { path: (0, path_1.join)(testDir, 'invalid-folder'), excludes: [], recursive: true },
                { path: network_1.FileAccess.asFileUri('').fsPath, excludes: [], recursive: true }
            ]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        test('subsequent watch updates watchers (excludes)', async function () {
            await watcher.watch([{ path: testDir, excludes: [(0, fs_1.realpathSync)(testDir)], recursive: true }]);
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        test('subsequent watch updates watchers (includes)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: ['nothing'], recursive: true }]);
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        test('includes are supported', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: ['**/deep/**'], recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        test('includes are supported (relative pattern explicit)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: [{ base: testDir, pattern: 'deep/newFile.txt' }], recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        test('includes are supported (relative pattern implicit)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: ['deep/newFile.txt'], recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        test('excludes are supported (path)', async function () {
            return testExcludes([(0, path_1.join)((0, fs_1.realpathSync)(testDir), 'deep')]);
        });
        test('excludes are supported (glob)', function () {
            return testExcludes(['deep/**']);
        });
        async function testExcludes(excludes) {
            await watcher.watch([{ path: testDir, excludes, recursive: true }]);
            // New file (*.txt)
            const newTextFilePath = (0, path_1.join)(testDir, 'deep', 'newFile.txt');
            const changeFuture = awaitEvent(watcher, newTextFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newTextFilePath, 'Hello World');
            const res = await Promise.any([
                (0, async_1.timeout)(500).then(() => true),
                changeFuture.then(() => false)
            ]);
            if (!res) {
                assert.fail('Unexpected change event');
            }
        }
        (platform_1.isWindows /* windows: cannot create file symbolic link without elevated context */ ? test.skip : test)('symlink support (root)', async function () {
            const link = (0, path_1.join)(testDir, 'deep-linked');
            const linkTarget = (0, path_1.join)(testDir, 'deep');
            await pfs_1.Promises.symlink(linkTarget, link);
            await watcher.watch([{ path: link, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(link, 'newFile.txt'));
        });
        (platform_1.isWindows /* windows: cannot create file symbolic link without elevated context */ ? test.skip : test)('symlink support (via extra watch)', async function () {
            const link = (0, path_1.join)(testDir, 'deep-linked');
            const linkTarget = (0, path_1.join)(testDir, 'deep');
            await pfs_1.Promises.symlink(linkTarget, link);
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }, { path: link, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(link, 'newFile.txt'));
        });
        (!platform_1.isWindows /* UNC is windows only */ ? test.skip : test)('unc support', async function () {
            (0, unc_1.addUNCHostToAllowlist)('localhost');
            // Local UNC paths are in the form of: \\localhost\c$\my_dir
            const uncPath = `\\\\localhost\\${(0, extpath_1.getDriveLetter)(testDir)?.toLowerCase()}$\\${(0, strings_1.ltrim)(testDir.substr(testDir.indexOf(':') + 1), '\\')}`;
            await watcher.watch([{ path: uncPath, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(uncPath, 'deep', 'newFile.txt'));
        });
        (platform_1.isLinux /* linux: is case sensitive */ ? test.skip : test)('wrong casing', async function () {
            const deepWrongCasedPath = (0, path_1.join)(testDir, 'DEEP');
            await watcher.watch([{ path: deepWrongCasedPath, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(deepWrongCasedPath, 'newFile.txt'));
        });
        test('invalid folder does not explode', async function () {
            const invalidPath = (0, path_1.join)(testDir, 'invalid');
            await watcher.watch([{ path: invalidPath, excludes: [], recursive: true }]);
        });
        (platform_1.isWindows /* flaky on windows */ ? test.skip : test)('deleting watched path without correlation restarts watching', async function () {
            const watchedPath = (0, path_1.join)(testDir, 'deep');
            await watcher.watch([{ path: watchedPath, excludes: [], recursive: true }]);
            // Delete watched path and await
            const warnFuture = awaitMessage(watcher, 'warn');
            await pfs_1.Promises.rm(watchedPath, pfs_1.RimRafMode.UNLINK);
            await warnFuture;
            // Restore watched path
            await (0, async_1.timeout)(1500); // node.js watcher used for monitoring folder restore is async
            await pfs_1.Promises.mkdir(watchedPath);
            await (0, async_1.timeout)(1500); // restart is delayed
            await watcher.whenReady();
            // Verify events come in again
            const newFilePath = (0, path_1.join)(watchedPath, 'newFile.txt');
            const changeFuture = awaitEvent(watcher, newFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newFilePath, 'Hello World');
            await changeFuture;
        });
        test('correlationId is supported', async function () {
            const correlationId = Math.random();
            await watcher.watch([{ correlationId, path: testDir, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'newFile.txt'), correlationId);
        });
        test('should not exclude roots that do not overlap', () => {
            if (platform_1.isWindows) {
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['C:\\a']), ['C:\\a']);
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['C:\\a', 'C:\\b']), ['C:\\a', 'C:\\b']);
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['C:\\a', 'C:\\b', 'C:\\c\\d\\e']), ['C:\\a', 'C:\\b', 'C:\\c\\d\\e']);
            }
            else {
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['/a']), ['/a']);
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['/a', '/b']), ['/a', '/b']);
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['/a', '/b', '/c/d/e']), ['/a', '/b', '/c/d/e']);
            }
        });
        test('should remove sub-folders of other paths', () => {
            if (platform_1.isWindows) {
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['C:\\a', 'C:\\a\\b']), ['C:\\a']);
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['C:\\a', 'C:\\b', 'C:\\a\\b']), ['C:\\a', 'C:\\b']);
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['C:\\b\\a', 'C:\\a', 'C:\\b', 'C:\\a\\b']), ['C:\\a', 'C:\\b']);
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['C:\\a', 'C:\\a\\b', 'C:\\a\\c\\d']), ['C:\\a']);
            }
            else {
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['/a', '/a/b']), ['/a']);
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['/a', '/b', '/a/b']), ['/a', '/b']);
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['/b/a', '/a', '/b', '/a/b']), ['/a', '/b']);
                assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['/a', '/a/b', '/a/c/d']), ['/a']);
            }
        });
        test('should ignore when everything excluded', () => {
            assert.deepStrictEqual(watcher.testRemoveDuplicateRequests(['/foo/bar', '/bar'], ['**', 'something']), []);
        });
        test('watching same or overlapping paths supported when correlation is applied', async () => {
            await watcher.watch([
                { path: testDir, excludes: [], recursive: true, correlationId: 1 }
            ]);
            await basicCrudTest((0, path_1.join)(testDir, 'newFile.txt'), null, 1);
            // same path, same options
            await watcher.watch([
                { path: testDir, excludes: [], recursive: true, correlationId: 1 },
                { path: testDir, excludes: [], recursive: true, correlationId: 2, },
                { path: testDir, excludes: [], recursive: true, correlationId: undefined }
            ]);
            await basicCrudTest((0, path_1.join)(testDir, 'newFile.txt'), null, 3);
            await basicCrudTest((0, path_1.join)(testDir, 'otherNewFile.txt'), null, 3);
            // same path, different options
            await watcher.watch([
                { path: testDir, excludes: [], recursive: true, correlationId: 1 },
                { path: testDir, excludes: [], recursive: true, correlationId: 2 },
                { path: testDir, excludes: [], recursive: true, correlationId: undefined },
                { path: testDir, excludes: [(0, path_1.join)((0, fs_1.realpathSync)(testDir), 'deep')], recursive: true, correlationId: 3 },
                { path: testDir, excludes: [(0, path_1.join)((0, fs_1.realpathSync)(testDir), 'other')], recursive: true, correlationId: 4 },
            ]);
            await basicCrudTest((0, path_1.join)(testDir, 'newFile.txt'), null, 5);
            await basicCrudTest((0, path_1.join)(testDir, 'otherNewFile.txt'), null, 5);
            // overlapping paths (same options)
            await watcher.watch([
                { path: (0, path_1.dirname)(testDir), excludes: [], recursive: true, correlationId: 1 },
                { path: testDir, excludes: [], recursive: true, correlationId: 2 },
                { path: (0, path_1.join)(testDir, 'deep'), excludes: [], recursive: true, correlationId: 3 },
            ]);
            await basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'), null, 3);
            await basicCrudTest((0, path_1.join)(testDir, 'deep', 'otherNewFile.txt'), null, 3);
            // overlapping paths (different options)
            await watcher.watch([
                { path: (0, path_1.dirname)(testDir), excludes: [], recursive: true, correlationId: 1 },
                { path: testDir, excludes: [(0, path_1.join)((0, fs_1.realpathSync)(testDir), 'some')], recursive: true, correlationId: 2 },
                { path: (0, path_1.join)(testDir, 'deep'), excludes: [(0, path_1.join)((0, fs_1.realpathSync)(testDir), 'other')], recursive: true, correlationId: 3 },
            ]);
            await basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'), null, 3);
            await basicCrudTest((0, path_1.join)(testDir, 'deep', 'otherNewFile.txt'), null, 3);
        });
        test('watching missing path emits watcher fail event', async function () {
            const onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            const folderPath = (0, path_1.join)(testDir, 'missing');
            watcher.watch([{ path: folderPath, excludes: [], recursive: true }]);
            await onDidWatchFail;
        });
        test('deleting watched path emits watcher fail and delete event if correlated', async function () {
            const folderPath = (0, path_1.join)(testDir, 'deep');
            await watcher.watch([{ path: folderPath, excludes: [], recursive: true, correlationId: 1 }]);
            const onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            const changeFuture = awaitEvent(watcher, folderPath, 2 /* FileChangeType.DELETED */, undefined, 1);
            pfs_1.Promises.rm(folderPath, pfs_1.RimRafMode.UNLINK);
            await onDidWatchFail;
            await changeFuture;
        });
        test('correlated watch requests support suspend/resume (folder, does not exist in beginning)', async () => {
            let onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            const folderPath = (0, path_1.join)(testDir, 'not-found');
            await watcher.watch([{ path: folderPath, excludes: [], recursive: true, correlationId: 1 }]);
            await onDidWatchFail;
            let changeFuture = awaitEvent(watcher, folderPath, 1 /* FileChangeType.ADDED */, undefined, 1);
            let onDidWatch = event_1.Event.toPromise(watcher.onDidWatch);
            await pfs_1.Promises.mkdir(folderPath);
            await changeFuture;
            await onDidWatch;
            const filePath = (0, path_1.join)(folderPath, 'newFile.txt');
            await basicCrudTest(filePath, 1);
            onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            await pfs_1.Promises.rm(folderPath);
            await onDidWatchFail;
            changeFuture = awaitEvent(watcher, folderPath, 1 /* FileChangeType.ADDED */, undefined, 1);
            onDidWatch = event_1.Event.toPromise(watcher.onDidWatch);
            await pfs_1.Promises.mkdir(folderPath);
            await changeFuture;
            await onDidWatch;
            await basicCrudTest(filePath, 1);
        });
        test('correlated watch requests support suspend/resume (folder, exist in beginning)', async () => {
            const folderPath = (0, path_1.join)(testDir, 'deep');
            await watcher.watch([{ path: folderPath, excludes: [], recursive: true, correlationId: 1 }]);
            const filePath = (0, path_1.join)(folderPath, 'newFile.txt');
            await basicCrudTest(filePath, 1);
            const onDidWatchFail = event_1.Event.toPromise(watcher.onWatchFail);
            await pfs_1.Promises.rm(folderPath);
            await onDidWatchFail;
            const changeFuture = awaitEvent(watcher, folderPath, 1 /* FileChangeType.ADDED */, undefined, 1);
            const onDidWatch = event_1.Event.toPromise(watcher.onDidWatch);
            await pfs_1.Promises.mkdir(folderPath);
            await changeFuture;
            await onDidWatch;
            await basicCrudTest(filePath, 1);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyY2VsV2F0Y2hlci5pbnRlZ3JhdGlvblRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL3Rlc3Qvbm9kZS9wYXJjZWxXYXRjaGVyLmludGVncmF0aW9uVGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsMkRBQTJEO0lBQzNELDBEQUEwRDtJQUMxRCw2REFBNkQ7SUFDN0QsMENBQTBDO0lBRTFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxzQkFBVSxDQUFDLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBRW5ILE1BQU0saUJBQWtCLFNBQVEsNkJBQWE7WUFBN0M7O2dCQUU2Qix5Q0FBb0MsR0FBRyxHQUFHLENBQUM7Z0JBRXRELGdCQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7Z0JBQzFELGVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztnQkFFcEMsZ0JBQVcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQztZQXdCbkQsQ0FBQztZQXRCQSwyQkFBMkIsQ0FBQyxLQUFlLEVBQUUsV0FBcUIsRUFBRTtnQkFFbkUsaURBQWlEO2dCQUNqRCxNQUFNLFFBQVEsR0FBNkIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDM0QsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUM1QyxDQUFDLENBQUMsQ0FBQztnQkFF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